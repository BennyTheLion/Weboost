# Weboost — chat-to-landing-page builder

A single page: chat with an agent on the left about your business, watch it
build a complete landing page live on the right, aimed at getting visitors to
contact you.

## Files

```
index.html       the page markup (chat panel + live preview)
style.css        all styling — no external CSS framework
app.js           chat logic, talks to /api/chat
templates.js     page templates — shared by the backend (require) and the
                 browser (<script> tag), so a visitor can flip styles
                 instantly client-side, see "Instant style switching" below
api/chat.js        the agent: gathers info, decides when to build, calls DeepSeek
api/_rateLimit.js  per-IP in-memory rate limiter (see Cost & abuse guardrails)
api/_unsplash.js   fetches real photos for generated pages
```

`_rateLimit.js` and `_unsplash.js` are prefixed with `_` because Vercel's
zero-config detection turns every file directly under `api/` into its own
serverless function endpoint — the underscore prefix tells it to skip these
(they're helper modules imported by `chat.js`, not routes themselves). Only
`api/chat.js` is meant to be hit as `/api/chat`. `templates.js` lives at the
project root instead, alongside `index.html`/`app.js`, since it needs to be
fetchable as a plain static file for the browser to use it too.

Everything is plain HTML/CSS/JS — no build step, no framework — so it drops
straight into an existing plain-JS project later.

## How the agent works

Rather than asking the model to freehand a whole HTML page (unreliable, slow,
inconsistent quality), this uses **tool calling**: the model has one tool,
`generate_landing_page`, with a strict schema (headline, value props, CTA,
contact link, and a `style` choice — 10 visual styles, see `VALID_STYLES` in
`api/chat.js`). It keeps asking questions in plain chat until it has enough,
then calls the tool instead of replying in prose. The backend takes those
structured arguments and renders them into one of the hand-built templates in
`templates.js` — the model never writes markup or CSS itself, which is what
keeps output fast, cheap, and visually solid every time.

To add a new visual style, write a new template function in `templates.js`,
add it to the `TEMPLATES` map, and add its name to the `style` enum in
`api/chat.js`'s tool definition.

### Instant style switching

The style chips above the chat (`אוטומטי` / `חם` / `נועז` / ...) don't just
set a preference for the *next* generation — once a page exists, clicking one
instantly re-renders the live preview in that style, entirely client-side.
This works because `api/chat.js` returns the raw structured `content` object
(not just the rendered HTML) alongside every generated page; `app.js` caches
it, and `templates.js` — loaded as a plain `<script>` tag, no bundler needed
— calls the exact same `renderTemplate(style, content)` function in the
browser that the backend used server-side. No extra network round trip, no
extra DeepSeek call, no cost — switching styles is just re-running a pure
function over data already sitting in memory.

## Language & direction

Both the builder UI and every generated landing page are RTL Hebrew:
`<html lang="he" dir="rtl">`, Hebrew-supporting fonts (Frank Ruhl Libre,
Heebo, Rubik — the previous Latin-only fonts have no Hebrew glyphs), and the
agent's system prompt instructs it to converse and write all content in
Hebrew. Layout uses CSS logical properties (`inline-start`/`inline-end`
instead of `left`/`right`) so it mirrors correctly rather than needing a
separate LTR/RTL stylesheet.

## Cost & abuse guardrails

Two limits protect your API bill from a runaway or abusive conversation:

- **Turn cap** (`MAX_USER_TURNS` in `api/chat.js`, default 8): once a
  conversation passes this many user messages, the backend stops calling
  DeepSeek entirely and tells the user to refresh and start over.
- **Rate limit** (`api/_rateLimit.js`, default 30 requests / 10 min / IP):
  blocks rapid-fire requests from a single visitor. This is in-memory and
  best-effort — serverless platforms may run multiple instances under real
  traffic, so it won't be a perfectly shared counter. For a hard guarantee
  at scale, swap it for a shared store like Upstash Redis (same interface,
  just backed by a real database instead of a local Map).

Both limits return `limit_reached: true` in the response, which the frontend
uses to permanently disable the composer for that session.

## Running the tests

```
npm test
```

18 tests across three files, no real API key needed (the agent's DeepSeek
call is mocked):

- `tests/templates.test.js` — every template renders valid HTML, real content
  shows up correctly, and — importantly — all content is properly escaped so
  a business name or contact link can't break out of an HTML attribute and
  inject a script (this caught a real bug during development: quotes weren't
  being escaped, which let a crafted `ctaLink` value close the `href`
  attribute early and inject an `onmouseover` handler. Now fixed.).
- `tests/rateLimit.test.js` — the per-IP limiter allows requests under the
  threshold and blocks over it, and tracks IPs independently.
- `tests/chat.test.js` — the agent's full decision logic: rejects bad
  requests, enforces the turn cap and rate limit (and does so *without*
  wasting an API call), returns plain replies while still gathering info,
  renders a real page once the tool is called, and handles a malformed or
  failed upstream response without crashing.

## Running it

1. **Get a DeepSeek API key** from platform.deepseek.com if you don't have one.
2. **Deploy the backend function.** The easiest path is Vercel:
   - Push this folder to a GitHub repo, import it in Vercel.
   - In the Vercel project settings, add an environment variable
     `DEEPSEEK_API_KEY` with your key. Optionally also add
     `UNSPLASH_ACCESS_KEY` (from unsplash.com/developers) to have generated
     pages use real photos instead of placeholder art — page generation
     works fine without it.
   - Vercel auto-detects `api/chat.js` as a serverless function — no config
     needed. (`api/_rateLimit.js` and `api/_unsplash.js` are prefixed with
     `_` so Vercel treats them as plain modules, not separate function
     routes; `templates.js` lives outside `api/` entirely and is served as
     a static file, same as `app.js`.)
3. **Open `index.html`** (served by Vercel, or any static host) — the chat
   will call `/api/chat` on the same domain.

   If you'd rather use Netlify instead of Vercel, move `api/chat.js` to
   `netlify/functions/chat.js` and change the last line to:
   `exports.handler = async (event) => { ... }` (Netlify's function signature
   differs slightly from Vercel's — ask me if you want that version written out).

## Merging into your main plain-JS project later

Since there's no build step, merging is just file copying:

- Drop `index.html`'s `<section>` markup into wherever this should live in
  your existing page (e.g. as a `/builder` route or a modal).
- Copy `style.css` rules in — they're all scoped under `.workshop`, `.workbench`,
  `.canvas`, `.seam` class names, so they shouldn't collide with existing styles
  unless you already use those class names.
- Copy `app.js` and `templates.js` as-is; `app.js` only touches elements
  with the specific IDs used here, and `templates.js` is loaded as a plain
  `<script>` tag before it (needed for instant client-side style switching).
- Copy `api/chat.js` into your existing backend's routing setup, and update
  its `require('../templates')` path to wherever `templates.js` ends up.

## Customizing the agent's behavior

All of the agent's instructions — what questions it asks, when it decides to
generate the page, what the generated page should look like — live in the
`SYSTEM_PROMPT` string at the top of `api/chat.js`. Edit that text to change
tone, required questions, or design constraints.
