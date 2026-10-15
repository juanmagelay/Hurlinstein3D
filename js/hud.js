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
