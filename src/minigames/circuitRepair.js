import { createMiniGameLifecycle } from './minigameTemplate.js';
import { CIRCUIT_PORTS, rotatePorts, traceCircuit } from './workshopModels.js';
import { nextRandom } from '../systems/rng.js';
import { SOUNDS } from '../ui/soundFx.js';

export function createCircuitRepair({ container, context = {}, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'circuitRepair', title: 'Circuit restoration', badge: 'POWER WORKSHOP · ROTATION PUZZLE', container, context, onComplete,
    defaultMinSec: 45, defaultMaxSec: 60,
    buildPracticeHtml: (gs) => `<div class="task-brief"><span class="task-hero-icon">⚡</span><h3>The grow lamps need a circuit.</h3><p>Tap a conductor to turn it clockwise. Join the yellow source on the left to the lamp at the bottom right. A bright wire shows how far power travels.</p><button class="btn btn-secondary" id="circuit-practice">${gs.practiceDone ? '✓ Quarter-turn tested' : '↻ Try a quarter-turn'}</button><p class="task-sim-note">Training circuit. Never work on real electrical equipment.</p></div>`,
    bindPractice(root, gs, h) { root.querySelector('#circuit-practice')?.addEventListener('click', h.markPracticeDone); },
    buildPlayHtml(gs) {
      if (!gs.rotations) {
        const rng = { rngState: context.seed || 2026 };
        gs.rotations = CIRCUIT_PORTS.map(() => 1 + Math.floor(nextRandom(rng) * 3));
        gs.turns = 0;
      }
      const trace = traceCircuit(gs.rotations);
      return `<div class="task-console"><div class="task-console-heading"><span>● SOURCE →</span><span>${trace.connected ? '✓ Lamp powered' : `${trace.lit.length}/9 conductors live`}</span></div><p>Turn the tiles to connect the wire. No diagonal connections.</p><div class="circuit-board">${CIRCUIT_PORTS.map((ports, i) => `<button class="circuit-tile ${trace.lit.includes(i) ? 'is-live' : ''}" id="conductor-${i}" data-tile="${i}" aria-label="Rotate conductor row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}"><svg viewBox="0 0 100 100" aria-hidden="true">${rotatePorts(ports, gs.rotations[i]).map((port) => `<path d="M50 50 L${[50, 100, 50, 0][port]} ${[0, 50, 100, 50][port]}"/>`).join('')}<circle cx="50" cy="50" r="10"/></svg></button>`).join('')}</div><div class="task-console-heading"><span>${gs.turns} turns</span><span>→ GROW LAMP ${trace.connected ? '☀' : '○'}</span></div><button class="btn btn-primary" id="circuit-verify" ${trace.connected ? '' : 'disabled'}>Test restored circuit</button></div>`;
    },
    bindPlay(root, gs, h) {
      root.querySelectorAll('[data-tile]').forEach((button) => button.addEventListener('click', () => {
        if (h.isPaused()) return;
        const i = Number(button.dataset.tile);
        gs.rotations[i] = (gs.rotations[i] + 1) % 4;
        gs.turns++;
        SOUNDS.click(); h.rerenderPlay();
      }));
      root.querySelector('#circuit-verify')?.addEventListener('click', () => { if (traceCircuit(gs.rotations).connected) h.finishNow(); });
    },
    evaluateResult(gs) {
      const trace = traceCircuit(gs.rotations || Array(9).fill(1));
      return { success: trace.connected, qualityScore: trace.connected ? 1 : trace.lit.length / 12, summary: trace.connected ? 'The whole circuit carries power to the grow lamps. +10 power reserve and +4 science when applied.' : 'The circuit still has a gap. Follow the live wire and turn the next conductor. Retry, or use 3 reserve units for a backup repair.' };
    },
  });
}
