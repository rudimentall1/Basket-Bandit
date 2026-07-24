/**
 * audio.js
 * -----------------------------------------------------------------------
 * NOTE ON ASSETS: no sound files were supplied alongside the art assets,
 * and the brief forbids inventing/using outside assets. Rather than ship
 * a silent game, this module generates small sound effects at runtime
 * using the Web Audio API (oscillators + gain envelopes). Nothing is
 * downloaded and nothing is pre-rendered - every "sound" here is a few
 * lines of synthesis. If real sound/music files are added later, drop
 * them in assets/audio/ and swap the bodies of the play* functions to
 * use an <audio>/AudioBufferSourceNode instead - the public API below
 * does not need to change.
 * -----------------------------------------------------------------------
 */
import { getSettings, updateSettings } from './storage.js';

let ctx = null;
let masterGain = null;
let unlocked = false;

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  masterGain = ctx.createGain();
  masterGain.gain.value = getSettings().muted ? 0 : getSettings().sfxVolume;
  masterGain.connect(ctx.destination);
  return ctx;
}

/** Must be called from within a user gesture (click/tap/keydown) to satisfy
 *  browser autoplay policies on iOS/Android/desktop alike. */
export function unlockAudio() {
  const c = ensureContext();
  if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  unlocked = true;
}

function tone({ freq = 440, duration = 0.15, type = 'sine', startGain = 0.5, glideTo = null, delay = 0 }) {
  const c = ensureContext();
  if (!c || getSettings().muted) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  const t0 = c.currentTime + delay;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + duration);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, startGain), t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

export function playCatch() {
  tone({ freq: 520, duration: 0.12, type: 'triangle', glideTo: 780, startGain: 0.35 });
}

/** A dropped/broken egg - short descending tone, distinct from a catch. */
export function playMiss() {
  tone({ freq: 220, duration: 0.28, type: 'sawtooth', glideTo: 60, startGain: 0.4 });
}

export function playCombo(step) {
  const base = 600 + Math.min(step, 8) * 60;
  tone({ freq: base, duration: 0.1, type: 'triangle', glideTo: base * 1.4, startGain: 0.3 });
}

export function playUiClick() {
  tone({ freq: 440, duration: 0.06, type: 'square', startGain: 0.2 });
}

export function playGameOver() {
  tone({ freq: 440, duration: 0.5, type: 'sine', glideTo: 110, startGain: 0.35 });
}

export function playVictoryFanfare() {
  [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, duration: 0.22, type: 'triangle', startGain: 0.3, delay: i * 0.11 }));
}

export function setMuted(muted) {
  updateSettings({ muted });
  if (masterGain) masterGain.gain.value = muted ? 0 : getSettings().sfxVolume;
}

export function isMuted() {
  return !!getSettings().muted;
}

export function setSfxVolume(vol) {
  updateSettings({ sfxVolume: vol });
  if (masterGain && !getSettings().muted) masterGain.gain.value = vol;
}
