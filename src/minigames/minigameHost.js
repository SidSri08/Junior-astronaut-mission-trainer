// C-S3 — Minigame Host: mounts either Leak Hunter or Solar Aligner into a modal overlay
// and dispatches `setMinigameOpen` / `completeMinigame` to the canonical GameState store.

import { createLeakHunter } from './leakHunter.js';
import { createSolarAligner } from './solarAligner.js';

export function createMinigameHost({ container, store }) {
  let activeController = null;

  function open(gameId) {
    close();
    store.dispatch({ type: 'setMinigameOpen', open: true });
    container.hidden = false;

    const onComplete = (result) => {
      if (activeController) {
        activeController.destroy();
        activeController = null;
      }
      container.hidden = true;
      store.dispatch({
        type: 'completeMinigame',
        gameId: result.gameId,
        success: result.success,
        score: result.score,
      });
    };

    if (gameId === 'leakHunter') {
      activeController = createLeakHunter({ container, context: store.getState(), onComplete });
      activeController.start();
    } else if (gameId === 'solarAligner') {
      activeController = createSolarAligner({ container, context: store.getState(), onComplete });
      activeController.start();
    } else {
      container.hidden = true;
      store.dispatch({ type: 'setMinigameOpen', open: false });
    }
  }

  function close() {
    if (activeController) {
      activeController.destroy();
      activeController = null;
    }
    container.hidden = true;
    store.dispatch({ type: 'setMinigameOpen', open: false });
  }

  return { open, close };
}

