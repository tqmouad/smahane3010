# PROJECT SUMMARY

Last updated: 2026-11-11

## What this is

A one-page, scrolling birthday gift website for Smahane, made by her boyfriend (repo owner).
Working title: "Smahane, in bloom since 30/10/2002".

## Decisions made by the owner

| Topic | Decision |
|---|---|
| Audience | Private gift. She gets the link and may share it with friends. |
| Search engines | Hidden (noindex). No SEO, no GEO, no ads. |
| Language | Easy English |
| Birth details | 30/10/2002, 5 pm, Beni Mellal (Krazza), Morocco |
| Devices | Phones first, must also work well on iPad |
| Address | Free Cloudflare Pages address: `smahane-bloomed-30-10-2002.pages.dev` (chosen by owner; not created yet, so not known if the name is free) |
| Look | "From another world": stars, moon, clear sky, animations, a sky switch |
| Songs | Owner said yes to both: world hits from her birth week and Arabic / Moroccan songs. Links out only, no hosted music. |
| Hosting | Static site on Cloudflare Pages. Owner has GitHub and Cloudflare accounts. |
| Content from owner | Photos, her drawings, her voice audios, a letter (to be sent at build step) |

## Rules to follow (from the owner)

- Owner is not a developer: simple English, short answers, tables.
- Brief plan first, wait for "go". One small step at a time. Branches only.
- Ask before any new package, paid service or server piece.
- After each step report: what changed, what was checked, what was NOT checked, PowerShell commands.
- Never say "tested" or "verified" unless the test was run. Never invent numbers or sources.
- Read the licence of every data source, API, font or audio before using it. Record in `docs/LICENSES.md`.
- Static site, strict security headers, no inline scripts.
- Buttons at least 44px, light and dark mode, keyboard and screen-reader friendly.
- All text in one place; all colours and sizes in one tokens file.
- Tests on phone, iPad and desktop sizes; secret scan and package audit before every push.

Not received yet: `new-website-playbook.md` and `security-checklist.md` (owner mentioned them; they were not in the session or the repo).

## Planned sections

1. Golden-hour sky over Beni Mellal turning to night, then her moon
2. Days alive (live counter), full moons lived
3. Scorpio, drawn line by line
4. Her 20 songs
5. Flower garden: one flower per year, each opens a memory
6. Her voice turned into melody or blooming flowers
7. Gallery of her drawings
8. Cartoon corner (Spacetoon spirit, our own art, no copied songs)
9. Letter and countdown to next birthday

## How the site is built

- Plain files in `site/`: no build step. One outside library, GSAP 3.15.1 with ScrollTrigger, copied into `site/vendor/` (see `docs/LICENSES.md`).
- `site/js/moon.js`: the 3D moon globe, drawn on a canvas with no 3D library. `site/img/moon-map.jpg` is its surface, made by code. Cloudflare Pages setting: build command empty, output folder `site`.
- `site/js/text.en.js`: every word on the site.
- `site/css/tokens.css`: every colour and size, for both skies.
- `site/css/site.css`: layout and motion. `site/js/main.js`: page logic. `site/js/sky.js`: star field.
- `site/js/theme.js`: picks golden hour or night before the page draws. `site/js/fullmoons.js`: full-moon dates.
- `site/_headers`: strict security headers (no inline scripts or styles), plus noindex. `site/robots.txt`: blocks all crawlers.
- Light mode = golden hour at 5:00 pm (no stars, no moon: true to that minute). Dark mode = her first night (stars, her crescent moon).

## Status

