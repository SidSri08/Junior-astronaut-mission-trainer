// Mini-game 9 (Scenario 3): Earth-Moon Signal Relay
// Aim the South Pole Communications Dish toward Earth (~384,400 km away) and manage the 2.56s round-trip light delay.

import { createMiniGameLifecycle } from './minigameTemplate.js';
import { SOUNDS } from '../ui/soundFx.js';

export function createCommsDelay({ container, context, onComplete }) {
  return createMiniGameLifecycle({
    gameId: 'commsDelay',
    title: '📡 Earth-Moon Signal Relay',
    badge: 'SCENARIO 3 · MINIGAME 3 OF 3',
    container,
    context,
    onComplete,
    defaultMinSec: 26,
    defaultMaxSec: 36,
    buildPracticeHtml(gs) {
      return `
        <p class="mg-intro">
          Earth is ~384,400 km away! Even moving at the speed of light, radio messages take ~1.28s to reach Earth and ~1.28s to return (<strong>~2.56s round-trip</strong>). Aim your dish cleanly and send telemetry without jamming the queue!
        </p>
        <div class="mg-practice-row">
          <button type="button" class="btn ${gs.practiceDone ? 'btn-secondary' : 'btn-primary'}" id="cd-practice-btn">
            ${gs.practiceDone ? '✅ Practice Ping Returned in ~2.56s!' : '🌍 Send Practice Light-Speed Ping to Houston'}
          </button>
        </div>
      `;
    },
    bindPractice(root, gs, helpers) {
      root.querySelector('#cd-practice-btn')?.addEventListener('click', () => {
        helpers.markPracticeDone();
      });
    },
    buildPlayHtml(gs) {
      if (typeof gs.dishAngle !== 'number') gs.dishAngle = 15;
      if (typeof gs.targetAngle !== 'number') gs.targetAngle = 54;
      if (typeof gs.packetsSent !== 'number') gs.packetsSent = 0;
      if (typeof gs.inTransit !== 'boolean') gs.inTransit = false;
      const errDeg = Math.abs(gs.dishAngle - gs.targetAngle);
      const signalStrength = Math.max(0, Math.round(100 - errDeg * 2.2));
      const locked = signalStrength >= 85;

      return `
        <p class="mg-hint">Step 1: Aim Dish Elevation to <strong>${gs.targetAngle}°</strong> (Earth Line-of-Sight). Step 2: Send <strong>3 telemetry packets</strong>, waiting for each ~2.56s round-trip acknowledgment!</p>
        <div class="mg-telemetry-trio">
          <div class="mg-stat-pill">🌍 Earth Target: <strong>${gs.targetAngle}°</strong></div>
          <div class="mg-stat-pill ${locked ? 'sig-hot' : ''}">📶 Signal Lock: <strong>${signalStrength}%</strong></div>
          <div class="mg-stat-pill">📦 Verified Acks: <strong>${gs.packetsSent} / 3</strong></div>
        </div>
        <div class="mg-sliders-box">
          <label class="mg-slider-row">
            <span>📡 Dish Aim (${gs.dishAngle}°)</span>
            <input type="range" min="0" max="90" value="${gs.dishAngle}" id="cd-angle" ${gs.inTransit ? 'disabled' : ''} />
          </label>
        </div>
        <div class="mg-footer-actions">
          <span>${gs.inTransit ? '⏳ Radio wave flying 384,400 km to Earth & back (~2.56s)...' : locked ? 'Signal locked! Ready to transmit packet.' : 'Aim closer to Earth target (need ≥85% signal).'}</span>
          <button type="button" class="btn btn-primary" id="cd-send-btn" ${!locked || gs.inTransit ? 'disabled' : ''}>
            ${gs.inTransit ? '⏳ Waiting Earth Reply...' : `📤 Transmit Packet ${gs.packetsSent + 1} / 3`}
          </button>
        </div>
      `;
    },
    bindPlay(body, gs, helpers) {
      body.querySelector('#cd-angle')?.addEventListener('change', (e) => {
        if (helpers.isPaused() || gs.inTransit) return;
        gs.dishAngle = Number(e.target.value);
        helpers.rerenderPlay();
      });
      body.querySelector('#cd-send-btn')?.addEventListener('click', () => {
        if (helpers.isPaused() || gs.inTransit) return;
        gs.inTransit = true;
        SOUNDS.scan('Packet beamed to Earth across 384,400 km.');
        helpers.rerenderPlay();
        // Simulated light-time round-trip (~900ms scaled for snappy responsive feedback while displaying the 2.56s physics principle)
        helpers.safeTimeout(() => {
          if (helpers.isDestroyed()) return;
          gs.inTransit = false;
          gs.packetsSent = Math.min(3, (gs.packetsSent || 0) + 1);
          SOUNDS.success('Earth acknowledgment received!');
          if (gs.packetsSent >= 3) {
            helpers.finishNow();
          } else {
            helpers.rerenderPlay();
          }
        }, 2560);
      });
    },
    evaluateResult(gs) {
      const sent = gs.packetsSent || 0;
      const errDeg = Math.abs((gs.dishAngle ?? 15) - (gs.targetAngle ?? 54));
      const lockFactor = Math.max(0, 1 - errDeg / 60);
      const qualityScore = Math.max(0.35, Math.min(1, Math.round(((sent / 3) * 0.75 + lockFactor * 0.25) * 100) / 100));
      return {
        qualityScore,
        success: sent >= 3,
        summary: `Verified ${sent}/3 Earth-Moon telemetry packets (${Math.round(qualityScore * 100)}% link quality across 2.56s round-trip lag).`,
      };
    },
  });
}
