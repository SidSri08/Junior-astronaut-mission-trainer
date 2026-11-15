// Mini-game 6 (Scenario 2): Greenhouse Bioreactor
// Tune Grow Lamps, Water Mist, and CO2 Air Valve to hit the green closed-loop growth sweet spot.

import { createMiniGameLifecycle } from './minigameTemplate.js';
import { SOUNDS } from '../ui/soundFx.js';

export function createGreenhouseBalance({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'greenhouseBalance',
    title: '🌱 Greenhouse Bioreactor',
    badge: 'SCENARIO 2 · MINIGAME 3 OF 3',
    container,
    context,
    onComplete,
    defaultMinSec: 28,
    defaultMaxSec: 38,
    buildPracticeHtml(gs) {
      return `
        <p class="mg-intro">
          Space crops breathe in carbon dioxide (CO₂) from astronauts and breathe out fresh oxygen! Balance Heat, Moisture, and Air Flow to grow healthy greens without wasting water or power.
        </p>
        <div class="mg-practice-row">
          <button type="button" class="btn ${gs.practiceDone ? 'btn-secondary' : 'btn-primary'}" id="gb-practice-btn">
            ${gs.practiceDone ? '✅ Sample Plant Misted! Ready to balance the dome.' : '🥬 Mist Sample Lettuce Leaf (Practice)'}
          </button>
        </div>
      `;
    },
    bindPractice(root, gs, helpers) {
      root.querySelector('#gb-practice-btn')?.addEventListener('click', () => {
        helpers.markPracticeDone();
      });
    },
    buildPlayHtml(gs) {
      if (!gs.planted) return `<div class="task-brief"><span class="task-hero-icon">🌱</span><h3>First, prepare the crop bed.</h3><p>Plant your lettuce, then balance light, moisture and airflow. Finally harvest the crop. Growth time is compressed in this training simulation.</p><button class="btn btn-primary" id="gb-plant-btn">Plant the seed tray</button></div>`;
      if (gs.grown) return `<div class="task-brief"><span class="task-hero-icon">🥬 🥬 🥬</span><h3>The crop is ready.</h3><p>Your settings supported healthy growth. Harvest the tray to finish the task and earn food for the crew.</p><button class="btn btn-primary" id="gb-pick-btn">Harvest fresh greens</button></div>`;
      if (typeof gs.lamps !== 'number') {
        gs.lamps = 85;
        gs.mist = 30;
        gs.co2 = 40;
      }
      const tempC = Math.round(14 + gs.lamps * 0.16 - gs.mist * 0.05);
      const humidity = Math.round(25 + gs.mist * 0.65 - gs.lamps * 0.12);
      const growthRate = Math.round(
        Math.max(
          0,
          100 - Math.abs(tempC - 22) * 8 - Math.abs(humidity - 62) * 2.5 - Math.abs(gs.co2 - 65) * 1.4
        )
      );

      return `
        <p class="mg-hint">Tune all 3 valves so Dome Temperature stays <strong>20–24°C</strong>, Humidity <strong>55–70%</strong>, and Plant Growth reaches <strong>80%+</strong>. Training values, not a crop-growing recipe.</p>
        ${gs.feedback ? `<p role="status">${gs.feedback}</p>` : ''}
        <div class="mg-telemetry-trio">
          <div class="mg-stat-pill">🌡️ Temp: <strong>${tempC}°C</strong> <small>(Target 20–24°C)</small></div>
          <div class="mg-stat-pill">💧 Moisture: <strong>${humidity}%</strong> <small>(Target 55–70%)</small></div>
          <div class="mg-stat-pill ${growthRate >= 80 ? 'sig-hot' : ''}">🌿 Growth Efficiency: <strong>${growthRate}%</strong></div>
        </div>
        <div class="mg-sliders-box">
          <label class="mg-slider-row">
            <span>💡 Pink-Blue LED Lamps (${gs.lamps}%)</span>
            <input type="range" min="20" max="100" value="${gs.lamps}" id="gb-lamps" />
          </label>
          <label class="mg-slider-row">
            <span>💦 Crater Water Mist (${gs.mist}%)</span>
            <input type="range" min="15" max="100" value="${gs.mist}" id="gb-mist" />
          </label>
          <label class="mg-slider-row">
            <span>💨 Cabin CO₂ Valve (${gs.co2}%)</span>
            <input type="range" min="20" max="100" value="${gs.co2}" id="gb-co2" />
          </label>
        </div>
        <div class="mg-footer-actions">
          <span>Target Efficiency: ≥ 80%</span>
          <button type="button" class="btn btn-primary" id="gb-harvest-btn">🥬 Lock Growth Cycle</button>
        </div>
      `;
    },
    bindPlay(body, gs, helpers) {
      body.querySelector('#gb-plant-btn')?.addEventListener('click', () => { if (helpers.isPaused()) return; gs.planted = true; SOUNDS.action(); helpers.rerenderPlay(); });
      body.querySelector('#gb-pick-btn')?.addEventListener('click', () => { if (helpers.isPaused()) return; gs.harvested = true; SOUNDS.success(); helpers.finishNow(); });
      ['lamps', 'mist', 'co2'].forEach((k) => {
        const el = body.querySelector(`#gb-${k}`);
        el?.addEventListener('change', () => {
          if (helpers.isPaused()) return;
          gs[k] = Number(el.value);
          helpers.rerenderPlay();
        });
      });
      body.querySelector('#gb-harvest-btn')?.addEventListener('click', () => {
        if (helpers.isPaused()) return;
        const temp = 14 + gs.lamps * 0.16 - gs.mist * 0.05;
        const humidity = 25 + gs.mist * 0.65 - gs.lamps * 0.12;
        const growth = 100 - Math.abs(temp - 22) * 8 - Math.abs(humidity - 62) * 2.5 - Math.abs(gs.co2 - 65) * 1.4;
        if (growth < 80) { gs.feedback = 'The seedlings need a better balance. Check each target and adjust the valves.'; helpers.rerenderPlay(); return; }
        gs.grown = true;
        SOUNDS.action();
        helpers.rerenderPlay();
      });
    },
    evaluateResult(gs) {
      const tempC = 14 + (gs.lamps ?? 85) * 0.16 - (gs.mist ?? 30) * 0.05;
      const humidity = 25 + (gs.mist ?? 30) * 0.65 - (gs.lamps ?? 85) * 0.12;
      const growthRate = Math.max(
        0,
        100 - Math.abs(tempC - 22) * 8 - Math.abs(humidity - 62) * 2.5 - Math.abs((gs.co2 ?? 40) - 65) * 1.4
      );
      const qualityScore = Math.max(0.35, Math.min(1, Math.round(growthRate) / 100));
      return {
        qualityScore,
        success: Boolean(gs.harvested) && qualityScore >= 0.75,
        summary: `Greenhouse tuned to ${Math.round(tempC)}°C, ${Math.round(humidity)}% humidity (${Math.round(qualityScore * 100)}% crop health).`,
      };
    },
  });
}

