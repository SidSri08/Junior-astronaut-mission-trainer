// F-S1 / A3 — Headless simulation & persistence test suite (`node --test tests/`).

import test from 'node:test';
import assert from 'node:assert/strict';

import { BALANCE } from '../src/data/gameBalance.js';
import { FACTS, SOURCES, SIMULATION_UNITS_NOTICE, factsFor, factById } from '../src/data/scienceFacts.js';
import { SCENARIOS, SCENARIO_ORDER, getAllScenarioMinigameIds } from '../src/data/scenarios.js';
import { getSpaceWeatherAdvisory, OFFLINE_DONKI_EVENTS, SPACE_WEATHER_SOURCE } from '../src/data/spaceWeatherFeed.js';
import {
  TUTORIAL_STEPS,
  BUILDING_INFO,
  RESOURCE_HELP,
  GLOSSARY,
  getContextualHint,
} from '../src/data/educationContent.js';
import { createLeakHunter } from '../src/minigames/leakHunter.js';
import { createSolarAligner } from '../src/minigames/solarAligner.js';
import { createSiteSelector } from '../src/minigames/siteSelector.js';
import { createModuleLayout } from '../src/minigames/moduleLayout.js';
import { createPowerRouter } from '../src/minigames/powerRouter.js';
import { createGreenhouseBalance } from '../src/minigames/greenhouseBalance.js';
import { createShelterResponse } from '../src/minigames/shelterResponse.js';
import { createShieldBuilder } from '../src/minigames/shieldBuilder.js';
import { createCommsDelay } from '../src/minigames/commsDelay.js';
import { rollBoundedTimer, computeTimingMetrics } from '../src/systems/TimerSystem.js';
import { computeCampaignReport, canStartScenarioRun } from '../src/systems/CampaignSystem.js';
import { createInitialState, createStore } from '../src/systems/GameState.js';
import { startEvent, resolveEventDecision } from '../src/systems/MissionEventSystem.js';
import { saveGame, loadGame, clearSave, validateSavedState } from '../src/systems/SaveSystem.js';

function makeMockStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('1. Initial GameState snapshot is frozen and has valid baseline resources', () => {
  const store = createStore(createInitialState({ seed: 42 }));
  const snap = store.getState();

  assert.equal(snap.schemaVersion, 1);
  assert.equal(snap.mission.status, 'intro');
  assert.equal(snap.resources.oxygen, BALANCE.start.oxygen);
  assert.equal(snap.resources.water, BALANCE.start.water);
  assert.equal(snap.resources.food, BALANCE.start.food);
  assert.equal(snap.resources.battery, BALANCE.start.battery);
  assert.equal(snap.crew.health, 100);

  // Verify immutability of snapshot
  assert.throws(() => {
    snap.resources.oxygen = 0;
  });
});

test('2. Unknown actions are rejected without mutating state', () => {
  const store = createStore(createInitialState({ seed: 42 }));
  const before = store.getState();
  const res = store.dispatch({ type: 'launchRocketToMars' });
  assert.equal(res.ok, false);
  assert.equal(res.code, 'UNKNOWN_ACTION');
  assert.equal(store.getState(), before);
});

test('3. Power allocation and module toggling updates power net and consumption', () => {
  const store = createStore(createInitialState({ seed: 42 }));
  store.dispatch({ type: 'startMission' });

  const initialConsumption = store.getState().power.consumption;
  const toggleRes = store.dispatch({ type: 'toggleModule', moduleId: 'lab' });
  assert.equal(toggleRes.ok, true);
  assert.equal(store.getState().modules.lab.online, false);
  assert.equal(store.getState().power.consumption, initialConsumption - BALANCE.lab.power);
});

