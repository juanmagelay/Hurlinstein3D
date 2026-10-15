// TDD 6.3: global constants, read by every other script

// Canvas size in pixels (TDD 6.5)
const screenWidth = 1280;
const screenHeight = 720;

const backgroundColor = 0x111e30;

// TDD 5.2: a ray gives up past this many cells and its column shows the background.
// Measured like perpWallDist, along dir.
const maxRayDistance = 24;

// TDD 6.6: demo speeds converted to cells and radians per 60 Hz ticker unit
const moveSpeed = 200 / 64 / 60;
const rotationSpeed = 3 / 60;

// TDD 6.5: width of each wall strip in pixels. One ray per strip, so 2 px on an
// 800 px canvas casts 400 rays. The main performance lever.
const stripWidth = 2;

// TDD 1.3: flat colors, from the demo palette
const ceilingColor = 0x1a1a2e;
const floorColor = 0x2d2d44;
// Fake lighting: side 1 faces (horizontal grid lines) are darker than side 0 faces
const wallColorSide0 = 0x4a6fa5;
const wallColorSide1 = 0x2c4a7c;
const distanceBrightnessBands = [1, 0.8, 0.6, 0.4];
