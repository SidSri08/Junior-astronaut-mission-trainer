import { createMiniGameLifecycle } from './minigameTemplate.js';
import { LAB_SAMPLES } from './workshopModels.js';
import { SOUNDS } from '../ui/soundFx.js';

export function createSampleAnalysis({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'sampleAnalysis', title: 'Lunar sample laboratory', badge: 'SCIENCE LAB · OBSERVE AND CLASSIFY', container, context, onComplete,
    defaultMinSec: 45, defaultMaxSec: 60,
    buildPracticeHtml: (gs) => `<div class="task-brief"><span class="task-hero-icon">🔬</span><h3>Look closely before you name it.</h3><p>Inspect each sample under the scanner, then sort it into a rock tray. Basalt: dark volcanic rock. Anorthosite: light, feldspar-rich rock. Breccia: joined fragments. These simplified samples are training illustrations.</p><button class="btn btn-secondary" id="sample-practice">${gs.practiceDone ? '✓ Scanner calibrated' : 'Calibrate sample scanner'}</button></div>`,
    bindPractice(root, gs, h) { root.querySelector('#sample-practice')?.addEventListener('click', h.markPracticeDone); },
    buildPlayHtml(gs) {
      gs.index ??= 0; gs.matches ||= []; gs.inspected ||= {}; gs.errors ??= 0;
      const sample = LAB_SAMPLES[Math.min(2, gs.index)];
      return `<div class="task-console sample-console"><div class="task-console-heading"><span>SPECIMEN ${sample.id}</span><span>${gs.matches.length}/3 CLASSIFIED</span></div><div class="sample-viewer"><svg viewBox="0 0 200 140" aria-label="Illustrated ${sample.shape} rock"><path d="M35 90 L48 42 L105 24 L163 53 L175 99 L120 123 L61 115Z" fill="${sample.color}" stroke="#e3edff" stroke-width="2"/>${sample.shape === 'fragments' ? '<path d="M48 42L120 123M35 90L163 53M105 24L61 115" stroke="#403e40" stroke-width="7"/>' : sample.shape === 'crystal' ? '<path d="M66 55L90 45L105 70L81 85ZM125 64L146 76L132 100L111 82Z" fill="#f7eee3"/>' : '<circle cx="80" cy="65" r="4" fill="#414959"/><circle cx="122" cy="86" r="6" fill="#414959"/>'}</svg></div><button class="btn btn-secondary" id="sample-inspect">Inspect with scanner</button><p role="status">${gs.inspected[sample.id] ? sample.reading : 'Scan to reveal grain and color clues.'} ${gs.feedback || ''}</p><div class="sample-trays">${['basalt', 'anorthosite', 'breccia'].map((bin) => `<button class="btn btn-secondary" id="sample-tray-${bin}" data-bin="${bin}" ${gs.inspected[sample.id] ? '' : 'disabled'}>Sort into ${bin}</button>`).join('')}</div><p class="task-sim-note">Simplified geological clues; not a real laboratory diagnosis.</p></div>`;
    },
    bindPlay(root, gs, h) {
      const sample = LAB_SAMPLES[gs.index];
      root.querySelector('#sample-inspect')?.addEventListener('click', () => { if (h.isPaused()) return; gs.inspected[sample.id] = true; SOUNDS.scan(); h.rerenderPlay(); });
      root.querySelectorAll('[data-bin]').forEach((button) => button.addEventListener('click', () => {
        if (h.isPaused() || !gs.inspected[sample.id]) return;
        if (button.dataset.bin !== sample.bin) { gs.errors++; gs.feedback = 'Compare the scanner clue with the tray descriptions from the briefing.'; SOUNDS.alert(); h.rerenderPlay(); return; }
        gs.matches.push(sample.id); gs.index++; gs.feedback = ''; SOUNDS.success();
        if (gs.index === 3) h.finishNow(); else h.rerenderPlay();
      }));
    },
    evaluateResult(gs) { const count = gs.matches?.length || 0; return { success: count === 3, qualityScore: Math.max(0, count / 3 - (gs.errors || 0) * 0.04), summary: count === 3 ? 'Three samples classified using observed properties. +10 science and the Lunar Geologist patch when applied. Good science begins with evidence.' : `Classified ${count}/3 samples. Retry to compare the remaining clues, or use 3 reserve units for recovery.` }; },
  });
}
