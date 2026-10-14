// TDD 3.2: the camera is six numbers. dir has length 1 and plane is perpendicular
// to dir with length 0.66, which gives a field of view of about 66 degrees.

// TDD 5.2: spawn on air, at the start of the row 1 corridor (the demo spawn).
// H-08 moves it to the room of chunk (0, 0).
// y grows downward on the map, so facing east (+x) the right hand side is +y:
// plane points there and the image is not mirrored.
const player = {
  posX: 7.5,
  posY: 1.5,
  dirX: 1,
  dirY: 0,
  planeX: 0,
  planeY: 0.66,
};
