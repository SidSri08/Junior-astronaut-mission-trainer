// Application Bootstrap & Single Fixed-Step Simulation Scheduler.
// Wires together:
//   1. Canonical GameState store + LocalStorage SaveSystem
//   2. Three.js OutpostScene with WebGL fallback & procedural cinematics
//   3. DOM UI + 9-Challenge MinigameHost + Accessibility Settings

import { BALANCE } from './data/gameBalance.js';
import { createInitialState, createStore } from './systems/GameState.js';
import { saveGame, loadGame, clearSave } from './systems/SaveSystem.js';
import { createOutpostScene } from './scene/OutpostScene.js';
import { mountUI } from './ui/ui.js';
import { SOUNDS } from './ui/soundFx.js';
import { createMinigameHost } from './minigames/minigameHost.js';
import { mountMissionDesk } from './ui/missionDesk.js';
import './styles/refinement.css';

const canvas = document.getElementById('scene');
const uiRoot = document.getElementById('ui-root');
const minigameRoot = document.getElementById('minigame-root');

// 1. Load saved state or create fresh initial state
const loaded = loadGame();
const initialState = loaded.ok && loaded.state ? loaded.state : createInitialState();

// Respect OS reduced-motion preference on fresh sessions
if (!loaded.ok && typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
  initialState.settings.reducedMotion = true;
}

const store = createStore(initialState);

// Sync initial audio settings
SOUNDS.setMuted(Boolean(initialState.settings?.muted));
SOUNDS.setVolume(initialState.settings?.volume ?? 0.75);

let uiController = null;
let scene = null;
let missionDesk = null;
let evacuationStartedForToken = null;

function handleAudioCue(cue, payload = {}) {
  switch (cue) {
    case 'thrusterStart':
      SOUNDS.startThrusterLoop(payload.thrusterLevel ?? 0.35);
      break;
    case 'descentBurn':
      SOUNDS.thruster('Cargo Lander descent burn active.');
      SOUNDS.startThrusterLoop(payload.thrusterLevel ?? 0.85);
      break;
    case 'thrusterUpdate':
      SOUNDS.updateThrusterLoop(payload.thrusterLevel ?? 0.5);
      break;
    case 'thrusterStop':
      SOUNDS.stopThrusterLoop();
      break;
    case 'touchdown':
      SOUNDS.touchdown('Lunar touchdown confirmed!');
      break;
    case 'hatchOpen':
      SOUNDS.hatchOpen('Airlock hatch unlatched.');
      break;
    case 'scan':
      SOUNDS.scan('Portable scanner sweeping landing zone.');
      break;
    case 'moduleOnline':
      SOUNDS.moduleOnline('Outpost module activated.');
      break;
    case 'confirmationBeep':
      SOUNDS.confirmationBeep('Communications telemetry locked onto Earth.');
      break;
    case 'completeFanfare':
      SOUNDS.fanfare('Outpost established! Mission control ready.');
      break;
    case 'stopAll':
      SOUNDS.stopThrusterLoop();
      break;
    default:
      break;
  }
}

function initWebGLScene() {
  if (scene) {
    try {
      scene.destroy();
    } catch (_) {}
    scene = null;
  }
  uiController?.setInitLoading?.(true, 'Loading Lunar South Pole 3D Outpost...');
  try {
    scene = createOutpostScene({
      canvas,
      onSelectBuilding(buildingId) {
        if (!buildingId) {
          scene?.focusBuilding?.(null);
          return;
        }
        if (uiController) {
          uiController.selectBuilding(buildingId);
        }
        scene?.focusBuilding?.(buildingId);
      },
      onAudioCue: handleAudioCue,
      onCinematicProgress(progress) {
        uiController?.setCinematicProgress?.(progress);
      },
      onContextLost() {
        uiController?.setWebGLFallback?.(true, '3D graphics context paused by browser. Using interactive 2D base map.');
      },
      onContextRestored() {
        uiController?.setWebGLFallback?.(false, '');
        scene?.update?.(store.getState());
      },
    });
    uiController?.setScene?.(scene);
    scene.setLowQuality?.(Boolean(store.getState().settings?.lowQuality));
    scene.update(store.getState());
    scene.resize(window.innerWidth, window.innerHeight);
    uiController?.setWebGLFallback?.(false, '');
  } catch (err) {
    scene = null;
    uiController?.setScene?.(null);
    uiController?.setWebGLFallback?.(true, err?.message || 'WebGL unavailable — switched to interactive 2D base view.');
  } finally {
    uiController?.setInitLoading?.(false, '');
  }
}