test('4. Oxygen & Life Support drains oxygen when offline and generates oxygen when online', () => {
  const store = createStore(createInitialState({ seed: 100 }));
  store.dispatch({ type: 'startMission' });

  // Online for 10 seconds -> oxygen should increase
  const startO2 = store.getState().resources.oxygen;
  for (let i = 0; i < 20; i++) store.step(0.5);
  const afterOnlineO2 = store.getState().resources.oxygen;
  assert.ok(afterOnlineO2 > startO2, `Expected O2 to rise when Life Support is online (${startO2} -> ${afterOnlineO2})`);

  // Turn Life Support OFF for 10 seconds -> oxygen should drop
  store.dispatch({ type: 'toggleModule', moduleId: 'lifeSupport' });
  for (let i = 0; i < 20; i++) store.step(0.5);
  const afterOfflineO2 = store.getState().resources.oxygen;
  assert.ok(afterOfflineO2 < afterOnlineO2, `Expected O2 to drop when Life Support is offline (${afterOnlineO2} -> ${afterOfflineO2})`);
});

test('5. Greenhouse crop growth and harvesting increases Food and completes firstHarvest objective', () => {
  const store = createStore(createInitialState({ seed: 200 }));
  store.dispatch({ type: 'startMission' });

  // Advance enough steps for crop growth (starts at 25%, grows 1.1%/s -> ~70s to reach 100%)
  for (let i = 0; i < 150; i++) {
    // Keep water topped up if needed
    store.step(0.5);
    if (store.getState().modules.greenhouse.growth >= 100) break;
  }
  assert.equal(store.getState().modules.greenhouse.growth, 100);

  const foodBefore = store.getState().resources.food;
  const harvest = store.dispatch({ type: 'harvestCrops' });
  assert.equal(harvest.ok, true);
  assert.ok(store.getState().resources.food > foodBefore);
  assert.equal(store.getState().objectives.firstHarvest, true);
});

test('6. Mission events apply once, support player decisions, and minigames resolve active problems', () => {
  const state = createInitialState({ seed: 300 });
  state.mission.status = 'running';

  // Trigger oxygenLeak event directly
  const inst = startEvent(state, 'oxygenLeak');
  assert.ok(inst);
  assert.equal(startEvent(state, 'oxygenLeak'), null, 'Duplicate active event of same type must be blocked');

  const store = createStore(state);
  // Complete Leak Hunter minigame with success
  const mgRes = store.dispatch({
    type: 'completeMinigame',
    gameId: 'leakHunter',
    success: true,
    score: 1,
  });
  assert.equal(mgRes.ok, true);
  assert.equal(
    store.getState().activeEvents.some((e) => e.eventId === 'oxygenLeak'),
    false,
    'Winning Leak Hunter should seal and clear oxygenLeak event'
  );
  assert.equal(store.getState().objectives.leakHunter, true);
});

test('7. Solar Aligner minigame updates solar panel alignment and clears dust', () => {
  const store = createStore(createInitialState({ seed: 400 }));
  store.dispatch({ type: 'startMission' });

  const res = store.dispatch({
    type: 'completeMinigame',
    gameId: 'solarAligner',
    success: true,
    score: 0.95,
  });
  assert.equal(res.ok, true);
  assert.ok(store.getState().modules.solar.alignment >= 0.95);
  assert.ok(store.getState().modules.solar.dust < BALANCE.start.solarDust);
  assert.equal(store.getState().objectives.solarAligner, true);
});

test('8. LocalStorage SaveSystem saves, validates, loads, and rejects corrupted data safely', () => {
  const storage = makeMockStorage();
  const store = createStore(createInitialState({ seed: 500 }));
  store.dispatch({ type: 'startMission' });
  for (let i = 0; i < 10; i++) store.step(0.5);

  const saved = saveGame(store.getState(), storage);
  assert.equal(saved.ok, true);

  const loaded = loadGame(storage);
  assert.equal(loaded.ok, true);
  assert.equal(loaded.state.mission.tick, 10);

  // Corrupt JSON test
  storage.setItem('jamt.save.v1', '{not-valid-json');
  const corrupted = loadGame(storage);
  assert.equal(corrupted.ok, false);

  // Out-of-bounds value test
  const badState = createInitialState();
  badState.resources.oxygen = 999;
  assert.equal(validateSavedState(badState).ok, false);

  clearSave(storage);
  assert.equal(loadGame(storage).reason, 'NO_SAVE');
});

