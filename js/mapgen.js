// TDD 4.2: generate one connected 16 by 16 room-and-corridor chunk
const chunkSize = 16;
const doorIndex = 8;

function generateChunk() {
  const cells = new Uint8Array(chunkSize * chunkSize);
  cells.fill(1);

  const roomWidth = randomInteger(4, 8);
  const roomHeight = randomInteger(4, 8);
  const roomX = randomInteger(2, chunkSize - roomWidth - 2);
  const roomY = randomInteger(2, chunkSize - roomHeight - 2);
  const room = { x: roomX, y: roomY, width: roomWidth, height: roomHeight };
  const roomCenter = {
    x: roomX + roomWidth / 2,
    y: roomY + roomHeight / 2,
  };
  const roomCenterCellX = Math.floor(roomCenter.x);
  const roomCenterCellY = Math.floor(roomCenter.y);

  carveRectangle(cells, roomX, roomY, roomWidth, roomHeight);

  carveNorthCorridor(cells, room, roomCenterCellX, roomCenterCellY);
  carveSouthCorridor(cells, room, roomCenterCellX, roomCenterCellY);
  carveWestCorridor(cells, room, roomCenterCellX, roomCenterCellY);
  carveEastCorridor(cells, room, roomCenterCellX, roomCenterCellY);

  return { cells, room, roomCenter };
}

function randomInteger(minimum, maximum) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function carveRectangle(cells, x, y, width, height) {
  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      setAir(cells, column, row);
    }
  }
}

function carveNorthCorridor(cells, room, roomCenterX, roomCenterY) {
  const bendY = randomInteger(1, room.y - 1);
  carveVertical(cells, doorIndex, 0, bendY);
  carveHorizontal(cells, doorIndex, roomCenterX, bendY);
  carveVertical(cells, roomCenterX, bendY, roomCenterY);
}

function carveSouthCorridor(cells, room, roomCenterX, roomCenterY) {
  const bendY = randomInteger(room.y + room.height, chunkSize - 2);
  carveVertical(cells, doorIndex, chunkSize - 1, bendY);
  carveHorizontal(cells, doorIndex, roomCenterX, bendY);
  carveVertical(cells, roomCenterX, bendY, roomCenterY);
}

function carveWestCorridor(cells, room, roomCenterX, roomCenterY) {
  const bendX = randomInteger(1, room.x - 1);
  carveHorizontal(cells, 0, bendX, doorIndex);
  carveVertical(cells, bendX, doorIndex, roomCenterY);
  carveHorizontal(cells, bendX, roomCenterX, roomCenterY);
}

function carveEastCorridor(cells, room, roomCenterX, roomCenterY) {
  const bendX = randomInteger(room.x + room.width, chunkSize - 2);
  carveHorizontal(cells, chunkSize - 1, bendX, doorIndex);
  carveVertical(cells, bendX, doorIndex, roomCenterY);
  carveHorizontal(cells, bendX, roomCenterX, roomCenterY);
}

function carveHorizontal(cells, startX, endX, y) {
  const minimumX = Math.min(startX, endX);
  const maximumX = Math.max(startX, endX);
  for (let x = minimumX; x <= maximumX; x += 1) {
    setAir(cells, x, y);
  }
}

function carveVertical(cells, x, startY, endY) {
  const minimumY = Math.min(startY, endY);
  const maximumY = Math.max(startY, endY);
  for (let y = minimumY; y <= maximumY; y += 1) {
    setAir(cells, x, y);
  }
}

function setAir(cells, x, y) {
  cells[y * chunkSize + x] = 0;
}

function formatChunk(cells) {
  const rows = [];
  for (let y = 0; y < chunkSize; y += 1) {
    let row = "";
    for (let x = 0; x < chunkSize; x += 1) {
      row += cells[y * chunkSize + x] === 0 ? "." : "#";
    }
    rows.push(row);
  }
  return rows.join("\n");
}
