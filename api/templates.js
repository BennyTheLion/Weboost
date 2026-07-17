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
  return items.map(renderItem).join('\n');
}

// ---------------------------------------------------------------
// WARM — cream background, serif headline, terracotta accent.
// Good fit for: personal services, creative freelancers, hospitality.
// ---------------------------------------------------------------
function warmTemplate(c) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@600;700&family=Heebo:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--cream:#F7F1E6;--ink:#2B231C;--terracotta:#C1633F;--line:#E4D9C6;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--cream);color:var(--ink);font-family:'Heebo',sans-serif;line-height:1.6;}
  .wrap{max-width:760px;margin:0 auto;padding:80px 24px 60px;}
  h1{font-family:'Frank Ruhl Libre',serif;font-size:clamp(30px,5vw,48px);font-weight:700;line-height:1.25;margin-bottom:18px;}
  .sub{font-size:19px;color:#5A4E40;max-width:56ch;margin-bottom:48px;}
  .props{display:grid;gap:24px;margin-bottom:56px;border-top:1px solid var(--line);padding-top:32px;}
  .prop h3{font-family:'Frank Ruhl Libre',serif;font-size:19px;margin-bottom:6px;}
  .prop p{color:#5A4E40;font-size:15px;}
  .cta{background:var(--terracotta);color:#fff;border-radius:10px;padding:36px;text-align:center;}
  .cta h2{font-family:'Frank Ruhl Libre',serif;font-size:24px;margin-bottom:10px;}
  .cta a{display:inline-block;margin-top:16px;background:#fff;color:var(--terracotta);padding:12px 26px;border-radius:8px;font-weight:600;text-decoration:none;}
</style></head>
<body><div class="wrap">
  <h1>${escapeHtml(c.headline)}</h1>
  <p class="sub">${escapeHtml(c.subheadline)}</p>
  <div class="props">
    ${valuePropsHtml(c.valueProps, (p) => `<div class="prop"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
  </div>
  <div class="cta">
    <h2>${escapeHtml(c.ctaHeadline)}</h2>
    <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
  </div>
</div></body></html>`;
}

// ---------------------------------------------------------------
// BOLD — near-black background, oversized type, single acid accent.
// Good fit for: tech, agencies, anything wanting to feel confident/modern.
// ---------------------------------------------------------------
function boldTemplate(c) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@600;800&family=Heebo:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--bg:#111417;--fg:#F3F4F5;--accent:#D6FF3F;--muted:#8A9099;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--fg);font-family:'Heebo',sans-serif;line-height:1.6;}
  .wrap{max-width:800px;margin:0 auto;padding:90px 24px 60px;}
  h1{font-family:'Rubik',sans-serif;font-weight:800;font-size:clamp(32px,6vw,54px);line-height:1.2;margin-bottom:20px;}
  .sub{font-size:19px;color:var(--muted);max-width:54ch;margin-bottom:52px;}
  .props{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-bottom:60px;}
  .prop{border:1px solid #232830;border-radius:10px;padding:22px;}
  .prop h3{font-family:'Rubik',sans-serif;color:var(--accent);font-size:16px;margin-bottom:8px;}
  .prop p{color:var(--muted);font-size:14px;}
  .cta{border-top:1px solid #232830;padding-top:40px;text-align:center;}
  .cta h2{font-family:'Rubik',sans-serif;font-size:24px;margin-bottom:18px;}
  .cta a{display:inline-block;background:var(--accent);color:#111417;padding:14px 30px;border-radius:8px;font-weight:700;text-decoration:none;}
</style></head>
<body><div class="wrap">
  <h1>${escapeHtml(c.headline)}</h1>
  <p class="sub">${escapeHtml(c.subheadline)}</p>
  <div class="props">
    ${valuePropsHtml(c.valueProps, (p) => `<div class="prop"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
  </div>
  <div class="cta">
    <h2>${escapeHtml(c.ctaHeadline)}</h2>
    <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
  </div>
</div></body></html>`;
}

// ---------------------------------------------------------------
// MINIMAL — broadsheet-style, hairline rules, restrained type.
// Good fit for: professional/consulting services, anything wanting gravitas.
// ---------------------------------------------------------------
function minimalTemplate(c) {
  return `<!DOCTYPE html>
<html lang="he" dir="rtl"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(c.businessName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@600;700&family=Heebo:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  :root{--bg:#FCFCFB;--ink:#1A1A1A;--rule:#D9D9D5;--muted:#7A7A76;}
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:var(--bg);color:var(--ink);font-family:'Frank Ruhl Libre',serif;line-height:1.65;}
  .wrap{max-width:720px;margin:0 auto;padding:70px 24px 60px;}
  .eyebrow{font-family:'Heebo',sans-serif;font-weight:500;font-size:12px;letter-spacing:.03em;color:var(--muted);margin-bottom:18px;border-bottom:1px solid var(--rule);padding-bottom:18px;}
  h1{font-weight:700;font-size:clamp(28px,5vw,44px);line-height:1.3;margin-bottom:20px;}
  .sub{font-family:'Heebo',sans-serif;font-weight:300;font-size:16px;color:var(--muted);max-width:60ch;margin-bottom:48px;}
  .props{border-top:1px solid var(--rule);}
  .prop{display:grid;grid-template-columns:120px 1fr;gap:20px;padding:22px 0;border-bottom:1px solid var(--rule);}
  .prop h3{font-size:16px;font-weight:600;}
  .prop p{font-family:'Heebo',sans-serif;font-weight:300;font-size:13px;color:var(--muted);}
  .cta{margin-top:52px;text-align:start;}
  .cta h2{font-size:21px;margin-bottom:16px;}
  .cta a{display:inline-block;border:1px solid var(--ink);color:var(--ink);padding:12px 26px;text-decoration:none;font-family:'Heebo',sans-serif;font-size:14px;}
</style></head>
<body><div class="wrap">
  <div class="eyebrow">${escapeHtml(c.businessName)}</div>
  <h1>${escapeHtml(c.headline)}</h1>
  <p class="sub">${escapeHtml(c.subheadline)}</p>
  <div class="props">
    ${valuePropsHtml(c.valueProps, (p) => `<div class="prop"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.body)}</p></div>`)}
  </div>
  <div class="cta">
    <h2>${escapeHtml(c.ctaHeadline)}</h2>
    <a href="${escapeHtml(c.ctaLink)}">${escapeHtml(c.ctaText)}</a>
  </div>
</div></body></html>`;
}

const TEMPLATES = {
  warm: warmTemplate,
  bold: boldTemplate,
  minimal: minimalTemplate
};

function renderTemplate(style, content) {
  const fn = TEMPLATES[style] || TEMPLATES.warm;
  return fn(content);
}

module.exports = { renderTemplate, TEMPLATES };
