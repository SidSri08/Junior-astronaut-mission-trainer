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

export function mountUI({ root, store, openMinigame, onRestart, scene }) {
  let selectedBuilding = 'habitat';
  let tutorialStepIndex = 0;
  let guideOpen = false;
  let guideTab = 'facts';
  let guideTopic = 'moon';
  let toastTimeout = null;

  root.innerHTML = `
    <div class="hud-shell">
      <!-- Top Resource & Mission Status Bar -->
      <header class="hud-topbar" aria-label="Outpost status dashboard">
        <div class="brand-cluster">
          <div class="brand-badge">🌕 ARTEMIS SOUTH POLE</div>
          <div class="mission-clock">
            <span id="ui-day" class="clock-day">Day 1 / 7</span>
            <span id="ui-phase" class="clock-phase">☀️ Daylight</span>
          </div>
        </div>

        <div class="resource-strip" id="ui-resources">
          <div class="res-pill" title="${RESOURCE_HELP.oxygen.explain}">
            <div class="res-head"><span>💨 Oxygen</span><strong id="val-oxygen">85%</strong></div>
            <div class="bar-track"><div id="bar-oxygen" class="bar-fill is-good" style="width:85%"></div></div>
          </div>
          <div class="res-pill" title="${RESOURCE_HELP.water.explain}">
            <div class="res-head"><span>💧 Water</span><strong id="val-water">80%</strong></div>
            <div class="bar-track"><div id="bar-water" class="bar-fill is-good" style="width:80%"></div></div>
          </div>
          <div class="res-pill" title="${RESOURCE_HELP.food.explain}">
            <div class="res-head"><span>🥬 Food</span><strong id="val-food">70%</strong></div>
            <div class="bar-track"><div id="bar-food" class="bar-fill is-good" style="width:70%"></div></div>
          </div>
          <div class="res-pill" title="${RESOURCE_HELP.battery.explain}">
            <div class="res-head"><span>🔋 Battery</span><strong id="val-battery">80%</strong></div>
            <div class="bar-track"><div id="bar-battery" class="bar-fill is-good" style="width:80%"></div></div>
            <div class="res-sub" id="val-power-net">⚡ Net +0.0</div>
          </div>
          <div class="res-pill" title="${RESOURCE_HELP.radiation.explain}">
            <div class="res-head"><span>☢️ Radiation</span><strong id="val-radiation">0%</strong></div>
            <div class="bar-track"><div id="bar-radiation" class="bar-fill is-good" style="width:0%"></div></div>
            <div class="res-sub" id="val-shield">🛡️ Shield 0/3</div>
          </div>
          <div class="res-pill" title="Crew Health — keep above 0% to complete the 7-day mission!">
            <div class="res-head"><span>❤️ Crew (4)</span><strong id="val-crew">100%</strong></div>
            <div class="bar-track"><div id="bar-crew" class="bar-fill is-good" style="width:100%"></div></div>
          </div>
          <div class="res-pill res-research" title="${RESOURCE_HELP.research.explain}">
            <div class="res-head"><span>🔬 Research</span><strong id="val-research">0 / 100</strong></div>
            <div class="bar-track"><div id="bar-research" class="bar-fill is-science" style="width:0%"></div></div>
          </div>
        </div>

        <div class="controls-cluster">
          <div class="speed-group" role="group" aria-label="Simulation speed">
            <button type="button" class="btn btn-chip" data-speed="0" title="Pause">⏸</button>
            <button type="button" class="btn btn-chip is-active" data-speed="1" title="Normal speed">1×</button>
            <button type="button" class="btn btn-chip" data-speed="2" title="Fast">2×</button>
            <button type="button" class="btn btn-chip" data-speed="3" title="Super fast">3×</button>
          </div>
          <button type="button" class="btn btn-secondary" id="btn-guide" title="NASA Science Field Guide">📘 NASA Guide</button>
          <button type="button" class="btn btn-ghost" id="btn-restart" title="Start a fresh mission">↻ Reset</button>
        </div>
      </header>

      <!-- Active Event Alert Banner + Hint Bar -->
      <div class="hud-banners">
        <div id="ui-event-banner" class="event-banner" hidden></div>
        <div id="ui-hint-bar" class="hint-bar"></div>
      </div>

      <!-- Main Middle Columns: Left Outpost Selector & Quick Actions / Right Inspector & Objectives -->
      <div class="hud-columns">
        <aside class="hud-left-panel">
          <section class="panel-card">
            <div class="panel-title-row">
              <h3>🏗️ Outpost Buildings</h3>
              <button type="button" class="btn btn-mini" id="btn-cam-overview">🎥 Overview</button>
            </div>
            <div class="building-list" id="ui-building-list"></div>
          </section>

          <section class="panel-card">
            <h3>⚡ Quick Crew Actions</h3>
            <div class="quick-actions" id="ui-quick-actions"></div>
          </section>

          <section class="panel-card">
            <h3>🎮 Training Minigames</h3>
            <div class="minigame-buttons">
              <button type="button" class="btn btn-accent" data-minigame="leakHunter">
                🔍 Leak Hunter <span class="btn-sub">Seal hull air leaks (+O₂)</span>
              </button>
              <button type="button" class="btn btn-accent" data-minigame="solarAligner">
                ☀️ Solar Aligner <span class="btn-sub">Clean & aim panels (+Power)</span>
              </button>
            </div>
          </section>
        </aside>

        <aside class="hud-right-panel">
          <section class="panel-card inspector-card" id="ui-inspector"></section>

          <section class="panel-card">
            <h3>🎯 Mission Checklist</h3>
            <ul class="objective-list" id="ui-objectives"></ul>
          </section>

          <section class="panel-card log-card">
            <h3>📡 Mission Control Log</h3>
            <div class="log-feed" id="ui-log"></div>
          </section>
        </aside>
      </div>

      <!-- Toast message -->
      <div id="ui-toast" class="hud-toast" hidden></div>

      <!-- Modal Overlays (Intro/Tutorial, Pending Event Decision, Science Guide, Win/Lose) -->
      <div id="ui-modal-backdrop" class="modal-backdrop" hidden>
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
  const logEl = root.querySelector('#ui-log');
  const toastEl = root.querySelector('#ui-toast');
  const modalBackdropEl = root.querySelector('#ui-modal-backdrop');
  const modalContentEl = root.querySelector('#ui-modal-content');

  function showToast(msg, kind = 'info') {
    if (!msg) return;
    toastEl.textContent = msg;
    toastEl.className = `hud-toast is-${kind}`;
    toastEl.hidden = false;
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.hidden = true;
    }, 2800);
  }

  function runAction(action) {
    const res = store.dispatch(action);
    if (!res.ok) {
      showToast(`⚠️ ${res.message}`, 'warn');
    } else if (res.opensMinigame) {
      openMinigame(res.opensMinigame);
    } else if (res.message && action.type !== 'setSpeed') {
      showToast(res.message, 'good');
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
    showToast('🎥 Camera reset to Outpost Overview', 'info');
  });

  root.querySelector('#btn-guide').addEventListener('click', () => {
    guideOpen = true;
    renderModal(store.getState());
  });

  root.querySelector('#btn-restart').addEventListener('click', () => {
    onRestart();
    tutorialStepIndex = 0;
    showToast('🌕 Started a fresh Lunar Mission!', 'info');
  });

  root.querySelectorAll('[data-minigame]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openMinigame(btn.dataset.minigame);
    });
  });

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
        bEl.style.width = `${ Math.max(0, Math.min(100, val)) }%`;
        bEl.className = barClass(val, inv);
      }
    }

    const net = s.power.net;
    const netEl = root.querySelector('#val-power-net');
    if (netEl) {
      const sign = net >= 0 ? '+' : '';
      netEl.textContent = s.power.brownout
        ? '🔌 BLACKOUT!'
        : `⚡ ${s.power.generation}W − ${s.power.consumption}W (${sign}${net})`;
      netEl.className = `res-sub ${net < 0 || s.power.brownout ? 'text-warn' : 'text-good'}`;
    }

    const shieldEl = root.querySelector('#val-shield');
    if (shieldEl) {
      shieldEl.textContent = `🛡️ Shield ${s.shieldLevel}/3 ${s.crew.sheltered ? '· SHELTERED' : ''}`;
    }

    const resVal = root.querySelector('#val-research');
    const resBar = root.querySelector('#bar-research');
    if (resVal) resVal.textContent = `${Math.round(r.research)} / 100`;
    if (resBar) resBar.style.width = `${Math.min(100, r.research)}%`;

    root.querySelectorAll('[data-speed]').forEach((btn) => {
      btn.classList.toggle('is-active', Number(btn.dataset.speed) === s.mission.speed);
    });
  }

  function renderBanners(s) {
    if (s.activeEvents.length > 0) {
      eventBannerEl.hidden = false;
      eventBannerEl.innerHTML = s.activeEvents
        .map((inst) => {
          const def = MISSION_EVENTS[inst.eventId];
          if (!def) return '';
          const timeTag =
            typeof inst.remaining === 'number'
              ? inst.phase === 'warning'
                ? `Arrives in ${Math.ceil(inst.remaining)}s`
                : `${Math.ceil(inst.remaining)}s left`
              : 'Action needed';
          return `
            <div class="event-chip is-${def.kind || 'warn'}">
              <span>${def.icon} <strong>${def.title}</strong> (${inst.phase.toUpperCase()} · ${timeTag}) — ${def.kidText}</span>
            </div>
          `;
        })
        .join('');
    } else {
      eventBannerEl.hidden = true;
      eventBannerEl.innerHTML = '';
    }

    const hint = getContextualHint(s);
    hintBarEl.className = `hint-bar is-${hint.kind}`;
    hintBarEl.innerHTML = `<span>💡 <strong>Mission Tip:</strong> ${hint.text}</span>`;
  }

  function renderBuildingList(s) {
    buildingListEl.innerHTML = BUILDING_ORDER.map((id) => {
      const info = BUILDING_INFO[id];
      const mod = s.modules[id];
      const isSelected = id === selectedBuilding;
      const health = Math.round(mod.health);
      const statusBadge = !mod.online
        ? '<span class="b-tag is-off">OFF</span>'
        : s.power.brownout && id !== 'habitat' && id !== 'solar'
        ? '<span class="b-tag is-bad">NO POWER</span>'
        : health < 40
        ? '<span class="b-tag is-warn">DAMAGED</span>'
        : '<span class="b-tag is-on">ONLINE</span>';

      return `
        <button type="button" class="building-btn ${isSelected ? 'is-selected' : ''}" data-select-building="${id}">
          <span class="b-icon">${info.icon}</span>
          <span class="b-main">
            <strong>${info.name}</strong>
            <small>Condition: ${health}%</small>
          </span>
          ${statusBadge}
        </button>
      `;
    }).join('');

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

    quickActionsEl.innerHTML = `
      <div class="kit-badge">🧰 Repair Kits Available: <strong>${s.inventory.repairKits}</strong></div>
      <button type="button" class="btn ${ s.crew.sheltered ? 'btn-warn' : 'btn-secondary' }" data-qaction="shelter">
        ${s.crew.sheltered ? '👨‍🚀 All Clear: Exit Storm Shelter' : '🛡️ Send Crew to Storm Shelter'}
      </button>
      <button type="button" class="btn btn-secondary" data-qaction="ice" ${iceCd > 0 ? 'disabled' : ''}>
        🧊 Mine Crater Ice ${iceCd > 0 ? `(${iceCd}s)` : '(+25% Water, −10% Battery)'}
      </button>
      <button type="button" class="btn ${cropReady ? 'btn-primary' : 'btn-secondary'}" data-qaction="harvest" ${!cropReady ? 'disabled' : ''}>
        🥬 ${cropReady ? 'Harvest Ready Crops! (+30% Food)' : `Greenhouse Growing (${Math.round(gh.growth)}%)`}
      </button>
      <button type="button" class="btn btn-secondary" data-qaction="shield" ${s.shieldLevel >= 3 || shieldCd > 0 ? 'disabled' : ''}>
        ⛏️ ${s.shieldLevel >= 3 ? 'Regolith Shield Max (3/3)' : `Pack Regolith Shield (${s.shieldLevel}/3)`}
      </button>
    `;

    quickActionsEl.querySelector('[data-qaction="shelter"]')?.addEventListener('click', () => {
      runAction({ type: 'setShelter', on: !s.crew.sheltered });
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
          <div>🛡️ Regolith Shield: <strong>${s.shieldLevel} / 3</strong></div>
          <div>👨‍🚀 Storm Shelter: <strong>${s.crew.sheltered ? 'ACTIVE' : 'Standby'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-secondary" data-insp="shelter">
            ${s.crew.sheltered ? '👨‍🚀 Exit Storm Shelter' : '🛡️ Enter Storm Shelter'}
          </button>
          <button type="button" class="btn btn-secondary" data-insp="shield" ${s.shieldLevel >= 3 ? 'disabled' : ''}>
            ⛏️ Add Regolith Shield (−15% Bat, −1 Kit)
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'lifeSupport') {
      specificControls = `
        <div class="insp-stat-grid">
          <div>⚡ Power Draw: <strong>${mod.online ? '3 W' : '0 W (OFF)'}</strong></div>
          <div>💨 O₂ Output: <strong>${mod.online ? '+0.7%/s' : 'Paused'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-secondary" data-insp="toggle">
            ${mod.online ? '⚪ Switch OFF' : '🟢 Switch ON'}
          </button>
          <button type="button" class="btn btn-accent" data-insp="minigame-leak">
            🔍 Play Leak Hunter
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'solar') {
      const alignPct = Math.round(mod.alignment * 100);
      const dustPct = Math.round(mod.dust * 100);
      specificControls = `
        <div class="insp-stat-grid">
          <div>📐 Sun Alignment: <strong>${alignPct}%</strong></div>
          <div>🌫️ Moon Dust Coating: <strong>${dustPct}%</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-accent" data-insp="minigame-solar">
            ☀️ Play Solar Aligner (Clean & Aim)
          </button>
          <button type="button" class="btn btn-secondary" data-insp="clean" ${s.cooldowns.cleanPanels > 0 ? 'disabled' : ''}>
            🧹 Quick Brush (−4% Battery)
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'greenhouse') {
      const growth = Math.round(mod.growth);
      specificControls = `
        <div class="insp-stat-grid">
          <div>🌱 Crop Growth: <strong>${growth}%</strong></div>
          <div>⚡ Power Draw: <strong>${mod.online ? '3 W' : '0 W (OFF)'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-primary" data-insp="harvest" ${growth < 100 ? 'disabled' : ''}>
            🥬 Harvest Space Greens (+30% Food)
          </button>
          <button type="button" class="btn btn-secondary" data-insp="toggle">
            ${mod.online ? '⚪ Switch OFF' : '🟢 Switch ON'}
          </button>
        </div>
      `;
    } else if (selectedBuilding === 'lab') {
      specificControls = `
        <div class="insp-stat-grid">
          <div>🔬 Science Output: <strong>${mod.online && !s.crew.sheltered ? '+0.45 pt/s' : 'Paused'}</strong></div>
          <div>⚡ Power Draw: <strong>${mod.online && !s.crew.sheltered ? '4 W' : '0 W'}</strong></div>
        </div>
        <div class="insp-actions">
          <button type="button" class="btn btn-secondary" data-insp="toggle">
            ${mod.online ? '⚪ Switch OFF (Save Power)' : '🟢 Switch ON'}
          </button>
          <button type="button" class="btn btn-secondary" data-insp="ice" ${s.cooldowns.collectIce > 0 ? 'disabled' : ''}>
            🧊 Dispatch Ice Rover (+25% Water)
          </button>
        </div>
      `;
    }

    inspectorEl.innerHTML = `
      <div class="insp-header">
        <div>
          <span class="insp-eyebrow">SELECTED BUILDING</span>
          <h3>${info.icon} ${info.name}</h3>
        </div>
        <span class="insp-health">🔧 ${Math.round(mod.health)}%</span>
      </div>
      <p class="insp-desc">${info.role}</p>
      <p class="insp-how">${info.howItWorks}</p>
      ${specificControls}
      <div class="insp-repair-row">
        <button type="button" class="btn btn-secondary btn-full" data-insp="repair" ${s.inventory.repairKits <= 0 || mod.health >= 99 ? 'disabled' : ''}>
          🧰 Repair ${info.name} (+40% Condition · Uses 1 Kit)
        </button>
      </div>
      ${
        chosenFact
          ? `<div class="fact-box">
              <div class="fact-tag">🔬 REAL NASA SCIENCE FACT (${chosenFact.id})</div>
              <p>${chosenFact.kidText}</p>
            </div>`
          : ''
      }
    `;

    inspectorEl.querySelector('[data-insp="toggle"]')?.addEventListener('click', () => {
      runAction({ type: 'toggleModule', moduleId: selectedBuilding });
    });
    inspectorEl.querySelector('[data-insp="repair"]')?.addEventListener('click', () => {
      runAction({ type: 'repairModule', moduleId: selectedBuilding });
    });
    inspectorEl.querySelector('[data-insp="shelter"]')?.addEventListener('click', () => {
      runAction({ type: 'setShelter', on: !s.crew.sheltered });
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
    objectivesEl.innerHTML = OBJECTIVES.map((o) => {
      const done = Boolean(s.objectives[o.id]);
      return `<li class="${done ? 'is-done' : ''}"><span>${done ? '✅' : '⬜'} ${o.icon}</span> ${o.text}</li>`;
    }).join('');

    logEl.innerHTML = s.log
      .slice(0, 10)
      .map(
        (entry) =>
          `<div class="log-item is-${entry.kind}"><span class="log-day">D${entry.day}</span> ${entry.text}</div>`
      )
      .join('');
  }

  function renderModal(s) {
    // Priority 1: Mission Won / Lost screen
    if (s.mission.status === 'won' || s.mission.status === 'lost') {
      const won = s.mission.status === 'won';
      const stars = '⭐'.repeat(s.mission.stars) + '☆'.repeat(Math.max(0, 3 - s.mission.stars));
      const objDone = Object.values(s.objectives).filter(Boolean).length;
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card outcome-card">
          <div class="outcome-badge">${won ? '🎉 MISSION ACCOMPLISHED!' : '🚨 EARLY MISSION RETURN'}</div>
          <h2>${won ? 'Great Job, Junior Commander!' : 'Mission Control Brought the Crew Home Safely'}</h2>
          ${won ? `<div class="outcome-stars" aria-label="${s.mission.stars} out of 3 stars">${stars}</div>` : ''}
          <p class="outcome-reason">${s.mission.outcomeReason || ''}</p>
          <div class="outcome-stats">
            <div>📅 Days Survived: <strong>${s.mission.day} / ${BALANCE.time.missionDays}</strong></div>
            <div>🔬 Research Collected: <strong>${Math.round(s.resources.research)} pts</strong></div>
            <div>🎯 Objectives Completed: <strong>${objDone} / ${OBJECTIVES.length}</strong></div>
            <div>🥬 Crops Harvested: <strong>${s.stats.harvests}</strong></div>
          </div>
          <div class="fact-box">
            <div class="fact-tag">🧠 WHAT YOU LEARNED</div>
            <p>
              Living on the Moon requires balancing <strong>closed-loop life support</strong> (splitting water into oxygen and recycling water),
              <strong>solar power & battery storage</strong> during shadows, <strong>radiation shielding</strong> during solar storms,
              and <strong>timely maintenance</strong>!
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-primary" id="modal-restart">🚀 Play Again (New Mission)</button>
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
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card tutorial-card">
          <div class="tutorial-step-tag">JUNIOR ASTRONAUT MISSION BRIEFING · STEP ${tutorialStepIndex + 1} OF ${TUTORIAL_STEPS.length}</div>
          <h2>${step.icon} ${step.title}</h2>
          <p class="tutorial-body">${step.body}</p>
          <div class="fact-box">
            <div class="fact-tag">💡 COMMANDER TIP</div>
            <p>${step.tip}</p>
          </div>
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
                  : `<button type="button" class="btn btn-primary" id="tut-launch">🌕 Launch Outpost!</button>`
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
          <div class="modal-card decision-card">
            <div class="decision-badge">🚨 MISSION EVENT · DAY ${s.mission.day}</div>
            <h2>${def.icon} ${def.title}</h2>
            <p class="decision-body">${def.kidText}</p>
            <div class="fact-box">
              <div class="fact-tag">📘 WHY THIS HAPPENS</div>
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
        <div class="modal-card guide-card">
          <div class="mg-header">
            <div>
              <span class="mg-badge">NASA ARTEMIS & ISS SCIENCE REFERENCE</span>
              <h2>📘 Junior Astronaut Science Field Guide</h2>
            </div>
            <button type="button" class="btn btn-ghost" id="guide-close">✕ Close</button>
          </div>
          <div class="guide-tabs">
            <button type="button" class="btn btn-chip ${guideTab === 'facts' ? 'is-active' : ''}" data-gtab="facts">🔬 Real NASA Facts (${FACTS.length})</button>
            <button type="button" class="btn btn-chip ${guideTab === 'glossary' ? 'is-active' : ''}" data-gtab="glossary">📖 Space Glossary</button>
            <button type="button" class="btn btn-chip ${guideTab === 'sim' ? 'is-active' : ''}" data-gtab="sim">⚖️ Real Science vs Game</button>
            <button type="button" class="btn btn-chip ${guideTab === 'sources' ? 'is-active' : ''}" data-gtab="sources">🔗 NASA Sources (${Object.keys(SOURCES).length})</button>
          </div>

          ${
            guideTab === 'facts'
              ? `
              <div class="guide-topic-bar">
                ${topics
                  .map(
                    (t) =>
                      `<button type="button" class="btn btn-mini ${guideTopic === t ? 'is-active' : ''}" data-gtopic="${t}">${t.toUpperCase()}</button>`
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
                    <small class="guide-caveat">Note: ${f.caveat}</small>
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
                  <strong>⏱️ Time Scale (SIMULATION_VALUE vs REAL_SCIENTIFIC_FACT)</strong>
                  <p>In the game, 1 mission day is <strong>60 seconds</strong> so you can complete a 7-day mission in about 7 minutes. On the real Moon, one full day-night cycle (synodic day) takes about <strong>29.5 Earth days</strong>!</p>
                </div>
                <div class="guide-item">
                  <strong>📊 0–100% Resource Bars (SIMULATION_VALUE)</strong>
                  <p>Oxygen, Water, Food, Battery, and Radiation Dose are shown as easy-to-read 0–100% bars. Real NASA mission controllers track pressure in kilopascals (kPa), water in liters, power in kilowatts (kW), and radiation in millisieverts (mSv).</p>
                </div>
                <div class="guide-item">
                  <strong>🧰 Instant Repair Kits (SIMULATION_VALUE)</strong>
                  <p>Clicking Repair fixes a module by +40% right away. Real astronauts follow detailed checklists and spacewalk procedures that can take hours.</p>
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

  function render(snapshot) {
    renderTopBar(snapshot);
    renderBanners(snapshot);
    renderBuildingList(snapshot);
    renderQuickActions(snapshot);
    renderInspector(snapshot);
    renderObjectivesAndLog(snapshot);
    renderModal(snapshot);
  }

  const unsubscribe = store.subscribe((snapshot) => {
    render(snapshot);
  });

  render(store.getState());

  return {
    selectBuilding: (id) => selectBuilding(id, false),
    showToast,
    destroy() {
      unsubscribe();
      clearTimeout(toastTimeout);
      root.innerHTML = '';
    },
  };
}

