import { createMiniGameLifecycle } from './minigameTemplate.js';
import { FILTER_STAGES, correctFilterOrder } from './workshopModels.js';
import { SOUNDS } from '../ui/soundFx.js';

export function createWaterPurifier({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'waterPurifier', title: 'Water recycling station', badge: 'LIFE SUPPORT · SEQUENCING PUZZLE', container, context, onComplete,
    defaultMinSec: 40, defaultMaxSec: 55,
    buildPracticeHtml: (gs) => `<div class="task-brief"><span class="task-hero-icon">💧</span><h3>Every drop gets another journey.</h3><p>Arrange four treatment stages, then test the sample. Tap two stages to swap them, or drag one onto another. Read each equipment clue.</p><button class="btn btn-secondary" id="water-practice">${gs.practiceDone ? '✓ Sample inspected: grit found' : 'Inspect practice sample'}</button><p class="task-sim-note">Simplified training process, not instructions for making drinking water.</p></div>`,
    bindPractice(root, gs, h) { root.querySelector('#water-practice')?.addEventListener('click', h.markPracticeDone); },
    buildPlayHtml(gs) {
      gs.order ||= ['disinfect', 'membrane', 'screen', 'carbon'];
      gs.feedback ||= 'Dirty water enters on the left. What must happen first?';
      return `<div class="task-console water-console"><div class="task-console-heading"><span>COLLECTED WATER</span><span>→ CLEAN STORAGE</span></div><p role="status">${gs.feedback}</p><div class="filter-pipeline">${gs.order.map((id, i) => {
        const stage = FILTER_STAGES.find((s) => s.id === id);
        return `<button class="filter-stage ${gs.selected === i ? 'is-selected' : ''}" id="filter-stage-${i}" draggable="true" data-stage="${i}" aria-pressed="${gs.selected === i}"><span class="filter-stage-number">0${i + 1}</span><span class="filter-icon">${stage.icon}</span><strong>${stage.name}</strong><small>${stage.clue}</small></button>`;
      }).join('')}</div><p class="task-sim-note">Training simulation units · This diagram represents one simplified treatment train.</p><button class="btn btn-primary" id="water-test">Run water-quality test</button></div>`;
    },
    bindPlay(root, gs, h) {
      const swap = (a, b) => { if (h.isPaused()) return; [gs.order[a], gs.order[b]] = [gs.order[b], gs.order[a]]; gs.selected = null; SOUNDS.click(); h.rerenderPlay(); };
      root.querySelectorAll('[data-stage]').forEach((button) => {
        const i = Number(button.dataset.stage);
        button.addEventListener('click', () => { if (h.isPaused()) return; if (gs.selected == null) { gs.selected = i; h.rerenderPlay(); } else swap(gs.selected, i); });
        button.addEventListener('dragstart', (event) => event.dataTransfer.setData('text/plain', String(i)));
        button.addEventListener('dragover', (event) => event.preventDefault());
        button.addEventListener('drop', (event) => { event.preventDefault(); const from = Number(event.dataTransfer.getData('text/plain')); if (Number.isInteger(from) && from >= 0 && from < 4) swap(from, i); });
      });
      root.querySelector('#water-test')?.addEventListener('click', () => {
        if (h.isPaused()) return;
        gs.tests = (gs.tests || 0) + 1;
        if (correctFilterOrder(gs.order)) { gs.verified = true; h.finishNow(); }
        else { const first = gs.order.findIndex((id, i) => id !== FILTER_STAGES[i].id); gs.feedback = `The test found an issue at stage ${first + 1}. ${FILTER_STAGES[first].clue} Swap stages and test again.`; SOUNDS.alert(); h.rerenderPlay(); }
      });
    },
    evaluateResult(gs) { return { success: Boolean(gs.verified), qualityScore: gs.verified ? Math.max(0.75, 1 - ((gs.tests || 1) - 1) * 0.05) : 0.2, summary: gs.verified ? 'The treatment stages passed the simulation test. +12 water and +4 science when applied. Filtering and disinfection do different jobs.' : 'The water needs another treatment pass. Retry the sequence, or use 3 reserve units for recovery.' }; },
  });
}
