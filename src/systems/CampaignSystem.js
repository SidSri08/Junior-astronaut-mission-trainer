// Campaign Engine managing the 3-Scenario x 3-Mini-Game loop,
// bounded decision consequences, carry-overs across runs, and strict 5-run evacuation ending.

import { BALANCE } from '../data/gameBalance.js';
import { SCENARIOS, SCENARIO_ORDER, getScenarioById } from '../data/scenarios.js';
import { rollBoundedTimer } from './TimerSystem.js';

function clamp(v, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v));
}

export function createInitialCampaignState() {
  return {
    completedRuns: 0,
    mode: false,
    returnedToEarth: false,
    totalRunsRequired: BALANCE.campaign.totalRunsRequired,
    activeScenarioId: SCENARIO_ORDER[0],
    activeRun: null,
    scenarioHistory: [],
    decisionsMade: [],
    carryOvers: {
      siteChoice: null,
      solarAlignmentBonus: 0,
      dustPenalty: 0,
      commsCalibration: 1,
      powerEfficiencyBonus: 0,
      shieldBonus: 0,
      waterBuffer: 0,
    },
    endingTriggered: false,
    completedRunTokens: [],
  };
}

export function canStartScenarioRun(campaign) {
  if (!campaign) return false;
  return !campaign.endingTriggered && campaign.completedRuns < campaign.totalRunsRequired;
}

export function applyCarryOversToBaseState(state) {
  const c = state.campaign?.carryOvers;
  if (!c) return;
  if (typeof c.solarAlignmentBonus === 'number' && c.solarAlignmentBonus !== 0) {
    state.modules.solar.alignment = clamp(state.modules.solar.alignment + c.solarAlignmentBonus, 0.45, 1);
  }
  if (typeof c.dustPenalty === 'number' && c.dustPenalty !== 0) {
    state.modules.solar.dust = clamp(state.modules.solar.dust + c.dustPenalty, 0, 0.85);
  }
  if (typeof c.commsCalibration === 'number' && state.modules.comms) {
    state.modules.comms.signalQuality = clamp(c.commsCalibration, 0.4, 1.25);
  }
  if (typeof c.waterBuffer === 'number' && c.waterBuffer !== 0) {
    state.resources.water = clamp(state.resources.water + c.waterBuffer, 15, 100);
  }
}

export function startScenarioRun(state, scenarioId) {
  if (scenarioId && !SCENARIOS[scenarioId]) return { ok: false, code: 'INVALID_SCENARIO', message: 'Choose a known scenario.' };
  if (!state.campaign) state.campaign = createInitialCampaignState();
  const c = state.campaign;
  if (c.activeRun?.status === 'active') {
    if (!scenarioId || scenarioId === c.activeRun.scenarioId) {
      return { ok: true, code: 'SCENARIO_RESUMED', message: 'Resuming your current mission.' };
    }
    return { ok: false, code: 'RUN_IN_PROGRESS', message: 'Finish the current scenario before choosing another.' };
  }
  if (!canStartScenarioRun(c)) {
    return {
      ok: false,
      code: 'CAMPAIGN_ENDED',
      message: 'All 5 mission training runs are complete! Evacuation & Earth Return is ready.',
    };
  }

  const sc = getScenarioById(scenarioId || c.activeScenarioId);
  const runNumber = c.completedRuns + 1;
  const runToken = `run-${runNumber}-${sc.id}-${c.scenarioHistory.length}`;

  // Pre-roll bounded timers deterministically for the scenario's 3 mini-games
  const timers = {};
  for (const mg of sc.minigames) {
    timers[mg.gameId] = rollBoundedTimer(state, mg.timerMinSec, mg.timerMaxSec);
  }

  c.activeScenarioId = sc.id;
  c.activeRun = {
    runToken,
    runNumber,
    scenarioId: sc.id,
    status: 'active', // 'active' -> 'result'
    decisionId: null,
    miniGamesDone: {},
    timers,
    totalQualityScore: 0,
    totalSpeedScore: 0,
    runCompletedLogged: false,
  };

  return {
    ok: true,
    code: 'SCENARIO_STARTED',
    message: `Started Run ${runNumber}/${c.totalRunsRequired}: ${sc.title}`,
    runToken,
  };
}

