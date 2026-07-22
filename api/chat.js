// Vercel-style serverless function: POST /api/chat
// This is the AGENT: it decides, turn by turn, whether it needs more
// information or is ready to build the page. When ready, it calls a tool
// (function) with structured content — it never writes HTML/CSS itself.
// A hand-built template (see templates.js) turns that content into the
// actual page. This keeps output reliable and consistently well-designed.
//
// Set DEEPSEEK_API_KEY in your hosting environment. Get one at
// https://platform.deepseek.com
//
// Optionally set UNSPLASH_ACCESS_KEY (from a Developer App at
// https://unsplash.com/oauth/applications) to use real stock photos instead
// of the placeholder panels — see unsplash.js. Fully optional: without it,
// every photo spot just falls back to its placeholder.

const { renderTemplate } = require('./_templates');
const { checkRateLimit } = require('./_rateLimit');
const { fetchPhoto, searchPhotos } = require('./_unsplash');

const VALID_STYLES = [
  'warm',
  'bold',
  'minimal',
  'modern-corporate',
  'luxury',
  'friendly',
  'bold-vibrant',
  'editorial',
  'playful',
  'industrial'
];

// "Conversion goal" is a separate axis from visual style: it's not about how
// the page looks, it's about how it sells — which single action the whole
// page is built to drive, and therefore how the CTA is phrased and which
// goal-specific section (if any) the page needs. Always auto-inferred by
// the agent from the conversation — unlike style, there's no visitor-facing
// picker for this, since the right goal is usually obvious from the
// business itself rather than a matter of taste.
const CONVERSION_GOALS = [
  'lead-generation',
  'appointment-booking',
  'product-sales',
  'event-registration',
  'restaurant',
  'portfolio',
  'local-service',
  'saas',
  'mobile-app',
  'personal-brand'
];

// Hard cap on conversation length. Most businesses can be captured in
// 3-5 exchanges — 10 user turns is a generous ceiling that still stops a
// runaway or abusive conversation from calling the paid API indefinitely.
const MAX_USER_TURNS = 10;

const SYSTEM_PROMPT = `You are Weboost's landing page building agent. Converse with the user
entirely in Hebrew, in natural, friendly, professional Hebrew — never in English. Interview
the user about their business with short, specific questions — one or two per turn. You need,
by the end: what they do, who it's for, what makes them different, how they actually work with
a customer (roughly — first they reach out, then what happens), any questions a first-time
visitor would likely have, their single most important call to action (contact, book, buy), and
how visitors should actually reach them (email, phone, or booking link). Keep the conversation
efficient — most businesses can be captured in 3-5 exchanges.

Once you have enough, call the generate_landing_page tool. Do not describe the page in plain
text — call the tool. Pick the "style" that best fits the business's personality; don't default
to the same one every time. Write real, specific copy grounded in what the user told you, in
Hebrew — never generic placeholder text, and never English, in any tool argument.

Also pick a "conversionGoal" — this is separate from "style" and describes how the page sells,
not how it looks:
- lead-generation: contact form / call / WhatsApp (lawyers, dentists, electricians, most local
  professionals when nothing more specific fits)
- appointment-booking: schedule a meeting or consultation (doctors, coaches, therapists, salons)
- product-sales: buy now (ecommerce, digital products, anything sold directly online)
- event-registration: register for an event (conferences, webinars, workshops, classes)
- restaurant: reserve a table or order food
- portfolio: showcase work, get hired (designers, photographers, artists, freelance creatives)
- local-service: request a quote (plumbing, cleaning, roofing, contractors, home services)
- saas: start a free trial (software products, web apps)
- mobile-app: download the app (consumer mobile apps)
- personal-brand: subscribe, book, or contact (influencers, speakers, authors, consultants
  building a personal following)
Phrase "ctaText" to match the chosen goal in natural Hebrew — e.g. "קנו עכשיו" for product-sales,
"קבעו תור" for appointment-booking, "בקשו הצעת מחיר" for local-service, "הירשמו עכשיו" for
event-registration, "הזמינו שולחן" for restaurant, "התחילו ניסיון חינם" for saas, "הורידו את
האפליקציה" for mobile-app — don't default to a generic "צרו קשר" when a more specific verb fits
the goal better.

For "problem" and "solution": describe, in 1-2 sentences each, the actual problem this
business's customers usually face and how this specific business solves it. Ground both in what
the user told you about their customers and their approach — never invent a generic pain point
just to fill the field. If it's not clear from the conversation, ask one short question rather
than guessing.

Only fill "eventDetails" when conversionGoal is event-registration and the user gave you a real
date/time/location — never invent one. Only fill "pricingTiers" when conversionGoal is saas and
the user gave you real plans/prices — never invent pricing. Only fill "appLinks" when
conversionGoal is mobile-app and the user gave you a real store link for at least one platform.
Leave these fields out entirely otherwise.

For "process" and "faq": only state things the user actually told you or that are safely
generic (e.g. "how do I get started" -> point at the contact method). Never invent specific
facts you don't have — no made-up prices, guarantees, certifications, or years of experience.
If you don't have enough for a good process/faq section, ask one more short question rather
than fabricating detail.

For "featured": ask what 2-4 things they'd most want a visitor to see highlighted — specific
dishes for a restaurant, specific packages/services for anything else. Ground these in what
the user actually offers; if they haven't mentioned specifics, ask rather than invent menu
items or service names.

For "testimonials": NEVER invent a customer quote or a customer's name. Only include this if
the user actually shares a real quote from a real customer during the conversation (you may
ask once, lightly, whether they have one to share). If they don't have one, omit the
"testimonials" field entirely — do not fabricate one to fill the section.

The four "...ImageQuery" fields are the one exception to "always Hebrew" — they're never shown
to the visitor, only used internally to search stock photography, so they must be in English.
Keep them short and concrete (3-6 words) and grounded in what the business actually is, e.g.
"handmade pasta italian restaurant" rather than something generic like "delicious food".`;

