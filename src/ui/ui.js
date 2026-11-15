// B-S3 — DOM-based HUD, Building Inspector, Event Decision Modal, Tutorial,
// Science Field Guide, and Mission Outcome Screens.
// Consumes read-only snapshots from `store` and dispatches named actions; never computes resource math.

import { BALANCE } from '../data/gameBalance.js';
import { MISSION_EVENTS } from '../data/missionEvents.js';
import { OBJECTIVES } from '../data/objectives.js';
import { FACTS, SOURCES, factsFor } from '../data/scienceFacts.js';
import {
  TUTORIAL_STEPS,
  BUILDING_INFO,
  RESOURCE_HELP,
  GLOSSARY,
  getContextualHint,
} from '../data/educationContent.js';

const BUILDING_ORDER = ['habitat', 'lifeSupport', 'solar', 'greenhouse', 'lab'];

function pct(v) {
  return `${Math.round(v)}%`;
}

function barClass(value, invert = false) {
  if (invert) {
    if (value >= 70) return 'bar-fill is-bad';
    if (value >= 40) return 'bar-fill is-warn';
    return 'bar-fill is-good';
  }
  if (value <= 25) return 'bar-fill is-bad';
  if (value <= 50) return 'bar-fill is-warn';
  return 'bar-fill is-good';
}

// Rive-style state-machine vector avatar ("Commander Astro") with state-driven visor & antenna
function renderCommanderVectorAvatar(stateKind = 'info') {
  const palette =
    stateKind === 'bad'
      ? { glow: '#ef4444', visor: '#fecaca', mouth: 'M14 23 Q18 20 22 23' }
      : stateKind === 'warn'
      ? { glow: '#f59e0b', visor: '#fde68a', mouth: 'M14 22 L22 22' }
      : stateKind === 'good'
      ? { glow: '#4ade80', visor: '#bbf7d0', mouth: 'M13 21 Q18 25 23 21' }
      : { glow: '#38bdf8', visor: '#bae6fd', mouth: 'M14 21 Q18 24 22 21' };

  return `
    <svg class="rive-astro-avatar is-${stateKind}" viewBox="0 0 36 36" width="30" height="30" aria-hidden="true">
      <line x1="18" y1="2" x2="18" y2="7" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <circle class="rive-antenna-bulb" cx="18" cy="2.5" r="2.5" fill="${palette.glow}"/>
      <circle cx="18" cy="19" r="12.5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="8.5" y="12" width="19" height="13" rx="6.5" fill="#0f172a" stroke="${palette.glow}" stroke-width="1.4"/>
      <circle class="rive-eye" cx="14" cy="17.5" r="1.6" fill="${palette.visor}"/>
      <circle class="rive-eye" cx="22" cy="17.5" r="1.6" fill="${palette.visor}"/>
      <path d="${palette.mouth}" stroke="${palette.visor}" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    </svg>
  `;
}

