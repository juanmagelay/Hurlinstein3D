// D-07b / D-08c: shotgun view model. The embedded strip (js/weapon-sheet.js)
// holds the idle frame, then the four firing frames, then the reload frames,
// all the same size.

const shotgunFrameCount = 17;
const shotgunFrameWidth = 133;
const shotgunFrameHeight = 142;
const shotgunFrameDuration = 0.08; // seconds per animation frame
const shotgunDisplayHeight = 260;  // on-screen height in pixels

// Frame ranges inside the strip (D-07b and D-08c)
const shotgunIdleFrame = 0;
const shotgunFireFrames = [1, 2, 3, 4];
const shotgunReloadFrames = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

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
  const sprite = new PIXI.Sprite(textures[shotgunIdleFrame]);
  sprite.anchor.set(0.5, 1);
  sprite.position.set(screenWidth / 2, screenHeight);
  const scale = shotgunDisplayHeight / shotgunFrameHeight;
  sprite.scale.set(scale);
  return {
    sprite: sprite,
    idleTexture: textures[shotgunIdleFrame],
    fireTextures: shotgunFireFrames.map((index) => textures[index]),
    reloadTextures: shotgunReloadFrames.map((index) => textures[index]),
    playing: false,
    sequence: null,
    frameIndex: 0,
    frameTime: 0,
  };
}

// Plays a list of textures once, from the start
function playShotgunSequence(shotgun, textures) {
  shotgun.playing = true;
  shotgun.sequence = textures;
  shotgun.frameIndex = 0;
  shotgun.frameTime = 0;
  shotgun.sprite.texture = textures[0];
}

// D-07b: each shot restarts the firing animation
function triggerShotgun(shotgun) {
  playShotgunSequence(shotgun, shotgun.fireTextures);
}

// D-08c: a reload plays the reload frames
function startReloadAnimation(shotgun) {
  playShotgunSequence(shotgun, shotgun.reloadTextures);
}

// Steps the running animation in seconds and falls back to the idle frame
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
  if (shotgun.frameIndex >= shotgun.sequence.length) {
    shotgun.playing = false;
    shotgun.sprite.texture = shotgun.idleTexture;
  } else {
    shotgun.sprite.texture = shotgun.sequence[shotgun.frameIndex];
  }
}
