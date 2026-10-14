// TDD 6.4: app.init is async, so startup lives in an async function
async function startGame() {
  const app = new PIXI.Application();
  await app.init({
    width: screenWidth,
    height: screenHeight,
    background: backgroundColor,
  });
  document.body.appendChild(app.canvas);

  // TDD 6.4: Graphics objects are created once, outside the ticker.
  // Ceiling and floor never change, so they are drawn here, once.
  const ceilingAndFloor = new PIXI.Graphics();
  drawCeilingAndFloor(ceilingAndFloor);
  app.stage.addChild(ceilingAndFloor);

  // Added second, so the walls are drawn on top of ceiling and floor
  const walls = new PIXI.Graphics();
  app.stage.addChild(walls);

  // TDD 6.4: inside the ticker goes only what changes every frame
  app.ticker.add(() => {
    drawWalls(walls, player);
  });
}

startGame();
