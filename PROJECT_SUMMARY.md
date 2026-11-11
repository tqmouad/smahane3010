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

- Plain files in `site/`: no packages, no build step. Cloudflare Pages setting: build command empty, output folder `site`.
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
- Reduced-motion mode was loaded once (page shows final states, no pinned scenes) but not reviewed in detail.
- The Cloudflare deployment itself.

## Open questions for the owner

1. Optional extras: songs to add, flower memories, audios.
2. Owner did not choose a signature idea or confirm the ink flowers; both were chosen for him and can be changed (`--petal-fill` in `tokens.css` brings colour back).
3. Please send `new-website-playbook.md` and `security-checklist.md` if they exist.
