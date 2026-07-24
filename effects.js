/**
 * effects.js
 * -----------------------------------------------------------------------
 * Lightweight, allocation-conscious visual effects: sparkle bursts on
 * catch, floating "+score" text, and a screen-shake helper used when the
 * wolf misses an egg. Pure canvas primitives, no images, so there is
 * nothing here to preload.
 * -----------------------------------------------------------------------
 */

let particles = [];
let popups = [];
let shakeTime = 0;
let shakeMagnitude = 0;

export function spawnBurst(x, y, color = '#ffe9a8', count = 10) {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 90 + Math.random() * 140;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 60,
      life: 0.5 + Math.random() * 0.3,
      age: 0,
      size: 3 + Math.random() * 4,
      color
    });
  }
}

export function spawnScorePopup(x, y, text, color = '#ffffff') {
  popups.push({ x, y, text, color, age: 0, life: 0.9 });
}

export function triggerShake(magnitude = 10, duration = 0.25) {
  shakeMagnitude = Math.max(shakeMagnitude, magnitude);
  shakeTime = Math.max(shakeTime, duration);
}

/** Returns a {x,y} offset to apply to the canvas context this frame. */
export function getShakeOffset(dt) {
  if (shakeTime <= 0) return { x: 0, y: 0 };
  shakeTime -= dt;
  const falloff = Math.max(0, shakeTime);
  const mag = shakeMagnitude * (falloff / (falloff + 0.1));
  if (shakeTime <= 0) shakeMagnitude = 0;
  return {
    x: (Math.random() * 2 - 1) * mag,
    y: (Math.random() * 2 - 1) * mag
  };
}

export function updateEffects(dt) {
  particles = particles.filter(p => {
    p.age += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt; // gravity
    return p.age < p.life;
  });
  popups = popups.filter(p => {
    p.age += dt;
    p.y -= 40 * dt;
    return p.age < p.life;
  });
}

export function drawEffects(ctx) {
  for (const p of particles) {
    const t = p.age / p.life;
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const p of popups) {
    const t = p.age / p.life;
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.fillStyle = p.color;
    ctx.font = 'bold 30px "Baloo 2", "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 4;
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
}

export function resetEffects() {
  particles = [];
  popups = [];
  shakeTime = 0;
  shakeMagnitude = 0;
}
