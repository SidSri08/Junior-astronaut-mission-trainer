// C-S2 — Mission Event System: schedules, triggers, progresses, and resolves events.
// Pure simulation logic (no DOM, no Three.js).

import { MISSION_EVENTS, EVENT_IDS } from '../data/missionEvents.js';
import { clamp, addLog, hasEvent } from './util.js';
import { nextRandom } from './rng.js';

export function applyEffects(state, effects) {
  if (!effects) return;
  if (effects.resources) {
    for (const [k, delta] of Object.entries(effects.resources)) {
      if (typeof state.resources[k] === 'number') {
        state.resources[k] = clamp(state.resources[k] + delta);
      }
    }
  }
  if (typeof effects.research === 'number') {
    state.resources.research = clamp(state.resources.research + effects.research);
  }
  if (typeof effects.solarDust === 'number') {
    state.modules.solar.dust = clamp(state.modules.solar.dust + effects.solarDust, 0, 0.9);
  }
  if (effects.modules) {
    for (const [modId, changes] of Object.entries(effects.modules)) {
      const m = state.modules[modId];
      if (!m) continue;
      if (typeof changes.health === 'number') {
        m.health = clamp(m.health + changes.health);
      }
      if (typeof changes.online === 'boolean') {
        m.online = changes.online;
      }
    }
  }
  if (effects.inventory) {
    for (const [k, delta] of Object.entries(effects.inventory)) {
      state.inventory[k] = Math.max(0, (state.inventory[k] || 0) + delta);
    }
  }
}

export function startEvent(state, eventId) {
  const def = MISSION_EVENTS[eventId];
  if (!def || hasEvent(state, eventId)) return null;

  state.eventSeq = (state.eventSeq || 0) + 1;
  const instanceId = `ev-${state.eventSeq}-${eventId}`;
  const hasWarning = typeof def.warningSeconds === 'number' && def.warningSeconds > 0;

  const inst = {
    instanceId,
    eventId,
    phase: hasWarning ? 'warning' : 'active',
    remaining: hasWarning ? def.warningSeconds : def.durationSeconds,
    startedAt: state.mission.elapsed,
    modifiers: def.modifiers ? { ...def.modifiers } : null,
    exposedSeconds: 0,
  };

  state.activeEvents.push(inst);

  if (def.onStart) {
    applyEffects(state, def.onStart);
  }

  addLog(state, def.kind || 'warn', `${def.icon} ${def.title}: ${def.kidText}`);

  if (Array.isArray(def.choices) && def.choices.length > 0 && !state.pendingDecision) {
    state.pendingDecision = { instanceId, eventId };
  }

  // Instant one-shot events with no ongoing duration and no choices resolve right away.
  if (!hasWarning && def.durationSeconds === undefined && (!def.choices || def.choices.length === 0) && !def.ongoing) {
    finishEventInstance(state, inst.instanceId, 'completed');
  }

  return inst;
}

export function finishEventInstance(state, instanceId, outcome = 'resolved') {
  const idx = state.activeEvents.findIndex((e) => e.instanceId === instanceId);
  if (idx === -1) return false;
  const inst = state.activeEvents[idx];
  const def = MISSION_EVENTS[inst.eventId];

  // Track solar storm shelter success
  if (inst.eventId === 'solarStorm' && (inst.exposedSeconds || 0) < 4) {
    state.stats.stormsSheltered = (state.stats.stormsSheltered || 0) + 1;
    addLog(state, 'good', '🛡️ Solar storm passed! The crew stayed safe inside the shelter.');
  } else if (inst.eventId === 'solarStorm') {
    addLog(state, 'warn', '☀️ Solar storm ended. Next time, shelter the crew sooner to block radiation.');
  } else if (inst.eventId === 'longShadow') {
    addLog(state, 'good', '☀️ Sunlight returned! Solar panels are generating power again.');
  }

  state.activeEvents.splice(idx, 1);
  if (state.pendingDecision && state.pendingDecision.instanceId === instanceId) {
    state.pendingDecision = null;
  }

  state.eventHistory.push({
    eventId: inst.eventId,
    day: state.mission.day,
    outcome,
  });

  // Queue another pending decision if any other active event has unresolved choices
  if (!state.pendingDecision) {
    for (const other of state.activeEvents) {
      const oDef = MISSION_EVENTS[other.eventId];
      if (oDef && Array.isArray(oDef.choices) && oDef.choices.length > 0) {
        state.pendingDecision = { instanceId: other.instanceId, eventId: other.eventId };
        break;
      }
    }
  }

  return true;
}

export function finishEventsByType(state, eventId, outcome = 'resolved') {
  const matching = state.activeEvents.filter((e) => e.eventId === eventId);
  for (const inst of matching) {
    finishEventInstance(state, inst.instanceId, outcome);
  }
  return matching.length > 0;
}

