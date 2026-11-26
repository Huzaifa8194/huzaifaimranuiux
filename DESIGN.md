# Huzaifa Imran portfolio: design context

Reference studied: auge-xp.com (Awwwards SOTD, 7.33). What was taken is the interaction grammar,
not the look: a one screen home with an endless reel, a works wheel, a lens shaped curtain,
decode text, a cursor tile that unfolds into a label, a title that becomes a running head.
Palette, type, mark, copy and every asset here are our own.

## Concept card

- Idea: hard products, made easy to read. Text and pages arrive as noise and decode.
- Metaphor: decryption. A cipher resolving into plain language is what the work does for
  security products, so every label on the site does it too.
- Signature: the image you click travels through the curtain and becomes the case study hero,
  while the title decodes in two typefaces at once.
- Motion verb: decode and settle. Speed slants things, rest straightens them.
- Driver: on home, reel velocity (one number) skews the wordmark, the copy and the reel.
  On works, wheel progress places every thumbnail, index and title.
- Idle: the reel drifts, the about glyphs turn.

## What the site sells

The interface work, not the products. Covers, heroes and galleries are captures of the pages and
screens I designed (stills plus screen recordings of each live page being scrolled). The launch
films from the content folder appear once per case study, lower down, as "motion content".

## Jelly

`src/lib/jelly.ts` is one spring world for the whole site. Every body is an underdamped spring
with volume preserving squash and stretch.
- `data-jelly` pops on hover and press and lags behind scroll; `data-jelly="drag"` can be pulled
  and let go; `data-jelly="hang"` swings from its top edge (home cards); `data-magnetic` leans
  toward the pointer; `jellyLetters(el)` makes each letter a body the pointer pushes aside.
- The home reel and the works wheel are springs themselves. Their change in speed is what the
  cards and letters feel.
- The cursor follower is a spring that stretches along its travel.

## System

- Palette: paper `#e9e7e0`, ink `#0b0b0d`, accent vermilion `#ff4a1c`. Three page grounds
  (paper, ink, accent) switched through `html[data-theme]`; fixed UI uses a difference blend so it
  reads on any ground, except on accent where it falls back to ink for contrast.
- Type: Archivo variable at width 72, weight 800, uppercase for display. Inter Tight for text.
  Instrument Serif italic as the second voice in mixed titles and statements.
- Shape: 4px radius everywhere. Easing: expo out for entrances, expo in-out for the curtain.
- Hover treatments: slab flood on buttons and ledger rows, decode on small links, lean on the mark.

## Structure

- `/` home: reel of 7 projects, wordmark, intro, links to works and archive.
- `/works` wheel index. `/works/:slug` case study (cover, running head, meta, film, challenge,
  dark gallery and facts, solution, page structure table, palette and type, next project).
- `/archive` ledger of the 28 engineering led projects from the resume, with live links.
- `/about` night hero, rebus statement, skills, record table, closing statement.
- Any other path: 404.

## Stack

Vite, vanilla TypeScript, GSAP (ScrollTrigger, SplitText), Lenis. A small client router in
`src/main.ts` keeps the shell (curtain, cursor, menu, bar) alive between pages so transitions are
continuous. `vercel.json` rewrites every path to `index.html`.

All content is in `src/data.ts`. Media is in `public/media/<slug>/`.

## Honest notes

- Screenshots and screen recordings were captured from digin-3.vercel.app on 2026-11-26.
  Launch films are re-encoded from the DigiInn Content folder (720p, with sound).
- Four case studies credit the site whose motion structure was studied (from each DESIGN.md in
  the DigiInn repo). Remove the `study` field in `src/data.ts` to hide the line.
- No QA pass has been run yet (owner's request): no Lighthouse, axe, or cross browser check.