| Step | Status |
|---|---|
| 1. Research: birth sky numbers, licences | Done (`docs/BIRTH_SKY.md`, `docs/LICENSES.md`) |
| 2. First full version | Built on branch `build/v1-sky-and-garden`. Sections working: hero, the minute, moon, days counter, Scorpio, songs (9), garden (24 flowers), letter. Placeholders: voice, gallery, letter words, flower memories. |
| 2b. Scroll scenes | Built on branch `build/v2-scroll-scenes`. Pinned scenes driven by the scroll: name flies in, moon wanes from full (21 Oct) to her crescent, day counter counts up, Scorpio is drawn, songs slide in, flowers grow, lead text lights up word by word, stars streak when scrolling fast, night turns to dawn at the end. No packages. Pin lengths are in `tokens.css`. |
| 2c. Letter, wall, portrait | Built on branch `build/v3-letter-gallery`. Letter (A2 English, half friend half love, approved by owner), signature with no name (two ink knots tied by one line, drawn by the scroll), her six drawings in `site/img/` with tap-to-enlarge, her portrait as its own scene, her Arabic moon line under the moon facts, flowers redrawn as ink lines to match her art ("my ink is black"). Voice section is hidden until audio files are listed in `text.en.js`. Empty flower memories show a gentle default line. |
| 2d. Memories and prayer | Same branch. All 24 flower memories written from the owner's notes (in `text.en.js`). Year 16 (2018) carries her late father's name, a short Arabic dua and a quiet ink drawing of a grave. Signature changed to two moons tied by one line: her crescent and the owner's full moon (born 13/7/2003, moon 99.8% lit by PyEphem). Confirmed by owner on 2026-11-12: they met in 2022, got engaged in 2023, her mother's name is Zineb (fixed), and he read the Arabic dua himself. years 3, 5, 11, 12, 13, 15, 17, 19 are gentle filler lines, not real events. |
| 2e. 3D and GSAP | Branch `build/v4-3d-gsap`. Scroll scenes now run on GSAP ScrollTrigger and glide after the finger. 3D: moon globe that turns and wanes, name arrives letter by letter, songs swing in like doors, flowers spin up, drawings flip onto the wall and tilt under a mouse, letter unfolds. Owner confirmed earlier animations do show on his iPhone and Windows laptop. |
| 2f. Calm stars | Branch `build/v5-calm-stars`. Owner did not like the stars moving with the scroll. Background is now still, twinkling stars with a rare shooting star. Open question: whether he also wants the other scroll effects reduced. |
| 2g. Ring, moon by finger, drifting sky | Branch `build/v6-ring-and-drift`. Owner clarified: he wants clear 3D, things appearing step by step with the scroll, and stars that move gently. Her drawings now stand in a 3D ring that turns with the scroll (tap the front one to enlarge). The moon globe turns under a finger and swings back. Fact cards arrive one by one. The star sky turns very slowly and has a little depth on scroll (no trails, no flying). |
| 2h. Faster stars, version tags | Branch `build/v7-moving-stars`. Owner could not see the stars move. Sky now turns about three times faster (`TURN_SPEED` at the top of `site/js/sky.js`). Every file link carries `?v=7` so browsers and the preview stop showing old saved copies; raise the number in `index.html` and in the imports at the top of `main.js` whenever files change. |
| 2i. Motion switch | Branch `build/v8-motion-switch`. Owner saw no star movement and no text reveal on his Windows laptop; most likely Windows has animation effects off (not confirmed). The site no longer goes fully still on such devices. New `data-motion` on the page: `full` or `calm`, chosen in `js/theme.js` from the saved choice, else from the device setting. Calm mode: stars still turn slowly, words and cards still fade in with the scroll, but no held scenes, no flying or spinning. A Motion switch at the top changes the mode (saved on the device, page reloads). Version tags are now `?v=8`. |
| 2j. Motion on by default | Branch `build/v9-motion-always-on`. Owner's decision: the site always starts with full motion, even on devices set to reduce motion. It is calm only if the Motion switch was turned off on that device. Version tags now `?v=10`. |
| 3. Owner's content | Received: letter, six drawings, portrait. Still waiting for: audios, flower memories, extra song picks (all optional) |
| 4. Deploy to Cloudflare Pages | Not done. Owner must connect the repo in Cloudflare. |

## Checked so far (on 2026-11-11, in Chrome only)

