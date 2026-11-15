// Mini-game 4 (Scenario 2): Power Grid Router
// Dynamically allocate limited lunar wattage across Habitat, Life Support, Comms, Greenhouse, and Lab
// so Life Support never drops while surviving a shadow dip without blackouts.

import { createMiniGameLifecycle } from './minigameTemplate.js';
import { SOUNDS } from '../ui/soundFx.js';

const CIRCUITS = [
  { id: 'lifeSupport', name: '💨 Air & Water Maker', watts: 4, critical: true },
  { id: 'comms', name: '📡 Comms Relay Dish', watts: 2, critical: false },
  { id: 'greenhouse', name: '🌱 Space Greenhouse', watts: 3, critical: false },
  { id: 'lab', name: '🔬 Science Lab', watts: 4, critical: false },
];

export function createPowerRouter({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'powerRouter',
    title: '⚡ Power Grid Router',
    badge: 'SCENARIO 2 · MINIGAME 1 OF 3',
    container,
    context,
    onComplete,
    defaultMinSec: 28,
    defaultMaxSec: 38,
    buildPracticeHtml(gs) {
      return `
        <p class="mg-intro">
          Total solar supply is limited when crater hills cast shadows! Keep <strong>Air & Water</strong> powered at all times while keeping Net Power at 0W or higher.
        </p>
        <div class="mg-practice-row">
          <button type="button" class="btn ${gs.practiceDone ? 'btn-secondary' : 'btn-primary'}" id="pr-practice-btn">
            ${gs.practiceDone ? '✅ Practice Rule Ready: Shed Lab First in Shadows!' : '⚡ Test Priority Rule (Which module shuts down first?)'}
          </button>
        </div>
      `;
    },
    bindPractice(root, gs, helpers) {
      root.querySelector('#pr-practice-btn')?.addEventListener('click', () => {
        helpers.markPracticeDone();
      });
    },
    buildPlayHtml(gs) {
      if (!gs.wave) gs.wave = 1;
      if (!gs.activeCircuits) {
        gs.activeCircuits = { lifeSupport: true, comms: true, greenhouse: true, lab: true };
      }
      if (!gs.waveScores) gs.waveScores = [];
      const supply = gs.wave === 1 ? 11 : 8; // Base Habitat uses 2W + selected circuits
      const baseDraw = 2;
      const circuitDraw = CIRCUITS.reduce((s, c) => s + (gs.activeCircuits[c.id] ? c.watts : 0), 0);
      const totalDraw = baseDraw + circuitDraw;
      const net = supply - totalDraw;

      return `
        <div class="mg-power-banner">
          <span>Wave ${gs.wave}/2: <strong>${gs.wave === 1 ? 'Low Sun Haze (11W Supply)' : 'Crater Shadow Peak (8W Supply)'}</strong></span>
          <span class="${net >= 0 ? 'sig-hot' : 'pill-warn'}">Net Grid: <strong>${net >= 0 ? `+${net}` : net} W</strong> (${totalDraw}W / ${supply}W)</span>
        </div>
        <p class="mg-hint">Habitat Core always draws 2W. Toggle breakers below so <strong>Net Grid ≥ 0 W</strong> AND <strong>Air & Water stays ON</strong>.</p>
        <div class="mg-circuit-grid">
          ${CIRCUITS.map((c) => {
            const on = Boolean(gs.activeCircuits[c.id]);
            return `
              <button type="button" class="mg-circuit-card ${on ? 'is-on' : 'is-off'}" data-circuit="${c.id}">
                <div>
                  <strong>${c.name}</strong>
                  <small>${c.watts} W draw ${c.critical ? '· ESSENTIAL' : '· Optional shed'}</small>
                </div>
                <span class="badge">${on ? 'ON' : 'OFF'}</span>
              </button>
            `;
          }).join('')}
        </div>
        <div class="mg-footer-actions">
          <span>Wave ${gs.wave} Budget Check</span>
          <button type="button" class="btn btn-primary" id="pr-lock-wave">${gs.wave === 1 ? '➡ Lock & Enter Shadow Wave' : '✅ Stabilize Power Grid'}</button>
        </div>
      `;
    },
    bindPlay(body, gs, helpers) {
      body.querySelectorAll('[data-circuit]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (helpers.isPaused()) return;
          const id = btn.dataset.circuit;
          gs.activeCircuits[id] = !gs.activeCircuits[id];
          SOUNDS.click();
          helpers.rerenderPlay();
        });
      });
      body.querySelector('#pr-lock-wave')?.addEventListener('click', () => {
        if (helpers.isPaused()) return;
        const supply = gs.wave === 1 ? 11 : 8;
        const draw = 2 + CIRCUITS.reduce((s, c) => s + (gs.activeCircuits[c.id] ? c.watts : 0), 0);
        const net = supply - draw;
        const lifeOn = Boolean(gs.activeCircuits.lifeSupport);
        let waveScore = 0.3;
        if (lifeOn && net >= 0) {
          waveScore = net <= 2 ? 1 : 0.86;
        } else if (lifeOn) {
          waveScore = 0.55;
        }
        gs.waveScores.push(waveScore);
        SOUNDS.action();
        if (gs.wave === 1) {
          gs.wave = 2;
          helpers.rerenderPlay();
        } else {
          helpers.finishNow();
        }
      });
    },
    evaluateResult(gs) {
      const scores = gs.waveScores?.length ? gs.waveScores : [0.6];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const qualityScore = Math.max(0.35, Math.min(1, Math.round(avg * 100) / 100));
      return {
        qualityScore,
        success: qualityScore >= 0.7,
        summary: `Completed both solar supply waves (${Math.round(qualityScore * 100)}% grid stability) without starving Life Support.`,
      };
    },
  });
}

