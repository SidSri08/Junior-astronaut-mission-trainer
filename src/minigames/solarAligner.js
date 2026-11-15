// C-S3 — Minigame 2: Solar Aligner (Cosine Law & Lunar Dust Cleaning Educational Minigame).
// Contract: createSolarAligner({ container, context, onComplete }) -> { start(), destroy() }

import { SOUNDS } from '../ui/soundFx.js';

const NASA_SOLAR_FACTS = [
  'At the Moon’s South Pole, the Sun never rises high overhead—it skims sideways along the horizon at only ~1.5° to 7°! That is why NASA’s Artemis base uses tall vertical solar towers that rotate to follow the Sun.',
  'Solar panels follow the Cosine Law: P = Pmax × cos(θ). When a panel faces the Sun straight on (0° error), it catches 100% of the sunlight. Tilting away makes the shadow narrower and drops electricity!',
  'Moon dust (regolith) is jagged and statically charged by sunlight, so it clings to solar panels like static-cling laundry! Cleaning off dust can boost a lunar solar array’s power by up to 60%.',
];

export function createSolarAligner({ container, onComplete }) {
  let destroyed = false;
  let phase = 'tutorial'; // 'tutorial' | 'playing' | 'results'
  let paused = false;
  let sunAngle = -35; // -70..+70 deg along south-pole horizon
  let panelAngle = 25;
  const TOTAL_DUST_SPOTS = 6;
  let spots = [];
  let isPointerDownOnGrid = false;
  let practiceCleaned = false;
  let pointerUpHandler = null;
  let keyHandler = null;

  function removeWindowListeners() {
    if (typeof window !== 'undefined') {
      if (pointerUpHandler) {
        window.removeEventListener('pointerup', pointerUpHandler);
        window.removeEventListener('pointercancel', pointerUpHandler);
        pointerUpHandler = null;
      }
      if (keyHandler) {
        window.removeEventListener('keydown', keyHandler);
        keyHandler = null;
      }
    }
    isPointerDownOnGrid = false;
  }

  function makeSpots() {
    spots = [];
    for (let i = 0; i < TOTAL_DUST_SPOTS; i++) {
      spots.push({
        id: i,
        x: 12 + (i % 3) * 31 + (Math.random() * 6 - 3),
        y: 18 + Math.floor(i / 3) * 44 + (Math.random() * 6 - 3),
        cleaned: false,
      });
    }
  }

  function computeAlignment() {
    const diffRad = ((panelAngle - sunAngle) * Math.PI) / 180;
    return Math.max(0, Math.cos(diffRad));
  }

  function computeCleanFraction() {
    if (!spots.length) return 0;
    const cleaned = spots.filter((s) => s.cleaned).length;
    return cleaned / spots.length;
  }

  function computeTotalEfficiency() {
    const align = computeAlignment();
    const cleanFactor = 0.4 + 0.6 * computeCleanFraction();
    return align * cleanFactor;
  }

  function computeResultMetrics() {
    const score = Math.max(0, Math.min(1, Number(computeTotalEfficiency().toFixed(2))));
    const success = score >= 0.78;
    const stars = score >= 0.92 ? 3 : score >= 0.78 ? 2 : score >= 0.5 ? 1 : 0;
    const alignPct = Math.round(computeAlignment() * 100);
    const cleanedCount = spots.filter((s) => s.cleaned).length;
    const points = Math.round(score * 1000) + (practiceCleaned ? 50 : 0);
    return { score, success, stars, alignPct, cleanedCount, points };
  }

  function exitToMission() {
    if (destroyed) return;
    SOUNDS.click();
    removeWindowListeners();
    const { success, score } = computeResultMetrics();
    onComplete({
      gameId: 'solarAligner',
      success,
      score,
    });
  }

  function renderTutorial() {
    phase = 'tutorial';
    removeWindowListeners();

    container.innerHTML = `
      <div class="mg-card mg-animate-in" role="dialog" aria-label="Solar Aligner Tutorial">
        <div class="mg-header">
          <div>
            <span class="mg-badge">MINIGAME 2 · INTERACTIVE TUTORIAL</span>
            <h2>☀️ Solar Aligner: South Pole Solar Power</h2>
          </div>
          <button class="btn btn-ghost mg-close" type="button" data-action="close">✕ Back to Base</button>
        </div>

        <p class="mg-intro">
          Our Moon base runs on solar power! At the Lunar South Pole, the Sun stays low on the horizon and jagged Moon dust clings to our solar cells.
          Follow <strong>2 simple steps</strong> to achieve 100% electricity output!
        </p>

        <div class="mg-tutorial-steps" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
          <div class="mg-tut-step" style="background:rgba(16,27,43,0.85);border:1px solid var(--panel-border-subtle);border-radius:var(--radius-sm);padding:10px;">
            <div style="font-size:1.4rem;margin-bottom:4px;">🧹</div>
            <strong style="font-size:0.82rem;">Step 1: Brush Sticky Regolith</strong>
            <p style="font-size:0.74rem;color:var(--text-muted);margin:4px 0 0 0;line-height:1.35;">Click, tap, or swipe across the 6 grey dust clouds on the solar panel until all cells sparkle!</p>
          </div>
          <div class="mg-tut-step" style="background:rgba(16,27,43,0.85);border:1px solid var(--panel-border-subtle);border-radius:var(--radius-sm);padding:10px;">
            <div style="font-size:1.4rem;margin-bottom:4px;">📐</div>
            <strong style="font-size:0.82rem;">Step 2: Aim Directly at the Sun</strong>
            <p style="font-size:0.74rem;color:var(--text-muted);margin:4px 0 0 0;line-height:1.35;">Rotate the panel’s <span class="sig-hot">▲ Front Arrow</span> using slider, −/+ buttons, or Arrow keys to face the Sun!</p>
          </div>
          <div class="mg-tut-step" style="background:rgba(16,27,43,0.85);border:1px solid var(--panel-border-subtle);border-radius:var(--radius-sm);padding:10px;">
            <div style="font-size:1.4rem;margin-bottom:4px;">⚡</div>
            <strong style="font-size:0.82rem;">Step 3: Lock In 78%+ Output</strong>
            <p style="font-size:0.74rem;color:var(--text-muted);margin:4px 0 0 0;line-height:1.35;">When Total Power hits <strong class="sig-hot">78% or higher</strong> (92%+ for 3 Stars ⭐), click <strong>Lock Array</strong>!</p>
          </div>
        </div>

        <div class="mg-practice-box" style="background:rgba(16,27,43,0.9);border:1px dashed var(--accent-primary);border-radius:var(--radius-md);padding:12px;margin-bottom:14px;">
          <div style="font-size:0.8rem;margin-bottom:8px;">
            🎯 <strong>Interactive Practice:</strong> Click the dusty solar cell below to test your electrostatic brush!
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <button type="button" class="btn ${practiceCleaned ? 'btn-secondary' : 'btn-primary btn-pulse'}" id="sa-practice-btn">
              ${practiceCleaned ? '✨ Sparkling Clean (+50 Bonus Pts)!' : '🌫️ Dusty Solar Cell — Click to Brush!'}
            </button>
            <span id="sa-practice-status" class="mg-practice-feedback ${practiceCleaned ? 'sig-hot' : ''}" style="font-size:0.8rem;">
              ${practiceCleaned ? '🌟 Fantastic brushing! Now let’s tune the full lunar solar array!' : 'Tap the dusty cell to test brushing…'}
            </span>
          </div>
        </div>

        <div class="mg-actions-row">
          <span class="mg-science-note">🔬 <strong>NASA Tip:</strong> Facing the Sun directly (0° difference) gives 100% Cosine Law Power!</span>
          <div class="mg-btn-group">
            <button type="button" class="btn btn-primary btn-lg" id="sa-start-btn">☀️ Start Tuning Solar Panels!</button>
          </div>
        </div>
      </div>
    `;

    const practiceBtn = container.querySelector('#sa-practice-btn');
    const practiceStatus = container.querySelector('#sa-practice-status');
    practiceBtn?.addEventListener('click', () => {
      SOUNDS.action();
      practiceCleaned = true;
      practiceBtn.className = 'btn btn-secondary';
      practiceBtn.textContent = '✨ Sparkling Clean (+50 Bonus Pts)!';
      if (practiceStatus) {
        practiceStatus.textContent = '🌟 Fantastic brushing! Now let’s tune the full lunar solar array!';
        practiceStatus.className = 'mg-practice-feedback sig-hot';
      }
    });

    container.querySelector('#sa-start-btn')?.addEventListener('click', () => {
      SOUNDS.click();
      startGameplay();
    });

    container.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      exitToMission();
    });
  }

  function startGameplay() {
    phase = 'playing';
    paused = false;
    removeWindowListeners();
    sunAngle = Math.round(-55 + Math.random() * 110);
    panelAngle = sunAngle > 0 ? Math.max(-75, sunAngle - 50) : Math.min(75, sunAngle + 50);
    makeSpots();

    container.innerHTML = `
      <div class="mg-card mg-animate-in" role="dialog" aria-label="Solar Aligner Minigame">
        <div class="mg-header">
          <div>
            <span class="mg-badge">MINIGAME 2 · SOLAR POWER & COSINE LAW</span>
            <h2>☀️ Solar Aligner: South Pole Array Tuner</h2>
          </div>
          <div class="mg-header-btns" style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-mini" type="button" id="sa-help-btn">❓ Help</button>
            <button class="btn btn-secondary btn-mini" type="button" id="sa-pause-btn">⏸ Pause</button>
            <button class="btn btn-ghost btn-mini" type="button" data-action="exit">✕ Close</button>
          </div>
        </div>

        <p class="mg-intro">
          <strong>Task 1:</strong> Click or swipe the <strong>6 grey dust patches</strong> on the right to brush them clean.
          <strong>Task 2:</strong> Rotate the solar panel on the left until its arrow points straight at <strong>☀️ SUN (${sunAngle}°)</strong>!
        </p>

        <div class="mg-stats">
          <div class="mg-stat">🌞 Sun Azimuth: <strong id="sa-sun">${sunAngle}°</strong></div>
          <div class="mg-stat">📐 Aim Match: <strong id="sa-align">0%</strong></div>
          <div class="mg-stat">🧹 Dust Cleaned: <strong id="sa-dust">0 / ${TOTAL_DUST_SPOTS}</strong></div>
          <div class="mg-stat" style="display:inline-flex;align-items:center;gap:6px;">
            ⚡ Total Power: <strong id="sa-total">0%</strong>
            <svg class="rive-solar-dial" id="sa-dial-svg" data-rive-state="idle" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="rgba(148,163,184,0.28)" stroke-width="3"/>
              <circle id="sa-dial-arc" cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-dasharray="56.5" stroke-dashoffset="56.5" transform="rotate(-90 12 12)"/>
            </svg>
          </div>
        </div>

        <div class="mg-progress-strip" title="Total Solar Power Output (Reach 78%+ to pass, 92%+ for 3 Stars!)">
          <div class="mg-progress-fill is-power" id="sa-power-bar" style="width:0%"></div>
        </div>

        <div class="sa-workspace">
          <div class="sa-compass-box">
            <div class="sa-panel-title">📐 Step 2: Aim Panel Arrow at the Sun</div>
            <div class="sa-compass" id="sa-compass">
              <div class="sa-sun-beam" id="sa-sun-beam"></div>
              <div class="sa-sun-ray" id="sa-sun-ray">☀️ SUN</div>
              <div class="sa-panel-bar" id="sa-panel-bar">
                <div class="sa-panel-normal">▲ Panel Front</div>
              </div>
            </div>
            <label style="display:block;font-size:0.8rem;text-align:center;margin-bottom:4px;" for="sa-slider">
              Panel Angle: <strong id="sa-angle-val">${panelAngle}°</strong>
              <span id="sa-angle-diff" style="font-size:0.74rem;margin-left:4px;"></span>
            </label>
            <input id="sa-slider" class="sa-slider" type="range" min="-80" max="80" step="1" value="${panelAngle}" />
            <div class="sa-nudge-row" role="group" aria-label="Fine angle controls">
              <button type="button" class="btn btn-chip" data-nudge="-10">−10°</button>
              <button type="button" class="btn btn-chip" data-nudge="-1">−1°</button>
              <button type="button" class="btn btn-chip" data-nudge="1">+1°</button>
              <button type="button" class="btn btn-chip" data-nudge="10">+10°</button>
            </div>
          </div>

          <div class="sa-panel-box">
            <div class="sa-panel-title-row">
              <span>🧹 Step 1: Click Dust Patches Clean</span>
              <span id="sa-clean-badge" class="b-tag is-warn">6 Dusty</span>
            </div>
            <div class="sa-solar-grid" id="sa-spots"></div>
            <div class="sa-feedback-banner" id="sa-feedback" style="font-size:0.75rem;color:var(--text-muted);text-align:center;margin-top:4px;">
              👩‍🚀 Tip: Brush off all 6 dust clouds and match the Sun angle (${sunAngle}°)!
            </div>
          </div>
        </div>

        <div class="mg-pause-overlay" id="sa-pause-overlay" style="position:absolute;inset:0;background:rgba(7,13,24,0.92);display:flex;align-items:center;justify-content:center;z-index:20;" hidden>
          <div class="mg-pause-box" style="text-align:center;padding:16px;">
            <h3>⏸ Solar Tuner Paused</h3>
            <p style="color:var(--text-muted);font-size:0.84rem;">Ready to keep tuning your South Pole solar towers?</p>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
              <button type="button" class="btn btn-primary" id="sa-resume-btn">▶ Resume Tuning</button>
              <button type="button" class="btn btn-secondary" id="sa-reset-btn">🔄 Fresh Panel</button>
            </div>
          </div>
        </div>

        <div class="mg-actions-row">
          <span class="mg-science-note">🔬 <strong>NASA Science:</strong> Power follows <em>P = P<sub>max</sub> × cos(θ)</em>. Facing Sun directly gives 100% power!</span>
          <button class="btn btn-primary btn-lg" type="button" id="sa-lock">⚡ Lock Array & Finish</button>
        </div>
      </div>
    `;

    const slider = container.querySelector('#sa-slider');
    const angleVal = container.querySelector('#sa-angle-val');
    const angleDiffEl = container.querySelector('#sa-angle-diff');
    const alignEl = container.querySelector('#sa-align');
    const dustEl = container.querySelector('#sa-dust');
    const totalEl = container.querySelector('#sa-total');
    const dialSvgEl = container.querySelector('#sa-dial-svg');
    const dialArcEl = container.querySelector('#sa-dial-arc');
    const powerBarEl = container.querySelector('#sa-power-bar');
    const cleanBadgeEl = container.querySelector('#sa-clean-badge');
    const feedbackEl = container.querySelector('#sa-feedback');
    const sunRay = container.querySelector('#sa-sun-ray');
    const sunBeam = container.querySelector('#sa-sun-beam');
    const panelBar = container.querySelector('#sa-panel-bar');
    const spotsBox = container.querySelector('#sa-spots');
    const lockBtn = container.querySelector('#sa-lock');
    const helpBtn = container.querySelector('#sa-help-btn');
    const pauseBtn = container.querySelector('#sa-pause-btn');
    const pauseOverlay = container.querySelector('#sa-pause-overlay');
    const resumeBtn = container.querySelector('#sa-resume-btn');
    const resetBtn = container.querySelector('#sa-reset-btn');
    const exitBtn = container.querySelector('[data-action="exit"]');

    sunRay.style.transform = `translate(-50%, -50%) rotate(${sunAngle}deg) translateY(-68px)`;
    if (sunBeam) {
      sunBeam.style.transform = `translate(-50%, -50%) rotate(${sunAngle}deg)`;
    }

    function renderSpots() {
      spotsBox.innerHTML = spots
        .map((s) => {
          return `
            <div
              class="sa-dust-spot ${s.cleaned ? 'is-clean' : ''}"
              data-spot-id="${s.id}"
              style="left:${s.x}%;top:${s.y}%;"
            >
              ${s.cleaned ? '✨ Clean' : '🌫️ Dust'}
            </div>
          `;
        })
        .join('');

      spotsBox.querySelectorAll('[data-spot-id]').forEach((el) => {
        el.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          cleanSpot(Number(el.dataset.spotId));
        });
        el.addEventListener('pointerenter', () => {
          if (isPointerDownOnGrid) {
            cleanSpot(Number(el.dataset.spotId));
          }
        });
      });
    }

    function cleanSpot(id) {
      if (paused || phase !== 'playing') return;
      const target = spots.find((s) => s.id === id);
      if (!target || target.cleaned) return;
      target.cleaned = true;
      SOUNDS.action();
      renderSpots();
      updateMetrics();
    }

    function cleanNextSpot() {
      const next = spots.find((s) => !s.cleaned);
      if (next) cleanSpot(next.id);
    }

    spotsBox.addEventListener('pointerdown', () => {
      isPointerDownOnGrid = true;
    });
    pointerUpHandler = () => {
      isPointerDownOnGrid = false;
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('pointerup', pointerUpHandler);
      window.addEventListener('pointercancel', pointerUpHandler);
    }

    function updateRiveDial(score) {
      if (!dialSvgEl || !dialArcEl) return;
      const circum = 56.5;
      const offset = circum * (1 - Math.max(0, Math.min(1, score)));
      dialArcEl.style.strokeDashoffset = String(offset.toFixed(1));
      if (score >= 0.92) {
        dialSvgEl.dataset.riveState = 'celebrate';
      } else if (score >= 0.78) {
        dialSvgEl.dataset.riveState = 'happy';
      } else if (score >= 0.5) {
        dialSvgEl.dataset.riveState = 'alert';
      } else {
        dialSvgEl.dataset.riveState = 'idle';
      }
    }

    function updateMetrics() {
      panelBar.style.transform = `translate(-50%, -50%) rotate(${panelAngle}deg)`;
      angleVal.textContent = `${panelAngle}°`;
      slider.value = String(panelAngle);

      const diff = Math.abs(panelAngle - sunAngle);
      angleDiffEl.textContent = diff === 0 ? '🎯 Perfect 0°!' : `${diff}° off`;
      angleDiffEl.className = diff <= 4 ? 'sig-hot' : diff <= 15 ? 'sig-warm' : 'sig-cold';

      const alignRatio = computeAlignment();
      alignEl.textContent = `${Math.round(alignRatio * 100)}%`;

      const cleanedCount = spots.filter((s) => s.cleaned).length;
      dustEl.textContent = `${cleanedCount} / ${TOTAL_DUST_SPOTS}`;
      if (cleanBadgeEl) {
        const dustyLeft = TOTAL_DUST_SPOTS - cleanedCount;
        cleanBadgeEl.textContent = dustyLeft === 0 ? '✨ 100% Clean' : `${dustyLeft} Dusty`;
        cleanBadgeEl.className = dustyLeft === 0 ? 'b-tag is-on' : 'b-tag is-warn';
      }

      const totalEff = computeTotalEfficiency();
      const totalPct = Math.round(totalEff * 100);
      totalEl.textContent = `${totalPct}%`;
      updateRiveDial(totalEff);

      if (powerBarEl) {
        powerBarEl.style.width = `${totalPct}%`;
      }

      if (feedbackEl) {
        if (totalPct >= 92) {
          feedbackEl.innerHTML = '🌟 <strong>PERFECT POWER (3 STARS ⭐⭐⭐)!</strong> Ready to lock in!';
          feedbackEl.className = 'sa-feedback-banner sig-hot';
        } else if (totalPct >= 78) {
          feedbackEl.innerHTML = '✅ <strong>GREAT OUTPUT (2 STARS ⭐⭐)!</strong> Meets mission quota!';
          feedbackEl.className = 'sa-feedback-banner sig-hot';
        } else if (cleanedCount < TOTAL_DUST_SPOTS && diff > 15) {
          feedbackEl.innerHTML = `👩‍🚀 Brush remaining dust and rotate toward ${sunAngle}°!`;
          feedbackEl.className = 'sa-feedback-banner sig-cold';
        } else if (cleanedCount < TOTAL_DUST_SPOTS) {
          feedbackEl.innerHTML = '🧹 Great angle! Now brush off the remaining grey dust spots!';
          feedbackEl.className = 'sa-feedback-banner sig-mid';
        } else {
          feedbackEl.innerHTML = `📐 Solar cells are clean! Now nudge the angle toward ${sunAngle}°!`;
          feedbackEl.className = 'sa-feedback-banner sig-warm';
        }
      }
    }

    slider.addEventListener('input', () => {
      if (paused || phase !== 'playing') return;
      panelAngle = Number(slider.value);
      updateMetrics();
    });

    container.querySelectorAll('[data-nudge]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (paused || phase !== 'playing') return;
        SOUNDS.click();
        const delta = Number(btn.dataset.nudge);
        panelAngle = Math.max(-80, Math.min(80, panelAngle + delta));
        updateMetrics();
      });
    });

    function togglePause(force) {
      SOUNDS.click();
      paused = typeof force === 'boolean' ? force : !paused;
      if (pauseOverlay) pauseOverlay.hidden = !paused;
      if (pauseBtn) {
        pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
        pauseBtn.setAttribute('aria-pressed', String(paused));
      }
    }

    keyHandler = (e) => {
      if (phase !== 'playing') return;
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
        return;
      }
      if (paused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        panelAngle = Math.max(-80, panelAngle - 2);
        updateMetrics();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        panelAngle = Math.min(80, panelAngle + 2);
        updateMetrics();
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        cleanNextSpot();
      } else if (e.key === 'Enter') {
        const activeTag = typeof document !== 'undefined' ? document.activeElement?.tagName : '';
        if (activeTag !== 'BUTTON') {
          e.preventDefault();
          lockAndFinish();
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', keyHandler);
    }

    function lockAndFinish() {
      if (paused || phase !== 'playing') return;
      renderResults();
    }

    lockBtn.addEventListener('click', () => {
      lockAndFinish();
    });

    pauseBtn?.addEventListener('click', () => togglePause());
    resumeBtn?.addEventListener('click', () => togglePause(false));
    resetBtn?.addEventListener('click', () => {
      SOUNDS.click();
      startGameplay();
    });
    helpBtn?.addEventListener('click', () => {
      SOUNDS.click();
      renderTutorial();
    });
    exitBtn?.addEventListener('click', () => exitToMission());

    renderSpots();
    updateMetrics();
  }

  function renderResults() {
    phase = 'results';
    removeWindowListeners();

    const { score, success, stars, alignPct, cleanedCount, points } = computeResultMetrics();
    const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
    const fact = NASA_SOLAR_FACTS[Math.floor(Math.random() * NASA_SOLAR_FACTS.length)];
    const pctScore = Math.round(score * 100);

    if (success) {
      SOUNDS.fanfare();
    } else {
      SOUNDS.alert();
    }

    container.innerHTML = `
      <div class="mg-card mg-results-card mg-animate-in" role="dialog" aria-label="Solar Aligner Results">
        <div class="outcome-badge">${success ? '⚡ SOLAR POWER OPTIMIZED!' : '🔋 ARRAY CALIBRATION SAVED'}</div>
        <h2>${success ? 'Outstanding Solar Engineering!' : 'Good Effort, Junior Commander!'}</h2>
        <div class="outcome-stars" aria-label="${stars} out of 3 stars">${starDisplay}</div>

        <p class="mg-intro">
          ${
            success
              ? `You achieved ${pctScore}% total electrical efficiency! Your batteries will charge at maximum speed.`
              : `You achieved ${pctScore}% efficiency (target is 78%+ for optimal charging). Try again to clean all dust spots or return to your mission.`
          }
        </p>

        <div class="outcome-stats">
          <div>⚡ Total Output: <strong>${pctScore}% (${points} pts)</strong></div>
          <div>📐 Sun Alignment: <strong>${alignPct}% Match</strong></div>
          <div>🧹 Dust Removed: <strong>${cleanedCount} / ${TOTAL_DUST_SPOTS} Spots</strong></div>
          <div>🔋 Mission Boost: <strong>${success ? '+15% Battery & +8 Science!' : '+5% Battery'}</strong></div>
        </div>

        <div class="fact-box">
          <div class="fact-tag">🔬 REAL NASA SCIENCE FACT</div>
          <p>${fact}</p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="sa-retry-btn">🔄 Fine-Tune Again (Retry)</button>
          <button type="button" class="btn btn-primary btn-lg" id="sa-done-btn">🌕 Return to Mission</button>
        </div>
      </div>
    `;

    container.querySelector('#sa-retry-btn')?.addEventListener('click', () => {
      SOUNDS.click();
      startGameplay();
    });
    container.querySelector('#sa-done-btn')?.addEventListener('click', () => {
      exitToMission();
    });
  }

  function start() {
    renderTutorial();
  }

  function destroy() {
    destroyed = true;
    removeWindowListeners();
    container.innerHTML = '';
  }

  return { start, destroy };
}
