// Deterministic bounded-range timer utility for training mini-games.
// Uses the simulation's seeded PRNG (`nextRandom`) so timers never jump uncontrollably
// and always show a transparent `[minSec, maxSec]` range before a timed phase starts.

import { nextRandom } from './rng.js';

export function rollBoundedTimer(state, minSec, maxSec) {
  const lo = Math.max(5, Math.round(Math.min(minSec, maxSec)));
  const hi = Math.max(lo, Math.round(Math.max(minSec, maxSec)));
  const span = hi - lo + 1;
  const r = state && typeof state.rngState === 'number' ? nextRandom(state) : 0.5;
  const picked = lo + Math.min(span - 1, Math.floor(r * span));
  return {
    limitSec: picked,
    minSec: lo,
    maxSec: hi,
  };
}

export function formatTimerRange(minSec, maxSec) {
  const lo = Math.round(Math.min(minSec, maxSec));
  const hi = Math.round(Math.max(minSec, maxSec));
  return lo === hi ? `${lo}s` : `${lo}–${hi}s`;
}

export function computeTimingMetrics({ elapsedSec = 0, limitSec = 30, warningThresholdSec = 8 } = {}) {
  const safeLimit = Math.max(5, Number(limitSec) || 30);
  const safeElapsed = Math.max(0, Number(elapsedSec) || 0);
  const remainingSec = Math.max(0, Math.round((safeLimit - safeElapsed) * 10) / 10);
  const inWarningWindow = remainingSec > 0 && remainingSec <= warningThresholdSec;
  const timedOut = remainingSec <= 0;

  // Calm speed grading: full speed bonus if finished with >=35% clock left, gradual taper to 0.25 floor on timeout
  const ratioLeft = remainingSec / safeLimit;
  const speedScore = timedOut
    ? 0.25
    : Math.max(0.35, Math.min(1, 0.4 + (ratioLeft / 0.65) * 0.6));

  return {
    elapsedSec: Math.round(safeElapsed * 10) / 10,
    limitSec: safeLimit,
    remainingSec,
    inWarningWindow,
    timedOut,
    speedScore: Math.round(speedScore * 100) / 100,
  };
}

