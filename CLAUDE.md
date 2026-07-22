# CLAUDE.md

Project context auto-loaded by Claude Code at the start of every session in
this directory. Keep this file short — it's read every time, so token cost
scales with its size.

## Project

Weboost — chat-to-landing-page builder (Hebrew RTL). Full details in
[README.md](README.md).

## Reality check vs README

- **Is a git repo**, pushed to GitHub at BennyTheLion/Weboost, deployed via
  Vercel (project already imported there). This note was stale — written
  before git init happened; trust `git log`/`git status` over this file for
  "what changed."
- File layout: `api/chat.js` is the only real route (Vercel serverless
  function). `api/_templates.js`, `api/_rateLimit.js`, `api/_unsplash.js`
  are underscore-prefixed helper modules — required so Vercel's zero-config
  detection doesn't also register them as (broken) function endpoints.
  Still no `tests/` directory or `package.json` test script despite
  README's "Running the tests" section — that part is still aspirational.

## Session status

<!--
Update this block at the end of substantive work, or whenever asked to
"save progress" / "stopping here". Keep it terse — bullets, no prose,
~8 lines max — so re-loading it next session stays cheap. Overwrite,
don't accumulate history.
-->

- **Last updated:** 2026-07-22
- **Last done:** Deploy prep for Vercel. Found and fixed a real deploy
  blocker: Vercel's zero-config detection turns every file directly under
  `api/` into its own serverless function, but `templates.js`,
  `rateLimit.js`, and `unsplash.js` are helper modules (only `chat.js`
  exports a request handler) — they'd have deployed as three broken
  function endpoints. Renamed all three to `_templates.js`/`_rateLimit.js`/
  `_unsplash.js` (underscore prefix = excluded from Vercel's function
  detection), updated the `require()` paths in `chat.js`, and fixed the
  now-stale README (still said "three templates," was missing any mention
  of `unsplash.js`/`UNSPLASH_ACCESS_KEY`). Committed (6c7d766) and pushed
  to origin/main — project is already imported in Vercel, so this push
  should trigger an auto-deploy. Did NOT verify the Vercel deployment
  itself succeeded (no Vercel CLI/API access from this session) — user
  needs to confirm in the dashboard that DEEPSEEK_API_KEY is set and the
  new deploy shows only `chat` as a function.
- **Earlier (2026-07-17):** Added a second, independent axis to page generation:
  "conversionGoal" (how the page sells — lead-generation, appointment-
  booking, product-sales, event-registration, restaurant, portfolio,
  local-service, saas, mobile-app, personal-brand), separate from
  "style" (how it looks). Auto-inferred only, no UI picker (unlike
  style). Every one of the 10 templates in api/templates.js now also
  renders a universal Problem/Solution section (c.problem/c.solution,
  required fields) plus 3 optional goal-specific sections that only
  render when their data is present: eventDetails (date/time/location
  chips in the hero, for event-registration), pricingTiers (a pricing
  grid, for saas), appLinks (App Store/Google Play buttons in the CTA,
  for mobile-app) — via shared helpers eventDetailsHtml/pricingTiersHtml/
  appLinksHtml near buildShared(), reusing each template's existing
  .badge/.featured-grid/.btn--ghost-on-dark classes rather than adding
  new CSS per template (industrial and minimal/editorial needed small
  fixes: added a missing .badge rule to minimal+editorial, and a missing
  .btn--ghost-on-dark to editorial — pre-existing gap, not new fields).
  api/chat.js's TOOL schema + SYSTEM_PROMPT updated with all of this
  (CTA phrasing guidance per goal, anti-fabrication rules for
  problem/solution/eventDetails/pricingTiers/appLinks). Verified all 10
  templates x 5 data-variant combinations (base/withEvent/withPricing/
  withApp/withAll) = 50 renders, all valid HTML, via the browser-
  injection harness. Visual (screenshot) spot-check of the new sections
  was NOT completed this pass — the Browser tool hit an infra outage
  ("claude-sonnet-5 is temporarily unavailable" on navigate/
  javascript_tool) right as this was ready to check; relied on static
  code review instead (confirmed exactly 10 call-sites each for
  eventDetailsHtml/pricingTiersHtml/appLinksHtml/problem/solution via
  grep, confirmed reused CSS classes are standalone not descendant-
  scoped). Worth a visual pass next session if the user wants extra
  confidence before deploying.
- **In progress:** —
- **Next:** Confirm the Vercel deploy triggered by 6c7d766 actually went
  live clean (dashboard check, not something this session could verify).
  Visual (screenshot) spot-check of the event/pricing/app-link template
  sections added 2026-07-17 is still outstanding — worth doing before
  leaning on them further. Instant client-side style-switching (cache
  last-generated structured content, let the visitor flip visual style
  without a new DeepSeek call) is still the standing next-ask once the
  user brings it up. Still no tests/ dir.
- **Blockers/notes:** No local Node/Python-for-JS runtime; verify template
  changes via browser-injection (Apache already serves
  C:\xampp\htdocs\Weboost at http://localhost/Weboost/, no preview_start
  server needed for static HTML/JS checks) — write a throwaway
  test_harness.html that shims `module.exports` and calls
  renderTemplate() for each style, then delete it when done.
