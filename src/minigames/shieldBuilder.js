// Mini-game 8 (Scenario 3): Regolith Shield Stacker
// Stack Moon Soil (Regolith), Water Bladders, and Polyethylene inside a roof mass budget for maximum radiation protection.

import { createMiniGameLifecycle } from './minigameTemplate.js';
import { SOUNDS } from '../ui/soundFx.js';

const MATERIALS = [
  { id: 'regolith', name: '🪨 Moondust Bags (Regolith)', mass: 3, shieldValue: 22, info: 'Plentiful local Moon dirt stops space pebbles & cuts solar protons.' },
  { id: 'water', name: '💧 Water Wall Bladders', mass: 2, shieldValue: 20, info: 'Hydrogen-rich materials can help reduce exposure; real protection depends on the full design.' },
  { id: 'poly', name: '🛡️ Hydrogen Plastic Tiles', mass: 1, shieldValue: 16, info: 'Lightweight hydrogen-rich layer. This simplified puzzle scores a mix of materials.' },
];

export function createShieldBuilder({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'shieldBuilder',
    title: '🛡️ Regolith Shield Stacker',
    badge: 'SCENARIO 3 · MINIGAME 2 OF 3',
    container,
    context,
    onComplete,
    defaultMinSec: 26,
    defaultMaxSec: 36,
    buildPracticeHtml(gs) {
      return `
        <p class="mg-intro">
          How do engineers build the best radiation roof without collapsing it under heavy rock? Mixing <strong>local regolith soil</strong> with lightweight <strong>hydrogen-rich water & plastic</strong> works wonders!
        </p>
        <div class="mg-practice-row">
          <button type="button" class="btn ${gs.practiceDone ? 'btn-secondary' : 'btn-primary'}" id="sb-practice-btn">
            ${gs.practiceDone ? '✅ Sample Check: Hydrogen Tiles Block Secondary Rays!' : '🧪 Test Sample Tile: Why mix Plastic & Soil?'}
          </button>
        </div>
      `;
    },
    bindPractice(root, gs, helpers) {
      root.querySelector('#sb-practice-btn')?.addEventListener('click', () => {
        helpers.markPracticeDone();
      });
    },
    buildPlayHtml(gs) {
      if (!gs.counts) gs.counts = { regolith: 1, water: 1, poly: 1 };
      const maxMass = 10;
      const totalMass = MATERIALS.reduce((s, m) => s + (gs.counts[m.id] || 0) * m.mass, 0);
      const shieldPct = Math.min(
        100,
        MATERIALS.reduce((s, m) => s + (gs.counts[m.id] || 0) * m.shieldValue, 0) +
          (gs.counts.regolith >= 1 && gs.counts.poly >= 1 && gs.counts.water >= 1 ? 14 : 0)
      );
      const overweight = totalMass > maxMass;

      return `
        <p class="mg-hint">Fill up to <strong>${maxMass} roof mass units</strong> to reach a <strong>shield design score of 85+</strong>. All mass and scores are training simulation units; they do not predict real radiation protection.</p>
        <div class="mg-telemetry-trio">
          <div class="mg-stat-pill ${overweight ? 'pill-warn' : ''}">⚖️ Roof Mass: <strong>${totalMass} / ${maxMass} units</strong></div>
          <div class="mg-stat-pill ${shieldPct >= 85 && !overweight ? 'sig-hot' : ''}">🛡️ Design Score: <strong>${shieldPct}/100</strong></div>
        </div>
        <div class="mg-layout-list">
          ${MATERIALS.map((m) => {
            const count = gs.counts[m.id] || 0;
            return `
              <div class="mg-layout-row">
                <div class="mg-layout-info">
                  <strong>${m.name}</strong> (${m.mass} mass units • +${m.shieldValue} design points)
                  <small>${m.info}</small>
                </div>
                <div class="mg-stepper">
                  <button type="button" class="btn btn-ghost btn-sm sb-dec" data-mat="${m.id}">−</button>
                  <strong>${count}</strong>
                  <button type="button" class="btn btn-primary btn-sm sb-inc" data-mat="${m.id}">+</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="mg-footer-actions">
          <span>${overweight ? '⚠️ Too heavy for roof beams! Remove a layer.' : 'Sandwich bonus (+14%) active when all 3 materials are combined!'}</span>
          <button type="button" class="btn btn-primary" id="sb-lock-btn" ${overweight ? 'disabled' : ''}>🧪 Lock Roof Shield</button>
        </div>
      `;
    },
    bindPlay(body, gs, helpers) {
      body.querySelectorAll('.sb-inc').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (helpers.isPaused()) return;
          const m = btn.dataset.mat;
          gs.counts[m] = Math.min(4, (gs.counts[m] || 0) + 1);
          SOUNDS.click();
          helpers.rerenderPlay();
        });
      });
      body.querySelectorAll('.sb-dec').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (helpers.isPaused()) return;
          const m = btn.dataset.mat;
          gs.counts[m] = Math.max(0, (gs.counts[m] || 0) - 1);
          SOUNDS.click();
          helpers.rerenderPlay();
        });
      });
      body.querySelector('#sb-lock-btn')?.addEventListener('click', () => {
        SOUNDS.action();
        helpers.finishNow();
      });
    },
    evaluateResult(gs) {
      const c = gs.counts || { regolith: 1, water: 1, poly: 1 };
      const totalMass = MATERIALS.reduce((s, m) => s + (c[m.id] || 0) * m.mass, 0);
      const shieldPct = Math.min(
        100,
        MATERIALS.reduce((s, m) => s + (c[m.id] || 0) * m.shieldValue, 0) +
          (c.regolith >= 1 && c.poly >= 1 && c.water >= 1 ? 14 : 0)
      );
      const massPenalty = totalMass > 10 ? 0.25 : 0;
      const qualityScore = Math.max(0.35, Math.min(1, Math.round((shieldPct / 100 - massPenalty) * 100) / 100));
      return {
        qualityScore,
        success: totalMass <= 10 && shieldPct >= 80,
        summary: `Stacked ${totalMass}/10 simulated mass units for a design score of ${shieldPct}/100. Shielding reduces risk; this score is not a radiation-dose calculation.`,
      };
    },
  });
}

