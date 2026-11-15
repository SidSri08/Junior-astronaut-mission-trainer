// Unified Mini-Game Lifecycle Template used across training mini-games.
// Handles bounded seeded timers, calm <=8s warnings, no-timer practice steps,
// double-submit prevention, clean listener/timer cleanup, and qualityScore/speedScore output.

import { SOUNDS } from '../ui/soundFx.js';
import { computeTimingMetrics, formatTimerRange } from '../systems/TimerSystem.js';

export function createMiniGameLifecycle({
  gameId,
  title,
  badge,
  container,
  context = {},
  onComplete,
  buildPracticeHtml,
  bindPractice,
  buildPlayHtml,
  bindPlay,
  buildResultsHtml,
  evaluateResult,
  defaultMinSec = 25,
  defaultMaxSec = 36,
}) {
  let destroyed = false;
  let completed = false;
  let paused = false;
  let phase = 'briefing'; // 'briefing' | 'playing' | 'results'
  let intervalId = null;
  let lastTick = 0;
  let keyHandler = null;
  const subTimers = new Set();

  const minSec = Number(context.timerMinSec ?? defaultMinSec);
  const maxSec = Number(context.timerMaxSec ?? defaultMaxSec);
  const limitSec = Math.max(8, Math.round(Number(context.timerLimitSec ?? Math.round((minSec + maxSec) / 2))));
  let timeRemainingSec = limitSec;
  let practiceDone = false;

  const gameState = {
    practiceDone: false,
    interactions: 0,
  };

  function safeTimeout(fn, ms) {
    let remaining = ms;
    let previous = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (!paused) remaining -= now - previous;
      previous = now;
      if (remaining <= 0) {
        clearInterval(id);
        subTimers.delete(id);
        if (!destroyed && phase === 'playing') fn();
      }
    }, 50);
    subTimers.add(id);
    return id;
  }

  function clearTimer() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    subTimers.forEach((id) => clearInterval(id));
    subTimers.clear();
  }

  function removeKeys() {
    if (keyHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', keyHandler);
      keyHandler = null;
    }
  }

  function cleanup() {
    clearTimer();
    removeKeys();
  }

  function emitComplete(extra = {}) {
    if (destroyed || completed) return;
    completed = true;
    cleanup();
    const timing = computeTimingMetrics({
      elapsedSec: limitSec - timeRemainingSec,
      limitSec,
    });
    const evaluated = evaluateResult ? evaluateResult(gameState, { timing, practiceDone }) : {};
    const qualityScore = Math.max(0, Math.min(1, Number(evaluated.qualityScore ?? extra.qualityScore ?? 0.65)));
    const speedScore = timing.speedScore;
    const success = Boolean(extra.forcedSuccess ?? evaluated.success ?? qualityScore >= 0.6);
    const score = Math.round((qualityScore * 0.65 + speedScore * 0.35) * 100) / 100;

    if (typeof onComplete === 'function') {
      onComplete({
        gameId,
        scenarioId: context.scenarioId || null,
        success,
        score,
        qualityScore: Math.round(qualityScore * 100) / 100,
        speedScore: Math.round(speedScore * 100) / 100,
        timeRemainingSec: Math.round(timeRemainingSec * 10) / 10,
        timerLimitSec: limitSec,
        summary: evaluated.summary || (success ? `${title} completed!` : `${title} finished — review trade-offs.`),
      });
    }
  }

  function cancel() {
    if (destroyed || completed) return;
    completed = true;
    cleanup();
    onComplete?.({ gameId, cancelled: true, success: false, score: 0, qualityScore: 0, speedScore: 0 });
  }

  function reset() {
    cleanup();
    for (const key of Object.keys(gameState)) delete gameState[key];
    gameState.practiceDone = practiceDone;
    gameState.interactions = 0;
    timeRemainingSec = limitSec;
    paused = false;
    renderBriefing();
  }

  function renderBriefing() {
    if (destroyed) return;
    phase = 'briefing';
    paused = false;
    cleanup();
    const rangeLabel = formatTimerRange(minSec, maxSec);
    container.innerHTML = `
      <div class="mg-card mg-animate-in" role="dialog" aria-label="${title} Briefing">
        <div class="mg-header">
          <div>
            <span class="mg-badge">${badge || 'TRAINING MODULE'}</span>
            <h2>${title}</h2>
          </div>
          <button class="btn btn-ghost mg-close" type="button" data-action="close">✕ Back to Base</button>
        </div>

        <div class="mg-brief-strip">
          <div class="mg-timer-range-pill">⏱️ Window: <strong>${rangeLabel}</strong> (This run: <strong>${limitSec}s</strong>)</div>
          <div class="mg-timer-range-pill">Practice first with zero countdown pressure!</div>
        </div>

        <div class="mg-practice-box">
          ${buildPracticeHtml ? buildPracticeHtml(gameState) : ''}
        </div>

        <div class="mg-footer-actions">
          <button class="btn btn-primary btn-lg" type="button" id="mgt-start-btn">▶ Start Timed Run (${limitSec}s)</button>
        </div>
      </div>
    `;

    container.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      SOUNDS.click();
      cancel();
    });

    container.querySelector('#mgt-start-btn')?.addEventListener('click', () => {
      SOUNDS.action();
      renderPlay();
    });

    if (bindPractice) {
      bindPractice(container, gameState, {
        markPracticeDone: () => {
          practiceDone = true;
          gameState.practiceDone = true;
          SOUNDS.success('Practice step completed!');
          renderBriefing();
        },
        rerender: renderBriefing,
      });
    }
  }

  function updateTimerUI() {
    const timerEl = container.querySelector('#mgt-timer-pill');
    const warnEl = container.querySelector('#mgt-warn-caption');
    if (timerEl) {
      timerEl.textContent = `⏱️ ${Math.max(0, Math.ceil(timeRemainingSec))}s${paused ? ' (Paused)' : ''}`;
      timerEl.classList.toggle('mg-timer-warn', timeRemainingSec <= 8 && timeRemainingSec > 0);
    }
    if (warnEl) {
      warnEl.textContent =
        timeRemainingSec <= 8 && timeRemainingSec > 0
          ? 'Calm check: Under 8 seconds left — finish cleanly; quality matters more than rushing!'
          : '';
    }
  }

  function startCountdown() {
    if (intervalId) return;
    lastTick = performance.now();
    intervalId = setInterval(() => {
      const now = performance.now();
      const delta = Math.min(0.25, (now - lastTick) / 1000);
      lastTick = now;
      if (destroyed || phase !== 'playing' || paused) return;
      timeRemainingSec = Math.max(0, timeRemainingSec - delta);
      updateTimerUI();
      if (timeRemainingSec <= 0) {
        clearTimer();
        SOUNDS.alert('Timer expired — reviewing your engineering result.');
        renderResults();
      }
    }, 100);
  }

  function renderPlay() {
    if (destroyed) return;
    phase = 'playing';
    removeKeys();

    container.innerHTML = `
      <div class="mg-card mg-animate-in" role="dialog" aria-label="${title}">
        <div class="mg-header">
          <div>
            <span class="mg-badge">${badge || 'ACTIVE SIMULATION'}</span>
            <h2>${title}</h2>
          </div>
          <div class="mg-header-controls">
            <span id="mgt-timer-pill" class="mg-timer-pill ${timeRemainingSec <= 8 ? 'mg-timer-warn' : ''}">⏱️ ${Math.ceil(timeRemainingSec)}s${paused ? ' (Paused)' : ''}</span>
            <button class="btn btn-ghost btn-sm" type="button" id="mgt-pause-btn">${paused ? '▶ Resume' : '⏸ Pause'}</button>
            <button class="btn btn-ghost btn-sm" type="button" id="mgt-restart-btn">↺ Reset</button>
            <button class="btn btn-ghost mg-close" type="button" data-action="close">✕ Back</button>
          </div>
        </div>
        <div id="mgt-warn-caption" class="mg-warn-caption" aria-live="polite"></div>
        <div id="mgt-play-body" class="mg-play-body">
          ${buildPlayHtml ? buildPlayHtml(gameState) : ''}
        </div>
      </div>
    `;

    updateTimerUI();
    startCountdown();

    container.querySelector('[data-action="close"]')?.addEventListener('click', () => {
      SOUNDS.click();
      cancel();
    });

    container.querySelector('#mgt-pause-btn')?.addEventListener('click', () => {
      paused = !paused;
      SOUNDS.click();
      const btn = container.querySelector('#mgt-pause-btn');
      if (btn) btn.textContent = paused ? '▶ Resume' : '⏸ Pause';
      updateTimerUI();
      const body = container.querySelector('#mgt-play-body');
      if (body) body.inert = paused;
    });

    container.querySelector('#mgt-restart-btn')?.addEventListener('click', () => {
      SOUNDS.click();
      reset();
    });

    if (typeof window !== 'undefined') {
      keyHandler = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          paused = !paused;
          updateTimerUI();
          const body = container.querySelector('#mgt-play-body');
          if (body) body.inert = paused;
          const btn = container.querySelector('#mgt-pause-btn');
          if (btn) btn.textContent = paused ? '▶ Resume' : '⏸ Pause';
        }
      };
      window.addEventListener('keydown', keyHandler);
    }

    if (bindPlay) {
      bindPlay(container.querySelector('#mgt-play-body'), gameState, {
        rerenderPlay: () => {
          const focusedId = typeof document !== 'undefined' ? document.activeElement?.id : null;
          renderPlay();
          if (focusedId) container.querySelector(`#${focusedId}`)?.focus?.();
        },
        finishNow: () => {
          if (paused || phase !== 'playing') return;
          clearTimer();
          renderResults();
        },
        isPaused: () => paused,
        isDestroyed: () => destroyed,
        safeTimeout,
      });
    }
  }

  function renderResults() {
    if (destroyed) return;
    phase = 'results';
    cleanup();
    const timing = computeTimingMetrics({
      elapsedSec: limitSec - timeRemainingSec,
      limitSec,
    });
    const evaluated = evaluateResult ? evaluateResult(gameState, { timing, practiceDone }) : {};
    const qPct = Math.round((evaluated.qualityScore ?? 0.65) * 100);
    const sPct = Math.round(timing.speedScore * 100);
    const totalPct = Math.round(qPct * 0.65 + sPct * 0.35);

    container.innerHTML = `
      <div class="mg-card mg-animate-in" role="dialog" aria-label="${title} Debrief">
        <div class="mg-header">
          <div>
            <span class="mg-badge">DEBRIEF • ENGINEERING EVALUATION</span>
            <h2>${evaluated.success ? '🌟 ' : '🛠️ '}${title} Complete</h2>
          </div>
          <button class="btn btn-ghost mg-close" type="button" data-action="close">✕ Continue</button>
        </div>

        <div class="mg-score-split">
          <div class="mg-score-card">
            <span class="mg-score-label">Engineering Quality (65%)</span>
            <strong>${qPct}%</strong>
          </div>
          <div class="mg-score-card">
            <span class="mg-score-label">Calm Speed Bonus (35%)</span>
            <strong>${sPct}%</strong>
          </div>
          <div class="mg-score-card mg-score-card-accent">
            <span class="mg-score-label">Combined Rating</span>
            <strong>${totalPct}%</strong>
          </div>
        </div>

        ${buildResultsHtml ? buildResultsHtml(gameState, evaluated) : `<p class="mg-intro">${evaluated.summary || ''}</p>`}

        <div class="mg-footer-actions">
          <button class="btn btn-secondary" type="button" id="mgt-retry-btn">↺ Try again before applying</button>
          <button class="btn btn-primary btn-lg" type="button" id="mgt-done-btn" data-action="close">✅ Apply to Mission</button>
        </div>
      </div>
    `;

    SOUNDS[evaluated.success ? 'success' : 'click']();
    container.querySelector('#mgt-retry-btn')?.addEventListener('click', reset);

    container.querySelectorAll('[data-action="close"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        emitComplete({ forcedSuccess: evaluated.success });
      });
    });
  }

  return {
    start() {
      if (destroyed) return;
      renderBriefing();
    },
    destroy() {
      destroyed = true;
      cleanup();
      container.innerHTML = '';
    },
  };
}
