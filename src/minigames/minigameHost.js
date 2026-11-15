// Minigame Host: routes all 9 training & scenario mini-games into the modal overlay
// and dispatches completion actions cleanly to the canonical GameState store.

import { createLeakHunter } from './leakHunter.js';
import { createSolarAligner } from './solarAligner.js';
import { createSiteSelector } from './siteSelector.js';
import { createModuleLayout } from './moduleLayout.js';
import { createPowerRouter } from './powerRouter.js';
import { createGreenhouseBalance } from './greenhouseBalance.js';
import { createShelterResponse } from './shelterResponse.js';
import { createShieldBuilder } from './shieldBuilder.js';
import { createCommsDelay } from './commsDelay.js';
import { SCENARIOS } from '../data/scenarios.js';
import { createCircuitRepair } from './circuitRepair.js';
import { createWaterPurifier } from './waterPurifier.js';
import { createRoverExplorer } from './roverExplorer.js';
import { createSampleAnalysis } from './sampleAnalysis.js';
import { rollBoundedTimer } from '../systems/TimerSystem.js';

const FACTORIES = {
  circuitRepair: createCircuitRepair,
  waterPurifier: createWaterPurifier,
  roverExplorer: createRoverExplorer,
  sampleAnalysis: createSampleAnalysis,
  leakHunter: createLeakHunter,
  solarAligner: createSolarAligner,
  siteSelector: createSiteSelector,
  moduleLayout: createModuleLayout,
  powerRouter: createPowerRouter,
  greenhouseBalance: createGreenhouseBalance,
  shelterResponse: createShelterResponse,
  shieldBuilder: createShieldBuilder,
  commsDelay: createCommsDelay,
};

export function createMinigameHost({ container, store, background }) {
  let activeController = null;
  let attemptSeq = 0;

  function open(gameId, opts = {}) {
    close();
    const factory = FACTORIES[gameId];
    if (!factory) {
      return;
    }

    const state = store.getState();
    const attemptToken = `${state.seed}-${Date.now()}-${++attemptSeq}`;
    let submitted = false;
    const activeRun = state.campaign?.activeRun;
    const scenarioId = opts.scenarioId || activeRun?.scenarioId || state.campaign?.activeScenarioId;
    const scenarioDef = SCENARIOS[scenarioId];
    const mgSpec = scenarioDef?.minigames?.find((m) => m.gameId === gameId);
    const standaloneRanges = { circuitRepair: [45, 60], waterPurifier: [40, 55], roverExplorer: [65, 80], sampleAnalysis: [45, 60] };
    const range = standaloneRanges[gameId] || [mgSpec?.timerMinSec ?? 25, mgSpec?.timerMaxSec ?? 36];
    const rolledTimer = opts.scenarioMode ? activeRun?.timers?.[gameId] : rollBoundedTimer({ rngState: (state.seed + attemptSeq) >>> 0 }, ...range);

    const context = {
      ...state,
      scenarioId: opts.scenarioMode ? scenarioId : null,
      timerMinSec: rolledTimer?.minSec ?? mgSpec?.timerMinSec ?? 25,
      timerMaxSec: rolledTimer?.maxSec ?? mgSpec?.timerMaxSec ?? 36,
      timerLimitSec: rolledTimer?.limitSec ?? Math.round((range[0] + range[1]) / 2),
      reducedMotion: Boolean(state.settings?.reducedMotion),
    };

    store.dispatch({ type: 'setMinigameOpen', open: true });
    if (background) background.inert = true;
    container.hidden = false;

    const onComplete = (result) => {
      if (submitted) return;
      submitted = true;
      if (activeController) {
        activeController.destroy();
        activeController = null;
      }
      container.hidden = true;
      if (background) background.inert = false;
      store.dispatch({ type: 'setMinigameOpen', open: false });
      if (result.cancelled) return;

      const currentRun = store.getState().campaign?.activeRun;
      const inActiveScenario =
        Boolean(opts.scenarioMode);

      if (inActiveScenario) {
        store.dispatch({
          type: 'completeScenarioMiniGame',
          scenarioId: result.scenarioId || currentRun?.scenarioId || scenarioId,
          gameId: result.gameId,
          success: result.success,
          score: result.score,
          qualityScore: result.qualityScore,
          speedScore: result.speedScore,
          timeRemainingSec: result.timeRemainingSec,
          timerLimitSec: result.timerLimitSec,
          summary: result.summary,
        });
      } else {
        store.dispatch({
          type: 'completeMinigame',
          attemptToken,
          gameId: result.gameId,
          success: result.success,
          score: result.score,
          qualityScore: result.qualityScore,
          speedScore: result.speedScore,
        });
      }
    };

    activeController = factory({ container, context, onComplete });
    activeController.start();
    container.querySelector('button')?.focus?.();
  }

  function close() {
    if (activeController) {
      activeController.destroy();
      activeController = null;
    }
    container.hidden = true;
    if (background) background.inert = false;
    store.dispatch({ type: 'setMinigameOpen', open: false });
  }

  return { open, close };
}