// 2. Create Minigame Host
const minigameHost = createMinigameHost({
  container: minigameRoot,
  store,
  background: uiRoot,
});

// 3. Cinematics Orchestrator (Act 1 Arrival Scenes 1-6 -> Normal Play; Run 5 Evacuation -> Earth Report)
function startArrivalCinematic({ force = false } = {}) {
  const s = store.getState();
  if (!force && s.cinematics?.landingSeen) return;
  if (s.mission.status === 'running' && !s.campaign?.mode) store.dispatch({ type: 'startScenario', scenarioId: 'siteSetup' });
  if (!scene) {
    store.dispatch({
      type: 'setCinematic',
      active: 'none',
      stage: 'idle',
      label: '',
      title: '',
      subtitle: '',
      landingSeen: true,
      setupComplete: true,
      caption: '',
    });
    return;
  }
  uiController?.setCinematicProgress?.(0);
  scene.startCinematic('arrival', {
    reducedMotion: Boolean(s.settings?.reducedMotion),
    onStageChange({ stage, label, caption, title, subtitle }) {
      store.dispatch({
        type: 'setCinematic',
        active: 'arrival',
        stage,
        label: label || '',
        caption: caption || '',
        title: title || '',
        subtitle: subtitle || '',
      });
    },
    onComplete(_mode, info) {
      store.dispatch({
        type: 'setCinematic',
        active: 'none',
        stage: 'idle',
        label: '',
        title: '',
        subtitle: '',
        landingSeen: true,
        setupComplete: true,
        skipped: Boolean(info?.skipped),
        caption: '',
      });
      if (!info?.skipped) {
        uiController?.showToast?.('🌕 Outpost Established! All 6 Artemis modules online — take command!', 'good');
      }
    },
  });
}

function startEvacuationCinematic() {
  const s = store.getState();
  if (!scene) {
    store.dispatch({ type: 'setCinematic', active: 'none', stage: 'idle', caption: '' });
    store.dispatch({ type: 'markEarthReturned' });
    uiController?.openReport?.();
    return;
  }
  SOUNDS.thruster('Evacuation launch toward Earth!');
  scene.startCinematic('evacuation', {
    reducedMotion: Boolean(s.settings?.reducedMotion),
    onStageChange({ stage, label, caption, title, subtitle }) {
      store.dispatch({
        type: 'setCinematic',
        active: 'evacuation',
        stage,
        label: label || '',
        caption: caption || '',
        title: title || '',
        subtitle: subtitle || '',
      });
    },
    onComplete() {
      store.dispatch({ type: 'markEarthReturned' });
      store.dispatch({
        type: 'setCinematic',
        active: 'none',
        stage: 'idle',
        label: '',
        title: '',
        subtitle: '',
        caption: '',
      });
      SOUNDS.fanfare('Splashdown complete! Viewing Final Campaign Report.');
      uiController?.openReport?.();
    },
  });
}

function skipActiveCinematic() {
  SOUNDS.stopThrusterLoop();
  if (scene) {
    scene.skipCinematic();
  }
  store.dispatch({
    type: 'setCinematic',
    active: 'none',
    stage: 'idle',
    label: '',
    title: '',
    subtitle: '',
    landingSeen: true,
    setupComplete: true,
    skipped: true,
    caption: '',
  });
}

