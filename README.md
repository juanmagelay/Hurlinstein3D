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

The player collides with walls and slides along them. The minimap is overlaid in the upper-left corner.

## Project map

| File | Responsibility | TDD |
|---|---|---|
| `lib/pixi.min.js` | Local PixiJS 8.21.0 browser bundle | 6.1, 6.2 |
| `js/config.js` | 1280 by 720 canvas, movement and rendering constants | 6.3 |
| `js/mapgen.js` | Generates a connected room and four corridors in each chunk | 4.2, 4.3 |
| `js/world.js` | Cantor-keyed chunk storage and `getCell` | 5.1, 5.2, 6.8 |
| `js/player.js` | Camera state, keyboard input, movement, collisions, health and ammo | 3.2, 6.6 |
| `js/raycaster.js` | Camera rays and grid DDA | 3.2, 3.3, 3.4 |
| `js/renderer.js` | Ceiling, floor and grouped flat-color wall strips | 6.4, 6.5 |
| `js/minimap.js` | 21 by 21 cell minimap, player position and direction | 6.7 |
| `js/hud.js` | Center crosshair, health bar, ammo bar and defeat overlay | 2.3.3, 6.4 |
| `js/weapon.js` | Bottom-center shotgun, idle, firing and reload animation | 2.3.3, 6.4 |
| `js/weapon-sheet.js` | Embedded shotgun strip generated from `assets/gun-sprites/Sgun.png` | 6.1 |
| `js/main.js` | PixiJS application, scene and ticker | 6.4 |
| `tests/` | Node tests for world generation, DDA, movement and projection | 8.7 |

## Verification

### TDD 7.3 success criteria

- [x] Opening `index.html` directly in Chrome creates the 1280 by 720 (16:9) game canvas.
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

## Course

Simulación I, first midterm project, 2026

Licenciatura en Desarrollo de Videojuegos y Simulación

Universidad Nacional de Hurlingham (UNAHUR)

Professor: Facundo Toufick Saiegh

Team: Juan Manuel Gelay and Alejo Hutmacher
