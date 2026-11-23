# Backlog

Source of truth: `docs/TDD.md` (TDD v1.1). Work follows the story cycle in `CLAUDE.md` section 10. IDs are stable: a story that grows is split with suffixes (H-05a, H-05b) and a new story takes the next free number.

Branches: every story is committed on `develop`, and once validated `develop` is merged into `main` (fast forward). `main` never gets direct commits. Details in `CLAUDE.md` section 10.3.

Priority: rows up to D-13d use the TDD scope (Required, Desirable). Rows added in the 2026-11-20 review use P0 (unblocks the rest) to P3 (only if time allows) and are listed in execution order. D-21 (enemy sprite) does not depend on the game flow stories and can be pulled forward. Rows added on 2026-11-22 (team and professor feedback) use the same scale and go before the pending game flow stories: D-08d first, D-27 second, then D-12, D-28, D-29 and D-30 in the order the team listed them.

| ID | Story | Priority | TDD phase | Depends on | Status |
|---|---|---|---|---|---|
| H-01a | Repo layout: project docs to the root, old demo to `legacy/`, untrack `references/` | Required | 0 | | done |
| H-01b | Classic script skeleton with PixiJS: `index.html`, `lib/pixi.min.js`, `js/config.js`, `js/main.js` paints the background | Required | 0 | H-01a | done |
| H-02 | Fixed world behind `getCell` and test helper | Required | 1 | H-01b | done |
| H-03 | Camera and DDA raycaster with max ray distance | Required | 1 | H-02 | done |
| H-04 | Flat wall strips render (static player) | Required | 1 | H-03 | done |
| H-05a | Player input and movement logic | Required | 1 | H-04 | done |
| H-05b | Connect player controls to the ticker | Required | 1 | H-05a | done |
| H-06 | Minimap (21 by 21 window) | Required | 2 | H-05b | done |
| H-07a | Clarify fixed chunk door coordinates in the TDD | Required | 3 | H-06 | done |
| H-07b | Chunk generator in `mapgen.js`, isolated and tested | Required | 3 | H-07a, H-02 | done |
| H-08a | Decouple algorithm tests from the fixed map | Required | 3 | H-03, H-04, H-07b | done |
| H-08a2 | Decouple player movement tests from the world map | Required | 3 | H-05a, H-08a | done |
| H-08b | Infinite world: chunk Map with Cantor key, spawn in chunk (0, 0) | Required | 3 | H-06, H-07b, H-08a2 | done |
| H-09a | Remove legacy docs and HTML entries | Required | 3 | H-08b | done |
| H-09b | Remove legacy package manifests | Required | 3 | H-09a | done |
| H-09c | Remove legacy build tools and bootstrap | Required | 3 | H-09b | done |
| H-09d | Remove legacy layout, styling and math files | Required | 3 | H-09c | done |
| H-09e | Remove legacy input and DDA files | Required | 3 | H-09d | done |
| H-09f | Remove legacy raycast and collision files | Required | 3 | H-09e | done |
| H-09g | Remove legacy game controllers and 2D player | Required | 3 | H-09f | done |
| H-09h | Remove legacy 3D player and worlds | Required | 3 | H-09g | done |
| H-09i | Remove legacy canvas and base renderers | Required | 3 | H-09h | done |
| H-09j | Remove legacy 3D and minimap renderers | Required | 3 | H-09i | done |
| H-09k | Remove remaining legacy renderers | Required | 3 | H-09j | done |
| H-09l | Remove legacy lighting and debug panels | Required | 3 | H-09k | done |
| H-09m | Remove legacy menu and initial tests | Required | 3 | H-09l | done |
| H-09n | Remove remaining legacy tests | Required | 3 | H-09m | done |
| H-09o | Add README and verify the minimum scope | Required | 3 | H-09n | done |
| H-10a | Change the canvas to 1280 by 720 | Required | 3 | H-09o | done |
| H-10b | Document the 16:9 canvas dimensions | Required | 3 | H-10a | done |
| D-01 | Distance darkening in brightness bands | Desirable | 4 | H-09o | done |
| D-02 | Wall color per chunk | Desirable | 4 | H-09o | done |
| D-03a | Add a vector crosshair HUD | Desirable | 4 | D-02 | done |
| D-03b | Document the HUD file in the README | Desirable | 4 | D-03a | done |
| D-04a0 | Specify enemy population in the TDD | Desirable | 4 | D-03b | done |
| D-04a | Populate chunks with registered enemies | Desirable | 4 | D-04a0 | done |
| D-04b | Show enemies on the minimap | Desirable | 4 | D-04a | done |
| D-04c1 | Store wall depth for enemy occlusion | Desirable | 4 | D-04a | done |
| D-04c2 | Render enemy squares with z-buffer occlusion | Desirable | 4 | D-04b, D-04c1 | done |
| D-05a | Enemy idle timer and two-point patrol movement | Desirable | 4 | D-04c2 | done |
| D-05b | Enemy line of sight and chase with return to patrol | Desirable | 4 | D-05a | done |
| D-06a | Clarify defeat-only scope in the TDD | Desirable | 4 | D-05b | done |
| D-06b | Health, contact damage and defeat | Desirable | 4 | D-06a | done |
| D-06c | Draw the health bar and defeat overlay | Desirable | 4 | D-06b | done |
| D-07a | Shoot enemies with the center ray DDA | Desirable | 4 | D-04c2 | done |
| D-07b | Add the Sgun idle and firing animation | Desirable | 4 | D-07a | done |
| D-08a | Track six shotgun rounds and reload state | Desirable | 4 | D-07b | done |
| D-08b | Draw the six-round ammo bar | Desirable | 4 | D-08a | done |
| D-08c | Play the Sgun reload animation while reloading | Desirable | 4 | D-08b | done |
| D-09 | Procedural textures on a hidden canvas (wallX, texX), keeping flat color mode | Desirable | 4 | D-08b | done |
| D-11 | Second room per chunk without breaking connectivity | Desirable | 4 | D-09 | done |
| D-10 | Raycast lighting with one light per room | Desirable | 4 | D-11 | done |
| D-07c | Aim the shotgun barrel at the crosshair | Desirable | 4 | D-07b, D-03a | done |
| D-07d | Document the aimed shotgun in the README | Desirable | 4 | D-07c | done |
| D-07e | Show the whole muzzle flash in the firing frames | Desirable | 4 | D-07c | done |
| D-13a | Specify the shotgun projectile in the TDD | Desirable | 4 | D-07e | done |
| D-13b | Projectile logic: travel, wall range from the center ray DDA, enemy hit | Desirable | 4 | D-13a | done |
| D-13c | Draw projectiles in 3D and fire them instead of the instant hit | Desirable | 4 | D-13b | done |
| D-13d | Projectiles on the minimap and retire the instant center ray hit | Desirable | 4 | D-13c | done |
| D-14a | Sync the docs with the code: enemy size in TDD 2.3.2, README controls and project map | P0 | 4 | D-13d | done |
| D-14a2 | Describe the player's square footprint in TDD 6.6 | P0 | 4 | D-14a | done |
| D-14b | Specify the new scope in the TDD: victory with a boss, HUD layout, screens, score and ranking, admin panel | P0 | 4 | D-14a2 | done |
| D-15a | Move the minimap to the top-right corner | P1 | 4 | D-14a | done |
| D-15b | Life and ammo bars in the top-left corner with LIFE and AMMO labels | P1 | 4 | D-15a | done |
| D-16a1 | Specify the full-window game, the camera plane by aspect and the top admin panel in the TDD | P1 | 4 | D-14b | done |
| H-10c | Camera plane length follows the canvas aspect | Required | 3 | D-16a1 | done |
| D-16a2 | Canvas width follows the window at load, inside `#game-frame` | P1 | 4 | H-10c | done |
| D-16a3 | Live resize: strips, ceiling and floor, crosshair, minimap, shotgun and plane follow the window | P1 | 4 | D-16a2 | done |
| D-16b1 | Admin panel shell: top hover strip, pinned full-width panel, close buttons, P key, Lucide icons | P1 | 4 | D-16a2 | done |
| D-16b2 | Live info in the admin panel, four times per second | P1 | 4 | D-16b1 | done |
| D-16c1a | Specify the settings Juanma asked for in the TDD: enemies per game, hit points, reload limit, turn speed, raycasting and chunk settings | P1 | 4 | D-16b2 | done |
| D-16c1b | Settings store and panel fields: ranges, localStorage, Reset, turn speed in degrees per second, game keys ignored while typing | P1 | 4 | D-16c1a | done |
| D-16c1c | Player hit points, god mode, magazine size and refill ammo | P1 | 4 | D-16c1b | done |
| D-16c1d | Reload limit with the x3 counter next to the ammo bar | P1 | 4 | D-16c1c | done |
| D-16c1e | Enemies per game: chunks stop rolling enemies once the total is reached | P1 | 4 | D-16c1b | done |
| D-23 | Update and draw only the enemies near the player, with an admin toggle to compare | P1 | 4 | D-16c1e | done |
| D-24 | Place every enemy of the game in the 8 chunks around the player; a new total replaces them | P1 | 4 | D-23 | done |
| D-25 | Enemies left outside the active area reappear near the player's new chunk | P1 | 4 | D-24 | done |
| D-16e1 | Strip width setting: 1, 2, 4 or 8 px per ray | P1 | 4 | D-16c1b | done |
| D-16e2 | Fisheye toggle: walls drawn with the Euclidean distance | P1 | 4 | D-16c1b | done |
| D-16e3 | Rays on the minimap | P1 | 4 | D-16c1b | done |
| D-16f | Chunk borders on the minimap | P1 | 4 | D-16c1b | done |
| D-08d | Re-cut the reload frames so no drawing is cut or split | P0 | 4 | D-08c | pending |
| D-27a | Specify in the TDD: the enemy keeps a body distance, contact damage in whole hits, the red damage flash | P0 | 4 | D-21b | pending |
| D-27b | The enemy stops in front of the player at body distance, and the player cannot walk through enemies | P0 | 4 | D-27a | pending |
| D-27c | Contact damage in whole hit points: one on contact, then one per second | P0 | 4 | D-27b | pending |
| D-27d | Red damage flash from the screen edges, one pulse per hit | P0 | 4 | D-27c | pending |
| D-12a | Specify the arrow keys and the mouse in TDD 2.2 and the README | P1 | 4 | D-27d | pending |
| D-12b | Arrow keys: up and down move, left and right turn | P1 | 4 | D-12a | pending |
| D-12c | Mouse turn with pointer lock and a sensitivity setting | P1 | 4 | D-12b, D-16c1b | pending |
| D-12d | Left click fires, right click reloads | P1 | 4 | D-12c | pending |
| D-28a | Specify the UNAHUR at night look and the textured floor and ceiling in the TDD | P1 | 4 | D-09, D-10 | pending |
| D-28b | UNAHUR wall textures: white plaster, louvered windows, glass, green accents | P1 | 4 | D-28a | pending |
| D-28c | Floor and ceiling casting with floor tile and ceiling panel textures | P1 | 4 | D-28a | pending |
| D-28d | Night atmosphere: cold low light, darkness at distance, ceiling lamps at the room lights | P1 | 4 | D-28b, D-28c | pending |
| D-29a | Pick the CRT filter source and specify it in the TDD | P1 | 4 | D-16b2 | pending |
| D-29b | CRT post processing filter over the game, with an admin toggle | P1 | 4 | D-29a | pending |
| D-30a | Specify the seeded random in TDD 4.4 | P1 | 4 | D-11 | pending |
| D-30b | Seeded random for the map: one seed per world, one derived seed per chunk | P1 | 4 | D-30a | pending |
| D-30c | Enemy placement and patrol from the world seed | P1 | 4 | D-30b | pending |
| D-17a | Reset a game: new world, enemies, projectiles and player | P1 | 4 | D-14b | pending |
| D-30d | World seed in the admin panel: see it, type one, start a new world | P1 | 4 | D-30c, D-17a | pending |
| D-17b | Game state machine: menu, playing, victory, defeat | P1 | 4 | D-17a | pending |
| D-18a | Main menu: title, start game, controls, credits | P1 | 4 | D-16a3, D-17b | pending |
| D-18b | Controls and credits screens | P1 | 4 | D-18a | pending |
| D-20a | Defeat screen with play again and main menu | P1 | 4 | D-18a | pending |
| D-19a | Kill counter and KILLS label on the HUD | P2 | 4 | D-15b, D-17a | pending |
| D-19b | Enemy hit points, one for regular enemies | P2 | 4 | D-19a | pending |
| D-19c | Boss appears after the kill target | P2 | 4 | D-19b | pending |
| D-16c2 | Admin settings for the boss flow: enemy and boss hit points, spawn boss | P2 | 4 | D-16c1e, D-19c | pending |
| D-19d | Victory when the boss dies, victory screen | P2 | 4 | D-19c, D-20a | pending |
| D-20b | Score and local ranking storage | P2 | 4 | D-19d | pending |
| D-20c | Ranking on the victory and defeat screens | P2 | 4 | D-20b | pending |
| D-21a | Pick a licensed enemy sprite and embed it as a data URI | P2 | 4 | D-14b | done |
| D-21b | Textured enemies with z-buffer occlusion | P2 | 4 | D-21a | done |
| D-26 | Logomark and favicon from the enemy sprite's head | P2 | 4 | D-21a | done |
| D-21c | Boss as a tinted, larger enemy sprite | P2 | 4 | D-21b, D-19c | pending |
| D-16d | Admin render toggles: textures, lighting, flat color | P2 | 4 | D-16b2 | pending |
| D-27e | Enemies keep body distance from each other, optional | P2 | 4 | D-27b | pending |
| D-22 | Player initials in the ranking, optional | P3 | 4 | D-20c | pending |
| D-12e | Strafing, only if the team asks for it | P3 | 4 | D-12b | pending |

## Backlog review (2026-11-20)

Checked against the code, with `node --test "tests/*.test.js"` (102 of 102 pass) and `node --check` on every `js/` file. `main` and `develop` point to the same commit.

Already in the game (every story up to D-13d is done):
- Infinite procedural dungeon in 16 by 16 chunks, one or two rooms per chunk, fixed doors, chunks kept for the session.
- DDA raycaster with procedural brick textures, wall color per chunk, distance bands and one light per room.
- W, S, A, D movement with wall sliding.
- 21 by 21 minimap in the top-left corner, with enemies and projectiles.
- Center crosshair, health bar bottom-left, six-round ammo bar bottom-right.
- Amber enemy rectangles with idle, patrol and chase (DDA line of sight), and contact damage.
- Shotgun aimed at the crosshair, fire and reload animation, visible projectile with its range from the center ray DDA.
- Defeat: the game freezes under a dark overlay with a red frame. It has no text, and the only way to play again is reloading the page.

Not in the game yet: victory, kill count, boss, text on screen, main menu, end screens, score, ranking, restart, admin panel, enemy sprites.

Gaps found:
- Since a52ec0c (a fix outside the story flow) the enemy is a 0.3 by 0.6 cell rectangle with a 0.3 cell square footprint, but TDD 2.3.2 and D-04a still say a 0.5 cell square. Fixed in D-14a.
- The README controls lack Space and R, and the project map has no row for `js/enemies.js` (found in D-07d). Fixed in D-14a.
- TDD 2.1 says there is no victory condition. The new request contradicts it, so the TDD changes first (D-14b).
- The source and license of `assets/gun-sprites/` and `assets/ui-bars/` are not recorded. The credits screen needs them (D-18b).
- The open questions at the end of this file about the victory condition (D-06) and the reload key (D-08) were already settled.

