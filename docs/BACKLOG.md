# Backlog

Source of truth: `docs/TDD.md` (TDD v1.1). Work follows the story cycle in `CLAUDE.md` section 10. IDs are stable: a story that grows is split with suffixes (H-05a, H-05b) and a new story takes the next free number.

Branches: every story is committed on `develop`, and once validated `develop` is merged into `main` (fast forward). `main` never gets direct commits. Details in `CLAUDE.md` section 10.3.

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
| H-09g | Remove legacy game controllers and 2D player | Required | 3 | H-09f | in progress |
| H-09h | Remove legacy 3D player and worlds | Required | 3 | H-09g | pending |
| H-09i | Remove legacy canvas and base renderers | Required | 3 | H-09h | pending |
| H-09j | Remove legacy 3D and minimap renderers | Required | 3 | H-09i | pending |
| H-09k | Remove remaining legacy renderers | Required | 3 | H-09j | pending |
| H-09l | Remove legacy lighting and debug panels | Required | 3 | H-09k | pending |
| H-09m | Remove legacy menu and initial tests | Required | 3 | H-09l | pending |
| H-09n | Remove remaining legacy tests | Required | 3 | H-09m | pending |
| H-09o | Add README and verify the minimum scope | Required | 3 | H-09n | pending |
| D-01 | Distance darkening in brightness bands | Desirable | 4 | H-09o | pending |
| D-02 | Wall color per chunk | Desirable | 4 | H-09o | pending |
| D-03 | Base HUD and center crosshair | Desirable | 4 | H-09o | pending |
| D-04 | Visible enemy: registered per cell, on the minimap and in 3D as a square with z-buffer | Desirable | 4 | D-03 | pending |
| D-05 | Enemy state machine with DDA line of sight | Desirable | 4 | D-04 | pending |
| D-06 | Health, contact damage, health bar and defeat | Desirable | 4 | D-05 | pending |
| D-07 | Shooting with the center ray DDA, blocked by walls | Desirable | 4 | D-04 | pending |
| D-08 | Ammo: magazine, reload, counter | Desirable | 4 | D-07 | pending |
| D-09 | Procedural textures on a hidden canvas (wallX, texX), keeping flat color mode | Desirable | 4 | H-09o | pending |
| D-10 | Raycast lighting (reuse `pointLightFactor` from the demo) | Desirable | 4 | H-09o | pending |
| D-11 | Second room per chunk without breaking connectivity | Desirable | 4 | H-09o | pending |
| D-12 | Strafing and mouse look, only if the team asks for it | Desirable | 4 | H-09o | pending |

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
- English README: how to open, controls, which file implements each TDD section, course and university.
- TDD 7.3 success criteria and TDD 7.2 risks checked one by one.

## Desirables

Open questions to settle before each story:
- D-05: optional vision cone with the dot product, like the zombie radar from the presentation. To confirm.
- D-06: the TDD does not define a victory condition. Ask.
- D-08: the TDD does not define the reload key. Ask.
- D-12: only if the team asks for it.
