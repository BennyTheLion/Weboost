// Three distinct, hand-tuned landing page templates — RTL Hebrew.
// The agent only ever supplies CONTENT (headline, copy, CTA) — never markup
// or CSS. This is what makes output reliable and consistently well-designed,
// instead of depending on the model to freehand a whole page's styling.
//
// All three set lang="he" dir="rtl" and use Hebrew-supporting web fonts
// (the original Latin-only fonts — Fraunces, Space Grotesk, IBM Plex Mono —
// have no Hebrew glyphs and would fall back to an ugly default). Layout
// uses CSS logical properties so it mirrors correctly under RTL without a
// separate stylesheet.

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function valuePropsHtml(items = [], renderItem) {
  return items.map((item, i) => renderItem(item, i)).join('\n');
}

// Shared, brand-neutral inline icons (stroke=currentColor so templates can
// theme them). Kept simple/generic on purpose — not brand logos.
const ICONS = {
  gallery:
    '<svg viewBox="0 0 48 48" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="8" width="40" height="32" rx="3"/><circle cx="16" cy="18" r="3.2"/><path d="M6 34l10-10 8 8 6-6 12 12"/></svg>',
  phone:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6 3h3l2 5-2.5 1.5a11 11 0 005 5L15 12l5 2v3a2 2 0 01-2 2A16 16 0 014 6a2 2 0 012-3z"/></svg>',
  whatsapp:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.7-1.2A9 9 0 1012 3z"/><path d="M8.5 9.5c.5 3 2.5 5 5.5 5.5"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none"/></svg>',
  facebook:
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M14 8.2h-1.3c-.7 0-1.2.5-1.2 1.3v1.5H14l-.3 2h-2.2V19h-2v-6h-1.5v-2H9.5V9.3C9.5 7.6 10.6 6.4 12.3 6.4H14v1.8z" fill="currentColor" stroke="none"/></svg>',
  calendar:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
  clock:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  pin:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 21s7-6.5 7-12a7 7 0 00-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="9" r="2.3"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"/></svg>',
  check:
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12l5 5L20 6"/></svg>'
};

// Renders a photo slot: a real <img> with required Unsplash attribution if
// `photo` was found, otherwise the same dashed placeholder used everywhere
// else. `extraClass` carries the slot's sizing (hero__photo, dish-thumb,
// etc.) so both branches size identically.
function photoBlock(photo, extraClass, altFallback) {
  if (photo && photo.url) {
    return `<div class="photo-real ${extraClass}">
      <img src="${escapeHtml(photo.url)}" alt="${escapeHtml(photo.alt || altFallback || '')}" loading="lazy">
      <a class="photo-credit" href="${escapeHtml(photo.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(photo.photographerName)} / Unsplash</a>
    </div>`;
  }
  return `<div class="photo-placeholder ${extraClass}">${ICONS.gallery}<span>תמונה תתווסף כאן</span></div>`;
}

// Given a ctaLink, returns { telHref, waHref } — waHref is derived from an
// Israeli-format tel: link (0XX-XXXXXXX -> 972XXXXXXXXX). Both are null if
// the link isn't a phone number, so the template can fall back to a
// placeholder rather than a broken/guessed link.
function contactLinksFrom(ctaLink) {
  if (typeof ctaLink !== 'string' || !ctaLink.startsWith('tel:')) {
    return { telHref: null, waHref: null };
  }
  const digits = ctaLink.replace('tel:', '').replace(/\D/g, '');
  if (!digits) return { telHref: null, waHref: null };
  const intl = digits.startsWith('0') ? `972${digits.slice(1)}` : digits;
  return { telHref: ctaLink, waHref: `https://wa.me/${intl}` };
}

// Shapes the parts of the content object that render identically across all
// three styles (only their CSS differs, via shared class names each template
// themes on its own) — gallery grid, testimonials-or-placeholder, contact
// icons, and the WhatsApp CTA button. Keeps that logic in one place instead
// of tripled across warm/bold/minimal.
function buildShared(c) {
  const { telHref, waHref } = contactLinksFrom(c.ctaLink);

  const galleryPhotos = Array.isArray(c.galleryPhotos) ? c.galleryPhotos : [];
  const galleryHtml = Array.from({ length: 6 }, (_, i) => photoBlock(galleryPhotos[i], 'gallery-tile', 'gallery')).join('\n');
  const galleryIsComplete = galleryPhotos.length >= 6;

  const testimonials = Array.isArray(c.testimonials) ? c.testimonials.filter((t) => t && t.quote) : [];
  const testimonialsHtml = testimonials.length
    ? testimonials
        .map(
          (t) =>
            `<div class="card testimonial"><p>&ldquo;${escapeHtml(t.quote)}&rdquo;</p><span class="testimonial__author">${escapeHtml(t.author)}</span></div>`
        )
        .join('\n')
    : `<div class="card testimonial testimonial--placeholder"><p>מקום לחוות דעת של לקוח מרוצה.</p><span class="testimonial__author">יתווסף בהמשך</span></div>
       <div class="card testimonial testimonial--placeholder"><p>עוד לקוח ישתף כאן את החוויה שלו.</p><span class="testimonial__author">יתווסף בהמשך</span></div>`;

  const phoneIcon = telHref
    ? `<a class="social-icon" href="${escapeHtml(telHref)}" aria-label="התקשרו">${ICONS.phone}</a>`
    : `<span class="social-icon social-icon--placeholder" aria-label="טלפון">${ICONS.phone}</span>`;
  const waIcon = waHref
    ? `<a class="social-icon" href="${escapeHtml(waHref)}" target="_blank" rel="noopener">${ICONS.whatsapp}</a>`
    : `<span class="social-icon social-icon--placeholder" aria-label="וואטסאפ">${ICONS.whatsapp}</span>`;
  const instaIcon = `<span class="social-icon social-icon--placeholder" aria-label="אינסטגרם">${ICONS.instagram}</span>`;
  const fbIcon = `<span class="social-icon social-icon--placeholder" aria-label="פייסבוק">${ICONS.facebook}</span>`;

  const waCtaButton = waHref
    ? `<a class="btn btn--ghost-on-dark" href="${escapeHtml(waHref)}" target="_blank" rel="noopener">${ICONS.whatsapp} וואטסאפ</a>`
    : '';

  return { telHref, waHref, galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton };
}

// ---------------------------------------------------------------
// Goal-specific optional blocks — for conversionGoal values whose content
// doesn't fit the shape every other goal already shares (a service list +
// a single CTA). Each returns '' when its data isn't present, so every
// template can call these unconditionally rather than branching on
// conversionGoal itself; the data (set by chat.js only for the relevant
// goal) drives whether anything renders. They deliberately reuse classes
// every template already themes for other purposes (.badge, .featured-grid/
// .featured-card, .btn--ghost-on-dark) instead of introducing new
// per-template CSS — an unused class name is harmless, so the same call
// works everywhere without a bespoke design pass per style.
// ---------------------------------------------------------------

function eventDetailsHtml(c) {
  const e = c.eventDetails;
  if (!e || !(e.date || e.time || e.location)) return '';
  const chips = [
    e.date ? `<span class="badge">${ICONS.calendar}${escapeHtml(e.date)}</span>` : '',
    e.time ? `<span class="badge">${ICONS.clock}${escapeHtml(e.time)}</span>` : '',
    e.location ? `<span class="badge">${ICONS.pin}${escapeHtml(e.location)}</span>` : ''
  ]
    .filter(Boolean)
    .join('\n');
  return `<div class="hero__ctas" style="margin-bottom:18px;">${chips}</div>`;
}

// wrapperClass/cardClass let callers match their own grid/card conventions
// (some templates key styling off a parent class via a descendant selector,
// e.g. minimal's ".row-list .row" — passing the wrong wrapper silently
// drops all padding/border styling on the cards, so both are parameterized
// rather than assuming the "featured-grid"/"card featured-card" pairing
// every other template happens to share).
function pricingTiersHtml(c, cardClass, wrapperClass) {
  const tiers = Array.isArray(c.pricingTiers) ? c.pricingTiers : [];
  if (!tiers.length) return '';
  const cls = cardClass || 'card featured-card';
  const wrapCls = wrapperClass || 'featured-grid';
  return `
  <section class="band" id="pricing">
    <div class="section-head">
      <div class="eyebrow">תמחור</div>
      <h2 class="section-title">בחרו את המסלול המתאים לכם</h2>
    </div>
    <div class="${wrapCls}">
      ${tiers
        .map(
          (t) =>
            `<div class="${cls}">${t.highlighted ? '<span class="badge">הכי פופולרי</span>' : ''}<h3>${escapeHtml(t.name)}</h3><p><span class="price">${escapeHtml(t.price)}${t.period ? ' / ' + escapeHtml(t.period) : ''}</span></p><p>${(t.features || []).map(escapeHtml).join(' • ')}</p></div>`
        )
        .join('\n')}
    </div>
  </section>`;
}

// variant 'wa-link' matches luxury's restrained plain-text-link CTA
// treatment (it never uses .btn--ghost-on-dark); every other template
// passes nothing and gets the default button pair.
function appLinksHtml(c, variant) {
  const links = c.appLinks;
  if (!links || !(links.appStoreUrl || links.playStoreUrl)) return '';
  if (variant === 'wa-link') {
    return [
      links.appStoreUrl ? `<a class="wa-link" href="${escapeHtml(links.appStoreUrl)}" target="_blank" rel="noopener">App Store</a>` : '',
      links.playStoreUrl ? `<a class="wa-link" href="${escapeHtml(links.playStoreUrl)}" target="_blank" rel="noopener">Google Play</a>` : ''
    ]
      .filter(Boolean)
      .join('\n');
  }
  return [
    links.appStoreUrl
      ? `<a class="btn btn--ghost-on-dark" href="${escapeHtml(links.appStoreUrl)}" target="_blank" rel="noopener">${ICONS.download} App Store</a>`
      : '',
    links.playStoreUrl
      ? `<a class="btn btn--ghost-on-dark" href="${escapeHtml(links.playStoreUrl)}" target="_blank" rel="noopener">${ICONS.download} Google Play</a>`
      : ''
  ]
    .filter(Boolean)
    .join('\n');
}

