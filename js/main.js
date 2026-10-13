// TDD 6.4: app.init is async, so startup lives in an async function
async function startGame() {
  const app = new PIXI.Application();
  await app.init({
    width: screenWidth,
    height: screenHeight,
    background: backgroundColor,
  });
  document.body.appendChild(app.canvas);
}

startGame();
