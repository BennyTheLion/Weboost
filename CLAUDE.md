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
- **Last done:** Renamed "Pagesmith" → "Weboost" everywhere; fixed stale
  app.js comment (said "Anthropic API", actually DeepSeek); restructured
  for Vercel — moved chat.js/templates.js into api/, added the previously
  *missing* api/rateLimit.js (chat.js required it but it didn't exist —
  would have crashed every request), added minimal package.json (Node 18+
  engine, for native fetch).
- **In progress:** —
- **Next:** Deploy to Vercel (see README "Running it"); no tests/ dir yet.
- **Blockers/notes:** —