export function applyDecision(state, scenarioId, choiceId) {
  if (!state.campaign) state.campaign = createInitialCampaignState();
  const sc = getScenarioById(scenarioId);
  const choice = sc.strategyChoices.find((ch) => ch.id === choiceId);
  if (!choice) {
    return { ok: false, code: 'INVALID_CHOICE', message: 'Strategy choice not found.' };
  }

  // Ensure an active run exists for this scenario
  if (!state.campaign.activeRun || state.campaign.activeRun.scenarioId !== sc.id || state.campaign.activeRun.status !== 'active') {
    const startRes = startScenarioRun(state, sc.id);
    if (!startRes.ok) return startRes;
  }

  const run = state.campaign.activeRun;
  if (run.decisionId) {
    return { ok: true, code: 'DECISION_ALREADY_APPLIED', message: choice.label };
  }

  run.decisionId = choice.id;
  const fx = choice.effects || {};

  if (typeof fx.battery === 'number') state.resources.battery = clamp(state.resources.battery + fx.battery);
  if (typeof fx.water === 'number') state.resources.water = clamp(state.resources.water + fx.water);
  if (typeof fx.oxygen === 'number') state.resources.oxygen = clamp(state.resources.oxygen + fx.oxygen);
  if (typeof fx.food === 'number') state.resources.food = clamp(state.resources.food + fx.food);
  if (typeof fx.research === 'number') state.resources.research = clamp(state.resources.research + fx.research);
  if (typeof fx.repairKits === 'number' && state.inventory) {
    state.inventory.repairKits = Math.max(0, (state.inventory.repairKits || 0) + fx.repairKits);
  }
  if (typeof fx.dustDelta === 'number') state.modules.solar.dust = clamp(state.modules.solar.dust + fx.dustDelta, 0, 0.9);
  if (typeof fx.solarAlignmentBonus === 'number') {
    state.modules.solar.alignment = clamp(state.modules.solar.alignment + fx.solarAlignmentBonus, 0.45, 1);
    state.campaign.carryOvers.solarAlignmentBonus = Math.round((state.campaign.carryOvers.solarAlignmentBonus + fx.solarAlignmentBonus) * 100) / 100;
  }
  if (typeof fx.lifeSupportHealth === 'number') {
    state.modules.lifeSupport.health = clamp(state.modules.lifeSupport.health + fx.lifeSupportHealth, 15, 100);
  }
  if (typeof fx.shieldLevelDelta === 'number') {
    state.shieldLevel = clamp(state.shieldLevel + fx.shieldLevelDelta, 0, BALANCE.actions.shieldMax);
  }
  if (typeof fx.radiationShieldDelta === 'number') {
    state.crew.radiationDose = clamp(state.crew.radiationDose - fx.radiationShieldDelta);
  }
  if (typeof fx.commsCalibration === 'number' && state.modules.comms) {
    state.modules.comms.signalQuality = clamp((state.modules.comms.signalQuality || 1) + fx.commsCalibration, 0.5, 1.3);
    state.campaign.carryOvers.commsCalibration = state.modules.comms.signalQuality;
  }

  state.campaign.carryOvers.siteChoice = choice.id;
  state.campaign.decisionsMade.push({
    runNumber: run.runNumber,
    scenarioId: sc.id,
    choiceId: choice.id,
    label: choice.label,
    tradeoff: choice.tradeoff,
    recoveryNote: choice.recoveryNote,
  });

  if (Array.isArray(state.log)) {
    state.log.unshift({
      day: state.mission.day,
      kind: 'info',
      text: `🧭 Strategy Picked (${sc.shortTitle}): ${choice.label}. Trade-off: ${choice.tradeoff}`,
    });
    if (state.log.length > 40) state.log.length = 40;
  }

  return { ok: true, code: 'DECISION_APPLIED', message: choice.consequenceNote, choice };
}