const TOOL = {
  type: 'function',
  function: {
    name: 'generate_landing_page',
    description: 'Generate the landing page once enough information has been gathered.',
    parameters: {
      type: 'object',
      properties: {
        style: {
          type: 'string',
          enum: VALID_STYLES,
          description:
            'warm = cream/serif, best for personal services & hospitality (photographers, therapists, small cafes). bold = dark/acid-green high-contrast, best for tech & agencies. minimal = editorial/hairline-rule, best for consulting & professional services. modern-corporate = navy/blue structured trust-focused, best for lawyers, accountants, finance. luxury = dark/gold/elegant serif, best for jewelry, luxury real estate, premium salons. friendly = rounded/soft-colored/approachable, best for healthcare, education, childcare. bold-vibrant = bright multi-color/high-energy/neo-brutalist, best for startups, gyms, marketing agencies. editorial = magazine-style/storytelling/serif, best for personal brands, writers, photographers. playful = illustrated/rotated-stickers/multi-hue, best for kids, entertainment, creative businesses. industrial = strong sharp-cornered typography/steel-amber, best for construction, manufacturing, trades.'
        },
        conversionGoal: {
          type: 'string',
          enum: CONVERSION_GOALS,
          description:
            'How the page sells, separate from its visual style. lead-generation = contact form/call/WhatsApp, for lawyers/dentists/electricians/most local professionals. appointment-booking = schedule a meeting, for doctors/coaches/therapists/salons. product-sales = buy now, for ecommerce/digital products. event-registration = register, for conferences/webinars/classes. restaurant = reserve a table or order food. portfolio = showcase work and get hired, for designers/photographers/creatives. local-service = request a quote, for plumbing/cleaning/roofing/home services. saas = start a free trial, for software products. mobile-app = download the app. personal-brand = subscribe/book/contact, for influencers/speakers/consultants building a following.'
        },
        problem: {
          type: 'string',
          description:
            '1-2 sentences describing the problem this business\'s customers usually face before finding them. Grounded in what the user actually said — never a generic pain point.'
        },
        solution: {
          type: 'string',
          description:
            '1-2 sentences describing how this specific business solves that problem. Grounded in what the user actually said about their approach.'
        },
        businessName: { type: 'string' },
        headline: { type: 'string', description: 'The main hero headline, specific to this business.' },
        subheadline: { type: 'string', description: 'One or two sentences expanding the headline.' },
        about: {
          type: 'string',
          description:
            '2-3 sentences telling the visitor more about the business — its story, experience, or approach. Goes beyond the subheadline; grounded in what the user actually said.'
        },
        heroImageQuery: {
          type: 'string',
          description: 'English-only. 3-6 words to search stock photography for the hero photo — the single most visually representative shot of this business.'
        },
        aboutImageQuery: {
          type: 'string',
          description: 'English-only. 3-6 words to search stock photography for a photo pairing with the About text — ambiance/space/craft, not a repeat of the hero shot.'
        },
        galleryImageQuery: {
          type: 'string',
          description: 'English-only. 3-6 words to search stock photography for a set of varied gallery photos representative of this business.'
        },
        valueProps: {
          type: 'array',
          minItems: 2,
          maxItems: 4,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              body: { type: 'string' }
            },
            required: ['title', 'body']
          }
        },
        process: {
          type: 'array',
          minItems: 3,
          maxItems: 4,
          description:
            'Numbered steps for "how it works" — how a visitor actually becomes a customer, e.g. reach out -> we discuss your needs -> we deliver.',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Short step label, a few words.' },
              body: { type: 'string', description: 'One sentence expanding the step.' }
            },
            required: ['title', 'body']
          }
        },
        faq: {
          type: 'array',
          minItems: 2,
          maxItems: 4,
          description:
            'Common questions a first-time visitor to this specific business would have, with short factual answers grounded in what the user told you.',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              answer: { type: 'string' }
            },
            required: ['question', 'answer']
          }
        },
        featured: {
          type: 'array',
          minItems: 2,
          maxItems: 4,
          description:
            'Highlighted items: specific dishes for a restaurant, specific packages/services otherwise. Grounded in what the user actually offers.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string', description: 'One short sentence.' },
              price: { type: 'string', description: 'Optional. Only include if the user gave you a real price.' },
              imageQuery: { type: 'string', description: 'English-only. 3-6 words to search stock photography for this specific item.' }
            },
            required: ['name', 'description', 'imageQuery']
          }
        },
        testimonials: {
          type: 'array',
          minItems: 1,
          maxItems: 2,
          description:
            'OPTIONAL. Only include if the user shared an actual quote from a real customer. Never invent one — omit this field entirely if none was given.',
          items: {
            type: 'object',
            properties: {
              quote: { type: 'string' },
              author: { type: 'string', description: 'First name or role the user gave you, e.g. "דנה" or "לקוחה קבועה".' }
            },
            required: ['quote', 'author']
          }
        },
        eventDetails: {
          type: 'object',
          description:
            'ONLY when conversionGoal is event-registration and the user gave you real details — never invent. Omit entirely otherwise.',
          properties: {
            date: { type: 'string', description: 'e.g. "12 בינואר 2027".' },
            time: { type: 'string', description: 'e.g. "18:00".' },
            location: { type: 'string' }
          }
        },
        pricingTiers: {
          type: 'array',
          minItems: 1,
          maxItems: 3,
          description:
            'ONLY when conversionGoal is saas and the user gave you real plans/prices — never invent pricing. Omit entirely otherwise.',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Plan name, e.g. "בסיסי".' },
              price: { type: 'string', description: 'e.g. "99 ש"ח".' },
              period: { type: 'string', description: 'Optional, e.g. "חודש".' },
              features: {
                type: 'array',
                items: { type: 'string' },
                description: 'Short bullet points, grounded in what the user told you.'
              },
              highlighted: { type: 'boolean', description: 'True for the plan to visually highlight as recommended, if any.' }
            },
            required: ['name', 'price']
          }
        },
        appLinks: {
          type: 'object',
          description:
            'ONLY when conversionGoal is mobile-app and the user gave you a real store link for at least one platform. Omit entirely otherwise.',
          properties: {
            appStoreUrl: { type: 'string' },
            playStoreUrl: { type: 'string' }
          }
        },
        ctaHeadline: { type: 'string', description: 'Short line introducing the contact action.' },
        ctaText: { type: 'string', description: 'The button label, phrased for the conversionGoal — e.g. "קנו עכשיו" for product-sales, "קבעו תור" for appointment-booking.' },
        ctaLink: { type: 'string', description: 'mailto:, tel:, or booking URL the user gave you.' }
      },
      required: [
        'style',
        'conversionGoal',
        'problem',
        'solution',
        'businessName',
        'headline',
        'subheadline',
        'about',
        'heroImageQuery',
        'aboutImageQuery',
        'galleryImageQuery',
        'valueProps',
        'process',
        'faq',
        'featured',
        'ctaHeadline',
        'ctaText',
        'ctaLink'
      ]
    }
  }
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'DEEPSEEK_API_KEY is not configured on the server.' });
    return;
  }

  const { messages, preferredStyle } = req.body || {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Request body must include a messages array.' });
    return;
  }

  // If the visitor picked a style explicitly in the UI, it overrides the
  // agent's own judgment — some business owners want to be different from
  // what the "obvious" style for their industry would be.
  const stylePreference = VALID_STYLES.includes(preferredStyle) ? preferredStyle : null;

  // --- Rate limit: caps requests per IP per time window. ---
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown';
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    res.status(429).json({
      reply: 'הגעתם למגבלת הבקשות לעכשיו — נסו שוב בעוד כמה דקות.',
      page_html: null,
      limit_reached: true
    });
    return;
  }

  // --- Turn cap: stops one conversation from running indefinitely. ---
  const userTurns = messages.filter((m) => m.role === 'user').length;
  if (userTurns > MAX_USER_TURNS) {
    res.status(200).json({
      reply:
        'עברנו על הרבה פרטים — כדי לשמור על השיחה קצרה וזולה להפעלה, נעצור כאן. רעננו את הדף כדי להתחיל שיחה חדשה.',
      page_html: null,
      limit_reached: true
    });
    return;
  }

  const systemPromptForRequest = stylePreference
    ? `${SYSTEM_PROMPT}\n\nThe visitor explicitly picked the "${stylePreference}" visual style from a picker in the UI — always set "style": "${stylePreference}" in the tool call regardless of what you'd otherwise guess from the business type.`
    : SYSTEM_PROMPT;

  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: 2048,
        tools: [TOOL],
        tool_choice: 'auto',
        messages: [
          { role: 'system', content: systemPromptForRequest },
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ]
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      res.status(upstream.status).json({ error: `DeepSeek API error: ${errText}` });
      return;
    }

    const data = await upstream.json();
    const message = data.choices?.[0]?.message || {};
    const toolCall = message.tool_calls?.[0];

    // No tool call yet — the agent is still gathering information.
    if (!toolCall) {
      res.status(200).json({
        reply: message.content || 'ספרו לי עוד קצת על העסק.',
        page_html: null
      });
      return;
    }

    // Tool call present — parse its arguments and render the real template.
    let content;
    try {
      content = JSON.parse(toolCall.function.arguments);
    } catch (err) {
      res.status(200).json({
        reply:
          'היו לי כל הפרטים אך יצרתי אותם בפורמט שלא הצלחתי לפענח — תוכלו לחזור על החלק האחרון?',
        page_html: null
      });
      return;
    }

    // Deterministic override — don't rely on the model having followed the
    // system-prompt instruction above. If the visitor picked a style, that
    // choice wins no matter what the tool call actually contains.
    if (stylePreference) {
      content.style = stylePreference;
    }

    // Fetch real stock photos in parallel (Unsplash). Every call fails soft
    // (returns null/[]) if UNSPLASH_ACCESS_KEY isn't configured or a search
    // comes up empty, so the template's placeholder UI is always a safe
    // fallback — this never blocks or breaks page generation.
    const featuredList = Array.isArray(content.featured) ? content.featured : [];
    const [heroPhoto, aboutPhoto, galleryPhotos, featuredPhotos] = await Promise.all([
      fetchPhoto(content.heroImageQuery),
      fetchPhoto(content.aboutImageQuery),
      searchPhotos(content.galleryImageQuery, 6),
      Promise.all(featuredList.map((f) => fetchPhoto(f.imageQuery)))
    ]);

    content.heroPhoto = heroPhoto;
    content.aboutPhoto = aboutPhoto;
    content.galleryPhotos = galleryPhotos;
    content.featured = featuredList.map((f, i) => ({ ...f, photo: featuredPhotos[i] || null }));

    const pageHtml = renderTemplate(content.style, content);

    res.status(200).json({
      reply:
        message.content ||
        `הנה דף הנחיתה שלכם — בסגנון ${content.style} שנבנה סביב "${content.headline}". ספרו לי אם תרצו לשנות משהו.`,
      page_html: pageHtml
    });
  } catch (err) {
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
};
