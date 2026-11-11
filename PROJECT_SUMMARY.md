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
| Address | Free Cloudflare Pages address (`.pages.dev`). Name not final. Proposed: `smahane-bloomed-30-10-2002` |
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

## Status

| Step | Status |
|---|---|
| 1. Research: birth sky numbers, licences | Done on branch `research/step-1-sky-and-licences` (see `docs/`) |
| 2. Design mockup of first three sections | Not started. Waiting for owner "go". |
| 3. Build | Not started |

## Open questions for the owner

1. Final address name.
2. Songs: world hits from her birth week, or Arabic / Moroccan songs from 2002?
3. Please send `new-website-playbook.md` and `security-checklist.md` if they exist.
