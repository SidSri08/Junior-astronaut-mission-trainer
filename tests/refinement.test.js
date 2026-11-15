import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, createStore } from '../src/systems/GameState.js';
import { SCENARIOS } from '../src/data/scenarios.js';
import { traceCircuit, ROVER_MAP, moveRover, correctFilterOrder } from '../src/minigames/workshopModels.js';
import { createMinigameHost } from '../src/minigames/minigameHost.js';

test('A strategy can be chosen once, and an active run cannot be reset or replaced', () => {
  const store = createStore();
  store.dispatch({ type: 'applyScenarioDecision', scenarioId: 'siteSetup', choiceId: 'ridgePower' });
  const before = structuredClone(store.getState());
  store.dispatch({ type: 'applyScenarioDecision', scenarioId: 'siteSetup', choiceId: 'craterRim' });
  assert.deepEqual(store.getState().resources, before.resources);
  assert.equal(store.getState().campaign.decisionsMade.length, 1);
  assert.equal(store.dispatch({ type: 'startScenario', scenarioId: 'systemsBalance' }).code, 'RUN_IN_PROGRESS');
  store.dispatch({ type: 'startScenario', scenarioId: 'siteSetup' });
  assert.equal(store.getState().campaign.activeRun.runToken, before.campaign.activeRun.runToken);
});

test('Premature completion, unknown task, NaN and duplicate rewards are rejected without changing supplies', () => {
  const store = createStore();
  store.dispatch({ type: 'startScenario', scenarioId: 'systemsBalance' });
  assert.equal(store.dispatch({ type: 'finishScenarioRun' }).code, 'TASKS_INCOMPLETE');
  for (const payload of [{ gameId: 'unknown' }, { gameId: 'powerRouter', qualityScore: NaN }]) {
    const before = store.getState().resources;
    assert.equal(store.dispatch({ type: 'completeScenarioMiniGame', scenarioId: 'systemsBalance', ...payload }).ok, false);
    assert.deepEqual(store.getState().resources, before);
  }
  const result = { type: 'completeScenarioMiniGame', scenarioId: 'systemsBalance', gameId: 'leakHunter', success: true, qualityScore: 1, speedScore: 1 };
  store.dispatch(result);
  const before = store.getState();
  assert.equal(store.dispatch(result).code, 'TASK_ALREADY_RECORDED');
  assert.deepEqual(store.getState(), before);
});

test('Workshop outcomes grant actual supplies, earned XP and discoveries once per attempt', () => {
  const store = createStore();
  const result = { type: 'completeMinigame', gameId: 'waterPurifier', success: true, qualityScore: 1, attemptToken: 'attempt-a' };
  const water = store.getState().resources.water;
  store.dispatch(result);
  assert.equal(store.getState().resources.water, water + 12);
  assert.equal(store.getState().progression.xp, 55);
  assert.equal(store.getState().progression.stars, 3);
  const before = store.getState();
  assert.equal(store.dispatch(result).code, 'DUPLICATE_RESULT');
  assert.deepEqual(store.getState(), before);
  store.dispatch({ ...result, gameId: 'sampleAnalysis', attemptToken: 'attempt-b' });
  assert.ok(store.getState().progression.discoveries.includes('lunar-geologist'));
});

test('A campaign remains running beyond seven simulated days, then ends after five complete scenarios only', () => {
  const state = createInitialState();
  state.mission.status = 'running';
  state.mission.elapsed = 420;
  const store = createStore(state);
  store.dispatch({ type: 'startScenario', scenarioId: 'siteSetup' });
  store.step(0.5);
  assert.equal(store.getState().mission.status, 'running');
  for (let run = 0; run < 5; run++) {
    const id = store.getState().campaign.activeScenarioId;
    store.dispatch({ type: 'startScenario', scenarioId: id });
    for (const task of SCENARIOS[id].minigames) store.dispatch({ type: 'completeScenarioMiniGame', scenarioId: id, gameId: task.gameId, success: true, qualityScore: 1, speedScore: 1 });
  }
  assert.equal(store.getState().campaign.completedRuns, 5);
  assert.equal(store.getState().campaign.endingTriggered, true);
  assert.equal(store.dispatch({ type: 'startScenario' }).code, 'CAMPAIGN_ENDED');
  store.dispatch({ type: 'markEarthReturned' });
  assert.equal(store.getState().campaign.returnedToEarth, true);
});

test('Circuit has a complete route, broken rotations fail, and filtration has one valid sequence', () => {
  assert.equal(traceCircuit(Array(9).fill(0)).connected, true);
  const broken = Array(9).fill(0); broken[2] = 1;
  assert.equal(traceCircuit(broken).connected, false);
  assert.equal(correctFilterOrder(['screen', 'carbon', 'membrane', 'disinfect']), true);
  assert.equal(correctFilterOrder(['carbon', 'screen', 'membrane', 'disinfect']), false);
});

test('Every rover sample is reachable and a complete round trip fits the battery budget', () => {
  const queue = [[ROVER_MAP.base, 0, 0]];
  const visited = new Set();
  let shortest = null;
  while (queue.length) {
    const [position, collected, steps] = queue.shift();
    const sampleIndex = ROVER_MAP.samples.indexOf(position);
    const mask = sampleIndex < 0 ? collected : collected | (1 << sampleIndex);
    const key = `${position}:${mask}`;
    if (visited.has(key)) continue;
    visited.add(key);
    if (mask === 7 && position === ROVER_MAP.base) { shortest = steps; break; }
    for (const direction of ['north', 'east', 'south', 'west']) {
      const next = moveRover(position, direction, 48);
      if (next.moved) queue.push([next.position, mask, steps + 1]);
    }
  }
  assert.ok(shortest > 0 && shortest < 48);
  assert.deepEqual(moveRover(0, 'north', 48), { position: 0, battery: 48, moved: false });
});

test('Closing a task briefing abandons it without rewards or scenario progress', () => {
  const nodes = new Map();
  const container = { innerHTML: '', hidden: true, querySelector(selector) {
    if (!nodes.has(selector)) nodes.set(selector, { addEventListener(type, fn) { this[type] = fn; } });
    return nodes.get(selector);
  } };
  const store = createStore();
  store.dispatch({ type: 'startScenario', scenarioId: 'siteSetup' });
  const host = createMinigameHost({ container, store });
  const before = store.getState().resources;
  host.open('siteSelector', { scenarioMode: true, scenarioId: 'siteSetup' });
  nodes.get('[data-action="close"]').click();
  assert.deepEqual(store.getState().resources, before);
  assert.equal(Object.keys(store.getState().campaign.activeRun.miniGamesDone).length, 0);
  assert.equal(store.getState().progression.xp, 0);
  assert.equal(container.hidden, true);
});
