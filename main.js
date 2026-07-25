/**
 * main.js
 * Basket Bandit
 *
 * Boots the game: preload every sprite, then hand off to GameEngine + UI.
 * Also owns the loading screen (progress bar + a graceful error message)
 * so a slow connection or a genuine bug is visible on-page, not just
 * silent in devtools.
 */

import { ASSETS } from './config.js';
import { GameEngine } from './engine.js';
import { initUI } from './ui.js';

const loadingScreen = document.getElementById('loading-screen');
const loadingLabel = document.getElementById('loading-label');
const loadingBarFill = document.getElementById('loading-bar-fill');

let loaded = 0;
let total = 0;

function bumpProgress() {
  loaded++;
  if (total > 0 && loadingBarFill) {
    const pct = Math.min(100, Math.round((loaded / total) * 100));
    loadingBarFill.style.width = `${pct}%`;
  }
}

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      bumpProgress();
      resolve(img);
    };
    img.onerror = () => {
      console.error('Missing asset:', src);
      bumpProgress();
      resolve(img); // never let one missing sprite block the whole game
    };
    img.src = src;
  });
}

function loadAnimation(def) {
  const frames = [];
  for (let i = 0; i < def.count; i++) {
    frames.push(loadImage(`${def.dir}/${def.prefix}_${i}.png`));
  }
  return Promise.all(frames);
}

function countTotalAssets() {
  let count = 1; // background
  for (const def of Object.values(ASSETS.player)) count += def.count;
  count += ASSETS.chickens.length;
  count += ASSETS.egg.frames.length;
  return count;
}

async function preload() {
  total = countTotalAssets();

  const [background, playerEntries, chickens, egg] = await Promise.all([
    loadImage(ASSETS.background),
    Promise.all(
      Object.entries(ASSETS.player).map(async ([name, def]) => [name, await loadAnimation(def)])
    ),
    Promise.all(ASSETS.chickens.map(loadImage)),
    Promise.all(ASSETS.egg.frames.map(loadImage))
  ]);

  return {
    background,
    player: Object.fromEntries(playerEntries),
    chickens,
    egg
  };
}

function hideLoadingScreen() {
  if (!loadingScreen) return;
  loadingScreen.classList.add('is-hidden');
  loadingScreen.addEventListener('transitionend', () => loadingScreen.remove(), { once: true });
}

function showFatalError(err) {
  console.error(err);
  if (loadingLabel) {
    loadingLabel.textContent = 'Не удалось запустить игру. Подробности — в консоли браузера (F12).';
  }
  if (loadingScreen) {
    loadingScreen.classList.remove('is-hidden');
    loadingScreen.classList.add('is-error');
  }
}

async function start() {
  try {
    const canvas = document.getElementById('game-canvas');
    const ui = document.getElementById('ui-root');

    if (!canvas || !ui) {
      throw new Error('Missing #game-canvas or #ui-root in index.html');
    }

    if (loadingLabel) loadingLabel.textContent = 'Loading assets...';
    const images = await preload();

    const engine = new GameEngine(canvas, images);
    initUI(engine, ui);
    engine.start();

    hideLoadingScreen();
  } catch (err) {
    showFatalError(err);
  }
}

start();