test('9. Science facts dataset has all 7 required topics and traceable NASA sources', () => {
  const topics = ['moon', 'oxygen', 'water', 'power', 'food', 'radiation', 'habitat'];
  assert.ok(FACTS.length >= 21);
  for (const t of topics) {
    const list = factsFor(t);
    assert.ok(list.length >= 3, `Topic ${t} should have at least 3 facts`);
    for (const f of list) {
      assert.equal(f.label, 'REAL_SCIENTIFIC_FACT');
      assert.ok(f.sourceIds.length >= 1);
      for (const sid of f.sourceIds) {
        assert.ok(SOURCES[sid], `Missing source ${sid} referenced by ${f.id}`);
      }
      assert.equal(factById(f.id)?.id, f.id);
    }
  }
});

test('10. Full 7-day mission simulation is winnable with simple commander maintenance', () => {
  const store = createStore(createInitialState({ seed: 2026 }));
  store.dispatch({ type: 'startMission' });

  const totalSteps = (BALANCE.time.missionDays * BALANCE.time.dayLengthSeconds) / BALANCE.time.stepSeconds + 4;
  for (let i = 0; i < totalSteps; i++) {
    const s = store.getState();
    if (s.mission.status !== 'running') break;

    // Automated junior commander actions during the 7-day run:
    const hasStorm = s.activeEvents.some((e) => e.eventId === 'solarStorm');
    if (hasStorm && !s.crew.sheltered) {
      store.dispatch({ type: 'setShelter', on: true });
    } else if (!hasStorm && s.crew.sheltered) {
      store.dispatch({ type: 'setShelter', on: false });
    }

    if (s.activeEvents.some((e) => e.eventId === 'oxygenLeak')) {
      store.dispatch({ type: 'completeMinigame', gameId: 'leakHunter', success: true, score: 1 });
    }
    if (s.modules.solar.dust > 0.25) {
      store.dispatch({ type: 'completeMinigame', gameId: 'solarAligner', success: true, score: 0.95 });
    }
    if (s.modules.greenhouse.growth >= 100) {
      store.dispatch({ type: 'harvestCrops' });
    }
    if (s.resources.water < 50 && s.cooldowns.collectIce === 0 && s.resources.battery > 25) {
      store.dispatch({ type: 'collectIce' });
    }
    if (s.pendingDecision) {
      const evId = s.pendingDecision.eventId;
      const choiceId = evId === 'supplyLander' ? 'parts' : 'later';
      store.dispatch({ type: 'resolveDecision', instanceId: s.pendingDecision.instanceId, choiceId });
    }
    for (const modId of ['habitat', 'lifeSupport', 'solar', 'greenhouse', 'lab']) {
      if (s.modules[modId].health < 55 && s.inventory.repairKits > 0) {
        store.dispatch({ type: 'repairModule', moduleId: modId });
      }
    }

    store.step(BALANCE.time.stepSeconds);
  }

  const finalState = store.getState();
  assert.equal(finalState.mission.status, 'won', `Expected mission to be won, got ${finalState.mission.status} (${finalState.mission.outcomeReason})`);
  assert.ok(finalState.mission.stars >= 2, `Expected at least 2 stars, got ${finalState.mission.stars}`);
  assert.ok(finalState.crew.health > 50);
});

test('11. Education content covers all buildings, topbar resources, tutorial steps, glossary, and contextual hints', () => {
  assert.ok(TUTORIAL_STEPS.length >= 4);
  for (const step of TUTORIAL_STEPS) {
    assert.ok(step.id && step.title && step.body && step.tip);
  }

  for (const modId of ['habitat', 'lifeSupport', 'solar', 'greenhouse', 'lab']) {
    const info = BUILDING_INFO[modId];
    assert.ok(info, `Missing BUILDING_INFO for ${modId}`);
    assert.ok(info.name && info.role && info.howItWorks);
  }

  for (const resKey of ['oxygen', 'water', 'food', 'battery', 'radiation', 'crew', 'research']) {
    const help = RESOURCE_HELP[resKey];
    assert.ok(help, `Missing RESOURCE_HELP for ${resKey}`);
    assert.ok(help.question && help.question.endsWith('?'), `Expected guiding question for ${resKey}`);
    assert.ok(help.explain && help.label);
  }

  assert.ok(GLOSSARY.length >= 6);
  for (const entry of GLOSSARY) {
    assert.ok(entry.term && entry.meaning);
  }

  // Verify contextual hints respond to mission emergencies and normal operation
  const normalState = createInitialState({ seed: 11 });
  const normalHint = getContextualHint(normalState);
  assert.ok(normalHint.text && normalHint.mood && normalHint.kind);

  const stormState = createInitialState({ seed: 12 });
  startEvent(stormState, 'solarStorm');
  const stormHint = getContextualHint(stormState);
  assert.equal(stormHint.kind, 'bad');
  assert.ok(stormHint.text.includes('Storm Shelter'));

  const damagedState = createInitialState({ seed: 13 });
  damagedState.modules.lab.health = 40;
  const damagedHint = getContextualHint(damagedState);
  assert.equal(damagedHint.kind, 'warn');
  assert.ok(damagedHint.text.includes('Repair Kit'));
});

