/**
 * storage.js
 * -----------------------------------------------------------------------
 * Thin, defensive wrapper around localStorage. All persistence in the game
 * goes through here so that:
 *   - a single try/catch guards against private-browsing / quota errors
 *   - keys are namespaced and versioned
 *   - callers always get sane defaults, even if storage is unavailable
 * -----------------------------------------------------------------------
 */
import { STORAGE_PREFIX, ACHIEVEMENTS } from './config.js';

const SCHEMA_VERSION = 2;

const DEFAULT_STATE = {
  version: SCHEMA_VERSION,
  bestScore: 0,
  totalCatches: 0,
  bestCombo: 0,
  unlockedLevels: [1],
  achievements: {},        // id -> timestamp unlocked
  settings: {
    muted: false,
    sfxVolume: 0.8
  },
  dailyChallenge: {
    dateKey: null,
    progress: 0,
    completed: false
  }
};

let memoryFallback = null; // used if localStorage is totally unavailable
let storageAvailable = true;

function testStorage() {
  try {
    const k = STORAGE_PREFIX + '__test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (err) {
    console.warn('[storage] localStorage unavailable, using in-memory fallback:', err.message);
    return false;
  }
}

storageAvailable = (typeof window !== 'undefined' && !!window.localStorage) ? testStorage() : false;

function key(name) {
  return `${STORAGE_PREFIX}${name}`;
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function readRaw() {
  if (!storageAvailable) {
    return memoryFallback ? structuredCloneSafe(memoryFallback) : structuredCloneSafe(DEFAULT_STATE);
  }
  try {
    const raw = window.localStorage.getItem(key('state'));
    if (!raw) return structuredCloneSafe(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    // shallow-merge with defaults so new fields introduced later don't crash old saves
    return { ...structuredCloneSafe(DEFAULT_STATE), ...parsed, settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) } };
  } catch (err) {
    console.warn('[storage] failed to read/parse saved state, resetting:', err.message);
    return structuredCloneSafe(DEFAULT_STATE);
  }
}

function writeRaw(state) {
  if (!storageAvailable) {
    memoryFallback = JSON.parse(JSON.stringify(state));
    return true;
  }
  try {
    window.localStorage.setItem(key('state'), JSON.stringify(state));
    return true;
  } catch (err) {
    console.warn('[storage] failed to write state:', err.message);
    return false;
  }
}

let cache = readRaw();

/** Read the full persisted state (already merged with defaults). */
export function getState() {
  return cache;
}

/** Persist a partial update, merged shallowly at the top level. */
export function updateState(partial) {
  cache = { ...cache, ...partial };
  writeRaw(cache);
  return cache;
}

/** Record the result of a finished run, updating best score and achievements. */
export function recordRunResult({ runScore, runLevel, catchesThisRun, bestComboThisRun, missesThisRun }) {
  const next = { ...cache };
  next.bestScore = Math.max(next.bestScore, runScore);
  next.totalCatches = (next.totalCatches || 0) + (catchesThisRun || 0);
  next.bestCombo = Math.max(next.bestCombo || 0, bestComboThisRun || 0);

  // unlock the highest level reached
  const unlocked = new Set(next.unlockedLevels || [1]);
  unlocked.add(runLevel);
  next.unlockedLevels = Array.from(unlocked).sort((a, b) => a - b);

  cache = next;
  writeRaw(cache);

  const statSnapshot = {
    runScore, runLevel, missesThisRun,
    totalCatches: next.totalCatches,
    bestCombo: next.bestCombo
  };
  const newlyUnlocked = checkAchievements(statSnapshot);
  return { state: cache, newlyUnlocked };
}

/** Compare current stats against ACHIEVEMENTS definitions, unlock any newly met. */
export function checkAchievements(statSnapshot) {
  const unlockedNow = [];
  const achievements = { ...(cache.achievements || {}) };
  for (const def of ACHIEVEMENTS) {
    if (achievements[def.id]) continue;
    try {
      if (def.check(statSnapshot)) {
        achievements[def.id] = Date.now();
        unlockedNow.push(def);
      }
    } catch (err) {
      // a malformed check() must never crash the game
      console.warn('[storage] achievement check failed for', def.id, err);
    }
  }
  if (unlockedNow.length) {
    cache = { ...cache, achievements };
    writeRaw(cache);
  }
  return unlockedNow;
}

export function isAchievementUnlocked(id) {
  return !!(cache.achievements || {})[id];
}

export function getSettings() {
  return cache.settings;
}

export function updateSettings(partial) {
  cache = { ...cache, settings: { ...cache.settings, ...partial } };
  writeRaw(cache);
  return cache.settings;
}

// ---------------------------------------------------------------------------
// Daily challenge persistence (see levels.js for the selection logic)
// ---------------------------------------------------------------------------
export function getDailyChallengeState() {
  return cache.dailyChallenge || structuredCloneSafe(DEFAULT_STATE.dailyChallenge);
}

export function setDailyChallengeState(partial) {
  cache = { ...cache, dailyChallenge: { ...getDailyChallengeState(), ...partial } };
  writeRaw(cache);
  return cache.dailyChallenge;
}

export function isStorageAvailable() {
  return storageAvailable;
}
