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

  // D-04c2: enemies draw over the walls, occluded per strip by the wall depth
  const enemies = new PIXI.Graphics();
  app.stage.addChild(enemies);

  // TDD 6.4: the minimap Graphics object is created once, above the view
  const minimap = new PIXI.Graphics();
  app.stage.addChild(minimap);

  // TDD 6.4: static HUD Graphics is created and drawn once, above the minimap
  const hud = new PIXI.Graphics();
  drawHud(hud);
  app.stage.addChild(hud);

  // D-06c: health bar sprites from the embedded images, loaded once (no network)
  const healthBar = await createHealthBar();
  app.stage.addChild(healthBar.background);
  app.stage.addChild(healthBar.fill);

  // D-06c: defeat overlay sits on top and stays hidden until health reaches zero
  const defeatOverlay = createDefeatOverlay();
  app.stage.addChild(defeatOverlay);

  // TDD 6.4: keyboard listeners are registered once, outside the ticker
  const pressedKeys = createKeyboardInput(window);

  // TDD 6.4: inside the ticker goes only what changes every frame
  app.ticker.add((ticker) => {
    healthBar.fill.width = getHealthBarWidth(player.health / player.maxHealth);
    // D-06b: at zero health the game freezes on the last frame
    if (isPlayerDefeated(player)) {
      defeatOverlay.visible = true;
      return;
    }
    updatePlayer(player, pressedKeys, ticker.deltaTime);
    updateEnemies(player, ticker.deltaTime);
    damagePlayer(player, getContactDamage(player, ticker.deltaTime));
    drawWalls(walls, player);
    drawEnemies(enemies, player);
    drawMinimap(minimap, player);
  });
}

startGame();