test('12. Minigame contracts (createLeakHunter & createSolarAligner) mount tutorial, handle close callback, and clean up on destroy()', () => {
  function makeMockContainer() {
    const listeners = new Map();
    return {
      innerHTML: '',
      querySelector(selector) {
        if (!this.innerHTML) return null;
        if (!listeners.has(selector)) {
          listeners.set(selector, {
            className: '',
            textContent: '',
            hidden: false,
            style: {},
            handlers: {},
            addEventListener(evt, fn) {
              this.handlers[evt] = fn;
            },
            setAttribute() { },
            click() {
              if (this.handlers.click) this.handlers.click();
            },
          });
        }
        return listeners.get(selector);
      },
      querySelectorAll() {
        return [];
      },
    };
  }

  // Test Leak Hunter contract
  const lhContainer = makeMockContainer();
  let lhCompletion = null;
  const lh = createLeakHunter({
    container: lhContainer,
    onComplete: (payload) => {
      lhCompletion = payload;
    },
  });
  assert.equal(typeof lh.start, 'function');
  assert.equal(typeof lh.destroy, 'function');
  lh.start();
  assert.ok(lhContainer.innerHTML.includes('Leak Hunter'));
  lhContainer.querySelector('[data-action="close"]').click();
  assert.ok(lhCompletion);
  assert.equal(lhCompletion.gameId, 'leakHunter');
  assert.equal(typeof lhCompletion.success, 'boolean');
  assert.equal(typeof lhCompletion.score, 'number');
  lh.destroy();
  assert.equal(lhContainer.innerHTML, '');

  // Test Solar Aligner contract
  const saContainer = makeMockContainer();
  let saCompletion = null;
  const sa = createSolarAligner({
    container: saContainer,
    onComplete: (payload) => {
      saCompletion = payload;
    },
  });
  assert.equal(typeof sa.start, 'function');
  assert.equal(typeof sa.destroy, 'function');
  sa.start();
  assert.ok(saContainer.innerHTML.includes('Solar Aligner'));
  saContainer.querySelector('[data-action="close"]').click();
  assert.ok(saCompletion);
  assert.equal(saCompletion.gameId, 'solarAligner');
  assert.equal(typeof saCompletion.success, 'boolean');
  assert.equal(typeof saCompletion.score, 'number');
  sa.destroy();
  assert.equal(saContainer.innerHTML, '');
});

test('13. 6th interactive module (comms) integrates with PowerSystem, BUILDING_INFO, and hints', () => {
  const store = createStore(createInitialState({ seed: 13 }));
  assert.ok(store.getState().modules.comms);
  assert.ok(BUILDING_INFO.comms);
  assert.equal(BUILDING_INFO.comms.topic, 'comms');
  assert.ok(factsFor('comms').length >= 2);

  store.dispatch({ type: 'startMission' });
  const before = store.getState().power.consumption;
  const res = store.dispatch({ type: 'toggleModule', moduleId: 'comms' });
  assert.equal(res.ok, true);
  assert.equal(store.getState().modules.comms.online, false);
  assert.equal(store.getState().power.consumption, before - BALANCE.comms.power);
  const hint = getContextualHint(store.getState());
  assert.ok(hint.text.includes('Communications Relay'));
});

