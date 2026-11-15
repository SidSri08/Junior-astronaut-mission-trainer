import { createMiniGameLifecycle } from './minigameTemplate.js';
import { ROVER_MAP, moveRover } from './workshopModels.js';
import { SOUNDS } from '../ui/soundFx.js';

export function createRoverExplorer({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'roverExplorer', title: 'Rover sample expedition', badge: 'SURFACE EXPLORATION · ROUTE PLANNING', container, context, onComplete,
    defaultMinSec: 65, defaultMaxSec: 80,
    buildPracticeHtml: (gs) => `<div class="task-brief"><span class="task-hero-icon">🛞</span><h3>Bring the science home.</h3><p>Drive around dark craters. Collect three sample beacons, then return to the blue base pad. Use the direction buttons or focus the map and use arrow keys / WASD. Each move uses one battery unit.</p><button class="btn btn-secondary" id="rover-practice">${gs.practiceDone ? '✓ Route map checked' : 'Check rover controls'}</button><p class="task-sim-note">Training map and battery units. Plan the return trip before leaving.</p></div>`,
    bindPractice(root, gs, h) { root.querySelector('#rover-practice')?.addEventListener('click', h.markPracticeDone); },
    buildPlayHtml(gs) {
      gs.position ??= ROVER_MAP.base; gs.battery ??= 48; gs.collected ||= [];
      return `<div class="task-console rover-console"><div class="task-console-heading"><span>BATTERY ${gs.battery}/48</span><span>SAMPLES ${gs.collected.length}/3</span></div><p role="status">${gs.feedback || 'Yellow beacons: samples · dark circles: craters · blue pad: home'}</p><div class="rover-map" id="rover-map" tabindex="0" role="group" aria-label="Rover map. Arrow keys move. Collect three beacons and return home.">${Array.from({ length: 48 }, (_, i) => `<span class="rover-cell ${ROVER_MAP.rocks.includes(i) ? 'is-crater' : ''} ${i === ROVER_MAP.base ? 'is-base' : ''} ${gs.position === i ? 'is-rover' : ''}">${gs.position === i ? '🛞' : i === ROVER_MAP.base ? '⌂' : ROVER_MAP.samples.includes(i) && !gs.collected.includes(i) ? '◆' : '·'}</span>`).join('')}</div><div class="rover-controls" aria-label="Drive rover">${[['north','↑'],['west','←'],['south','↓'],['east','→']].map(([dir, arrow]) => `<button class="btn btn-secondary" id="drive-${dir}" data-drive="${dir}" aria-label="Drive ${dir}">${arrow}</button>`).join('')}</div><button class="btn btn-primary" id="rover-return" ${gs.position === ROVER_MAP.base && gs.collected.length === 3 ? '' : 'disabled'}>Unload samples at base</button></div>`;
    },
    bindPlay(root, gs, h) {
      function drive(direction) {
        if (h.isPaused()) return;
        const result = moveRover(gs.position, direction, gs.battery);
        gs.position = result.position; gs.battery = result.battery;
        gs.feedback = result.moved ? 'Keep enough charge to return to base.' : 'Crater ahead. Choose another route; no battery lost.';
        if (ROVER_MAP.samples.includes(gs.position) && !gs.collected.includes(gs.position)) { gs.collected.push(gs.position); gs.feedback = 'Sample secured! Bring it back to the base.'; SOUNDS.success(); }
        if (gs.battery <= 0) { h.finishNow(); return; }
        h.rerenderPlay();
      }
      root.querySelectorAll('[data-drive]').forEach((button) => button.addEventListener('click', () => drive(button.dataset.drive)));
      root.querySelector('#rover-map')?.addEventListener('keydown', (event) => {
        const dir = { ArrowUp: 'north', w: 'north', ArrowDown: 'south', s: 'south', ArrowLeft: 'west', a: 'west', ArrowRight: 'east', d: 'east' }[event.key];
        if (dir) { event.preventDefault(); drive(dir); }
      });
      root.querySelector('#rover-return')?.addEventListener('click', () => { if (gs.position === ROVER_MAP.base && gs.collected.length === 3) { gs.returned = true; h.finishNow(); } });
    },
    evaluateResult(gs) { return { success: Boolean(gs.returned), qualityScore: gs.returned ? 1 : (gs.collected?.length || 0) / 6, summary: gs.returned ? 'All three samples returned safely. +8 water reserve, +8 science, and the Trailblazer patch when applied. Exploration includes planning the journey home.' : 'Mission Control recovered the rover. Retry with a shorter return route, or use 3 reserve units for recovery.' }; },
  });
}