- Loads with the real security headers and no console errors at phone (390), iPad (820) and desktop (1440) sizes, both skies.
- No sideways scrolling; all visible buttons and links at least 44px.
- Counters show 8,778 days, 297 full moons, 24 trips, matching `docs/BIRTH_SKY.md`.
- Sky switch and flower pop-up work by click.

## Not checked yet

- Real iPhone, real iPad, Safari, Firefox.
- Screen reader, keyboard-only walk-through, colour contrast measurement.
- Smoothness of the scroll scenes on a real phone or iPad (only checked as still screenshots in Chrome).
- Calm mode (devices set to reduce motion) was tested for star movement, word reveal and the Motion switch, but not reviewed section by section.
- The Cloudflare deployment itself.

## Open questions for the owner

1. Optional extras: songs to add, flower memories, audios.
2. Owner did not choose a signature idea or confirm the ink flowers; both were chosen for him and can be changed (`--petal-fill` in `tokens.css` brings colour back).
3. Please send `new-website-playbook.md` and `security-checklist.md` if they exist.

## v11 — 12 Nov 2026: chess, chart, same-sky stars (branch build/v10-chess-chart-stars)

New sections, in page order:
- **Your sky in a circle**: her birth chart as a round SVG drawing (js/chart.js, numbers in js/skydata.js),
  with element/modality counts, a plain table of positions, and a "just for fun" note. Numbers calculated
  with PyEphem (scripts kept in docs/tools/, results in docs/BIRTH_SKY.md).
- **Other stars in your sky**: 8 famous people ranked by how close the planets on their birthday stood
  to hers. Dates verified (docs/LICENSES.md); formula written on the page and in docs/BIRTH_SKY.md.
- **Our game of chess**: a 3D chessboard on a canvas (js/chess.js, no library). Her queen (her face,
  from portrait.jpg) and his king (his face, cameo-his.jpg) move once per story moment while scrolling;
  ends "Checkmate. We both win." She can turn the board with a finger; it springs back.
Also: html now has overflow-x: clip (iPad showed a 55px sideways scroll from the door-reveal cards).
Cache tags bumped to ?v=11.

Checked (Chrome via Playwright, 390/820/1440 widths): no console errors, no sideways scroll,
calm mode writes the moves out as a story, night + golden themes, wheel and chess at all sizes.
NOT checked: real iPhone/laptop, Safari, Firefox, screen readers, the live Cloudflare site.

## v12 — 14 Nov 2026: real 3D chessboard (branch build/v12-real-3d-chess)
- js/chess.js rewritten: every piece is a real 3D turned shape (pawn, rook, bishop, queen, king with a cross),
  lit by one light with shine, rim glow and soft shadows; wooden frame with bevel and a–h / 1–8 letters;
  glossy board; 16 still pieces so it looks like a real game (they never block the story moves).
- Her face and his face sit in gold medallions on the queen and the king; the queen has a pearl crown.
- The camera keeps a small angle, and zooms in on the two of them at "Checkmate".
- Board canvas is bigger (min(52vh, 30rem)). Cache tags ?v=12. Still no 3D library.
Checked in Chrome (390px and 1440px), both skies: no console errors, no sideways scroll.
NOT checked: real iPhone speed, Safari.

## v13 — 14 Nov 2026: premium chessboard (branch build/v13-premium-chess)
- Marble squares with long veins (drawn once into a hidden picture, laid on the board in small triangles).
- Dark lacquered frame with two gold lines, a gold line on the sides, engraved gold letters.
- Reflections of the pieces in the board; soft spotlight; a shadow under the whole board.
- Metal-gold pieces (her side) and glossy porcelain (his side); smoother, rounder pieces; gold cross on the king; pearl crown.
- Soft faded edges on the canvas. New board colours in tokens.css. Cache tags ?v=13.
Checked in Chrome (390px, 1440px), both skies: no console errors, no sideways scroll.
NOT checked: real iPhone speed (this version draws more), Safari.
