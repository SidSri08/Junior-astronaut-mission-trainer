// C-S3 — Minigame 2: Solar Aligner (Cosine Law & Lunar Dust Cleaning Educational Minigame).
// Contract: createSolarAligner({ container, context, onComplete }) -> { start(), destroy() }

export function createSolarAligner({ container, onComplete }) {
  let destroyed = false;
  let sunAngle = -35; // -70..+70 deg along south-pole horizon
  let panelAngle = 25;
  let dustCleaned = 0; // 0..100%
  const TOTAL_DUST_SPOTS = 6;
  let spots = [];

  function makeSpots() {
    spots = [];
    for (let i = 0; i < TOTAL_DUST_SPOTS; i++) {
      spots.push({
        id: i,
        x: 14 + (i % 3) * 32 + (Math.random() * 8 - 4),
        y: 22 + Math.floor(i / 3) * 44 + (Math.random() * 8 - 4),
        cleaned: false,
      });
    }
  }

  function computeAlignment() {
    const diffRad = ((panelAngle - sunAngle) * Math.PI) / 180;
    return Math.max(0, Math.cos(diffRad));
  }

  function computeCleanFraction() {
    const cleaned = spots.filter((s) => s.cleaned).length;
    return cleaned / spots.length;
  }

  function computeTotalEfficiency() {
    const align = computeAlignment();
    const cleanFactor = 0.4 + 0.6 * computeCleanFraction();
    return align * cleanFactor;
  }

  function finish() {
    if (destroyed) return;
    const score = Math.max(0, Math.min(1, computeTotalEfficiency()));
    const success = score >= 0.78;
    onComplete({
      gameId: 'solarAligner',
      success,
      score,
    });
  }

  function start() {
    // Pick a fresh target sun azimuth at the lunar south pole horizon
    sunAngle = Math.round(-55 + Math.random() * 110);
    if (Math.abs(sunAngle - panelAngle) < 25) {
      panelAngle = sunAngle > 0 ? -45 : 45;
    }
    makeSpots();

    container.innerHTML = `
      <div class="mg-card" role="dialog" aria-label="Solar Aligner Minigame">
        <div class="mg-header">
          <div>
            <span class="mg-badge">MINIGAME 2 · SOLAR POWER & COSINE LAW</span>
            <h2>☀️ Solar Aligner: South Pole Array Tuner</h2>
          </div>
          <button class="btn btn-ghost mg-close" type="button" data-action="exit">✕ Close</button>
        </div>
        <p class="mg-intro">
          At the Moon’s South Pole, the Sun skims low along the horizon!
          <strong>Step 1:</strong> Tap the grey Moon-dust patches on the solar panel to brush them clean.
          <strong>Step 2:</strong> Rotate the vertical array until it faces the Sun directly (0° error = 100% cosine power).
        </p>

        <div class="mg-stats">
          <div class="mg-stat">🌞 Sun Direction: <strong id="sa-sun">${sunAngle}°</strong></div>
          <div class="mg-stat">📐 Angle Alignment: <strong id="sa-align">0%</strong></div>
          <div class="mg-stat">🧹 Dust Cleaned: <strong id="sa-dust">0 / ${TOTAL_DUST_SPOTS}</strong></div>
          <div class="mg-stat">⚡ Total Output: <strong id="sa-total">0%</strong></div>
        </div>

        <div class="sa-workspace">
          <div class="sa-compass-box">
            <div class="sa-compass" id="sa-compass">
              <div class="sa-sun-ray" id="sa-sun-ray">☀️ SUN</div>
              <div class="sa-panel-bar" id="sa-panel-bar">
                <div class="sa-panel-normal">▲ Panel Front</div>
              </div>
            </div>
            <label class="sa-slider-label" for="sa-slider">
              Rotate Vertical Solar Array: <span id="sa-angle-val">${panelAngle}°</span>
            </label>
            <input id="sa-slider" class="sa-slider" type="range" min="-80" max="80" step="1" value="${panelAngle}" />
          </div>

          <div class="sa-panel-box">
            <div class="sa-panel-title">🧹 Click Clingy Moon Dust Patches to Brush Clean:</div>
            <div class="sa-solar-grid" id="sa-spots"></div>
          </div>
        </div>

        <div class="mg-actions-row">
          <span class="mg-science-note">🔬 <strong>NASA Science:</strong> Power follows the <em>cosine law</em>: P = P<sub>max</sub> × cos(θ). Facing the Sun directly (0°) gives maximum electricity!</span>
          <button class="btn btn-primary" type="button" id="sa-lock">⚡ Lock Array & Apply Power</button>
        </div>
      </div>
    `;

    const slider = container.querySelector('#sa-slider');
    const angleVal = container.querySelector('#sa-angle-val');
    const alignEl = container.querySelector('#sa-align');
    const dustEl = container.querySelector('#sa-dust');
    const totalEl = container.querySelector('#sa-total');
    const sunRay = container.querySelector('#sa-sun-ray');
    const panelBar = container.querySelector('#sa-panel-bar');
    const spotsBox = container.querySelector('#sa-spots');
    const lockBtn = container.querySelector('#sa-lock');
    const exitBtn = container.querySelector('[data-action="exit"]');

    sunRay.style.transform = `translate(-50%, -50%) rotate(${sunAngle}deg) translateY(-68px)`;

    function renderSpots() {
      spotsBox.innerHTML = spots
        .map(
          (s) => `
          <button type="button" class="sa-dust-spot ${s.cleaned ? 'is-clean' : ''}" data-spot="${s.id}" style="left:${s.x}%;top:${s.y}%">
            ${s.cleaned ? '✨' : '🌫️ Dust'}
          </button>
        `
        )
        .join('');
      spotsBox.querySelectorAll('[data-spot]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = Number(btn.dataset.spot);
          const sp = spots.find((x) => x.id === id);
          if (sp && !sp.cleaned) {
            sp.cleaned = true;
            renderSpots();
            updateReadout();
          }
        });
      });
    }

    function updateReadout() {
      panelBar.style.transform = `translate(-50%, -50%) rotate(${panelAngle}deg)`;
      angleVal.textContent = `${panelAngle}°`;
      const alignPct = Math.round(computeAlignment() * 100);
      const cleanedCount = spots.filter((s) => s.cleaned).length;
      const totalPct = Math.round(computeTotalEfficiency() * 100);
      alignEl.textContent = `${alignPct}%`;
      dustEl.textContent = `${cleanedCount} / ${TOTAL_DUST_SPOTS}`;
      totalEl.textContent = `${totalPct}%`;
      totalEl.className = totalPct >= 80 ? 'sig-hot' : totalPct >= 55 ? 'sig-warm' : 'sig-cold';
    }

    slider.addEventListener('input', () => {
      panelAngle = Number(slider.value);
      updateReadout();
    });

    lockBtn.addEventListener('click', () => finish());
    exitBtn.addEventListener('click', () => finish());

    renderSpots();
    updateReadout();
  }

  function destroy() {
    destroyed = true;
    container.innerHTML = '';
  }

  return { start, destroy };
}