Security check (same date): no active git hooks, no package manifests or install scripts, no tracked executables, no secrets in the history, no network requests from the game (the CDN URLs inside PixiJS are only for compressed texture transcoders, which the game never loads), and `lib/pixi.min.js` still matches the sha256 recorded in H-01b. The tests only read files inside the repo. Ignored leftovers on disk (`legacy/dist`, `legacy/node_modules/.vite`) can be deleted.

New scope requested by Juanma:
1. Collapsible admin panel; when collapsed, the game fills the window (D-16).
2. Textured enemies instead of the amber rectangles (D-21).
3. HUD: LIFE and AMMO top-left with labels, minimap top-right (D-15).
4. Victory: after enemy number 20 is killed, number 21 is a boss, in another color for now; killing it wins (D-19).
5. Main menu with the game name, start game, controls and credits (D-18).
6. Victory and defeat screens with play again and a ranking of past scores (D-20).

Added to support them: docs sync and TDD spec (D-14), game reset and state machine (D-17).

Open questions, settled in D-14b before any code (proposed default in parentheses):
- Boss hit points, size, contact damage and spawn point (5 hits, 1.5 times the regular size, 20 damage per second, the room center of a generated chunk next to the player's chunk; regular enemies keep spawning).
- Boss color until D-21c (crimson `0xe63946`).
- Score formula (100 per enemy, 1000 for the boss; a shorter game time breaks ties).
- Player name in the ranking (none, only the date; initials are the optional D-22).
- Admin panel contents and toggle key (live info, god mode, refill ammo, kill target, spawn boss, render toggles; the P key and a button; starts collapsed).
- Menus and end screens as HTML over the canvas or drawn with Pixi (HTML: real buttons, easier to style, scaled with the game frame of D-16a).
- Kill counter on the HUD (yes, "KILLS 3 / 20" under AMMO).

## Team and professor feedback (2026-11-22)

Requested by Juanma, in priority order:
1. The reload animation looks cut (D-08d, P0).
2. The professor said the enemy got too close and he walked through it: "it should leave at least the distance of their own bodies, not occupying the same space". The team wants the enemy to stop in front of the player, facing it, and hit once per second, each hit with a red flash from the screen edges that fades toward the center, in the same frame the health drops (D-27, P0).
3. Mouse: move it left and right to turn, left click fires, right click reloads. The arrow keys work too (D-12a to D-12d).
4. Walls, ceiling and floor that look like the UNAHUR buildings at night, dark and creepy, with textured ceiling and floor (D-28).
5. A CRT post processing filter, since the game emulates a 90s game (D-29).
6. The professor's idea: a seeded random instead of `Math.random`, so the same seed gives the same world, as in Minecraft. It organizes all the procedural generation and helps the tests (D-30).

Checked against the code and the TDD before writing the stories:
- Reload (D-08d): the strip frames are 142 px tall and were cut on a 4 by 5 grid of `Sgun.png`, but rows 2 to 5 of the sheet do not sit on that grid. Strip frames 6 and 7 are one drawing split in two; frames 9, 10, 11, 14, 15 and 16 lose the hand or the gun at their side edges; the raised hands of row 4 are taller than 142 px and lose the fingertips. The screenshot of the team shows strip frame 10 or 11.
- Enemy (D-27): `updateChase` moves the enemy toward the player's exact position, so it walks into the player, and nothing stops the player from walking into the enemy. `getContactDamage` drains `1 / 60` of a hit point per ticker unit within 0.6 cells, so the bar drops continuously. TDD 2.3.1 says exactly that ("de forma continua, así la barra baja de a poco"), so the TDD changes first (D-27a).
- Controls (D-12): TDD 2.2 leaves out the mouse on purpose and binds only W, A, S and D. It also says adding the mouse only changes the input and leaves the raycaster as it is, which still holds: a mouse turn is the same rotation matrix with an angle taken from the mouse movement.
- Look (D-28): TDD 6.5 draws ceiling and floor once, as two flat rectangles. Textured floor and ceiling need floor casting (Lode, "Floor and ceiling casting"), a per frame cost set by the pixels below and above the horizon, whatever the size of the world (TDD 3.6 still holds).
- CRT (D-29): `lib/pixi.min.js` (8.21.0) ships `NoiseFilter`, `ColorMatrixFilter`, `BlurFilter`, `DisplacementFilter` and `AlphaFilter`, but no CRT filter. `CRTFilter` lives in the separate `pixi-filters` package (6.1.5 today, MIT, peer dependency pixi.js 8). Using it is a new dependency, which needs the team's approval (`CLAUDE.md` 8.6).
- Seed (D-30): TDD 4.4 says the generator uses `Math.random` directly. `Math.random` appears in `js/mapgen.js` (room sizes and positions, second room), `js/world.js` (enemy placement) and `js/enemies.js` (patrol neighbour); `tests/enemies.test.js` replaces it with a function that returns 0.

Open questions, to settle before each story (proposed default in parentheses):
- D-08d: reload length once the drawings are re-cut, about 10 instead of 12 frames (keep 0.96 s, so each reload frame lasts about 0.096 s and the gameplay does not change).
- D-27: stop distance, center to center (0.5 cells: the two bodies measure 0.35 together, so 0.15 cells stay between them, and the enemy's head and chest fill the view without crossing the camera). First hit (on the frame contact starts, then one per second per enemy, so two enemies hit twice). Player against enemies (blocked at the same distance, but moving away is always allowed so the player never gets stuck). Enemies against each other (left for the optional D-27e).
- D-12: sensitivity unit and default (degrees per 100 px of mouse movement, 5 to 100, 20 by default, in the Player box of the admin panel). Whether a mouse click also fires before the mouse is captured (no: the first click only captures it).
- D-28: wall color per chunk (D-02) with the new white walls (the chunk color tints only the accent stripe, the plaster stays white). Floor casting technique (Lode's loop in JavaScript into a hidden canvas at strip resolution, uploaded as one texture per frame; a GPU shader only if the FPS in the admin panel drops). Flickering lamps (a few, decided per light from its position).
- D-29: filter source (the official `pixi-filters` browser bundle copied to `lib/` with a fixed version and its sha256, like PixiJS; the other option is our own GLSL filter). On by default (yes, with an admin toggle to compare).
- D-30: seed at the start of a game (a random one, shown in the admin panel, so every game differs and any game can be repeated by typing its seed). Seeded enemy placement and patrol too (yes, so no `Math.random` is left in `js/` except the one that picks the starting seed).

## H-01a: Repo layout

Acceptance criteria:
- `CLAUDE.md` lives at the repo root, and `docs/TDD.md` and `docs/img/figura-1-chunks.png` match the paths it uses.
- The old demo lives in `legacy/` (src, tests, html files, scripts, package.json, package-lock.json, Vite config, README) with no content changes. Its 12 Vitest tests still pass when run from `legacy/`.
- `references/` is removed from the git index and kept on disk (it was already in `.gitignore`).
- `.write-test` is deleted.
- The change set has only renames, deletions and one new file (`docs/BACKLOG.md`).

Decisions:
- H-01 was split into H-01a (layout) and H-01b (skeleton): it moved more than 40 files and created 5, too much to validate in 10 minutes.
- Camera state moved from H-05 to H-03, because H-04 already needs a player to draw from.
- Files were moved with `mv`; Git detects the renames. `references/` was untracked with `git rm -r --cached references`. It stays in history (commit 0293b23).
- The root `node_modules/` (ignored) stays until H-01b copies `pixi.min.js` (pixi.js 8.21.0) from it. After that it can be deleted.
- The legacy demo still runs with `cd legacy && npm install && npm run build`, then opening `legacy/dist/index.html`.
- Tag `demo-presentacion` goes on f97195a ("Readme del repo"), the last demo commit on `dev`. Created by Juanma in GitHub Desktop.
- 6690a65 (GitHub Pages paths for the legacy build) is no longer on any remote branch; the old `dev` line is now `main`. Not needed for the new architecture.

## H-01b: Classic script skeleton with PixiJS

Acceptance criteria:
- `index.html` loads `lib/pixi.min.js`, `js/config.js` and `js/main.js` with classic `<script>` tags, `main.js` last. No modules, no `fetch`.
- `lib/pixi.min.js` is the official pixi.js 8.21.0 browser bundle and defines the `PIXI` global.
- `main.js` wraps startup in an async function: `new PIXI.Application()`, `await app.init(...)`, `document.body.appendChild(app.canvas)`.
- Double click on `index.html` opens the canvas with the background color in Chrome, on both team machines, with no console errors.

Decisions:
- Canvas size is fixed at 800 by 600 (team decision), not the full window. With 2 px strips that is the 400 rays of the TDD 6.5 example.
- Screen size constants use Lode's names, `screenWidth` and `screenHeight`, so `lineHeight = screenHeight / perpWallDist` reads the same in the code and in the slides. Other config constants follow the same camelCase style.
- `config.js` only holds what this story uses (`screenWidth`, `screenHeight`, `backgroundColor`). Each later story adds its own constants.
- Colors come from the demo palette: page `#08111d`, canvas background `0x111e30`.
- `lib/pixi.min.js` is copied byte for byte from `node_modules/pixi.js/dist/` (8.21.0, sha256 `c6d9d4c8...833db0`). It keeps its `sourceMappingURL` comment; the `.map` file is not copied, so DevTools may report it missing in the Developer Resources panel. That is not a page error.
- No `preference` is passed to `app.init`: Pixi v8 picks WebGL by default.
- Checked with headless Chrome on `file://`: the 800 by 600 canvas shows the background color, centered on the page.
- `node --test tests/` has nothing to run yet; the test helper arrives in H-02.
- Pixi v8 does not print its console banner by default (`hello: false`), so an empty console is the expected result.
- Checked over the DevTools protocol on a clean Chrome 155 profile: no console messages, no exceptions, `PIXI.VERSION` is `8.21.0` and the canvas is 800 by 600. The "Unsafe attempt to load URL file:///... from frame with URL file:///..." message seen during validation comes from DevTools device mode or a browser extension, not from the page.

## H-02: Fixed world behind getCell

Acceptance criteria:
- `js/world.js` exposes `getCell(x, y)` over the 15 by 15 demo map, in cell units. Any coordinate outside the map, negatives included, returns 1 (wall).
- `getCell` takes cell integers and does not floor them: callers convert world positions with `Math.floor` (TDD 5.2).
- `index.html` loads `js/world.js` between `config.js` and `main.js`.
- A test helper loads the `js/` files in `index.html` order into a single `vm` context and returns names by evaluating them in that context.
- `node --test "tests/*.test.js"` passes: air and wall cells inside, a non symmetric cell that catches swapped x and y, one cell past each side, negative and far coordinates.
- Double click still shows the background with no console errors, and `getCell(7, 1)` typed in the console returns 0.

Decisions:
- The test command is `node --test "tests/*.test.js"`. The quotes let Node expand the pattern, so it works the same on macOS and Windows (Node 21 or later). `node --test tests/` fails on Node 22 (it treats the folder as a file, `MODULE_NOT_FOUND`), and a bare `node --test` would also pick up the Vitest files in `legacy/tests/`. `CLAUDE.md` 8.7 and 10.2 were updated to match.
- The fixed map stays an array of rows, `fixedMap[y][x]`, copied from `legacy/src/game/World3D.js`. It reads like a drawing and H-08 removes it, so it does not use the chunk `Uint8Array` layout.
- `tests/load-scripts.js` reads the script order from `index.html` instead of keeping its own list, so the two cannot drift. It skips `js/main.js`, which starts Pixi and needs a browser.
- Top level `const` values in a `vm` context are not properties of the context object, so the helper reads globals by evaluating their name in the context.
- Checked with headless Chrome on `file://`: the 800 by 600 canvas still appears, and the page sees `getCell(7, 1)` as 0 and `getCell(-1, -1)` as 1.

## H-03: Camera and DDA raycaster

Acceptance criteria:
- `js/player.js` holds six numbers: posX, posY, dirX, dirY, planeX, planeY. dir has length 1, plane has length 0.66 and is perpendicular to dir. Spawn is an air cell of the fixed map.
- `js/raycaster.js`: per column, `cameraX = 2 * x / width - 1` and `rayDir = dir + plane * cameraX`, not normalized (TDD 3.2).
- DDA per TDD 3.3: stops on a wall or past the max ray distance (24 cells). Returns hit, perpWallDist, side, mapX, mapY.
- perpWallDist is read once after the loop: `sideDistX - deltaDistX` or `sideDistY - deltaDistY`, chosen by side (TDD 3.4).
- Tests: axis aligned ray, zero ray component (Infinity deltaDist), max distance cutoff, perpWallDist against a hand computed value.

Decisions:
- One commit for the whole story, by team decision, even though it touches six files (`index.html`, `config.js`, `player.js`, `raycaster.js` and two test files). The proposed split into camera and DDA was declined.
- Spawn at (7.5, 1.5) facing east, the demo spawn (480, 96 px with 64 px cells), at the start of the row 1 corridor. H-08 moves it to the room of chunk (0, 0).
- dir = (1, 0), plane = (0, 0.66). The map grows downward in y, so facing east the right hand side is +y: plane is dir rotated 90 degrees with the rotation matrix (x' = -y, y' = x). With the opposite sign the view comes out mirrored and would not match the minimap of H-06. A test checks it.
- `raycaster.js` has two functions. `castRayForColumn(player, x)` takes x in pixels, from 0 to `screenWidth - 1`, and builds cameraX and rayDir. `castRay(posX, posY, rayDirX, rayDirY)` is the DDA alone, so D-05 (line of sight) and D-07 (shooting, rayDir = dir) can reuse it.
- Max distance: before crossing the next grid line, the loop stops with `hit: false` if `Math.min(sideDistX, sideDistY)` is past `maxRayDistance` (24, in `config.js`). It is measured in the same unit as perpWallDist, so the cutoff is a straight line parallel to the camera plane, not an arc. A wall at perpWallDist 24 or less is always seen.
- When `hit` is false, perpWallDist is not meaningful; callers check `hit` first (H-04 paints the background).
- The TDD 6.3 table says the raycaster returns distPerp and side. It also returns hit (for the background), mapX and mapY (for D-02, color per chunk). Not a contradiction, the extra fields are a superset.
- Tests compare results field by field: objects made inside the `vm` context have their own `Object.prototype`, and `assert.deepEqual` rejects them.
- The max distance tests run in a second `vm` context where `getCell` is replaced by open floor with a wall from x = 30, because no ray can travel 24 cells in the fixed map.
- Checked by mutation: the tests fail with a mirrored plane, with the euclidean distance on side 1, without the distance cutoff and without `Math.abs` in deltaDist. They do not catch `rayDirX <= 0` in the step choice: with a zero component it gives `sideDistX = 0 * Infinity = NaN`, but every comparison with NaN is false, so the loop still picks y and the result is right.
- Checked with headless Chrome on `file://`: the canvas still appears with no errors, and `castRayForColumn(player, 400)` returns hit true, perpWallDist 6.5, side 0, cell (14, 1).

## H-04: Flat wall strips render

Acceptance criteria:
- Ceiling and floor are drawn once, in their own Graphics.
- The walls Graphics calls `clear()` each frame and groups rects by side, with one `fill()` per side (TDD 6.5). Side 1 faces are darker than side 0 faces.
- Strip width comes from `config.js`. `lineHeight = screenHeight / perpWallDist`; drawStart and drawEnd are clipped to the screen.
- A column with no hit shows the background color, in the place a wall at `maxRayDistance` would take.
- No Pixi objects are created inside the ticker (TDD 6.4).
- Tests: strip height and position against hand computed values, clipping, distance 0, one fill per side from the spawn, background strips when every ray misses.

Decisions:
- Rays with no hit (option A, chosen by the team): the strip gets `backgroundColor` with the height of a wall at `maxRayDistance` (600 / 24 = 25 px), centered on the horizon. It reads as darkness at the end of a corridor and joins the farthest visible walls. A full height background column, the literal reading of TDD 5.2, would cut through the floor in front of the player, because ceiling and floor cover the whole canvas (TDD 6.5).
- So a frame has up to three `fill()` calls: one per side, plus one for missed rays only when some ray misses. A group with no strips skips its `fill()`.
- TDD updated with this wording, approved by the team: 5.2, "y en esa columna, en el lugar de la pared, se dibuja una franja del color de fondo con la altura que tendría una pared en el tope"; 6.5, "dos llamadas de relleno, una por cara de pared, más una para las columnas sin impacto cuando las hay".
- Each strip casts the ray of its left column, `x = 0, 2, ..., 798`, so column 400 is still cameraX 0, the H-03 center test.
- `getWallStrip(x, perpWallDist)` is the pure projection (TDD 3.4) and returns x, lineHeight, drawStart and drawEnd. Values stay as floats; Pixi rasterizes them. perpWallDist 0 gives Infinity, which the clip turns into the full column, with no special case.
- Checked in `lib/pixi.min.js`: in v8, `rect()` adds to the active path and `fill()` paints the whole path as one instruction, then clears it. That is what lets a group cost one `fill()`.
- Colors from the demo palette: ceiling `0x1a1a2e`, floor `0x2d2d44`, side 0 `0x4a6fa5`, side 1 `0x2c4a7c`. The demo also changed the tone by ray direction (4 colors); with one fill per side there are only 2.
- Walls are redrawn every frame even though the player does not move yet, so H-05 only adds movement.
- Five code files in one commit (one is the test), the same criterion the team accepted in H-03.
- The render tests use a fake Graphics that records `clear`, `rect` and `fill`, and a second `vm` context with open floor for the missed rays. Checked by mutation: they fail without either clip, with swapped side colors, without the background strips, with full height background strips, with one `fill()` per strip and without `clear()`.
- Checked with headless Chrome on `file://`: the spawn view shows the row 1 corridor with straight walls, and a copy with `maxRayDistance` set to 5 shows a 120 px background strip (600 / 5) where the end wall at 6.5 was. No console messages from the page.

## H-05a: Player input and movement logic

Acceptance criteria:
- `createKeyboardInput(target)` tracks W, A, S and D in a Set and ignores other keys.
- `updatePlayer(player, pressedKeys, deltaTime)` moves along dir and rotates dir and plane with the same rotation matrix.
- Each axis is tested separately against `getCell`, so the player slides along walls (TDD 6.6).
- Tests cover key tracking, deltaTime movement, rotation and sliding on both axes.

Decisions:
- Split H-05 into H-05a (movement logic) and H-05b (ticker integration) to keep each story within the four-file limit.
- Use a point collider, as specified by TDD 6.6. The demo's circular collider is not carried over.
- Preserve the demo speeds, converted from 200 px/s and 3 rad/s to cells and radians per 60 Hz ticker unit.

## H-05b: Connect player controls to the ticker

Acceptance criteria:
- Register keyboard listeners once outside the ticker.
- Update the player with `ticker.deltaTime` before drawing walls.
- Only W, A, S and D move or rotate the player (TDD 2.2).
- Manual check: walk, rotate and slide along the fixed map walls.

## H-06: Minimap

Acceptance criteria:
- 21 by 21 cell window centered on the player, read through `getCell`, cells grouped by color.
- Dot for the position and a line for the direction.
- Matches the first person view (TDD 6.7).

Decisions:
- Overlay the minimap in the upper-left corner, as specified by TDD 2.3.3.
- Use 10 pixels per cell, giving a 210 by 210 pixel window, with a 10 pixel screen margin.
- Draw the floor and walls in color groups, followed by the player's position and direction.

## H-07a: Clarify fixed chunk door coordinates

Acceptance criteria:
- TDD 4.2 states that each border door is at index 8.

Decisions:
- The team approved index 8 as the fixed door coordinate because a 16-cell border has two central indices, 7 and 8.

## H-07b: Chunk generator

Acceptance criteria:
- `js/mapgen.js` returns `{ cells, room, roomCenter }`, where `cells` is a 16 by 16 `Uint8Array` (index `ly * 16 + lx`, 0 air, 1 wall), per TDD 4.2.
- The room is 4 to 8 cells per side, has at least 2 wall cells of margin and connects to doors at index 8 through three-segment corridors.
- Tests: solid borders except doors, room inside the margins, every door connected to the room (flood fill in the test, never at runtime).
- ASCII dump of a chunk in the console for a visual check.

Decisions:
- `room` and `roomCenter` are generation metadata for H-08; the world stores only the `cells` typed array in its chunk Map.

## H-08a: Decouple algorithm tests from the fixed map

Acceptance criteria:
- DDA, renderer and collision tests use controlled cell fixtures instead of relying on `fixedMap`.
- Existing numerical assertions continue to verify the same ray and projection behavior.

## H-08a2: Decouple player movement tests from the world map

Acceptance criteria:
- Movement tests use a controlled open world and a known camera state.
- Collision tests use a controlled wall fixture.
- Spawn tests continue to validate the actual player's position against `getCell`.

## H-08b: Infinite world

Acceptance criteria:
- Chunks live in a `Map` keyed by the Cantor pairing of cx and cy after mapping them to non negatives (TDD 6.8). Each chunk is generated once and kept for the session.
- `getCell`: `cx = Math.floor(x / 16)`, local `x - cx * 16`; generates the chunk on demand, including for negative coordinates.
- Spawn at the center of the room in chunk (0, 0).
- The fixed map is removed.
- Tests: negative coordinates and chunk borders, neighboring door connections, Cantor uniqueness over a range with negatives, retained chunk identity and spawn in air.

Decisions:
- The chunk Map stores only each generated `Uint8Array`. Room-center metadata is retained separately for the initial spawn.

## H-09a: Remove legacy docs and HTML entries

Acceptance criteria:
- Delete `legacy/README.md`, `legacy/dev.html` and `legacy/index.html`.

## H-09b: Remove legacy package manifests

Acceptance criteria:
- Delete `legacy/package.json`, `legacy/package-lock.json` and `legacy/standalone.html`.

## H-09c: Remove legacy build tools and bootstrap

Acceptance criteria:
- Delete `legacy/scripts/build-standalone.js`, `legacy/vite.config.js` and `legacy/src/main.js`.

## H-09d: Remove legacy layout, styling and math files

Acceptance criteria:
- Delete `legacy/src/application/Game3DLayout.js`, `legacy/src/style.css` and `legacy/src/math/Vector2.js`.

## H-09e: Remove legacy input and DDA files

Acceptance criteria:
- Delete `legacy/src/input/KeyboardInput.js`, `legacy/src/input/PointerInput.js` and `legacy/src/raycast/DDA.js`.

## H-09f: Remove legacy raycast and collision files

Acceptance criteria:
- Delete `legacy/src/raycast/Raycast.js`, `legacy/src/game/Collision.js` and `legacy/src/game/Obstacle2D.js`.

## H-09g: Remove legacy game controllers and 2D player

Acceptance criteria:
- Delete `legacy/src/game/Game2D.js`, `legacy/src/game/Game3D.js` and `legacy/src/game/Player2D.js`.

## H-09h: Remove legacy 3D player and worlds

Acceptance criteria:
- Delete `legacy/src/game/Player3D.js`, `legacy/src/game/World2D.js` and `legacy/src/game/World3D.js`.

## H-09i: Remove legacy canvas and base renderers

Acceptance criteria:
- Delete `legacy/src/rendering/CanvasApp.js`, `legacy/src/rendering/Draw.js` and `legacy/src/rendering/Game2DRenderer.js`.

## H-09j: Remove legacy 3D and minimap renderers

Acceptance criteria:
- Delete `legacy/src/rendering/Game3DRenderer.js`, `legacy/src/rendering/MinimapRenderer3D.js` and `legacy/src/rendering/RayRenderer2D.js`.

## H-09k: Remove remaining legacy renderers

Acceptance criteria:
- Delete `legacy/src/rendering/ObstacleRenderer2D.js`, `legacy/src/rendering/PlayerRenderer2D.js` and `legacy/src/rendering/RaycasterRenderer3D.js`.

## H-09l: Remove legacy lighting and debug panels

Acceptance criteria:
- Delete `legacy/src/rendering/PointLighting.js`, `legacy/src/ui/DebugPanel2D.js` and `legacy/src/ui/DebugPanel3D.js`.

## H-09m: Remove legacy menu and initial tests

Acceptance criteria:
- Delete `legacy/src/ui/Menu.js`, `legacy/tests/collision.test.js` and `legacy/tests/game3d-layout.test.js`.

## H-09n: Remove remaining legacy tests

Acceptance criteria:
- Delete `legacy/tests/point-lighting.test.js`, `legacy/tests/raycast-dda.test.js` and `legacy/tests/raycast.test.js`.

## H-09o: Add README and verify the minimum scope

Acceptance criteria:
- `legacy/` is fully removed from the working tree.
- English README: how to open, controls, which file implements each TDD section, course and university.
- TDD 7.3 success criteria and TDD 7.2 risks checked one by one.

Decisions:
- README includes the open instructions, WASD controls, file-to-TDD map and course information.
- Chrome opened the root `index.html` through `file://`, rendered the canvas and accepted WASD input across x = 0 into chunk (-1, 0).
- Chunk persistence, door connectivity, negative coordinates, projection and grouped rendering are covered by the root test suite.
- The minimap was visually checked against the procedural first-person view.
- The empty `legacy/` directory was removed after its tracked files were deleted; `.agents/Demo RayCast/` remains a reference copy.

## H-10a: Change the canvas to 1280 by 720

Acceptance criteria:
- `screenWidth` and `screenHeight` are 1280 and 720, giving the canvas a 16:9 ratio.
- Projection heights, clipping and missed-ray strips use the 720-pixel canvas height.
- With 2-pixel strips, the renderer draws 640 rays per frame.

Decisions:
- Keep the full canvas as the playable viewport, with no letterbox bands.
- Keep the strip width at 2 pixels, accepting the increase from 400 to 640 rays per frame.

## H-10b: Document the 16:9 canvas dimensions

Acceptance criteria:
- TDD 6.5 and README identify the 1280 by 720 canvas and 640 rays per frame.

## D-01: Distance darkening in brightness bands

Acceptance criteria:
- Perpendicular wall distance selects one of four brightness bands over `maxRayDistance`.
- Side 1 faces remain darker than side 0 faces in every band.
- Missed rays still use the background color, and strips with the same final color share one fill.
- Tests cover band boundaries, face brightness and grouped wall fills.

Decisions:
- Band intervals are 0 to 6, 6 to 12, 12 to 18 and 18 to 24 cells.
- Brightness levels are 100%, 80%, 60% and 40%, from near to far.

## D-02: Wall color per chunk

Acceptance criteria:
- Every hit wall uses a palette color selected deterministically from the hit cell's chunk coordinates.
- Negative chunk coordinates use `Math.floor` and the existing Cantor key.
- Side 1 shading and D-01 distance bands apply to each chunk color.
- Strips with the same final color are drawn with one fill.
- Tests cover stable color selection, negative coordinates and combined shading.

Decisions:
- Use a four-color muted palette: blue, teal, amber and violet.
- Select the palette entry by the Cantor key modulo the palette length, with no additional color Map.

## D-04a0: Specify enemy population in the TDD

Acceptance criteria:
- TDD 2.3.2 states the weighted enemy count, the empty spawn chunk, placement rules and collider size.

Decisions:
- Use 50%, 30%, 15% and 5% for zero through three enemies in non-spawn chunks; chunk (0, 0) is always empty.
- Enemies occupy unique air cells anywhere in a chunk and use amber 0.5-cell square colliders.

## D-04a: Populate chunks with registered enemies

Acceptance criteria:
- Chunk (0, 0) has no enemies; each other chunk rolls 0, 1, 2 or 3 enemies with probabilities 50%, 30%, 15% and 5%.
- Enemies occupy distinct air cells anywhere in the chunk, including corridors, and use 0.5-cell square colliders.
- Enemy objects and their per-cell registration persist when the chunk is revisited.
- Tests verify population thresholds, free-cell placement, unique cells and persistence.

Decisions:
- Enemy squares use the amber palette color `0xffc857`.
- Their initial state is `idle`; state transitions arrive in D-05.

## D-04b: Show enemies on the minimap

Acceptance criteria:
- Registered enemies are drawn in their cells as amber markers.
- Enemy positions update through the per-cell registry when D-05 moves them.

## D-04c1: Store wall depth for enemy occlusion

Acceptance criteria:
- The wall renderer exposes perpendicular depth for each screen strip.
- Missed rays use `maxRayDistance` as their occlusion depth.
- Tests verify the z-buffer values against DDA results.

## D-04c2: Render enemy squares with z-buffer occlusion

Acceptance criteria:
- Enemies are projected as 0.5-cell squares in the first-person view.
- Enemy strips draw only where the enemy is closer than the wall depth.
- Manual check verifies a wall hides an enemy behind it.

## D-05a: Enemy idle timer and two-point patrol movement

Acceptance criteria:
- Every enemy starts in `idle` and switches to `patrol` after two seconds.
- In `patrol` the enemy walks between two neighbouring air cell centers at one cell per second.
- Moving an enemy updates its per-cell registration when it crosses a cell boundary.
- Tests cover the idle transition, patrol speed, the two-point oscillation and registry updates.

Decisions:
- Timings are measured in 60 Hz ticker units: `deltaTime` accumulates and speeds are cells per tick.
- If an enemy has no adjacent air cell to patrol to, it stays `idle`.

## D-05b: Enemy line of sight and chase with return to patrol

Acceptance criteria:
- Within 24 cells and with a clear 360 degree DDA line of sight, the enemy chases the player at two cells per second.
- After losing line of sight for one second, the enemy returns to `patrol`.

## D-06b: Health, contact damage and defeat

Acceptance criteria:
- The player starts with 100 of 100 health, never goes below zero and is defeated at zero.
- An enemy within 0.6 cells deals 10 damage per second of contact.
- At zero health the ticker stops updating the player and the enemies.
- Tests cover the starting health, damage clamping and contact damage at range.

Decisions:
- Health lives on the player object; damage and defeat checks live with the player logic.
- Contact damage accumulates per enemy per tick, so two overlapping enemies cost double.

## D-06c: Draw the health bar and defeat overlay

Acceptance criteria:
- A health bar sits in the bottom-left corner, drawn from the embedded empty and full bar images.
- The full bar width shrinks with the current health fraction.
- A defeat overlay appears when health reaches zero.

## D-07a: Shoot enemies with the center ray DDA

Acceptance criteria:
- Space fires one shot per press and ignores the browser key repeat.
- The shot uses the center ray (cameraX 0, rayDir equal to dir) with the same DDA as the render.
- A wall closer than an enemy blocks the shot; one hit removes the enemy.
- Tests cover a direct hit, a blocked shot, a lateral miss, an enemy behind and the key repeat.

Decisions:
- Hits use the enemy as a circle of radius `enemySize / 2`, as allowed by TDD 2.3.1.
- Only the nearest enemy along the ray is hit.

## D-07b: Add the Sgun idle and firing animation

Acceptance criteria:
- The shotgun sprite sits at the bottom-center of the view.
- Frame 1 of row 1 is idle; the next four frames play once on each shot.
- Each animation frame lasts 0.08 seconds.

Decisions:
- The sheet is not on a clean grid: its flat violet background (RGB 86, 82, 167) has to be keyed out and the frames touch, so they are cut by flood-filling the gun's own connected pixels inside its cell (keeps a frame from bleeding into its neighbour).
- Frames are aligned on the gun body (horizontal centroid of the lower quarter, bottom row) so the gun does not jump when firing.
- The five frames are pre-processed offline into a small transparent strip and embedded as a data URI in `js/weapon-sheet.js`; under `file://` the canvas would be tainted if the PNG were read from disk (TDD 6.1).
- The sprite uses the idle frame until a shot calls `triggerShotgun`; the four firing frames play once and fall back to idle.

## D-07c: Aim the shotgun barrel at the crosshair

Acceptance criteria:
- The barrel axis of the idle frame, extended on screen, crosses the horizon at the crosshair (screen center).
- The sprite is moved horizontally only: no rotation, same scale, same bottom anchor.
- The fire and reload frames move with it, since they are aligned on the gun body (D-07b).
- Tests check the crossing point by projecting the axis to the screen, and the sprite x against a hand computed value (about 791 px).

Decisions:
- The barrel points along dir, and the center ray (cameraX 0, rayDir equal to dir) meets the horizon at the screen center. So the barrel line on screen has to pass through the crosshair (TDD 2.3.1 and 3.2).
- The axis was measured on the idle frame: the gold bead at the breech, between the two barrels, at frame pixel (63, 74), and the front sight at (39, 35). It leans about 32 degrees to the left.
- Moved instead of rotated: the art is a gun held to the right with no roll (both barrels at the same height). Rotating it about 32 degrees would cant the gun and lift its cut bottom edge off the screen. Moving it 151 px right keeps the art intact and makes the axis cross the crosshair.
- `getAimedShotgunX` derives the x from the two axis points with similar triangles, so a new sprite only needs its two points measured again.
- The edges of the barrels converge a little below the horizon (about 100 px), on the same axis line: the art has the gun pitched slightly down. Left as is; the aim criterion is the axis line.
- The README still says "Bottom-center shotgun"; D-07d updates it, to keep this story within four files.

## D-07d: Document the aimed shotgun in the README

Acceptance criteria:
- The README row for `js/weapon.js` says the shotgun is aimed at the crosshair instead of bottom-center.

Decisions:
- The row also cites TDD 2.3.1, the section that puts the aim on the fixed center crosshair.
- Found while editing, left out of this story: the README controls table lacks Space (fire) and R (reload), and `js/enemies.js` has no row in the project map.

## D-07e: Show the whole muzzle flash in the firing frames

Acceptance criteria:
- No firing frame loses part of its muzzle flash at the left or right edge of the frame.
- The gun keeps its place on screen and stays aimed at the crosshair (sprite x about 791 px).
- Idle and reload frames are unchanged, pixel for pixel.
- A test checks that the strip width in the PNG header is the frame count times the frame width.

Decisions:
- Cause: the strip frames were 133 px windows aligned on the gun body, and the flame of firing frames 2 to 4 reaches up to 23 px left of that window (frames 2 and 3 were also limited by the grid cell of the original sheet). Nothing was off screen.
- The frame is now 179 px: the old 133 plus 23 transparent px on each side. A symmetric margin keeps the bottom-center anchor on the same gun pixel, so `getAimedShotgunX` returns the same value; only `shotgunBreechX` and `shotgunSightX` move 23 px (86 and 62).
- Firing frames 1 to 4 were re-cut from `Sgun.png` at the same alignment, keeping every pixel of the frame's own cluster (gun plus flame, with gaps of up to 4 px bridged so loose flame particles stay with their frame). Idle and reload frames were copied as they were, centered. Every old pixel was checked to be kept unchanged.
- Rows above the sheet cannot be recovered: the flame of frame 3 already touches the top edge of `Sgun.png`, and frame 4 loses one 7 px row at the top. Not visible.
- The strip is regenerated offline (Node, zlib only) and embedded again; `js/weapon-sheet.js` went from about 233 KB to about 157 KB, because the new PNG is compressed better.

## D-08a: Track six shotgun rounds and reload state

Acceptance criteria:
- The magazine holds six rounds; firing spends one and an empty magazine cannot fire.
- R starts a reload, only when the magazine is under six; the reserve is unlimited.
- A reload takes `reloadDuration` seconds and cannot be interrupted or repeated.
- Firing is blocked while reloading.
- Tests cover spending rounds, the empty case, the reload gate and the reload timing.

Decisions:
- Reload key is R, confirmed with the team (the TDD leaves it open).
- Reload duration is 0.9 s, to be matched to the remaining `Sgun.png` frames in D-08b.
- Ammo and reload state live on the player; the reload input mirrors the fire input (one action per press, key repeat ignored).

## D-08b: Draw the six-round ammo bar

Acceptance criteria:
- A six-segment ammo bar sits in the bottom-right corner (the top band of the UI sheet).
- The lit width follows the loaded fraction of the magazine, clamped to the bar.
- The bar is built from embedded data URIs, once, outside the ticker.

Decisions:
- Split from the reload animation so each half is a small, testable story.
- The top bar band (rows 0 to 15) has exactly six segments, one per round, so the same width-scaling trick as the health bar reads as six rounds.
- `loadBarCanvas` now takes the band Y, so the health band (rows 20 to 35) and the ammo band (rows 0 to 15) share one loader.

## D-08c: Play the Sgun reload animation while reloading

Acceptance criteria:
- Pressing R on an incomplete magazine plays the reload frames, then returns to idle.
- The animation lasts as long as the reload (`reloadDuration`).
- Firing and reloading share one animation player.

Decisions:
- The lower rows of `Sgun.png` do not sit on the 4 by 5 grid, so the reload frames were picked by inspecting the sheet: frames 5 to 16 (the hand opening the gun and inserting shells). Frames 17 to 19 were grid fragments and are dropped.
- The embedded strip now holds all 17 frames (idle, four firing, twelve reload); the sheet grew to about 233 KB.
- `shotgunFrameDuration` (0.08 s) times the 12 reload frames sets `reloadDuration` to 0.96 s, so the logic and the animation end together.
- `weapon.js` gained one generic sequence player: both the fire and the reload feed it a frame list.

## D-09: Procedural wall textures on a hidden canvas

Acceptance criteria:
- Walls show a procedural brick texture, generated in code, with no external image.
- The texture column follows `wallX` / `texX` (Lode part 2), so the pattern is aligned to the wall face.
- Chunk color, side shading and distance shading still apply.
- Flat color mode stays available.

Decisions:
- The brick pattern is drawn once on a hidden 64 by 64 canvas in grayscale; a strip sprite tinted with the existing `getWallColor` combines texture, chunk color and shading in one multiply.
- One texture per texture column (64 columns) is sliced out of the canvas and reused by 640 pre-created strip sprites, so no Pixi object is created inside the ticker (TDD 6.4).
- The strip sprites keep their unclipped height and let the canvas edge clip them, which keeps the texture aligned when a wall is taller than the screen.
- `useWallTextures` in `config.js` defaults to true; set it to false to return to flat color mode (TDD 1.3).

## D-11: Second room per chunk

Acceptance criteria:
- Roughly half of the chunks get a second room, 4 to 6 cells per side.
- The second room stays inside the two-cell margin and never shares a cell with the main room.
- The second room is reachable from the main room, so connectivity is kept.
- The fixed doors keep working.

Decisions:
- `Math.random() < 0.5` decides whether the chunk gets the room. The room is placed by rejection sampling inside the margin, away from the main room (no shared cell), and connected by an L corridor between the two room centers.
- A main room up to 8 by 8 can leave no space for a 4 to 6 room, so the realized share sits a little under 50 percent (about 47 percent in a sample of 8000 chunks): the tests assert a range, not an exact half.
- The room centers are always inside their rooms, so the connecting corridor only crosses interior cells and never opens the border.

## D-10: Raycast lighting with one light per room

Acceptance criteria:
- Every room of a chunk has a light at its center, in world coordinates.
- A wall strip is brighter the closer and more directly it faces a light, and a wall between the strip and the light casts a shadow.
- Flat color, distance shading and textures all keep working.

Decisions:
- Ported the legacy `pointLightFactor`: illumination is the ambient floor plus, per light in range that faces the wall, `intensity * (1 - distance / radius)`, unless a shadow ray hits a wall first. Radius 3.75, intensity 0.85, ambient 0.22 (the values the team approved).
- The wall hit point is `pos + perpWallDist * rayDir`, which is exact because `dir` is unit and `plane` is perpendicular. The face normal points toward the side the ray came from.
- A light sits at least four cells from any chunk border and the radius is under four, so `getLightsAtCell` only needs the chunk of the hit cell.
- `useLighting` in `config.js` defaults to true and, when on, the light factor replaces the distance brightness bands; set it to false to fall back to the distance shading of D-01.

## D-03a: Add a vector crosshair HUD

Acceptance criteria:
- A small four-arm crosshair is centered in the 1280 by 720 view.
- Draw the crosshair with PixiJS Graphics, without an external image.
- Create and draw the HUD Graphics outside the ticker.
- Life and ammo indicators remain deferred to D-06 and D-08.

Decisions:
- Use the minimap's teal accent, 2-pixel arms of 8 pixels and a 4-pixel center gap.

## D-03b: Document the HUD file in the README

Acceptance criteria:
- README maps `js/hud.js` to TDD 2.3.3 and 6.4.

## D-13: Shotgun projectile (split in four)

Juanma asked for a visible projectile that flies toward the crosshair and disappears when it hits a wall or an enemy. TDD 2.3.1 resolves the shot instantly with the center ray, so the TDD changes first (D-13a).

Decisions (option A, confirmed by Juanma; the details were left to Claude):
- The projectile carries the hit: an enemy dies only when a projectile reaches it. If the enemy moves out of the way first, the shot misses.
- The center ray DDA still decides where the shot meets the wall: when firing, `castRay` from pos along dir (cameraX 0, rayDir equal to dir) gives the wall distance, and the projectile keeps it as its range. Walls never change during the session (TDD 4.4), so the range stays valid. No wall within `maxRayDistance` gives a range of `maxRayDistance`.
- It starts at the player position and moves along dir as fired; turning afterwards does not steer it. Speed is 20 cells per second (`projectileSpeed`), times `ticker.deltaTime`.
- Enemy hit per tick: the segment travelled in that tick is tested with the same along and lateral math as D-07a (within `enemy.width / 2` of the line), so a fast projectile cannot skip a thin enemy. The nearest enemy on the segment is hit, removed, and the projectile disappears. One projectile kills at most one enemy.
- Only the enemies registered in the cells the segment touches are tested (`getEnemiesAtCell`), with the segment's bounding box widened by half an enemy width, so an enemy whose center sits in the next cell is still caught. This is the per-cell registry TDD 2.3.1 describes (spatial hashing), instead of the loop over every enemy that `shootCenterRay` uses.
- Several projectiles can be in flight; they live in a plain array, not in the per-cell registry, because they are few and short lived.
- Look: a small square on the horizon, projected and occluded with the z-buffer like the enemies (Lode part 3), and a dot on the minimap. Size and color were settled in D-13c.

Stories:
- D-13a: rewrite TDD 2.3.1 (and the note in 2.3.2) for the projectile. Files: `docs/TDD.md`, `docs/BACKLOG.md`.
- D-13b: `js/projectiles.js` with fire, update and the hit tests; script tag in `index.html` after `enemies.js`; `tests/projectiles.test.js` (wall stop, enemy hit, enemy that moves away, no tunnelling, max range). Nothing visible changes yet.
- D-13c: `drawProjectiles` in `js/renderer.js`, wiring in `js/main.js` (one Graphics created once, fire spawns a projectile instead of `shootCenterRay`), README row for `js/projectiles.js`.
- D-13d: projectile dot in `js/minimap.js`; remove `shootCenterRay` from `js/enemies.js` and its tests from `tests/weapon.test.js` (the plan said `gun.test.js` by mistake; those tests live in `weapon.test.js`).

Juanma asked for D-13b, D-13c and D-13d in one go, without stopping between them. They touch separate files, so each one can still be its own commit; this backlog file goes with D-13d.

## D-13a: Specify the shotgun projectile in the TDD

Acceptance criteria:
- TDD 2.3.1 describes the projectile: it leaves the player along the center ray (cameraX 0, rayDir equal to dir), its range is the wall distance the DDA returns when firing, and each frame it advances and checks the segment it travelled.
- It states the three ways a projectile disappears: it hits an enemy (the enemy dies), it reaches the wall, or it travels the max ray distance with no wall.
- It keeps the per-cell enemy registry: only the cells the segment touches are checked.
- The closing note of TDD 2.3.2 says the projectile range, not an instant hit, reuses the chapter 3 DDA.

Decisions:
- The text was approved by Juanma before editing.
- The TDD header date is left as is, like the earlier TDD stories (D-04a0, D-06a).

## D-13b: Projectile logic

Acceptance criteria:
- `fireProjectile` casts the center ray once and keeps the wall distance (or `maxRayDistance`) as the range.
- `updateProjectiles` moves each projectile `projectileSpeed * deltaTime` along its dir, never past its range, and removes the ones that hit an enemy or reached the range.
- The hit test checks the whole segment of each tick, only in the cells it touches, and removes the nearest enemy.
- Tests cover: range from the wall and the max range, the step per tick, the stop on the wall face, a kill, a wall in front of the enemy, an enemy that steps aside, a long step that would skip the enemy, an enemy centered in the next cell, an enemy beside the line, an enemy behind the player, the nearest of two, and negative coordinates.

Decisions:
- `projectileSpeed` (20 cells per second) lives at the top of `js/projectiles.js`, like the enemy constants in `js/enemies.js`, instead of `config.js`, to keep the story within four files.
- `advanceProjectile` returns "done" from the distance asked versus the distance left, not from comparing the accumulated float with the range, so rounding cannot keep a projectile alive at the wall.
- The script loads right after `enemies.js`, because it uses `ticksPerSecond`, `removeEnemy` and the enemy registry.

## D-13c: Draw projectiles and fire them

Acceptance criteria:
- Space launches a projectile instead of the instant hit; the firing animation and the ammo work as before.
- The projectile shows as a small square on the horizon that shrinks as it flies away, and walls hide it like they hide enemies.
- It disappears at the wall, at the max distance, or on the enemy it kills.
- The Graphics object is created once, outside the ticker (TDD 6.4).

Decisions:
- Size 0.05 cells, color red-orange `0xff5a1f`. A pale yellow was tried first and was hard to see over the amber enemies (checked in headless Chrome).
- Not drawn closer than 0.75 cells, where it would be a square of about 50 px or more over the crosshair; at 20 cells per second that hides only its first two ticks.
- `drawProjectiles` reuses `getEnemyProjection`, which only reads `posX` and `posY`, and repeats the per-strip occlusion loop of `drawEnemies` instead of refactoring it into a shared helper (no refactor mixed with a new feature).
- Projectiles are drawn above the enemies, so one in front of an enemy is visible.
- The README gains a row for `js/projectiles.js`, and the `js/renderer.js` row now lists enemies and projectiles.

## D-13d: Projectiles on the minimap, retire the instant hit

Acceptance criteria:
- Each projectile inside the 21 by 21 window shows as a small dot with the projectile color.
- `shootCenterRay` is gone; `removeEnemy` stays, used by the projectiles.
- The instant shot tests are removed; their "enemy behind the player" case moved to `tests/projectiles.test.js` so no case is lost.

Decisions:
- `isInsideMinimapWindow` keeps dots of projectiles outside the window from being drawn over the rest of the screen.
- The dots are accumulated and painted with a single `fill()`, like the walls and the enemy markers.

## D-14a: Sync the docs with the code

Acceptance criteria:
- TDD 2.3.2 describes the enemy as it is in the code: a 0.3 cell wide, 0.6 cell tall amber rectangle with a 0.3 cell square footprint.
- The README controls table lists Space (fire) and R (reload), and the project map has a row for `js/enemies.js`.
- No code changes.

Files: `docs/TDD.md`, `README.md`, `docs/BACKLOG.md`.

Decisions:
- Keep the thin rectangle and make the TDD follow the code (Juanma approved every proposal of the 2026-11-20 review). The sizes come from `enemyWidth` and `enemyHeight` in `js/config.js`, set in a52ec0c.
- TDD 2.3.2 now says the enemy is a flat color rectangle, 0.3 cells wide and 0.6 tall in the first person view, with a 0.3 cell square footprint on the map that slides by axis against walls like the player.
- The D-04a0 and D-04a sections keep their original 0.5 cell square text, as a record of what was decided then; a52ec0c replaced it.
- The README rows for `js/world.js` (enemy population and registry), `js/minimap.js` (enemies and projectiles) and `tests/` were outdated too, so they were updated in the same pass.
- Found while checking a52ec0c: it also gave the player a 0.2 cell radius (a 0.4 cell square footprint, `canStandAt` in `js/player.js`). TDD 6.6 talks about "la celda de destino" and H-05a records a point collider. Settled in D-14a2.

## D-14a2: Describe the player's square footprint in TDD 6.6

Acceptance criteria:
- TDD 6.6 says the player is a 0.4 cell square centered on its position, and that each axis moves only when the shifted square touches no wall cell.
- It gives the reason for the 0.2 cell margin (the camera never sits against a wall or cuts a corner) and why it still fits through a one cell door.
- No code changes.

Decisions:
- Juanma asked for a plainer wording than the first proposal. The footprint goes into the existing paragraph instead of a separate sentence.
- The H-05a section keeps its point collider decision as a record; a52ec0c replaced it.

## D-14b: Specify the new scope in the TDD

Acceptance criteria:
- TDD 2.1: the victory condition. After `bossKillTarget` kills (20) a boss appears, and killing it wins. Defeat is unchanged.
- TDD 2.3.2: the boss (hit points, size, color, contact damage, spawn point) and enemy hit points.
- TDD 2.3.3: the HUD layout. LIFE and AMMO top-left with their labels, the kill counter under them, the minimap top-right.
- A new TDD section for the screens: main menu, controls, credits, victory and defeat with play again, score formula and a ranking kept in `localStorage` (works on `file://`, stays in that browser).
- The admin panel: collapsible, the game scales to the window when it is collapsed.
- TDD 6.3 lists the new files.
- Every open question of the 2026-11-20 review is answered, and Juanma approves the text before it is written.

Files: `docs/TDD.md`, `docs/BACKLOG.md`.

Decisions:
- Juanma approved every proposed default of the review and asked to move faster, so the text was written straight from those decisions and is reviewed in the diff.
- Screens and the admin panel went into 2.3.4 and 2.3.5, inside the desirable scope of 2.3, instead of new top-level sections.
- Boss size is 0.45 by 0.9 cells, 1.5 times the regular 0.3 by 0.6.
- 2.3.2 also says the future enemy sprite is a licensed image embedded as a data URI and textured per strip like the walls, so D-21 needs no TDD story of its own.
- 1.3 now lists the boss, the menus with ranking and the admin panel in the desirable scope.
- 6.3 gets a second table with every desirable file, the ones that exist (enemies, projectiles, hud, weapon-sheet, weapon) and the planned ones (enemy-sheet, game-state, ranking, screens, admin).

## D-15a: Move the minimap to the top-right corner

Acceptance criteria:
- The 210 by 210 minimap sits 10 px from the top and right edges (`minimapX` is `screenWidth - 10 - 210`).
- Walls, enemy markers, projectile dots and the player keep matching the first person view (TDD 6.7).
- A test checks the right edge of the window at `screenWidth - 10`.

Files: `js/minimap.js`, `tests/minimap.test.js`, `README.md`.

Decisions:
- `minimapX` is computed from `screenWidth` (1060 today), so it follows any canvas size change. The 10 px margin of H-06 is kept as `minimapMargin`.
- The enemy marker test now measures from `minimapX` instead of a fixed 13.5 px.

## D-15b: Life and ammo bars in the top-left corner

Acceptance criteria:
- From the top-left corner, with a 16 px margin: the LIFE label and the health bar, then the AMMO label and the ammo bar below it.
- The labels are PixiJS `Text` objects (v8 API checked in the docs first), with a system monospace font, created once outside the ticker (TDD 6.4).
- The bars keep their mask fill and clamping (D-06c, D-08b).
- Tests check the bar and label positions against hand computed values.

Files: `js/hud.js`, `js/main.js`, `tests/hud.test.js`, `README.md`.

Decisions:
- Each label sits to the left of its bar, on the same row: a 56 px label column after the 16 px margin, so the bars start at x 72. Rows are 24 px apart (16 px bar plus an 8 px gap), LIFE at y 16 and AMMO at y 40. Row 2 is left for KILLS (D-19a).
- Text style: system monospace, 14 px, bold, light gray `0xe6edf3` with a 3 px black stroke, so it still reads when a wall reaches the top of the view.
- Checked in `lib/pixi.min.js` before use: v8 builds a Text from `new PIXI.Text({ text, style })`, and `stroke` is an object with `color` and `width`.
- The labels never change, so `main.js` adds them to the stage and keeps no reference.
- The bars keep their 98 by 16 px size. Both bottom corners are now free; only the shotgun sits at the bottom.
- `healthBarMargin` and `ammoBarMargin` were replaced by `hudMargin`.
- Checked with headless Chrome on `file://`: LIFE and AMMO line up with their bars in the top-left corner and the minimap sits in the top-right corner.

## D-16a1: Specify the full-window game in the TDD

Acceptance criteria:
- TDD 2.3.5: the game fills the window, and the admin panel is a full-width HTML panel for the team, opened from a strip at the top edge or with P, over the game without resizing or pausing it. It lists the live values and every editable setting agreed on 2026-11-20.
- TDD 3.2: |plane| = width / height / 2, with the reason (square wall faces under the 3.4 projection) and the field of view it gives on 4:3 and 16:9.
- TDD 6.4: the resize listener lives outside the ticker and creates nothing.
- TDD 6.5: the canvas is 720 px tall and its width follows the window between 4:3 and 21:9, with the ray count range.
- README: P key, full-window behavior, `js/admin.js`, credits for PixiJS and Lucide.

Files: `docs/TDD.md`, `docs/BACKLOG.md`, `README.md`.

Decisions:
- Juanma asked for the game to fill any screen instead of a 16:9 box with bands, and for a full-width admin panel opened from the top edge instead of a right sidebar that shrinks the game.
- The canvas keeps a fixed 720 px height and only its width follows the window: the HUD, the textures and alturaFranja = alturaPantalla / distPerp stay the same on every screen, and rendering at the native height of a high density screen would double the rays.
- Aspect clamped to 4:3 to 21:9 (960 to 1680 px), so a portrait window or a 32:9 monitor never squeezes the HUD or opens the view past about 98 degrees. Outside that range the page color shows around the game.
- Strip width stays 2 px on every screen: 480 to 840 rays, 640 at 16:9. If a machine needs it, the strip width is the lever (TDD 6.5). The FPS in the admin panel is the measure.
- Finite reloads (a limited number of magazines) were discussed and discarded for now. TDD 2.3.1 already says the reserve is infinite, so no document changes.

## H-10c: Camera plane length follows the canvas aspect

Acceptance criteria:
- `getCameraPlaneLength()` returns `screenWidth / screenHeight / 2`; `setCameraPlaneLength(player, length)` keeps plane perpendicular to dir and to its right.
- The player starts with that length, and main.js applies it at load and on every canvas width change.
- Tests: 0.888... on the 1280 by 720 test canvas, 2 / 3 on a 4:3 canvas, about 83.3 degrees at 16:9, and perpendicularity after a new length.

Files: `js/player.js`, `tests/player.test.js`.

Decisions:
- Found while specifying D-16a: H-10a moved the canvas to 16:9 but kept Lode's 0.66, which is his value for a 4:3 screen (640 / 480 / 2). With the walls drawn screenHeight / perpWallDist tall, every wall face looked 35% wider than tall: (1280 / 720) / (2 * 0.66) = 1.35. With a window-dependent width the stretch would have changed from screen to screen.
- Juanma asked whether the field of view could stay near 66 degrees. It can only with a different projection formula (alturaFranja would stop being alturaPantalla / distPerp) and a smaller vertical view on wide screens, which reads as zoomed in. Wide screen first person games keep the vertical view and widen the horizontal one (Hor+), and PC shooters default to 90 or more horizontal degrees at 16:9, so the team kept Hor+: 66 degrees on 4:3, 83 on 16:9.
- It departs from the class presentation, which said plane 0.66 and 66 degrees. Defense line: the field of view is still implicit, 2 * atan(|plane|), and 0.66 is the 4:3 case of width / height / 2.
- No per frame cost: one division when the canvas width changes. The enemies have no field of view of their own (their line of sight is a DDA ray), and their projection already used the same camera.
- The algorithm tests keep their own cameras with plane 0.66; their expected values are hand computed for that camera, so they did not change.

## D-16a2: Canvas width follows the window at load

Acceptance criteria:
- `screenWidth` becomes a `let` that starts at 1280 (the tests use it) and main.js sets it from the window before `app.init`.
- `getScreenWidthForWindow(width, height)` clamps the aspect to 4:3 to 21:9 and rounds the width to whole strips; `maxScreenWidth` is 1680.
- `#game-frame` holds the canvas; `getGameFrameSize` gives it the largest CSS box with the canvas shape, and a gap under 2 px from the rounding is stretched to the window edge.
- Tests: 16:9 keeps 1280, 1512 by 860 gives 1266, 16:10 gives 1152, the clamp at both ends, a full window frame inside the range and a centered one outside it.

Files: `index.html`, `js/config.js`, `js/main.js`, `tests/screen.test.js` (new).

Decisions:
- The scaling is the browser default (smooth). Hard pixels are one CSS line (`image-rendering: pixelated`) if the team prefers them after seeing both.
- Checked with headless Chrome on `file://`: 1512 by 860 fills the window with a 1266 by 720 canvas, and a 600 by 900 portrait window shows a centered 4:3 game with bands above and below.

## D-16a3: Live resize

Acceptance criteria:
- A window resize, or entering full screen, refits the game without reloading. When the rounded width changes, `app.renderer.resize` gets it, plane gets its new length, ceiling and floor, crosshair and defeat overlay are drawn again, and the shotgun moves back under the crosshair.
- Nothing is created on resize (TDD 6.4): the wall depth buffer and the wall strip sprites are sized once for `maxScreenWidth`, and strips past the current width stay hidden.
- The minimap reads its left edge from the current width (`getMinimapX()`), so it stays in the top-right corner.
- Tests: the depth buffer has 840 entries, and the minimap still ends 10 px from the right edge on a 1680 px canvas.

Files: `js/renderer.js`, `js/minimap.js`, `js/hud.js`, `js/main.js`, `tests/renderer.test.js`, `tests/minimap.test.js`.

Decisions:
- `minimapX` became `getMinimapX()`, read once per draw. `drawDefeatOverlay` split from `createDefeatOverlay` so it can be drawn again; D-20a replaces it anyway.
- The resize listener is registered after the scene exists and runs once right away, in case the window changed during `app.init`.
- Checked with headless Chrome: 1512 by 860 to 1920 by 820 to 1440 by 900 gives canvases of 1266, 1680 (clamped at 21:9) and 1152 px, plane 0.88, 1.17 and 0.80, with the minimap and shotgun in place and no console errors.

## D-16b1: Admin panel shell

Acceptance criteria:
- Three states in `body[data-admin]`: hidden (start), peek and open.
- A 48 px invisible band along the top edge shows a centered strip with Open admin panel and a chevron-down icon, sliding down in 200 ms. It slides back up 400 ms after the mouse leaves the band and the strip.
- The button opens a full-width panel that stays until closed with the X at the top right, the Close admin panel button (chevron-up) at the bottom center, or P. P also opens it from any state.
- The panel floats over the game and never resizes or pauses it.
- Panel buttons drop the focus after a click, so Space keeps firing the shotgun.
- Animations are off when the system asks for reduced motion.
- Icons come from Lucide, inline as SVG `<symbol>` elements in `index.html`, with the license in `assets/icons/LICENSE` and the credit in the README.

Files: `index.html`, `js/admin.js` (new), `js/main.js`, `README.md`, `assets/icons/LICENSE` (new).

Decisions:
- Lucide 1.77.0 (2410 icons, ISC, consistent 24 px grid with a 2 px stroke, Figma plugin) was taken from `npm pack lucide-static`, like PixiJS in H-01b. Inline symbols need no network and no extra file on `file://` (TDD 6.2), follow the text color and can be added one by one.
- The panel has a fixed CSS size and lives outside `#game-frame`: it is a team tool, readable on any screen, and does not scale with the game.
- P is ignored while typing in a panel field (`isTypingInField`), ready for the fields of D-16c1.
- Known overlap: in macOS full screen the top edge also reveals the system menu bar. The 48 px band shows the strip before the edge is reached, and P is the fallback.

## D-16b2: Live info in the admin panel

Acceptance criteria:
- FPS, position, chunk, health, ammo (with the reload state), enemies in the loaded chunks and loaded chunks.
- The ticker only counts frames and time; the DOM is written every 250 ms and only while the panel is open, plus once when it opens.
- Values are written with `textContent`, never `innerHTML`.
- Tests on the pure helpers: position, chunk with negatives, health rounded up, ammo with reload, enemy count across chunks, every value as text, field detection.

Files: `index.html`, `js/admin.js`, `js/main.js`, `tests/admin.test.js` (new).

Decisions:
- FPS is frames over elapsed time in each 250 ms window, steadier than the instant `ticker.FPS`.
- Loaded chunks was added next to loaded enemies: both are what the stress test of D-16c1 grows.
- Health is rounded up so the panel only shows 0 at a real defeat.

## D-16c1a: Specify the admin settings in the TDD

Acceptance criteria:
- TDD 2.1 and 2.3.2: the game has a total of regular enemies, 20 by default. Chunks roll their population as they are generated without going over it, chunks generated after that are empty, and the boss appears when the last of them dies.
- TDD 2.3.1: health is in hit points, like the enemy's and the boss's. The player has 10, and a second of contact with a regular enemy takes one (the boss takes two). Reloads are unlimited by default, and the admin panel can limit them.
- TDD 2.3.3: the reloads left show as x3 to the right of the ammo bar when they are limited, and KILLS 3 / 20 uses the total of the game.
- TDD 2.3.5: the settings by group (game, weapon, player, raycasting, procedural generation, render), with their defaults and ranges, saved in localStorage with a Reset button.
- TDD 6.3: `settings` in the desirable file table.

Files: `docs/TDD.md`, `docs/BACKLOG.md`.

Decisions (2026-11-20, Juanma):
- "Enemies per chunk" was replaced by a total per game. The world is infinite and built as the player walks, so the total is spent as chunks are generated (Juanma chose this over creating every enemy at the start). It keeps generation on demand (TDD 4); the cost is that a huge total only weighs on the machine as the player explores. Measured in Node: a chunk with its enemies takes about 25 µs and 1 KB.
- The separate kill target is gone: the boss comes after the last enemy of the total, so one number sets both.
- Enemies do not shoot, so the player's "hits before dying" are hit points drained by contact. 10 hit points at one per second plays the same as the old 100 health at 10 per second.
- Finite reloads were discarded in D-16a1 and come back on request, unlimited by default so the TDD 2.3.1 pace stays the same.
- Juanma said the arrows felt too sensitive. The arrow keys are not bound (TDD 2.2); he meant A and D, which turned at 172 degrees per second. The default is now 120.
- Raycasting settings chosen: strip width, fisheye and rays on the minimap (max ray distance was offered and left out). Procedural generation: chunk borders on the minimap (room size, second room chance and a new world button were offered and left out).

## D-16c1b: Settings store and panel fields

Acceptance criteria:
- `js/settings.js` holds every setting's default and integer range, clamps and rounds field values, and reads and writes `localStorage` under `hurlinstein3d.settings`. Blocked storage, invalid JSON, unknown names and out of range values fall back to the defaults or the nearest limit.
- The admin panel has a Settings section with one box per group; each number field shows its range next to it ("2 to 20") and, after a change, the value in use.
- A number field applies its value on Enter or when it loses the focus, never halfway through typing. Checkboxes give the focus back after a click.
- Reset settings restores every default, applies it and saves it.
- W, A, S, D, Space and R are ignored while a panel field has the focus (`isTypingInField`, moved to `js/player.js` next to the other input code).
- Turn speed of A and D in degrees per second, 30 to 360, 120 by default.
- Tests: defaults, clamping and rounding, empty and invalid values, flags, stored data (valid, invalid, unknown names), blocked storage, 120 degrees per second over 60 ticker units is a third of a turn, a 90 degree turn with the setting at 90, keys typed into a field.

Files: `js/settings.js` (new), `index.html`, `js/admin.js`, `js/player.js`, `js/config.js`, `tests/settings.test.js` (new), `tests/admin.test.js`, `tests/player.test.js`.

Decisions:
- `rotationSpeed` left `js/config.js`; `getRotationPerTick` converts the setting every frame (one multiplication).
- `settings.js` loads right after `config.js`, so `player.js` builds the player with the stored values.
- The panel reads the fields and ranges from `js/settings.js` through `data-setting` and `data-setting-range`, so a range lives in one place.

## D-16c1c: Player hit points, god mode, magazine size and refill ammo

Acceptance criteria:
- The player has `gameSettings.playerHitPoints` (10, from 1 to 100); a regular enemy takes one per second of contact (`contactDamagePerSecond` is 1). The health bar and the panel ("7 / 10") follow.
- A new value restores full health with the new maximum. If the player was defeated, the game resumes and the defeat overlay hides.
- God mode ignores every damage (`damagePlayer`).
- Magazine size from 2 to 20. A smaller one drops the extra rounds; a bigger one fills on the next reload. The ammo bar draws any size as a fraction.
- Refill ammo fills the magazine and the reload allowance.
- Tests: default hit points, contact damage per second, god mode, new hit points revive, magazine size on reload and on change, refill.

Files: `js/player.js`, `js/enemies.js`, `js/admin.js`, `js/main.js`, `tests/health.test.js`, `tests/ammo.test.js`, `tests/hud.test.js`.

Decisions:
- The defeat overlay now follows the health every frame instead of staying on, because new hit points bring the player back. D-20a replaces it anyway.
- The ammo sprite keeps its six segments; with another magazine size it is cropped as a fraction, so a segment no longer means one round.

## D-16c1d: Reload limit

Acceptance criteria:
- Unlimited reloads (default) or a limit from 0 to 99. Each reload spends one; with none left, R does nothing and an empty magazine cannot fire.
- When limited, the HUD shows the reloads left to the right of the ammo bar (x3), with the label style. When unlimited it is hidden.
- The panel's Ammo line adds "2 reloads left" when limited.
- Changing the limit, or turning it on, sets the reloads left to the new limit.
- Tests: unlimited reloads never run out, a limited allowance runs out, the counter text, position (x 178) and visibility, the panel text.

Files: `js/player.js`, `js/hud.js`, `js/main.js`, `js/admin.js`, `index.html`, `tests/ammo.test.js`, `tests/hud.test.js`, `tests/admin.test.js`.

Decisions:
- Unlimited is `Infinity`: `Infinity - 1` is still `Infinity` and `Infinity > 0` is true, so the reload code has no special case, like deltaDist with a zero ray component.
- The counter is a PixiJS Text created once; its text is set every frame and PixiJS only redraws it when the text changes (checked in `lib/pixi.min.js`: the setter returns when the value is equal).
- A reload is spent when it starts, since nothing cancels a reload.
- Checked with headless Chrome on `file://`: fields show their ranges, 50 in the magazine field becomes 20, settings survive a reload, W typed into a field does not move the player, god mode blocks damage, new hit points revive a defeated player, x2 shows next to AMMO, and the console has no errors.

## D-16c1e: Enemies per game

Acceptance criteria:
- `enemiesPerGame` setting, 1 to 100,000, 20 by default, in the Game box.
- `world.js` counts the enemies created in the game. A new chunk rolls its population as before (TDD 2.3.2) and takes at most the enemies left in the total; once the total is reached, new chunks are empty. Chunk (0, 0) stays empty.
- The setting applies live: raising it lets new chunks get enemies again; lowering it below the count stops new ones.
- The panel shows "Enemies created 7 / 20" next to the loaded enemies.
- Tests: the cap, chunks after the cap are empty, raising the total resumes, chunk (0, 0).

Files: `js/settings.js`, `js/world.js`, `js/admin.js`, `index.html`, tests.

Decisions:
- The total counts created enemies, so a killed enemy does not give its place back: the boss comes after the last of them dies (TDD 2.1).
- The panel shows "Enemies created 7 / 20" and the range "1 to 100,000" with a thousands separator; the number fields and range labels are 76 px wide so 100000 fits.
- Done in the same batch as D-23, D-16e1 to D-16e3 and D-16f (2026-11-20).
- Replaced by D-24: the per-chunk roll and the created count are gone.

## D-16e1: Strip width setting

Acceptance criteria:
- Strip width of 1, 2, 4 or 8 px in a Raycasting box, applied live: 1680 to 210 rays on the widest canvas. The FPS in the panel shows the cost (TDD 3.6, 6.5).
- Nothing is created on change (TDD 6.4): the depth buffer and the wall strip sprites are sized once for 1 px strips on the widest canvas, and the unused ones stay hidden.
- Tests: rays per width, the depth buffer size, a strip x for each width.

Files: `js/config.js`, `js/settings.js`, `js/renderer.js`, `js/main.js`, `index.html`, tests. Split if it goes over four files.

Open point (settled): the canvas width was rounded to whole 2 px strips (D-16a2). It is now rounded to multiples of 8, so every width is exact; 1512 by 860 gives 1264 instead of 1266.

Decisions:
- `screenWidthStep` (8 px, the widest strip) replaces the `stripWidth` constant in `js/config.js`. `getGameFrameSize` now stretches a gap under one step (8 canvas pixels times the scale) instead of under 2 px, so the frame still fills a 1512 by 860 window (at most 0.4% wider or taller). TDD 6.5 says it.
- The acceptance criteria said 105 rays for 8 px strips on the widest canvas; 1680 / 8 is 210.
- The strip width is a setting with a list of options, shown as a select; a stored value outside the list falls back to 2. Selects and checkboxes give the focus back after a change, so Space still fires.
- The depth buffer and the strip sprites are sized for 1 px strips on the widest canvas (1680), created once; the renderer reads the width every frame and hides the sprites it does not use (TDD 6.4 updated).

## D-16e2: Fisheye toggle

Acceptance criteria:
- A Fisheye checkbox draws the walls with the Euclidean distance, perpWallDist * |rayDir|, instead of distPerp, so the curve of TDD 3.4 shows live. Off by default.
- One multiplication and one square root per ray only while it is on; the DDA is unchanged.
- Tests: with the toggle on, a wall straight ahead keeps its height at the center column and gets shorter toward the edges.

Files: `js/settings.js`, `js/renderer.js`, `index.html`, tests.

Note: enemies keep the perpendicular projection and the wall depth stays perpendicular, so in fisheye mode enemies and walls disagree a little at the edges. It is a teaching mode.

Decisions:
- `getProjectionDistance` returns perpWallDist, or perpWallDist * |rayDir| in fisheye mode, and only the strip height uses it. The brightness bands and the lighting keep perpWallDist.
- The background strip of a missed ray uses the same distance, so the dark band at the cap bends with the walls.

## D-16e3: Rays on the minimap

Acceptance criteria:
- A checkbox draws rays on the minimap from the player to each wall hit, at pos + perpWallDist * rayDir (the ray parameter at the hit), clipped to the 21 by 21 window. A ray without a hit stops at the distance cap.
- The rays come from the same frame's wall pass; none is cast again. Every eighth ray is drawn, so the fan reads clearly, with one stroke per frame.
- Tests: the hit point of a hand computed ray.

Files: `js/settings.js`, `js/renderer.js`, `js/minimap.js`, `index.html`, tests.

Decisions:
- The minimap reads t = perpWallDist from the depth buffer of the same frame and ends each ray at pos + t * rayDir, cut where the ray first leaves the window (`getWindowExitParameter`, the ray parameter where one coordinate reaches the window edge).
- Every eighth ray at the current strip width, so 8 px strips draw fewer rays than 1 px strips and the minimap shows the setting too.
- Teal like the player at 35% opacity, over the walls and under the enemies.

## D-16f: Chunk borders on the minimap

Acceptance criteria:
- A checkbox in a Procedural generation box draws the chunk borders (every 16 cells, with Math.floor so negatives work) over the minimap window.
- Tests: the border lines inside a window that crosses x = 0 and y = -16.

Files: `js/settings.js`, `js/minimap.js`, `index.html`, tests.

Decisions:
- Magenta lines (0xff4fd8), a color nothing else on the minimap uses, in one stroke. A border that falls on the window edge is skipped, since the minimap frame already draws it.
- Checked with headless Chrome on `file://` for the whole batch: the canvas is 1264 wide in a 1512 by 860 window and the frame fills it, 8 px and 1 px strips, fisheye, rays and borders on the minimap, the panel with its new boxes, and no console errors.

## D-08d: Re-cut the reload frames

Request (2026-11-22, Juanma): the reload animation looks cut. Cause in the feedback section above.

Acceptance criteria:
- Every reload drawing of rows 2 to 5 of `Sgun.png` appears whole and once, in the order of the sheet: the gun opens and throws the shells, the hand brings new shells, puts them in, flicks up (two drawings) and closes the loaded gun. No drawing is split across two frames.
- Each drawing is cut by its own connected pixels on the keyed violet background (D-07b), with small gaps bridged so a flying shell stays with its drawing.
- The frame grows to fit the tallest drawing (the raised hands, about 160 px). Idle and firing frames get transparent rows on top and stay unchanged pixel for pixel, so the gun keeps its size on screen (the same 260 / 142 screen pixels per sheet pixel), its bottom anchor and its aim at the crosshair (sprite x about 791 px).
- Each drawing sits on the frame bottom, where the arm and the stock leave the screen, and consecutive frames do not jump sideways.
- `reloadDuration` still equals the reload frames times their frame time.
- Tests: the PNG header width is the frame count times the frame width, the frame lists, the reload timing and the aim (`tests/gun.test.js`, `tests/ammo.test.js`).

Files: `js/weapon-sheet.js`, `js/weapon.js`, `js/player.js`, `tests/gun.test.js`.

## D-27: The enemy stops in front of the player and hits once per second (split in four)

Request (2026-11-22): the professor walked through the enemy. The enemy has to leave at least the distance of the two bodies, stop in front of the player, facing it, and hit once per second, each hit with a red flash from the screen edges.

## D-27a: Specify the body distance, the hits and the flash in the TDD

Acceptance criteria:
- TDD 2.3.1: contact damage comes in whole hit points. An enemy in contact hits once when contact starts and then once per second, and the health bar drops one step in the same frame. It replaces "de forma continua, así la barra baja de a poco".
- TDD 2.3.2: when chasing, the enemy stops at the stop distance from the player's center, in front of the player.
- TDD 2.3.3: the damage flash as a sixth HUD element, non diegetic: red at the screen edges, transparent toward the center, one pulse per hit.
- TDD 6.6: the player cannot get closer than the stop distance to an enemy, axis by axis like the walls, and moving away is always allowed.
- Juanma approves the text before it is written.

Files: `docs/TDD.md`, `docs/BACKLOG.md`.

## D-27b: The enemy stops at body distance

Acceptance criteria:
- A chasing enemy moves toward the player but never closer than `enemyStopDistance`, center to center. The step is cut to what is left until that distance; at that distance or closer it stays still and keeps facing the player (the sprite has a single front frame, so it always faces the camera).
- The player's move on each axis is refused when it ends closer than `enemyStopDistance` to an enemy and closer than before, so the player slides along an enemy like along a wall and can always walk away. Only the enemies registered in the cells around the player are checked (per cell registry, TDD 2.3.1).
- Contact damage still reaches an enemy that stopped: `contactDistance` stays larger than `enemyStopDistance`.
- Tests: a chasing enemy stops at the distance and does not cross it in one long tick; a player walking into an enemy stops at the distance and slides on the other axis; a player inside the distance can walk away; an enemy two cells away does not block.

Files: `js/enemies.js`, `js/player.js`, `tests/enemies.test.js`, `tests/player.test.js`.

## D-27c: Contact damage in whole hit points

Acceptance criteria:
- Each enemy in contact has its own cooldown: it hits one hit point when contact starts and its cooldown is over, then waits one second (60 ticker units) before the next. Stepping in and out of contact never gives more than one hit per second per enemy.
- `getContactDamage` returns whole hits; the health stays a whole number and the bar drops one step per hit.
- The function that applies a hit reports it, so D-27d can start the flash in the same frame. God mode takes no hits and reports none.
- Tests: the first hit on contact, the second after one second and not before, two enemies hit twice, leaving and coming back inside the second gives no extra hit, god mode.

Files: `js/enemies.js`, `js/player.js`, `js/main.js`, `tests/health.test.js`.

Decisions to record: replaces the D-06b decision "contact damage accumulates per enemy per tick".

## D-27d: Red damage flash

Acceptance criteria:
- A full screen overlay, red at the edges and transparent toward the center (a radial gradient), drawn once on a hidden canvas and shown as one sprite, created outside the ticker (TDD 6.4). A window resize stretches it, creating nothing.
- Each hit sets its opacity to the maximum and it fades to zero in `damageFlashDuration` (about 0.4 s), so one hit is one pulse. Several hits in one frame give one pulse.
- It sits above the 3D view and the shotgun and below the HUD bars and the minimap, so LIFE stays readable.
- Tests: the opacity right after a hit, halfway and at the end; no hit, no flash.

Files: `js/hud.js`, `js/main.js`, `tests/hud.test.js`.

## D-27e: Enemies keep body distance from each other (optional)

Acceptance criteria:
- Two enemies never get closer than their bodies: an enemy's move on each axis is refused when it would overlap another enemy, checked through the per cell registry.
- Several chasing enemies stand around the player instead of on top of each other.

## D-12: Arrow keys and mouse (split from D-12)

Request (2026-11-22, Juanma): turn with the mouse left and right, fire with the left click, reload with the right click, and let the arrow keys work too. Strafing was not requested and stays optional as D-12e.

## D-12a: Specify the arrow keys and the mouse

Acceptance criteria:
- TDD 2.2: up and down arrows move like W and S, left and right arrows turn like A and D. The horizontal mouse movement turns the camera, the left click fires and the right click reloads, while the mouse is captured with pointer lock. Strafing stays out, for the reason TDD 2.2 already gives.
- The text says the mouse turn is the same rotation matrix applied to dir and plane, with the angle taken from the mouse movement of that frame. That angle is not multiplied by `deltaTime`: the mouse movement of a frame is already a distance.
- README controls table updated.
- Juanma approves the text before it is written.

Files: `docs/TDD.md`, `README.md`, `docs/BACKLOG.md`.

## D-12b: Arrow keys

Acceptance criteria:
- `createKeyboardInput` maps ArrowUp, ArrowDown, ArrowLeft and ArrowRight to w, s, a and d, so `updatePlayer` does not change.
- The arrows do not scroll the page, and they are ignored while typing in a panel field (`isTypingInField`).
- Tests: each arrow moves or turns like its letter; typing an arrow in a field does nothing.

Files: `js/player.js`, `tests/player.test.js`.

## D-12c: Mouse turn with pointer lock

Acceptance criteria:
- A click on the game captures the mouse with the Pointer Lock API (checked in Chrome on `file://` first). Esc releases it, and so does opening the admin panel (strip or P).
- While captured, the `movementX` of every mouse event is added up, and the ticker turns dir and plane once per frame by that amount times the sensitivity, then clears it. Nothing is created in the ticker.
- Mouse sensitivity in the Player box of the admin panel, in degrees per 100 px of mouse movement.
- Tests: 100 px at sensitivity 20 turns 20 degrees, dir stays unit length and plane perpendicular, the sum is cleared after use.

Files: `js/player.js`, `js/settings.js`, `js/main.js`, `index.html`, `tests/player.test.js`. Split if it goes over four code files.

## D-12d: Mouse buttons

Acceptance criteria:
- While the mouse is captured, the left click fires one shot per click, like Space, and the right click starts a reload, like R. The context menu does not open over the game.
- The click that captures the mouse does not fire. Clicks on the admin panel never fire or reload.
- Tests: one click, one shot; a held button does not repeat; the right click reloads; a click without capture does nothing.

Files: `js/player.js`, `js/main.js`, `tests/weapon.test.js`, `tests/ammo.test.js`.

## D-12e: Strafing (optional)

Only if the team asks for it.

## D-28: UNAHUR at night (split in four)

Request (2026-11-22, Juanma): walls and ceiling like the UNAHUR buildings in the photos the team shared, imagined at night and creepy, and textures on the ceiling and the floor too.

What the photos show: white plaster walls; window bands covered by black horizontal louvers (Edificio 3); tall glass panes with dark frames along an interior corridor; green and light blue accent stripes, green columns and green trim; large light floor tiles; a white ceiling with recessed lights. At night: cold and dark, the light coming from a few fluorescent lamps, darkness at the end of the corridors.

The photos are only a reference. Every texture is drawn by code on a hidden canvas, like D-09 (TDD 6.2), so no photo goes into the repo.

## D-28a: Specify the look and the textured floor and ceiling

Acceptance criteria:
- TDD 1.3 and 2.3: the art direction above, as a desirable extension.
- TDD 6.5: ceiling and floor drawn every frame with floor casting (Lode): for each screen row, rowDistance = posZ / (y - screenHeight / 2), and the floor point of each column follows linearly from the leftmost to the rightmost ray. The cost depends only on the pixels (TDD 3.6). Flat color mode keeps the two rectangles drawn once.
- TDD 6.2: the floor casting texture is a hidden canvas updated every frame, created once.
- The open questions of D-28 are settled (chunk color, floor casting technique, flickering lamps).
- Juanma approves the text before it is written.

Files: `docs/TDD.md`, `docs/BACKLOG.md`.

## D-28b: UNAHUR wall textures

Acceptance criteria:
- The brick texture is replaced by three procedural variants on the hidden canvas: white plaster with an accent stripe near the floor, a window band with black horizontal louvers, and glass panes with dark frames.
- Each wall cell gets a variant chosen deterministically from its coordinates, so the same wall always looks the same.
- wallX and texX keep aligning the pattern to the face (D-09). Side shading, distance bands and the room lights still apply through the tint.
- Flat color mode is unchanged.
- Tests: the variant of a cell is stable and covers all three, including negative coordinates.

Files: `js/renderer.js`, `js/config.js`, `tests/renderer.test.js`.

## D-28c: Floor and ceiling casting

Acceptance criteria:
- The floor shows large light tiles with dark joints, the ceiling white panels on a grid, both procedural and aligned to the world grid, so they slide under the player as it walks and turn with the camera.
- Each frame computes the rows below and above the horizon with Lode's floor casting, with the same pos, dir and plane as the walls, and darkens them with distance like the walls (D-01 bands).
- The canvas, its texture and its sprite are created once; the ticker only writes pixels and updates the texture (TDD 6.4).
- The FPS in the admin panel stays near 60 on both team machines at the default strip width; the strip width setting also lowers the floor resolution.
- Tests on the pure part: rowDistance for a row against a hand computed value, and the floor point of the center column equals pos + rowDistance * dir.

Files: `js/renderer.js`, `js/main.js`, `js/config.js`, `tests/renderer.test.js`.

## D-28d: Night atmosphere

Acceptance criteria:
- A colder, darker palette: lower ambient light (D-10), a cold tint and walls, floor and ceiling fading to near black at the distance cap, with the background color matched.
- The ceiling shows a fluorescent lamp in the cell of each room light (D-10), so the light on the walls has a visible source.
- Optional: a few lamps flicker, chosen from their position, so the same lamp always flickers.
- The minimap, the HUD and the enemy sprite stay readable.

Files: `js/config.js`, `js/renderer.js`, `tests/renderer.test.js`.

## D-29a: Pick the CRT filter source

Acceptance criteria:
- The team picks the source. Proposal: the official `pixi-filters` browser bundle (6.1.5, MIT, made for PixiJS 8), copied byte for byte into `lib/pixi-filters.js` with its version and sha256 recorded, loaded with a classic script tag after `lib/pixi.min.js`. Before use, check that it defines its global (`PIXI.filters`) under `file://` and read the `CRTFilter` options in its documentation. The other option is our own `PIXI.Filter` with a short GLSL fragment shader.
- TDD 6.2 and 6.3 list the new file, TDD 2.3.5 the admin toggle, and the README credits the library and its license.

Files: `lib/pixi-filters.js` (new), `index.html`, `docs/TDD.md`, `README.md`.

## D-29b: CRT filter over the game

Acceptance criteria:
- One CRT filter on the stage, created once: scanlines, a slight curvature, vignette and a little noise. The ticker only updates its time value, so the noise and the lines move (TDD 6.4).
- A CRT toggle in the Render box of the admin panel, on by default, saved with the other settings. The HTML admin panel is outside the canvas and is never filtered.
- The crosshair stays at the screen center and the HUD stays readable.
- The FPS in the admin panel shows the cost with the toggle on and off.

Files: `js/main.js`, `js/settings.js`, `index.html`, `tests/settings.test.js`.

## D-30: Seeded random (split in four)

Request (2026-11-22, the professor): use a seeded random instead of `Math.random` for the procedural generation, so the same seed gives the same world, as in Minecraft. The chunks weigh very little, so memory is not the reason; the seed organizes the generation and makes tests repeatable.

Key point: the chunks are generated in the order the player explores. With one random sequence for the whole world, chunk (1, 0) would come out different depending on whether the player went east or west first. So each chunk gets its own seed, mixed from the world seed and its coordinates, and the chunk is the same whatever the order.

## D-30a: Specify the seeded random in TDD 4.4

Acceptance criteria:
- TDD 4.4: a world seed, a small seeded generator (for example mulberry32, a few lines of integer math), and a chunk seed mixed from the world seed and the Cantor key of the chunk (TDD 6.8). The same seed gives the same world in any order of exploration. The Map still keeps every chunk, now as a cache: a chunk generated again would come out the same.
- TDD 5.2 adds the invariant "same seed, same world".
- TDD 2.3.2: enemy placement and patrol also come from the world seed.
- Juanma approves the text before it is written.

Files: `docs/TDD.md`, `docs/BACKLOG.md`.

## D-30b: Seeded random for the map

Acceptance criteria:
- `js/random.js` (new, loaded before `mapgen.js`): `createRandom(seed)` returns a function with the same contract as `Math.random` (a number from 0 up to 1), and `getChunkSeed(worldSeed, cx, cy)` mixes the world seed and the chunk coordinates.
- `generateChunk` takes that function as a parameter and never calls `Math.random`. `world.js` builds it from the chunk seed.
- The world seed is picked once at load (random) and shown in the admin panel.
- Tests: the same seed gives the same chunk, generating (1, 0) before or after (0, 0) gives the same cells, two seeds give different worlds, negative chunks, and the generator stays inside 0 to 1.

Files: `js/random.js` (new), `js/mapgen.js`, `js/world.js`, `index.html`, `tests/mapgen.test.js`. `js/admin.js` shows the seed; split if it goes over four code files.

## D-30c: Enemy placement and patrol from the world seed

Acceptance criteria:
- The enemy placement (D-24, D-25) and the patrol neighbour (D-05a) use a game random created from the world seed instead of `Math.random`.
- `grep "Math.random" js/` finds only the line that picks the starting seed.
- The tests pass a seed instead of replacing `Math.random`.
- Tests: the same seed places the same enemies in the same cells.

Files: `js/world.js`, `js/enemies.js`, `tests/enemies.test.js`, `tests/world.test.js`.

## D-17a: Reset a game

Acceptance criteria:
- `resetGame()` clears the chunk, light and enemy Maps, the per-cell registry and the projectiles, and puts the player at the room center of a newly generated chunk (0, 0) with full health, a full magazine and no reload.
- Within a game, chunks still persist (TDD 4.4). A new game is a new session with a new map.
- Tests: after a reset the old chunk is gone, no enemies or projectiles are left, and the player stands on an air cell with 100 health and 6 rounds.

Files: `js/world.js`, `js/player.js`, `js/projectiles.js`, `tests/reset.test.js` (new).

## D-30d: World seed in the admin panel

Acceptance criteria:
- The admin panel shows the seed of the current world in a field. Typing a seed and pressing New world calls `resetGame()` with that seed; New world with the field empty picks a random one.
- The same seed typed on both team machines gives the same map from the spawn.
- Tests: `resetGame` with a seed rebuilds the same chunk (0, 0) and the same enemy cells.

Files: `index.html`, `js/admin.js`, `js/world.js`, `tests/reset.test.js`.

Note: placed after D-17a because it needs `resetGame()`.

## D-17b: Game state machine

Acceptance criteria:
- States: `menu`, `playing`, `victory` and `defeat`. Only `playing` updates the player, enemies, projectiles, reload and weapon; the scene still renders behind the other states.
- Zero health switches to `defeat` instead of returning early from the ticker.
- Until D-18a the game starts in `playing`, so every build stays playable.
- Tests cover the allowed transitions.

Files: `js/game-state.js` (new), `js/main.js`, `index.html`, `tests/game-state.test.js` (new).

## D-18a: Main menu

Acceptance criteria:
- On load the game shows the main menu over the scene: the title Hurlinstein3D and the buttons Start game, Controls and Credits.
- Start game calls `resetGame()` and switches to `playing`.
- The menu lives inside `#game-frame` and scales with it.

Files: `index.html`, `js/screens.js` (new), `js/main.js`.

## D-18b: Controls and credits screens

Acceptance criteria:
- Controls lists W, S, A, D, Space, R and the admin panel key.
- Credits lists the team, course, university and professor, PixiJS 8.21.0 (MIT license) and the source and license of every sprite.
- Both screens have a Back button to the main menu.

Files: `index.html`, `js/screens.js`.

Open question: where `Sgun.png` and the UI bar sheet come from, and under which license.

## D-20a: Defeat screen with play again

Acceptance criteria:
- At zero health the defeat screen replaces the D-06c overlay, with a title and the buttons Play again and Main menu.
- Play again starts a new game with `resetGame()`, without reloading the page.
- `createDefeatOverlay` is removed.

Files: `index.html`, `js/screens.js`, `js/main.js`, `js/hud.js`.

## D-19a: Kill counter

Acceptance criteria:
- Each enemy a projectile kills adds one to the kill count; `resetGame()` sets it back to 0.
- The target is the enemies per game setting (D-16c1e), 20 by default.
- The HUD shows "KILLS 3 / 20" under AMMO. The `Text` object is created once and its text changes only when the count changes.
- Tests: a kill adds one, a miss adds nothing, a reset clears the count.

Files: `js/game-state.js`, `js/projectiles.js`, `js/hud.js`, `tests/projectiles.test.js`. `js/main.js` adds the label to the stage; split the story if it goes over four files.

## D-23: Update and draw only the enemies near the player

Problem found while planning the D-16c1 stress test: `updateEnemies`, `getContactDamage` (`js/enemies.js`) and `drawEnemies` (`js/renderer.js`) walk every enemy of every generated chunk on every frame. Chunks persist for the session (TDD 4.4), so the cost grows with how much of the world was explored, against the TDD 3.6 idea that world size stays out of the per-frame cost. Measured in Node: only reading the positions of 83,000 enemies takes 11 ms, most of a 16.7 ms frame, before any state machine or line of sight.

Acceptance criteria:
- Only the chunks around the player's chunk are active: the radius covers `maxRayDistance` (24 cells, so 2 chunks each way, a 5 by 5 block). Enemies there are updated, drawn and can do contact damage; the rest stay frozen in place and keep their registry.
- Drawing skips an enemy before projecting it when it is farther than `maxRayDistance` (squared distance, no sqrt) or behind the camera.
- An admin toggle "Active area only" turns the optimization off and on, so the defense can show the FPS before and after with the same enemy count. The panel shows the active enemy count next to the loaded one.
- Tests: an enemy three chunks away is not updated; one in a neighbor chunk is; the toggle restores the old behavior.

Files: `js/enemies.js`, `js/renderer.js`, `js/admin.js`, tests. Split if it goes over four files.

Decisions:
- An enemy is listed in the chunk it stands in and changes lists when it crosses a chunk border. Without that, an enemy that chased the player far from the chunk where it was created would freeze next to the player. The change happens after the update loop, so no list changes while it is being walked.
- The toggle ("Active area only", on by default, in the Game box) only changes which lists are walked: off, `getActiveEnemyLists` returns every loaded chunk, so before and after run the same code.
- The draw pre-check (`isEnemyInViewRange`) uses the squared distance and the sign of the dot product with dir, like the zombie radar of the presentation. The exact depth check after the projection stays.
- Projectiles and the minimap read the per-cell registry, so they needed no change.
- Measured in headless Chrome with 86,482 enemies over 115,600 chunks: updating, contact damage and drawing take 9.6 ms per frame for every enemy and 0.015 ms for the 23 active ones.
- TDD 2.3.2 and 2.3.5 now describe the active area, its toggle and the new live values.

Other ideas to measure with the FPS before doing them: group enemy strips into one `fill()` per frame (already the case), and skip the minimap enemy loop outside its 21 by 21 window (already the case, it reads cells).

## D-24: Place the enemies of the game around the player

Request (2026-11-20, Juanma): the professor wants to see the enemies change when the total changes. With D-16c1e each chunk rolled 0 to 3 enemies (0.75 on average) and the total only capped the rolls, so 20 or 100 looked the same near the player.

Acceptance criteria:
- At the start of the game the whole total (20 by default) is placed at once, in distinct random air cells of the 8 chunks around the player's chunk. The player's chunk stays empty.
- A new total from the admin panel (or Reset) removes the live enemies and places the new total around the player's current chunk.
- When the total does not fit in the 8 chunks (about 600 air cells), the area grows one ring of chunks at a time until it fits.
- Chunks generated while exploring have no enemies.
- The panel shows "Enemies alive 87 / 100" and "Enemies active"; "Enemies created" and "Enemies loaded" are gone.
- Tests: 100 enemies in distinct air cells of the 8 neighbors and none in the player's chunk, a new total replaces the old enemies in both registries, more than the 8 neighbors can hold reaches ring 2, a chunk generated later has no enemies, the panel change and Reset.

Files: `js/world.js`, `js/enemies.js`, `js/config.js`, `js/admin.js`, `js/main.js`, `index.html`, `tests/world.test.js`, `tests/admin.test.js`, `docs/TDD.md` (2.3.2, 2.3.5), `README.md`.

Decisions (2026-11-20, Juanma):
- A new total replaces every enemy instead of adding the difference, so lowering it also shows.
- The 8 neighbor chunks instead of the 5 by 5 active area: 100 enemies give about 12 per chunk, most of them near the minimap window.
- The far world stays empty; the enemies only leave their area when they chase the player, since patrol walks between two neighbor cells. Free roaming would be a new story.
- The pick is a partial Fisher-Yates shuffle, so 100,000 picks cost the same as 100 and no cell is picked twice (the old `splice` would be quadratic).
- `addEnemyToChunk` is shared by the placement and the chunk change of D-23. `enemyCountThresholds`, `getEnemyCountForRoll` and `enemiesCreated` are removed.
- Checked with headless Chrome on `file://`: 20 enemies at the start spread over the 8 neighbors, 100 from the panel give 8 to 19 per chunk and show on the minimap, and 100,000 take 41 ms to place over 1521 chunks. With 100,000, enemy work per frame is 30 ms with every enemy and 0.56 ms with the active area (1642 active), so the D-23 toggle now shows in the FPS.

## D-25: Bring the far enemies back near the player

Request (2026-11-20, Juanma): after clearing one neighbor chunk and walking on, the other enemies stayed behind and were lost in the infinite map.

Acceptance criteria:
- When the player enters another chunk, every live enemy more than two chunks away (outside the active area of D-23) moves to a free air cell of the 8 chunks around the player's new chunk, idle, in both registries.
- Enemies inside the active area stay where they are. Nothing moves while the player stays in the same chunk.
- Two enemies never share a cell; with no free cell left, a far enemy waits where it is.
- Tests: a far enemy reappears idle in a neighbor and leaves its old cell and chunk, an enemy two chunks away stays, nothing moves inside the same chunk, gathered enemies get distinct cells, a full ring leaves the far enemy in place.

Files: `js/enemies.js`, `js/world.js`, `js/main.js`, `tests/enemies.test.js`, `docs/TDD.md` (2.3.2), `README.md`.

Decisions:
- Only enemies outside the active area move: they are not drawn, so the player never sees one vanish. The ones at two chunks follow as soon as the player walks one chunk further. A gathered enemy can appear in view in a neighbor chunk, which reads as a respawn.
- `gatherFarEnemies` runs in the ticker before `updateEnemies`, outside it, so the D-23 tests of frozen enemies still hold. It walks every live enemy only when the player changes chunk; the total is fixed by D-24, so that cost does not grow with exploration.
- It works with the active area toggle on or off: the toggle only decides which enemies are updated and drawn.
- `pickRandomCell` (one step of the partial Fisher-Yates shuffle) is shared with the placement of D-24.
- Checked with headless Chrome on `file://`: with 20 enemies, one killed and the player moved 4 chunks east, the 19 alive were all within two chunks of the player (12 in the neighbors), with no console errors.

## D-16c2: Admin settings for the boss flow

Acceptance criteria:
- Hit points of the regular enemy (1 to 10, 1 by default) and of the boss (1 to 50, 5 by default), in the Game box. The boss takes two of the player's hit points per second of contact (TDD 2.3.2).
- Spawn boss button for quick validation.
- Controls are disabled outside `playing`.

Files: `index.html`, `js/admin.js`, `js/enemies.js`, `js/main.js`.

## D-19b: Enemy hit points

Acceptance criteria:
- Every enemy has `health`. Regular enemies have 1, so one projectile still kills them and nothing visible changes.
- A projectile that reaches an enemy takes one point; at zero the enemy is removed and counted.
- Tests: an enemy with 2 points survives one hit and dies on the second, and the projectile always disappears on contact.

Files: `js/world.js`, `js/projectiles.js`, `tests/projectiles.test.js`.

## D-19c: Boss appears after the kill target

Acceptance criteria:
- When the kill count reaches the enemies per game (the last regular enemy dies), one boss spawns, with the hit points, size, color, contact damage and spawn point set in D-14b.
- There is only one boss per game, and regular enemies keep spawning.
- The boss is drawn in its color in the first person view and on the minimap, and is registered per cell like any enemy.
- The admin panel gets a Spawn boss button for quick validation.
- Tests: no boss before the target, exactly one at the target, on an air cell, with its hit points.

Files: `js/enemies.js`, `js/renderer.js`, `js/minimap.js`, `tests/boss.test.js` (new).

## D-19d: Victory when the boss dies

Acceptance criteria:
- Killing the boss switches the state to `victory`.
- The victory screen shows a title, the kills and the game time, with the buttons Play again and Main menu. It is the defeat screen with another title.
- Tests: killing the boss sets `victory`; killing a regular enemy does not.

Files: `js/game-state.js`, `js/screens.js`, `index.html`, `tests/game-state.test.js`.

## D-20b: Score and local ranking storage

Acceptance criteria:
- The score follows the formula set in D-14b. The game time is kept to break ties.
- When a game ends, with victory or defeat, a record with score, kills, result, seconds and date is stored in `localStorage`. The ranking keeps the best 10, sorted by score and then by shorter time.
- If `localStorage` is blocked or holds invalid data, the ranking lives only for the session and nothing breaks.
- Tests on the pure functions: score, insertion and order, cut at 10, invalid stored data.

Files: `js/ranking.js` (new), `index.html`, `tests/ranking.test.js` (new).

## D-20c: Ranking on the end screens

Acceptance criteria:
- The victory and defeat screens show the top 10 with position, score, kills, result and date, and highlight the game that just ended.
- Rows are built with DOM elements and `textContent`.

Files: `js/screens.js`, `index.html`, `js/main.js`.

## D-21a: Pick a licensed enemy sprite and embed it

Acceptance criteria:
- A free sprite with a clear license (CC0 preferred, or CC-BY with credit), front facing, with a transparent background, not taken from a commercial game.
- The original file and its license live in `assets/enemy-sprites/`. It is processed offline, like D-07b, and embedded as a data URI in `js/enemy-sheet.js` (TDD 6.2).
- Its source and license are added to the README and the credits.

Files: `assets/enemy-sprites/`, `js/enemy-sheet.js` (new), `index.html`, `README.md`, `docs/TDD.md` (2.3.2).

Decisions (2026-11-20, Juanma chose the sprite):
- [Husk Mutant](https://opengameart.org/content/husk-mutant) by HorrorMovieRei, CC0, original art made with Blender and Photoshop. A mutated zombie, which ties in with the zombie radar of the presentation. Its front frame (`ZOMBA1.png`, 33 by 57 px) is close to the 0.3 by 0.6 shape of the old rectangle.
- Rejected: The Guard by knekko (CC0, but a Wolfenstein 3D style guard, too close to the original game) and Vampyr by knekko (CC0, arms spread, wider than tall). Monster mutant and Monster for 3d shooter by Nmn (CC0) are big or flying monsters.
- The frame already has a transparent background (8-bit palette with tRNS), so it is embedded unchanged, without the offline processing of D-07b. Only the front frame is used; the walk, attack and death frames of the archive are left for a future story.
- `assets/enemy-sprites/LICENSE.md` records the author, URL, license, download date and the sha256 of the archive and of the frame. The credits screen (D-18b) takes them from there.

## D-21b: Textured enemies with z-buffer occlusion

Acceptance criteria:
- Enemies show the sprite instead of the amber rectangle, projected as now (Lode part 3), with a texture column per strip and only where the enemy is closer than the wall depth.
- Sprites come from a pool created once outside the ticker; nothing is created inside it (TDD 6.4).
- The minimap keeps its markers.
- Tests check the texture column chosen for a strip against a hand computed value.

Files: `js/renderer.js`, `js/main.js`, `js/config.js`, `tests/renderer.test.js`, `docs/TDD.md` (2.3.2).

Decisions (2026-11-20, Juanma):
- The enemy stands on the floor. Centered on the horizon it floated 0.2 cells over the floor (from 0.2 to 0.8, with the eye at 0.5), which an amber block hid and a figure does not. At depth d the floor line is screenHeight / (2d) below the horizon, where a wall strip ends, and the enemy rises 0.6 cells from there (Lode part 3 moves sprites down with vMove). The horizon, where the projectile flies, crosses its head. The flat rectangle stands on the floor too.
- The sprite is drawn 0.6 cells tall and 0.6 * 33 / 57 (about 0.35) wide, so the art keeps its proportions; squeezed into 0.3 it would be 14% thinner. The 0.3 cell footprint still decides collisions, projectile hits and the minimap marker; the arms stay outside it.
- The image is cut into 33 column textures with nearest scaling, like the wall (D-09). `sliceTextureColumns` is shared by both, and `createStripSpritePool` by both pools.
- texX uses the strip center, measured from the sprite's left edge: `floor((stripX + stripWidth / 2 - left) * 33 / width)`, kept inside 0 to 32.
- Painter's algorithm: enemies are sorted near to far and take pool sprites from the last one down, and the last children of a container are drawn on top. Lode sorts far to near instead; this order means a full pool leaves out the farthest enemies, never the nearest. The pool holds four screens of 1 px strips (6720 sprites).
- The tint uses the distance bands of D-01. The room lights of D-10 are not applied to enemies, so there are no shadow rays per enemy; in a dark corridor an enemy reads brighter than the walls, which helps to see it.
- `useEnemySprites` (config) brings the amber rectangles back, the flat color mode; D-16d can wire it to the textures toggle.
- Checked with headless Chrome on `file://`: an enemy placed two cells ahead of the spawn stands on the floor with sharp pixels, a second one behind it is hidden, and the console has no errors. 178 of 178 tests pass.

## D-26: Logomark and favicon

Request (2026-11-20, Juanma): a favicon cut from the enemy sprite's face, kept as the game's square logomark (the logo without the name).

Acceptance criteria:
- A square crop of the Husk Mutant head, kept in `assets/logo/` at a size that can be reused.
- The page shows it as its favicon under `file://`, with no external file.

Files: `assets/logo/logomark.png`, `assets/logo/favicon-32.png`, `index.html`, `README.md`, `assets/enemy-sprites/LICENSE.md`.

Decisions:
- A 16 by 16 crop of `ZOMBA1.png` (x 8 to 23, y -2 to 13): the head centered with 2 px above it, the red collar and the shoulders at the bottom, on the game background `#111e30`. 16 source pixels scale by whole numbers to the 16 px tab icon and the 32 px one of a retina screen, so the pixels stay sharp.
- `logomark.png` is 512 by 512 (32 times, nearest neighbor) and `favicon-32.png` is 32 by 32 (2 times). The favicon goes into `index.html` as a data URI, like the other images (TDD 6.2).
- Made with a small Node script (zlib PNG decode and encode) outside the repo; the crop and the scale are recorded in `assets/enemy-sprites/LICENSE.md` so it can be made again.
- In branding the symbol without the name is usually called an isotype (an isologo fuses symbol and name); in the repo it is the logomark.

## D-21c: Boss sprite

Acceptance criteria:
- The boss uses the enemy sprite tinted with the boss color and drawn at its larger size.

Files: `js/renderer.js`.

## D-16d: Admin render toggles

Acceptance criteria:
- Toggles for wall textures, lighting and flat color mode, applied without reloading. Useful to show each algorithm on its own during the defense.
- `useWallTextures` and `useLighting` become runtime settings; the wall strip sprites are created once and hidden when textures are off.

Files: `js/config.js`, `js/renderer.js`, `js/main.js`, `js/admin.js`.

## D-22: Player initials in the ranking (optional)

Acceptance criteria:
- At the end of a game the player can type three initials, stored with the record and shown in the ranking.

## Desirables

Open questions to settle before each story:
- D-08d: requested by the team on 2026-11-22, now P0. The full diagnosis is in the 2026-11-22 feedback section.
- D-05: optional vision cone with the dot product, like the zombie radar from the presentation. To confirm.
- D-06: settled in the 2026-11-20 review. The victory is killing the boss (D-14b, D-19).
- D-08: settled in D-08a. The reload key is R.
- D-12: split on 2026-11-22. The arrow keys and the mouse were requested (D-12a to D-12d); strafing stays optional (D-12e).
