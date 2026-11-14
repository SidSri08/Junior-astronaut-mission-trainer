// C-S3 — Minigame 1: Leak Hunter (Oxygen & Pressure Sensor Educational Minigame).
// Contract: createLeakHunter({ container, context, onComplete }) -> { start(), destroy() }

export function createLeakHunter({ container, onComplete }) {
  let timerId = null;
  const timeoutIds = new Set();
  let destroyed = false;
  let timeLeft = 25;
  let leaks = [];
  let cursor = { x: 0.5, y: 0.5 };
  let probesUsed = 0;

  function randomLeaks() {
    const arr = [];
    for (let i = 0; i < 3; i++) {
      arr.push({
        id: i + 1,
        x: 0.16 + Math.random() * 0.68,
        y: 0.18 + Math.random() * 0.64,
        sealed: false,
      });
    }
    return arr;
  }

  function nearestUnsealedDist(x, y) {
    let best = Infinity;
    for (const l of leaks) {
      if (l.sealed) continue;
      const d = Math.hypot(l.x - x, l.y - y);
      if (d < best) best = d;
    }
    return best;
  }

  function finish(success) {
    if (destroyed) return;
    clearInterval(timerId);
    const sealedCount = leaks.filter((l) => l.sealed).length;
    const score = Math.min(1, sealedCount / leaks.length);
    onComplete({
      gameId: 'leakHunter',
      success,
      score,
    });
  }

  function start() {
    leaks = randomLeaks();
    container.innerHTML = `
      <div class="mg-card" role="dialog" aria-label="Leak Hunter Minigame">
        <div class="mg-header">
          <div>
            <span class="mg-badge">MINIGAME 1 · OXYGEN & PRESSURE</span>
            <h2>🔍 Leak Hunter: Ultrasonic Hull Scanner</h2>
          </div>
          <button class="btn btn-ghost mg-close" type="button" data-action="exit">✕ Exit</button>
        </div>
        <p class="mg-intro">
          In the vacuum of space, air rushes out of tiny micrometeoroid holes and makes an ultrasonic hiss!
          <strong>Move your scanner</strong> across the habitat wall to watch the signal meter, then <strong>click to fire a sealant patch</strong> when you are right on top of a leak.
        </p>
        <div class="mg-stats">
          <div class="mg-stat">⏱️ Time Left: <strong id="lh-time">${timeLeft}s</strong></div>
          <div class="mg-stat">🩹 Leaks Sealed: <strong id="lh-count">0 / ${leaks.length}</strong></div>
          <div class="mg-stat">📡 Sensor Signal: <strong id="lh-signal">Move over hull…</strong></div>
        </div>
        <div class="lh-board" id="lh-board" tabindex="0" aria-label="Habitat hull scan grid">
          <div class="lh-grid-lines"></div>
          <div class="lh-reticle" id="lh-reticle"></div>
          <div class="lh-markers" id="lh-markers"></div>
        </div>
        <div class="mg-footer">
          <span class="mg-science-note">🔬 <strong>NASA Science:</strong> On the ISS, astronauts use ultrasonic leak detectors to listen for the high-pitched hiss of escaping air in a vacuum.</span>
        </div>
      </div>
    `;

    const board = container.querySelector('#lh-board');
    const reticle = container.querySelector('#lh-reticle');
    const markers = container.querySelector('#lh-markers');
    const timeEl = container.querySelector('#lh-time');
    const countEl = container.querySelector('#lh-count');
    const signalEl = container.querySelector('#lh-signal');
    const exitBtn = container.querySelector('[data-action="exit"]');

    function updateSensor(nx, ny) {
      cursor = { x: nx, y: ny };
      reticle.style.left = `${nx * 100}%`;
      reticle.style.top = `${ny * 100}%`;
      const d = nearestUnsealedDist(nx, ny);
      if (d < 0.085) {
        signalEl.textContent = '🔴 PINPOINT! Click to seal!';
        signalEl.className = 'sig-hot';
        reticle.dataset.heat = 'pinpoint';
      } else if (d < 0.17) {
        signalEl.textContent = '🟠 HOT — Very close!';
        signalEl.className = 'sig-warm';
        reticle.dataset.heat = 'warm';
      } else if (d < 0.3) {
        signalEl.textContent = '🟡 WARM — Getting closer';
        signalEl.className = 'sig-mid';
        reticle.dataset.heat = 'mid';
      } else {
        signalEl.textContent = '🔵 COLD — Faint hiss';
        signalEl.className = 'sig-cold';
        reticle.dataset.heat = 'cold';
      }
    }

    function renderMarkers() {
      markers.innerHTML = leaks
        .filter((l) => l.sealed)
        .map(
          (l) =>
            `<div class="lh-patch" style="left:${l.x * 100}%;top:${l.y * 100}%">✅ Sealed</div>`
        )
        .join('');
      const sealed = leaks.filter((l) => l.sealed).length;
      countEl.textContent = `${sealed} / ${leaks.length}`;
      if (sealed >= leaks.length) {
        signalEl.textContent = '🎉 All hull leaks sealed!';
        timeoutIds.add(setTimeout(() => finish(true), 450));
      }
    }

    board.addEventListener('pointermove', (e) => {
      const rect = board.getBoundingClientRect();
      const nx = Math.max(0.03, Math.min(0.97, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0.03, Math.min(0.97, (e.clientY - rect.top) / rect.height));
      updateSensor(nx, ny);
    });

    board.addEventListener('click', (e) => {
      const rect = board.getBoundingClientRect();
      const nx = Math.max(0.03, Math.min(0.97, (e.clientX - rect.left) / rect.width));
      const ny = Math.max(0.03, Math.min(0.97, (e.clientY - rect.top) / rect.height));
      updateSensor(nx, ny);
      probesUsed += 1;

      let hit = null;
      for (const l of leaks) {
        if (!l.sealed && Math.hypot(l.x - nx, l.y - ny) < 0.095) {
          hit = l;
          break;
        }
      }
      if (hit) {
        hit.sealed = true;
        renderMarkers();
        updateSensor(nx, ny);
      } else {
        const pulse = document.createElement('div');
        pulse.className = 'lh-miss-ping';
        pulse.style.left = `${nx * 100}%`;
        pulse.style.top = `${ny * 100}%`;
        markers.appendChild(pulse);
        timeoutIds.add(setTimeout(() => pulse.remove(), 600));
      }
    });

    exitBtn.addEventListener('click', () => {
      const sealed = leaks.filter((l) => l.sealed).length;
      finish(sealed === leaks.length);
    });

    timerId = setInterval(() => {
      timeLeft -= 1;
      if (timeEl) timeEl.textContent = `${Math.max(0, timeLeft)}s`;
      if (timeLeft <= 0) {
        const sealed = leaks.filter((l) => l.sealed).length;
        finish(sealed === leaks.length);
      }
    }, 1000);
  }

  function destroy() {
    destroyed = true;
    clearInterval(timerId);
    timeoutIds.forEach((id) => clearTimeout(id));
    timeoutIds.clear();
    container.innerHTML = '';
  }

  return { start, destroy };
}

