// C-S1 — LocalStorage persistence with schema versioning and defensive validation.

export const SAVE_KEY = 'jamt.save.v1';
export const SCHEMA_VERSION = 1;

function isFiniteBetween(v, min, max) {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

export function validateSavedState(data) {
  if (!data || typeof data !== 'object') {
    return { ok: false, reason: 'Save data is not an object.' };
  }
  if (data.schemaVersion !== SCHEMA_VERSION) {
    return { ok: false, reason: `Unsupported schemaVersion: ${data.schemaVersion}` };
  }
  if (!data.mission || !['intro', 'running', 'won', 'lost'].includes(data.mission.status)) {
    return { ok: false, reason: 'Invalid mission block.' };
  }
  if (!isFiniteBetween(data.mission.day, 1, 30) || !isFiniteBetween(data.mission.elapsed, 0, 100000)) {
    return { ok: false, reason: 'Invalid mission timer.' };
  }
  const r = data.resources;
  if (
    !r ||
    !isFiniteBetween(r.oxygen, 0, 100) ||
    !isFiniteBetween(r.water, 0, 100) ||
    !isFiniteBetween(r.food, 0, 100) ||
    !isFiniteBetween(r.battery, 0, 100) ||
    !isFiniteBetween(r.research, 0, 100)
  ) {
    return { ok: false, reason: 'Invalid resource levels.' };
  }
  if (!data.crew || !isFiniteBetween(data.crew.health, 0, 100) || !isFiniteBetween(data.crew.radiationDose, 0, 100)) {
    return { ok: false, reason: 'Invalid crew state.' };
  }
  if (!data.modules || !data.modules.habitat || !data.modules.lifeSupport || !data.modules.solar || !data.modules.greenhouse || !data.modules.lab) {
    return { ok: false, reason: 'Missing outpost modules.' };
  }
  return { ok: true };
}

export function saveGame(state, storage = globalThis.localStorage) {
  try {
    if (!storage || typeof storage.setItem !== 'function') {
      return { ok: false, code: 'NO_STORAGE', reason: 'localStorage is unavailable.' };
    }
    const payload = JSON.stringify({
      ...state,
      savedAt: Date.now(),
    });
    storage.setItem(SAVE_KEY, payload);
    return { ok: true, code: 'SAVED' };
  } catch (err) {
    return { ok: false, code: 'SAVE_ERROR', reason: err?.message || 'Storage error' };
  }
}

export function loadGame(storage = globalThis.localStorage) {
  try {
    if (!storage || typeof storage.getItem !== 'function') {
      return { ok: false, state: null, reason: 'localStorage is unavailable.' };
    }
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) {
      return { ok: false, state: null, reason: 'NO_SAVE' };
    }
    const parsed = JSON.parse(raw);
    const check = validateSavedState(parsed);
    if (!check.ok) {
      return { ok: false, state: null, reason: check.reason };
    }
    // Always clear transient minigame lock on reload so the player isn't stuck
    parsed.mission.inMinigame = false;
    return { ok: true, state: parsed };
  } catch (err) {
    return { ok: false, state: null, reason: err?.message || 'Corrupted JSON' };
  }
}

export function clearSave(storage = globalThis.localStorage) {
  try {
    if (storage && typeof storage.removeItem === 'function') {
      storage.removeItem(SAVE_KEY);
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

