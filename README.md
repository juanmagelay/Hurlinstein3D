# Hurlinstein3D

A first-person procedural dungeon built with grid raycasting, DDA and PixiJS 8. The world is generated in 16 by 16 cell chunks as the player explores it.

## Run

Open `index.html` directly in Chrome. No installation, network access or development server is required.

## Controls

| Input | Action |
|---|---|
| W or Up arrow | Move forward |
| S or Down arrow | Move backward |
| A | Strafe left |
| D | Strafe right |
| Left arrow | Turn left |
| Right arrow | Turn right |
| Mouse left and right | Turn left and right |
| Space or left click | Fire the shotgun |
| R or right click | Reload the shotgun |
| Esc | Release the mouse |
| P | Open or close the admin panel |

The arrows alone move and turn, like the raycasting games of the nineties; W, A, S and D with the mouse is the later first-person scheme. The first click on the game fires and also captures the mouse (pointer lock), so moving it turns the camera. Esc or opening the admin panel releases it, and the next click on the game fires and captures it again. Clicks on the admin panel never fire or reload, and clicks on the menu, victory and defeat screens never capture the mouse, fire or reload. While playing with the mouse free, a hint at the top of the view says that a click captures it. Once captured, the browser shows its own Esc notice, which the page cannot hide.

The player collides with walls and slides along them. Each shot launches a visible projectile toward the crosshair, with one second between shots. It hits the nearest enemy on its path, or stops at the first wall, so an enemy that steps aside in time dodges it; the minimap shows it as a red-orange dot. A killed enemy leaves play at once and falls where it died with the five death frames of its sprite, lies for 2 seconds and fades out; killing the boss wins, and the victory screen appears once it has fallen. Each hit sprays blood drops from the chest of the enemy, a small particle system moved by an Euler step, and each death leaves a blood stain on the floor of its cell, kept for the whole session and marked on the minimap with a dark red dot. Life and ammo are in the upper-left corner and the minimap in the upper-right corner. Play again, or a new world from the admin panel, starts over with new chunks and enemies, no falling enemies, no stains, no drops and no projectiles in flight.

