// TDD 2.3.5 / D-16b: admin panel for the team, an HTML layer over the game.
// It has three states, kept in body[data-admin] so the CSS can animate them:
// "hidden" (nothing shows), "peek" (the strip with the open button, while the
// mouse is near the top edge) and "open" (the pinned panel). It never pauses
// the game and never resizes it.

const adminRefreshInterval = 250; // ms: live values refresh about four times per second
const adminPeekHideDelay = 400; // ms: grace time before the strip slides back up
const adminToggleKey = "p";

// --- Pure helpers, covered by tests/admin.test.js ---

function formatAdminPosition(posX, posY) {
  return `${posX.toFixed(2)}, ${posY.toFixed(2)}`;
}

// TDD 5.1: the chunk of a world position, with Math.floor so negatives work
function getChunkOfPosition(posX, posY) {
  return { cx: Math.floor(posX / chunkSize), cy: Math.floor(posY / chunkSize) };
}

function formatAdminChunk(posX, posY) {
  const chunk = getChunkOfPosition(posX, posY);
  return `${chunk.cx}, ${chunk.cy}`;
}

// Health drops by fractions of a point per frame, so it is rounded up: the
// panel shows 1 until the player is really at zero
function formatAdminHealth(health, maxHealth) {
  return `${Math.ceil(health)} / ${maxHealth}`;
}

function formatAdminAmmo(ammo, magazine, reloading) {
  const rounds = `${ammo} / ${magazine}`;
  return reloading ? `${rounds}, reloading` : rounds;
}

function countLoadedEnemies() {
  let total = 0;
  for (const enemies of enemiesByChunk.values()) {
    total += enemies.length;
  }
  return total;
}

// Every live value as text, ready for textContent
function getAdminInfo(player, framesPerSecond) {
  return {
    fps: String(Math.round(framesPerSecond)),
    position: formatAdminPosition(player.posX, player.posY),
    chunk: formatAdminChunk(player.posX, player.posY),
    health: formatAdminHealth(player.health, player.maxHealth),
    ammo: formatAdminAmmo(player.ammo, magazineSize, player.reloading),
    enemies: String(countLoadedEnemies()),
    chunks: String(generatedChunks.size),
  };
}

// Key events typed into a panel field (D-16c) must never reach the game
function isTypingInField(event) {
  const target = event.target;
  if (!target || !target.tagName) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || Boolean(target.isContentEditable);
}

// --- Browser part, wired once by main.js (TDD 6.4) ---

function createAdminPanel(page, player) {
  const body = page.body;
  const hoverZone = page.getElementById("admin-hover-zone");
  const peek = page.getElementById("admin-peek");
  const openButton = page.getElementById("admin-open");
  const closeButtons = page.querySelectorAll("[data-admin-close]");
  const valueElements = {};
  for (const element of page.querySelectorAll("[data-admin-value]")) {
    valueElements[element.dataset.adminValue] = element;
  }

  let state = "hidden";
  let hideTimer = null;
  let frames = 0;
  let elapsedMS = 0;
  let framesPerSecond = 0;

  function setState(nextState) {
    state = nextState;
    body.dataset.admin = nextState;
    openButton.setAttribute("aria-expanded", String(nextState === "open"));
  }

  function writeInfo() {
    const info = getAdminInfo(player, framesPerSecond);
    for (const name in valueElements) {
      valueElements[name].textContent = info[name];
    }
  }

  function cancelHide() {
    clearTimeout(hideTimer);
    hideTimer = null;
  }

  function showPeek() {
    cancelHide();
    if (state === "hidden") {
      setState("peek");
    }
  }

  function scheduleHide() {
    cancelHide();
    hideTimer = setTimeout(() => {
      if (state === "peek") {
        setState("hidden");
      }
    }, adminPeekHideDelay);
  }

  function open() {
    cancelHide();
    setState("open");
    writeInfo();
  }

  function close() {
    setState("hidden");
  }

  function toggle() {
    if (state === "open") {
      close();
    } else {
      open();
    }
  }

  // A clicked button keeps the focus, and Space would press it again instead
  // of firing the shotgun, so every panel button lets the focus go
  function onButton(button, action) {
    button.addEventListener("click", () => {
      action();
      button.blur();
    });
  }

  hoverZone.addEventListener("mouseenter", showPeek);
  hoverZone.addEventListener("mouseleave", scheduleHide);
  peek.addEventListener("mouseenter", showPeek);
  peek.addEventListener("mouseleave", scheduleHide);
  onButton(openButton, open);
  for (const button of closeButtons) {
    onButton(button, close);
  }

  page.defaultView.addEventListener("keydown", (event) => {
    if (event.repeat || isTypingInField(event)) {
      return;
    }
    if (event.key.toLowerCase() === adminToggleKey) {
      toggle();
    }
  });

  setState("hidden");

  return {
    // Called from the ticker with ticker.deltaMS. It only counts frames; the
    // DOM is written four times per second, and only while the panel is open.
    update(deltaMS) {
      frames += 1;
      elapsedMS += deltaMS;
      if (elapsedMS < adminRefreshInterval) {
        return;
      }
      framesPerSecond = frames * 1000 / elapsedMS;
      frames = 0;
      elapsedMS = 0;
      if (state === "open") {
        writeInfo();
      }
    },
  };
}
