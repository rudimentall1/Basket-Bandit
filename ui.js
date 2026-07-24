/**
 * ui.js
 * -----------------------------------------------------------------------
 * All DOM presentation for Basket Bandit: HUD (score/lives/level/combo),
 * start menu, pause overlay, and game-over screen. Subscribes to the
 * events GameEngine already emits (stateChange, scoreUpdate, runEnded,
 * catch, miss) and calls only GameEngine's public transition methods
 * (goToMenu, startRun, pause, resume). No game logic lives here - this
 * file only reads engine/storage state and renders it, and forwards
 * button taps back into the engine's own public API.
 *
 * NOTE: the engine's actual EventEmitter fires 'miss' (not 'hazardHit')
 * and has no 'powerupActivated' event - config.js documents that
 * powerups were cut from this design, so there is nothing to listen for
 * there. See the 'miss' handler below for the flash-on-lost-life effect.
 * -----------------------------------------------------------------------
 */

import { GAME_TITLE, PLAYER, ASSETS } from './config.js';
import { STATE } from './engine.js';
import { getState, recordRunResult, isStorageAvailable } from './storage.js';
import { unlockAudio, setMuted, isMuted, playUiClick } from './audio.js';

export function initUI(engine, root) {
  // The engine expects this hook to decide victory vs lose animation on
  // run end (see engine.js _isNewBest). Wiring it here keeps engine.js
  // decoupled from storage.js, per its own comment.
  engine.getBestScore = () => getState().bestScore;

  const el = buildDOM(root);
  wireButtons(engine, el);
  wireEngineEvents(engine, el);

  render(STATE.MENU, el, engine);
  engine.goToMenu();

  return el;
}

// ---------------------------------------------------------------------
// DOM construction
// ---------------------------------------------------------------------

function h(tag, className, html) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