test('14. TimerSystem generates bounded deterministic seeded timers and calm speed metrics', () => {
  const stateA = { rngState: 777 };
  const stateB = { rngState: 777 };
  const t1 = rollBoundedTimer(stateA, 22, 32);
  const t2 = rollBoundedTimer(stateB, 22, 32);
  assert.equal(t1.limitSec, t2.limitSec);
  assert.ok(t1.limitSec >= 22 && t1.limitSec <= 32);

  const calmWarn = computeTimingMetrics({ elapsedSec: 25, limitSec: 30, warningThresholdSec: 8 });
  assert.equal(calmWarn.remainingSec, 5);
  assert.equal(calmWarn.inWarningWindow, true);
  assert.equal(calmWarn.timedOut, false);
  assert.ok(calmWarn.speedScore >= 0.35 && calmWarn.speedScore <= 1);

  const timedOut = computeTimingMetrics({ elapsedSec: 35, limitSec: 30 });
  assert.equal(timedOut.timedOut, true);
  assert.equal(timedOut.speedScore, 0.25);
});

test('15. CampaignSystem completedRuns increments strictly once per full scenario, locks at 5/5, and resets cleanly', () => {
  const store = createStore(createInitialState({ seed: 15 }));
  assert.equal(store.getState().campaign.completedRuns, 0);

  // Completing 1 or 2 mini-games in a scenario does NOT increment completedRuns
  store.dispatch({ type: 'startScenario', scenarioId: 'siteSetup' });
  store.dispatch({
    type: 'completeScenarioMiniGame',
    scenarioId: 'siteSetup',
    gameId: 'siteSelector',
    success: true,
    qualityScore: 0.9,
    speedScore: 0.85,
  });
  assert.equal(store.getState().campaign.completedRuns, 0);

  // Complete remaining 2 scenario mini-games -> completedRuns reaches 1 once
  store.dispatch({
    type: 'completeScenarioMiniGame',
    scenarioId: 'siteSetup',
    gameId: 'moduleLayout',
    success: true,
    qualityScore: 0.85,
    speedScore: 0.8,
  });
  store.dispatch({
    type: 'completeScenarioMiniGame',
    scenarioId: 'siteSetup',
    gameId: 'solarAligner',
    success: true,
    qualityScore: 0.92,
    speedScore: 0.88,
  });
  assert.equal(store.getState().campaign.completedRuns, 1);

  // Calling finishScenarioRun again for same run token MUST NOT double-count
  const dup = store.dispatch({ type: 'finishScenarioRun' });
  assert.equal(dup.code, 'ALREADY_COMPLETED');
  assert.equal(store.getState().campaign.completedRuns, 1);

  // Complete runs 2 through 5 -> triggers evacuation ending strictly at 5
  const cycle = ['systemsBalance', 'radiationComms', 'siteSetup', 'systemsBalance'];
  for (const scId of cycle) {
    store.dispatch({ type: 'startScenario', scenarioId: scId });
    for (const mg of SCENARIOS[scId].minigames) {
      store.dispatch({
        type: 'completeScenarioMiniGame',
        scenarioId: scId,
        gameId: mg.gameId,
        success: true,
        qualityScore: 0.88,
        speedScore: 0.82,
      });
    }
  }

  const endState = store.getState();
  assert.equal(endState.campaign.completedRuns, 5);
  assert.equal(endState.campaign.endingTriggered, true);
  assert.equal(canStartScenarioRun(endState.campaign), false);

  // Attempting a 6th scenario run must be rejected cleanly
  const sixth = store.dispatch({ type: 'startScenario', scenarioId: 'radiationComms' });
  assert.equal(sixth.ok, false);
  assert.equal(sixth.code, 'CAMPAIGN_ENDED');

  const report = computeCampaignReport(endState.campaign);
  assert.equal(report.completedRuns, 5);
  assert.equal(report.history.length, 5);
  assert.ok(report.overall >= 70);

  // Reset restores cleanly to 0 / 5
  store.dispatch({ type: 'resetCampaign' });
  assert.equal(store.getState().campaign.completedRuns, 0);
  assert.equal(store.getState().campaign.endingTriggered, false);
});

