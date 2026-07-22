---
name: design-research
description: Research real landing-page design patterns on the web for a given business type/industry, then apply a concrete visual redesign to this project's template functions (api/templates.js) and iterate with the user until they approve. Use this whenever the user asks to make a template "look modern," "more impressive," "less dated," wants design inspiration from real sites, or explicitly invokes /design-research. Don't just guess at aesthetics from memory — this skill exists specifically to ground design decisions in real examples instead of vibes.
---

# Design Research

Grounds visual redesign work in real landing-page examples instead of guessing at what "modern" or "impressive" means. Use this loop whenever the user wants a template in `api/templates.js` (or another template file they point you to) redesigned with real inspiration behind it, not just another blind guess.

## Why this exists

Guessing at "modern design" from memory tends to converge on generic patterns and burns iteration cycles when the user says "still not impressive." Searching for real, current examples in the business's industry (or in general modern SaaS/startup design) gives concrete things to point at — actual color combinations, actual section orderings, actual button/card treatments that are working right now — instead of another guess.

## The loop

1. **Get the subject.** If the user didn't specify (e.g. "redesign the restaurant template" is enough, but if they just said "make it better," ask which business type/industry to research, and which template function to touch).

2. **Search for real examples.** Use WebSearch for the given business type — e.g. "best [industry] landing page design 2025", "[industry] website design inspiration", "modern SaaS landing page design patterns". Look at several results, use WebFetch on a few of the more promising ones if the search snippet isn't enough. You're looking for:
   - Color palettes and how they're used (accent vs. neutral, light vs. dark)
   - Layout conventions specific to that industry (a restaurant site's needs differ from a law firm's)
   - Common section types and their order
   - Typography pairings that read as current
   - How buttons, cards, and CTAs are styled (shadows, radius, gradients, borders)

   Take real notes on what you find — you'll need to justify the direction you pick.

3. **Synthesize a direction — never copy.** Turn what you found into a design language you can apply: a color system, a type scale, a card/button style, a section structure. This must be genuinely synthesized, not lifted:
   - Never reproduce another site's actual markup, CSS, copy, logo, or imagery.
   - Never imitate a specific brand's identity closely enough that the result reads as "a copy of X."
   - Treat everything you find as reference for *patterns* (e.g. "restaurant sites in this space lean warm neutrals with a single accent color and large photography-shaped placeholder blocks"), not as source material to paste from.

4. **Apply it to the code.** Edit the relevant template function. Keep the existing content contract intact — the function still takes the same data fields (headline, valueProps, etc.); only the markup/CSS changes. Don't touch how content is generated (that's a separate concern — see the fabrication rule below).

5. **Render a real preview — don't just describe it.** This project has no local Node runtime in the dev environment, so you can't just `node -e` the template function. Instead:
   - Read the actual updated function's source from the file.
   - Use the Browser tool: open any page (e.g. the deployed site), then use `javascript_tool` to inject the *exact* function code (paste it verbatim, don't retype from memory) along with representative sample data, build the resulting HTML string, and load it into an `<iframe srcdoc=...>` on the page.
   - Screenshot it at both mobile (~390px width) and desktop (~1280px width) so you catch responsive issues, not just one viewport.
   - Also write the rendered HTML to a file in the scratchpad and send it with `SendUserFile` so the user can open the real file themselves, not just look at your screenshot.
   - Clean up the injected debug iframe afterward — it should never leak into what actually gets pushed.

6. **Present and ask for approval.** Show the preview, explain briefly what changed and why (tie it back to what you found in step 2 — "X pattern is common in Y industry sites right now, so I did Z"). Ask explicitly: does this land, or what should change?

7. **Loop on feedback.** If the user wants changes, figure out whether that needs new research (a different direction) or just refinement (tweak what's there), then repeat from the relevant step. Keep looping — don't stop until the user actually approves or explicitly ends the session.

8. **Stop at approval — don't deploy.** Once approved, your job is done: report that the changes are ready in the working tree. Committing, pushing, or deploying follows whatever git workflow the user normally uses in this project — don't do it automatically as part of this skill.

## Hard rules

- **Never fabricate content.** This skill is about visual design only — layout, color, typography, component styling. It must never invent testimonials, prices, facts, or copy to fill out a preview. If a preview needs sample data, use clearly fictional placeholder data (e.g. "Example Restaurant," generic prices) and say so, or reuse content the user already provided earlier in the conversation.
- **Never skip the real render.** A design description in prose is not a substitute for an actual screenshot/file the user can inspect. If you can't render it (e.g. browser tooling unavailable), say so explicitly rather than presenting an unverified description as if it were checked.
- **Never push without approval.** No commits, pushes, or deploys until the user has seen a real preview and said yes.