function buildDOM(root) {
  root.innerHTML = '';

  // -------------------- HUD --------------------
  const hud = h('div', 'hud');
  const hudRow = h('div', 'hud-row');

  const livesWrap = h('div', 'hud-lives');
  const lifeIcons = [];
  for (let i = 0; i < PLAYER.maxLives; i++) {
    const life = h('span', null, '&#10084;'); // heart glyph, no CSS class needed
    life.style.fontSize = '18px';
    life.style.color = 'var(--color-danger)';
    life.style.textShadow = '0 1px 3px rgba(0,0,0,0.5)';
    livesWrap.appendChild(life);
    lifeIcons.push(life);
  }

  const scoreBlock = h('div', 'hud-score');
  const scoreValue = h('span');
  const levelBadge = h('span');
  levelBadge.style.display = 'block';
  levelBadge.style.fontSize = '13px';
  levelBadge.style.fontWeight = '700';
  levelBadge.style.color = 'var(--color-text-dim)';
  levelBadge.style.marginTop = '2px';
  scoreBlock.appendChild(scoreValue);
  scoreBlock.appendChild(levelBadge);

  const muteBtn = h('button', 'icon-btn', '&#128266;');
  const pauseBtn = h('button', 'icon-btn', '&#10074;&#10074;');

  hudRow.appendChild(livesWrap);
  hudRow.appendChild(scoreBlock);
  hudRow.appendChild(muteBtn);
  hudRow.appendChild(pauseBtn);

  const combo = h('div', 'hud-combo');

  hud.appendChild(hudRow);
  hud.appendChild(combo);

  // -------------------- Menu screen --------------------
  const menuScreen = h('div', 'screen');
  const menuCard = h('div', 'menu-card');
  const portrait = h('img', 'menu-portrait');
  portrait.src = ASSETS.menuPortrait;
  portrait.alt = '';
  const title = h('div', 'game-title', GAME_TITLE);
  const sub = h('p', 'game-sub', 'Catch the falling eggs across 4 lanes!');
  const bestStat = h('div', 'menu-stat');
  const startBtn = h('button', 'btn btn--primary', 'Start Game');
  const menuFooter = h('div', 'menu-footer');
  const storageWarning = h('div', 'menu-stat');
  storageWarning.style.color = 'var(--color-danger)';
  storageWarning.textContent = 'Progress can\u2019t be saved on this device.';
  storageWarning.style.display = 'none';

  menuFooter.appendChild(muteBtnClone(muteBtn.cloneNode(true)));
  menuCard.appendChild(portrait);
  menuCard.appendChild(title);
  menuCard.appendChild(sub);
  menuCard.appendChild(bestStat);
  menuCard.appendChild(storageWarning);
  menuCard.appendChild(startBtn);
  menuCard.appendChild(menuFooter);
  menuScreen.appendChild(menuCard);

  // -------------------- Pause screen --------------------
  const pauseScreen = h('div', 'screen');
  const pauseCard = h('div', 'menu-card');
  pauseCard.appendChild(h('div', 'game-title', 'Paused'));
  const resumeBtn = h('button', 'btn btn--primary', 'Resume');
  const restartFromPauseBtn = h('button', 'btn btn--ghost', 'Restart');
  const menuFromPauseBtn = h('button', 'btn btn--ghost', 'Main Menu');
  pauseCard.appendChild(resumeBtn);
  pauseCard.appendChild(restartFromPauseBtn);
  pauseCard.appendChild(menuFromPauseBtn);
  pauseScreen.appendChild(pauseCard);

  // -------------------- Game over screen --------------------
  const overScreen = h('div', 'screen');
  const overCard = h('div', 'menu-card menu-card--tall');
  overCard.appendChild(h('div', 'game-title', 'Game Over'));
  const overScore = h('div', 'gameover-score');
  const overBest = h('div', 'gameover-best');
  const toasts = h('div', 'achievement-toasts');
  const restartBtn = h('button', 'btn btn--primary', 'Play Again');
  const menuFromOverBtn = h('button', 'btn btn--ghost', 'Main Menu');
  overCard.appendChild(overScore);
  overCard.appendChild(overBest);
  overCard.appendChild(toasts);
  overCard.appendChild(restartBtn);
  overCard.appendChild(menuFromOverBtn);
  overScreen.appendChild(overCard);

  root.appendChild(hud);
  root.appendChild(menuScreen);
  root.appendChild(pauseScreen);
  root.appendChild(overScreen);

  return {
    hud, lifeIcons, scoreValue, levelBadge, combo, muteBtn, pauseBtn,
    menuScreen, bestStat, startBtn, storageWarning,
    pauseScreen, resumeBtn, restartFromPauseBtn, menuFromPauseBtn,
    overScreen, overScore, overBest, toasts, restartBtn, menuFromOverBtn
  };
}

// The menu footer just needs *a* mute toggle; reuse the HUD one's markup
// but keep it a separate element/listener target so both stay in sync
// via refreshMuteButtons().
function muteBtnClone(node) {
  node.dataset.muteClone = '1';
  return node;
}

// ---------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------

function wireButtons(engine, el) {
  const withUnlock = (fn) => (e) => { unlockAudio(); playUiClick(); fn(e); };

  el.startBtn.addEventListener('click', withUnlock(() => engine.startRun()));
  el.restartBtn.addEventListener('click', withUnlock(() => engine.startRun()));
  el.restartFromPauseBtn.addEventListener('click', withUnlock(() => engine.startRun()));
  el.resumeBtn.addEventListener('click', withUnlock(() => engine.resume()));
  el.pauseBtn.addEventListener('click', withUnlock(() => engine.pause()));
  el.menuFromPauseBtn.addEventListener('click', withUnlock(() => engine.goToMenu()));
  el.menuFromOverBtn.addEventListener('click', withUnlock(() => engine.goToMenu()));

  const toggleMute = () => {
    unlockAudio();
    setMuted(!isMuted());
    refreshMuteButtons(el);
  };
  el.muteBtn.addEventListener('click', toggleMute);
  el.menuScreen.querySelectorAll('[data-mute-clone]').forEach(btn => {
    btn.addEventListener('click', toggleMute);
  });

  refreshMuteButtons(el);
  if (!isStorageAvailable()) el.storageWarning.style.display = 'block';
}