export function resolveMiniGame(state, payload = {}) {
  if (!state.campaign) state.campaign = createInitialCampaignState();
  const c = state.campaign;
  if (!canStartScenarioRun(c)) {
    return { ok: false, code: 'CAMPAIGN_ENDED', message: 'Campaign already reached 5/5 runs.' };
  }

  const gameId = payload.gameId;
  const scenarioId = payload.scenarioId || c.activeScenarioId;
  if (!SCENARIOS[scenarioId]) return { ok: false, code: 'INVALID_SCENARIO', message: 'Unknown scenario result.' };
  const sc = getScenarioById(scenarioId);

  if (!sc.minigames.some((m) => m.gameId === gameId)) {
    return { ok: false, code: 'INVALID_GAME', message: 'This task does not belong to the scenario.' };
  }
  if ([payload.qualityScore, payload.speedScore, payload.score].some((v) => v !== undefined && !Number.isFinite(v))) {
    return { ok: false, code: 'INVALID_SCORE', message: 'Task scores must be finite numbers.' };
  }
  if (c.activeRun?.status === 'result' && c.activeRun.scenarioId === sc.id) {
    return { ok: false, code: 'RUN_ALREADY_COMPLETE', message: 'This run has already been recorded.' };
  }

  if (!c.activeRun || c.activeRun.scenarioId !== sc.id || c.activeRun.status !== 'active') {
    const startRes = startScenarioRun(state, sc.id);
    if (!startRes.ok) return startRes;
  }

  const run = c.activeRun;
  if (run.miniGamesDone[gameId]) {
    return { ok: false, code: 'TASK_ALREADY_RECORDED', message: 'This task already earned its reward for this run.' };
  }
  const qualityScore = clamp(Number(payload.qualityScore ?? payload.score ?? (payload.success ? 0.85 : 0.4)), 0, 1);
  const speedScore = clamp(Number(payload.speedScore ?? (payload.success ? 0.75 : 0.35)), 0, 1);
  const compositeScore = Math.round(
    (qualityScore * BALANCE.campaign.qualityWeight + speedScore * BALANCE.campaign.speedWeight) * 100
  ) / 100;

  run.miniGamesDone[gameId] = {
    gameId,
    success: Boolean(payload.success),
    qualityScore: Math.round(qualityScore * 100) / 100,
    speedScore: Math.round(speedScore * 100) / 100,
    compositeScore,
    timeRemainingSec: Number(payload.timeRemainingSec ?? 0),
    timerLimitSec: Number(payload.timerLimitSec ?? run.timers?.[gameId]?.limitSec ?? 30),
    summary: payload.summary || (payload.success ? 'Challenge passed!' : 'Completed with recovery needed.'),
  };

  // Reward & physical simulation coupling
  const researchGain = payload.success ? 6 : 2;
  state.resources.research = clamp(state.resources.research + researchGain);

  if (!payload.success) {
    // Graceful consequence: modest stress rather than hard-lock failure
    state.resources.battery = clamp(state.resources.battery - 4);
  } else if (gameId === 'siteSelector') {
    state.resources.water = clamp(state.resources.water + 5);
  } else if (gameId === 'moduleLayout') {
    state.modules.habitat.health = clamp(state.modules.habitat.health + 5);
  } else if (gameId === 'powerRouter') {
    state.resources.battery = clamp(state.resources.battery + 8);
  } else if (gameId === 'greenhouseBalance') {
    state.resources.food = clamp(state.resources.food + 8);
  } else if (gameId === 'shelterResponse') {
    state.crew.radiationDose = clamp(state.crew.radiationDose - 6);
    state.crew.sheltered = true;
  } else if (gameId === 'shieldBuilder') {
    state.shieldLevel = clamp(state.shieldLevel + 1, 0, BALANCE.actions.shieldMax);
    state.crew.radiationDose = clamp(state.crew.radiationDose - 8);
  } else if (gameId === 'commsDelay' && state.modules.comms) {
    state.modules.comms.signalQuality = clamp((state.modules.comms.signalQuality || 1) + 0.1, 0.5, 1.3);
  }

  // Recompute scenario run progress; complete run ONLY when all 3 scenario mini-games finish
  const requiredGames = sc.minigames.map((m) => m.gameId);
  const completedCount = requiredGames.filter((id) => Boolean(run.miniGamesDone[id])).length;

  if (completedCount >= requiredGames.length) {
    return completeScenarioRun(state);
  }

  return {
    ok: true,
    code: 'MINIGAME_RECORDED',
    message: `${gameId} recorded (${completedCount}/${requiredGames.length} in ${sc.shortTitle}).`,
    completedCount,
    totalCount: requiredGames.length,
  };
}

