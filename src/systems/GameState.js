// C-S1 — Canonical GameState factory and store (single source of truth).

import { BALANCE } from '../data/gameBalance.js';
import { createProgression, recordTaskAchievement } from './ProgressionSystem.js';
import { createInitialCampaignState } from './CampaignSystem.js';
import { computePower } from './PowerSystem.js';
import { advanceSimulationStep, applyPlayerAction } from './ResourceSystem.js';

function deepCloneAndFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const copy = Array.isArray(obj) ? obj.map(deepCloneAndFreeze) : {};
  if (!Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      copy[k] = deepCloneAndFreeze(v);
    }
  }
  return Object.freeze(copy);
}

export function createInitialState({ seed = 20261114 } = {}) {
  const s = BALANCE.start;
  const state = {
    schemaVersion: 1,
    seed: seed >>> 0,
    rngState: seed >>> 0,
    eventSeq: 0,
    logSeq: 1,
    mission: {
      status: 'intro', // 'intro' | 'running' | 'won' | 'lost'
      tick: 0,
      elapsed: 0,
      day: 1,
      timeOfDay: 0,
      isDaylight: true,
      speed: 1,
      inMinigame: false,
      tutorialDone: false,
      outcomeReason: null,
      stars: 0,
    },
    resources: {
      oxygen: s.oxygen,
      water: s.water,
      food: s.food,
      battery: s.battery,
      research: s.research,
    },
    power: {
      generation: 0,
      consumption: 0,
      net: 0,
      brownout: false,
    },
    crew: {
      count: BALANCE.crew.count,
      health: s.crewHealth,
      radiationDose: 0,
      sheltered: false,
    },
    modules: {
      habitat: { health: s.moduleHealth, online: true },
      lifeSupport: { health: s.moduleHealth, online: true },
      solar: {
        health: s.moduleHealth,
        online: true,
        dust: s.solarDust,
        alignment: s.solarAlignment,
      },
      greenhouse: {
        health: s.moduleHealth,
        online: true,
        planted: true,
        growth: 25,
      },
      lab: { health: s.moduleHealth, online: true },
      comms: { health: s.moduleHealth, online: true, signalQuality: 1 },
    },
    settings: {
      muted: false,
      volume: 0.75,
      reducedMotion: false,
      lowQuality: false,
      captionsEnabled: true,
    },
    cinematics: {
      active: 'none',
      stage: 'idle',
      label: '',
      title: '',
      subtitle: '',
      progress: 0,
      skipped: false,
      replayRequested: false,
      setupComplete: false,
      caption: '',
      landingSeen: false,
    },
    campaign: createInitialCampaignState(),
    progression: createProgression(),
    story: { seen: [] },
    shieldLevel: 0,
    inventory: {
      repairKits: s.repairKits,
    },
    cooldowns: {
      collectIce: 0,
      buildShielding: 0,
      cleanPanels: 0,
    },
    activeEvents: [],
    pendingDecision: null,
    firedScheduled: [],
    eventHistory: [],
    objectives: {},
    stats: {
      harvests: 0,
      experimentsTime: 0,
      stormsSheltered: 0,
      repairs: 0,
      minigameWins: {
        leakHunter: 0,
        solarAligner: 0,
      },
    },
    log: [
      {
        id: 1,
        day: 1,
        kind: 'info',
        text: '🌕 Welcome to Artemis South Pole Outpost! Click buildings or use the controls to manage your base.',
      },
    ],
  };

  const p = computePower(state, BALANCE);
  state.power.generation = Math.round(p.generation * 10) / 10;
  state.power.consumption = p.consumption;
  state.power.net = Math.round(p.net * 10) / 10;

  return state;
}

export function createStore(initialState = createInitialState()) {
  let state = structuredClone(initialState);
  let snapshot = deepCloneAndFreeze(state);
  const listeners = new Set();

  function notify(change) {
    snapshot = deepCloneAndFreeze(state);
    for (const fn of listeners) {
      fn(snapshot, change);
    }
  }

  return {
    getState() {
      return snapshot;
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    dispatch(action) {
      const result = applyPlayerAction(state, action, BALANCE);
      if (result.ok) {
        if (['completeMinigame', 'completeScenarioMiniGame'].includes(action.type) && !action.cancelled) {
          const token = action.attemptToken || `${state.campaign?.activeRun?.runToken}:${action.gameId}`;
          recordTaskAchievement(state, action, token);
        }
        notify({ type: 'action', action, result });
      }
      return result;
    },
    step(dtSimSeconds = BALANCE.time.stepSeconds) {
      const beforeTick = state.mission.tick;
      advanceSimulationStep(state, dtSimSeconds, BALANCE);
      if (state.mission.tick !== beforeTick) {
        notify({ type: 'step', dt: dtSimSeconds });
      }
    },
    replaceState(nextState) {
      state = structuredClone(nextState);
      notify({ type: 'replace' });
    },
  };
}

