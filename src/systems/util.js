// C-S1 — shared helpers for the simulation (no DOM, no Three.js).

export const clamp = (v, min = 0, max = 100) => (Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min);

export function addLog(state, kind, text) {
  state.logSeq = (state.logSeq || 0) + 1;
  state.log.unshift({ id: state.logSeq, day: state.mission.day, kind, text });
  if (state.log.length > 40) state.log.length = 40;
}

/** Health → efficiency. Full power above 50 health, scales down below, 0 when broken. */
export function efficiency(health, brokenBelow) {
  if (health < brokenBelow) return 0;
  return health >= 50 ? 1 : health / 50;
}

export function isEventActive(state, eventId) {
  return state.activeEvents.some((e) => e.eventId === eventId && e.phase === 'active');
}

export function hasEvent(state, eventId) {
  return state.activeEvents.some((e) => e.eventId === eventId);
}

/** A module is "powered" when switched on, not broken and there is no blackout. */
export function isPowered(state, moduleId, B) {
  const m = state.modules[moduleId];
  return !!m && m.online && !state.power.brownout && m.health >= B.wear.brokenBelow;
}

