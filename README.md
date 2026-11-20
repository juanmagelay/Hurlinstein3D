# Hurlinstein3D

A first-person procedural dungeon built with grid raycasting, DDA and PixiJS 8. The world is generated in 16 by 16 cell chunks as the player explores it.

## Run

Open `index.html` directly in Chrome. No installation, network access or development server is required.

## Controls

| Key | Action |
|---|---|
| W | Move forward |
| S | Move backward |
| A | Turn left |
| D | Turn right |
| Space | Fire the shotgun |
| R | Reload the shotgun |
| P | Open or close the admin panel |

The player collides with walls and slides along them. Life and ammo are in the upper-left corner and the minimap in the upper-right corner.

The game fills the browser window on any screen between 4:3 and 21:9, and adapts live when the window is resized or goes full screen. For the team, moving the mouse to the top edge shows an Open admin panel button. The panel shows live FPS, position, chunk, health, ammo, enemies created against the game total, loaded and active enemies, and loaded chunks. It edits the regular enemies per game (20 by default, up to 100,000 for stress tests), the active area (only enemies in the 5 by 5 chunks around the player are updated and drawn; turn it off to compare FPS), the player's hit points (10 by default; a second of contact with an enemy takes one), the magazine size (2 to 20), unlimited or limited reloads, the A and D turn speed (120 degrees per second by default), god mode, the strip width (1, 2, 4 or 8 px per ray), a fisheye mode that draws walls with the Euclidean distance, rays on the minimap and chunk borders on the minimap. It also refills the ammo. Settings apply right away and are saved in the browser's localStorage; Reset settings restores the defaults. While a panel field has the focus, the game keys do nothing; Enter or a click outside the field gives them back.

## Project map

| File | Responsibility | TDD |
|---|---|---|
| `lib/pixi.min.js` | Local PixiJS 8.21.0 browser bundle | 6.1, 6.2 |
| `js/config.js` | 720 px tall canvas whose width follows the window in 8 px steps, movement and rendering constants, texture and lighting toggles | 6.3, 6.5 |
| `js/settings.js` | Admin settings: defaults, ranges, clamping and localStorage, with blocked storage falling back to the defaults | 2.3.5 |
| `js/mapgen.js` | Generates a connected room (and often a second one) plus four corridors in each chunk | 4.2, 4.3 |
| `js/world.js` | Cantor-keyed chunk storage, `getCell`, room lights, enemy population capped by the game total and the per-cell enemy registry | 2.3.2, 5.1, 5.2, 6.8 |
| `js/player.js` | Camera state, keyboard input, movement, collisions, health in hit points, ammo and reloads | 2.3.1, 3.2, 6.6 |
| `js/raycaster.js` | Camera rays and grid DDA | 3.2, 3.3, 3.4 |
| `js/renderer.js` | Ceiling, floor, wall strips of any strip width, fisheye mode, procedural wall textures, point lights, enemies and projectiles | 2.3.1, 3.4, 6.4, 6.5 |
| `js/enemies.js` | Active area around the player, enemy state machine (idle, patrol, chase), DDA line of sight, wall sliding and contact damage | 2.3.1, 2.3.2 |
| `js/projectiles.js` | Shotgun projectiles: range from the center ray DDA, flight, and enemy hits through the per-cell registry | 2.3.1 |
| `js/minimap.js` | 21 by 21 cell minimap, player position and direction, enemies, projectiles, and optional rays and chunk borders | 2.3.5, 6.7 |
| `js/hud.js` | Center crosshair, LIFE and AMMO labels with their bars, reloads left when limited, defeat overlay | 2.3.3, 6.4 |
| `js/weapon.js` | Shotgun aimed at the crosshair, idle, firing and reload animation | 2.3.1, 2.3.3, 6.4 |
| `js/weapon-sheet.js` | Embedded shotgun strip generated from `assets/gun-sprites/Sgun.png` | 6.1 |
| `js/admin.js` | Admin panel: top strip, pinned panel, P key, live info and settings fields | 2.3.5 |
| `js/main.js` | PixiJS application, scene, window resize and ticker | 6.4, 6.5 |
| `assets/icons/LICENSE` | License of the Lucide icons embedded in `index.html` | 2.3.5 |
| `tests/` | Node tests for world generation, DDA, movement, projection, enemies, projectiles, HUD, weapon and admin settings | 8.7 |

## Verification

### TDD 7.3 success criteria

- [x] Opening `index.html` directly in Chrome creates a 720 px tall game canvas that fills the window (1280 by 720 on a 16:9 screen).
- [x] The player moves and turns through the procedural world, including across a chunk boundary into negative coordinates, without crossing walls.
- [x] Generated chunks remain cached during the session, so revisiting a chunk returns the same map.
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
- [Lucide](https://lucide.dev) icons 1.77.0, ISC license (chevron-down, chevron-up and x derive from Feather, MIT). See `assets/icons/LICENSE`.

## Course

Simulación I, first midterm project, 2026

Licenciatura en Desarrollo de Videojuegos y Simulación

Universidad Nacional de Hurlingham (UNAHUR)

Professor: Facundo Toufick Saiegh

Team: Juan Manuel Gelay and Alejo Hutmacher
