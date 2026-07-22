# CLAUDE.md

Project context auto-loaded by Claude Code at the start of every session in
this directory. Keep this file short — it's read every time, so token cost
scales with its size.

## Project

Weboost — chat-to-landing-page builder (Hebrew RTL). Full details in
[README.md](README.md).

## Reality check vs README

- **Not a git repo.** No commit history to lean on for "what changed" —
  this file is the only record of session-to-session state.
- File layout now matches README (`api/chat.js`, `api/templates.js`,
  `api/rateLimit.js`). Still no `tests/` directory or `package.json` test
  script despite README's "Running the tests" section — that part is still
  aspirational.

## Session status

<!--
Update this block at the end of substantive work, or whenever asked to
"save progress" / "stopping here". Keep it terse — bullets, no prose,
~8 lines max — so re-loading it next session stays cheap. Overwrite,
don't accumulate history.
-->

- **Last updated:** 2026-07-17
- **Last done:** Added a second, independent axis to page generation:
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
- **Next:** Instant client-side style-switching (cache last-generated
  structured content, let the visitor flip visual style without a new
  DeepSeek call) is still the standing next-ask once the user brings it
  up. Otherwise: deploy to Vercel; still no tests/ dir.
- **Blockers/notes:** Nothing pushed to git yet this session — repo has
  no local git init in this working copy history captured here, confirm
  before assuming GitHub is in sync. No local Node/Python-for-JS runtime;
  verify template changes via browser-injection (Apache already serves
  C:\xampp\htdocs\Weboost at http://localhost/Weboost/, no preview_start
  server needed for static HTML/JS checks) — write a throwaway
  test_harness.html that shims `module.exports` and calls
  renderTemplate() for each style, then delete it when done.