export function mountUI({ root, store, openMinigame, onRestart, scene }) {
  let selectedBuilding = 'habitat';
  let tutorialStepIndex = 0;
  let guideOpen = false;
  let guideTab = 'facts';
  let guideTopic = 'moon';
  let toastTimeout = null;

  // Track previous values to animate resource deltas & objective completions
  const initialSnap = store.getState();
  let prevMetrics = {
    oxygen: initialSnap.resources.oxygen,
    water: initialSnap.resources.water,
    food: initialSnap.resources.food,
    battery: initialSnap.resources.battery,
    radiation: initialSnap.crew.radiationDose,
    crew: initialSnap.crew.health,
    research: initialSnap.resources.research,
    shield: initialSnap.shieldLevel,
  };
  let prevObjectives = { ...initialSnap.objectives };

  root.innerHTML = `
    <div class="hud-shell">
      <!-- Top Resource & Mission Status Bar -->
      <header class="hud-topbar" aria-label="Outpost status dashboard">
        <div class="brand-cluster">
          <div class="brand-badge">🌕 ARTEMIS BASE</div>
          <div class="mission-clock">
            <span id="ui-day" class="clock-day">Day 1 / 7</span>
            <span id="ui-phase" class="clock-phase">☀️ Daylight</span>
          </div>
        </div>

        <div class="resource-strip" id="ui-resources" role="region" aria-label="Outpost supplies and safety">
          <div class="res-pill" id="pill-oxygen" title="${RESOURCE_HELP.oxygen.explain}">
            <div class="res-head"><span>💨 Air</span><strong id="val-oxygen">85%</strong></div>
            <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.oxygen.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="85"><div id="bar-oxygen" class="bar-fill is-good" style="width:85%"></div></div>
            <div class="res-sub">${RESOURCE_HELP.oxygen.question}</div>
            <span class="res-delta" id="delta-oxygen" hidden></span>
          </div>
          <div class="res-pill" id="pill-water" title="${RESOURCE_HELP.water.explain}">
            <div class="res-head"><span>💧 Water</span><strong id="val-water">80%</strong></div>
            <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.water.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"><div id="bar-water" class="bar-fill is-good" style="width:80%"></div></div>
            <div class="res-sub">${RESOURCE_HELP.water.question}</div>
            <span class="res-delta" id="delta-water" hidden></span>
          </div>
          <div class="res-pill" id="pill-food" title="${RESOURCE_HELP.food.explain}">
            <div class="res-head"><span>🥬 Food</span><strong id="val-food">70%</strong></div>
            <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.food.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="70"><div id="bar-food" class="bar-fill is-good" style="width:70%"></div></div>
            <div class="res-sub">${RESOURCE_HELP.food.question}</div>
            <span class="res-delta" id="delta-food" hidden></span>
          </div>
          <div class="res-pill" id="pill-battery" title="${RESOURCE_HELP.battery.explain}">
            <div class="res-head"><span>🔋 Power</span><strong id="val-battery">80%</strong></div>
            <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.battery.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"><div id="bar-battery" class="bar-fill is-good" style="width:80%"></div></div>
            <div class="res-sub">${RESOURCE_HELP.battery.question}</div>
            <div class="res-sub res-meta" id="val-power-net">⚡ +0W net</div>
            <span class="res-delta" id="delta-battery" hidden></span>
          </div>
          <div class="res-pill" id="pill-radiation" title="${RESOURCE_HELP.radiation.explain}">
            <div class="res-head"><span>🛡️ Safety</span><strong id="val-radiation">0%</strong></div>
            <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.radiation.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="bar-radiation" class="bar-fill is-good" style="width:0%"></div></div>
            <div class="res-sub">${RESOURCE_HELP.radiation.question}</div>
            <div class="res-sub res-meta" id="val-shield">🛡️ Shield 0/3</div>
            <span class="res-delta" id="delta-radiation" hidden></span>
          </div>
          <div class="res-pill" id="pill-crew" title="${RESOURCE_HELP.crew?.explain || 'Crew Health — keep your 4 astronauts healthy for 7 days!'}">
            <div class="res-head"><span>👩‍🚀 Crew (4)</span><strong id="val-crew">100%</strong></div>
            <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.crew?.label || 'Crew Health'}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div id="bar-crew" class="bar-fill is-good" style="width:100%"></div></div>
            <div class="res-sub">${RESOURCE_HELP.crew?.question || 'Are our astronauts healthy?'}</div>
            <span class="res-delta" id="delta-crew" hidden></span>
          </div>
          <div class="res-pill res-research" id="pill-research" title="${RESOURCE_HELP.research.explain}">
            <div class="res-head"><span>🔬 Science</span><strong id="val-research">0 / 100</strong></div>
            <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.research.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="bar-research" class="bar-fill is-science" style="width:0%"></div></div>
            <div class="res-sub">${RESOURCE_HELP.research.question}</div>
            <span class="res-delta" id="delta-research" hidden></span>
          </div>
        </div>

        <div class="controls-cluster">
          <div class="speed-group" role="group" aria-label="Simulation speed">
            <button type="button" class="btn btn-chip" data-speed="0" aria-pressed="false" title="Pause game">⏸</button>
            <button type="button" class="btn btn-chip is-active" data-speed="1" aria-pressed="true" title="Normal speed">1×</button>
            <button type="button" class="btn btn-chip" data-speed="2" aria-pressed="false" title="Fast speed">2×</button>
            <button type="button" class="btn btn-chip" data-speed="3" aria-pressed="false" title="Super fast speed">3×</button>
          </div>
          <button type="button" class="btn btn-secondary" id="btn-guide" title="Open NASA Science Field Guide">📘 NASA Guide</button>
          <button type="button" class="btn btn-ghost" id="btn-restart" title="Start a fresh mission">↻ Reset</button>
        </div>
      </header>

      <!-- Active Event Alert Banner + Friendly Commander Hint Bar -->
      <div class="hud-banners">
        <div id="ui-event-banner" class="event-banner" role="alert" aria-live="assertive" hidden></div>
        <div id="ui-hint-bar" class="hint-bar" role="status" aria-live="polite"></div>
      </div>

      <!-- Main Middle Columns: Left Outpost Selector & Quick Actions / Right Inspector & Objectives -->
      <div class="hud-columns">
        <aside class="hud-left-panel" aria-label="Outpost buildings and astronaut actions">
          <section class="panel-card">
            <div class="panel-title-row">
              <h3>🏗️ Moon Base Buildings</h3>
              <button type="button" class="btn btn-mini" id="btn-cam-overview">🎥 Full View</button>
            </div>
            <div class="building-list" id="ui-building-list" role="group" aria-label="Select a Moon base building"></div>
          </section>

          <section class="panel-card">
            <h3>⚡ Quick Astronaut Actions</h3>
            <div class="quick-actions" id="ui-quick-actions"></div>
          </section>

          <section class="panel-card">
            <h3>🎮 Space Training Games</h3>
            <div class="minigame-buttons">
              <button type="button" class="btn btn-accent" data-minigame="leakHunter">
                <span class="mg-btn-title">🔍 Leak Hunter</span>
                <span class="btn-sub">Scan & patch air leaks (+Air & +Science)</span>
              </button>
              <button type="button" class="btn btn-accent" data-minigame="solarAligner">
                <span class="mg-btn-title">☀️ Solar Aligner</span>
                <span class="btn-sub">Brush Moon dust & aim at Sun (+Power & +Science)</span>
              </button>
            </div>
          </section>
        </aside>

        <aside class="hud-right-panel" aria-label="Selected building inspector and mission goals">
          <section class="panel-card inspector-card" id="ui-inspector" aria-live="polite"></section>

          <section class="panel-card">
            <div class="panel-title-row">
              <h3>🎯 Mission Goals</h3>
              <span id="ui-obj-progress" class="b-tag is-on">0 / ${OBJECTIVES.length} Done</span>
            </div>
            <ul class="objective-list" id="ui-objectives"></ul>
          </section>

          <section class="panel-card log-card">
            <h3>📡 Mission Control Updates</h3>
            <div class="log-feed" id="ui-log" role="log" aria-live="polite" aria-relevant="additions text"></div>
          </section>
        </aside>
      </div>

      <!-- Toast message -->
      <div id="ui-toast" class="hud-toast" role="status" aria-live="polite" hidden></div>

      <!-- Modal Overlays (Intro/Tutorial, Pending Event Decision, Science Guide, Win/Lose) -->
      <div id="ui-modal-backdrop" class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mission Briefing and Science Guide" hidden>
        <div id="ui-modal-content" class="modal-box"></div>
      </div>
    </div>
  `;

  // Element references
  const dayEl = root.querySelector('#ui-day');
  const phaseEl = root.querySelector('#ui-phase');
  const eventBannerEl = root.querySelector('#ui-event-banner');
  const hintBarEl = root.querySelector('#ui-hint-bar');
  const buildingListEl = root.querySelector('#ui-building-list');
  const quickActionsEl = root.querySelector('#ui-quick-actions');
  const inspectorEl = root.querySelector('#ui-inspector');
  const objectivesEl = root.querySelector('#ui-objectives');
  const objProgressEl = root.querySelector('#ui-obj-progress');
  const logEl = root.querySelector('#ui-log');
  const toastEl = root.querySelector('#ui-toast');
  const modalBackdropEl = root.querySelector('#ui-modal-backdrop');
  const modalContentEl = root.querySelector('#ui-modal-content');

  const deltaTimeouts = new Map();
  let lastEventBannerHtml = '';
  let lastHintBarHtml = '';
  let lastBuildingListHtml = '';
  let lastQuickActionsHtml = '';
  let lastInspectorHtml = '';
  let lastObjectivesHtml = '';
  let lastLogHtml = '';
  let lastModalKey = '';

  function showResourceDelta(key, diff, unit = '%') {
    const deltaEl = root.querySelector(`#delta-${key}`);
    const pillEl = root.querySelector(`#pill-${key}`);
    if (!deltaEl || !pillEl) return;

    const sign = diff > 0 ? '+' : '';
    const isGood = key === 'radiation' ? diff < 0 : diff > 0;
    deltaEl.textContent = `${sign}${Math.round(diff)}${unit}`;
    deltaEl.className = `res-delta ${isGood ? 'is-pos' : 'is-neg'}`;
    deltaEl.hidden = false;

    pillEl.classList.remove('pill-flash-good', 'pill-flash-warn');
    void pillEl.offsetWidth;
    pillEl.classList.add(isGood ? 'pill-flash-good' : 'pill-flash-warn');

    if (deltaTimeouts.has(key)) {
      clearTimeout(deltaTimeouts.get(key));
    }
    deltaTimeouts.set(
      key,
      setTimeout(() => {
        deltaEl.hidden = true;
        pillEl.classList.remove('pill-flash-good', 'pill-flash-warn');
      }, 2100)
    );
  }

  function showToast(msg, kind = 'info') {
    if (!msg) return;
    toastEl.textContent = msg;
    toastEl.className = `hud-toast is-${kind} toast-pop`;
    toastEl.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.hidden = true;
    }, 3200);
  }

  function runAction(action) {
    const res = store.dispatch(action);
    if (!res.ok) {
      showToast(`💡 ${res.message}`, 'warn');
    } else if (res.opensMinigame) {
      openMinigame(res.opensMinigame);
    } else if (res.message && action.type !== 'setSpeed') {
      showToast(`🌟 ${res.message}`, 'good');
    }
    return res;
  }

  function selectBuilding(buildingId, focus3D = true) {
    if (!BUILDING_INFO[buildingId]) return;
    selectedBuilding = buildingId;
    if (focus3D && scene && typeof scene.focusBuilding === 'function') {
      scene.focusBuilding(buildingId);
    }
    render(store.getState());
  }

  // Topbar controls
  root.querySelectorAll('[data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      runAction({ type: 'setSpeed', speed: Number(btn.dataset.speed) });
    });
  });

  root.querySelector('#btn-cam-overview').addEventListener('click', () => {
    if (scene && typeof scene.focusBuilding === 'function') {
      scene.focusBuilding(null);
    }
    showToast('🎥 Zoomed out to see the whole Moon base!', 'info');
  });

  root.querySelector('#btn-guide').addEventListener('click', () => {
    guideOpen = true;
    lastModalKey = '';
    renderModal(store.getState());
  });

  root.querySelector('#btn-restart').addEventListener('click', () => {
    onRestart();
    tutorialStepIndex = 0;
    lastModalKey = '';
    const s = store.getState();
    prevMetrics = {
      oxygen: s.resources.oxygen,
      water: s.resources.water,
      food: s.resources.food,
      battery: s.resources.battery,
      radiation: s.crew.radiationDose,
      crew: s.crew.health,
      research: s.resources.research,
      shield: s.shieldLevel,
    };
    prevObjectives = { ...s.objectives };
    showToast('🌕 Started a fresh Lunar Mission!', 'info');
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && guideOpen) {
      guideOpen = false;
      lastModalKey = '';
      renderModal(store.getState());
    }
  });

  root.querySelectorAll('[data-minigame]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openMinigame(btn.dataset.minigame);
    });
  });

  function checkDeltasAndAchievements(s, change) {
    const r = s.resources;
    const current = {
      oxygen: r.oxygen,
      water: r.water,
      food: r.food,
      battery: r.battery,
      radiation: s.crew.radiationDose,
      crew: s.crew.health,
      research: r.research,
      shield: s.shieldLevel,
    };

    // Show floating delta badge when a discrete jump (>= 3.5 units) happens
    const threshold = change?.type === 'action' ? 2.5 : 6;
    for (const key of ['oxygen', 'water', 'food', 'battery', 'radiation', 'crew']) {
      const diff = current[key] - prevMetrics[key];
      if (Math.abs(diff) >= threshold) {
        showResourceDelta(key, diff, '%');
      }
    }
    if (Math.abs(current.research - prevMetrics.research) >= 3) {
      showResourceDelta('research', current.research - prevMetrics.research, ' pts');
    }
    if (current.shield !== prevMetrics.shield) {
      showResourceDelta('radiation', current.shield - prevMetrics.shield, ' 🛡️');
    }
    prevMetrics = current;

    // Celebrate newly completed mission objectives!
    for (const obj of OBJECTIVES) {
      if (s.objectives[obj.id] && !prevObjectives[obj.id]) {
        showToast(`🎉 Goal Complete: ${obj.icon} ${obj.text}`, 'good');
      }
    }
    prevObjectives = { ...s.objectives };
  }

  function renderTopBar(s) {
    const r = s.resources;
    dayEl.textContent = `Day ${s.mission.day} / ${BALANCE.time.missionDays}`;
    const hasShadow = s.activeEvents.some((e) => e.eventId === 'longShadow' && e.phase === 'active');
    if (hasShadow) {
      phaseEl.textContent = '⛰️ Mountain Shadow';
      phaseEl.className = 'clock-phase is-night';
    } else if (s.mission.isDaylight) {
      phaseEl.textContent = '☀️ South Pole Sun';
      phaseEl.className = 'clock-phase is-day';
    } else {
      phaseEl.textContent = '🌑 Polar Dusk';
      phaseEl.className = 'clock-phase is-night';
    }

    const bars = [
      ['oxygen', r.oxygen, false],
      ['water', r.water, false],
      ['food', r.food, false],
      ['battery', r.battery, false],
      ['radiation', s.crew.radiationDose, true],
      ['crew', s.crew.health, false],
    ];
    for (const [key, val, inv] of bars) {
      const vEl = root.querySelector(`#val-${key}`);
      const bEl = root.querySelector(`#bar-${key}`);
      if (vEl) vEl.textContent = pct(val);
      if (bEl) {
        const clamped = Math.max(0, Math.min(100, val));
        bEl.style.width = `${clamped}%`;
        bEl.className = barClass(val, inv);
        bEl.parentElement?.setAttribute('aria-valuenow', String(Math.round(clamped)));
      }
    }

    const net = s.power.net;
    const netEl = root.querySelector('#val-power-net');
    if (netEl) {
      const sign = net >= 0 ? '+' : '';
      netEl.textContent = s.power.brownout
        ? '🔌 Recharging battery to 12%…'
        : `⚡ ${s.power.generation}W in · ${s.power.consumption}W used (${sign}${net})`;
      netEl.className = `res-sub res-meta ${net < 0 || s.power.brownout ? 'text-warn' : 'text-good'}`;
    }

    const shieldEl = root.querySelector('#val-shield');
    if (shieldEl) {
      shieldEl.textContent = `🛡️ Shield ${s.shieldLevel}/3${
        s.crew.sheltered ? ' · 👩‍🚀 In Shelter' : ''
      }`;
    }

    const resVal = root.querySelector('#val-research');
    const resBar = root.querySelector('#bar-research');
    if (resVal) resVal.textContent = `${Math.round(r.research)} / 100`;
    if (resBar) {
      const clampedRes = Math.max(0, Math.min(100, r.research));
      resBar.style.width = `${clampedRes}%`;
      resBar.parentElement?.setAttribute('aria-valuenow', String(Math.round(clampedRes)));
    }

    root.querySelectorAll('[data-speed]').forEach((btn) => {
      const active = Number(btn.dataset.speed) === s.mission.speed;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
  }

  function renderBanners(s) {
    if (s.activeEvents.length > 0) {
      eventBannerEl.hidden = false;
      const nextEventHtml = s.activeEvents
        .map((inst) => {
          const def = MISSION_EVENTS[inst.eventId];
          if (!def) return '';
          const timeTag =
            typeof inst.remaining === 'number'
              ? inst.phase === 'warning'
                ? `Starts in ${Math.ceil(inst.remaining)}s`
                : `${Math.ceil(inst.remaining)}s remaining`
              : 'Needs your help!';
          return `
            <div class="event-chip is-${def.kind || 'warn'}">
              <span>${def.icon} <strong>${def.title}</strong> (${timeTag}) — ${def.kidText}</span>
            </div>
          `;
        })
        .join('');
      if (nextEventHtml !== lastEventBannerHtml) {
        lastEventBannerHtml = nextEventHtml;
        eventBannerEl.innerHTML = nextEventHtml;
      }
    } else {
      eventBannerEl.hidden = true;
      if (lastEventBannerHtml !== '') {
        lastEventBannerHtml = '';
        eventBannerEl.innerHTML = '';
      }
    }

    const hint = getContextualHint(s);
    hintBarEl.className = `hint-bar is-${hint.kind}`;
    const nextHintHtml = `
      <span class="hint-bar-inner">
        ${renderCommanderVectorAvatar(hint.kind)}
        <span>${hint.mood || '💡'} <strong>Commander Tip:</strong> ${hint.text}</span>
      </span>
    `;
    if (nextHintHtml !== lastHintBarHtml) {
      lastHintBarHtml = nextHintHtml;
      hintBarEl.innerHTML = nextHintHtml;
    }
  }

  function renderBuildingList(s) {
    const nextHtml = BUILDING_ORDER.map((id, idx) => {
      const info = BUILDING_INFO[id];
      const mod = s.modules[id];
      const isSelected = id === selectedBuilding;
      const health = Math.round(mod.health);
      const statusBadge = !mod.online
        ? '<span class="b-tag is-off">OFF</span>'
        : s.power.brownout && id !== 'habitat' && id !== 'solar'
        ? '<span class="b-tag is-bad">LOW POWER</span>'
        : health < 40
        ? '<span class="b-tag is-warn">NEEDS FIX</span>'
        : '<span class="b-tag is-on">WORKING</span>';

      return `
        <button type="button" class="building-btn ${isSelected ? 'is-selected' : ''}" aria-pressed="${isSelected}" data-select-building="${id}" title="Press ${idx + 1} to inspect ${info.name}">
          <span class="b-hotkey" aria-hidden="true">${idx + 1}</span>
          <span class="b-icon">${info.icon}</span>
          <span class="b-main">
            <strong>${info.name}</strong>
            <small>Health: ${health}%</small>
          </span>
          ${statusBadge}
        </button>
      `;
    }).join('');

    if (nextHtml === lastBuildingListHtml) return;
    lastBuildingListHtml = nextHtml;
    buildingListEl.innerHTML = nextHtml;

    buildingListEl.querySelectorAll('[data-select-building]').forEach((btn) => {
      btn.addEventListener('click', () => {
        selectBuilding(btn.dataset.selectBuilding, true);
      });
    });
  }

  function renderQuickActions(s) {
    const iceCd = Math.ceil(s.cooldowns.collectIce);
    const shieldCd = Math.ceil(s.cooldowns.buildShielding);
    const gh = s.modules.greenhouse;
    const cropReady = gh.planted && gh.growth >= 100;
    const hasStorm = s.activeEvents.some((e) => e.eventId === 'solarStorm');

    const nextHtml = `
      <div class="kit-badge">🧰 Repair Kits Ready: <strong>${s.inventory.repairKits}</strong></div>
      <button type="button" class="btn ${
        s.crew.sheltered ? 'btn-warn' : hasStorm ? 'btn-primary btn-pulse' : 'btn-secondary'
      }" data-qaction="shelter">
        ${s.crew.sheltered ? '👩‍🚀 All Clear: Exit Storm Shelter' : '🛡️ Send Crew to Storm Shelter'}
      </button>
      <button type="button" class="btn btn-secondary" data-qaction="ice" ${iceCd > 0 ? 'disabled' : ''}>
        🧊 Mine Crater Ice ${iceCd > 0 ? `(${iceCd}s)` : '(+25% Water)'}
      </button>
      <button type="button" class="btn ${cropReady ? 'btn-primary btn-pulse' : 'btn-secondary'}" data-qaction="harvest" ${!cropReady ? 'disabled' : ''}>
        🥬 ${cropReady ? 'Harvest Ready Crops! (+30% Food)' : `Plants Growing (${Math.round(gh.growth)}%)`}
      </button>
      <button type="button" class="btn btn-secondary" data-qaction="shield" ${s.shieldLevel >= 3 || shieldCd > 0 ? 'disabled' : ''}>
        🪨 ${s.shieldLevel >= 3 ? 'Moon-Dirt Shield Max (3/3)' : `Pack Regolith Shield (${s.shieldLevel}/3)`}
      </button>
    `;

    if (nextHtml === lastQuickActionsHtml) return;
    lastQuickActionsHtml = nextHtml;
    quickActionsEl.innerHTML = nextHtml;

    quickActionsEl.querySelector('[data-qaction="shelter"]')?.addEventListener('click', () => {
      runAction({ type: 'setShelter', on: !store.getState().crew.sheltered });
    });
    quickActionsEl.querySelector('[data-qaction="ice"]')?.addEventListener('click', () => {
      runAction({ type: 'collectIce' });
    });
    quickActionsEl.querySelector('[data-qaction="harvest"]')?.addEventListener('click', () => {
      runAction({ type: 'harvestCrops' });
    });
    quickActionsEl.querySelector('[data-qaction="shield"]')?.addEventListener('click', () => {
      runAction({ type: 'buildShielding' });
    });
  }

  function renderInspector(s) {
    const info = BUILDING_INFO[selectedBuilding] || BUILDING_INFO.habitat;
    const mod = s.modules[selectedBuilding];
    const topicFacts = factsFor(info.topic);
    const chosenFact = topicFacts[s.mission.day % Math.max(1, topicFacts.length)] || FACTS[0];

    let specificControls = '';
    if (selectedBuilding === 'habitat') {
      specificControls = `
        <div class="insp-stat-grid">
          <div>🛡️ Moon-Dirt Shield: <strong>${s.shieldLevel} / 3</strong></div>
          <div>👩‍🚀 Storm Shelter: <strong>${s.crew.sheltered ? 'INSIDE' : 'Ready'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-secondary" data-insp="shelter">
            ${s.crew.sheltered ? '👩‍🚀 Exit Storm Shelter' : '🛡️ Enter Storm Shelter'}
          </button>
          <button type="button" class="btn btn-secondary" data-insp="shield" ${s.shieldLevel >= 3 ? 'disabled' : ''}>
            🪨 Add Moon-Dirt Shield (−15% Power, −1 Kit)
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'lifeSupport') {
      specificControls = `
        <div class="insp-stat-grid">
          <div>⚡ Power Used: <strong>${mod.online ? '3 W' : '0 W (OFF)'}</strong></div>
          <div>💨 Air Made: <strong>${mod.online ? '+0.7%/s' : 'Paused'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-secondary" data-insp="toggle">
            ${mod.online ? '⚪ Turn OFF' : '🟢 Turn ON'}
          </button>
          <button type="button" class="btn btn-accent" data-insp="minigame-leak">
            <span class="mg-btn-title">🔍 Play Leak Hunter</span>
            <span class="btn-sub">Find & patch air leaks!</span>
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'solar') {
      const alignPct = Math.round(mod.alignment * 100);
      const dustPct = Math.round(mod.dust * 100);
      specificControls = `
        <div class="insp-stat-grid">
          <div>📐 Aim at Sun: <strong>${alignPct}%</strong></div>
          <div>🌫️ Moon Dust: <strong>${dustPct}%</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-accent" data-insp="minigame-solar">
            <span class="mg-btn-title">☀️ Play Solar Aligner</span>
            <span class="btn-sub">Brush off dust & aim at the Sun!</span>
          </button>
          <button type="button" class="btn btn-secondary" data-insp="clean" ${s.cooldowns.cleanPanels > 0 ? 'disabled' : ''}>
            🧹 Quick Dust Brush (−4% Battery)
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'greenhouse') {
      const growth = Math.round(mod.growth);
      specificControls = `
        <div class="insp-stat-grid">
          <div>🌱 Plant Growth: <strong>${growth}%</strong></div>
          <div>⚡ Power Used: <strong>${mod.online ? '3 W' : '0 W (OFF)'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn ${growth >= 100 ? 'btn-primary btn-pulse' : 'btn-primary'}" data-insp="harvest" ${growth < 100 ? 'disabled' : ''}>
            🥬 Harvest Space Greens (+30% Food)
          </button>
          <button type="button" class="btn btn-secondary" data-insp="toggle">
            ${mod.online ? '⚪ Turn OFF' : '🟢 Turn ON'}
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'lab') {
      specificControls = `
        <div class="insp-stat-grid">
          <div>🔬 Science Speed: <strong>${mod.online && !s.crew.sheltered ? '+0.45 pt/s' : 'Paused'}</strong></div>
          <div>⚡ Power Used: <strong>${mod.online && !s.crew.sheltered ? '4 W' : '0 W'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-secondary" data-insp="toggle">
            ${mod.online ? '⚪ Turn OFF (Save Power)' : '🟢 Turn ON'}
          </button>
          <button type="button" class="btn btn-secondary" data-insp="ice" ${s.cooldowns.collectIce > 0 ? 'disabled' : ''}>
            🧊 Send Ice Rover (+25% Water)
          </button>
        </div>
      `;
    }

    const nextHtml = `
      <div class="insp-header">
        <div>
          <span class="insp-eyebrow">BUILDING CONTROL PANEL</span>
          <h3>${info.icon} ${info.name}</h3>
        </div>
        <span class="insp-health">🔧 ${Math.round(mod.health)}%</span>
      </div>
      <p class="insp-desc">${info.role}</p>
      <p class="insp-how">${info.howItWorks}</p>
      ${specificControls}
      <div class="insp-repair-row">
        <button type="button" class="btn btn-secondary btn-full" data-insp="repair" ${s.inventory.repairKits <= 0 || mod.health >= 99 ? 'disabled' : ''}>
          🧰 Fix ${info.name} (+40% Health · Uses 1 Kit)
        </button>
      </div>
      ${
        chosenFact
          ? `<div class="fact-box">
              <div class="fact-tag">🔬 DID YOU KNOW? (${chosenFact.id})</div>
              <p>${chosenFact.kidText}</p>
            </div>`
          : ''
      }
    `;

    if (nextHtml === lastInspectorHtml) return;
    lastInspectorHtml = nextHtml;
    inspectorEl.innerHTML = nextHtml;

    inspectorEl.querySelector('[data-insp="toggle"]')?.addEventListener('click', () => {
      runAction({ type: 'toggleModule', moduleId: selectedBuilding });
    });
    inspectorEl.querySelector('[data-insp="repair"]')?.addEventListener('click', () => {
      runAction({ type: 'repairModule', moduleId: selectedBuilding });
    });
    inspectorEl.querySelector('[data-insp="shelter"]')?.addEventListener('click', () => {
      runAction({ type: 'setShelter', on: !store.getState().crew.sheltered });
    });
    inspectorEl.querySelector('[data-insp="shield"]')?.addEventListener('click', () => {
      runAction({ type: 'buildShielding' });
    });
    inspectorEl.querySelector('[data-insp="clean"]')?.addEventListener('click', () => {
      runAction({ type: 'cleanPanels' });
    });
    inspectorEl.querySelector('[data-insp="harvest"]')?.addEventListener('click', () => {
      runAction({ type: 'harvestCrops' });
    });
    inspectorEl.querySelector('[data-insp="ice"]')?.addEventListener('click', () => {
      runAction({ type: 'collectIce' });
    });
    inspectorEl.querySelector('[data-insp="minigame-leak"]')?.addEventListener('click', () => {
      openMinigame('leakHunter');
    });
    inspectorEl.querySelector('[data-insp="minigame-solar"]')?.addEventListener('click', () => {
      openMinigame('solarAligner');
    });
  }

  function renderObjectivesAndLog(s) {
    const doneCount = OBJECTIVES.filter((o) => Boolean(s.objectives[o.id])).length;
    if (objProgressEl) {
      objProgressEl.textContent = `${doneCount} / ${OBJECTIVES.length} Done`;
    }
    const nextObjHtml = OBJECTIVES.map((o) => {
      const done = Boolean(s.objectives[o.id]);
      return `<li class="${done ? 'is-done' : ''}"><span>${done ? '✅' : '⬜'} ${o.icon}</span> ${o.text}</li>`;
    }).join('');
    if (nextObjHtml !== lastObjectivesHtml) {
      lastObjectivesHtml = nextObjHtml;
      objectivesEl.innerHTML = nextObjHtml;
    }

    const nextLogHtml = s.log
      .slice(0, 10)
      .map(
        (entry) =>
          `<div class="log-item is-${entry.kind}"><span class="log-day">D${entry.day}</span> ${entry.text}</div>`
      )
      .join('');
    if (nextLogHtml !== lastLogHtml) {
      lastLogHtml = nextLogHtml;
      logEl.innerHTML = nextLogHtml;
    }
  }

  function renderModal(s) {
    const modalKey =
      s.mission.status === 'won' || s.mission.status === 'lost'
        ? `outcome:${s.mission.status}:${s.mission.stars}:${s.mission.day}:${Math.round(s.resources.research)}:${s.stats.harvests}`
        : s.mission.status === 'intro'
        ? `intro:${tutorialStepIndex}`
        : s.pendingDecision && !s.mission.inMinigame
        ? `decision:${s.pendingDecision.instanceId}:${s.pendingDecision.eventId}`
        : guideOpen
        ? `guide:${guideTab}:${guideTopic}`
        : 'closed';

    if (modalKey === lastModalKey) return;
    lastModalKey = modalKey;

    // Priority 1: Mission Won / Lost screen
    if (s.mission.status === 'won' || s.mission.status === 'lost') {
      const won = s.mission.status === 'won';
      const stars = '⭐'.repeat(s.mission.stars) + '☆'.repeat(Math.max(0, 3 - s.mission.stars));
      const objDone = Object.values(s.objectives).filter(Boolean).length;
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card outcome-card mg-animate-in">
          <div class="outcome-badge">${won ? '🎉 MISSION ACCOMPLISHED!' : '🛸 SAFE CREW RETURN'}</div>
          <h2>${won ? 'Awesome Job, Junior Commander!' : 'Your Crew Returned Safely to Orbit!'}</h2>
          ${won ? `<div class="outcome-stars" aria-label="${s.mission.stars} out of 3 stars">${stars}</div>` : ''}
          <p class="outcome-reason">${s.mission.outcomeReason || ''}</p>
          <div class="outcome-stats">
            <div>📅 Days Completed: <strong>${s.mission.day} / ${BALANCE.time.missionDays}</strong></div>
            <div>🔬 Science Earned: <strong>${Math.round(s.resources.research)} / 100 pts</strong></div>
            <div>🎯 Goals Finished: <strong>${objDone} / ${OBJECTIVES.length}</strong></div>
            <div>🥬 Space Crops Grown: <strong>${s.stats.harvests}</strong></div>
          </div>
          <div class="fact-box">
            <div class="fact-tag">🧠 WHAT YOU LEARNED ON THE MOON</div>
            <p>
              Living on the Moon takes teamwork and smart balance: making <strong>breathing air from water</strong>,
              saving <strong>battery power</strong> when shadows fall, brushing <strong>sticky Moon dust</strong> off solar panels,
              and protecting astronauts inside a <strong>radiation shelter</strong> during solar storms!
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary btn-lg" id="modal-restart">🚀 Play Again (New Mission)</button>
          </div>
        </div>
      `;
      modalContentEl.querySelector('#modal-restart')?.addEventListener('click', () => {
        onRestart();
      });
      return;
    }

    // Priority 2: Intro / Onboarding Tutorial
    if (s.mission.status === 'intro') {
      const step = TUTORIAL_STEPS[tutorialStepIndex] || TUTORIAL_STEPS[0];
      const dots = TUTORIAL_STEPS.map(
        (_, idx) => `<span class="tut-dot ${idx === tutorialStepIndex ? 'is-active' : ''}"></span>`
      ).join('');
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card tutorial-card mg-animate-in">
          <div class="tutorial-step-tag">JUNIOR ASTRONAUT BRIEFING · STEP ${tutorialStepIndex + 1} OF ${TUTORIAL_STEPS.length}</div>
          <h2>${step.icon} ${step.title}</h2>
          <p class="tutorial-body">${step.body.replace(/\n/g, '<br/>')}</p>
          <div class="fact-box">
            <div class="fact-tag">💡 HELPFUL TIP</div>
            <p>${step.tip}</p>
          </div>
          <div class="tut-dots-row" aria-hidden="true">${dots}</div>
          <div class="modal-actions">
            ${
              tutorialStepIndex > 0
                ? `<button type="button" class="btn btn-ghost" id="tut-prev">← Back</button>`
                : `<span></span>`
            }
            <div class="modal-actions-right">
              <button type="button" class="btn btn-secondary" id="tut-skip">🚀 Start Mission Now</button>
              ${
                tutorialStepIndex < TUTORIAL_STEPS.length - 1
                  ? `<button type="button" class="btn btn-primary" id="tut-next">Next →</button>`
                  : `<button type="button" class="btn btn-primary btn-lg" id="tut-launch">🌕 Launch Moon Base!</button>`
              }
            </div>
          </div>
        </div>
      `;
      modalContentEl.querySelector('#tut-prev')?.addEventListener('click', () => {
        tutorialStepIndex = Math.max(0, tutorialStepIndex - 1);
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#tut-next')?.addEventListener('click', () => {
        tutorialStepIndex = Math.min(TUTORIAL_STEPS.length - 1, tutorialStepIndex + 1);
        renderModal(store.getState());
      });
      const startNow = () => {
        store.dispatch({ type: 'finishTutorial' });
        store.dispatch({ type: 'startMission' });
        showToast('🚀 Mission started! Keep your astronauts happy and safe!', 'good');
      };
      modalContentEl.querySelector('#tut-skip')?.addEventListener('click', startNow);
      modalContentEl.querySelector('#tut-launch')?.addEventListener('click', startNow);
      return;
    }

    // Priority 3: Pending Mission Event Decision
    if (s.pendingDecision && !s.mission.inMinigame) {
      const { instanceId, eventId } = s.pendingDecision;
      const def = MISSION_EVENTS[eventId];
      if (def) {
        const topicFacts = factsFor(def.topic || 'moon');
        const fact = topicFacts[0];
        modalBackdropEl.hidden = false;
        modalContentEl.innerHTML = `
          <div class="modal-card decision-card mg-animate-in">
            <div class="decision-badge">📡 MISSION ALERT · DAY ${s.mission.day}</div>
            <h2>${def.icon} ${def.title}</h2>
            <p class="decision-body">${def.kidText}</p>
            <div class="fact-box">
              <div class="fact-tag">📘 WHY THIS HAPPENS IN SPACE</div>
              <p>${def.lesson}</p>
              ${fact ? `<p class="fact-sub"><strong>NASA Fact (${fact.id}):</strong> ${fact.kidText}</p>` : ''}
            </div>
            <div class="decision-choices">
              ${(def.choices || [])
                .map(
                  (c) => `
                  <button type="button" class="choice-btn" data-choice="${c.id}">
                    <strong>${c.label}</strong>
                    <span>${c.detail}</span>
                  </button>
                `
                )
                .join('')}
            </div>
          </div>
        `;
        modalContentEl.querySelectorAll('[data-choice]').forEach((btn) => {
          btn.addEventListener('click', () => {
            runAction({
              type: 'resolveDecision',
              instanceId,
              choiceId: btn.dataset.choice,
            });
          });
        });
        return;
      }
    }

    // Priority 4: NASA Science Field Guide
    if (guideOpen) {
      const topics = ['moon', 'oxygen', 'water', 'power', 'food', 'radiation', 'habitat'];
      const topicFacts = factsFor(guideTopic);
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card guide-card mg-animate-in">
          <div class="mg-header">
            <div>
              <span class="mg-badge">NASA ARTEMIS & ISS SCIENCE GUIDE</span>
              <h2>📘 Junior Astronaut Science Field Guide</h2>
            </div>
            <button type="button" class="btn btn-ghost" id="guide-close" aria-label="Close NASA Science Field Guide">✕ Close</button>
          </div>
          <div class="guide-tabs" role="tablist" aria-label="Science guide sections">
            <button type="button" role="tab" aria-selected="${guideTab === 'facts'}" class="btn btn-chip ${guideTab === 'facts' ? 'is-active' : ''}" data-gtab="facts">🔬 Real NASA Facts (${FACTS.length})</button>
            <button type="button" role="tab" aria-selected="${guideTab === 'glossary'}" class="btn btn-chip ${guideTab === 'glossary' ? 'is-active' : ''}" data-gtab="glossary">📖 Space Words</button>
            <button type="button" role="tab" aria-selected="${guideTab === 'sim'}" class="btn btn-chip ${guideTab === 'sim' ? 'is-active' : ''}" data-gtab="sim">⚖️ Real Space vs Game</button>
            <button type="button" role="tab" aria-selected="${guideTab === 'sources'}" class="btn btn-chip ${guideTab === 'sources' ? 'is-active' : ''}" data-gtab="sources">🔗 NASA Links (${Object.keys(SOURCES).length})</button>
          </div>

          ${
            guideTab === 'facts'
              ? `
              <div class="guide-topic-bar" role="group" aria-label="Filter NASA facts by topic">
                ${topics
                  .map(
                    (t) =>
                      `<button type="button" aria-pressed="${guideTopic === t}" class="btn btn-mini ${guideTopic === t ? 'is-active' : ''}" data-gtopic="${t}">${t.toUpperCase()}</button>`
                  )
                  .join('')}
              </div>
              <div class="guide-list">
                ${topicFacts
                  .map(
                    (f) => `
                  <div class="guide-item">
                    <div class="fact-tag">${f.id} · ${f.label} · Sources: ${f.sourceIds.join(', ')}</div>
                    <p><strong>${f.kidText}</strong></p>
                    <small class="guide-caveat">How our game uses this: ${f.caveat}</small>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
              : guideTab === 'glossary'
              ? `
              <div class="guide-list">
                ${GLOSSARY.map(
                  (g) => `
                  <div class="guide-item">
                    <strong>${g.term}</strong>
                    <p>${g.meaning}</p>
                  </div>
                `
                ).join('')}
              </div>
            `
              : guideTab === 'sim'
              ? `
              <div class="guide-list">
                <div class="guide-item">
                  <strong>⏱️ Fast Moon Days (Game vs Real Moon)</strong>
                  <p>In the game, 1 mission day is <strong>60 seconds</strong> so you can finish a 7-day mission in a few minutes! On the real Moon, one full day-night cycle takes about <strong>29.5 Earth days</strong>.</p>
                </div>
                <div class="guide-item">
                  <strong>📊 Easy 0–100% Bars (Game vs Real Sensors)</strong>
                  <p>Air, Water, Food, Battery, and Radiation are shown as friendly 0–100% bars. Real NASA controllers measure air pressure in kilopascals (kPa), water in liters, electricity in kilowatts (kW), and radiation in millisieverts (mSv).</p>
                </div>
                <div class="guide-item">
                  <strong>🧰 Instant Repair Kits (Game vs Spacewalks)</strong>
                  <p>Clicking Fix repairs a building by +40% right away. Real astronauts follow careful checklists and spacewalks that take hours!</p>
                </div>
              </div>
            `
              : `
              <div class="guide-list">
                ${Object.entries(SOURCES)
                  .map(
                    ([id, src]) => `
                  <div class="guide-item">
                    <strong>[${id}] ${src.title}</strong> (${src.publisher})
                    <div><a href="${src.url}" target="_blank" rel="noopener noreferrer">${src.url}</a></div>
                  </div>
                `
                  )
                  .join('')}
              </div>
            `
          }
        </div>
      `;

      modalContentEl.querySelector('#guide-close')?.addEventListener('click', () => {
        guideOpen = false;
        renderModal(store.getState());
      });
      modalContentEl.querySelectorAll('[data-gtab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          guideTab = btn.dataset.gtab;
          renderModal(store.getState());
        });
      });
      modalContentEl.querySelectorAll('[data-gtopic]').forEach((btn) => {
        btn.addEventListener('click', () => {
          guideTopic = btn.dataset.gtopic;
          renderModal(store.getState());
        });
      });
      return;
    }

    modalBackdropEl.hidden = true;
    modalContentEl.innerHTML = '';
  }

  function render(snapshot, change) {
    checkDeltasAndAchievements(snapshot, change);
    renderTopBar(snapshot);
    renderBanners(snapshot);
    renderBuildingList(snapshot);
    renderQuickActions(snapshot);
    renderInspector(snapshot);
    renderObjectivesAndLog(snapshot);
    renderModal(snapshot);
  }

  // Game UI Database hotkey navigation (1-5 to select buildings, 0 for Full View)
  window.addEventListener('keydown', (e) => {
    const s = store.getState();
    if (s.mission.inMinigame || !modalBackdropEl.hidden) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const idx = Number(e.key) - 1;
    if (idx >= 0 && idx < BUILDING_ORDER.length) {
      selectBuilding(BUILDING_ORDER[idx], true);
    } else if (e.key === '0') {
      if (scene && typeof scene.focusBuilding === 'function') {
        scene.focusBuilding(null);
      }
      showToast('🎥 Zoomed out to see the whole Moon base!', 'info');
    }
  });

  store.subscribe(render);
  render(store.getState());

  return {
    selectBuilding: (id) => selectBuilding(id, false),
    showToast,
  };
}
