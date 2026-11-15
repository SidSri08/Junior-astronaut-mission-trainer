// Mini-game 7 (Scenario 3): Solar Storm Emergency Drill
// Execute the 4-step storm shelter checklist in safe engineering order upon a NASA DONKI solar particle alert.

import { createMiniGameLifecycle } from './minigameTemplate.js';
import { SOUNDS } from '../ui/soundFx.js';

const STEPS = [
  { id: 'donki', label: '1. Confirm NASA DONKI Solar Alert', detail: 'Verify proton storm arrival window via Comms Relay.' },
  { id: 'labOff', label: '2. Pause Outdoor Science Lab & Rover', detail: 'Frees power & calls rover into shadowed shelter bay.' },
  { id: 'sealHatch', label: '3. Seal Outer Habitat Airlock & Valves', detail: 'Lock cabin pressure before crew enters storm core.' },
  { id: 'shelterCrew', label: '4. Move All 4 Astronauts to Water-Wall Shelter', detail: 'Inner water & supply core blocks solar protons.' },
];

export function createShelterResponse({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'shelterResponse',
    title: '☢️ Solar Storm Emergency Drill',
    badge: 'SCENARIO 3 · MINIGAME 1 OF 3',
    container,
    context,
    onComplete,
    defaultMinSec: 22,
    defaultMaxSec: 32,
    buildPracticeHtml(gs) {
      return `
        <p class="mg-intro">
          When the Sun blasts high-speed protons toward the Moon, X-ray alerts arrive first! Crews follow an exact order so equipment is safe and all 4 astronauts reach the thick inner Storm Shelter.
        </p>
        <div class="mg-practice-row">
          <button type="button" class="btn ${gs.practiceDone ? 'btn-secondary' : 'btn-primary'}" id="sr-practice-btn">
            ${gs.practiceDone ? '✅ Practice Drill: Step 1 = Check DONKI Alert!' : '📡 Practice Dry Run: Inspect Solar Storm Siren'}
          </button>
        </div>
      `;
    },
    bindPractice(root, gs, helpers) {
      root.querySelector('#sr-practice-btn')?.addEventListener('click', () => {
        helpers.markPracticeDone();
      });
    },
    buildPlayHtml(gs) {
      if (!gs.completedSteps) gs.completedSteps = [];
      if (typeof gs.mistakes !== 'number') gs.mistakes = 0;
      if (!gs.feedback) gs.feedback = 'Execute Step 1 first to confirm incoming radiation wave.';

      return `
        <p class="mg-hint">${gs.feedback}</p>
        <div class="mg-checklist-grid">
          ${STEPS.map((st, idx) => {
            const done = gs.completedSteps.includes(st.id);
            const isNext = gs.completedSteps.length === idx;
            return `
              <button type="button" class="mg-step-btn ${done ? 'is-done' : isNext ? 'is-next' : ''}"
                data-step="${st.id}" data-idx="${idx}" ${done ? 'disabled' : ''}>
                <div>
                  <strong>${st.label}</strong>
                  <small>${st.detail}</small>
                </div>
                <span class="badge">${done ? '✓ SECURED' : 'EXECUTE'}</span>
              </button>
            `;
          }).join('')}
        </div>
        <div class="mg-footer-actions">
          <span>Completed: <strong>${gs.completedSteps.length} / 4</strong> · Order Errors: <strong>${gs.mistakes}</strong></span>
        </div>
      `;
    },
    bindPlay(body, gs, helpers) {
      body.querySelectorAll('.mg-step-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (helpers.isPaused()) return;
          const idx = Number(btn.dataset.idx);
          const expected = gs.completedSteps.length;
          if (idx === expected) {
            gs.completedSteps.push(btn.dataset.step);
            gs.feedback = gs.completedSteps.length === 4 ? 'All 4 astronauts safely sheltered!' : `Good! Step ${idx + 1} verified. Proceed to Step ${idx + 2}.`;
            SOUNDS.success();
            if (gs.completedSteps.length >= 4) {
              helpers.finishNow();
              return;
            }
          } else {
            gs.mistakes += 1;
            gs.feedback = `Wait! Complete Step ${expected + 1} (${STEPS[expected].label}) first so nothing gets left unsealed!`;
            SOUNDS.alert();
          }
          helpers.rerenderPlay();
        });
      });
    },
    evaluateResult(gs) {
      const done = gs.completedSteps?.length || 0;
      const penalty = (gs.mistakes || 0) * 0.1;
      const qualityScore = Math.max(0.35, Math.min(1, Math.round(((done / 4) - penalty) * 100) / 100));
      return {
        qualityScore,
        success: done >= 4 && qualityScore >= 0.7,
        summary: `Executed ${done}/4 storm drill steps with ${gs.mistakes || 0} sequence slip(s).`,
      };
    },
  });
}