// ---------------------------------------------------------------
// WARM — cream background, serif headline, terracotta accent.
// Good fit for: personal services, creative freelancers, hospitality.
// Mobile-first: base styles are single-column/stacked nav; min-width
// media queries add the desktop layout on top.
// ---------------------------------------------------------------
function warmTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Bellefair&family=Heebo:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  /* DUSK & BRASS — warm doesn't have to mean cream+terracotta+serif (the
     single most common AI-design default for "personal/hospitality"
     briefs). This goes the other way: a dim, candlelit interior instead
     of a bright page — a tailor's back room, a wine bar at dusk, a
     guesthouse hallway lit by a single lamp. Brass instead of terracotta,
     hairline+folded-corner cards instead of soft drop shadows, a
     wax-seal-style badge instead of a blurred glass pill. */
  :root{
    --dusk:#221812;--dusk-deep:#170F0A;--paper:#2C2119;--ink:#F4ECDD;--ink-dim:#C9B8A2;
    --brass:#C89B3C;--brass-soft:rgba(200,155,60,.35);--ember:#A34A32;
    --muted:#8E7C68;--radius:3px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--dusk);color:var(--ink);font-family:'Heebo',sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;}
  a{color:inherit;}
  section{scroll-margin-top:88px;}
  .eyebrow{font-family:'Heebo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.1em;color:var(--brass);text-transform:uppercase;margin-bottom:10px;position:relative;display:inline-block;padding-bottom:10px;}
  .eyebrow::after{content:"";position:absolute;bottom:0;inset-inline-start:0;width:34px;height:1px;background:linear-gradient(90deg,var(--brass),transparent);}
  .section-title{font-family:'Bellefair',serif;font-size:clamp(24px,3.6vw,32px);font-weight:400;margin-bottom:8px;color:var(--ink);}
  .section-head{text-align:center;max-width:560px;margin:0 auto 10px;}

  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--radius);font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;transition:transform .15s ease,background .15s ease;white-space:nowrap;}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--brass);color:var(--dusk-deep);}
  .btn--primary:hover{background:#DCB158;transform:translateY(-2px);}
  .btn--ghost{background:transparent;color:var(--ink);border:1px solid var(--brass-soft);}
  .btn--ghost:hover{border-color:var(--brass);}
  .btn--on-dark{background:var(--brass);color:var(--dusk-deep);}
  .btn--on-dark:hover{background:#DCB158;}
  .btn--ghost-on-dark{background:transparent;color:var(--ink);border:1px solid rgba(244,236,221,.3);}
  .btn--ghost-on-dark:hover{border-color:var(--ink);}
  .btn--sm{padding:9px 16px;font-size:13px;}

  /* folded-corner card: a small brass triangle in the inline-end corner,
     like the turned-up corner of a stamped menu or an invitation card —
     stands in for a shadow-lift without borrowing the "rounded-lg +
     soft shadow" default every other template also reaches for. */
  .card{background:var(--paper);border:1px solid rgba(200,155,60,.18);border-radius:var(--radius);padding:24px;position:relative;overflow:hidden;transition:border-color .18s ease;}
  .card:hover{border-color:var(--brass-soft);}
  .card::after{content:"";position:absolute;top:0;inset-inline-end:0;border-style:solid;border-width:0 22px 22px 0;border-color:transparent var(--brass) transparent transparent;opacity:.85;}

  /* --- fixed hairline bar nav (not a floating blurred pill) --- */
  .nav-wrap{position:sticky;top:0;z-index:30;background:rgba(23,15,10,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--brass-soft);}
  .nav-toggle{display:none;}
  .nav-pill{max-width:980px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'Bellefair',serif;font-size:19px;color:var(--ink);}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:1px solid var(--brass-soft);border-radius:var(--radius);}
  .nav-burger span{width:18px;height:2px;background:var(--brass);display:block;}
  .nav-dropdown{display:none;flex-direction:column;border-top:1px solid var(--brass-soft);padding:10px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-size:15px;font-weight:600;text-decoration:none;color:var(--ink);border-top:1px solid rgba(244,236,221,.08);}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{color:var(--brass);}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:24px;}
    .nav-desktop a{font-size:14px;font-weight:600;text-decoration:none;color:var(--ink-dim);}
    .nav-desktop a:hover{color:var(--brass);}
  }

  /* --- hero: warm ember/brass duotone on the photo instead of a plain
     dark scrim, so it stays "warm" even though the ground is dark --- */
  .hero{position:relative;overflow:hidden;min-height:clamp(440px,62vh,620px);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;text-align:center;}
  .hero--fallback{background:radial-gradient(ellipse 900px 500px at 50% 30%,#3A2A1C 0%,var(--dusk) 70%);}
  .hero__scrim{position:absolute;inset:0;}
  .hero--photo .hero__scrim{background:linear-gradient(180deg,rgba(23,15,10,.35) 0%,rgba(34,24,18,.88) 100%);}
  .hero--fallback .hero__scrim{background:radial-gradient(500px 320px at 50% 15%,rgba(200,155,60,.14),transparent 65%);}
  .hero__inner{position:relative;z-index:1;max-width:700px;margin:0 auto;padding:60px 20px;}
  /* wax-seal badge: a bordered chip with a small brass ring, rather than
     a frosted-glass pill — the "seal" idea reused everywhere .badge
     appears (hero, CTA, event-detail chips, pricing ribbon) via one class. */
  .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(200,155,60,.08);border:1px solid var(--brass-soft);border-radius:999px;padding:6px 16px 6px 14px;font-size:12px;font-weight:700;color:var(--brass);margin-bottom:22px;}
  .badge__dot{width:6px;height:6px;border-radius:50%;background:var(--brass);box-shadow:0 0 0 3px rgba(200,155,60,.25);}
  h1{font-family:'Bellefair',serif;font-size:clamp(32px,6.6vw,52px);font-weight:400;line-height:1.2;margin-bottom:18px;color:var(--ink);}
  .sub{font-size:17px;color:var(--ink-dim);max-width:52ch;margin:0 auto 30px;}
  .hero__ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .photo-placeholder{border:1px dashed var(--brass-soft);border-radius:var(--radius);background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--muted);}
  .photo-placeholder svg{width:36px;height:36px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;border-radius:var(--radius);overflow:hidden;border:1px solid var(--brass-soft);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;filter:sepia(.12) saturate(1.05);}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(23,15,10,.7);color:var(--ink);font-size:10px;line-height:1;padding:5px 9px;border-radius:999px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}

  .about-band{max-width:960px;margin:0 auto;padding:36px 20px 8px;}
  .about-grid{display:grid;gap:24px;}
  .about p{font-size:16px;color:var(--ink-dim);text-align:center;max-width:62ch;margin:0 auto;}
  .about-photo{aspect-ratio:4/3;}
  @media (min-width:760px){
    .about-grid{grid-template-columns:1fr 1fr;align-items:center;}
    .about p{text-align:start;margin:0;}
  }

  .band{max-width:960px;margin:0 auto;padding:56px 20px;}

  .featured-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:14px;border-radius:var(--radius);overflow:hidden;}
  .featured-card h3{font-family:'Bellefair',serif;font-size:19px;font-weight:400;margin-bottom:6px;}
  .featured-card p{font-size:14px;color:var(--ink-dim);margin-bottom:12px;}
  .featured-card .price{display:inline-block;font-weight:700;font-size:13px;color:var(--brass);}

  .props-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .prop{display:flex;flex-direction:column;gap:12px;}
  .num-badge{flex:0 0 auto;width:36px;height:36px;border-radius:50%;border:1px solid var(--brass);color:var(--brass);font-family:'Bellefair',serif;font-weight:400;font-size:16px;display:flex;align-items:center;justify-content:center;}
  .prop h3{font-family:'Bellefair',serif;font-size:18px;font-weight:400;margin-bottom:4px;}
  .prop p{color:var(--ink-dim);font-size:14px;}

  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:28px;}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:1/1;border-radius:var(--radius);}
  .gallery-note{margin-top:16px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}

  .process-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{text-align:center;padding:26px 20px;}
  .step .num-badge{margin:0 auto 14px;}
  .step h3{font-family:'Bellefair',serif;font-weight:400;font-size:17px;margin-bottom:4px;}
  .step p{font-size:14px;color:var(--ink-dim);}

  .testimonials-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .testimonial p{font-family:'Bellefair',serif;font-size:18px;font-style:italic;color:var(--ink);margin-bottom:14px;}
  .testimonial__author{font-size:13px;font-weight:700;color:var(--brass);}
  .testimonial--placeholder{border:1px dashed var(--brass-soft);}
  .testimonial--placeholder::after{display:none;}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:var(--muted);}

  .faq-list{margin-top:28px;max-width:720px;margin-inline:auto;}
  .faq__item{background:var(--paper);border:1px solid rgba(200,155,60,.18);border-radius:var(--radius);padding:20px 22px;margin-bottom:12px;}
  .faq__item h3{font-family:'Bellefair',serif;font-weight:400;font-size:17px;margin-bottom:6px;}
  .faq__item p{font-size:14px;color:var(--ink-dim);}

  .cta-band{max-width:960px;margin:0 auto;padding:8px 20px 64px;}
  .cta-panel{position:relative;overflow:hidden;border:1px solid var(--brass-soft);border-radius:var(--radius);padding:64px 28px;text-align:center;background-size:cover;background-position:center;}
  .cta-panel--fallback{background:radial-gradient(ellipse 800px 460px at 50% 20%,#3A2A1C 0%,var(--dusk-deep) 75%);}
  .cta-panel__scrim{position:absolute;inset:0;}
  .cta-panel--photo .cta-panel__scrim{background:linear-gradient(180deg,rgba(23,15,10,.4) 0%,rgba(23,15,10,.86) 100%);}
  .cta-panel__content{position:relative;z-index:1;max-width:520px;margin:0 auto;}
  .cta-panel .badge{margin-bottom:18px;}
  .cta-panel h2{color:var(--ink);font-family:'Bellefair',serif;font-weight:400;font-size:clamp(28px,5vw,40px);margin-bottom:12px;}
  .cta-panel .cta-sub{color:var(--ink-dim);margin-bottom:28px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:18px;font-size:12px;color:var(--muted);}

  .site-footer{background:var(--dusk-deep);color:var(--ink-dim);border-top:1px solid var(--brass-soft);}
  .footer-top{max-width:960px;margin:0 auto;padding:52px 20px 32px;display:grid;gap:32px;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;}}
  .footer-brand .nav__brand{color:var(--ink);}
  .footer-brand p{font-size:14px;margin-top:10px;max-width:36ch;color:var(--muted);}
  .footer-links{display:flex;flex-direction:column;gap:10px;}
  .footer-links a{font-size:14px;text-decoration:none;color:var(--ink-dim);}
  .footer-links a:hover{color:var(--brass);}
  .footer-heading{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--brass);margin-bottom:12px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  .social-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--ink);border:1px solid var(--brass-soft);background:transparent;text-decoration:none;transition:border-color .15s ease;}
  .social-icon:hover{border-color:var(--brass);}
  .social-icon--placeholder{color:var(--muted);}
  .footer-bottom{border-top:1px solid rgba(244,236,221,.08);}
  .footer-bottom-inner{max-width:960px;margin:0 auto;padding:18px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:13px;color:var(--muted);}
  .footer-bottom-inner a{font-weight:600;color:var(--brass);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">מומלצים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">מומלצים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${c.heroPhoto && c.heroPhoto.url ? 'hero--photo' : 'hero--fallback'}"${c.heroPhoto && c.heroPhoto.url ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim"></div>
    <div class="hero__inner">
      <span class="badge"><span class="badge__dot"></span>פתוחים ומזמינים אתכם</span>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn btn--ghost" href="#featured">${ICONS.gallery.replace(/width="26" height="26"/, 'width="16" height="16"')} לראות מה מומלץ</a>
      </div>
    </div>
    ${c.heroPhoto && c.heroPhoto.url ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">מומלצים</div>
      <h2 class="section-title">המומלצים שלנו</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="card featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c)}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="card prop"><span class="num-badge">${i + 1}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות מהעסק</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות של העסק יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p, i) => `<div class="card step"><span class="num-badge">${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel ${c.heroPhoto && c.heroPhoto.url ? 'cta-panel--photo' : 'cta-panel--fallback'}"${c.heroPhoto && c.heroPhoto.url ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
      <div class="cta-panel__scrim"></div>
      <div class="cta-panel__content">
        <span class="badge"><span class="badge__dot"></span>מוכנים לארח אתכם</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${appLinksHtml(c)}
          ${waCtaButton}
        </div>
        <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">מומלצים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// BOLD — near-black surface, oversized Rubik type, single acid-green
// accent. Good fit for: tech, agencies, anything wanting to feel
// confident/modern. Flat full-width nav bar (not a floating pill — that
// reads too "friendly SaaS" for this identity); a moody asymmetric glow
// instead of warm's centered radial when there's no hero photo.
// ---------------------------------------------------------------
function boldTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Rubik+Mono+One&family=Heebo:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
  /* COBALT / CONCRETE — "bold for tech/agencies" almost always means dark
     mode + one neon accent (acid-green or vermilion), which by now is as
     much a default as cream+terracotta is for "warm." This goes the
     opposite way: a LIGHT, saturated print-poster identity — a single
     structural cobalt (not a small accent glow), concrete-white ground,
     warm-black ink, one sunflower pop reserved for prices/highlights.
     Rubik Mono One (monospace, blocky, poster-like) carries the labels
     and numerals; Heebo at black weight carries actual sentence-length
     headlines, since a full headline set in a monospace face gets
     uncomfortably wide. Ghost page-numerals behind each section head
     (via CSS counters, no markup changes) are the signature — literal
     pagination through the page, the way a printed spread numbers itself. */
  :root{
    --paper:#F2F1EC;--ink:#14120F;--cobalt:#1E3FD6;--cobalt-deep:#142C9E;
    --sun:#FFC940;--line:rgba(20,18,15,.14);--muted:#6B6860;--radius:4px;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--paper);color:var(--ink);font-family:'Heebo',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;counter-reset:section;}
  a{color:inherit;}
  section{scroll-margin-top:72px;}
  .eyebrow{font-family:'Rubik Mono One',monospace;font-weight:400;font-size:11px;letter-spacing:.04em;color:var(--cobalt);text-transform:uppercase;margin-bottom:12px;}
  .section-title{font-family:'Rubik Mono One',monospace;font-size:clamp(19px,2.8vw,25px);font-weight:400;margin-bottom:8px;line-height:1.35;}
  .section-head{text-align:center;max-width:560px;margin:0 auto 8px;position:relative;}
  .band{position:relative;counter-increment:section;}
  .band .section-head::before{
    content:counter(section,decimal-leading-zero);
    position:absolute;top:-46px;inset-inline-start:50%;transform:translateX(-50%);
    font-family:'Rubik Mono One',monospace;font-size:112px;line-height:1;
    color:rgba(30,63,214,.07);z-index:-1;pointer-events:none;white-space:nowrap;
  }

  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--radius);font-weight:700;font-size:14px;text-decoration:none;padding:13px 24px;transition:transform .15s ease,background .15s ease;white-space:nowrap;}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--cobalt);color:#fff;}
  .btn--primary:hover{background:var(--cobalt-deep);transform:translateY(-2px);}
  .btn--ghost{background:transparent;color:var(--ink);border:1.5px solid var(--ink);}
  .btn--ghost:hover{background:var(--ink);color:var(--paper);}
  .btn--on-dark{background:var(--sun);color:var(--ink);}
  .btn--on-dark:hover{transform:translateY(-2px);}
  .btn--ghost-on-dark{background:transparent;color:#fff;border:1.5px solid rgba(255,255,255,.5);}
  .btn--ghost-on-dark:hover{border-color:#fff;}
  .btn--sm{padding:9px 16px;font-size:13px;}

  .card{background:#fff;border:1.5px solid var(--ink);border-radius:var(--radius);padding:22px;transition:transform .15s ease,box-shadow .15s ease;}
  .card:hover{transform:translateY(-3px);box-shadow:4px 4px 0 var(--cobalt);}

  /* --- flat nav bar, paper ground --- */
  .nav-wrap{position:sticky;top:0;z-index:30;}
  .nav-toggle{display:none;}
  .nav-pill{max-width:1040px;margin:0 auto;background:rgba(242,241,236,.94);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-bottom:1.5px solid var(--ink);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'Rubik Mono One',monospace;font-weight:400;font-size:14px;}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:1.5px solid var(--ink);border-radius:var(--radius);}
  .nav-burger span{width:18px;height:2px;background:var(--ink);display:block;}
  .nav-dropdown{display:none;flex-direction:column;background:var(--paper);border-bottom:1.5px solid var(--ink);padding:8px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-size:14px;font-weight:600;text-decoration:none;color:var(--ink);border-top:1px solid var(--line);}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{color:var(--cobalt);}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:26px;}
    .nav-desktop a{font-size:13px;font-weight:600;text-decoration:none;color:var(--ink);text-transform:uppercase;letter-spacing:.04em;transition:color .15s ease;}
    .nav-desktop a:hover{color:var(--cobalt);}
  }

  /* --- hero: solid cobalt block always (photo gets a cobalt duotone,
     not a plain dark scrim) so the identity holds with or without one --- */
  .hero{position:relative;overflow:hidden;min-height:clamp(440px,60vh,600px);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;text-align:center;background-color:var(--cobalt);}
  .hero--fallback{background:var(--cobalt);}
  .hero__scrim{position:absolute;inset:0;}
  .hero--photo .hero__scrim{background:linear-gradient(160deg,rgba(30,63,214,.82) 0%,rgba(20,44,158,.9) 100%);mix-blend-mode:multiply;}
  .hero--fallback .hero__scrim{background:radial-gradient(560px 380px at 85% 0%,rgba(255,201,64,.18),transparent 60%);}
  .hero__inner{position:relative;z-index:1;max-width:760px;margin:0 auto;padding:60px 20px;}
  .badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.4);border-radius:var(--radius);padding:7px 16px 7px 14px;font-family:'Rubik Mono One',monospace;font-size:10px;font-weight:400;letter-spacing:.04em;text-transform:uppercase;color:#fff;margin-bottom:24px;}
  .badge__dot{width:6px;height:6px;border-radius:50%;background:var(--sun);}
  h1{font-family:'Heebo',sans-serif;font-size:clamp(32px,6.6vw,52px);font-weight:900;line-height:1.14;letter-spacing:-.01em;margin-bottom:20px;color:#fff;}
  .sub{font-size:17px;color:rgba(255,255,255,.85);max-width:52ch;margin:0 auto 32px;}
  .hero__ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .photo-placeholder{border:1.5px dashed rgba(20,18,15,.3);border-radius:var(--radius);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#AFA99C;}
  .photo-placeholder svg{width:36px;height:36px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;border-radius:var(--radius);overflow:hidden;border:1.5px solid var(--ink);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(20,18,15,.65);color:#fff;font-size:10px;line-height:1;padding:5px 9px;border-radius:999px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}

  .about-band{max-width:1040px;margin:0 auto;padding:56px 20px 8px;}
  .about-grid{display:grid;gap:24px;}
  .about p{font-size:16px;color:var(--ink);text-align:center;max-width:62ch;margin:0 auto;}
  .about-photo{aspect-ratio:4/3;}
  @media (min-width:760px){
    .about-grid{grid-template-columns:1fr 1fr;align-items:center;}
    .about p{text-align:start;margin:0;}
  }

  .band{max-width:1040px;margin:0 auto;padding:76px 20px 60px;}

  .featured-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:14px;border-radius:var(--radius);overflow:hidden;}
  .featured-card h3{font-family:'Heebo',sans-serif;font-size:17px;font-weight:700;margin-bottom:6px;}
  .featured-card p{font-size:14px;color:var(--muted);margin-bottom:12px;}
  .featured-card .price{display:inline-block;font-weight:700;font-size:13px;color:var(--ink);background:var(--sun);border-radius:var(--radius);padding:3px 10px;}

  .props-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .prop{display:flex;flex-direction:column;gap:12px;}
  .num-badge{flex:0 0 auto;width:34px;height:34px;border-radius:var(--radius);background:var(--cobalt);color:#fff;font-family:'Rubik Mono One',monospace;font-weight:400;font-size:13px;display:flex;align-items:center;justify-content:center;}
  .prop h3{font-family:'Heebo',sans-serif;font-size:16px;font-weight:700;margin-bottom:4px;}
  .prop p{color:var(--muted);font-size:14px;}

  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:28px;}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:1/1;border-radius:var(--radius);}
  .gallery-note{margin-top:16px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}

  .process-grid{display:grid;gap:20px;margin-top:32px;}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{padding:0;}
  .step .num-badge{width:auto;height:auto;background:none;color:var(--cobalt);border:none;font-size:34px;padding:0;margin-bottom:10px;justify-content:flex-start;}
  .step h3{font-family:'Heebo',sans-serif;font-size:16px;font-weight:700;margin-bottom:4px;}
  .step p{font-size:14px;color:var(--muted);}

  .testimonials-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .testimonial p{font-size:15px;color:var(--ink);margin-bottom:14px;}
  .testimonial__author{font-size:13px;font-weight:700;color:var(--cobalt);}
  .testimonial--placeholder{border:1.5px dashed rgba(20,18,15,.25);background:transparent;}
  .testimonial--placeholder:hover{box-shadow:none;}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#AFA99C;}

  .faq-list{margin-top:28px;max-width:760px;margin-inline:auto;}
  .faq__item{background:#fff;border:1.5px solid var(--ink);border-radius:var(--radius);padding:20px 22px;margin-bottom:12px;}
  .faq__item h3{font-family:'Heebo',sans-serif;font-size:16px;font-weight:700;margin-bottom:6px;}
  .faq__item p{font-size:14px;color:var(--muted);}

  .cta-band{max-width:1040px;margin:0 auto;padding:8px 20px 64px;}
  .cta-panel{position:relative;overflow:hidden;border-radius:var(--radius);padding:64px 28px;text-align:center;background-size:cover;background-position:center;background-color:var(--cobalt-deep);}
  .cta-panel--fallback{background:var(--cobalt-deep);}
  .cta-panel--fallback::before{content:"";position:absolute;inset-inline-end:-8%;bottom:-30%;width:60%;height:140%;background:radial-gradient(circle,rgba(255,201,64,.16),transparent 65%);}
  .cta-panel__scrim{position:absolute;inset:0;}
  .cta-panel--photo .cta-panel__scrim{background:rgba(20,44,158,.86);mix-blend-mode:multiply;}
  .cta-panel__content{position:relative;z-index:1;max-width:520px;margin:0 auto;}
  .cta-panel .badge{margin-bottom:18px;}
  .cta-panel h2{color:#fff;font-family:'Heebo',sans-serif;font-weight:900;font-size:clamp(26px,4.6vw,40px);letter-spacing:-.01em;margin-bottom:12px;}
  .cta-panel .cta-sub{color:rgba(255,255,255,.8);margin-bottom:28px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:18px;font-size:12px;color:rgba(255,255,255,.65);}

  .site-footer{background:var(--ink);color:rgba(242,241,236,.7);}
  .footer-top{max-width:1040px;margin:0 auto;padding:52px 20px 32px;display:grid;gap:32px;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;}}
  .footer-brand .nav__brand{color:var(--paper);}
  .footer-brand p{font-size:14px;margin-top:10px;max-width:36ch;color:rgba(242,241,236,.55);}
  .footer-links{display:flex;flex-direction:column;gap:10px;}
  .footer-links a{font-size:14px;text-decoration:none;color:rgba(242,241,236,.75);}
  .footer-links a:hover{color:var(--sun);}
  .footer-heading{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:rgba(242,241,236,.45);margin-bottom:12px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  .social-icon{width:38px;height:38px;border-radius:var(--radius);display:flex;align-items:center;justify-content:center;color:var(--paper);background:rgba(242,241,236,.08);border:1px solid rgba(242,241,236,.2);text-decoration:none;transition:background .15s ease;}
  .social-icon:hover{background:var(--cobalt);border-color:var(--cobalt);}
  .social-icon--placeholder{color:rgba(242,241,236,.3);}
  .footer-bottom{border-top:1px solid rgba(242,241,236,.12);}
  .footer-bottom-inner{max-width:1040px;margin:0 auto;padding:18px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:13px;color:rgba(242,241,236,.5);}
  .footer-bottom-inner a{font-weight:600;color:var(--sun);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${c.heroPhoto && c.heroPhoto.url ? 'hero--photo' : 'hero--fallback'}"${c.heroPhoto && c.heroPhoto.url ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim"></div>
    <div class="hero__inner">
      <span class="badge"><span class="badge__dot"></span>זמינים לפרויקטים חדשים</span>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn btn--ghost" href="#featured">לראות את השירותים</a>
      </div>
    </div>
    ${c.heroPhoto && c.heroPhoto.url ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">שירותים</div>
      <h2 class="section-title">מה אנחנו מציעים</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="card featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c)}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="card prop"><span class="num-badge">${i + 1}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">עבודות שלנו</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p, i) => `<div class="step"><span class="num-badge">0${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel ${c.heroPhoto && c.heroPhoto.url ? 'cta-panel--photo' : 'cta-panel--fallback'}"${c.heroPhoto && c.heroPhoto.url ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
      <div class="cta-panel__scrim"></div>
      <div class="cta-panel__content">
        <span class="badge"><span class="badge__dot"></span>בואו נתחיל</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${appLinksHtml(c)}
          ${waCtaButton}
        </div>
        <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// MINIMAL — broadsheet-style, hairline rules, restrained type.
// Good fit for: professional/consulting services, anything wanting gravitas.
// Deliberately monochrome (no accent color — the restraint IS the identity)
// and grayscale photography. Lists render as hairline-separated rows, not
// card grids, to stay distinct from warm/bold. The CTA is a solid
// ink-inverted band rather than a photo cover — a considered choice to keep
// one restrained, editorial "closing statement" instead of reusing the same
// photo-cover treatment on every template.
// ---------------------------------------------------------------
function minimalTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);
  const hasHeroPhoto = Boolean(c.heroPhoto && c.heroPhoto.url);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@600;700&family=Heebo:wght@300;400;500;700&display=swap" rel="stylesheet">
<style>
  :root{--bg:#FCFCFB;--paper:#FFFFFF;--ink:#1A1A1A;--rule:#D9D9D5;--muted:#7A7A76;--muted-icon:#C7C7C2;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--ink);font-family:'Frank Ruhl Libre',serif;line-height:1.65;-webkit-font-smoothing:antialiased;}
  a{color:inherit;}
  section{scroll-margin-top:64px;}
  .eyebrow{font-family:'Heebo',sans-serif;font-weight:500;font-size:12px;letter-spacing:.05em;color:var(--muted);text-transform:uppercase;margin-bottom:12px;}
  .section-title{font-family:'Frank Ruhl Libre',serif;font-size:clamp(22px,3.2vw,28px);font-weight:700;margin-bottom:8px;}
  .section-head{border-bottom:1px solid var(--rule);padding-bottom:20px;margin-bottom:32px;}

  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:600;font-size:14px;text-decoration:none;padding:12px 26px;font-family:'Heebo',sans-serif;white-space:nowrap;transition:background .15s ease,color .15s ease;}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--ink);color:var(--bg);border:1px solid var(--ink);}
  .btn--primary:hover{background:transparent;color:var(--ink);}
  .btn--ghost{background:transparent;color:var(--ink);border:1px solid var(--rule);}
  .btn--ghost:hover{border-color:var(--ink);}
  .btn--on-dark{background:var(--bg);color:var(--ink);border:1px solid var(--bg);}
  .btn--on-dark:hover{background:transparent;color:var(--bg);}
  .btn--ghost-on-dark{background:transparent;color:var(--bg);border:1px solid rgba(252,246,240,.5);}
  .btn--ghost-on-dark:hover{border-color:var(--bg);}
  .btn--sm{padding:8px 18px;font-size:13px;}
  .badge{display:inline-flex;align-items:center;gap:7px;font-family:'Heebo',sans-serif;font-size:12px;font-weight:500;color:var(--bg);border:1px solid rgba(252,246,240,.5);padding:6px 14px;margin-bottom:14px;}

  .card{background:var(--paper);border:1px solid var(--rule);padding:22px;}

  /* --- nav: plain hairline bar, no pill/blur --- */
  .nav-wrap{position:sticky;top:0;z-index:30;background:var(--bg);border-bottom:1px solid var(--rule);}
  .nav-toggle{display:none;}
  .nav-pill{max-width:900px;margin:0 auto;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'Frank Ruhl Libre',serif;font-weight:700;font-size:18px;}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:1px solid var(--rule);}
  .nav-burger span{width:18px;height:2px;background:var(--ink);display:block;}
  .nav-dropdown{display:none;flex-direction:column;max-width:900px;margin:0 auto;border-top:1px solid var(--rule);padding:8px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-family:'Heebo',sans-serif;font-size:14px;font-weight:500;text-decoration:none;color:var(--ink);border-top:1px solid var(--rule);}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{font-weight:700;}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:28px;}
    .nav-desktop a{font-family:'Heebo',sans-serif;font-size:13px;font-weight:500;text-decoration:none;color:var(--muted);}
    .nav-desktop a:hover{color:var(--ink);}
  }

  /* --- hero: grayscale cover photo behind a flat ink wash (never a
     gradient — the flatness is the point). Fallback keeps the page's own
     paper tone, framed by a double hairline like a masthead. --- */
  .hero{position:relative;overflow:hidden;}
  .hero__photo-bg{position:absolute;inset:0;background-size:cover;background-position:center;filter:grayscale(1) contrast(1.05);}
  .hero__wash{position:absolute;inset:0;background:rgba(26,26,26,.58);}
  .hero__inner{position:relative;z-index:1;max-width:820px;margin:0 auto;padding:72px 24px 64px;}
  .hero--photo h1,.hero--photo .eyebrow{color:var(--bg);}
  .hero--photo .sub{color:rgba(252,246,240,.8);}
  .hero--fallback{border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);}
  .hero--fallback .hero__inner{padding-top:56px;padding-bottom:56px;}
  h1{font-weight:700;font-size:clamp(30px,6vw,50px);line-height:1.2;margin-bottom:20px;}
  .sub{font-family:'Heebo',sans-serif;font-weight:300;font-size:16px;color:var(--muted);max-width:58ch;margin-bottom:36px;}
  .hero__ctas{display:flex;gap:12px;flex-wrap:wrap;}
  .photo-placeholder{border:1px dashed var(--rule);background:var(--paper);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--muted-icon);}
  .photo-placeholder svg{width:32px;height:32px;}
  .photo-placeholder span{font-family:'Heebo',sans-serif;font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;overflow:hidden;border:1px solid var(--rule);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;filter:grayscale(1) contrast(1.02);}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(255,255,255,.85);color:var(--ink);font-family:'Heebo',sans-serif;font-size:10px;line-height:1;padding:5px 9px;text-decoration:none;opacity:.9;border:1px solid var(--rule);}
  .photo-credit:hover{opacity:1;}

  .about-band{max-width:900px;margin:0 auto;padding:48px 24px 8px;}
  .about-grid{display:grid;gap:24px;}
  .about p{font-size:17px;max-width:64ch;}
  .about-photo{aspect-ratio:4/3;}
  @media (min-width:760px){.about-grid{grid-template-columns:1fr 1fr;align-items:center;}}

  .wrap{max-width:900px;margin:0 auto;padding:48px 24px;}

  /* Featured/props/process/faq all share the same hairline-row language —
     the point of an editorial layout is dense, scannable rows, not cards. */
  .row-list{border-top:1px solid var(--rule);}
  .row-list .row{padding:24px 0;border-bottom:1px solid var(--rule);}

  .featured-row{display:grid;grid-template-columns:88px 1fr;gap:18px;align-items:start;}
  .featured-row .dish-thumb{aspect-ratio:1/1;}
  .featured-row h3{font-size:17px;font-weight:600;margin-bottom:4px;}
  .featured-row p{font-family:'Heebo',sans-serif;font-weight:300;font-size:14px;color:var(--muted);}
  .featured-row .price{font-family:'Heebo',sans-serif;font-weight:700;font-size:13px;color:var(--ink);display:inline-block;margin-top:6px;}

  .prop-row{display:grid;grid-template-columns:120px 1fr;gap:20px;}
  .prop-row h3{font-size:16px;font-weight:600;}
  .prop-row p{font-family:'Heebo',sans-serif;font-weight:300;font-size:13px;color:var(--muted);}

  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2px;margin-top:4px;background:var(--rule);}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:1/1;border:none;}
  .gallery-note{margin-top:16px;font-family:'Heebo',sans-serif;font-size:13px;color:var(--muted);font-style:italic;}

  .process-row{display:grid;grid-template-columns:44px 1fr;gap:18px;}
  .process-row .num-badge{font-family:'Frank Ruhl Libre',serif;font-size:17px;font-weight:700;color:var(--muted);}
  .process-row h3{font-size:16px;font-weight:600;margin-bottom:4px;}
  .process-row p{font-family:'Heebo',sans-serif;font-weight:300;font-size:13px;color:var(--muted);}

  .testimonial{border-top:2px solid var(--ink);padding-top:20px;}
  .testimonial p{font-size:18px;font-style:italic;margin-bottom:14px;}
  .testimonial__author{font-family:'Heebo',sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);}
  .testimonial--placeholder{border-top:2px dashed var(--rule);}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:var(--muted-icon);}
  .testimonials-grid{display:grid;gap:28px;margin-top:4px;}
  @media (min-width:640px){.testimonials-grid{grid-template-columns:1fr 1fr;}}

  .faq-row h3{font-size:16px;font-weight:600;margin-bottom:6px;}
  .faq-row p{font-family:'Heebo',sans-serif;font-weight:300;font-size:14px;color:var(--muted);}

  /* --- CTA: solid ink-inverted band, no photo — see note above --- */
  .cta-band{max-width:900px;margin:0 auto;padding:8px 24px 64px;}
  .cta-panel{background:var(--ink);padding:56px 32px;text-align:center;}
  .cta-panel h2{color:var(--bg);font-size:clamp(26px,4.5vw,36px);margin-bottom:12px;}
  .cta-panel .cta-sub{font-family:'Heebo',sans-serif;font-weight:300;color:rgba(252,246,240,.75);margin-bottom:28px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:18px;font-family:'Heebo',sans-serif;font-size:12px;color:rgba(252,246,240,.55);}

  .site-footer{border-top:1px solid var(--rule);}
  .footer-top{max-width:900px;margin:0 auto;padding:44px 24px 28px;display:grid;gap:28px;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;}}
  .footer-brand .nav__brand{color:var(--ink);}
  .footer-brand p{font-family:'Heebo',sans-serif;font-weight:300;font-size:14px;margin-top:10px;max-width:36ch;color:var(--muted);}
  .footer-links{display:flex;flex-direction:column;gap:10px;}
  .footer-links a{font-family:'Heebo',sans-serif;font-size:14px;text-decoration:none;color:var(--ink);}
  .footer-heading{font-family:'Heebo',sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin-bottom:12px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  .social-icon{width:36px;height:36px;display:flex;align-items:center;justify-content:center;color:var(--ink);border:1px solid var(--rule);text-decoration:none;}
  .social-icon:hover{border-color:var(--ink);}
  .social-icon--placeholder{color:var(--muted-icon);}
  .footer-bottom{border-top:1px solid var(--rule);}
  .footer-bottom-inner{max-width:900px;margin:0 auto;padding:16px 24px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-family:'Heebo',sans-serif;font-size:13px;color:var(--muted);}
  .footer-bottom-inner a{font-weight:600;color:var(--ink);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${hasHeroPhoto ? 'hero--photo' : 'hero--fallback'}">
    ${hasHeroPhoto ? `<div class="hero__photo-bg" style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"></div><div class="hero__wash"></div>` : ''}
    <div class="hero__inner">
      <div class="eyebrow">${escapeHtml(c.businessName)}</div>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn ${hasHeroPhoto ? 'btn--on-dark' : 'btn--primary'}" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn ${hasHeroPhoto ? 'btn--ghost-on-dark' : 'btn--ghost'}" href="#featured">לראות מה מציעים</a>
      </div>
    </div>
    ${hasHeroPhoto ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="wrap">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="row-list">
      <div class="row faq-row"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="row faq-row"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="wrap" id="featured">
    <div class="section-head">
      <div class="eyebrow">שירותים</div>
      <h2 class="section-title">מה אנחנו מציעים</h2>
    </div>
    <div class="row-list">
      ${valuePropsHtml(c.featured, (f) => `<div class="row featured-row">${photoBlock(f.photo, 'dish-thumb', f.name)}<div><h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div></div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c, 'row prop-row', 'row-list')}

  <section class="wrap">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="row-list">
      ${valuePropsHtml(c.valueProps, (p) => `<div class="row prop-row"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="wrap" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="wrap">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="row-list">
      ${valuePropsHtml(c.process, (p, i) => `<div class="row process-row"><span class="num-badge">0${i + 1}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div></div>`)}
    </div>
  </section>

  <section class="wrap" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="wrap" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="row-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="row faq-row"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel">
      <h2>${escapeHtml(c.ctaHeadline)}</h2>
      <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
      <div class="cta-actions">
        <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
        ${appLinksHtml(c)}
        ${waCtaButton}
      </div>
      <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// MODERN CORPORATE — navy/white/steel-blue, structured, trust-focused.
// Good fit for: lawyers, accountants, finance. David Libre (formal serif
// headings) + Assistant (clean sans body). Small radii throughout (6-8px,
// not fully rounded — "structured" reads as slightly squared-off, not
// soft). No accent-rail cards; trust reads through a small rectangular
// "verified" tag style instead.
// ---------------------------------------------------------------
function modernCorporateTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);
  const hasHeroPhoto = Boolean(c.heroPhoto && c.heroPhoto.url);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=David+Libre:wght@500;700&family=Assistant:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--navy:#0B2545;--navy-deep:#082038;--paper:#F7F9FC;--white:#FFFFFF;--steel:#4C6785;--accent:#2F6FED;--line:#DCE3ED;--ink:#152238;--muted:#5C6B80;--radius:8px;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--paper);color:var(--ink);font-family:'Assistant',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;}
  a{color:inherit;}
  section{scroll-margin-top:76px;}
  .eyebrow{font-family:'Assistant',sans-serif;font-weight:700;font-size:12px;letter-spacing:.06em;color:var(--accent);text-transform:uppercase;margin-bottom:10px;}
  .section-title{font-family:'David Libre',serif;font-size:clamp(22px,3.2vw,29px);font-weight:700;margin-bottom:8px;}
  .section-head{text-align:center;max-width:560px;margin:0 auto 8px;}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:var(--radius);font-weight:700;font-size:14px;text-decoration:none;padding:13px 26px;transition:background .15s ease,transform .15s ease;white-space:nowrap;}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--navy);color:#fff;}
  .btn--primary:hover{background:var(--navy-deep);}
  .btn--ghost{background:#fff;color:var(--navy);border:1px solid var(--line);}
  .btn--ghost:hover{border-color:var(--accent);color:var(--accent);}
  .btn--on-dark{background:#fff;color:var(--navy);}
  .btn--on-dark:hover{transform:translateY(-2px);}
  .btn--ghost-on-dark{background:rgba(255,255,255,.1);color:#fff;border:1px solid rgba(255,255,255,.35);}
  .btn--ghost-on-dark:hover{background:rgba(255,255,255,.18);}
  .btn--sm{padding:9px 18px;font-size:13px;}
  .card{background:#fff;border:1px solid var(--line);border-radius:var(--radius);padding:22px;transition:border-color .15s ease,transform .15s ease;}
  .card:hover{border-color:var(--accent);transform:translateY(-2px);}
  .nav-wrap{position:sticky;top:0;z-index:30;background:#fff;border-bottom:1px solid var(--line);}
  .nav-toggle{display:none;}
  .nav-pill{max-width:1080px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'David Libre',serif;font-weight:700;font-size:18px;color:var(--navy);}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:1px solid var(--line);border-radius:6px;}
  .nav-burger span{width:18px;height:2px;background:var(--navy);display:block;}
  .nav-dropdown{display:none;flex-direction:column;border-top:1px solid var(--line);padding:8px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-size:14px;font-weight:600;text-decoration:none;color:var(--ink);border-top:1px solid var(--line);}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{color:var(--accent);}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:28px;}
    .nav-desktop a{font-size:14px;font-weight:600;text-decoration:none;color:var(--muted);}
    .nav-desktop a:hover{color:var(--navy);}
  }
  .hero{position:relative;overflow:hidden;min-height:clamp(420px,58vh,580px);display:flex;align-items:center;background-size:cover;background-position:center;}
  .hero--fallback{background:var(--navy);}
  .hero__scrim{position:absolute;inset:0;}
  .hero--photo .hero__scrim{background:linear-gradient(90deg,rgba(8,32,56,.88) 0%,rgba(8,32,56,.5) 60%,rgba(8,32,56,.25) 100%);}
  .hero--fallback .hero__scrim{background-image:repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0,rgba(255,255,255,.04) 1px,transparent 1px,transparent 64px);}
  .hero__inner{position:relative;z-index:1;max-width:1080px;margin:0 auto;padding:60px 20px;width:100%;}
  .hero__content{max-width:600px;}
  .badge{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.3);border-radius:4px;padding:6px 12px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#fff;margin-bottom:20px;}
  .badge__dot{width:6px;height:6px;border-radius:50%;background:var(--accent);}
  h1{font-family:'David Libre',serif;font-size:clamp(30px,6vw,48px);font-weight:700;line-height:1.2;margin-bottom:18px;color:#fff;}
  .sub{font-size:17px;color:rgba(255,255,255,.82);max-width:52ch;margin-bottom:30px;}
  .hero__ctas{display:flex;gap:12px;flex-wrap:wrap;}
  .photo-placeholder{border:1px dashed var(--line);border-radius:var(--radius);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#A9B6C6;}
  .photo-placeholder svg{width:34px;height:34px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;border-radius:var(--radius);overflow:hidden;border:1px solid var(--line);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(8,32,56,.7);color:#fff;font-size:10px;line-height:1;padding:5px 9px;border-radius:4px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}
  .about-band{max-width:1080px;margin:0 auto;padding:56px 20px 8px;}
  .about-grid{display:grid;gap:28px;}
  .about p{font-size:16px;color:var(--ink);max-width:64ch;}
  .about-photo{aspect-ratio:4/3;}
  @media (min-width:760px){.about-grid{grid-template-columns:1.1fr 1fr;align-items:center;}}
  .band{max-width:1080px;margin:0 auto;padding:56px 20px;}
  .featured-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:14px;}
  .featured-card h3{font-family:'David Libre',serif;font-size:17px;margin-bottom:6px;}
  .featured-card p{font-size:14px;color:var(--muted);margin-bottom:12px;}
  .featured-card .price{display:inline-block;font-weight:700;font-size:13px;color:var(--navy);}
  .props-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .prop{display:flex;flex-direction:column;gap:12px;}
  .num-badge{flex:0 0 auto;width:32px;height:32px;border-radius:6px;background:var(--navy);color:#fff;font-family:'David Libre',serif;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;}
  .prop h3{font-family:'David Libre',serif;font-size:16px;margin-bottom:4px;}
  .prop p{color:var(--muted);font-size:14px;}
  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:28px;}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:1/1;}
  .gallery-note{margin-top:16px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}
  .process-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{text-align:center;padding:24px 18px;}
  .step .num-badge{margin:0 auto 14px;border-radius:50%;}
  .step h3{font-size:16px;margin-bottom:4px;}
  .step p{font-size:14px;color:var(--muted);}
  .testimonials-grid{display:grid;gap:16px;margin-top:28px;}
  @media (min-width:560px){.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .testimonial{position:relative;}
  .testimonial p{font-size:15px;color:var(--ink);margin-bottom:14px;}
  .testimonial__author{font-size:13px;font-weight:700;color:var(--navy);}
  .testimonial--placeholder{border:1px dashed var(--line);background:transparent;}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#A9B6C6;}
  .faq-list{margin-top:28px;max-width:760px;margin-inline:auto;}
  .faq__item{background:#fff;border-inline-start:3px solid var(--navy);border-radius:0 var(--radius) var(--radius) 0;padding:18px 20px;margin-bottom:10px;}
  .faq__item h3{font-size:16px;margin-bottom:6px;}
  .faq__item p{font-size:14px;color:var(--muted);}
  .cta-band{max-width:1080px;margin:0 auto;padding:8px 20px 64px;}
  .cta-panel{position:relative;overflow:hidden;border-radius:12px;padding:56px 28px;text-align:center;background-size:cover;background-position:center;}
  .cta-panel--fallback{background:var(--navy);}
  .cta-panel__scrim{position:absolute;inset:0;}
  .cta-panel--photo .cta-panel__scrim{background:linear-gradient(180deg,rgba(8,32,56,.5) 0%,rgba(8,32,56,.85) 100%);}
  .cta-panel__content{position:relative;z-index:1;max-width:520px;margin:0 auto;}
  .cta-panel .badge{margin-bottom:18px;}
  .cta-panel h2{color:#fff;font-family:'David Libre',serif;font-size:clamp(24px,4vw,34px);margin-bottom:12px;}
  .cta-panel .cta-sub{color:rgba(255,255,255,.8);margin-bottom:26px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:16px;font-size:12px;color:rgba(255,255,255,.55);}
  .site-footer{background:var(--navy-deep);color:rgba(255,255,255,.75);}
  .footer-top{max-width:1080px;margin:0 auto;padding:48px 20px 28px;display:grid;gap:28px;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;}}
  .footer-brand .nav__brand{color:#fff;}
  .footer-brand p{font-size:14px;margin-top:10px;max-width:36ch;color:rgba(255,255,255,.6);}
  .footer-links{display:flex;flex-direction:column;gap:10px;}
  .footer-links a{font-size:14px;text-decoration:none;color:rgba(255,255,255,.75);}
  .footer-heading{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:rgba(255,255,255,.45);margin-bottom:12px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  .social-icon{width:36px;height:36px;border-radius:6px;display:flex;align-items:center;justify-content:center;color:#fff;background:rgba(255,255,255,.08);text-decoration:none;transition:background .15s ease;}
  .social-icon:hover{background:rgba(255,255,255,.18);}
  .social-icon--placeholder{color:rgba(255,255,255,.3);}
  .footer-bottom{border-top:1px solid rgba(255,255,255,.1);}
  .footer-bottom-inner{max-width:1080px;margin:0 auto;padding:16px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.5);}
  .footer-bottom-inner a{font-weight:600;color:#fff;text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${hasHeroPhoto ? 'hero--photo' : 'hero--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim"></div>
    <div class="hero__inner">
      <div class="hero__content">
        <span class="badge"><span class="badge__dot"></span>זמינים לייעוץ</span>
        <h1>${escapeHtml(c.headline)}</h1>
        <p class="sub">${escapeHtml(c.subheadline)}</p>
        ${eventDetailsHtml(c)}
        <div class="hero__ctas">
          <a class="btn btn--primary" href="#cta" style="background:#fff;color:var(--navy);">${escapeHtml(c.ctaText)}</a>
          <a class="btn btn--ghost-on-dark" href="#featured">לשירותים שלנו</a>
        </div>
      </div>
    </div>
    ${hasHeroPhoto ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">שירותים</div>
      <h2 class="section-title">מה אנחנו מציעים</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="card featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c)}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="card prop"><span class="num-badge">${i + 1}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p, i) => `<div class="card step"><span class="num-badge">${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel ${hasHeroPhoto ? 'cta-panel--photo' : 'cta-panel--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
      <div class="cta-panel__scrim"></div>
      <div class="cta-panel__content">
        <span class="badge"><span class="badge__dot"></span>מוכנים לעזור</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${appLinksHtml(c)}
          ${waCtaButton}
        </div>
        <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// LUXURY — onyx + muted gold, large imagery, elegant restraint.
// Good fit for: jewelry, luxury real estate, premium salons. Miriam Libre
// (elegant serif) + Assistant light (body). No shadow-glow, no gradients —
// restraint IS the luxury signal, carried entirely by thin gold hairlines,
// generous space, and a single deliberate CTA (a second WhatsApp action is
// a plain text link, not a second heavy button).
// ---------------------------------------------------------------
function luxuryTemplate(c) {
  const { telHref, waHref, galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon } = buildShared(c);
  const hasHeroPhoto = Boolean(c.heroPhoto && c.heroPhoto.url);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Miriam+Libre:wght@400;700&family=Assistant:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--onyx:#0E0E10;--onyx-elev:#18181B;--gold:#C9A961;--gold-deep:#A9843F;--cream:#F4EFE6;--line:rgba(201,169,97,.25);--muted:#B9B4A8;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--onyx);color:var(--cream);font-family:'Assistant',sans-serif;font-weight:300;line-height:1.7;-webkit-font-smoothing:antialiased;}
  a{color:inherit;}
  section{scroll-margin-top:76px;}
  .eyebrow{font-family:'Assistant',sans-serif;font-weight:600;font-size:11px;letter-spacing:.14em;color:var(--gold);text-transform:uppercase;margin-bottom:14px;}
  .section-title{font-family:'Miriam Libre',serif;font-size:clamp(24px,3.6vw,32px);font-weight:400;margin-bottom:10px;}
  .section-head{text-align:center;max-width:560px;margin:0 auto 40px;}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:500;font-size:13px;letter-spacing:.06em;text-decoration:none;padding:14px 30px;transition:background .2s ease,color .2s ease;white-space:nowrap;}
  .btn svg{width:15px;height:15px;}
  .btn--primary{background:transparent;color:var(--gold);border:1px solid var(--gold);}
  .btn--primary:hover{background:var(--gold);color:var(--onyx);}
  .btn--ghost{background:transparent;color:var(--cream);border:1px solid var(--line);}
  .btn--ghost:hover{border-color:var(--gold);color:var(--gold);}
  .btn--on-dark{background:transparent;color:var(--gold);border:1px solid var(--gold);}
  .btn--on-dark:hover{background:var(--gold);color:var(--onyx);}
  .btn--sm{padding:9px 20px;font-size:12px;}
  .wa-link{font-size:13px;color:var(--muted);text-decoration:none;border-bottom:1px solid var(--line);padding-bottom:2px;}
  .wa-link:hover{color:var(--gold);border-color:var(--gold);}
  .card{background:var(--onyx-elev);border:1px solid var(--line);padding:26px;transition:border-color .2s ease;}
  .card:hover{border-color:var(--gold);}
  .nav-wrap{position:sticky;top:0;z-index:30;background:rgba(14,14,16,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}
  .nav-toggle{display:none;}
  .nav-pill{max-width:1080px;margin:0 auto;padding:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'Miriam Libre',serif;font-weight:400;font-size:18px;letter-spacing:.04em;color:var(--gold);}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:1px solid var(--line);}
  .nav-burger span{width:18px;height:1px;background:var(--gold);display:block;}
  .nav-dropdown{display:none;flex-direction:column;border-top:1px solid var(--line);padding:8px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-size:14px;text-decoration:none;color:var(--cream);border-top:1px solid var(--line);}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{color:var(--gold);}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:32px;}
    .nav-desktop a{font-size:13px;letter-spacing:.03em;text-decoration:none;color:var(--muted);}
    .nav-desktop a:hover{color:var(--gold);}
  }
  .hero{position:relative;overflow:hidden;min-height:clamp(460px,72vh,680px);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;text-align:center;}
  .hero--fallback{background:var(--onyx);border-top:1px solid var(--line);border-bottom:1px solid var(--line);}
  .hero__scrim{position:absolute;inset:0;}
  .hero--photo .hero__scrim{background:linear-gradient(180deg,rgba(14,14,16,.35) 0%,rgba(14,14,16,.75) 100%);}
  .hero__inner{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:80px 24px;}
  .badge{display:inline-block;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:22px;padding-bottom:14px;border-bottom:1px solid var(--gold);}
  h1{font-family:'Miriam Libre',serif;font-size:clamp(30px,6.5vw,50px);font-weight:400;line-height:1.25;margin-bottom:22px;color:var(--cream);}
  .sub{font-size:16px;font-weight:300;color:var(--muted);max-width:52ch;margin:0 auto 34px;}
  .hero__ctas{display:flex;gap:20px;justify-content:center;align-items:center;flex-wrap:wrap;}
  .photo-placeholder{border:1px dashed var(--line);background:var(--onyx-elev);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#4A473F;}
  .photo-placeholder svg{width:32px;height:32px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;overflow:hidden;border:1px solid var(--line);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(14,14,16,.75);color:var(--gold);font-size:10px;line-height:1;padding:5px 9px;text-decoration:none;opacity:.85;border:1px solid var(--line);}
  .photo-credit:hover{opacity:1;}
  .about-band{max-width:900px;margin:0 auto;padding:64px 24px 8px;text-align:center;}
  .about p{font-size:17px;font-weight:300;color:var(--cream);max-width:64ch;margin:0 auto;}
  .about-photo{aspect-ratio:16/9;margin-top:36px;}
  .band{max-width:1080px;margin:0 auto;padding:70px 24px;}
  .featured-grid{display:grid;gap:2px;background:var(--line);}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(240px,1fr));}}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:16px;}
  .featured-card{background:var(--onyx);}
  .featured-card h3{font-family:'Miriam Libre',serif;font-size:18px;font-weight:400;margin-bottom:6px;}
  .featured-card p{font-size:14px;font-weight:300;color:var(--muted);margin-bottom:12px;}
  .featured-card .price{display:inline-block;font-size:13px;color:var(--gold);letter-spacing:.04em;}
  .props-grid{display:grid;gap:2px;background:var(--line);}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(240px,1fr));}}
  .prop{background:var(--onyx);text-align:center;}
  .num-badge{display:block;font-family:'Miriam Libre',serif;font-size:22px;color:var(--gold);margin-bottom:12px;}
  .prop h3{font-family:'Miriam Libre',serif;font-size:17px;font-weight:400;margin-bottom:6px;}
  .prop p{color:var(--muted);font-size:14px;font-weight:300;}
  .gallery-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:var(--line);}
  .gallery-tile{aspect-ratio:4/5;border:none;}
  .gallery-note{margin-top:20px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}
  .process-grid{display:grid;gap:2px;background:var(--line);}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{background:var(--onyx);text-align:center;}
  .step h3{font-family:'Miriam Libre',serif;font-size:17px;font-weight:400;margin-bottom:6px;}
  .step p{font-size:14px;font-weight:300;color:var(--muted);}
  .testimonials-grid{display:grid;gap:2px;background:var(--line);}
  @media (min-width:640px){.testimonials-grid{grid-template-columns:1fr 1fr;}}
  .testimonial{background:var(--onyx);text-align:center;}
  .testimonial p{font-family:'Miriam Libre',serif;font-size:19px;font-style:italic;font-weight:400;margin-bottom:16px;}
  .testimonial__author{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);}
  .testimonial--placeholder{background:transparent;border:1px dashed var(--line);}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#4A473F;}
  .faq-list{margin-top:0;max-width:720px;margin-inline:auto;}
  .faq__item{border-top:1px solid var(--line);padding:24px 0;text-align:center;}
  .faq__item h3{font-family:'Miriam Libre',serif;font-size:18px;font-weight:400;margin-bottom:8px;}
  .faq__item p{font-size:14px;font-weight:300;color:var(--muted);}
  .cta-band{max-width:900px;margin:0 auto;padding:8px 24px 80px;}
  .cta-panel{position:relative;overflow:hidden;padding:70px 28px;text-align:center;background-size:cover;background-position:center;border:1px solid var(--line);}
  .cta-panel--fallback{background:var(--onyx-elev);}
  .cta-panel__scrim{position:absolute;inset:0;}
  .cta-panel--photo .cta-panel__scrim{background:linear-gradient(180deg,rgba(14,14,16,.5) 0%,rgba(14,14,16,.85) 100%);}
  .cta-panel__content{position:relative;z-index:1;max-width:520px;margin:0 auto;}
  .cta-panel .badge{margin-bottom:22px;}
  .cta-panel h2{color:var(--cream);font-family:'Miriam Libre',serif;font-weight:400;font-size:clamp(26px,4.5vw,38px);margin-bottom:14px;}
  .cta-panel .cta-sub{color:var(--muted);margin-bottom:30px;font-size:15px;font-weight:300;}
  .cta-panel .cta-actions{display:flex;gap:20px;justify-content:center;align-items:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:20px;font-size:12px;color:#6B675C;}
  .site-footer{background:var(--onyx);border-top:1px solid var(--line);}
  .footer-top{max-width:1080px;margin:0 auto;padding:56px 24px 32px;display:grid;gap:32px;text-align:center;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;text-align:start;}}
  .footer-brand .nav__brand{color:var(--gold);}
  .footer-brand p{font-size:14px;font-weight:300;margin-top:12px;max-width:36ch;color:var(--muted);margin-inline:auto;}
  @media (min-width:680px){.footer-brand p{margin-inline:0;}}
  .footer-links{display:flex;flex-direction:column;gap:10px;align-items:center;}
  @media (min-width:680px){.footer-links{align-items:flex-start;}}
  .footer-links a{font-size:14px;text-decoration:none;color:var(--muted);}
  .footer-heading{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:#6B675C;margin-bottom:14px;}
  .social-icons{display:flex;gap:12px;margin-top:6px;flex-wrap:wrap;justify-content:center;}
  @media (min-width:680px){.social-icons{justify-content:flex-start;}}
  .social-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--gold);border:1px solid var(--line);text-decoration:none;transition:border-color .15s ease;}
  .social-icon:hover{border-color:var(--gold);}
  .social-icon--placeholder{color:#4A473F;}
  .footer-bottom{border-top:1px solid var(--line);}
  .footer-bottom-inner{max-width:1080px;margin:0 auto;padding:18px 24px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:12px;color:#6B675C;}
  .footer-bottom-inner a{color:var(--gold);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">קולקציה</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">קולקציה</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${hasHeroPhoto ? 'hero--photo' : 'hero--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim"></div>
    <div class="hero__inner">
      <span class="badge">חוויה יוקרתית</span>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn btn--ghost" href="#featured">לצפייה בקולקציה</a>
      </div>
    </div>
    ${hasHeroPhoto ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <p>${escapeHtml(c.about)}</p>
    ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">קולקציה</div>
      <h2 class="section-title">המומלצים שלנו</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="card featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c)}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="card prop"><span class="num-badge">${escapeHtml(String(i + 1).padStart(2, '0'))}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p) => `<div class="card step"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel ${hasHeroPhoto ? 'cta-panel--photo' : 'cta-panel--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
      <div class="cta-panel__scrim"></div>
      <div class="cta-panel__content">
        <span class="badge">ליצירת קשר</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${waHref ? `<a class="wa-link" href="${escapeHtml(waHref)}" target="_blank" rel="noopener">או בוואטסאפ</a>` : ''}
          ${appLinksHtml(c, 'wa-link')}
        </div>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט</div>
        <a href="#about">אודות</a>
        <a href="#featured">קולקציה</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// FRIENDLY — rounded, soft pastels, warm copy. Good fit for: healthcare,
// education, childcare. Varela Round (rounded display) + Heebo (body).
// Fully-rounded shapes are genuinely earned here (unlike defaulting to
// rounded-lg everywhere). Light footer throughout, not dark — friendliness
// stays approachable rather than borrowing the "dark footer" gravitas move
// every other style uses. Simple CSS-drawn blob shapes stand in for
// illustration, never hand-authored SVG art.
// ---------------------------------------------------------------
function friendlyTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);
  const hasHeroPhoto = Boolean(c.heroPhoto && c.heroPhoto.url);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Varela+Round&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--cream:#FFF8F0;--paper:#FFFFFF;--ink:#3A2E2A;--coral:#FF8B6B;--coral-deep:#F26B4D;--sky:#8FD3E8;--muted:#9C8B84;--line:#F2E4DA;--radius:22px;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--cream);color:var(--ink);font-family:'Heebo',sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased;}
  a{color:inherit;}
  section{scroll-margin-top:88px;}
  .eyebrow{font-family:'Heebo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.03em;color:var(--coral-deep);margin-bottom:8px;}
  .section-title{font-family:'Varela Round',sans-serif;font-size:clamp(21px,3.2vw,27px);margin-bottom:8px;}
  .section-head{text-align:center;max-width:560px;margin:0 auto 8px;}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:700;font-size:14px;text-decoration:none;padding:14px 26px;transition:transform .15s ease,box-shadow .15s ease;white-space:nowrap;}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--coral);color:#fff;box-shadow:0 10px 24px -8px rgba(242,107,77,.5);}
  .btn--primary:hover{transform:translateY(-2px) scale(1.02);}
  .btn--ghost{background:#fff;color:var(--ink);border:2px solid var(--sky);}
  .btn--ghost:hover{transform:translateY(-2px);}
  .btn--on-dark{background:#fff;color:var(--coral-deep);}
  .btn--on-dark:hover{transform:translateY(-2px) scale(1.02);}
  .btn--ghost-on-dark{background:rgba(255,255,255,.2);color:#fff;border:2px solid rgba(255,255,255,.5);}
  .btn--ghost-on-dark:hover{background:rgba(255,255,255,.3);}
  .btn--sm{padding:9px 18px;font-size:13px;}
  .card{background:#fff;border-radius:var(--radius);box-shadow:0 8px 24px -12px rgba(58,46,42,.12);padding:24px;transition:transform .18s ease;}
  .card:hover{transform:translateY(-4px) rotate(-0.5deg);}
  .nav-wrap{position:sticky;top:0;z-index:30;padding:14px 16px 0;}
  .nav-toggle{display:none;}
  .nav-pill{max-width:960px;margin:0 auto;background:rgba(255,248,240,.9);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:999px;box-shadow:0 8px 24px -10px rgba(58,46,42,.15);padding:10px 10px 10px 22px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'Varela Round',sans-serif;font-size:17px;color:var(--ink);}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;background:#fff;border-radius:50%;box-shadow:0 4px 10px -4px rgba(58,46,42,.2);}
  .nav-burger span{width:18px;height:2px;background:var(--ink);border-radius:2px;display:block;}
  .nav-dropdown{display:none;flex-direction:column;max-width:960px;margin:8px auto 0;background:#fff;border-radius:var(--radius);box-shadow:0 8px 24px -10px rgba(58,46,42,.18);padding:10px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 16px;border-radius:14px;font-size:15px;font-weight:600;text-decoration:none;color:var(--ink);}
  .nav-dropdown a.nav-cta{color:#fff;background:var(--coral);text-align:center;margin-top:4px;}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:20px;}
    .nav-desktop a{font-size:14px;font-weight:600;text-decoration:none;color:var(--ink);}
  }
  .hero{position:relative;overflow:hidden;min-height:clamp(420px,58vh,560px);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;text-align:center;}
  .hero--fallback{background:var(--cream);}
  .hero__scrim{position:absolute;inset:0;}
  .hero--photo .hero__scrim{background:rgba(242,107,77,.28);}
  .hero--fallback .hero__scrim::before,.hero--fallback .hero__scrim::after{content:"";position:absolute;border-radius:50%;}
  .hero--fallback .hero__scrim::before{width:280px;height:280px;background:rgba(255,139,107,.18);top:-60px;inset-inline-end:-60px;}
  .hero--fallback .hero__scrim::after{width:220px;height:220px;background:rgba(143,211,232,.22);bottom:-40px;inset-inline-start:-40px;}
  .hero__inner{position:relative;z-index:1;max-width:680px;margin:0 auto;padding:56px 20px;}
  .badge{display:inline-flex;align-items:center;gap:7px;background:#fff;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:700;color:var(--coral-deep);margin-bottom:20px;box-shadow:0 6px 16px -8px rgba(58,46,42,.2);transform:rotate(-2deg);}
  .badge__dot{width:7px;height:7px;border-radius:50%;background:#3FAE5C;}
  h1{font-family:'Varela Round',sans-serif;font-size:clamp(28px,6.5vw,44px);line-height:1.25;margin-bottom:16px;color:var(--ink);}
  .hero--photo h1{color:#fff;}
  .sub{font-size:16px;color:var(--ink);opacity:.75;max-width:50ch;margin:0 auto 28px;}
  .hero--photo .sub{color:#fff;opacity:.92;}
  .hero__ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .photo-placeholder{border:2px dashed #E8D3C4;border-radius:var(--radius);background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#D9C4B4;}
  .photo-placeholder svg{width:34px;height:34px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;border-radius:var(--radius);overflow:hidden;box-shadow:0 10px 26px -12px rgba(58,46,42,.18);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(58,46,42,.6);color:#fff;font-size:10px;padding:5px 9px;border-radius:999px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}
  .about-band{max-width:960px;margin:0 auto;padding:36px 20px 8px;}
  .about-grid{display:grid;gap:24px;}
  .about p{font-size:16px;color:var(--ink);text-align:center;max-width:60ch;margin:0 auto;}
  .about-photo{aspect-ratio:4/3;}
  @media (min-width:760px){.about-grid{grid-template-columns:1fr 1fr;align-items:center;}.about p{text-align:start;margin:0;}}
  .band{max-width:960px;margin:0 auto;padding:52px 20px;}
  .featured-grid{display:grid;gap:18px;margin-top:26px;}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr));}}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:14px;border-radius:16px;}
  .featured-card h3{font-family:'Varela Round',sans-serif;font-size:16px;margin-bottom:6px;}
  .featured-card p{font-size:14px;color:var(--muted);margin-bottom:10px;}
  .featured-card .price{display:inline-block;font-weight:700;font-size:13px;color:var(--coral-deep);background:var(--cream);border-radius:999px;padding:4px 12px;}
  .props-grid{display:grid;gap:18px;margin-top:26px;}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(200px,1fr));}}
  .prop{text-align:center;}
  .num-badge{width:44px;height:44px;border-radius:50%;background:var(--sky);color:#fff;font-family:'Varela Round',sans-serif;font-size:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;}
  .prop:nth-child(2n) .num-badge{background:var(--coral);}
  .prop h3{font-family:'Varela Round',sans-serif;font-size:16px;margin-bottom:4px;}
  .prop p{color:var(--muted);font-size:14px;}
  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:26px;}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:1/1;border-radius:18px;}
  .gallery-note{margin-top:16px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}
  .process-grid{display:grid;gap:18px;margin-top:26px;}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{text-align:center;padding:24px 18px;}
  .step .num-badge{margin:0 auto 12px;}
  .step h3{font-family:'Varela Round',sans-serif;font-size:15px;margin-bottom:4px;}
  .step p{font-size:14px;color:var(--muted);}
  .testimonials-grid{display:grid;gap:18px;margin-top:26px;}
  @media (min-width:560px){.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .testimonial{border-end-end-radius:6px;}
  .testimonial p{font-size:15px;color:var(--ink);margin-bottom:12px;}
  .testimonial__author{font-size:13px;font-weight:700;color:var(--coral-deep);}
  .testimonial--placeholder{border:2px dashed #E8D3C4;box-shadow:none;background:transparent;}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#D9C4B4;}
  .faq-list{margin-top:26px;max-width:700px;margin-inline:auto;}
  .faq__item{background:#fff;border-radius:18px;box-shadow:0 6px 18px -10px rgba(58,46,42,.12);padding:18px 20px;margin-bottom:12px;}
  .faq__item h3{font-family:'Varela Round',sans-serif;font-size:15px;margin-bottom:6px;}
  .faq__item p{font-size:14px;color:var(--muted);}
  .cta-band{max-width:960px;margin:0 auto;padding:8px 20px 56px;}
  .cta-panel{position:relative;overflow:hidden;border-radius:32px;background:linear-gradient(135deg,var(--coral) 0%,var(--coral-deep) 100%);padding:52px 26px;text-align:center;}
  .cta-panel::before,.cta-panel::after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.15);}
  .cta-panel::before{width:180px;height:180px;top:-50px;inset-inline-start:-40px;}
  .cta-panel::after{width:140px;height:140px;bottom:-40px;inset-inline-end:-30px;}
  .cta-panel__content{position:relative;z-index:1;max-width:500px;margin:0 auto;}
  .cta-panel .badge{background:rgba(255,255,255,.25);color:#fff;box-shadow:none;}
  .cta-panel h2{color:#fff;font-family:'Varela Round',sans-serif;font-size:clamp(24px,4.4vw,32px);margin-bottom:12px;}
  .cta-panel .cta-sub{color:rgba(255,255,255,.9);margin-bottom:24px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:16px;font-size:12px;color:rgba(255,255,255,.75);}
  .site-footer{background:#fff;border-top:1px solid var(--line);}
  .footer-top{max-width:960px;margin:0 auto;padding:44px 20px 26px;display:grid;gap:26px;text-align:center;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;text-align:start;}}
  .footer-brand .nav__brand{color:var(--ink);}
  .footer-brand p{font-size:14px;margin-top:8px;max-width:36ch;color:var(--muted);margin-inline:auto;}
  @media (min-width:680px){.footer-brand p{margin-inline:0;}}
  .footer-links{display:flex;flex-direction:column;gap:8px;align-items:center;}
  @media (min-width:680px){.footer-links{align-items:flex-start;}}
  .footer-links a{font-size:14px;color:var(--ink);text-decoration:none;}
  .footer-heading{font-size:12px;font-weight:700;color:var(--coral-deep);margin-bottom:10px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;justify-content:center;}
  @media (min-width:680px){.social-icons{justify-content:flex-start;}}
  .social-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--coral-deep);background:var(--cream);text-decoration:none;}
  .social-icon--placeholder{color:#D9C4B4;}
  .footer-bottom{border-top:1px solid var(--line);}
  .footer-bottom-inner{max-width:960px;margin:0 auto;padding:16px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:13px;color:var(--muted);}
  .footer-bottom-inner a{font-weight:700;color:var(--coral-deep);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${hasHeroPhoto ? 'hero--photo' : 'hero--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim"></div>
    <div class="hero__inner">
      <span class="badge"><span class="badge__dot"></span>שמחים לעזור לכם</span>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn btn--ghost" href="#featured">לראות מה מציעים</a>
      </div>
    </div>
    ${hasHeroPhoto ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">שירותים</div>
      <h2 class="section-title">מה אנחנו מציעים</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="card featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c)}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="prop"><span class="num-badge">${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p, i) => `<div class="step"><span class="num-badge">${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel">
      <div class="cta-panel__content">
        <span class="badge">בואו נכיר</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${appLinksHtml(c)}
          ${waCtaButton}
        </div>
        <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// BOLD & VIBRANT — bright colors, huge type, high energy. Good fit for:
// startups, gyms, marketing agencies. Secular One (geometric display) +
// Assistant (body). Deliberately distinct from the existing dark/acid-green
// "bold" tech style: this one is light-background, multi-hue, and uses
// hard-offset neo-brutalist shadows instead of soft glow — no purple-blue
// gradient hero, no rounded-lg-everywhere default.
// ---------------------------------------------------------------
function boldVibrantTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);
  const hasHeroPhoto = Boolean(c.heroPhoto && c.heroPhoto.url);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Secular+One&family=Assistant:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root{--ink:#150A1F;--paper:#FFFFFF;--magenta:#FF3D71;--indigo:#5B21B6;--amber:#FFC93C;--muted:#6B6270;--line:#EAE3F0;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#fff;color:var(--ink);font-family:'Assistant',sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;}
  a{color:inherit;}
  section{scroll-margin-top:76px;}
  .eyebrow{font-family:'Assistant',sans-serif;font-weight:800;font-size:13px;letter-spacing:.02em;color:var(--magenta);text-transform:uppercase;margin-bottom:10px;}
  .section-title{font-family:'Secular One',sans-serif;font-size:clamp(24px,3.8vw,32px);margin-bottom:8px;}
  .section-head{text-align:center;max-width:560px;margin:0 auto 8px;}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:800;font-size:14px;text-decoration:none;padding:14px 28px;transition:transform .12s ease;white-space:nowrap;border:2px solid var(--ink);}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--magenta);color:#fff;box-shadow:4px 4px 0 var(--ink);}
  .btn--primary:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink);}
  .btn--ghost{background:#fff;color:var(--ink);box-shadow:4px 4px 0 var(--indigo);}
  .btn--ghost:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--indigo);}
  .btn--on-dark{background:var(--amber);color:var(--ink);box-shadow:4px 4px 0 rgba(255,255,255,.4);}
  .btn--on-dark:hover{transform:translate(-2px,-2px);}
  .btn--ghost-on-dark{background:transparent;color:#fff;border-color:#fff;box-shadow:4px 4px 0 rgba(255,255,255,.3);}
  .btn--ghost-on-dark:hover{transform:translate(-2px,-2px);}
  .btn--sm{padding:9px 18px;font-size:13px;box-shadow:3px 3px 0 var(--ink);}
  .card{background:#fff;border:2px solid var(--ink);border-radius:16px;padding:22px;box-shadow:5px 5px 0 var(--indigo);transition:transform .15s ease,box-shadow .15s ease;}
  .card:nth-child(3n+2){box-shadow:5px 5px 0 var(--magenta);}
  .card:nth-child(3n){box-shadow:5px 5px 0 var(--amber);}
  .card:hover{transform:translate(-3px,-3px);}
  .nav-wrap{position:sticky;top:0;z-index:30;background:#fff;border-bottom:3px solid var(--ink);}
  .nav-toggle{display:none;}
  .nav-pill{max-width:1080px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'Secular One',sans-serif;font-size:19px;color:var(--ink);}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:2px solid var(--ink);border-radius:8px;}
  .nav-burger span{width:18px;height:2px;background:var(--ink);display:block;}
  .nav-dropdown{display:none;flex-direction:column;border-top:3px solid var(--ink);padding:8px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-size:14px;font-weight:700;text-decoration:none;color:var(--ink);border-top:1px solid var(--line);}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{color:var(--magenta);}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:26px;}
    .nav-desktop a{font-size:14px;font-weight:700;text-decoration:none;color:var(--ink);}
    .nav-desktop a:hover{color:var(--magenta);}
  }
  .hero{position:relative;overflow:hidden;min-height:clamp(440px,62vh,600px);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;text-align:center;}
  .hero--fallback{background:var(--indigo);}
  .hero__scrim{position:absolute;inset:0;}
  .hero--photo .hero__scrim{background:linear-gradient(135deg,rgba(91,33,182,.7) 0%,rgba(255,61,113,.55) 100%);}
  .hero--fallback .hero__scrim{background:linear-gradient(135deg,var(--indigo) 0%,var(--magenta) 100%);clip-path:polygon(0 0,100% 0,100% 82%,0 100%);}
  .hero__inner{position:relative;z-index:1;max-width:760px;margin:0 auto;padding:64px 20px;}
  .badge{display:inline-flex;align-items:center;gap:7px;background:var(--amber);border:2px solid var(--ink);border-radius:999px;padding:7px 16px;font-size:12px;font-weight:800;color:var(--ink);margin-bottom:22px;}
  .badge__dot{width:7px;height:7px;border-radius:50%;background:var(--ink);}
  h1{font-family:'Secular One',sans-serif;font-size:clamp(32px,7.5vw,56px);line-height:1.1;margin-bottom:20px;color:#fff;}
  .sub{font-size:17px;color:rgba(255,255,255,.92);max-width:52ch;margin:0 auto 30px;}
  .hero__ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
  .photo-placeholder{border:2px dashed var(--indigo);border-radius:16px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#C4B9D6;}
  .photo-placeholder svg{width:34px;height:34px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;border-radius:16px;overflow:hidden;border:2px solid var(--ink);box-shadow:6px 6px 0 var(--amber);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(21,10,31,.7);color:#fff;font-size:10px;padding:5px 9px;border-radius:999px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}
  .about-band{max-width:1040px;margin:0 auto;padding:60px 20px 8px;}
  .about-grid{display:grid;gap:24px;}
  .about p{font-size:17px;color:var(--ink);text-align:center;max-width:62ch;margin:0 auto;}
  .about-photo{aspect-ratio:4/3;}
  @media (min-width:760px){.about-grid{grid-template-columns:1fr 1fr;align-items:center;}.about p{text-align:start;margin:0;}}
  .band{max-width:1040px;margin:0 auto;padding:60px 20px;}
  .featured-grid{display:grid;gap:20px;margin-top:30px;}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:14px;border-radius:12px;}
  .featured-card h3{font-family:'Secular One',sans-serif;font-size:17px;margin-bottom:6px;}
  .featured-card p{font-size:14px;color:var(--muted);margin-bottom:10px;}
  .featured-card .price{display:inline-block;font-weight:800;font-size:14px;color:var(--magenta);}
  .props-grid{display:grid;gap:20px;margin-top:30px;}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr));}}
  .prop{display:flex;flex-direction:column;gap:12px;}
  .num-badge{flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:var(--magenta);border:2px solid var(--ink);color:#fff;font-family:'Secular One',sans-serif;font-size:16px;display:flex;align-items:center;justify-content:center;}
  .prop:nth-child(2n) .num-badge{background:var(--indigo);}
  .prop:nth-child(3n) .num-badge{background:var(--amber);color:var(--ink);}
  .prop h3{font-family:'Secular One',sans-serif;font-size:16px;margin-bottom:4px;}
  .prop p{color:var(--muted);font-size:14px;}
  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-top:30px;}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:1/1;border-radius:14px;}
  .gallery-note{margin-top:16px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}
  .process-grid{display:grid;gap:20px;margin-top:30px;}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{text-align:center;padding:24px 18px;}
  .step .num-badge{margin:0 auto 14px;}
  .step h3{font-family:'Secular One',sans-serif;font-size:16px;margin-bottom:4px;}
  .step p{font-size:14px;color:var(--muted);}
  .testimonials-grid{display:grid;gap:20px;margin-top:30px;}
  @media (min-width:560px){.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .testimonial p{font-size:16px;color:var(--ink);margin-bottom:14px;position:relative;}
  .testimonial p::before{content:'"';font-family:'Secular One',sans-serif;font-size:40px;color:var(--amber);display:block;line-height:.6;margin-bottom:6px;}
  .testimonial__author{font-size:13px;font-weight:800;color:var(--magenta);}
  .testimonial--placeholder{border:2px dashed var(--indigo);box-shadow:none;background:transparent;}
  .testimonial--placeholder p::before{color:#E3DAEE;}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#C4B9D6;}
  .faq-list{margin-top:30px;max-width:760px;margin-inline:auto;}
  .faq__item{background:#fff;border:2px solid var(--ink);border-radius:14px;padding:18px 20px;margin-bottom:14px;box-shadow:4px 4px 0 var(--amber);}
  .faq__item:nth-child(2n){box-shadow:4px 4px 0 var(--magenta);}
  .faq__item h3{font-family:'Secular One',sans-serif;font-size:16px;margin-bottom:6px;}
  .faq__item p{font-size:14px;color:var(--muted);}
  .cta-band{max-width:1040px;margin:0 auto;padding:8px 20px 64px;}
  .cta-panel{position:relative;overflow:hidden;border-radius:20px;padding:60px 28px;text-align:center;border:3px solid var(--ink);background-size:cover;background-position:center;}
  .cta-panel--fallback{background:linear-gradient(135deg,var(--magenta) 0%,var(--indigo) 100%);}
  .cta-panel__scrim{position:absolute;inset:0;}
  .cta-panel--photo .cta-panel__scrim{background:linear-gradient(135deg,rgba(91,33,182,.75) 0%,rgba(255,61,113,.6) 100%);}
  .cta-panel__content{position:relative;z-index:1;max-width:520px;margin:0 auto;}
  .cta-panel .badge{margin-bottom:18px;}
  .cta-panel h2{color:#fff;font-family:'Secular One',sans-serif;font-size:clamp(28px,5vw,42px);margin-bottom:12px;}
  .cta-panel .cta-sub{color:rgba(255,255,255,.9);margin-bottom:28px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:18px;font-size:12px;color:rgba(255,255,255,.75);}
  .site-footer{background:var(--ink);color:rgba(255,255,255,.75);}
  .footer-top{max-width:1040px;margin:0 auto;padding:52px 20px 32px;display:grid;gap:32px;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;}}
  .footer-brand .nav__brand{color:#fff;}
  .footer-brand p{font-size:14px;margin-top:10px;max-width:36ch;color:rgba(255,255,255,.6);}
  .footer-links{display:flex;flex-direction:column;gap:10px;}
  .footer-links a{font-size:14px;text-decoration:none;color:rgba(255,255,255,.75);}
  .footer-links a:hover{color:var(--amber);}
  .footer-heading{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--amber);margin-bottom:12px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  .social-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--ink);background:#fff;text-decoration:none;transition:transform .15s ease;}
  .social-icon:hover{transform:translateY(-2px);}
  .social-icon--placeholder{background:rgba(255,255,255,.1);color:rgba(255,255,255,.3);}
  .footer-bottom{border-top:1px solid rgba(255,255,255,.15);}
  .footer-bottom-inner{max-width:1040px;margin:0 auto;padding:18px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.6);}
  .footer-bottom-inner a{font-weight:700;color:var(--amber);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${hasHeroPhoto ? 'hero--photo' : 'hero--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim"></div>
    <div class="hero__inner">
      <span class="badge"><span class="badge__dot"></span>מוכנים לזוז</span>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn btn--ghost" href="#featured">לראות מה מציעים</a>
      </div>
    </div>
    ${hasHeroPhoto ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">שירותים</div>
      <h2 class="section-title">מה אנחנו מציעים</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="card featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c)}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="prop"><span class="num-badge">${i + 1}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p, i) => `<div class="step"><span class="num-badge">${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel ${hasHeroPhoto ? 'cta-panel--photo' : 'cta-panel--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
      <div class="cta-panel__scrim"></div>
      <div class="cta-panel__content">
        <span class="badge"><span class="badge__dot"></span>בואו נתחיל</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${appLinksHtml(c)}
          ${waCtaButton}
        </div>
        <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// EDITORIAL — magazine-like layout, storytelling, large images, long-form
// feel. Good fit for: personal brands, writers, photographers, blogs.
// Tinos (a serif built for print-like text) for headings/body copy +
// Heebo for labels/UI chrome. Masthead-style nav (centered wordmark, rules
// above/below like a newspaper). Hero puts the photo ABOVE the headline
// (not behind it as a cover image) — a deliberately different hero
// mechanic from every other style in this file. Alternating photo/text
// story rows instead of a symmetric grid. Burgundy is the single accent.
// ---------------------------------------------------------------
function editorialTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--ink:#1C1A17;--paper:#FBF9F6;--burgundy:#7A2331;--rule:#D8D2C6;--muted:#7A756B;--radius:2px;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--paper);color:var(--ink);font-family:'Tinos',serif;line-height:1.7;}
  a{color:inherit;}
  section{scroll-margin-top:70px;}
  .eyebrow{font-family:'Heebo',sans-serif;font-weight:700;font-size:11px;letter-spacing:.14em;color:var(--burgundy);text-transform:uppercase;margin-bottom:10px;}
  .section-title{font-family:'Tinos',serif;font-style:italic;font-size:clamp(26px,4vw,36px);margin-bottom:8px;}
  .section-head{max-width:640px;margin:0 auto 8px;text-align:center;}
  .rule{height:1px;background:var(--rule);}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-family:'Heebo',sans-serif;font-weight:600;font-size:14px;text-decoration:none;padding:13px 26px;border-radius:var(--radius);transition:opacity .15s ease;white-space:nowrap;}
  .btn svg{width:15px;height:15px;}
  .btn--primary{background:var(--burgundy);color:#fff;}
  .btn--primary:hover{opacity:.85;}
  .btn--ghost{background:transparent;color:var(--ink);border:1px solid var(--ink);}
  .btn--ghost:hover{background:var(--ink);color:var(--paper);}
  .btn--on-dark{background:var(--paper);color:var(--ink);}
  .btn--on-dark:hover{opacity:.85;}
  .btn--ghost-on-dark{background:transparent;color:var(--ink);border:1px solid var(--ink);}
  .btn--ghost-on-dark:hover{background:var(--ink);color:var(--paper);}
  .btn--sm{padding:9px 18px;font-size:13px;}
  .badge{display:inline-flex;align-items:center;gap:7px;font-family:'Heebo',sans-serif;font-size:12px;font-weight:500;color:var(--muted);border:1px solid var(--rule);padding:6px 14px;margin-bottom:14px;}
  .wa-link{display:inline-flex;align-items:center;gap:7px;font-family:'Heebo',sans-serif;font-size:14px;font-weight:600;text-decoration:underline;text-underline-offset:3px;color:inherit;}
  .nav-wrap{position:sticky;top:0;z-index:30;background:var(--paper);border-bottom:3px double var(--ink);}
  .nav-toggle{display:none;}
  .nav-masthead{max-width:1080px;margin:0 auto;padding:20px 20px 14px;text-align:center;position:relative;}
  .nav__brand{font-family:'Tinos',serif;font-style:italic;font-size:26px;letter-spacing:.01em;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;position:absolute;inset-inline-start:20px;top:22px;padding:6px;}
  .nav-burger span{width:20px;height:1px;background:var(--ink);display:block;}
  .nav-dropdown{display:none;flex-direction:column;border-top:1px solid var(--rule);padding:8px 20px 16px;gap:2px;text-align:center;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:12px 4px;font-family:'Heebo',sans-serif;font-size:14px;font-weight:500;text-decoration:none;color:var(--ink);}
  .nav-dropdown a.nav-cta{color:var(--burgundy);font-weight:700;}
  .nav-rule-bottom{height:1px;background:var(--rule);}
  .nav-desktop{display:none;}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-masthead{padding-bottom:16px;}
    .nav-desktop{display:flex;align-items:center;justify-content:center;gap:28px;margin-top:12px;font-family:'Heebo',sans-serif;}
    .nav-desktop a{font-size:13px;font-weight:500;text-decoration:none;color:var(--muted);letter-spacing:.02em;}
    .nav-desktop a:hover{color:var(--burgundy);}
  }
  .hero{max-width:900px;margin:0 auto;padding:44px 20px 20px;text-align:center;}
  .hero-photo{aspect-ratio:16/9;margin-bottom:36px;}
  h1{font-family:'Tinos',serif;font-weight:700;font-size:clamp(30px,6vw,50px);line-height:1.18;margin-bottom:18px;}
  .sub{font-size:18px;color:var(--muted);font-style:italic;max-width:56ch;margin:0 auto 28px;}
  .hero__ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
  .photo-placeholder{border:1px solid var(--rule);background:#F2EEE6;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#B7AF9E;border-radius:var(--radius);}
  .photo-placeholder svg{width:32px;height:32px;}
  .photo-placeholder span{font-family:'Heebo',sans-serif;font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;border-radius:var(--radius);overflow:hidden;}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(28,26,23,.65);color:#fff;font-family:'Heebo',sans-serif;font-size:10px;padding:4px 9px;border-radius:2px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}
  .about-band{max-width:900px;margin:0 auto;padding:52px 20px;border-top:1px solid var(--rule);}
  .story-row{display:grid;gap:22px;align-items:center;margin-bottom:44px;}
  .story-row:last-child{margin-bottom:0;}
  .story-photo{aspect-ratio:4/3;}
  .story-row p{font-size:17px;color:var(--ink);}
  @media (min-width:700px){
    .story-row{grid-template-columns:1fr 1fr;gap:40px;}
    .story-row.reverse .story-photo{order:2;}
  }
  .band{max-width:1000px;margin:0 auto;padding:52px 20px;border-top:1px solid var(--rule);}
  .featured-list{margin-top:34px;display:flex;flex-direction:column;}
  .featured-row{display:grid;grid-template-columns:1fr auto;gap:6px 16px;padding:20px 0;border-top:1px solid var(--rule);align-items:baseline;}
  .featured-row:last-child{border-bottom:1px solid var(--rule);}
  .featured-row h3{font-family:'Tinos',serif;font-size:19px;}
  .featured-row .price{font-family:'Heebo',sans-serif;font-weight:700;color:var(--burgundy);}
  .featured-row p{grid-column:1/-1;color:var(--muted);font-size:15px;max-width:60ch;}
  .props-grid{display:grid;gap:30px;margin-top:34px;}
  @media (min-width:640px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .prop{border-top:1px solid var(--rule);padding-top:16px;}
  .prop-num{font-family:'Heebo',sans-serif;font-size:11px;font-weight:700;color:var(--burgundy);letter-spacing:.1em;margin-bottom:8px;display:block;}
  .prop h3{font-family:'Tinos',serif;font-size:18px;margin-bottom:6px;}
  .prop p{color:var(--muted);font-size:15px;}
  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:4px;margin-top:34px;}
  @media (min-width:600px){.gallery-grid{grid-template-columns:repeat(4,1fr);}}
  .gallery-tile{aspect-ratio:3/4;border-radius:0;}
  .gallery-note{margin-top:16px;font-family:'Heebo',sans-serif;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}
  .process-list{max-width:640px;margin:34px auto 0;}
  .step{display:grid;grid-template-columns:auto 1fr;gap:16px;padding:18px 0;border-top:1px solid var(--rule);}
  .step:last-child{border-bottom:1px solid var(--rule);}
  .step-num{font-family:'Tinos',serif;font-style:italic;font-size:22px;color:var(--burgundy);}
  .step h3{font-family:'Tinos',serif;font-size:17px;margin-bottom:4px;}
  .step p{color:var(--muted);font-size:15px;}
  .testimonials-grid{display:grid;gap:30px;margin-top:34px;max-width:760px;margin-inline:auto;}
  .testimonial{text-align:center;}
  .testimonial p{font-family:'Tinos',serif;font-style:italic;font-size:20px;color:var(--ink);margin-bottom:14px;}
  .testimonial__author{font-family:'Heebo',sans-serif;font-size:12px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--burgundy);}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#C3BCAC;}
  .faq-list{margin-top:34px;max-width:720px;margin-inline:auto;}
  .faq__item{padding:20px 0;border-top:1px solid var(--rule);}
  .faq__item:last-child{border-bottom:1px solid var(--rule);}
  .faq__item h3{font-family:'Tinos',serif;font-size:18px;margin-bottom:6px;}
  .faq__item p{color:var(--muted);font-size:15px;}
  .cta-band{max-width:760px;margin:0 auto;padding:60px 20px 70px;border-top:1px solid var(--rule);text-align:center;}
  .cta-band .eyebrow{justify-content:center;display:flex;}
  .cta-band h2{font-family:'Tinos',serif;font-style:italic;font-size:clamp(28px,5vw,40px);margin-bottom:14px;}
  .cta-band .cta-sub{color:var(--muted);margin-bottom:30px;font-size:16px;}
  .cta-band .cta-actions{display:flex;gap:20px;justify-content:center;align-items:center;flex-wrap:wrap;}
  .cta-band .cta-microcopy{margin-top:20px;font-family:'Heebo',sans-serif;font-size:12px;color:var(--muted);}
  .site-footer{background:var(--ink);color:rgba(251,249,246,.72);}
  .footer-top{max-width:1000px;margin:0 auto;padding:50px 20px 28px;display:grid;gap:30px;text-align:center;}
  .footer-brand .nav__brand{color:var(--paper);}
  .footer-brand p{font-family:'Heebo',sans-serif;font-size:13px;margin-top:10px;max-width:44ch;margin-inline:auto;color:rgba(251,249,246,.55);}
  .footer-links{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-family:'Heebo',sans-serif;}
  .footer-links a{font-size:13px;text-decoration:none;color:rgba(251,249,246,.72);}
  .footer-links a:hover{color:var(--paper);}
  .social-icons{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
  .social-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--paper);background:rgba(251,249,246,.12);text-decoration:none;transition:background .15s ease;}
  .social-icon:hover{background:var(--burgundy);}
  .social-icon--placeholder{color:rgba(251,249,246,.25);}
  .footer-bottom{border-top:1px solid rgba(251,249,246,.15);}
  .footer-bottom-inner{max-width:1000px;margin:0 auto;padding:16px 20px;text-align:center;font-family:'Heebo',sans-serif;font-size:12px;color:rgba(251,249,246,.5);}
  .footer-bottom-inner a{font-weight:600;color:var(--paper);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-masthead">
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
    <div class="nav-rule-bottom"></div>
  </div>

  <section class="hero">
    ${photoBlock(c.heroPhoto, 'hero-photo', c.businessName)}
    <div class="eyebrow" style="justify-content:center;display:flex;">הסיפור שלנו</div>
    <h1>${escapeHtml(c.headline)}</h1>
    <p class="sub">${escapeHtml(c.subheadline)}</p>
    ${eventDetailsHtml(c)}
    <div class="hero__ctas">
      <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
      <a class="btn btn--ghost" href="#featured">לקרוא עוד</a>
    </div>
  </section>

  <section class="about-band" id="about">
    <div class="story-row">
      ${photoBlock(c.aboutPhoto, 'story-photo', c.businessName)}
      <p>${escapeHtml(c.about)}</p>
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow" style="justify-content:center;display:flex;">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow" style="justify-content:center;display:flex;">מה מציעים</div>
      <h2 class="section-title">נקודות ציון</h2>
    </div>
    <div class="featured-list">
      ${valuePropsHtml(c.featured, (f) => `<div class="featured-row"><h3>${escapeHtml(f.name)}</h3>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : '<span></span>'}<p>${escapeHtml(f.description)}</p></div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c, 'faq__item', 'faq-list')}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow" style="justify-content:center;display:flex;">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="prop"><span class="prop-num">${String(i + 1).padStart(2, '0')}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow" style="justify-content:center;display:flex;">גלריה</div>
      <h2 class="section-title">רגעים נבחרים</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow" style="justify-content:center;display:flex;">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-list">
      ${valuePropsHtml(c.process, (p, i) => `<div class="step"><span class="step-num">${i + 1}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow" style="justify-content:center;display:flex;">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow" style="justify-content:center;display:flex;">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="eyebrow">בואו נתחיל</div>
    <h2>${escapeHtml(c.ctaHeadline)}</h2>
    <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
    <div class="cta-actions">
      <a class="btn btn--primary" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      ${appLinksHtml(c)}
      ${waCtaButton}
    </div>
    <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="social-icons">
        ${phoneIcon}
        ${waIcon}
        ${instaIcon}
        ${fbIcon}
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span> · <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// PLAYFUL — illustrations, motion, bright palette. Good fit for: kids,
// entertainment, creative businesses. Suez One (chunky rounded display) +
// Heebo. Multi-hue palette (not one accent) with sticker-style rotated
// cards and CSS-only dot/blob decorations. Distinct from "friendly": that
// style is soft/pastel and calm; this one is loud, saturated, and treats
// every card like a sticker on a corkboard (varied rotation, not a single
// gentle tilt-on-hover).
// ---------------------------------------------------------------
function playfulTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);
  const hasHeroPhoto = Boolean(c.heroPhoto && c.heroPhoto.url);

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Suez+One&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--ink:#241E33;--paper:#FFFDF7;--pink:#FF5FA2;--yellow:#FFD23F;--teal:#2EC4B6;--purple:#8C54FF;--muted:#6E6680;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--paper);color:var(--ink);font-family:'Heebo',sans-serif;line-height:1.65;position:relative;overflow-x:hidden;}
  a{color:inherit;}
  section{scroll-margin-top:76px;position:relative;}
  .eyebrow{font-family:'Heebo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.03em;color:var(--pink);text-transform:uppercase;margin-bottom:10px;}
  .section-title{font-family:'Suez One',sans-serif;font-size:clamp(24px,4vw,32px);margin-bottom:8px;}
  .section-head{text-align:center;max-width:560px;margin:0 auto 8px;}
  .blob{position:absolute;border-radius:50%;filter:blur(2px);opacity:.5;z-index:0;pointer-events:none;}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:999px;font-weight:700;font-size:15px;text-decoration:none;padding:14px 28px;transition:transform .15s ease;white-space:nowrap;position:relative;z-index:1;}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--pink);color:#fff;box-shadow:0 6px 0 #C93E7E;}
  .btn--primary:hover{transform:translateY(-3px);}
  .btn--primary:active{transform:translateY(0);box-shadow:0 2px 0 #C93E7E;}
  .btn--ghost{background:#fff;color:var(--ink);border:3px solid var(--ink);box-shadow:0 6px 0 var(--ink);}
  .btn--ghost:hover{transform:translateY(-3px);}
  .btn--on-dark{background:var(--yellow);color:var(--ink);box-shadow:0 6px 0 #C79A1E;}
  .btn--on-dark:hover{transform:translateY(-3px);}
  .btn--ghost-on-dark{background:transparent;color:#fff;border:3px solid #fff;}
  .btn--ghost-on-dark:hover{transform:translateY(-3px);}
  .btn--sm{padding:9px 18px;font-size:13px;box-shadow:0 4px 0 #C93E7E;}
  .card{background:#fff;border:3px solid var(--ink);border-radius:20px;padding:22px;box-shadow:0 6px 0 var(--ink);position:relative;z-index:1;}
  .card:nth-child(4n+1){transform:rotate(-1.5deg);}
  .card:nth-child(4n+2){transform:rotate(1deg);}
  .card:nth-child(4n+3){transform:rotate(-.8deg);}
  .card:nth-child(4n+4){transform:rotate(1.6deg);}
  .card:hover{transform:rotate(0deg) translateY(-4px);}
  .nav-wrap{position:sticky;top:0;z-index:30;background:var(--paper);border-bottom:3px solid var(--ink);}
  .nav-toggle{display:none;}
  .nav-pill{max-width:1080px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-family:'Suez One',sans-serif;font-size:20px;color:var(--ink);}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:3px solid var(--ink);border-radius:10px;background:var(--yellow);}
  .nav-burger span{width:18px;height:2px;background:var(--ink);display:block;}
  .nav-dropdown{display:none;flex-direction:column;border-top:3px solid var(--ink);padding:8px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-size:14px;font-weight:600;text-decoration:none;color:var(--ink);border-top:1px dashed #E3DEEF;}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{color:var(--pink);}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:26px;}
    .nav-desktop a{font-size:14px;font-weight:600;text-decoration:none;color:var(--ink);}
    .nav-desktop a:hover{color:var(--pink);}
  }
  .hero{position:relative;overflow:hidden;min-height:clamp(440px,60vh,580px);display:flex;align-items:center;justify-content:center;background-size:cover;background-position:center;text-align:center;}
  .hero--fallback{background:var(--purple);}
  .hero__scrim{position:absolute;inset:0;z-index:0;}
  .hero--photo .hero__scrim{background:linear-gradient(180deg,rgba(140,84,255,.55) 0%,rgba(255,95,162,.55) 100%);}
  .hero--fallback .hero__scrim .blob{position:absolute;}
  .hero__inner{position:relative;z-index:1;max-width:720px;margin:0 auto;padding:60px 20px;}
  .badge{display:inline-flex;align-items:center;gap:7px;background:var(--yellow);border:3px solid var(--ink);border-radius:999px;padding:7px 16px;font-size:12px;font-weight:700;color:var(--ink);margin-bottom:22px;transform:rotate(-2deg);}
  .badge__dot{width:7px;height:7px;border-radius:50%;background:var(--ink);}
  h1{font-family:'Suez One',sans-serif;font-size:clamp(30px,7vw,50px);line-height:1.15;margin-bottom:20px;color:#fff;}
  .sub{font-size:17px;color:rgba(255,255,255,.94);max-width:50ch;margin:0 auto 30px;}
  .hero__ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
  .photo-placeholder{border:3px dashed var(--purple);border-radius:20px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#D6CDEB;}
  .photo-placeholder svg{width:34px;height:34px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;border-radius:20px;overflow:hidden;border:3px solid var(--ink);box-shadow:0 8px 0 var(--teal);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(36,30,51,.7);color:#fff;font-size:10px;padding:5px 9px;border-radius:999px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}
  .about-band{max-width:1040px;margin:0 auto;padding:64px 20px 10px;}
  .about-grid{display:grid;gap:26px;}
  .about p{font-size:17px;color:var(--ink);text-align:center;max-width:60ch;margin:0 auto;}
  .about-photo{aspect-ratio:4/3;transform:rotate(-1.5deg);}
  @media (min-width:760px){.about-grid{grid-template-columns:1fr 1fr;align-items:center;}.about p{text-align:start;margin:0;}}
  .band{max-width:1040px;margin:0 auto;padding:64px 20px;}
  .featured-grid{display:grid;gap:28px 20px;margin-top:34px;}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:14px;border-radius:14px;transform:none;}
  .featured-card h3{font-family:'Suez One',sans-serif;font-size:17px;margin-bottom:6px;}
  .featured-card p{font-size:14px;color:var(--muted);margin-bottom:10px;}
  .featured-card .price{display:inline-block;font-weight:700;font-size:14px;color:var(--pink);}
  .props-grid{display:grid;gap:28px 20px;margin-top:34px;}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr));}}
  .prop{text-align:center;}
  .num-badge{width:44px;height:44px;border-radius:50%;background:var(--pink);border:3px solid var(--ink);color:#fff;font-family:'Suez One',sans-serif;font-size:18px;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;}
  .prop:nth-child(2n) .num-badge{background:var(--teal);}
  .prop:nth-child(3n) .num-badge{background:var(--yellow);color:var(--ink);}
  .prop:nth-child(4n) .num-badge{background:var(--purple);}
  .prop h3{font-family:'Suez One',sans-serif;font-size:16px;margin-bottom:4px;}
  .prop p{color:var(--muted);font-size:14px;}
  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:34px;}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:1/1;border-radius:16px;}
  .gallery-tile:nth-child(2n){transform:rotate(1.5deg);}
  .gallery-tile:nth-child(2n+1){transform:rotate(-1deg);}
  .gallery-note{margin-top:16px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}
  .process-grid{display:grid;gap:24px;margin-top:34px;}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{text-align:center;padding:24px 18px;}
  .step .num-badge{margin:0 auto 14px;}
  .step h3{font-family:'Suez One',sans-serif;font-size:16px;margin-bottom:4px;}
  .step p{font-size:14px;color:var(--muted);}
  .testimonials-grid{display:grid;gap:24px;margin-top:34px;}
  @media (min-width:560px){.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .testimonial p{font-size:16px;color:var(--ink);margin-bottom:14px;position:relative;}
  .testimonial p::before{content:'💬';font-size:24px;display:block;margin-bottom:8px;}
  .testimonial__author{font-size:13px;font-weight:700;color:var(--pink);}
  .testimonial--placeholder{border:3px dashed var(--purple);box-shadow:none;background:transparent;transform:none;}
  .testimonial--placeholder p::before{opacity:.3;}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#D6CDEB;}
  .faq-list{margin-top:34px;max-width:760px;margin-inline:auto;}
  .faq__item{background:#fff;border:3px solid var(--ink);border-radius:16px;padding:18px 20px;margin-bottom:16px;box-shadow:0 5px 0 var(--yellow);}
  .faq__item:nth-child(2n){box-shadow:0 5px 0 var(--teal);}
  .faq__item:nth-child(3n){box-shadow:0 5px 0 var(--pink);}
  .faq__item h3{font-family:'Suez One',sans-serif;font-size:16px;margin-bottom:6px;}
  .faq__item p{font-size:14px;color:var(--muted);}
  .cta-band{max-width:1040px;margin:0 auto;padding:10px 20px 70px;}
  .cta-panel{position:relative;overflow:hidden;border-radius:24px;padding:60px 28px;text-align:center;border:3px solid var(--ink);background-size:cover;background-position:center;}
  .cta-panel--fallback{background:linear-gradient(135deg,var(--pink) 0%,var(--purple) 100%);}
  .cta-panel__scrim{position:absolute;inset:0;}
  .cta-panel--photo .cta-panel__scrim{background:linear-gradient(180deg,rgba(140,84,255,.6) 0%,rgba(255,95,162,.6) 100%);}
  .cta-panel__content{position:relative;z-index:1;max-width:520px;margin:0 auto;}
  .cta-panel .badge{margin-bottom:18px;}
  .cta-panel h2{color:#fff;font-family:'Suez One',sans-serif;font-size:clamp(28px,5vw,42px);margin-bottom:12px;}
  .cta-panel .cta-sub{color:rgba(255,255,255,.92);margin-bottom:28px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:18px;font-size:12px;color:rgba(255,255,255,.8);}
  .site-footer{background:var(--ink);color:rgba(255,255,255,.75);}
  .footer-top{max-width:1040px;margin:0 auto;padding:52px 20px 32px;display:grid;gap:32px;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;}}
  .footer-brand .nav__brand{color:#fff;}
  .footer-brand p{font-size:14px;margin-top:10px;max-width:36ch;color:rgba(255,255,255,.6);}
  .footer-links{display:flex;flex-direction:column;gap:10px;}
  .footer-links a{font-size:14px;text-decoration:none;color:rgba(255,255,255,.75);}
  .footer-links a:hover{color:var(--yellow);}
  .footer-heading{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--yellow);margin-bottom:12px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  .social-icon{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--ink);background:#fff;text-decoration:none;transition:transform .15s ease;}
  .social-icon:hover{transform:translateY(-2px) rotate(-6deg);}
  .social-icon--placeholder{background:rgba(255,255,255,.1);color:rgba(255,255,255,.3);}
  .footer-bottom{border-top:1px solid rgba(255,255,255,.15);}
  .footer-bottom-inner{max-width:1040px;margin:0 auto;padding:18px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.6);}
  .footer-bottom-inner a{font-weight:700;color:var(--yellow);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>

  <section class="hero ${hasHeroPhoto ? 'hero--photo' : 'hero--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim">
      ${hasHeroPhoto ? '' : `
      <span class="blob" style="width:180px;height:180px;background:var(--pink);top:8%;inset-inline-start:6%;"></span>
      <span class="blob" style="width:130px;height:130px;background:var(--yellow);bottom:10%;inset-inline-end:10%;"></span>
      <span class="blob" style="width:90px;height:90px;background:var(--teal);top:14%;inset-inline-end:16%;"></span>`}
    </div>
    <div class="hero__inner">
      <span class="badge"><span class="badge__dot"></span>בואו נשחק</span>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn btn--ghost" href="#featured">לראות מה מציעים</a>
      </div>
    </div>
    ${hasHeroPhoto ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">שירותים</div>
      <h2 class="section-title">מה אנחנו מציעים</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="card featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c)}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="prop"><span class="num-badge">${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p, i) => `<div class="step"><span class="num-badge">${i + 1}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel ${hasHeroPhoto ? 'cta-panel--photo' : 'cta-panel--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
      <div class="cta-panel__scrim"></div>
      <div class="cta-panel__content">
        <span class="badge"><span class="badge__dot"></span>בואו נתחיל</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${appLinksHtml(c)}
          ${waCtaButton}
        </div>
        <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

// ---------------------------------------------------------------
// INDUSTRIAL — strong typography, real-world photos, practical/no-nonsense
// design. Good fit for: construction, manufacturing, trades. Alef
// (uppercase, tracked, technical-feeling) for headings + Heebo for body.
// Steel/amber palette, sharp corners everywhere (no radius), square number
// tags instead of circles, a repeating hazard-stripe accent bar used
// sparingly as a section divider. Deliberately blunt: no soft shadows, no
// rounded pills — every interactive element reads like a stamped panel.
// ---------------------------------------------------------------
function industrialTemplate(c) {
  const { galleryHtml, galleryIsComplete, testimonialsHtml, phoneIcon, waIcon, instaIcon, fbIcon, waCtaButton } = buildShared(c);
  const hasHeroPhoto = Boolean(c.heroPhoto && c.heroPhoto.url);
  const stripe = 'repeating-linear-gradient(-45deg, var(--amber) 0, var(--amber) 10px, var(--ink) 10px, var(--ink) 20px)';

  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Alef:wght@400;700&family=Heebo:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--ink:#1A1D1F;--steel:#3C4247;--paper:#F1F0EC;--amber:#F2A93B;--line:#CFCBC0;--muted:#5E5E58;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--paper);color:var(--ink);font-family:'Heebo',sans-serif;line-height:1.6;}
  a{color:inherit;}
  section{scroll-margin-top:70px;}
  h1,h2,h3,.nav__brand{font-family:'Alef',sans-serif;font-weight:700;}
  .eyebrow{font-family:'Heebo',sans-serif;font-weight:700;font-size:12px;letter-spacing:.12em;color:var(--amber);text-transform:uppercase;margin-bottom:10px;}
  .section-title{font-size:clamp(24px,3.6vw,32px);text-transform:uppercase;letter-spacing:.01em;margin-bottom:8px;}
  .section-head{text-align:center;max-width:560px;margin:0 auto 8px;}
  .hazard-bar{height:8px;background:${stripe};}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:0;font-weight:700;font-size:14px;text-decoration:none;padding:15px 30px;text-transform:uppercase;letter-spacing:.03em;transition:background .15s ease,color .15s ease;white-space:nowrap;}
  .btn svg{width:16px;height:16px;}
  .btn--primary{background:var(--amber);color:var(--ink);}
  .btn--primary:hover{background:#D6922B;}
  .btn--ghost{background:transparent;color:#fff;border:2px solid #fff;}
  .btn--ghost:hover{background:#fff;color:var(--ink);}
  .btn--on-dark{background:var(--amber);color:var(--ink);}
  .btn--on-dark:hover{background:#D6922B;}
  .btn--ghost-on-dark{background:transparent;color:#fff;border:2px solid rgba(255,255,255,.5);}
  .btn--ghost-on-dark:hover{border-color:#fff;}
  .btn--sm{padding:10px 18px;font-size:12px;}
  .card{background:#fff;border:1px solid var(--line);padding:24px;position:relative;}
  .card::before{content:'';position:absolute;top:0;inset-inline-start:0;width:4px;height:100%;background:var(--amber);}
  .nav-wrap{position:sticky;top:0;z-index:30;background:var(--ink);border-bottom:2px solid var(--amber);}
  .nav-toggle{display:none;}
  .nav-pill{max-width:1080px;margin:0 auto;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .nav__brand{font-size:19px;color:#fff;text-transform:uppercase;letter-spacing:.02em;}
  .nav-desktop{display:none;}
  .nav-burger{display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:10px;border:1px solid rgba(255,255,255,.3);}
  .nav-burger span{width:18px;height:2px;background:#fff;display:block;}
  .nav-dropdown{display:none;flex-direction:column;border-top:1px solid rgba(255,255,255,.15);padding:8px 20px 16px;gap:2px;}
  .nav-toggle:checked ~ .nav-dropdown{display:flex;}
  .nav-dropdown a{padding:13px 4px;font-size:14px;font-weight:600;text-decoration:none;color:#fff;border-top:1px solid rgba(255,255,255,.1);}
  .nav-dropdown a:first-child{border-top:none;}
  .nav-dropdown a.nav-cta{color:var(--amber);}
  @media (min-width:760px){
    .nav-burger,.nav-toggle,.nav-dropdown{display:none !important;}
    .nav-desktop{display:flex;align-items:center;gap:26px;}
    .nav-desktop a{font-size:13px;font-weight:600;text-decoration:none;color:rgba(255,255,255,.8);text-transform:uppercase;letter-spacing:.03em;}
    .nav-desktop a:hover{color:var(--amber);}
  }
  .hero{position:relative;overflow:hidden;min-height:clamp(440px,60vh,580px);display:flex;align-items:flex-end;background-size:cover;background-position:center;}
  .hero--fallback{background:var(--steel);}
  .hero__scrim{position:absolute;inset:0;}
  .hero--photo .hero__scrim{background:linear-gradient(0deg,rgba(26,29,31,.88) 10%,rgba(26,29,31,.35) 60%,rgba(26,29,31,.1) 100%);}
  .hero--fallback .hero__scrim{background:linear-gradient(0deg,rgba(26,29,31,.7) 0%,rgba(26,29,31,.2) 100%);}
  .hero__inner{position:relative;z-index:1;max-width:900px;margin:0 auto;padding:80px 20px 48px;width:100%;}
  .badge{display:inline-flex;align-items:center;gap:8px;background:var(--amber);border-radius:0;padding:7px 16px;font-size:12px;font-weight:700;color:var(--ink);text-transform:uppercase;letter-spacing:.05em;margin-bottom:22px;}
  .badge__dot{width:7px;height:7px;background:var(--ink);}
  h1{font-size:clamp(30px,6.5vw,50px);line-height:1.15;margin-bottom:18px;color:#fff;text-transform:uppercase;}
  .sub{font-size:17px;color:rgba(255,255,255,.85);max-width:56ch;margin:0 0 30px;}
  .hero__ctas{display:flex;gap:14px;flex-wrap:wrap;}
  .photo-placeholder{border:2px dashed var(--steel);background:#E7E4DB;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#A8A499;}
  .photo-placeholder svg{width:32px;height:32px;}
  .photo-placeholder span{font-size:12px;font-style:italic;color:var(--muted);}
  .photo-real{position:relative;overflow:hidden;border:1px solid var(--line);}
  .photo-real img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-credit{position:absolute;inset-inline-end:8px;bottom:8px;background:rgba(26,29,31,.7);color:#fff;font-size:10px;padding:4px 9px;text-decoration:none;opacity:.85;}
  .photo-credit:hover{opacity:1;}
  .about-band{max-width:1040px;margin:0 auto;padding:60px 20px 8px;}
  .about-grid{display:grid;gap:24px;}
  .about p{font-size:17px;color:var(--ink);}
  .about-photo{aspect-ratio:4/3;}
  @media (min-width:760px){.about-grid{grid-template-columns:1fr 1fr;align-items:center;}}
  .band{max-width:1040px;margin:0 auto;padding:56px 20px;}
  .featured-grid{display:grid;gap:1px;background:var(--line);margin-top:30px;border:1px solid var(--line);}
  @media (min-width:560px){.featured-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .featured-card{background:#fff;}
  .dish-thumb{aspect-ratio:4/3;margin-bottom:14px;border:none;}
  .featured-card h3{font-size:17px;margin-bottom:6px;text-transform:uppercase;}
  .featured-card p{font-size:14px;color:var(--muted);margin-bottom:10px;}
  .featured-card .price{display:inline-block;font-weight:700;font-size:14px;color:var(--ink);background:var(--amber);padding:3px 10px;}
  .props-grid{display:grid;gap:1px;background:var(--line);margin-top:30px;border:1px solid var(--line);}
  @media (min-width:560px){.props-grid{grid-template-columns:repeat(auto-fit,minmax(210px,1fr));}}
  .prop{background:#fff;padding:24px;display:flex;gap:14px;}
  .num-badge{flex:0 0 auto;width:34px;height:34px;background:var(--ink);color:var(--amber);font-family:'Alef',sans-serif;font-weight:700;font-size:15px;display:flex;align-items:center;justify-content:center;}
  .prop h3{font-size:16px;margin-bottom:4px;text-transform:uppercase;}
  .prop p{color:var(--muted);font-size:14px;}
  .gallery-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:2px;margin-top:30px;}
  @media (min-width:560px){.gallery-grid{grid-template-columns:repeat(3,1fr);}}
  .gallery-tile{aspect-ratio:4/3;border-radius:0;}
  .gallery-note{margin-top:16px;font-size:13px;color:var(--muted);font-style:italic;text-align:center;}
  .process-grid{display:grid;gap:1px;background:var(--line);margin-top:30px;border:1px solid var(--line);}
  @media (min-width:560px){.process-grid{grid-template-columns:repeat(auto-fit,minmax(180px,1fr));}}
  .step{background:#fff;text-align:center;padding:28px 18px;}
  .step .num-badge{margin:0 auto 14px;}
  .step h3{font-size:16px;margin-bottom:4px;text-transform:uppercase;}
  .step p{font-size:14px;color:var(--muted);}
  .testimonials-grid{display:grid;gap:1px;background:var(--line);margin-top:30px;border:1px solid var(--line);}
  @media (min-width:560px){.testimonials-grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr));}}
  .testimonial{background:#fff;padding:24px;}
  .testimonial p{font-size:16px;color:var(--ink);margin-bottom:14px;}
  .testimonial__author{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;}
  .testimonial--placeholder{border:2px dashed var(--steel);}
  .testimonial--placeholder p,.testimonial--placeholder .testimonial__author{color:#A8A499;}
  .faq-list{margin-top:30px;max-width:760px;margin-inline:auto;}
  .faq__item{background:#fff;border:1px solid var(--line);border-inline-start:4px solid var(--amber);padding:18px 20px;margin-bottom:2px;}
  .faq__item h3{font-size:16px;margin-bottom:6px;text-transform:uppercase;}
  .faq__item p{font-size:14px;color:var(--muted);}
  .cta-band{margin:0;padding:0;}
  .cta-panel{position:relative;overflow:hidden;padding:64px 20px;text-align:center;background-size:cover;background-position:center;}
  .cta-panel--fallback{background:var(--ink);}
  .cta-panel__scrim{position:absolute;inset:0;}
  .cta-panel--photo .cta-panel__scrim{background:rgba(26,29,31,.82);}
  .cta-panel__content{position:relative;z-index:1;max-width:560px;margin:0 auto;}
  .cta-panel .badge{margin-bottom:18px;}
  .cta-panel h2{color:#fff;font-size:clamp(26px,4.5vw,38px);margin-bottom:12px;text-transform:uppercase;}
  .cta-panel .cta-sub{color:rgba(255,255,255,.8);margin-bottom:28px;font-size:15px;}
  .cta-panel .cta-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;}
  .cta-panel .cta-microcopy{margin-top:18px;font-size:12px;color:rgba(255,255,255,.6);}
  .site-footer{background:var(--ink);color:rgba(255,255,255,.7);}
  .footer-top{max-width:1040px;margin:0 auto;padding:52px 20px 32px;display:grid;gap:32px;}
  @media (min-width:680px){.footer-top{grid-template-columns:1.3fr 1fr 1fr;}}
  .footer-brand .nav__brand{color:#fff;}
  .footer-brand p{font-size:14px;margin-top:10px;max-width:36ch;color:rgba(255,255,255,.55);}
  .footer-links{display:flex;flex-direction:column;gap:10px;}
  .footer-links a{font-size:14px;text-decoration:none;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.02em;}
  .footer-links a:hover{color:var(--amber);}
  .footer-heading{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--amber);margin-bottom:12px;}
  .social-icons{display:flex;gap:10px;margin-top:6px;flex-wrap:wrap;}
  .social-icon{width:38px;height:38px;display:flex;align-items:center;justify-content:center;color:var(--ink);background:var(--amber);text-decoration:none;}
  .social-icon:hover{background:#D6922B;}
  .social-icon--placeholder{background:rgba(255,255,255,.1);color:rgba(255,255,255,.3);}
  .footer-bottom{border-top:1px solid rgba(255,255,255,.15);}
  .footer-bottom-inner{max-width:1040px;margin:0 auto;padding:18px 20px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;font-size:13px;color:rgba(255,255,255,.55);}
  .footer-bottom-inner a{font-weight:700;color:var(--amber);text-decoration:none;}
</style></head>
<body>
  <div class="nav-wrap">
    <input type="checkbox" id="navToggle" class="nav-toggle">
    <div class="nav-pill">
      <span class="nav__brand">${escapeHtml(c.businessName)}</span>
      <nav class="nav-desktop">
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#testimonials">חוות דעת</a>
        <a href="#faq">שאלות נפוצות</a>
        <a class="btn btn--primary btn--sm" href="#cta">${escapeHtml(c.ctaText)}</a>
      </nav>
      <label for="navToggle" class="nav-burger" aria-label="תפריט"><span></span><span></span><span></span></label>
    </div>
    <nav class="nav-dropdown">
      <a href="#about">אודות</a>
      <a href="#featured">שירותים</a>
      <a href="#gallery">גלריה</a>
      <a href="#testimonials">חוות דעת</a>
      <a href="#faq">שאלות נפוצות</a>
      <a class="nav-cta" href="#cta">${escapeHtml(c.ctaText)}</a>
    </nav>
  </div>
  <div class="hazard-bar"></div>

  <section class="hero ${hasHeroPhoto ? 'hero--photo' : 'hero--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
    <div class="hero__scrim"></div>
    <div class="hero__inner">
      <span class="badge"><span class="badge__dot"></span>עובדים ברצינות</span>
      <h1>${escapeHtml(c.headline)}</h1>
      <p class="sub">${escapeHtml(c.subheadline)}</p>
      ${eventDetailsHtml(c)}
      <div class="hero__ctas">
        <a class="btn btn--primary" href="#cta">${escapeHtml(c.ctaText)}</a>
        <a class="btn btn--ghost" href="#featured">לראות מה מציעים</a>
      </div>
    </div>
    ${hasHeroPhoto ? `<a class="photo-credit" href="${escapeHtml(c.heroPhoto.photographerUrl)}" target="_blank" rel="noopener">${escapeHtml(c.heroPhoto.photographerName)} / Unsplash</a>` : ''}
  </section>

  <section class="about-band" id="about">
    <div class="about-grid">
      <p>${escapeHtml(c.about)}</p>
      ${photoBlock(c.aboutPhoto, 'about-photo', c.businessName)}
    </div>
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">האתגר והפתרון</div>
      <h2 class="section-title">איך אנחנו עוזרים</h2>
    </div>
    <div class="faq-list">
      <div class="faq__item"><h3>האתגר</h3><p>${escapeHtml(c.problem)}</p></div>
      <div class="faq__item"><h3>הפתרון שלנו</h3><p>${escapeHtml(c.solution)}</p></div>
    </div>
  </section>

  <section class="band" id="featured">
    <div class="section-head">
      <div class="eyebrow">שירותים</div>
      <h2 class="section-title">מה אנחנו מציעים</h2>
    </div>
    <div class="featured-grid">
      ${valuePropsHtml(c.featured, (f) => `<div class="featured-card">${photoBlock(f.photo, 'dish-thumb', f.name)}<div style="padding:18px;"><h3>${escapeHtml(f.name)}</h3><p>${escapeHtml(f.description)}</p>${f.price ? `<span class="price">${escapeHtml(f.price)}</span>` : ''}</div></div>`)}
    </div>
  </section>
  ${pricingTiersHtml(c, 'featured-card" style="padding:18px;')}

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">למה אנחנו</div>
      <h2 class="section-title">מה מייחד אותנו</h2>
    </div>
    <div class="props-grid">
      ${valuePropsHtml(c.valueProps, (p, i) => `<div class="prop"><span class="num-badge">${String(i + 1).padStart(2, '0')}</span><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div></div>`)}
    </div>
  </section>

  <section class="band" id="gallery">
    <div class="section-head">
      <div class="eyebrow">גלריה</div>
      <h2 class="section-title">תמונות מהשטח</h2>
    </div>
    <div class="gallery-grid">
      ${galleryHtml}
    </div>
    ${galleryIsComplete ? '' : '<p class="gallery-note">תמונות אמיתיות יתווספו כאן.</p>'}
  </section>

  <section class="band">
    <div class="section-head">
      <div class="eyebrow">איך זה עובד</div>
      <h2 class="section-title">התהליך</h2>
    </div>
    <div class="process-grid">
      ${valuePropsHtml(c.process, (p, i) => `<div class="step"><span class="num-badge">${String(i + 1).padStart(2, '0')}</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
    </div>
  </section>

  <section class="band" id="testimonials">
    <div class="section-head">
      <div class="eyebrow">חוות דעת</div>
      <h2 class="section-title">מה אומרים עלינו</h2>
    </div>
    <div class="testimonials-grid">
      ${testimonialsHtml}
    </div>
  </section>

  <section class="band" id="faq">
    <div class="section-head">
      <div class="eyebrow">שאלות נפוצות</div>
      <h2 class="section-title">מה שרציתם לדעת</h2>
    </div>
    <div class="faq-list">
      ${valuePropsHtml(c.faq, (f) => `<div class="faq__item"><h3>${escapeHtml(f.question)}</h3><p>${escapeHtml(f.answer)}</p></div>`)}
    </div>
  </section>

  <section class="cta-band" id="cta">
    <div class="cta-panel ${hasHeroPhoto ? 'cta-panel--photo' : 'cta-panel--fallback'}"${hasHeroPhoto ? ` style="background-image:url('${escapeHtml(c.heroPhoto.url)}')"` : ''}>
      <div class="cta-panel__scrim"></div>
      <div class="cta-panel__content">
        <span class="badge"><span class="badge__dot"></span>בואו נתחיל</span>
        <h2>${escapeHtml(c.ctaHeadline)}</h2>
        <p class="cta-sub">נשמח לשמוע מכם ולעזור.</p>
        <div class="cta-actions">
          <a class="btn btn--on-dark" href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
          ${appLinksHtml(c)}
          ${waCtaButton}
        </div>
        <p class="cta-microcopy">מענה מהיר בטלפון או בוואטסאפ</p>
      </div>
    </div>
  </section>

  <footer class="site-footer">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="nav__brand">${escapeHtml(c.businessName)}</span>
        <p>${escapeHtml(c.subheadline)}</p>
      </div>
      <nav class="footer-links">
        <div class="footer-heading">ניווט מהיר</div>
        <a href="#about">אודות</a>
        <a href="#featured">שירותים</a>
        <a href="#gallery">גלריה</a>
        <a href="#faq">שאלות נפוצות</a>
      </nav>
      <div class="footer-contact">
        <div class="footer-heading">יצירת קשר</div>
        <div class="social-icons">
          ${phoneIcon}
          ${waIcon}
          ${instaIcon}
          ${fbIcon}
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <div class="footer-bottom-inner">
        <span>${escapeHtml(c.businessName)}</span>
        <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
      </div>
    </div>
  </footer>
</body></html>`;
}

const TEMPLATES = {
  warm: warmTemplate,
  bold: boldTemplate,
  minimal: minimalTemplate,
  'modern-corporate': modernCorporateTemplate,
  luxury: luxuryTemplate,
  friendly: friendlyTemplate,
  'bold-vibrant': boldVibrantTemplate,
  editorial: editorialTemplate,
  playful: playfulTemplate,
  industrial: industrialTemplate
};

function renderTemplate(style, content) {
  const fn = TEMPLATES[style] || TEMPLATES.warm;
  return fn(content);
}

// Loaded two ways: `require()`d server-side by api/chat.js (CommonJS), and
// included via a plain <script> tag client-side (app.js) so the browser can
// re-render a cached content object in a different style instantly, without
// a round trip to the backend or another DeepSeek call.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { renderTemplate, TEMPLATES };
}
if (typeof window !== 'undefined') {
  window.WeboostTemplates = { renderTemplate, TEMPLATES };
}