function handleRestart() {
  minigameHost.close();
  skipActiveCinematic();
  evacuationStartedForToken = null;
  clearSave();
  const fresh = createInitialState({ seed: (Date.now() & 0xffffffff) >>> 0 });
  fresh.settings = { ...store.getState().settings };
  store.replaceState(fresh);
  scene?.focusBuilding?.(null);
}

// 4. Mount DOM UI and initialize WebGL Scene
uiController = mountUI({
  root: uiRoot,
  store,
  openMinigame: (gameId, opts) => minigameHost.open(gameId, opts),
  onRestart: handleRestart,
  scene,
  onStartArrivalCinematic: startArrivalCinematic,
  onSkipCinematic: skipActiveCinematic,
  onRetryWebGL: initWebGLScene,
  onStartStory: () => missionDesk?.startIntro(),
});

missionDesk = mountMissionDesk({ root: uiRoot, store, openMinigame: (id) => minigameHost.open(id), onArrival: startArrivalCinematic });

initWebGLScene();

const unsubCaptions = SOUNDS.onCaption((text) => {
  uiController?.showCaption?.(text);
});

if (loaded.ok && loaded.state) {
  uiController.showToast('💾 Restored your saved Lunar Outpost mission!', 'info');
} else if (loaded.reason && loaded.reason !== 'NO_SAVE') {
  clearSave();
  uiController.showToast('🌕 Started a fresh mission (previous save was reset).', 'info');
}

// 5. Subscribe scene, accessibility classes & autosave to store updates
let lastAutosaveElapsed = store.getState().mission.elapsed;
store.subscribe((snapshot, change) => {
  document.documentElement.classList.toggle('reduced-motion', Boolean(snapshot.settings?.reducedMotion));
  scene?.setLowQuality?.(Boolean(snapshot.settings?.lowQuality));
  scene?.update?.(snapshot);

  // Trigger 5th-run Evacuation -> Return-to-Earth sequence once per completion
  const lastToken = snapshot.campaign?.completedRunTokens?.slice(-1)?.[0] || null;
  if (snapshot.campaign?.endingTriggered && !snapshot.campaign.returnedToEarth && evacuationStartedForToken !== lastToken) {
    evacuationStartedForToken = lastToken || 'done';
    startEvacuationCinematic();
  }

  if (change?.type === 'action') {
    saveGame(store.getState());
  } else if (snapshot.mission.elapsed - lastAutosaveElapsed >= BALANCE.time.autosaveEverySeconds) {
    lastAutosaveElapsed = snapshot.mission.elapsed;
    saveGame(snapshot);
  }
});

document.documentElement.classList.toggle('reduced-motion', Boolean(store.getState().settings?.reducedMotion));
if (store.getState().campaign?.returnedToEarth) uiController.openReport?.();
else if (store.getState().campaign?.endingTriggered) store.dispatch({ type: 'setCinematic', active: 'evacuation' });

// 6. Window resize handling
function handleResize() {
  scene?.resize?.(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);
handleResize();

// 7. Separated Fixed-Step Simulation Scheduler + Animation Render Loop
const STEP = BALANCE.time.stepSeconds;
let simAccumulator = 0;
let lastFrameTime = performance.now();
let rafId = 0;

function frame(now) {
  const rawDt = Math.min(0.25, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  const snap = store.getState();
  const cinematicBusy = snap.cinematics?.active && snap.cinematics.active !== 'none';
  if (snap.mission.status === 'running' && !snap.mission.inMinigame && !cinematicBusy && snap.mission.speed > 0) {
    simAccumulator += rawDt * snap.mission.speed;
    while (simAccumulator >= STEP) {
      simAccumulator -= STEP;
      store.step(STEP);
    }
  }

  scene?.render?.(rawDt);
  rafId = requestAnimationFrame(frame);
}

rafId = requestAnimationFrame(frame);

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('resize', handleResize);
  unsubCaptions();
});