// Idempotently increments `completedRuns` strictly ONCE when a full scenario reaches `result` state.
export function completeScenarioRun(state) {
  if (!state.campaign) state.campaign = createInitialCampaignState();
  const c = state.campaign;
  const run = c.activeRun;

  if (!run) {
    return { ok: false, code: 'NO_ACTIVE_RUN', message: 'No active scenario run to complete.' };
  }
  if (run.runCompletedLogged || c.completedRunTokens.includes(run.runToken)) {
    return {
      ok: true,
      code: 'ALREADY_COMPLETED',
      message: 'This scenario run was already recorded.',
      completedRuns: c.completedRuns,
      endingTriggered: c.endingTriggered,
    };
  }
  if (!canStartScenarioRun(c)) {
    return { ok: false, code: 'MAX_RUNS_REACHED', message: 'Campaign already completed 5/5 runs.' };
  }

  const sc = getScenarioById(run.scenarioId);
  if (!sc.minigames.every((m) => run.miniGamesDone[m.gameId])) {
    return { ok: false, code: 'TASKS_INCOMPLETE', message: 'Complete every scenario task before finishing the run.' };
  }
  const entries = Object.values(run.miniGamesDone);
  const avgQuality = entries.length
    ? entries.reduce((sum, e) => sum + e.qualityScore, 0) / entries.length
    : 0.5;
  const avgSpeed = entries.length
    ? entries.reduce((sum, e) => sum + e.speedScore, 0) / entries.length
    : 0.5;
  const overall = Math.round(
    (avgQuality * BALANCE.campaign.qualityWeight + avgSpeed * BALANCE.campaign.speedWeight) * 100
  );

  run.status = 'result';
  run.runCompletedLogged = true;
  run.totalQualityScore = Math.round(avgQuality * 100);
  run.totalSpeedScore = Math.round(avgSpeed * 100);
  run.overallScore = overall;

  c.completedRunTokens.push(run.runToken);
  c.completedRuns += 1;

  c.scenarioHistory.push({
    runToken: run.runToken,
    runNumber: c.completedRuns,
    scenarioId: sc.id,
    title: sc.title,
    decisionId: run.decisionId,
    qualityScore: run.totalQualityScore,
    speedScore: run.totalSpeedScore,
    overallScore: overall,
    miniGames: entries,
    carryOverNote: sc.carryOverNote,
  });

  // Update carry-overs cleanly
  c.carryOvers.waterBuffer = overall >= 75 ? 4 : -2;
  c.carryOvers.powerEfficiencyBonus = Math.round((avgQuality - 0.5) * 0.1 * 100) / 100;

  // Advance suggested next scenario cleanly through the 3-scenario cycle
  const currentIdx = SCENARIO_ORDER.indexOf(sc.id);
  c.activeScenarioId = SCENARIO_ORDER[(currentIdx + 1) % SCENARIO_ORDER.length];

  if (c.completedRuns >= c.totalRunsRequired) {
    c.endingTriggered = true;
    if (state.cinematics) {
      state.cinematics.active = 'evacuation';
      state.cinematics.stage = 'wrapUp';
      state.cinematics.progress = 0;
      state.cinematics.caption =
        'Run 5/5 Complete! Astronauts wrapping up Artemis Base instruments and boarding the ascent lander for Earth return!';
    }
    if (Array.isArray(state.log)) {
      state.log.unshift({
        day: state.mission.day,
        kind: 'good',
        text: '🚀 All 5 Mission Training Runs complete! Preparing Base Wrap-Up & Return-to-Earth Evacuation!',
      });
    }
  } else if (Array.isArray(state.log)) {
    state.log.unshift({
      day: state.mission.day,
      kind: 'good',
      text: `🏁 Scenario Run ${c.completedRuns}/${c.totalRunsRequired} complete (${sc.shortTitle}: ${overall}%). Carry-overs updated!`,
    });
  }

  return {
    ok: true,
    code: 'SCENARIO_RUN_COMPLETE',
    message: `${sc.title} complete (${overall}%).`,
    completedRuns: c.completedRuns,
    endingTriggered: c.endingTriggered,
    summary: c.scenarioHistory[c.scenarioHistory.length - 1],
  };
}

export function resetCampaign(state) {
  state.campaign = createInitialCampaignState();
  return {
    ok: true,
    code: 'CAMPAIGN_RESET',
    message: 'Campaign reset to Run 0 / 5.',
  };
}

export function computeCampaignReport(campaign) {
  const hist = Array.isArray(campaign?.scenarioHistory) ? campaign.scenarioHistory : [];
  const total = hist.length || 1;
  const avgQuality = Math.round(hist.reduce((s, r) => s + (r.qualityScore || 0), 0) / total);
  const avgSpeed = Math.round(hist.reduce((s, r) => s + (r.speedScore || 0), 0) / total);
  const overall = Math.round(hist.reduce((s, r) => s + (r.overallScore || 0), 0) / total);
  const rank =
    overall >= 88
      ? 'Artemis Flight Commander ⭐'
      : overall >= 72
      ? 'Senior Lunar Engineer 🛠️'
      : 'Junior Outpost Specialist 🚀';

  return {
    completedRuns: campaign?.completedRuns || 0,
    totalRunsRequired: campaign?.totalRunsRequired || 5,
    avgQuality,
    avgSpeed,
    overall,
    rank,
    history: hist,
    decisionsMade: Array.isArray(campaign?.decisionsMade) ? campaign.decisionsMade : [],
  };
}
