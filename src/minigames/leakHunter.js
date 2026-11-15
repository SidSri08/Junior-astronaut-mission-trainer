// C-S3 — Minigame 1: Leak Hunter (Oxygen & Pressure Sensor Educational Minigame).
// Contract: createLeakHunter({ container, context, onComplete }) -> { start(), destroy() }

import { SOUNDS } from '../ui/soundFx.js';

const LEAK_TYPES = [
  { label: 'Airlock Seam Crack', hitRadius: 0.105, points: 300 },
  { label: 'Window Seal Micro-Leak', hitRadius: 0.095, points: 350 },
  { label: 'Meteoroid Pinhole', hitRadius: 0.088, points: 450 },
];

const NASA_LEAK_FACTS = [
  'On the International Space Station, escaping air makes a high-pitched ultrasonic whistle too high for human ears—so astronauts use special ultrasonic microphones to hunt down tiny leaks!',
  'Space is a vacuum with zero air pressure! Even a tiny 2-millimeter hole lets precious breathing oxygen rush out into space until astronauts seal it with a tough epoxy patch.',
  'NASA’s Artemis lunar habitats use multi-layer "Whipple shields" on the outside to stop tiny fast micrometeoroids before they can poke holes in the inner air wall!',
];

export function createLeakHunter({ container, onComplete }) {
  let timerId = null;
  const timeoutIds = new Set();
  let keyHandler = null;
  let destroyed = false;

  const TOTAL_TIME = 30;
  let timeLeft = TOTAL_TIME;
  let paused = false;
  let phase = 'tutorial'; // 'tutorial' | 'playing' | 'results'
  let leaks = [];
  let cursor = { x: 0.5, y: 0.5 };
  let probesUsed = 0;
  let bonusPoints = 0;
  let tutorialPracticeSealed = false;
  let lastScanSoundTime = 0;

  function safeTimeout(fn, ms) {
    const id = setTimeout(() => {
      timeoutIds.delete(id);
      if (!destroyed) fn();
    }, ms);
    timeoutIds.add(id);
    return id;
  }

  function clearAllTimers() {
    if (timerId) {
      clearInterval(timerId);
      timerId = null;
    }
    timeoutIds.forEach((id) => clearTimeout(id));
    timeoutIds.clear();
  }

  function removeKeyHandler() {
    if (keyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  function generateLeaks() {
    const arr = [];
    const zones = [
      { minX: 0.14, maxX: 0.36, minY: 0.2, maxY: 0.78 },
      { minX: 0.4, maxX: 0.62, minY: 0.18, maxY: 0.78 },
      { minX: 0.66, maxX: 0.86, minY: 0.2, maxY: 0.78 },
    ];
    for (let i = 0; i < 3; i++) {
      const z = zones[i];
      const spec = LEAK_TYPES[i];
      arr.push({
        id: i + 1,
        label: spec.label,
        hitRadius: spec.hitRadius,
        points: spec.points,
        x: z.minX + Math.random() * (z.maxX - z.minX),
        y: z.minY + Math.random() * (z.maxY - z.minY),
        sealed: false,
      });
    }
    return arr;
  }

  function nearestUnsealed(x, y) {
    let bestLeak = null;
    let bestDist = Infinity;
    for (const l of leaks) {
      if (l.sealed) continue;
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestLeak = l;
      }
    }
    return { leak: bestLeak, dist: bestDist };
  }

  function computeResultMetrics() {
    const sealedCount = leaks.filter((l) => l.sealed).length;
    const baseRatio = sealedCount / Math.max(1, leaks.length);
    const timeBonus = sealedCount === leaks.length ? Math.min(0.15, (timeLeft / TOTAL_TIME) * 0.15) : 0;
    const score = Math.max(0, Math.min(1, Number((baseRatio * 0.9 + timeBonus).toFixed(2))));
    const success = sealedCount === leaks.length;
    const stars = sealedCount === 3 && timeLeft >= 10 ? 3 : sealedCount >= 2 ? 2 : sealedCount >= 1 ? 1 : 0;
    const totalPoints =
      leaks.filter((l) => l.sealed).reduce((acc, l) => acc + l.points, 0) +
      (success ? timeLeft * 25 : 0) +
      bonusPoints;
    return { sealedCount, score, success, stars, totalPoints };
  }

  function exitToMission() {
    if (destroyed) return;
    SOUNDS.click();
    clearAllTimers();
    removeKeyHandler();
    const { success, score } = computeResultMetrics();
    onComplete({
      gameId: 'leakHunter',
      success,
      score,
    });
  }

  function renderTutorial() {
    phase = 'tutorial';
    clearAllTimers();
    removeKeyHandler();

    container.innerHTML = `
      <div class="mg-card mg-animate-in" role="dialog" aria-label="Leak Hunter Tutorial">
        <div class="mg-header">
          <div>
            <span class="mg-badge">MINIGAME 1 · INTERACTIVE TUTORIAL</span>
            <h2>🔍 Leak Hunter: Ultrasonic Hull Scanner</h2>
          </div>
          <button class="btn btn-ghost mg-close" type="button" data-action="close">✕ Back to Base</button>
        </div>

        <p class="mg-intro">
          Emergency alert! Micrometeoroids poked <strong>3 tiny air leaks</strong> in our Moon habitat wall!
          Use your ultrasonic directional microphone to find the hissing sounds and seal them tight.
        </p>

        <div class="mg-tutorial-steps" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
          <div class="mg-tut-step" style="background:rgba(16,27,43,0.85);border:1px solid var(--panel-border-subtle);border-radius:var(--radius-sm);padding:10px;">
            <div style="font-size:1.4rem;margin-bottom:4px;">📡</div>
            <strong style="font-size:0.82rem;">1. Move Ultrasonic Scanner</strong>
            <p style="font-size:0.74rem;color:var(--text-muted);margin:4px 0 0 0;line-height:1.35;">Slide your mouse, tap with touch, or use Arrow / WASD keys across the blue habitat wall grid.</p>
          </div>
          <div class="mg-tut-step" style="background:rgba(16,27,43,0.85);border:1px solid var(--panel-border-subtle);border-radius:var(--radius-sm);padding:10px;">
            <div style="font-size:1.4rem;margin-bottom:4px;">🎯</div>
            <strong style="font-size:0.82rem;">2. Follow Signal Compass</strong>
            <p style="font-size:0.74rem;color:var(--text-muted);margin:4px 0 0 0;line-height:1.35;">
              <span class="sig-cold">🔵 Cold</span> = Far ·
              <span class="sig-mid">🟡 Warm</span> = Close ·
              <span class="sig-hot">🔴 PINPOINT!</span> = Right on top!
            </p>
          </div>
          <div class="mg-tut-step" style="background:rgba(16,27,43,0.85);border:1px solid var(--panel-border-subtle);border-radius:var(--radius-sm);padding:10px;">
            <div style="font-size:1.4rem;margin-bottom:4px;">🩹</div>
            <strong style="font-size:0.82rem;">3. Click or Space to Seal</strong>
            <p style="font-size:0.74rem;color:var(--text-muted);margin:4px 0 0 0;line-height:1.35;">When your sensor ring glows <strong class="sig-hot">PINPOINT</strong>, click or press Space to fire a permanent epoxy patch!</p>
          </div>
        </div>

        <div class="mg-practice-box" style="background:rgba(16,27,43,0.9);border:1px dashed var(--accent-primary);border-radius:var(--radius-md);padding:12px;margin-bottom:14px;">
          <div style="font-size:0.8rem;margin-bottom:8px;">
            🎯 <strong>Interactive Practice:</strong> Click the hissing leak spot below to test your patch launcher!
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
            <button type="button" class="btn ${tutorialPracticeSealed ? 'btn-secondary' : 'btn-primary btn-pulse'}" id="lh-practice-btn">
              ${tutorialPracticeSealed ? '✅ Test Leak Sealed!' : '💨 Hissing Test Leak — Click Me!'}
            </button>
            <span id="lh-practice-status" class="mg-practice-feedback ${tutorialPracticeSealed ? 'sig-hot' : ''}" style="font-size:0.8rem;">
              ${tutorialPracticeSealed ? '🎉 Bullseye! You are ready to scan the actual Moon base hull!' : 'Waiting for your test patch…'}
            </span>
          </div>
        </div>

        <div class="mg-actions-row">
          <span class="mg-science-note">💡 <strong>NASA Tip:</strong> Watch the little arrow inside your scanner ring—it points straight to the leak!</span>
          <div class="mg-btn-group">
            <button type="button" class="btn btn-primary btn-lg" id="lh-start-btn">🚀 Start Scanner (30s Timer)</button>
          </div>
        </div>
      </div>
    `;

    const practiceBtn = container.querySelector('#lh-practice-btn');
    const practiceStatus = container.querySelector('#lh-practice-status');
    practiceBtn?.addEventListener('click', () => {
      SOUNDS.patch();
      tutorialPracticeSealed = true;
      practiceBtn.className = 'btn btn-secondary';
      practiceBtn.textContent = '✅ Test Leak Sealed!';
      if (practiceStatus) {
        practiceStatus.textContent = '🎉 Bullseye! You are ready to scan the actual Moon base hull!';
        practiceStatus.className = 'mg-practice-feedback sig-hot';
      }
    });

    container.querySelector('#lh-start-btn')?.addEventListener('click', () => {
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
    timeLeft = TOTAL_TIME;
    probesUsed = 0;
    bonusPoints = tutorialPracticeSealed ? 50 : 0;
    leaks = generateLeaks();
    cursor = { x: 0.5, y: 0.5 };
    clearAllTimers();
    removeKeyHandler();

    container.innerHTML = `
      <div class="mg-card mg-animate-in" role="dialog" aria-label="Leak Hunter Minigame">
        <div class="mg-header">
          <div>
            <span class="mg-badge">MINIGAME 1 · OXYGEN & HULL PRESSURE</span>
            <h2>🔍 Leak Hunter: Ultrasonic Hull Scanner</h2>
          </div>
          <div class="mg-header-btns" style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-mini" type="button" id="lh-help-btn" title="How to Play">❓ Help</button>
            <button class="btn btn-secondary btn-mini" type="button" id="lh-pause-btn">⏸ Pause</button>
            <button class="btn btn-ghost btn-mini" type="button" data-action="exit">✕ Exit</button>
          </div>
        </div>

        <p class="mg-intro">
          Move your scanner across the hull wall! Follow the <strong>compass arrow</strong> and signal meter until it says
          <strong class="sig-hot">🔴 PINPOINT!</strong>, then <strong>click (or press Space)</strong> to seal all 3 air leaks!
        </p>

        <div class="mg-stats">
          <div class="mg-stat">⏱️ Time Left: <strong id="lh-time">${timeLeft}s</strong></div>
          <div class="mg-stat">🩹 Leaks Sealed: <strong id="lh-count">0 / ${leaks.length}</strong></div>
          <div class="mg-stat" style="display:inline-flex;align-items:center;gap:6px;">
            📡 Ultrasonic Signal: <strong id="lh-signal" class="sig-cold">Move scanner…</strong>
            <svg class="rive-wave-gauge" id="lh-wave-svg" data-rive-state="cold" width="60" height="18" viewBox="0 0 64 20" aria-hidden="true">
              <path id="lh-wave-path" d="M 2 10 Q 10 8, 18 10 T 34 10 T 50 10 T 62 10" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>

        <div class="mg-progress-strip">
          <div class="mg-progress-fill" id="lh-time-bar" style="width:100%"></div>
        </div>

        <div class="lh-board" id="lh-board" tabindex="0" aria-label="Habitat hull scan grid">
          <div class="lh-grid-lines"></div>
          <div class="lh-vapor-layer" id="lh-vapor"></div>
          <div class="lh-markers" id="lh-markers"></div>
          <div class="lh-reticle" id="lh-reticle" data-heat="cold">
            <div class="lh-reticle-ring"></div>
            <div class="lh-reticle-arrow" id="lh-arrow">➤</div>
          </div>
          <div class="lh-feedback-banner" id="lh-feedback">👩‍🚀 Move your scanner over the wall to detect the ultrasonic hiss!</div>
          <div class="mg-pause-overlay" id="lh-pause-overlay" style="position:absolute;inset:0;background:rgba(7,13,24,0.92);display:flex;align-items:center;justify-content:center;z-index:20;" hidden>
            <div class="mg-pause-box" style="text-align:center;padding:16px;">
              <h3>⏸ Game Paused</h3>
              <p style="color:var(--text-muted);font-size:0.84rem;">Timer is paused. Take your time, Junior Commander!</p>
              <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <button type="button" class="btn btn-primary" id="lh-resume-btn">▶ Resume Scanning</button>
                <button type="button" class="btn btn-secondary" id="lh-restart-btn">🔄 Restart Game</button>
              </div>
            </div>
          </div>
        </div>

        <div class="mg-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;">
          <span class="mg-science-note">🔬 <strong>NASA Science:</strong> Escaping air in vacuum creates high-frequency ultrasonic waves!</span>
          <span style="font-family:var(--font-mono);font-size:0.72rem;color:var(--text-muted);" id="lh-coords">FREQ: 39.4 kHz</span>
        </div>
      </div>
    `;

    const board = container.querySelector('#lh-board');
    const reticle = container.querySelector('#lh-reticle');
    const arrowEl = container.querySelector('#lh-arrow');
    const markers = container.querySelector('#lh-markers');
    const vaporEl = container.querySelector('#lh-vapor');
    const timeEl = container.querySelector('#lh-time');
    const timeBarEl = container.querySelector('#lh-time-bar');
    const countEl = container.querySelector('#lh-count');
    const signalEl = container.querySelector('#lh-signal');
    const coordsEl = container.querySelector('#lh-coords');
    const waveSvgEl = container.querySelector('#lh-wave-svg');
    const wavePathEl = container.querySelector('#lh-wave-path');
    const feedbackEl = container.querySelector('#lh-feedback');
    const pauseBtn = container.querySelector('#lh-pause-btn');
    const pauseOverlay = container.querySelector('#lh-pause-overlay');
    const resumeBtn = container.querySelector('#lh-resume-btn');
    const restartBtn = container.querySelector('#lh-restart-btn');
    const helpBtn = container.querySelector('#lh-help-btn');
    const exitBtn = container.querySelector('[data-action="exit"]');

    function updateRiveWaveform(state) {
      if (!waveSvgEl || !wavePathEl) return;
      waveSvgEl.dataset.riveState = state;
      if (state === 'pinpoint' || state === 'celebrate') {
        wavePathEl.setAttribute('d', 'M 2 10 Q 6 1, 10 10 T 18 10 T 26 10 T 34 10 T 42 10 T 50 10 T 58 10 T 62 10');
      } else if (state === 'warm') {
        wavePathEl.setAttribute('d', 'M 2 10 Q 8 3, 14 10 T 26 10 T 38 10 T 50 10 T 62 10');
      } else if (state === 'mid') {
        wavePathEl.setAttribute('d', 'M 2 10 Q 9 6, 16 10 T 30 10 T 44 10 T 58 10');
      } else {
        wavePathEl.setAttribute('d', 'M 2 10 Q 10 8.5, 18 10 T 34 10 T 50 10 T 62 10');
      }
    }

    function setFeedback(text, kind = 'info') {
      if (!feedbackEl) return;
      feedbackEl.textContent = text;
      feedbackEl.className = `lh-feedback-banner is-${kind}`;
    }

    function updateSensor(nx, ny) {
      cursor = { x: nx, y: ny };
      reticle.style.left = `${nx * 100}%`;
      reticle.style.top = `${ny * 100}%`;

      if (coordsEl) {
        coordsEl.textContent = `X: ${Math.round(nx * 100)}% · Y: ${Math.round(ny * 100)}% | 39.4 kHz`;
      }

      const now = Date.now();
      if (now - lastScanSoundTime > 320) {
        lastScanSoundTime = now;
        SOUNDS.scan();
      }

      const { leak, dist } = nearestUnsealed(nx, ny);
      if (!leak) {
        signalEl.textContent = '🎉 ALL LEAKS SEALED!';
        signalEl.className = 'sig-hot';
        reticle.dataset.heat = 'pinpoint';
        updateRiveWaveform('celebrate');
        if (arrowEl) arrowEl.style.opacity = '0';
        return;
      }

      if (arrowEl) {
        const angleDeg = (Math.atan2(leak.y - ny, leak.x - nx) * 180) / Math.PI;
        arrowEl.style.transform = `rotate(${angleDeg}deg)`;
        arrowEl.style.opacity = dist < leak.hitRadius * 0.85 ? '0' : '0.85';
      }

      if (vaporEl) {
        if (dist < 0.22) {
          vaporEl.innerHTML = `<div class="lh-hiss-glow" style="position:absolute;left:${leak.x * 100}%;top:${leak.y * 100}%;width:24px;height:24px;border-radius:50%;background:rgba(56,189,248,0.3);transform:translate(-50%,-50%);opacity:${Math.max(0.18, 1 - dist * 3.8)};animation:gentlePulse 1s infinite;"></div>`;
        } else {
          vaporEl.innerHTML = '';
        }
      }

      if (dist < leak.hitRadius) {
        signalEl.textContent = '🔴 PINPOINT! Click to Seal!';
        signalEl.className = 'sig-hot';
        reticle.dataset.heat = 'pinpoint';
        updateRiveWaveform('pinpoint');
      } else if (dist < 0.18) {
        signalEl.textContent = '🟠 HOT — Very close! Follow arrow!';
        signalEl.className = 'sig-warm';
        reticle.dataset.heat = 'warm';
        updateRiveWaveform('warm');
      } else if (dist < 0.32) {
        signalEl.textContent = '🟡 WARM — Getting closer';
        signalEl.className = 'sig-mid';
        reticle.dataset.heat = 'mid';
        updateRiveWaveform('mid');
      } else {
        signalEl.textContent = '🔵 COLD — Follow the arrow';
        signalEl.className = 'sig-cold';
        reticle.dataset.heat = 'cold';
        updateRiveWaveform('cold');
      }
    }

    function renderMarkers() {
      markers.innerHTML = leaks
        .filter((l) => l.sealed)
        .map(
          (l) =>
            `<div class="lh-patch" style="left:${l.x * 100}%;top:${l.y * 100}%">✅ ${l.label} Sealed!</div>`
        )
        .join('');
      const sealed = leaks.filter((l) => l.sealed).length;
      countEl.textContent = `${sealed} / ${leaks.length}`;
      if (sealed >= leaks.length) {
        SOUNDS.fanfare();
        setFeedback('🎉 Amazing job, Commander! All 3 hull leaks are sealed tight!', 'good');
        safeTimeout(() => renderResults(), 650);
      }
    }

    function attemptPatchAt(nx, ny) {
      if (paused || phase !== 'playing') return;
      updateSensor(nx, ny);
      probesUsed += 1;

      let hit = null;
      for (const l of leaks) {
        if (!l.sealed && Math.hypot(l.x - nx, l.y - ny) < l.hitRadius) {
          hit = l;
          break;
        }
      }

      if (hit) {
        SOUNDS.patch();
        hit.sealed = true;
        const remaining = leaks.filter((l) => !l.sealed).length;
        setFeedback(
          remaining > 0
            ? `🌟 Great patch! Sealed "${hit.label}" (+${hit.points} pts)! ${remaining} left!`
            : `🎉 Bullseye! All 3 hull leaks patched! Hull pressure is 100% stable!`,
          'good'
        );
        renderMarkers();
        updateSensor(nx, ny);
      } else {
        SOUNDS.click();
        const { dist } = nearestUnsealed(nx, ny);
        setFeedback(
          dist < 0.2
            ? '🟠 So close! Nudge your scanner toward the arrow until it says PINPOINT!'
            : '🔵 No leak right there—follow the arrow inside your scanner ring!',
          'warn'
        );
        const pulse = document.createElement('div');
        pulse.className = 'lh-miss-ping';
        pulse.style.position = 'absolute';
        pulse.style.width = '18px';
        pulse.style.height = '18px';
        pulse.style.borderRadius = '50%';
        pulse.style.border = '2px solid rgba(241,107,112,0.8)';
        pulse.style.left = `${nx * 100}%`;
        pulse.style.top = `${ny * 100}%`;
        pulse.style.transform = 'translate(-50%, -50%)';
        pulse.style.pointerEvents = 'none';
        markers.appendChild(pulse);
        safeTimeout(() => pulse.remove(), 600);
      }
    }

    function getNormalizedCoords(e) {
      const rect = board.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        return { nx: cursor.x, ny: cursor.y };
      }
      const nx = Math.max(0.04, Math.min(0.96, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0.04, Math.min(0.96, (e.clientY - rect.top) / rect.height));
      return { nx, ny };
    }

    board.addEventListener('pointermove', (e) => {
      if (paused || phase !== 'playing') return;
      const { nx, ny } = getNormalizedCoords(e);
      updateSensor(nx, ny);
    });

    board.addEventListener('click', (e) => {
      if (paused || phase !== 'playing') return;
      const { nx, ny } = getNormalizedCoords(e);
      attemptPatchAt(nx, ny);
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
      const step = 0.045;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        updateSensor(Math.max(0.04, cursor.x - step), cursor.y);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        updateSensor(Math.min(0.96, cursor.x + step), cursor.y);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        updateSensor(cursor.x, Math.max(0.04, cursor.y - step));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        updateSensor(cursor.x, Math.min(0.96, cursor.y + step));
      } else if (e.key === ' ' || e.key === 'Enter') {
        const activeTag = typeof document !== 'undefined' ? document.activeElement?.tagName : '';
        if (document.activeElement === board || activeTag !== 'BUTTON') {
          e.preventDefault();
          attemptPatchAt(cursor.x, cursor.y);
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', keyHandler);
    }

    pauseBtn?.addEventListener('click', () => togglePause());
    resumeBtn?.addEventListener('click', () => togglePause(false));
    restartBtn?.addEventListener('click', () => {
      SOUNDS.click();
      startGameplay();
    });
    helpBtn?.addEventListener('click', () => {
      SOUNDS.click();
      renderTutorial();
    });
    exitBtn?.addEventListener('click', () => exitToMission());

    updateSensor(0.5, 0.5);

    timerId = setInterval(() => {
      if (paused || phase !== 'playing') return;
      timeLeft -= 1;
      if (timeEl) timeEl.textContent = `${Math.max(0, timeLeft)}s`;
      if (timeBarEl) {
        const pct = Math.max(0, (timeLeft / TOTAL_TIME) * 100);
        timeBarEl.style.width = `${pct}%`;
      }
      if (timeLeft <= 0) {
        renderResults();
      }
    }, 1000);
  }

  function renderResults() {
    phase = 'results';
    clearAllTimers();
    removeKeyHandler();

    const { sealedCount, score, success, stars, totalPoints } = computeResultMetrics();
    const starDisplay = '⭐'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
    const fact = NASA_LEAK_FACTS[sealedCount % NASA_LEAK_FACTS.length];
    const pctScore = Math.round(score * 100);

    if (success) {
      SOUNDS.fanfare();
    } else {
      SOUNDS.alert();
    }

    container.innerHTML = `
      <div class="mg-card mg-results-card mg-animate-in" role="dialog" aria-label="Leak Hunter Results">
        <div class="outcome-badge">${success ? '🎉 HULL PRESSURE RESTORED!' : '🛠️ SCAN COMPLETE'}</div>
        <h2>${success ? 'Awesome Job, Leak Hunter!' : 'Good Effort, Junior Commander!'}</h2>
        <div class="outcome-stars" aria-label="${stars} out of 3 stars">${starDisplay}</div>

        <p class="mg-intro">
          ${
            success
              ? 'You tracked down every ultrasonic hiss and sealed the habitat hull! Your astronauts have plenty of fresh breathing air.'
              : `You sealed ${sealedCount} out of ${leaks.length} leaks! Try again to catch all 3 leaks, or return to your Moon base.`
          }
        </p>

        <div class="outcome-stats">
          <div>🏆 Final Score: <strong>${pctScore}% (${totalPoints} pts)</strong></div>
          <div>🩹 Leaks Sealed: <strong>${sealedCount} / ${leaks.length}</strong></div>
          <div>⏱️ Time Left: <strong>${Math.max(0, timeLeft)}s</strong></div>
          <div>💨 Mission Reward: <strong>${success ? '+12% Air & +8 Science!' : '+3% Air'}</strong></div>
        </div>

        <div class="fact-box">
          <div class="fact-tag">🔬 REAL NASA SCIENCE FACT</div>
          <p>${fact}</p>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" id="lh-retry-btn">🔄 Play Again (Retry)</button>
          <button type="button" class="btn btn-primary btn-lg" id="lh-done-btn">🌕 Return to Mission</button>
        </div>
      </div>
    `;

    container.querySelector('#lh-retry-btn')?.addEventListener('click', () => {
      SOUNDS.click();
      startGameplay();
    });
    container.querySelector('#lh-done-btn')?.addEventListener('click', () => {
      exitToMission();
    });
  }

  function start() {
    renderTutorial();
  }

  function destroy() {
    destroyed = true;
    clearAllTimers();
    removeKeyHandler();
    container.innerHTML = '';
  }

  return { start, destroy };
}
