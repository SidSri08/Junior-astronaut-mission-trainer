// Mini-game 1 (Scenario 1): Landing Site Selector
// Inspect South Pole landing candidates across Sunlight, Frozen Crater Ice, and Slope Safety.

import { createMiniGameLifecycle } from './minigameTemplate.js';
import { SOUNDS } from '../ui/soundFx.js';

const SITES = [
  {
    id: 'peak',
    name: 'Site A: Connecting Ridge Peak',
    sunHours: 92,
    iceDistanceM: 950,
    slopeDeg: 11,
    dustRisk: 'Medium',
    note: 'Awesome 92% polar sunlight, but 950 m rugged haul from shadowed crater ice!',
    quality: 0.78,
  },
  {
    id: 'terrace',
    name: 'Site B: Shackleton Rim Terrace',
    sunHours: 84,
    iceDistanceM: 320,
    slopeDeg: 4,
    dustRisk: 'Low',
    note: 'Balanced training site: flat 4° pad, 84% simulated sunlight availability, and a 320 m simulated ice haul.',
    quality: 0.96,
  },
  {
    id: 'floor',
    name: 'Site C: Deep Crater Edge',
    sunHours: 38,
    iceDistanceM: 90,
    slopeDeg: 14,
    dustRisk: 'High',
    note: 'Super close to water ice (90 m), but steep slope and dark shadows starve solar panels!',
    quality: 0.56,
  },
];

export function createSiteSelector({ container, context, onComplete }) {
  const lifecycle = createMiniGameLifecycle({
    gameId: 'siteSelector',
    title: '🧭 Landing Site Selector',
    badge: 'SCENARIO 1 · MINIGAME 1 OF 3',
    container,
    context,
    onComplete,
    defaultMinSec: 28,
    defaultMaxSec: 38,
    buildPracticeHtml(gs) {
      return `
        <p class="mg-intro">
          Pick where our Moon Lander touches down! At the Lunar South Pole, tall peaks get almost continuous sunlight, while dark deep craters trap frozen water.
        </p>
        <div class="mg-practice-row">
          <button type="button" class="btn ${gs.practiceDone ? 'btn-secondary' : 'btn-primary'}" id="ss-practice-scan">
            ${gs.practiceDone ? '✅ Orbit Scanner Tested! Ready to compare sites.' : '🛰️ Test South Pole Terrain Scanner (Practice)'}
          </button>
        </div>
      `;
    },
    bindPractice(root, gs, helpers) {
      root.querySelector('#ss-practice-scan')?.addEventListener('click', () => {
        helpers.markPracticeDone();
      });
    },
    buildPlayHtml(gs) {
      if (!gs.inspected) gs.inspected = {};
      if (!gs.selectedSite) gs.selectedSite = 'terrace';
      const inspectedCount = Object.keys(gs.inspected).length;
      return `
        <p class="mg-hint">Click <strong>Inspect</strong> on all 3 sites first so you weigh Sun vs Water Ice vs Landing Slope, then pick your pad. All site readings are invented training values, not NASA survey data.</p>
        <div class="mg-site-grid">
          ${SITES.map((s) => {
            const seen = Boolean(gs.inspected[s.id]);
            const picked = gs.selectedSite === s.id;
            return `
              <div class="mg-site-card ${picked ? 'is-picked' : ''}">
                <strong>${s.name}</strong>
                <div class="mg-site-metrics">
                  <span>☀️ Sun: ${seen ? `${s.sunHours}%` : '???'}</span>
                  <span>🧊 Ice Haul: ${seen ? `${s.iceDistanceM} m` : '???'}</span>
                  <span>📐 Slope: ${seen ? `${s.slopeDeg}° (${s.dustRisk})` : '???'}</span>
                </div>
                <p class="mg-site-note">${seen ? s.note : 'Scan site telemetry to reveal hazard data.'}</p>
                <div class="mg-site-btns">
                  <button type="button" class="btn btn-ghost btn-sm ss-inspect" data-site="${s.id}">${seen ? '✓ Scanned' : '🔍 Scan Site'}</button>
                  <button type="button" class="btn ${picked ? 'btn-primary' : 'btn-secondary'} btn-sm ss-pick" data-site="${s.id}">${picked ? '✓ Selected Pad' : 'Choose Pad'}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="mg-footer-actions">
          <span>Sites Scanned: <strong>${inspectedCount} / 3</strong></span>
          <button type="button" class="btn btn-primary" id="ss-lock-btn">🚀 Lock Landing Pad</button>
        </div>
      `;
    },
    bindPlay(body, gs, helpers) {
      body.querySelectorAll('.ss-inspect').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (helpers.isPaused()) return;
          SOUNDS.scan('Telemetry scanned.');
          gs.inspected[btn.dataset.site] = true;
          helpers.rerenderPlay();
        });
      });
      body.querySelectorAll('.ss-pick').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (helpers.isPaused()) return;
          SOUNDS.click();
          gs.selectedSite = btn.dataset.site;
          helpers.rerenderPlay();
        });
      });
      body.querySelector('#ss-lock-btn')?.addEventListener('click', () => {
        SOUNDS.action();
        helpers.finishNow();
      });
    },
    evaluateResult(gs) {
      const site = SITES.find((s) => s.id === (gs.selectedSite || 'terrace')) || SITES[1];
      const scanned = Object.keys(gs.inspected || {}).length;
      const scanBonus = scanned >= 3 ? 0.04 : scanned * -0.06;
      const qualityScore = Math.max(0.35, Math.min(1, site.quality + scanBonus));
      return {
        qualityScore,
        success: qualityScore >= 0.72,
        summary: `Picked ${site.name} (${scanned}/3 sites scanned). ${site.note}`,
      };
    },
  });

  return lifecycle;
}