function refreshMuteButtons(el) {
  const glyph = isMuted() ? '&#128263;' : '&#128266;';
  el.muteBtn.innerHTML = glyph;
  el.menuScreen.querySelectorAll('[data-mute-clone]').forEach(btn => {
    btn.innerHTML = glyph;
  });
}

function wireEngineEvents(engine, el) {
  engine.events.on('stateChange', (state) => render(state, el, engine));
  engine.events.on('scoreUpdate', (snapshot) => updateHUD(snapshot, el));
  engine.events.on('catch', () => flashCombo(el));
  engine.events.on('miss', () => flashLives(el));
  engine.events.on('runEnded', (result) => showGameOver(result, el));
}

// ---------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------

function render(state, el, engine) {
  el.menuScreen.style.display = state === STATE.MENU ? 'flex' : 'none';
  el.pauseScreen.style.display = state === STATE.PAUSED ? 'flex' : 'none';
  el.overScreen.style.display = state === STATE.GAMEOVER ? 'flex' : 'none';

  // HUD stays visible during play/pause/gameover so the last score/lives
  // remain legible under the pause/gameover overlays; hidden at menu.
  el.hud.style.display = state === STATE.MENU ? 'none' : 'block';
  el.pauseBtn.style.visibility = state === STATE.PLAYING ? 'visible' : 'hidden';

  if (state === STATE.MENU) {
    const best = getState().bestScore || 0;
    el.bestStat.textContent = best > 0 ? `Best score: ${best}` : 'Catch your first egg to set a best score!';
  }
}

function updateHUD(snapshot, el) {
  el.scoreValue.textContent = snapshot.score;
  el.levelBadge.textContent = `Level ${snapshot.level}`;

  el.lifeIcons.forEach((icon, i) => {
    icon.style.opacity = i < snapshot.lives ? '1' : '0.25';
  });

  if (snapshot.combo > 1) {
    el.combo.textContent = `Combo x${snapshot.combo} \u00b7 \u00d7${snapshot.multiplier.toFixed(1)} score`;
    el.combo.classList.add('hud-combo--active');
  } else {
    el.combo.classList.remove('hud-combo--active');
  }
}

let comboFlashTimer = null;
function flashCombo(el) {
  el.scoreValue.style.transform = 'scale(1.12)';
  clearTimeout(comboFlashTimer);
  comboFlashTimer = setTimeout(() => { el.scoreValue.style.transform = 'scale(1)'; }, 120);
}

let livesFlashTimer = null;
function flashLives(el) {
  el.lifeIcons.forEach(icon => { icon.style.transform = 'scale(1.3)'; });
  clearTimeout(livesFlashTimer);
  livesFlashTimer = setTimeout(() => {
    el.lifeIcons.forEach(icon => { icon.style.transform = 'scale(1)'; });
  }, 150);
}

function showGameOver(result, el) {
  const { state: saved, newlyUnlocked } = recordRunResult({
    runScore: result.score,
    runLevel: result.level,
    catchesThisRun: result.catchesThisRun,
    bestComboThisRun: result.bestComboThisRun,
    missesThisRun: result.missesThisRun
  });

  el.overScore.textContent = result.isNewBest
    ? `New Best! ${result.score}`
    : `Score: ${result.score}`;
  el.overBest.textContent = `Best score: ${saved.bestScore}`;

  el.toasts.innerHTML = '';
  newlyUnlocked.forEach(def => {
    const toast = h('div', 'achv-toast', `\u{1F3C6} ${def.title} \u2014 ${def.desc}`);
    el.toasts.appendChild(toast);
  });
}
