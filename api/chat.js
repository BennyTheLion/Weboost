// Vercel-style serverless function: POST /api/chat
// This is the AGENT: it decides, turn by turn, whether it needs more
// information or is ready to build the page. When ready, it calls a tool
// (function) with structured content — it never writes HTML/CSS itself.
// A hand-built template (see templates.js) turns that content into the
// actual page. This keeps output reliable and consistently well-designed.
//
// Set DEEPSEEK_API_KEY in your hosting environment. Get one at
// https://platform.deepseek.com

const { renderTemplate } = require('./templates');
const { checkRateLimit } = require('./rateLimit');

// Hard cap on conversation length. Most businesses can be captured in
// 2-4 exchanges — 8 user turns is a generous ceiling that still stops a
// runaway or abusive conversation from calling the paid API indefinitely.
const MAX_USER_TURNS = 8;

const SYSTEM_PROMPT = `You are Weboost's landing page building agent. Converse with the user
entirely in Hebrew, in natural, friendly, professional Hebrew — never in English. Interview
the user about their business with short, specific questions — one or two per turn. You need,
by the end: what they do, who it's for, what makes them different, their single most important
call to action (contact, book, buy), and how visitors should actually reach them (email, phone,
or booking link). Keep the conversation brief — most businesses can be captured in 2-4 exchanges.

Once you have enough, call the generate_landing_page tool. Do not describe the page in plain
text — call the tool. Pick the "style" that best fits the business's personality; don't default
to the same one every time. Write real, specific copy grounded in what the user told you, in
Hebrew — never generic placeholder text, and never English, in any tool argument.`;

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
          enum: ['warm', 'bold', 'minimal'],
          description:
            'warm = cream/serif, best for personal services & hospitality. bold = dark/high-contrast, best for tech & agencies. minimal = editorial/hairline-rule, best for consulting & professional services.'
        },
        businessName: { type: 'string' },
        headline: { type: 'string', description: 'The main hero headline, specific to this business.' },
        subheadline: { type: 'string', description: 'One or two sentences expanding the headline.' },
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
        ctaHeadline: { type: 'string', description: 'Short line introducing the contact action.' },
        ctaText: { type: 'string', description: 'The button label, e.g. "Email us" or "Book a call".' },
        ctaLink: { type: 'string', description: 'mailto:, tel:, or booking URL the user gave you.' }
      },
      required: ['style', 'businessName', 'headline', 'subheadline', 'valueProps', 'ctaHeadline', 'ctaText', 'ctaLink']
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

  const { messages } = req.body || {};
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: 'Request body must include a messages array.' });
    return;
  }

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
          { role: 'system', content: SYSTEM_PROMPT },
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