export function resolveEventDecision(state, instanceId, choiceId) {
  const inst = state.activeEvents.find((e) => e.instanceId === instanceId);
  if (!inst) return { ok: false, code: 'NO_SUCH_EVENT', message: 'That event is already over.' };

  const def = MISSION_EVENTS[inst.eventId];
  const choice = def?.choices?.find((c) => c.id === choiceId);
  if (!choice) return { ok: false, code: 'INVALID_CHOICE', message: 'Invalid decision choice.' };

  if (choice.cost) {
    if (typeof choice.cost.repairKits === 'number' && state.inventory.repairKits < choice.cost.repairKits) {
      return { ok: false, code: 'NO_KITS', message: 'Not enough repair kits!' };
    }
    if (typeof choice.cost.battery === 'number' && state.resources.battery < choice.cost.battery) {
      return { ok: false, code: 'LOW_BATTERY', message: 'Not enough battery power!' };
    }
    if (typeof choice.cost.repairKits === 'number') {
      state.inventory.repairKits -= choice.cost.repairKits;
    }
    if (typeof choice.cost.battery === 'number') {
      state.resources.battery = clamp(state.resources.battery - choice.cost.battery);
    }
  }

  if (choice.effects) {
    applyEffects(state, choice.effects);
  }

  addLog(state, 'info', `👉 Decision (${def.title}): ${choice.label}`);

  if (choice.resolves) {
    finishEventInstance(state, instanceId, choice.id);
  } else if (state.pendingDecision && state.pendingDecision.instanceId === instanceId) {
    state.pendingDecision = null;
  }

  return {
    ok: true,
    code: 'DECISION_APPLIED',
    message: `${choice.label}`,
    opensMinigame: choice.opensMinigame || null,
  };
}

function pickRandomEvent(state) {
  const day = state.mission.day;
  const candidates = [];
  let totalWeight = 0;

  for (const id of EVENT_IDS) {
    const def = MISSION_EVENTS[id];
    if (!def.random) continue;
    if (day < (def.random.minDay || 1)) continue;
    if (hasEvent(state, id)) continue;
    // Avoid firing the same scheduled event on its own scheduled day twice
    if (def.schedule && def.schedule.day === day) continue;
    candidates.push({ id, weight: def.random.weight || 1 });
    totalWeight += def.random.weight || 1;
  }

  if (candidates.length === 0 || totalWeight <= 0) return null;
  let roll = nextRandom(state) * totalWeight;
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) return c.id;
  }
  return candidates[candidates.length - 1].id;
}

export function tickMissionEvents(state, dt, B) {
  const { day, timeOfDay } = state.mission;

  // 1. Scheduled events
  for (const id of EVENT_IDS) {
    const def = MISSION_EVENTS[id];
    if (!def.schedule) continue;
    if (def.schedule.day === day && timeOfDay >= def.schedule.at && !state.firedScheduled.includes(id)) {
      state.firedScheduled.push(id);
      startEvent(state, id);
    }
  }

  // 2. One random event check per mission day around mid-day (timeOfDay >= 0.55)
  const randTag = `rand-day-${day}`;
  if (day >= B.events.firstRandomDay && timeOfDay >= 0.55 && !state.firedScheduled.includes(randTag)) {
    state.firedScheduled.push(randTag);
    if (nextRandom(state) < B.events.randomChancePerDay && state.activeEvents.length < 2) {
      const picked = pickRandomEvent(state);
      if (picked) startEvent(state, picked);
    }
  }

  // 3. Advance active events & apply ongoing effects
  for (const inst of [...state.activeEvents]) {
    const def = MISSION_EVENTS[inst.eventId];
    if (!def) continue;

    if (inst.phase === 'warning') {
      inst.remaining -= dt;
      if (inst.remaining <= 0) {
        inst.phase = 'active';
        inst.remaining = def.durationSeconds ?? null;
        if (inst.eventId === 'solarStorm') {
          addLog(state, 'bad', '☢️ Solar storm has arrived! Keep the crew in the shelter until it passes.');
        } else if (inst.eventId === 'longShadow') {
          addLog(state, 'warn', '🌑 Mountain shadow is now covering the solar array. Running on battery!');
        }
      }
      continue;
    }

    // Active phase ongoing effects
    if (def.ongoing?.perSecond) {
      const scale = inst.effectScale ?? 1;
      for (const [resKey, rate] of Object.entries(def.ongoing.perSecond)) {
        if (typeof state.resources[resKey] === 'number') {
          state.resources[resKey] = clamp(state.resources[resKey] + rate * scale * dt);
        }
      }
    }

    if (typeof inst.remaining === 'number') {
      inst.remaining -= dt;
      if (inst.remaining <= 0) {
        finishEventInstance(state, inst.instanceId, 'expired');
      }
    }
  }
}

