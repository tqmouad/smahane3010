# LICENSES

Every data source, API, font and audio must be listed here before it is used.
"Read" means the licence text itself was opened and read on that date.

Note: this site is a private gift with no ads. Commercial use is still recorded, in case that ever changes.

## Approved

| Item | Type | Licence | Commercial use | Where read | Date read | Status |
|---|---|---|---|---|---|---|
| Caveat | Font (handwriting) | SIL Open Font License 1.1 | Allowed. May be bundled and embedded. The font may not be sold by itself. | `OFL.txt` in github.com/googlefonts/caveat | 2026-11-11 | In use. Stored in `site/fonts/` with its licence file |
| Nunito | Font (round, friendly) | SIL Open Font License 1.1 | Same as above | `OFL.txt` in github.com/googlefonts/nunito | 2026-11-11 | Not used |
| Fraunces | Font (soft serif) | SIL Open Font License 1.1 | Same as above | `OFL.txt` in github.com/undercasetype/Fraunces | 2026-11-11 | In use (normal and italic). Stored in `site/fonts/` with its licence file |

OFL conditions to follow if a font is used: keep the copyright and licence file with the font files; do not sell the font alone; do not use the font authors' names to promote the site.

Fonts are stored inside the site (self-hosted), so no outside font service is called. The font files were made smaller (Latin letters only, woff2 format). The OFL allows modified versions; neither font declares a Reserved Font Name in its licence file.

## In use, with limits (added 2026-11-11)

| Item | Used for | What it is | What was and was not checked |
|---|---|---|---|
| Nine song titles and artists | Songs section | Plain facts: songs listed as being in the US top ten in the week of 2 Nov 2002, taken from Wikipedia's "List of Billboard Hot 100 top-ten singles in 2002" as shown in a web search result | The page itself and Wikipedia's licence text were not opened. Only titles and artist names are used, no chart positions except the number one ("Dilemma"), which a second Wikipedia list also shows. No Billboard page was copied. |
| YouTube search links | "Find it" buttons | A normal link that opens YouTube's search in a new tab. Nothing is embedded, hosted or loaded from YouTube. | YouTube terms not read. A plain link needs no API. |
| Scorpius star positions | Constellation drawing | 15 star positions typed by hand from memory | Only Antares and Shaula were compared with PyEphem's star list (they match). The other 13 are approximate. The drawing is for beauty, not for navigation. |
| Full-moon dates 2002 to 2044 | "Full moons" counter | Calculated with PyEphem, saved in `site/js/fullmoons.js` | The count for 11 Nov 2026 (297) matches the step 1 calculation. |

## Used for research only (not part of the site)

| Item | Type | Licence | Where seen | Date | Note |
|---|---|---|---|---|---|
| PyEphem 4.2.1 | Sky calculator | MIT (as shown by the package's own metadata) | `pip show ephem` | 2026-11-11 | Ran once to make `docs/BIRTH_SKY.md`. Full licence text not read. Not shipped. |

## Not approved yet

| Item | Wanted for | Problem |
|---|---|---|
| MusicBrainz data | Songs released on 30/10/2002 | Could not open musicbrainz.org from this session. Search results say core data is CC0, but the licence page itself was not read. |
| Billboard chart pages | Top 20 of her birth week | Page could not be opened. Terms not read. A chart ranking is Billboard's own product, so copying it needs care. |
| Star positions (for Scorpius) | Constellation drawing | No source chosen yet. |
| Song audio or video | Playing the songs | Songs are copyrighted. Plan: link out to official sources, never host files. Embedding terms not read yet. |
| Spacetoon songs and characters | Cartoon corner | Copyrighted. Plan: our own original art in that spirit, plus a link out. |
| Her voice audios, photos, drawings, letter | Personal sections | Belong to her and the owner. Owner confirmed she is happy for them to be used. |

## Her art and portrait (added 2026-11-11)

| Item | Where | Whose it is | Notes |
|---|---|---|---|
| Six drawings (`two-faces`, `skull`, `eyes-pencil`, `moon-in-your-eyes`, `framed-pair`, `fighters`) | `site/img/` | Smahane's own work, sent by the owner | Resized. The first one was a screenshot; its two app badges were painted out. `fighters` is her fan art of characters owned by someone else: fine on a private gift, remove it if the site ever carries ads. |
| Portrait (`portrait.jpg`) | `site/img/` | A portrait of Smahane, sent by the owner | Who made the portrait was not asked. Private gift only. |
| Arabic line under the moon | `site/js/text.en.js` | Copied from the writing on her own framed drawing | Not checked whether the line is her own words or a quote from a poem or song. |

## Animation library and moon map (added 2026-11-12)

| Item | Used for | Licence | Where read | Date read | Notes |
|---|---|---|---|---|---|
| GSAP 3.15.1 and its ScrollTrigger plugin | Scroll scenes, gliding motion, 3D tilt, the name's entrance | GSAP Standard "No Charge" License. Not open source. Free for commercial sites. Not allowed inside no-code animation builders that compete with Webflow. Webflow may change the terms for future versions; a version already in use stays under its old terms. | Copies of the licence text shown in web search results (gsap.com page, Wind River and ScanCode licence lists). The official page could not be opened directly from this session. | 2026-11-12 | Copied unchanged into `site/vendor/` from the npm package. `npm audit` on that version reported no known problems. Requested by the owner. |
| greensock/gsap-skills | Reading only, as a guide to correct GSAP use | MIT (licence file in the repo) | The repo's `LICENSE` file | 2026-11-12 | Nothing from it is in the site. |
| Motion (motiondivision/motion) | Not used | MIT | `LICENSE.md` in the repo | 2026-11-12 | Read because the owner suggested it. Left out because GSAP does the same job. |
| Moon surface map (`site/img/moon-map.jpg`) | The 3D moon globe | Made by our own code, so no outside licence | n/a | 2026-11-12 | It is a drawing by code, not a photograph. Dark "seas" and bright craters are placed roughly where the real ones are, from memory. NASA's real map would be better but nasa.gov could not be reached from this session. |
