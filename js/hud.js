// TDD 2.3.3 and 6.4: static center crosshair, drawn once outside the ticker
const crosshairColor = 0x4de1bd;
const crosshairArmLength = 8;
const crosshairGap = 4;
const crosshairThickness = 2;

function drawHud(graphics) {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const halfGap = crosshairGap / 2;

  graphics.clear();
  graphics.rect(
    centerX - halfGap - crosshairArmLength,
    centerY - crosshairThickness / 2,
    crosshairArmLength,
    crosshairThickness,
  );
  graphics.rect(
    centerX + halfGap,
    centerY - crosshairThickness / 2,
    crosshairArmLength,
    crosshairThickness,
  );
  graphics.rect(
    centerX - crosshairThickness / 2,
    centerY - halfGap - crosshairArmLength,
    crosshairThickness,
    crosshairArmLength,
  );
  graphics.rect(
    centerX - crosshairThickness / 2,
    centerY + halfGap,
    crosshairThickness,
    crosshairArmLength,
  );
  graphics.fill(crosshairColor);
}

// D-06c: the health bar uses the embedded UI sheet, cropped to its middle bar
// band (rows 20 to 35). Data URIs keep file:// working without network access.
const barSheetWidth = 98;
const barBandY = 20;
const barBandHeight = 16;
const healthBarMargin = 16;
const emptyBarDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGIAAABHCAYAAAD8xJKLAAABg2lDQ1BJQ0MgcHJvZmlsZQAAKJF9kT1Iw0AcxV9TpSIVkXYQcchQnSyIFXGUKhbBQmkrtOpgcukXNGlIUlwcBdeCgx+LVQcXZ10dXAVB8APE0clJ0UVK/F9SaBHjwXE/3t173L0DhGaVqWbPJKBqlpFOxMVcflUMvCKIEIYAxCRm6snMYhae4+sePr7eRXmW97k/x4BSMBngE4nnmG5YxBvEM5uWznmfOMzKkkJ8Tjxh0AWJH7kuu/zGueSwwDPDRjY9TxwmFktdLHcxKxsq8TRxRFE1yhdyLiuctzir1Tpr35O/MFjQVjJcpzmKBJaQRAoiZNRRQRUWorRqpJhI037cwz/i+FPkkslVASPHAmpQITl+8D/43a1ZjE25ScE40Pti2x9jQGAXaDVs+/vYtlsngP8ZuNI6/loTmP0kvdHRIkfA4DZwcd3R5D3gcgcYftIlQ3IkP02hWATez+ib8kDoFuhfc3tr7+P0AchSV8s3wMEhMF6i7HWPd/d19/bvmXZ/P4arcq/4oiC+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5gwTEQMOWuTwzAAAABl0RVh0Q29tbWVudABDcmVhdGVkIHdpdGggR0lNUFeBDhcAAAEuSURBVHja7dnRbYMwFAVQU2UPVmATZvUmXsGT0I+qCZBGBRsFAuf8Ben6IT1BsF8THoZQppGvzzfjBfq+X7VCjHHyW74834QQhvECXdctWiSl9Od1+fX5GOOjEUsXeLWgfHk+xhi+AoegERqBRmgEGvEpjXj1Xbz0W1i+Lv+0oeP97vuInHPxIjln+cr8/YkY7wrbtl21wJz8+nxKaXrot3abPn8vypfnm9F1x9j75gHg3z+KYed7uHT9qpn1FjvKsSvXL55Z16qd+Z6pfowx3N59A/N6tTPfs9R3DH4QGqERaIRGoBGf0oiSmeuW39JXr39bssnZ48auVr96Zl2rduZ7hvqTJ+L3wtKZ61Y3oP6Pqpn11q+CK9d3DH6c+gAAAAAAAAAAAAAAAABs6xuykB1/pUjlpAAAAABJRU5ErkJggg==";
const healthBarDataUri = "data:image/png;base64,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";

// D-06c: the fill width follows the health fraction, clamped to the bar.
function getHealthBarWidth(healthFraction) {
  const clamped = Math.min(Math.max(healthFraction, 0), 1);
  return barSheetWidth * clamped;
}

function loadBarCanvas(dataUri) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = barSheetWidth;
      canvas.height = barBandHeight;
      const context = canvas.getContext("2d");
      context.drawImage(
        image,
        0,
        barBandY,
        barSheetWidth,
        barBandHeight,
        0,
        0,
        barSheetWidth,
        barBandHeight,
      );
      resolve(canvas);
    };
    image.src = dataUri;
  });
}

// D-06c: empty bar as background, health bar on top with a width that follows
// the health fraction. Created once, outside the ticker.
async function createHealthBar() {
  const emptyCanvas = await loadBarCanvas(emptyBarDataUri);
  const healthCanvas = await loadBarCanvas(healthBarDataUri);
  const barX = healthBarMargin;
  const barY = screenHeight - healthBarMargin - barBandHeight;
  const background = new PIXI.Sprite(PIXI.Texture.from(emptyCanvas));
  const fill = new PIXI.Sprite(PIXI.Texture.from(healthCanvas));
  background.position.set(barX, barY);
  fill.position.set(barX, barY);
  return { background, fill };
}

// D-06c: dark overlay with a red frame, hidden until the player is defeated.
function createDefeatOverlay() {
  const overlay = new PIXI.Graphics();
  overlay.rect(0, 0, screenWidth, screenHeight).fill(0x000000);
  overlay
    .rect(screenWidth / 2 - 220, screenHeight / 2 - 50, 440, 100)
    .stroke({ color: 0xff3b3b, width: 6 });
  overlay.alpha = 0.65;
  overlay.visible = false;
  return overlay;
}