The game fills the browser window on any screen between 4:3 and 21:9, and adapts live when the window is resized or goes full screen. For the team, moving the mouse to the top edge shows an Open admin panel button. The panel shows live FPS, position, chunk, health, ammo, enemies alive against the game total, active enemies, loaded chunks and the world seed. It edits the regular enemies per game (20 by default, up to 100,000 for stress tests; a new total replaces the live enemies with new ones spread evenly over the rooms of the 4 chunks that share a door with the player's, never where the player can see them, and every time the player enters a chunk the hidden enemies left behind reappear there), the active area (only enemies in the 5 by 5 chunks around the player are updated and drawn; turn it off to compare FPS), the player's hit points (10 by default; an enemy in contact takes one on first contact and one more every second, the boss two), the hit points of the regular enemy (1) and of the boss (5), textures on the walls, floor and ceiling, lighting, the flat color mode, the CRT filter, the magazine size (2 to 20), unlimited or limited reloads, the arrow turn speed (120 degrees per second by default), the mouse sensitivity (20 degrees per 100 px of mouse movement by default), god mode, the strip width (1, 2, 4 or 8 px per ray), a fisheye mode that draws walls with the Euclidean distance, rays on the minimap and chunk borders on the minimap. It also refills the ammo, spawns the boss (or brings the live boss next to the player) and starts a new world from a typed seed, or from a random one when the field is empty; the same seed gives the same dungeon on any computer. The Game box, the seed and New world only work while playing. Settings apply right away and are saved in the browser's localStorage; Reset settings restores the defaults. While a panel field has the focus, the game keys do nothing; Enter or a click outside the field gives them back.

## Project map

| File | Responsibility | TDD |
|---|---|---|
| `lib/pixi.min.js` | Local PixiJS 8.21.0 browser bundle | 6.1, 6.2 |
| `lib/pixi-filters.js` | pixi-filters 6.1.5 browser bundle, MIT, SHA-256 `3bb1830fe730687c9aa24b331b51f8f2263023ac7c91885e50cf9f339cff36ef` | 6.2 |
| `js/config.js` | 720 px tall canvas whose width follows the window in 8 px steps, movement and rendering constants, texture and lighting toggles | 6.3, 6.5 |
| `js/settings.js` | Admin settings: defaults, ranges, clamping and localStorage, with blocked storage falling back to the defaults | 2.3.5 |
| `js/random.js` | Seeded random generator (mulberry32) and the seed of each chunk, mixed from the world seed and the chunk's Cantor key | 4.4 |
| `js/mapgen.js` | Generates a connected room (and often a second one) plus four corridors in each chunk, from the chunk's seeded random | 4.2, 4.3, 4.4 |
| `js/world.js` | Cantor-keyed chunk storage, `getCell`, room lights, the game's enemies and the boss placed in the rooms next to the player and out of sight, and the per-chunk and per-cell enemy registries | 2.3.2, 5.1, 5.2, 6.8 |
| `js/blood.js` | Blood stains, one per cell, stored for the session in a 16 by 16 array per chunk with the Cantor key, and `getStain` for any cell | 2.3.2, 6.8 |
| `js/player.js` | Camera state, keyboard and mouse input with pointer lock, movement and strafing, collisions against walls and enemies, health in hit points, ammo and reloads | 2.2, 2.3.1, 3.2, 6.6 |
| `js/raycaster.js` | Camera rays and grid DDA | 3.2, 3.3, 3.4 |
| `js/renderer.js` | Floor and ceiling casting sampled at the strip width, wall strips of any strip width, fisheye mode, the three procedural UNAHUR wall textures, point lights on walls, floor and ceiling, ceiling lamps (one in five flickers), enemy sprites standing on the floor with wall occlusion, the death frames of falling enemies, blood stains on the floor casting, blood drops in a ParticleContainer with wall occlusion, and projectiles | 2.3.1, 2.3.2, 2.3.6, 3.4, 6.4, 6.5 |
| `js/enemies.js` | Active area around the player, hidden enemies brought back one door away from the player, enemy state machine (idle, patrol, chase), DDA line of sight, wall sliding, a chase that stops in front of the player, contact hits once per second, the damage of a projectile hit, and the fall of killed enemies (death frames, corpse fade, victory after the boss falls) | 2.3.1, 2.3.2 |
| `js/projectiles.js` | Shotgun projectiles: range from the center ray DDA, flight, and hits on the nearest enemy through the per-cell registry | 2.3.1 |
| `js/particles.js` | Blood spray: a fixed pool of 256 drops, the spray of a hit and of a death, and one Euler step per frame under gravity | 2.3.2, 3.5 |
| `js/minimap.js` | 21 by 21 cell minimap, player position and direction, enemies, projectiles, blood stains, and optional rays and chunk borders | 2.3.1, 2.3.5, 6.7 |
| `js/hud.js` | Center crosshair, LIFE and AMMO labels with their bars, reloads left when limited, bevel frames for the HUD block and the minimap, red damage flash, defeat overlay | 2.3.3, 6.4 |
| `js/weapon.js` | Shotgun aimed at the crosshair, idle, firing and reload animation | 2.3.1, 2.3.3, 6.4 |
| `js/enemy-sheet.js` | Embedded enemy sprite, a copy of `assets/enemy-sprites/ZOMBA1.png`, and the strip of its five death frames packed from `ZOMBI0.png` to `ZOMBM0.png` | 2.3.1, 2.3.2, 6.2 |
| `js/weapon-sheet.js` | Embedded shotgun strip generated from `assets/gun-sprites/Sgun.png` | 6.1 |
| `js/logo-sheet.js` | Embedded menu logotype (WebP), made from `assets/logo/logotype.png` | 2.3.4, 6.2 |
| `js/admin.js` | Admin panel: top strip, pinned panel, P key, live info and settings fields; opening it releases the mouse | 2.3.5 |
| `js/game-state.js` | Game states (menu, playing, victory, defeat), kill count and game time | 2.1, 2.3.4 |
| `js/screens.js` | Show and hide the HTML screens, keyboard navigation in menus, and the mouse capture hint | 2.2, 2.3.4 |
| `js/ranking.js` | Score, initials and the remote ranking API, the only `fetch` in the game | 2.3.4, 6.2 |
| `js/main.js` | PixiJS application, scene, CRT filter over the 3D view, window resize and ticker | 2.3.6, 6.4, 6.5 |
| `assets/icons/LICENSE` | License of the Lucide icons embedded in `index.html` | 2.3.5 |
| `assets/enemy-sprites/` | Original enemy front and death frames and their source and license | 2.3.2 |
| `assets/logo/` | Logomark (512 px) and favicon (32 px), cut from the enemy's head, and the menu logotype with a transparent background; the favicon is embedded in `index.html` | 6.2 |
| `tests/` | Node tests for world generation, DDA, movement, projection, enemies, projectiles, blood stains and drops, HUD, weapon and admin settings | 8.7 |

## Verification

### TDD 7.3 success criteria

- [x] Opening `index.html` directly in Chrome creates a 720 px tall game canvas that fills the window (1280 by 720 on a 16:9 screen).
- [x] The player moves and turns through the procedural world, including across a chunk boundary into negative coordinates, without crossing walls.
- [x] Generated chunks remain cached during the session, so revisiting a chunk returns the same map. Each chunk also comes from a seed mixed from the world seed and its coordinates, so the same seed gives the same world in any exploration order.
- [x] The minimap and first-person view read the same `getCell` world.

### TDD 7.2 risks

- [x] DDA rays stop at `maxRayDistance`; tests cover misses and hits within the limit.
- [x] Cell and chunk conversion uses `Math.floor`; tests cover negative coordinates and chunk edges.
- [x] `getCell` generates missing chunks on demand; Cantor keys are unique over a negative and positive range.
- [x] Every chunk keeps solid borders except its four fixed doors; tests flood-fill each generated chunk to verify door connectivity.
- [x] The player spawns at the generated room center in chunk `(0, 0)`, on an air cell.
- [x] Projection uses perpendicular wall distance; numerical tests cover the expected distance and strip height.
- [x] Wall strips are grouped by face color, and Pixi objects are created outside the ticker.
- [x] The required scope stays focused on exploration, movement, collisions and the minimap.

## Credits

- [PixiJS](https://pixijs.com) 8.21.0, MIT license.
- [pixi-filters](https://github.com/pixijs/filters) 6.1.5 browser bundle, MIT license. `lib/pixi-filters.js`, SHA-256 `3bb1830fe730687c9aa24b331b51f8f2263023ac7c91885e50cf9f339cff36ef`. The bundle extends the PixiJS v8 global at `PIXI.filters`.
- [Lucide](https://lucide.dev) icons 1.77.0, ISC license (chevron-down, chevron-up and x derive from Feather, MIT). See `assets/icons/LICENSE`.
- [Husk Mutant](https://opengameart.org/content/husk-mutant) enemy sprite and death frames by HorrorMovieRei, CC0. The logomark and favicon are cropped from it. See `assets/enemy-sprites/LICENSE.md`.
- [FPS Gun Sprites](https://rekkimaru.itch.io/fps-gun-sprites) by Rekkimaru, free for any use (no attribution required).
- [UI BARS](https://guilemus.itch.io/ui-bars) by guilemus, free for commercial use (no redistribution).
- Hurlinstein3D logotype by Juan Manuel Gelay, made with Google Gemini Pro; background removed for the menu. See `assets/logo/logotype.png`.

## Course

Simulación I, first midterm project, 2026

Licenciatura en Desarrollo de Videojuegos y Simulación

Universidad Nacional de Hurlingham (UNAHUR)

Professor: Facundo Toufick Saiegh

Team: Juan Manuel Gelay and Alejo Hutmacher
