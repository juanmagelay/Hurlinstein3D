// D-07b: shotgun view model. The embedded strip (js/weapon-sheet.js) holds the
// idle frame first, then the four firing frames, all the same size.

const shotgunFrameCount = 5;
const shotgunFrameWidth = 133;
const shotgunFrameHeight = 142;
const shotgunFrameDuration = 0.08; // seconds per firing frame
const shotgunDisplayHeight = 260;  // on-screen height in pixels

// Slices the strip into one canvas per frame. The strip is a data URI, so the
// canvas is never tainted and can be read back (TDD 6.1).
function loadShotgunFrames(dataUri) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const frames = [];
      for (let index = 0; index < shotgunFrameCount; index += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = shotgunFrameWidth;
        canvas.height = shotgunFrameHeight;
        const context = canvas.getContext("2d");
        context.drawImage(
          image,
          index * shotgunFrameWidth, 0, shotgunFrameWidth, shotgunFrameHeight,
          0, 0, shotgunFrameWidth, shotgunFrameHeight
        );
        frames.push(canvas);
      }
      resolve(frames);
    };
    image.src = dataUri;
  });
}

async function createShotgun() {
  const frames = await loadShotgunFrames(shotgunSheetDataUri);
  const textures = frames.map((canvas) => PIXI.Texture.from(canvas));
  const sprite = new PIXI.Sprite(textures[0]);
  sprite.anchor.set(0.5, 1);
  sprite.position.set(screenWidth / 2, screenHeight);
  const scale = shotgunDisplayHeight / shotgunFrameHeight;
  sprite.scale.set(scale);
  return {
    sprite: sprite,
    idleTexture: textures[0],
    fireTextures: textures.slice(1),
    playing: false,
    frameTime: 0,
    frameIndex: 0,
  };
}

// D-07b: each shot restarts the firing animation from its first frame
function triggerShotgun(shotgun) {
  shotgun.playing = true;
  shotgun.frameTime = 0;
  shotgun.frameIndex = 0;
  shotgun.sprite.texture = shotgun.fireTextures[0];
}

// Steps the firing animation in seconds and falls back to the idle frame
function updateShotgun(shotgun, deltaTime) {
  if (!shotgun.playing) {
    return;
  }
  shotgun.frameTime += deltaTime / 60;
  if (shotgun.frameTime < shotgunFrameDuration) {
    return;
  }
  shotgun.frameTime -= shotgunFrameDuration;
  shotgun.frameIndex += 1;
  if (shotgun.frameIndex >= shotgun.fireTextures.length) {
    shotgun.playing = false;
    shotgun.sprite.texture = shotgun.idleTexture;
  } else {
    shotgun.sprite.texture = shotgun.fireTextures[shotgun.frameIndex];
  }
}
