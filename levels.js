/**
 * levels.js
 * Basket Bandit
 *
 * Difficulty curve, keyed by score threshold. This is the single
 * source of truth for pacing - engine.js reads it every frame via
 * getDifficultyForScore(). (config.js used to keep its own separate
 * copy of this data that nothing actually read - removed to avoid
 * two contradictory definitions.)
 */

const LEVELS = [
  { level: 1, scoreToReach: 0,    fallSpeed: 300, spawnInterval: 900 },
  { level: 2, scoreToReach: 250,  fallSpeed: 340, spawnInterval: 820 },
  { level: 3, scoreToReach: 600,  fallSpeed: 380, spawnInterval: 740 },
  { level: 4, scoreToReach: 1100, fallSpeed: 420, spawnInterval: 670 },
  { level: 5, scoreToReach: 1800, fallSpeed: 460, spawnInterval: 610 },
  { level: 6, scoreToReach: 2700, fallSpeed: 500, spawnInterval: 560 },
  { level: 7, scoreToReach: 3800, fallSpeed: 540, spawnInterval: 520 }
];

export function getDifficultyForScore(score) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (score >= level.scoreToReach) currentLevel = level;
  }
  return currentLevel;
}

export default LEVELS;
