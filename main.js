/**
 * main.js
 * -----------------------------------------------------------------------
 * Entry point. Preloads every image in config.ASSETS (showing progress on
 * the loading screen), then constructs the GameEngine and hands the
 * canvas + UI root over to ui.js. No game logic lives here - this file
 * is purely wiring + asset loading.
 * -----------------------------------------------------------------------
 */
import { ASSETS } from './config.js';
import { GameEngine } from './engine.js';
import { initUI } from './ui.js';

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(`[main] failed to load asset: ${src}`);
      resolve(img); // resolve anyway with an incomplete Image - draw calls
                    // guard on img.complete, so a single missing file
                    // never crashes the game or blocks the others.
    };
    img.src = src;
  });
}

async function loadFrameSet(def) {
  const promises = [];
  for (let i = 0; i < def.count; i++) {
    promises.push(loadImage(`${def.dir}/frame_${i}.png`));
  }
  return Promise.all(promises);
}

async function preloadAll(onProgress) {
  let loaded = 0;
  const totalSteps = 2 + Object.keys(ASSETS.player).length + ASSETS.chickens.length; // background + menuPortrait + player sets + chickens + egg(counts as one step)
  const bump = () => { loaded++; onProgress(loaded / (totalSteps + 1)); };

  const images = { player: {}, chickens: [], egg: [] };

  const bgP = loadImage(ASSETS.background).then(img => { images.background = img; bump(); });
  const portraitP = loadImage(ASSETS.menuPortrait).then(img => { images.menuPortrait = img; bump(); });

  const playerEntries = Object.entries(ASSETS.player);
  const playerPromises = playerEntries.map(([name, def]) =>
    loadFrameSet(def).then(frames => { images.player[name] = frames; bump(); })
  );

  const chickenPromises = ASSETS.chickens.map((src, i) =>
    loadImage(src).then(img => { images.chickens[i] = img; bump(); })
  );

  const eggP = loadFrameSet(ASSETS.egg).then(frames => { images.egg = frames; bump(); });

  await Promise.all([bgP, portraitP, ...playerPromises, ...chickenPromises, eggP]);
  onProgress(1);
  return images;
}

function setLoadingProgress(pct) {
  const bar = document.getElementById('loading-bar-fill');
  if (bar) bar.style.width = `${Math.round(pct * 100)}%`;
}

async function bootstrap() {
  const canvas = document.getElementById('game-canvas');
  const uiRoot = document.getElementById('ui-root');
  const loadingScreen = document.getElementById('loading-screen');

  let images;
  try {
    images = await preloadAll(setLoadingProgress);
  } catch (err) {
    console.error('[main] asset preload failed:', err);
    const label = document.getElementById('loading-label');
    if (label) label.textContent = 'Failed to load some assets. Please refresh.';
    return;
  }

  const engine = new GameEngine(canvas, images);
  initUI(engine, uiRoot);
  engine.start();

  if (loadingScreen) {
    loadingScreen.classList.add('loading-screen--done');
    setTimeout(() => loadingScreen.remove(), 400);
  }
}

// No console errors, no unhandled rejections escaping to the page.
window.addEventListener('unhandledrejection', (e) => {
  console.error('[main] unhandled promise rejection:', e.reason);
});

bootstrap();
