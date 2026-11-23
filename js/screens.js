// TDD 2.3.4 / D-18a: the game screens are HTML elements over the canvas, inside
// #game-frame, so they scale with the game. main.js wires the buttons; these
// helpers only show and hide the screens.

function hideScreens() {
  for (const screen of document.querySelectorAll("#game-frame .screen")) {
    screen.hidden = true;
  }
}

function showScreen(screenId) {
  hideScreens();
  const screen = document.getElementById(screenId);
  if (screen !== null) {
    screen.hidden = false;
  }
}