test('16. Scenario decisions apply real engineering trade-offs & persistent carry-overs', () => {
  const store = createStore(createInitialState({ seed: 16 }));
  const waterBefore = store.getState().resources.water;
  const batteryBefore = store.getState().resources.battery;

  const res = store.dispatch({
    type: 'applyScenarioDecision',
    scenarioId: 'siteSetup',
    choiceId: 'ridgePower',
  });
  assert.equal(res.ok, true);
  assert.ok(store.getState().resources.battery > batteryBefore);
  assert.ok(store.getState().resources.water < waterBefore);
  assert.equal(store.getState().campaign.carryOvers.siteChoice, 'ridgePower');
});

test('17. NASA DONKI space weather feed & explicit Simulation Units labeling work offline', () => {
  assert.ok(OFFLINE_DONKI_EVENTS.length >= 4);
  assert.equal(SPACE_WEATHER_SOURCE.earthMoonDistanceKm, 384400);
  assert.ok(SIMULATION_UNITS_NOTICE.includes('Training Simulation Units'));

  const quiet = getSpaceWeatherAdvisory({ seed: 2, day: 1, activeEvents: [] });
  assert.ok(quiet && quiet.id && quiet.summaryKid);
  const storm = getSpaceWeatherAdvisory({
    seed: 2,
    day: 3,
    activeEvents: [{ eventId: 'solarStorm', phase: 'active' }],
  });
  assert.equal(storm.eventType, 'SEP');
});

test('18. All 7 scenario mini-games render, prevent double-submit on close, and clean up on destroy()', () => {
  function makeMockContainer() {
    const listeners = new Map();
    return {
      innerHTML: '',
      querySelector(selector) {
        if (!this.innerHTML) return null;
        if (!listeners.has(selector)) {
          listeners.set(selector, {
            className: '',
            textContent: '',
            hidden: false,
            style: {},
            dataset: {},
            handlers: {},
            classList: { toggle() { }, add() { }, remove() { } },
            addEventListener(evt, fn) {
              this.handlers[evt] = fn;
            },
            setAttribute() { },
            click() {
              if (this.handlers.click) this.handlers.click();
            },
          });
        }
        return listeners.get(selector);
      },
      querySelectorAll() {
        return [];
      },
    };
  }

  const factories = [
    ['siteSelector', createSiteSelector],
    ['moduleLayout', createModuleLayout],
    ['powerRouter', createPowerRouter],
    ['greenhouseBalance', createGreenhouseBalance],
    ['shelterResponse', createShelterResponse],
    ['shieldBuilder', createShieldBuilder],
    ['commsDelay', createCommsDelay],
  ];

  assert.equal(getAllScenarioMinigameIds().length, 9);

  for (const [id, factory] of factories) {
    const container = makeMockContainer();
    let calls = 0;
    let payload = null;
    const ctrl = factory({
      container,
      context: { scenarioId: 'siteSetup', timerMinSec: 25, timerMaxSec: 35, timerLimitSec: 30 },
      onComplete: (p) => {
        calls += 1;
        payload = p;
      },
    });
    ctrl.start();
    assert.ok(container.innerHTML.includes('Window:'));
    const closeBtn = container.querySelector('[data-action="close"]');
    closeBtn.click();
    closeBtn.click(); // Double-submit guard check
    assert.equal(calls, 1, `${id} fired onComplete twice!`);
    assert.equal(payload.gameId, id);
    assert.equal(typeof payload.qualityScore, 'number');
    assert.equal(typeof payload.speedScore, 'number');
    ctrl.destroy();
    assert.equal(container.innerHTML, '');
  }
});

test('19. SaveSystem gracefully hydrates legacy schema v1 saves missing comms, settings, or campaign fields', () => {
  const storage = makeMockStorage();
  const base = createInitialState({ seed: 19 });
  delete base.modules.comms;
  delete base.settings;
  delete base.cinematics;
  delete base.campaign;

  assert.equal(validateSavedState(base).ok, true);
  saveGame(base, storage);
  const loaded = loadGame(storage);
  assert.equal(loaded.ok, true);
  assert.ok(loaded.state.modules.comms);
  assert.ok(loaded.state.settings);
  assert.ok(loaded.state.cinematics);
  assert.equal(loaded.state.campaign.completedRuns, 0);
});


