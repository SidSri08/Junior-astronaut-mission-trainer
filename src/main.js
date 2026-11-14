// B-S4 — Application Bootstrap & Single Fixed-Step Simulation Scheduler.
// Wires together:
//   1. Canonical GameState store + LocalStorage SaveSystem
//   2. Three.js OutpostScene (read-only snapshots)
//   3. DOM UI + MinigameHost (read-only snapshots + action dispatch)

import { BALANCE } from './data/gameBalance.js';
import { createInitialState, createStore } from './systems/GameState.js';
import { saveGame, loadGame, clearSave } from './systems/SaveSystem.js';
import { createOutpostScene } from './scene/OutpostScene.js';
import { mountUI } from './ui/ui.js';
import { createMinigameHost } from './minigames/minigameHost.js';

const canvas = document.getElementById('scene');
const uiRoot = document.getElementById('ui-root');
const minigameRoot = document.getElementById('minigame-root');

// 1. Load saved state or create fresh initial state
const loaded = loadGame();
const initialState = loaded.ok && loaded.state ? loaded.state : createInitialState();
const store = createStore(initialState);

// 2. Create 3D Lunar Outpost Scene
let uiController = null;
const scene = createOutpostScene({
  canvas,
  onSelectBuilding(buildingId) {
    if (uiController) {
      uiController.selectBuilding(buildingId);
    }
    scene.focusBuilding(buildingId);
  },
});
scene.update(store.getState());

// 3. Create Minigame Host
const minigameHost = createMinigameHost({
  container: minigameRoot,
  store,
});

// 4. Mount DOM UI
function handleRestart() {
  minigameHost.close();
  clearSave();
  const fresh = createInitialState({ seed: (Date.now() & 0xffffffff) >>> 0 });
  store.replaceState(fresh);
  scene.focusBuilding(null);
}

uiController = mountUI({
  root: uiRoot,
  store,
  openMinigame: (gameId) => minigameHost.open(gameId),
  onRestart: handleRestart,
  scene,
});

if (loaded.ok && loaded.state) {
  uiController.showToast('💾 Restored your saved Lunar Outpost mission!', 'info');
} else if (loaded.reason && loaded.reason !== 'NO_SAVE') {
  clearSave();
  uiController.showToast('🌕 Started a fresh mission (previous save was reset).', 'info');
}

// 5. Subscribe scene & autosave to store updates
let lastAutosaveElapsed = store.getState().mission.elapsed;
store.subscribe((snapshot, change) => {
  scene.update(snapshot);
  if (change?.type === 'action') {
    saveGame(snapshot);
  } else if (snapshot.mission.elapsed - lastAutosaveElapsed >= BALANCE.time.autosaveEverySeconds) {
    lastAutosaveElapsed = snapshot.mission.elapsed;
    saveGame(snapshot);
  }
});

// 6. Window resize handling
function handleResize() {
  scene.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleResize);
handleResize();

// 7. Separated Fixed-Step Simulation Scheduler + Animation Render Loop
const STEP = BALANCE.time.stepSeconds;
let simAccumulator = 0;
let lastFrameTime = performance.now();

function frame(now) {
  const rawDt = Math.min(0.25, Math.max(0, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  const snap = store.getState();
  if (snap.mission.status === 'running' && !snap.mission.inMinigame && snap.mission.speed > 0) {
    simAccumulator += rawDt * snap.mission.speed;
    while (simAccumulator >= STEP) {
      simAccumulator -= STEP;
      store.step(STEP);
    }
  }

  scene.render(rawDt);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

