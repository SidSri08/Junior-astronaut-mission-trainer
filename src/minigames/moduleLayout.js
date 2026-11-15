// Mini-game 2 (Scenario 1): Base Module Layout
// Assign the 6 Artemis outpost buildings into smart zones balancing cable length, dust blast distance, and sun/Earth view.

import { createMiniGameLifecycle } from './minigameTemplate.js';
import { SOUNDS } from '../ui/soundFx.js';

const SLOTS = [
  { id: 'core', label: 'Center Hub', dustSafe: true, sunBonus: 1, earthLOS: 1, cableCost: 10 },
  { id: 'ridge', label: 'North Sun Ridge', dustSafe: true, sunBonus: 3, earthLOS: 3, cableCost: 22 },
  { id: 'east', label: 'East Work Flat', dustSafe: true, sunBonus: 2, earthLOS: 2, cableCost: 18 },
  { id: 'pad', label: 'Near Lander Blast Zone', dustSafe: false, sunBonus: 1, earthLOS: 2, cableCost: 14 },
];

const MODULE_RULES = [
  { id: 'habitat', name: '🏠 Crew Habitat', best: 'core', tip: 'Central hub shortens emergency walks & protects seals from thruster dust.' },
  { id: 'solar', name: '☀️ Solar Wing', best: 'ridge', tip: 'High North Ridge stays sunlit above crater rims and away from lander dust.' },
  { id: 'comms', name: '📡 Comms Relay', best: 'ridge', tip: 'Elevated ridge keeps clear line-of-sight toward Earth.' },
  { id: 'greenhouse', name: '🌱 Greenhouse', best: 'east', tip: 'Flat sunlit shelf next to the core cuts water & heating pipe loss.' },
  { id: 'lifeSupport', name: '💧 Air & Water', best: 'core', tip: 'Keeping ECLSS right beside Habitat avoids freezing long pipes.' },
  { id: 'lab', name: '🔬 Lab & Rover', best: 'east', tip: 'East rim puts the rover beside icy crater trails without shading Solar!' },
];

export function createModuleLayout({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'moduleLayout',
    title: '🗺️ Base Module Layout',
    badge: 'SCENARIO 1 · MINIGAME 2 OF 3',
    container,
    context,
    onComplete,
    defaultMinSec: 30,
    defaultMaxSec: 42,
    buildPracticeHtml(gs) {
      return `
        <p class="mg-intro">
          Where should each module go? Place solar wings & comms high, keep habitat pipes short, and avoid parking fragile domes in the rocket blast zone!
        </p>
        <div class="mg-practice-row">
          <button type="button" class="btn ${gs.practiceDone ? 'btn-secondary' : 'btn-primary'}" id="ml-practice-btn">
            ${gs.practiceDone ? '✅ Practice Check Verified: Ridge = Best Sun & Signal!' : '📐 Check Sample Rule: Why avoid the Lander Blast Zone?'}
          </button>
        </div>
      `;
    },
    bindPractice(root, gs, helpers) {
      root.querySelector('#ml-practice-btn')?.addEventListener('click', () => {
        helpers.markPracticeDone();
      });
    },
    buildPlayHtml(gs) {
      if (!gs.placements) {
        gs.placements = {
          habitat: 'pad',
          solar: 'east',
          comms: 'pad',
          greenhouse: 'core',
          lifeSupport: 'east',
          lab: 'core',
        };
      }
      const totalCable = MODULE_RULES.reduce((sum, m) => {
        const s = SLOTS.find((x) => x.id === gs.placements[m.id]) || SLOTS[0];
        return sum + s.cableCost;
      }, 0);
      const alignedCount = MODULE_RULES.filter((m) => gs.placements[m.id] === m.best).length;

      return `
        <p class="mg-hint">Tap zone buttons for each module. Goal: minimize dust-zone hazards, stay inside <strong>115 m cable budget</strong> (${totalCable} m used), and match smart engineering spots.</p>
        <div class="mg-layout-list">
          ${MODULE_RULES.map((m) => {
            const current = gs.placements[m.id];
            const isOptimal = current === m.best;
            return `
              <div class="mg-layout-row">
                <div class="mg-layout-info">
                  <strong>${m.name}</strong> ${isOptimal ? '<span class="pill-good">Optimal</span>' : ''}
                  <small>${m.tip}</small>
                </div>
                <div class="mg-slot-pills">
                  ${SLOTS.map(
                    (sl) => `
                    <button type="button" class="btn btn-sm ${current === sl.id ? 'btn-primary' : 'btn-ghost'} ml-slot-btn"
                      data-mod="${m.id}" data-slot="${sl.id}">${sl.label}</button>`
                  ).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="mg-footer-actions">
          <span>Aligned Zones: <strong>${alignedCount}/6</strong> · Cable Budget: <strong>${totalCable}/115 m</strong></span>
          <button type="button" class="btn btn-primary" id="ml-commit-btn">🏗️ Deploy Outpost Layout</button>
        </div>
      `;
    },
    bindPlay(body, gs, helpers) {
      body.querySelectorAll('.ml-slot-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (helpers.isPaused()) return;
          SOUNDS.click();
          gs.placements[btn.dataset.mod] = btn.dataset.slot;
          helpers.rerenderPlay();
        });
      });
      body.querySelector('#ml-commit-btn')?.addEventListener('click', () => {
        SOUNDS.action();
        helpers.finishNow();
      });
    },
    evaluateResult(gs) {
      const p = gs.placements || {};
      const optimalHits = MODULE_RULES.filter((m) => p[m.id] === m.best).length;
      const blastHazards = MODULE_RULES.filter((m) => p[m.id] === 'pad').length;
      const totalCable = MODULE_RULES.reduce((sum, m) => {
        const s = SLOTS.find((x) => x.id === p[m.id]) || SLOTS[0];
        return sum + s.cableCost;
      }, 0);
      const cableOk = totalCable <= 115;
      const raw = 0.35 + (optimalHits / 6) * 0.65 - blastHazards * 0.08 - (cableOk ? 0 : 0.08);
      const qualityScore = Math.max(0.3, Math.min(1, Math.round(raw * 100) / 100));
      return {
        qualityScore,
        success: qualityScore >= 0.68,
        summary: `Placed ${optimalHits}/6 modules in ideal spots (${totalCable} m cable used, ${blastHazards} near rocket dust pad).`,
      };
    },
  });
}

