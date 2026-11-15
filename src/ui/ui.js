// Junior Astronaut Mission Trainer — Redesigned Aerospace Game HUD & Modal System
// Consumes read-only snapshots from `store` and dispatches named actions; never computes resource math.

import { BALANCE } from '../data/gameBalance.js';
import { MISSION_EVENTS } from '../data/missionEvents.js';
import { OBJECTIVES } from '../data/objectives.js';
import { FACTS, SOURCES, SIMULATION_UNITS_NOTICE, factsFor } from '../data/scienceFacts.js';
import { SCENARIOS, SCENARIO_ORDER, getScenarioById } from '../data/scenarios.js';
import { getSpaceWeatherAdvisory, SPACE_WEATHER_SOURCE } from '../data/spaceWeatherFeed.js';
import { computeCampaignReport, canStartScenarioRun } from '../systems/CampaignSystem.js';
import { formatTimerRange } from '../systems/TimerSystem.js';
import {
  TUTORIAL_STEPS,
  BUILDING_INFO,
  RESOURCE_HELP,
  GLOSSARY,
  getContextualHint,
} from '../data/educationContent.js';
import {
  renderBrandEmblem,
  renderResourceIcon,
  renderBuildingIllustration,
  renderNasaGuideBadge,
  renderCommanderRobot,
} from './icons.js';
import { SOUNDS } from './soundFx.js';
import { TRAINING_TASKS } from '../data/trainingTasks.js';

const BUILDING_ORDER = ['habitat', 'lifeSupport', 'solar', 'greenhouse', 'lab', 'comms'];

const BUILDING_TIPS = {
  habitat: 'Add Moon soil (regolith) to the roof before a solar storm.',
  lifeSupport: 'Splits lunar water into breathable oxygen! Seal air leaks right away.',
  solar: 'Tall solar towers spin to catch low South Pole sunlight. Keep them dust-free!',
  greenhouse: 'Click Harvest when plants hit 100% for +30% fresh space food!',
  lab: 'Earns Science Points! Pause the Lab during mountain shadows to save battery.',
  comms: 'Beams telemetry 384,400 km to Earth (~2.56s round-trip) & relays NASA DONKI alerts!',
};

function pct(v) {
  return `${Math.round(v)}%`;
}

function resourceFillClass(key, value, invert = false) {
  if (invert) {
    if (value >= 70) return 'bar-fill is-bad';
    if (value >= 35) return 'bar-fill is-warn';
    return 'bar-fill is-good';
  }
  if (value <= 25) return 'bar-fill is-bad';
  if (value <= 45) return 'bar-fill is-warn';
  if (key === 'oxygen') return 'bar-fill is-air';
  if (key === 'water') return 'bar-fill is-water';
  if (key === 'food') return 'bar-fill is-food';
  if (key === 'battery') return 'bar-fill is-power';
  if (key === 'crew') return 'bar-fill is-crew';
  return 'bar-fill is-good';
}

function speakerSvg(muted) {
  if (muted) {
    return `
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path d="M11 5L6 9H3v6h3l5 4V5z" fill="#94a3b8"/>
        <path d="M16 9l5 6M21 9l-5 6" stroke="#fb7185" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }
  return `
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="M11 5L6 9H3v6h3l5 4V5z" fill="#e2e8f0"/>
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

function splitLeadSentence(text) {
  const idx = text.search(/[!?.]\s/);
  if (idx > 0 && idx < 48) {
    return {
      lead: text.slice(0, idx + 1),
      rest: text.slice(idx + 2),
    };
  }
  return { lead: 'Commander Tip:', rest: text };
}

export function mountUI({
  root,
  store,
  openMinigame,
  onRestart,
  scene,
  onStartArrivalCinematic,
  onSkipCinematic,
  onRetryWebGL,
  onStartStory,
} = {}) {
  let selectedBuilding = 'habitat';
  let rightTab = 'details'; // 'details' | 'goals' | 'radio'
  let welcomeOpen = store.getState().mission.status === 'intro';
  let tutorialStepIndex = 0;
  let guideOpen = false;
  let campaignOpen = false;
  let settingsOpen = false;
  let reportOpen = false;
  let guideTab = 'facts';
  let guideTopic = 'moon';
  let toastTimeout = null;
  let captionTimeout = null;
  let celebrateUntil = 0;
  let webglFallbackState = { unavailable: false, reason: '' };
  let initStatus = { loading: false, progressText: '' };

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
      <!-- TOP MISSION TELEMETRY & CONTROLS BAR -->
      <header class="hud-topbar" aria-label="Artemis Base Status Dashboard">
        <div class="brand-cluster">
          <div class="brand-logo-wrap">
            ${renderBrandEmblem()}
            <div class="brand-wordmark">
              <span class="brand-title">ARTEMIS</span>
              <span class="brand-subtitle">BASE</span>
            </div>
          </div>
          <div class="brand-sep" aria-hidden="true"></div>
          <div class="mission-clock">
            <div class="clock-row">
              <span aria-hidden="true">📅</span>
              <span id="ui-day" class="clock-day">DAY 1 / 7</span>
            </div>
            <div class="clock-row">
              <span id="ui-phase-icon" aria-hidden="true">☀️</span>
              <span id="ui-phase" class="clock-phase is-day">South Pole Sun</span>
            </div>
          </div>
        </div>

        <div class="topbar-telemetry">
          <div class="resource-strip" id="ui-resources" role="region" aria-label="Primary crew supplies">
            <div class="res-pill" id="pill-oxygen" tabindex="0">
              <span class="res-icon-wrap">${renderResourceIcon('oxygen')}</span>
              <div class="res-body">
                <div class="res-head"><span class="res-label">AIR</span><strong id="val-oxygen">85%</strong></div>
                <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.oxygen.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="85"><div id="bar-oxygen" class="bar-fill is-air" style="width:85%"></div></div>
              </div>
              <span class="res-delta" id="delta-oxygen" hidden></span>
              <div class="res-tooltip" role="tooltip">
                <div class="res-tooltip-title">${RESOURCE_HELP.oxygen.label}</div>
                <div>${RESOURCE_HELP.oxygen.explain}</div>
              </div>
            </div>

            <div class="res-pill" id="pill-water" tabindex="0">
              <span class="res-icon-wrap">${renderResourceIcon('water')}</span>
              <div class="res-body">
                <div class="res-head"><span class="res-label">WATER</span><strong id="val-water">80%</strong></div>
                <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.water.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"><div id="bar-water" class="bar-fill is-water" style="width:80%"></div></div>
              </div>
              <span class="res-delta" id="delta-water" hidden></span>
              <div class="res-tooltip" role="tooltip">
                <div class="res-tooltip-title">${RESOURCE_HELP.water.label}</div>
                <div>${RESOURCE_HELP.water.explain}</div>
              </div>
            </div>

            <div class="res-pill" id="pill-food" tabindex="0">
              <span class="res-icon-wrap">${renderResourceIcon('food')}</span>
              <div class="res-body">
                <div class="res-head"><span class="res-label">FOOD</span><strong id="val-food">70%</strong></div>
                <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.food.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="70"><div id="bar-food" class="bar-fill is-food" style="width:70%"></div></div>
              </div>
              <span class="res-delta" id="delta-food" hidden></span>
              <div class="res-tooltip" role="tooltip">
                <div class="res-tooltip-title">${RESOURCE_HELP.food.label}</div>
                <div>${RESOURCE_HELP.food.explain}</div>
              </div>
            </div>

            <div class="res-pill" id="pill-battery" tabindex="0">
              <span class="res-icon-wrap">${renderResourceIcon('battery')}</span>
              <div class="res-body">
                <div class="res-head"><span class="res-label">POWER</span><strong id="val-battery">80%</strong></div>
                <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.battery.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="80"><div id="bar-battery" class="bar-fill is-power" style="width:80%"></div></div>
              </div>
              <span class="res-delta" id="delta-battery" hidden></span>
              <div class="res-tooltip" role="tooltip">
                <div class="res-tooltip-title">${RESOURCE_HELP.battery.label}</div>
                <div>${RESOURCE_HELP.battery.explain}</div>
                <div class="res-tooltip-meta" id="val-power-net">⚡ +0W net</div>
              </div>
            </div>

            <div class="res-pill" id="pill-crew" tabindex="0">
              <span class="res-icon-wrap">${renderResourceIcon('crew')}</span>
              <div class="res-body">
                <div class="res-head"><span class="res-label">CREW</span><strong id="val-crew">100%</strong></div>
                <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.crew.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div id="bar-crew" class="bar-fill is-crew" style="width:100%"></div></div>
              </div>
              <span class="res-delta" id="delta-crew" hidden></span>
              <div class="res-tooltip" role="tooltip">
                <div class="res-tooltip-title">${RESOURCE_HELP.crew.label} (4 Astronauts)</div>
                <div>${RESOURCE_HELP.crew.explain}</div>
              </div>
            </div>
          </div>

          <div class="telemetry-secondary-row">
            <div class="res-pill res-pill-sub" id="pill-radiation" tabindex="0">
              <span class="res-icon-wrap">${renderResourceIcon('radiation')}</span>
              <div class="res-body">
                <div class="res-sub-inline">
                  <span class="res-label">SAFETY</span>
                  <div class="bar-track" role="progressbar" aria-label="Crew safety training score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div id="bar-radiation" class="bar-fill is-good" style="width:100%"></div></div>
                  <strong id="val-radiation">100%</strong>
                </div>
              </div>
              <span class="res-delta" id="delta-radiation" hidden></span>
              <div class="res-tooltip" role="tooltip">
                <div class="res-tooltip-title">${RESOURCE_HELP.radiation.label}</div>
                <div>${RESOURCE_HELP.radiation.explain}</div>
                <div>Safety shows 100 minus simulated exposure. Higher is better; this is a game score.</div>
                <div class="res-tooltip-meta" id="val-shield">🛡️ Shield 0/3</div>
              </div>
            </div>

            <div class="res-pill res-pill-sub" id="pill-research" tabindex="0">
              <span class="res-icon-wrap">${renderResourceIcon('research')}</span>
              <div class="res-body">
                <div class="res-sub-inline">
                  <span class="res-label">SCIENCE</span>
                  <div class="bar-track" role="progressbar" aria-label="${RESOURCE_HELP.research.label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="bar-research" class="bar-fill is-science" style="width:0%"></div></div>
                  <strong id="val-research">0 / 100</strong>
                </div>
              </div>
              <span class="res-delta" id="delta-research" hidden></span>
              <div class="res-tooltip" role="tooltip">
                <div class="res-tooltip-title">${RESOURCE_HELP.research.label}</div>
                <div>${RESOURCE_HELP.research.explain}</div>
              </div>
            </div>

            <span class="res-power-tag is-pos" id="pill-power-chip" title="Power Generated minus Power Used">⚡ +0W</span>
          </div>
        </div>

        <div class="controls-cluster" aria-label="Mission time and utility controls">
          <button type="button" class="btn btn-campaign-pill" id="btn-campaign" title="Open 3-Scenario Campaign (5 Runs to Earth Return)">
            🚀 <span id="ui-runs-badge">Runs 0/5</span>
          </button>
          <button type="button" class="btn btn-pause-icon" data-speed="0" aria-pressed="false" title="Pause or Resume (Space)">⏸</button>
          <div class="speed-capsule" role="group" aria-label="Game Speed">
            <button type="button" class="btn btn-chip is-active" data-speed="1" aria-pressed="true" title="Normal Speed">1x</button>
            <button type="button" class="btn btn-chip" data-speed="2" aria-pressed="false" title="Fast Speed">2x</button>
            <button type="button" class="btn btn-chip" data-speed="3" aria-pressed="false" title="Super Fast Speed">3x</button>
          </div>
          <button type="button" class="btn btn-util-icon" id="btn-settings" title="Accessibility & Display Settings" aria-label="Accessibility and Settings">⚙️</button>
          <button type="button" class="btn btn-util-icon" id="btn-sound" title="Toggle Sound (M)" aria-label="Toggle Sound">${speakerSvg(SOUNDS.isMuted())}</button>
          <button type="button" class="btn btn-nasa-guide" id="btn-guide" title="Open NASA Science Field Guide">
            ${renderNasaGuideBadge()}
            <span>NASA<br/>GUIDE</span>
          </button>
          <button type="button" class="btn btn-reset-pill" id="btn-restart" title="Start a fresh mission">↻ RESET</button>
        </div>
      </header>

      <!-- PERIMETER SIDEBARS + UPPER-CENTER SKY COMMANDER (CENTER 3D VIEW REMAINS CLEAR) -->
      <div class="hud-columns">
        <aside class="hud-left-panel" aria-label="Base building selector and quick actions">
          <div class="panel-card hud-left-card">
            <div class="section-header-row">
              <h3 class="section-heading"><span aria-hidden="true">🏠</span> YOUR BASE</h3>
              <button type="button" class="btn btn-secondary btn-mini" id="btn-cam-overview" title="Reset camera to full Moon base view (Press 0)">[0] View</button>
            </div>
            <div class="building-list" id="ui-building-list" role="group" aria-label="Select a Moon base building"></div>

            <div class="panel-divider"></div>

            <div class="section-header-row">
              <h3 class="section-heading"><span aria-hidden="true">🔧</span> QUICK ACTIONS</h3>
            </div>
            <div id="ui-quick-actions"></div>
          </div>
        </aside>

        <div class="hud-center-lane">
          <div id="ui-init-banner" class="cinematic-banner" role="status" aria-live="polite" hidden></div>
          <div id="ui-cinematic-beat" class="cinematic-beat" role="status" aria-live="polite" hidden></div>
          <div id="ui-cinematic-banner" class="cinematic-banner" role="status" aria-live="polite" hidden></div>
          <div id="ui-event-banner" class="event-banner" role="alert" aria-live="assertive" hidden></div>
          <div id="ui-hint-bar" class="commander-bubble-wrap" role="status" aria-live="polite"></div>
          <div id="ui-2d-fallback" class="fallback-2d-map" hidden></div>
          <div id="ui-caption-strip" class="audio-caption-strip" aria-live="polite" hidden></div>
        </div>

        <aside class="hud-right-panel" aria-label="Selected building details, goals, and mission radio">
          <div class="panel-card hud-right-card">
            <div class="right-tabs-bar">
              <h3 class="section-heading" id="ui-right-title"><span aria-hidden="true">📚</span> BUILDING DETAILS</h3>
              <div class="right-tab-pills" role="tablist" aria-label="Right panel views">
                <button type="button" role="tab" aria-selected="true" class="right-tab-btn is-active" data-rtab="details">Info</button>
                <button type="button" role="tab" aria-selected="false" class="right-tab-btn" data-rtab="goals" id="tab-goals-btn">🎯 0/7</button>
                <button type="button" role="tab" aria-selected="false" class="right-tab-btn" data-rtab="radio">📡</button>
              </div>
            </div>

            <div id="ui-inspector" aria-live="polite"></div>
            <div id="ui-goals-pane" hidden>
              <ul class="objective-list" id="ui-objectives"></ul>
            </div>
            <div id="ui-radio-pane" hidden>
              <div class="log-feed" id="ui-log" role="log" aria-live="polite" aria-relevant="additions text"></div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Toast notifications -->
      <div id="ui-toast" class="hud-toast" role="status" aria-live="polite" hidden></div>

      <!-- Modals (Welcome, Briefing, Event Decision, Science Guide, Pause, Outcome) -->
      <div id="ui-modal-backdrop" class="modal-backdrop" role="dialog" aria-modal="true" aria-label="Mission Dialog" hidden>
        <div id="ui-modal-content" class="modal-box"></div>
      </div>
    </div>
  `;

  // DOM References
  const dayEl = root.querySelector('#ui-day');
  const phaseEl = root.querySelector('#ui-phase');
  const phaseIconEl = root.querySelector('#ui-phase-icon');
  const powerChipEl = root.querySelector('#pill-power-chip');
  const runsBadgeEl = root.querySelector('#ui-runs-badge');
  const hudShellEl = root.querySelector('.hud-shell');
  const initBannerEl = root.querySelector('#ui-init-banner');
  const cinematicBeatEl = root.querySelector('#ui-cinematic-beat');
  const cinematicBannerEl = root.querySelector('#ui-cinematic-banner');
  const fallbackMapEl = root.querySelector('#ui-2d-fallback');
  const captionStripEl = root.querySelector('#ui-caption-strip');
  const eventBannerEl = root.querySelector('#ui-event-banner');
  const hintBarEl = root.querySelector('#ui-hint-bar');
  const buildingListEl = root.querySelector('#ui-building-list');
  const quickActionsEl = root.querySelector('#ui-quick-actions');
  const rightTitleEl = root.querySelector('#ui-right-title');
  const inspectorEl = root.querySelector('#ui-inspector');
  const goalsPaneEl = root.querySelector('#ui-goals-pane');
  const radioPaneEl = root.querySelector('#ui-radio-pane');
  const goalsTabBtn = root.querySelector('#tab-goals-btn');
  const objectivesEl = root.querySelector('#ui-objectives');
  const logEl = root.querySelector('#ui-log');
  const toastEl = root.querySelector('#ui-toast');
  const soundBtn = root.querySelector('#btn-sound');
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
  let lastCinematicBeatHtml = '';
  let lastCinematicHtml = '';
  let lastFallbackHtml = '';
  let liveCinematicProgress = 0;

  function showCaption(text) {
    const s = store.getState();
    if (!text || s.settings?.captionsEnabled === false || !captionStripEl) return;
    captionStripEl.textContent = `🔊 ${text}`;
    captionStripEl.hidden = false;
    clearTimeout(captionTimeout);
    captionTimeout = setTimeout(() => {
      captionStripEl.hidden = true;
    }, 2800);
  }

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
    SOUNDS.action();
    const res = store.dispatch(action);
    if (!res.ok) {
      SOUNDS.alert();
      showToast(`💡 ${res.message}`, 'warn');
    } else if (res.opensMinigame) {
      openMinigame(res.opensMinigame);
    } else if (res.message && action.type !== 'setSpeed') {
      SOUNDS.success();
      if (action.type === 'harvestCrops' || action.type === 'buildShielding') {
        celebrateUntil = Date.now() + 3800;
      }
      showToast(`🌟 ${res.message}`, 'good');
    }
    return res;
  }

  function switchRightTab(tab) {
    rightTab = tab;
    root.querySelectorAll('[data-rtab]').forEach((btn) => {
      const active = btn.dataset.rtab === tab;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    if (rightTitleEl) {
      rightTitleEl.innerHTML =
        tab === 'goals'
          ? '<span aria-hidden="true">🎯</span> MISSION GOALS'
          : tab === 'radio'
          ? '<span aria-hidden="true">📡</span> MISSION RADIO'
          : '<span aria-hidden="true">📚</span> BUILDING DETAILS';
    }
    inspectorEl.hidden = tab !== 'details';
    goalsPaneEl.hidden = tab !== 'goals';
    radioPaneEl.hidden = tab !== 'radio';
  }

  function selectBuilding(buildingId, focus3D = true) {
    if (!BUILDING_INFO[buildingId]) return;
    SOUNDS.click();
    selectedBuilding = buildingId;
    switchRightTab('details');
    if (focus3D && scene && typeof scene.focusBuilding === 'function') {
      scene.focusBuilding(buildingId);
    }
    render(store.getState());
  }

  // Right panel tabs
  root.querySelectorAll('[data-rtab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SOUNDS.click();
      switchRightTab(btn.dataset.rtab);
    });
  });

  // Sound toggle
  soundBtn?.addEventListener('click', () => {
    const isMuted = SOUNDS.toggleMute();
    soundBtn.innerHTML = speakerSvg(isMuted);
    showToast(isMuted ? '🔇 Sound muted' : '🔊 Sound enabled', 'info');
    if (!isMuted) SOUNDS.click();
  });

  // Speed & pause controls
  root.querySelectorAll('[data-speed]').forEach((btn) => {
    btn.addEventListener('click', () => {
      SOUNDS.click();
      runAction({ type: 'setSpeed', speed: Number(btn.dataset.speed) });
    });
  });

  root.querySelector('#btn-cam-overview')?.addEventListener('click', () => {
    SOUNDS.click();
    if (scene && typeof scene.focusBuilding === 'function') {
      scene.focusBuilding(null);
    }
    showToast('🎥 Overview: Seeing all of Artemis Base!', 'info');
  });

  function handleRestart() {
    SOUNDS.click();
    selectedBuilding = 'habitat';
    switchRightTab('details');
    guideOpen = false;
    campaignOpen = false;
    settingsOpen = false;
    reportOpen = false;
    welcomeOpen = true;
    tutorialStepIndex = 0;
    celebrateUntil = 0;
    lastModalKey = '';
    onRestart();
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
  }

  root.querySelector('#btn-campaign')?.addEventListener('click', () => {
    SOUNDS.click('Opened 3-Scenario Training Campaign.');
    const s = store.getState();
    if (s.campaign?.endingTriggered) {
      reportOpen = true;
    } else {
      campaignOpen = true;
    }
    renderModal(s);
  });

  root.querySelector('#btn-settings')?.addEventListener('click', () => {
    SOUNDS.click('Opened Accessibility & Graphics Settings.');
    settingsOpen = true;
    renderModal(store.getState());
  });

  root.querySelector('#btn-guide')?.addEventListener('click', () => {
    SOUNDS.click();
    guideOpen = true;
    renderModal(store.getState());
  });

  root.querySelector('#btn-restart')?.addEventListener('click', handleRestart);

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

    for (const obj of OBJECTIVES) {
      if (s.objectives[obj.id] && !prevObjectives[obj.id]) {
        SOUNDS.fanfare();
        celebrateUntil = Date.now() + 4800;
        showToast(`🎉 Goal Complete: ${obj.icon} ${obj.text}`, 'good');
      }
    }
    prevObjectives = { ...s.objectives };
  }

  function renderTopBar(s) {
    const r = s.resources;
    dayEl.textContent = `DAY ${s.mission.day} / ${BALANCE.time.missionDays}`;
    const hasShadow = s.activeEvents.some((e) => e.eventId === 'longShadow' && e.phase === 'active');
    if (hasShadow) {
      if (phaseIconEl) phaseIconEl.textContent = '⛰️';
      phaseEl.textContent = 'Mountain Shadow';
      phaseEl.className = 'clock-phase is-night';
    } else if (s.mission.isDaylight) {
      if (phaseIconEl) phaseIconEl.textContent = '☀️';
      phaseEl.textContent = 'South Pole Sun';
      phaseEl.className = 'clock-phase is-day';
    } else {
      if (phaseIconEl) phaseIconEl.textContent = '🌑';
      phaseEl.textContent = 'Polar Dusk';
      phaseEl.className = 'clock-phase is-night';
    }

    const bars = [
      ['oxygen', r.oxygen, false],
      ['water', r.water, false],
      ['food', r.food, false],
      ['battery', r.battery, false],
      ['radiation', 100 - s.crew.radiationDose, false],
      ['crew', s.crew.health, false],
    ];
    for (const [key, val, inv] of bars) {
      const vEl = root.querySelector(`#val-${key}`);
      const bEl = root.querySelector(`#bar-${key}`);
      if (vEl) vEl.textContent = pct(val);
      if (bEl) {
        const clamped = Math.max(0, Math.min(100, val));
        bEl.style.width = `${clamped}%`;
        bEl.className = resourceFillClass(key, val, inv);
        bEl.parentElement?.setAttribute('aria-valuenow', String(Math.round(clamped)));
      }
    }

    const net = s.power.net;
    const sign = net >= 0 ? '+' : '';
    const netEl = root.querySelector('#val-power-net');
    if (netEl) {
      netEl.textContent = s.power.brownout
        ? '🔌 Blackout! Recharging battery to 12%…'
        : `⚡ ${s.power.generation}W in · ${s.power.consumption}W used (${sign}${net}W)`;
    }
    if (powerChipEl) {
      powerChipEl.textContent = s.power.brownout ? '⚡ RECHARGING' : `⚡ ${sign}${net}W`;
      powerChipEl.className = `res-power-tag ${net < 0 || s.power.brownout ? 'is-neg' : 'is-pos'}`;
    }

    if (runsBadgeEl) {
      const doneRuns = s.campaign?.completedRuns ?? 0;
      const totalRuns = s.campaign?.totalRunsRequired ?? 5;
      runsBadgeEl.textContent = s.campaign?.endingTriggered
        ? `Earth Return (${doneRuns}/${totalRuns})`
        : `Runs ${doneRuns}/${totalRuns}`;
    }

    const shieldEl = root.querySelector('#val-shield');
    if (shieldEl) {
      shieldEl.textContent = `🛡️ Moon Shield: ${s.shieldLevel}/3${
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
      const speedVal = Number(btn.dataset.speed);
      const active = speedVal === s.mission.speed;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
      if (speedVal === 0) {
        btn.textContent = active ? '▶' : '⏸';
      }
    });
  }

  function deriveCommanderState(s, hint) {
    if (Date.now() < celebrateUntil || s.mission.status === 'won') return 'celebrate';
    if (hint.kind === 'bad' || hint.kind === 'warn') return 'alert';
    if (hint.kind === 'good' || s.resources.research >= 50) return 'happy';
    return 'idle';
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
                : `${Math.ceil(inst.remaining)}s left`
              : 'Needs your help!';
          return `
            <div class="event-chip is-${def.kind || 'warn'}">
              ${def.icon} <strong>${def.title}</strong> (${timeTag}) — ${def.kidText}
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
    const roboState = deriveCommanderState(s, hint);
    const { lead, rest } = splitLeadSentence(hint.text);
    const nextHintHtml = `
      <div class="commander-avatar-frame">
        ${renderCommanderRobot(roboState)}
      </div>
      <div class="commander-speech-bubble is-${hint.kind}">
        <span class="commander-lead">${lead}</span> ${rest}
        <span class="bubble-sparkle" aria-hidden="true">✦</span>
      </div>
    `;
    if (nextHintHtml !== lastHintBarHtml) {
      lastHintBarHtml = nextHintHtml;
      hintBarEl.innerHTML = nextHintHtml;
    }

    // Cinematic HUD letterbox mode, restrained beat overlay, & Mission Control lower telemetry bar
    const cinActive = Boolean(s.cinematics?.active && s.cinematics.active !== 'none');
    if (hudShellEl) {
      hudShellEl.classList.toggle('is-cinematic', cinActive);
    }

    if (cinematicBeatEl) {
      if (cinActive && s.cinematics.title) {
        const nextBeatHtml = `
          <div class="cin-beat-kicker">${s.cinematics.label || 'ARTEMIS MISSION CONTROL'}</div>
          <div class="cin-beat-title">${s.cinematics.title}</div>
          ${s.cinematics.subtitle ? `<div class="cin-beat-sub">${s.cinematics.subtitle}</div>` : ''}
        `;
        cinematicBeatEl.hidden = false;
        if (nextBeatHtml !== lastCinematicBeatHtml) {
          lastCinematicBeatHtml = nextBeatHtml;
          cinematicBeatEl.innerHTML = nextBeatHtml;
        }
      } else {
        cinematicBeatEl.hidden = true;
        lastCinematicBeatHtml = '';
      }
    }

    if (cinematicBannerEl) {
      if (cinActive) {
        const isMutedNow = SOUNDS.isMuted();
        const pctWidth = Math.round(Math.max(0, Math.min(1, liveCinematicProgress)) * 1000) / 10;
        const nextCinHtml = `
          <div class="cin-bar-main">
            <div class="cin-bar-meta">
              <span class="cin-stage-pill">${s.cinematics.label || 'ARTEMIS ACT 1'}</span>
              <span class="cin-caption-text">${s.cinematics.caption || 'Running mission sequence...'}</span>
            </div>
            <div class="cin-bar-controls">
              <button type="button" class="btn btn-util-icon cin-mute-btn" id="btn-cin-mute" title="Toggle Sound (M)" aria-label="Toggle Sound">${speakerSvg(isMutedNow)}</button>
              <button type="button" class="btn btn-secondary btn-mini" id="btn-skip-cinematic" title="Skip to Completed Outpost (Esc)">⏭ Skip Intro</button>
            </div>
          </div>
          <div class="bar-track cin-progress-track" aria-hidden="true">
            <div id="ui-cinematic-progress-fill" class="bar-fill is-air" style="width:${pctWidth}%"></div>
          </div>
        `;
        cinematicBannerEl.hidden = false;
        if (nextCinHtml !== lastCinematicHtml) {
          lastCinematicHtml = nextCinHtml;
          cinematicBannerEl.innerHTML = nextCinHtml;
          cinematicBannerEl.querySelector('#btn-skip-cinematic')?.addEventListener('click', () => {
            SOUNDS.click('Skipped opening sequence.');
            onSkipCinematic?.();
          });
          cinematicBannerEl.querySelector('#btn-cin-mute')?.addEventListener('click', () => {
            const mutedNow = SOUNDS.toggleMute();
            if (soundBtn) soundBtn.innerHTML = speakerSvg(mutedNow);
            const cinMuteBtn = cinematicBannerEl.querySelector('#btn-cin-mute');
            if (cinMuteBtn) cinMuteBtn.innerHTML = speakerSvg(mutedNow);
            if (!mutedNow) SOUNDS.click();
          });
        }
      } else {
        cinematicBannerEl.hidden = true;
        lastCinematicHtml = '';
        liveCinematicProgress = 0;
      }
    }

    // 2D Base Map Fallback when WebGL fails or context is lost
    if (fallbackMapEl) {
      if (webglFallbackState.unavailable) {
        const nextFallbackHtml = `
          <div class="fallback-header">
            <strong>🗺️ 2D Base Fallback Mode</strong>
            <small>${webglFallbackState.reason || '3D WebGL view paused/unavailable — all systems fully playable in 2D!'}</small>
            <button type="button" class="btn btn-secondary btn-mini" id="btn-retry-webgl">🔄 Retry 3D View</button>
          </div>
          <div class="fallback-nodes">
            ${BUILDING_ORDER.map((id) => {
              const info = BUILDING_INFO[id];
              const mod = s.modules[id];
              const active = id === selectedBuilding;
              return `
                <button type="button" class="fallback-node ${active ? 'is-selected' : ''}" data-fb-select="${id}">
                  <span>${info.icon}</span>
                  <strong>${info.name}</strong>
                  <small>HP ${Math.round(mod.health)}% · ${mod.online ? 'ON' : 'OFF'}</small>
                </button>
              `;
            }).join('')}
          </div>
        `;
        fallbackMapEl.hidden = false;
        if (nextFallbackHtml !== lastFallbackHtml) {
          lastFallbackHtml = nextFallbackHtml;
          fallbackMapEl.innerHTML = nextFallbackHtml;
          fallbackMapEl.querySelectorAll('[data-fb-select]').forEach((btn) => {
            btn.addEventListener('click', () => selectBuilding(btn.dataset.fbSelect, false));
          });
          fallbackMapEl.querySelector('#btn-retry-webgl')?.addEventListener('click', () => {
            SOUNDS.click();
            onRetryWebGL?.();
          });
        }
      } else {
        fallbackMapEl.hidden = true;
        lastFallbackHtml = '';
      }
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
        ? '<span class="b-tag is-bad">LOW PWR</span>'
        : health < 40
        ? '<span class="b-tag is-warn">⚠ FIX</span>'
        : '<span class="b-tag is-on">✓ READY</span>';

      return `
        <button type="button" class="building-btn ${isSelected ? 'is-selected' : ''}" aria-pressed="${isSelected}" data-select-building="${id}" title="Press ${idx + 1} to inspect ${info.name}">
          <span class="b-hotkey" aria-hidden="true">${idx + 1}</span>
          <span class="b-svg-thumb">${renderBuildingIllustration(id, 30)}</span>
          <span class="b-main">
            <strong>${info.name}</strong>
            <small>HP ${health}%${id === 'greenhouse' ? ` · 🌱 ${Math.round(mod.growth)}%` : ''}</small>
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
    const gh = s.modules.greenhouse;
    const cropReady = gh.planted && gh.growth >= 100;
    const hasLeak = s.activeEvents.some((e) => e.eventId === 'oxygenLeak');
    const solarNeedsCare = s.modules.solar.dust > 0.35 || s.modules.solar.alignment < 0.75;

    const nextHtml = `
      <div class="kit-counter-pill">
        <div class="kit-counter-left">
          ${renderResourceIcon('repairKits')}
          <span>Repair Kits:</span>
        </div>
        <span class="kit-counter-val">${s.inventory.repairKits}</span>
      </div>
      <div class="quick-actions-grid">
        <button type="button" class="qa-chip-btn" data-qaction="ice" ${iceCd > 0 ? 'disabled' : ''}>
          <span>🧊 Mine Ice</span>
          <small>${iceCd > 0 ? `Wait ${iceCd}s` : '+25% Water'}</small>
        </button>
        <button type="button" class="qa-chip-btn ${cropReady ? 'is-urgent' : ''}" data-qaction="harvest" ${!cropReady ? 'disabled' : ''}>
          <span>🥬 ${cropReady ? 'Harvest!' : 'Crops'}</span>
          <small>${cropReady ? '+30% Food' : `${Math.round(gh.growth)}% Grown`}</small>
        </button>
        <button type="button" class="qa-chip-btn ${hasLeak ? 'is-urgent' : ''}" data-qminigame="leakHunter">
          <span>🔍 Leak Sim</span>
          <small>+Air & +Sci</small>
        </button>
        <button type="button" class="qa-chip-btn ${solarNeedsCare ? 'is-urgent' : ''}" data-qminigame="solarAligner">
          <span>☀️ Solar Sim</span>
          <small>+Power & +Sci</small>
        </button>
      </div>
      <button type="button" class="btn btn-primary btn-full btn-mini qa-campaign-btn" id="qa-campaign-btn">
        ${
          s.campaign?.endingTriggered
            ? '🏆 View Earth Return Report (5/5)'
            : `🚀 Training Scenarios (${s.campaign?.completedRuns ?? 0}/${s.campaign?.totalRunsRequired ?? 5} Runs)`
        }
      </button>
    `;

    if (nextHtml === lastQuickActionsHtml) return;
    lastQuickActionsHtml = nextHtml;
    quickActionsEl.innerHTML = nextHtml;

    quickActionsEl.querySelector('#qa-campaign-btn')?.addEventListener('click', () => {
      SOUNDS.click();
      const cur = store.getState();
      if (cur.campaign?.endingTriggered) {
        reportOpen = true;
      } else {
        campaignOpen = true;
      }
      renderModal(cur);
    });

    quickActionsEl.querySelector('[data-qaction="ice"]')?.addEventListener('click', () => {
      runAction({ type: 'collectIce' });
    });
    quickActionsEl.querySelector('[data-qaction="harvest"]')?.addEventListener('click', () => {
      runAction({ type: 'harvestCrops' });
    });
    quickActionsEl.querySelectorAll('[data-qminigame]').forEach((btn) => {
      btn.addEventListener('click', () => {
        SOUNDS.click();
        openMinigame(btn.dataset.qminigame);
      });
    });
  }

  function renderInspector(s) {
    const info = BUILDING_INFO[selectedBuilding] || BUILDING_INFO.habitat;
    const mod = s.modules[selectedBuilding];
    const hp = Math.round(mod.health);
    const hpClass = hp < 35 ? 'is-bad' : hp < 60 ? 'is-warn' : '';
    const topicFacts = factsFor(info.topic);
    const chosenFact = topicFacts[s.mission.day % Math.max(1, topicFacts.length)] || FACTS[0];
    const tipText = BUILDING_TIPS[selectedBuilding] || info.howItWorks;

    let statusRows = '';
    let heroCtas = '';

    if (selectedBuilding === 'habitat') {
      statusRows = `
        <div class="insp-status-row">
          <span class="insp-row-label">🛡️ MOON SHIELD</span>
          <strong class="insp-row-val">${s.shieldLevel} / 3</strong>
        </div>
        <div class="insp-status-row">
          <span class="insp-row-label">⛈️ STORM SHELTER</span>
          <span class="b-tag ${s.crew.sheltered ? 'is-warn' : 'is-on'}">${s.crew.sheltered ? 'CREW INSIDE' : 'READY'}</span>
        </div>
      `;
      heroCtas = `
        <button type="button" class="hero-cta ${s.crew.sheltered ? 'hero-cta-amber' : 'hero-cta-cyan'}" data-insp="shelter" title="Keyboard shortcut: S">
          <span class="hotkey-pill" aria-hidden="true">S</span>
          <span class="hero-cta-icon">${s.crew.sheltered ? '👩‍🚀' : '🏠'}</span>
          <span class="hero-cta-title">${s.crew.sheltered ? 'EXIT SHELTER' : 'ENTER SHELTER'}</span>
        </button>
        <button type="button" class="hero-cta hero-cta-coral" data-insp="shield" ${s.shieldLevel >= 3 ? 'disabled' : ''} title="Keyboard shortcut: T">
          <span class="hotkey-pill" aria-hidden="true">T</span>
          <span class="hero-cta-icon">🛡️</span>
          <span class="hero-cta-title">${s.shieldLevel >= 3 ? 'MAX SHIELD' : 'ADD SHIELD'}</span>
          <span class="hero-cta-sub">${s.shieldLevel >= 3 ? '3 / 3 Complete' : '−15% power • −1 kit'}</span>
        </button>
      `;
    } else if (selectedBuilding === 'lifeSupport') {
      statusRows = `
        <div class="insp-status-row">
          <span class="insp-row-label">⚡ POWER USED</span>
          <strong class="insp-row-val">${mod.online ? '3 W' : '0 W (OFF)'}</strong>
        </div>
        <div class="insp-status-row">
          <span class="insp-row-label">💨 AIR MAKING</span>
          <span class="b-tag ${mod.online ? 'is-on' : 'is-off'}">${mod.online ? '+0.7% / s' : 'PAUSED'}</span>
        </div>
      `;
      heroCtas = `
        <button type="button" class="hero-cta hero-cta-cyan" data-insp="minigame-leak" title="Keyboard shortcut: E">
          <span class="hotkey-pill" aria-hidden="true">E</span>
          <span class="hero-cta-icon">🔍</span>
          <span class="hero-cta-title">LEAK HUNTER</span>
          <span class="hero-cta-sub">Seal air leaks & +Sci</span>
        </button>
        <button type="button" class="hero-cta ${mod.online ? 'hero-cta-coral' : 'hero-cta-emerald'}" data-insp="toggle" title="Keyboard shortcut: T">
          <span class="hotkey-pill" aria-hidden="true">T</span>
          <span class="hero-cta-icon">${mod.online ? '⏻' : '⚡'}</span>
          <span class="hero-cta-title">${mod.online ? 'TURN OFF' : 'TURN ON'}</span>
          <span class="hero-cta-sub">${mod.online ? 'Save 3W battery' : 'Resume +Air'}</span>
        </button>
      `;
    } else if (selectedBuilding === 'solar') {
      const alignPct = Math.round(mod.alignment * 100);
      const dustPct = Math.round(mod.dust * 100);
      statusRows = `
        <div class="insp-status-row">
          <span class="insp-row-label">📐 AIM AT SUN</span>
          <strong class="insp-row-val">${alignPct}%</strong>
        </div>
        <div class="insp-status-row">
          <span class="insp-row-label">🌫️ MOON DUST</span>
          <span class="b-tag ${dustPct > 35 ? 'is-warn' : 'is-on'}">${dustPct}%</span>
        </div>
      `;
      heroCtas = `
        <button type="button" class="hero-cta hero-cta-cyan" data-insp="minigame-solar" title="Keyboard shortcut: E">
          <span class="hotkey-pill" aria-hidden="true">E</span>
          <span class="hero-cta-icon">☀️</span>
          <span class="hero-cta-title">SOLAR ALIGNER</span>
          <span class="hero-cta-sub">Brush dust & aim</span>
        </button>
        <button type="button" class="hero-cta hero-cta-amber" data-insp="clean" ${s.cooldowns.cleanPanels > 0 ? 'disabled' : ''} title="Keyboard shortcut: T">
          <span class="hotkey-pill" aria-hidden="true">T</span>
          <span class="hero-cta-icon">🧹</span>
          <span class="hero-cta-title">QUICK BRUSH</span>
          <span class="hero-cta-sub">${s.cooldowns.cleanPanels > 0 ? `${Math.ceil(s.cooldowns.cleanPanels)}s cooldown` : '−4% battery'}</span>
        </button>
      `;
    } else if (selectedBuilding === 'greenhouse') {
      const growth = Math.round(mod.growth);
      statusRows = `
        <div class="insp-status-row">
          <span class="insp-row-label">🌱 CROP GROWTH</span>
          <strong class="insp-row-val">${growth}%</strong>
        </div>
        <div class="bar-track" aria-label="Crop growth ${growth}%"><div class="bar-fill is-food" style="width:${growth}%"></div></div>
        <div class="insp-status-row">
          <span class="insp-row-label">⚡ POWER USED</span>
          <span class="b-tag ${mod.online ? 'is-on' : 'is-off'}">${mod.online ? '3 W' : 'OFF'}</span>
        </div>
      `;
      heroCtas = `
        <button type="button" class="hero-cta ${growth >= 100 ? 'hero-cta-emerald btn-pulse' : 'hero-cta-slate'}" data-insp="harvest" ${growth < 100 ? 'disabled' : ''} title="Keyboard shortcut: E">
          <span class="hotkey-pill" aria-hidden="true">E</span>
          <span class="hero-cta-icon">🥬</span>
          <span class="hero-cta-title">${growth >= 100 ? 'HARVEST FOOD' : 'GROWING…'}</span>
          <span class="hero-cta-sub">${growth >= 100 ? '+30% Space Food' : `${growth}% ready`}</span>
        </button>
        <button type="button" class="hero-cta ${mod.online ? 'hero-cta-coral' : 'hero-cta-cyan'}" data-insp="toggle" title="Keyboard shortcut: T">
          <span class="hotkey-pill" aria-hidden="true">T</span>
          <span class="hero-cta-icon">${mod.online ? '⏻' : '🌱'}</span>
          <span class="hero-cta-title">${mod.online ? 'TURN OFF' : 'TURN ON'}</span>
          <span class="hero-cta-sub">${mod.online ? 'Pause lights (−3W)' : 'Resume growing'}</span>
        </button>
      `;
    } else if (selectedBuilding === 'lab') {
      const labActive = mod.online && !s.crew.sheltered;
      const iceCd = Math.ceil(s.cooldowns.collectIce);
      statusRows = `
        <div class="insp-status-row">
          <span class="insp-row-label">🔬 SCIENCE RATE</span>
          <span class="b-tag ${labActive ? 'is-on' : 'is-off'}">${labActive ? '+0.45 pt/s' : 'PAUSED'}</span>
        </div>
        <div class="insp-status-row">
          <span class="insp-row-label">⚡ POWER USED</span>
          <strong class="insp-row-val">${labActive ? '4 W' : '0 W'}</strong>
        </div>
      `;
      heroCtas = `
        <button type="button" class="hero-cta hero-cta-cyan" data-insp="ice" ${iceCd > 0 ? 'disabled' : ''} title="Keyboard shortcut: E">
          <span class="hotkey-pill" aria-hidden="true">E</span>
          <span class="hero-cta-icon">🧊</span>
          <span class="hero-cta-title">${iceCd > 0 ? `ROVER (${iceCd}s)` : 'MINE ICE'}</span>
          <span class="hero-cta-sub">${iceCd > 0 ? 'Driving back' : '+25% Water • −10% pwr'}</span>
        </button>
        <button type="button" class="hero-cta ${mod.online ? 'hero-cta-coral' : 'hero-cta-emerald'}" data-insp="toggle" title="Keyboard shortcut: T">
          <span class="hotkey-pill" aria-hidden="true">T</span>
          <span class="hero-cta-icon">${mod.online ? '⏻' : '🔬'}</span>
          <span class="hero-cta-title">${mod.online ? 'TURN OFF' : 'TURN ON'}</span>
          <span class="hero-cta-sub">${mod.online ? 'Save 4W battery' : 'Earn Science!'}</span>
        </button>
      `;
    } else if (selectedBuilding === 'comms') {
      const sigPct = Math.round((mod.signalQuality ?? 1) * 100);
      statusRows = `
        <div class="insp-status-row">
          <span class="insp-row-label">📡 EARTH LINK</span>
          <span class="b-tag ${mod.online ? 'is-on' : 'is-off'}">${mod.online ? `${sigPct}% (~2.56s lag)` : 'OFFLINE'}</span>
        </div>
        <div class="insp-status-row">
          <span class="insp-row-label">⚡ POWER USED</span>
          <strong class="insp-row-val">${mod.online ? '1 W' : '0 W'}</strong>
        </div>
      `;
      heroCtas = `
        <button type="button" class="hero-cta hero-cta-cyan" data-insp="minigame-comms" title="Keyboard shortcut: E">
          <span class="hotkey-pill" aria-hidden="true">E</span>
          <span class="hero-cta-icon">📡</span>
          <span class="hero-cta-title">SIGNAL RELAY</span>
          <span class="hero-cta-sub">Aim Earth dish</span>
        </button>
        <button type="button" class="hero-cta ${mod.online ? 'hero-cta-coral' : 'hero-cta-emerald'}" data-insp="toggle" title="Keyboard shortcut: T">
          <span class="hotkey-pill" aria-hidden="true">T</span>
          <span class="hero-cta-icon">${mod.online ? '⏻' : '📡'}</span>
          <span class="hero-cta-title">${mod.online ? 'TURN OFF' : 'TURN ON'}</span>
          <span class="hero-cta-sub">${mod.online ? 'Save 1W power' : 'Resume +Sci'}</span>
        </button>
      `;
    }

    const repairDisabled = s.inventory.repairKits <= 0 || hp >= 99;
    const nextHtml = `
      <div class="insp-hero-row">
        <div class="insp-hero-left">
          <div class="insp-svg-wrap">${renderBuildingIllustration(selectedBuilding, 38)}</div>
          <h4 class="insp-title">${info.name}</h4>
        </div>
        <span class="health-heart-pill ${hpClass}" title="Building Health: ${hp}%">💚 ${hp}%</span>
      </div>

      <p class="insp-desc">${info.role}</p>

      <div class="tip-callout">
        <span aria-hidden="true">💡</span>
        <div><strong>Tip:</strong> ${tipText}</div>
      </div>

      <div class="insp-status-rows">${statusRows}</div>

      <div class="hero-cta-grid">${heroCtas}</div>

      <div class="building-workshops" aria-label="${info.name} activities">
        ${TRAINING_TASKS.filter((task) => task.module === selectedBuilding && !['leakHunter', 'solarAligner', 'commsDelay'].includes(task.id)).map((task) => `<button type="button" class="btn btn-secondary btn-full btn-mini" data-building-task="${task.id}">${task.icon} ${task.title} →</button>`).join('')}
      </div>

      <button type="button" class="btn btn-secondary btn-full btn-mini" data-insp="repair" ${repairDisabled ? 'disabled' : ''} title="Keyboard shortcut: R">
        🧰 ${hp >= 99 ? 'Building at Full Health (100%)' : s.inventory.repairKits <= 0 ? 'No Repair Kits Left' : `Repair Building (+40% HP · −1 Kit) [R]`}
      </button>

      ${
        chosenFact
          ? `<details class="fact-accordion">
              <summary><span>🔬 NASA Fact (${chosenFact.id})</span><span>▾</span></summary>
              <p>${chosenFact.kidText}</p>
            </details>`
          : ''
      }
    `;

    if (nextHtml === lastInspectorHtml) return;
    lastInspectorHtml = nextHtml;
    inspectorEl.innerHTML = nextHtml;
    inspectorEl.querySelectorAll('[data-building-task]').forEach((button) => button.addEventListener('click', () => openMinigame(button.dataset.buildingTask)));

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
      SOUNDS.click();
      openMinigame('leakHunter');
    });
    inspectorEl.querySelector('[data-insp="minigame-solar"]')?.addEventListener('click', () => {
      SOUNDS.click();
      openMinigame('solarAligner');
    });
    inspectorEl.querySelector('[data-insp="minigame-comms"]')?.addEventListener('click', () => {
      SOUNDS.click();
      openMinigame('commsDelay');
    });
  }

  function renderObjectivesAndLog(s) {
    const doneCount = OBJECTIVES.filter((o) => Boolean(s.objectives[o.id])).length;
    if (goalsTabBtn) {
      goalsTabBtn.textContent = `🎯 ${doneCount}/${OBJECTIVES.length}`;
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
      .slice(0, 12)
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
    const hasDecision = Boolean(s.pendingDecision && !s.mission.inMinigame && MISSION_EVENTS[s.pendingDecision.eventId]);
    const isPaused =
      s.mission.status === 'running' &&
      s.mission.speed === 0 &&
      !s.mission.inMinigame &&
      !guideOpen &&
      !campaignOpen &&
      !settingsOpen &&
      !reportOpen &&
      !hasDecision;

    const c = s.campaign || { completedRuns: 0, totalRunsRequired: 5, activeScenarioId: 'siteSetup', activeRun: null };
    const activeRunKey = c.activeRun
      ? `${c.activeRun.runToken}:${c.activeRun.status}:${c.activeRun.decisionId || 'none'}:${Object.keys(c.activeRun.miniGamesDone || {}).length}`
      : 'idle';

    const modalKey = hasDecision
      ? `decision:${s.pendingDecision.instanceId}:${s.pendingDecision.eventId}`
      : reportOpen
      ? `report:${c.completedRuns}:${c.endingTriggered}`
      : campaignOpen
      ? `campaign:${c.completedRuns}:${c.activeScenarioId}:${activeRunKey}`
      : settingsOpen
      ? `settings:${s.settings?.muted}:${s.settings?.volume}:${s.settings?.reducedMotion}:${s.settings?.lowQuality}:${s.settings?.captionsEnabled}`
      : guideOpen
      ? `guide:${guideTab}:${guideTopic}`
      : s.mission.status === 'won' || s.mission.status === 'lost'
      ? `outcome:${s.mission.status}:${s.mission.stars}:${s.mission.day}:${Math.round(s.resources.research)}:${s.stats.harvests}`
      : s.mission.status === 'intro' && welcomeOpen
      ? 'welcome'
      : s.mission.status === 'intro' && !welcomeOpen
      ? `intro:${tutorialStepIndex}`
      : isPaused
      ? `paused:${c.completedRuns}`
      : 'closed';

    if (modalKey === lastModalKey) return;
    lastModalKey = modalKey;

    if (hasDecision) {
      const { instanceId, eventId } = s.pendingDecision;
      const def = MISSION_EVENTS[eventId];
      SOUNDS.alert();
      const topicFacts = factsFor(def.topic || 'moon');
      const fact = topicFacts[0];
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card decision-card mg-animate-in">
          <div class="decision-badge">📡 MISSION CONTROL PRIORITY · DAY ${s.mission.day}</div>
          <h2>${def.icon} ${def.title}</h2>
          <p class="mg-intro">${def.kidText}</p>
          <div class="fact-box">
            <div class="fact-tag">📘 WHY THIS HAPPENS ON THE MOON</div>
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

    if (reportOpen) {
      const report = computeCampaignReport(s.campaign);
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card outcome-card mg-animate-in">
          <div class="outcome-badge">🚀 EARTH RETURN COMPLETE · 5 / 5 CAMPAIGN RUNS</div>
          <h2>🌍 Welcome Back to Earth, Commander!</h2>
          <p class="mg-intro">Your astronauts packed core samples, boarded the lunar ascent lander, and splashed down cleanly after all 5 training runs!</p>
          <div class="outcome-stats">
            <div>🏅 Commander Rank: <strong>${report.rank}</strong></div>
            <div>👩‍🚀 Crew condition: <strong>${Math.round(s.crew.health)}%</strong></div>
            <div>🏠 Base condition: <strong>${Math.round(Object.values(s.modules).reduce((sum, module) => sum + module.health, 0) / Object.keys(s.modules).length)}%</strong></div>
            <div>💧 Water / Food reserves: <strong>${Math.round(s.resources.water)} / ${Math.round(s.resources.food)}</strong></div>
            <div>✦ Earned XP / Stars: <strong>${s.progression?.xp || 0} / ${s.progression?.stars || 0}</strong></div>
            <div>🧠 Engineering Quality: <strong>${report.avgQuality}%</strong></div>
            <div>⚡ Calm Speed Rating: <strong>${report.avgSpeed}%</strong></div>
            <div>🌟 Overall Campaign: <strong>${report.overall}%</strong></div>
          </div>
          <p class="mg-intro">Nova: “We brought home more than samples. We learned how to care for a crew.” Mission Control: “Welcome home. Your mission log is ready.”</p>
          <p class="fact-sub">Training simulation results describe this game, not real astronaut safety.</p>
          <div class="guide-list">
            ${report.history
              .map(
                (h) => `
              <div class="guide-item">
                <strong>Run ${h.runNumber}/5 · ${h.title}</strong>
                <p>Score: <strong>${h.overallScore}%</strong> (Quality ${h.qualityScore}% · Speed ${h.speedScore}%)${h.decisionId ? ` · Strategy: <code>${h.decisionId}</code>` : ''}</p>
              </div>
            `
              )
              .join('')}
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="rep-close">✕ Close Report</button>
            <button type="button" class="btn btn-primary btn-lg" id="rep-replay">🔄 Start New 5-Run Campaign</button>
          </div>
        </div>
      `;
      modalContentEl.querySelector('#rep-close')?.addEventListener('click', () => {
        SOUNDS.click();
        reportOpen = false;
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#rep-replay')?.addEventListener('click', () => {
        SOUNDS.action();
        reportOpen = false;
        store.dispatch({ type: 'resetCampaign' });
        handleRestart();
      });
      return;
    }

    if (campaignOpen) {
      const sc = getScenarioById(c.activeScenarioId);
      const activeRun = c.activeRun && c.activeRun.scenarioId === sc.id ? c.activeRun : null;
      const canRun = canStartScenarioRun(c);
      const donki = getSpaceWeatherAdvisory({ seed: s.rngState, day: s.mission.day, activeEvents: s.activeEvents });
      const doneMinigames = activeRun?.miniGamesDone || {};
      const doneCount = sc.minigames.filter((m) => Boolean(doneMinigames[m.gameId])).length;

      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card guide-card mg-animate-in">
          <div class="mg-header">
            <div>
              <span class="mg-badge">MISSION TRAINING CAMPAIGN · RUNS ${c.completedRuns} / ${c.totalRunsRequired}</span>
              <h2>🛰️ ${sc.title}</h2>
            </div>
            <button type="button" class="btn btn-ghost" id="camp-close">✕ Close</button>
          </div>

          <div class="guide-topic-bar" role="group" aria-label="Select Scenario">
            ${SCENARIO_ORDER.map((id) => {
              const item = SCENARIOS[id];
              return `<button type="button" class="btn btn-mini ${id === sc.id ? 'btn-primary' : 'btn-secondary'}" data-camp-sc="${id}">${item.order}. ${item.shortTitle}</button>`;
            }).join('')}
          </div>

          <div class="fact-box">
            <div class="fact-tag">${sc.badge} · ${sc.locationLabel}</div>
            <p>${sc.summary} <strong>Goal:</strong> ${sc.learningGoal}</p>
            <p class="fact-sub">🛰️ <strong>Space Weather (${donki.id} · ${donki.label}):</strong> ${donki.summaryKid}</p>
          </div>

          <div class="camp-section">
            <h4>Step 1: Choose Strategy Trade-Off (Every choice carries forward!)</h4>
            <div class="decision-choices">
              ${sc.strategyChoices
                .map((ch) => {
                  const chosen = activeRun?.decisionId === ch.id;
                  return `
                    <button type="button" class="choice-btn ${chosen ? 'is-selected' : ''}" data-camp-choice="${ch.id}" ${!canRun || activeRun?.decisionId ? 'disabled' : ''}>
                      <strong>${chosen ? '✓ ' : ''}${ch.label}</strong>
                      <span>${ch.tradeoff}</span>
                    </button>
                  `;
                })
                .join('')}
            </div>
          </div>

          <div class="camp-section">
            <h4>Step 2: Complete All 3 Scenario Challenges (${doneCount} / 3 Finished This Run)</h4>
            <div class="guide-list">
              ${sc.minigames
                .map((mg) => {
                  const res = doneMinigames[mg.gameId];
                  const rolled = activeRun?.timers?.[mg.gameId]?.limitSec;
                  const winLabel = formatTimerRange(mg.timerMinSec, mg.timerMaxSec);
                  return `
                    <div class="guide-item camp-mg-row">
                      <div>
                        <strong>${mg.title}</strong> ${res ? `<span class="pill-good">✓ ${Math.round(res.compositeScore * 100)}%</span>` : ''}
                        <p>${mg.summary} <small>(Window: ${winLabel}${rolled ? ` · Rolled: ${rolled}s` : ''})</small></p>
                      </div>
                      <button type="button" class="btn btn-sm ${res ? 'btn-secondary' : 'btn-primary'}" data-camp-mg="${mg.gameId}" ${!canRun || res ? 'disabled' : ''}>
                        ${res ? '✓ Recorded' : '▶ Launch'}
                      </button>
                    </div>
                  `;
                })
                .join('')}
            </div>
          </div>

          <div class="modal-actions">
            <small>${sc.carryOverNote}</small>
            ${
              c.endingTriggered
                ? `<button type="button" class="btn btn-primary" id="camp-view-report">🏆 Open Final Earth Return Report</button>`
                : doneCount >= 3
                ? `<button type="button" class="btn btn-primary" id="camp-finish-run">✅ Finalize Run (${c.completedRuns + 1}/5)</button>`
                : `<button type="button" class="btn btn-secondary" id="camp-close-btn">Continue Mission</button>`
            }
          </div>
        </div>
      `;

      modalContentEl.querySelector('#camp-close')?.addEventListener('click', () => {
        SOUNDS.click();
        campaignOpen = false;
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#camp-close-btn')?.addEventListener('click', () => {
        SOUNDS.click();
        campaignOpen = false;
        renderModal(store.getState());
      });
      modalContentEl.querySelectorAll('[data-camp-sc]').forEach((btn) => {
        btn.addEventListener('click', () => {
          SOUNDS.click();
          store.dispatch({ type: 'startScenario', scenarioId: btn.dataset.campSc });
        });
      });
      modalContentEl.querySelectorAll('[data-camp-choice]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const res = store.dispatch({
            type: 'applyScenarioDecision',
            scenarioId: sc.id,
            choiceId: btn.dataset.campChoice,
          });
          if (res.ok) {
            SOUNDS.success(res.message);
            showToast(`🧭 ${res.message}`, 'info');
          }
        });
      });
      modalContentEl.querySelectorAll('[data-camp-mg]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (!activeRun || activeRun.status !== 'active') {
            store.dispatch({ type: 'startScenario', scenarioId: sc.id });
          }
          campaignOpen = false;
          renderModal(store.getState());
          SOUNDS.click();
          openMinigame(btn.dataset.campMg, { scenarioMode: true, scenarioId: sc.id });
        });
      });
      modalContentEl.querySelector('#camp-finish-run')?.addEventListener('click', () => {
        const res = store.dispatch({ type: 'finishScenarioRun' });
        if (res.endingTriggered) {
          campaignOpen = false;
        }
      });
      modalContentEl.querySelector('#camp-view-report')?.addEventListener('click', () => {
        campaignOpen = false;
        reportOpen = true;
        renderModal(store.getState());
      });
      return;
    }

    if (settingsOpen) {
      const cfg = s.settings || { muted: false, volume: 0.75, reducedMotion: false, lowQuality: false, captionsEnabled: true };
      const volPct = Math.round((cfg.volume ?? 0.75) * 100);
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card guide-card mg-animate-in">
          <div class="mg-header">
            <div>
              <span class="mg-badge">ACCESSIBILITY & DISPLAY CONTROLS</span>
              <h2>⚙️ Audio, Motion & Performance Settings</h2>
            </div>
            <button type="button" class="btn btn-ghost" id="set-close">✕ Close</button>
          </div>
          <div class="guide-list">
            <div class="guide-item">
              <label class="mg-slider-row">
                <span>🔊 Master Volume (${cfg.muted ? 'Muted' : `${volPct}%`})</span>
                <input type="range" min="0" max="100" value="${volPct}" id="set-vol" />
              </label>
            </div>
            <div class="guide-item camp-mg-row">
              <div>
                <strong>✨ Reduced Motion Mode</strong>
                <p>Replaces camera sweeps and touchdown shake with gentle snap transitions.</p>
              </div>
              <button type="button" class="btn btn-sm ${cfg.reducedMotion ? 'btn-primary' : 'btn-secondary'}" id="set-motion">${cfg.reducedMotion ? 'ON ✓' : 'OFF'}</button>
            </div>
            <div class="guide-item camp-mg-row">
              <div>
                <strong>🔋 Low-Power 3D Graphics</strong>
                <p>Reduces pixel density, shadows & particle count for slower laptops or tablets.</p>
              </div>
              <button type="button" class="btn btn-sm ${cfg.lowQuality ? 'btn-primary' : 'btn-secondary'}" id="set-lowq">${cfg.lowQuality ? 'ON ✓' : 'OFF'}</button>
            </div>
            <div class="guide-item camp-mg-row">
              <div>
                <strong>💬 Text Captions for Sound Effects</strong>
                <p>Shows short on-screen captions whenever alerts, scans, or thrusters trigger.</p>
              </div>
              <button type="button" class="btn btn-sm ${cfg.captionsEnabled ? 'btn-primary' : 'btn-secondary'}" id="set-captions">${cfg.captionsEnabled ? 'ON ✓' : 'OFF'}</button>
            </div>
            <div class="guide-item camp-mg-row">
              <div>
                <strong>🚀 Replay Rocket Landing & Base Setup</strong>
                <p>Re-watch the Artemis Lander touchdown & astronaut setup walkthrough anytime.</p>
              </div>
              <button type="button" class="btn btn-sm btn-secondary" id="set-replay-cin">▶ Replay Arrival</button>
            </div>
          </div>
        </div>
      `;
      modalContentEl.querySelector('#set-close')?.addEventListener('click', () => {
        SOUNDS.click();
        settingsOpen = false;
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#set-vol')?.addEventListener('input', (e) => {
        const nextVol = Math.max(0, Math.min(1, Number(e.target.value) / 100));
        SOUNDS.setVolume(nextVol);
        store.dispatch({ type: 'updateSetting', key: 'volume', value: nextVol });
        if (nextVol > 0 && SOUNDS.isMuted()) {
          SOUNDS.setMuted(false);
          store.dispatch({ type: 'updateSetting', key: 'muted', value: false });
          if (soundBtn) soundBtn.innerHTML = speakerSvg(false);
        }
      });
      modalContentEl.querySelector('#set-motion')?.addEventListener('click', () => {
        const next = !cfg.reducedMotion;
        SOUNDS.click();
        store.dispatch({ type: 'updateSetting', key: 'reducedMotion', value: next });
      });
      modalContentEl.querySelector('#set-lowq')?.addEventListener('click', () => {
        const next = !cfg.lowQuality;
        SOUNDS.click();
        store.dispatch({ type: 'updateSetting', key: 'lowQuality', value: next });
        scene?.setLowQuality?.(next);
      });
      modalContentEl.querySelector('#set-captions')?.addEventListener('click', () => {
        const next = !cfg.captionsEnabled;
        SOUNDS.click();
        store.dispatch({ type: 'updateSetting', key: 'captionsEnabled', value: next });
      });
      modalContentEl.querySelector('#set-replay-cin')?.addEventListener('click', () => {
        SOUNDS.click('Replaying arrival landing sequence.');
        settingsOpen = false;
        renderModal(store.getState());
        onStartArrivalCinematic?.({ force: true });
      });
      return;
    }

    if (guideOpen) {
      const topics = ['moon', 'oxygen', 'water', 'power', 'food', 'radiation', 'habitat', 'comms'];
      const topicFacts = factsFor(guideTopic);
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card guide-card mg-animate-in">
          <div class="mg-header">
            <div>
              <span class="mg-badge">NASA ARTEMIS & ISS SCIENCE DATABASE</span>
              <h2>📘 Junior Astronaut Science Field Guide</h2>
            </div>
            <button type="button" class="btn btn-ghost" id="guide-close" aria-label="Close NASA Science Field Guide">✕ Close</button>
          </div>
          <div class="guide-tabs" role="tablist" aria-label="Science guide sections">
            <button type="button" role="tab" aria-selected="${guideTab === 'facts'}" class="btn btn-chip ${guideTab === 'facts' ? 'is-active' : ''}" data-gtab="facts">🔬 Real NASA Facts (${FACTS.length})</button>
            <button type="button" role="tab" aria-selected="${guideTab === 'glossary'}" class="btn btn-chip ${guideTab === 'glossary' ? 'is-active' : ''}" data-gtab="glossary">📖 Space Words</button>
            <button type="button" role="tab" aria-selected="${guideTab === 'sim'}" class="btn btn-chip ${guideTab === 'sim' ? 'is-active' : ''}" data-gtab="sim">⚖️ Real Space vs Game</button>
            <button type="button" role="tab" aria-selected="${guideTab === 'sources'}" class="btn btn-chip ${guideTab === 'sources' ? 'is-active' : ''}" data-gtab="sources">🔗 NASA Sources (${Object.keys(SOURCES).length})</button>
          </div>

          ${
            guideTab === 'facts'
              ? `
              <div class="guide-topic-bar" role="group" aria-label="Filter NASA facts by topic">
                ${topics
                  .map(
                    (t) =>
                      `<button type="button" aria-pressed="${guideTopic === t}" class="btn btn-mini ${guideTopic === t ? 'btn-primary' : 'btn-secondary'}" data-gtopic="${t}">${t.toUpperCase()}</button>`
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
                    <small class="guide-caveat">Game translation: ${f.caveat}</small>
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
                  <strong>📊 Training Simulation Units</strong>
                  <p>${SIMULATION_UNITS_NOTICE}</p>
                </div>
                <div class="guide-item">
                  <strong>📡 Earth–Moon Comms & Space Weather</strong>
                  <p>Mean Earth–Moon distance is <strong>384,400 km</strong> (~1.28s one-way / ~2.56s round-trip radio delay). Space weather records come from NASA CCMC DONKI concepts (${SPACE_WEATHER_SOURCE.url}).</p>
                </div>
                <div class="guide-item">
                  <strong>⏱️ Fast Moon Days (Game vs Real Moon)</strong>
                  <p>In the game, 1 mission day is <strong>60 seconds</strong> so you can finish a 7-day mission in a few minutes! On the real Moon, one full day-night cycle takes about <strong>29.5 Earth days</strong>.</p>
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
        SOUNDS.click();
        guideOpen = false;
        renderModal(store.getState());
      });
      modalContentEl.querySelectorAll('[data-gtab]').forEach((btn) => {
        btn.addEventListener('click', () => {
          SOUNDS.click();
          guideTab = btn.dataset.gtab;
          renderModal(store.getState());
        });
      });
      modalContentEl.querySelectorAll('[data-gtopic]').forEach((btn) => {
        btn.addEventListener('click', () => {
          SOUNDS.click();
          guideTopic = btn.dataset.gtopic;
          renderModal(store.getState());
        });
      });
      return;
    }

    if (s.mission.status === 'won' || s.mission.status === 'lost') {
      const won = s.mission.status === 'won';
      const stars = '⭐'.repeat(s.mission.stars) + '☆'.repeat(Math.max(0, 3 - s.mission.stars));
      const objDone = Object.values(s.objectives).filter(Boolean).length;
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card outcome-card mg-animate-in">
          <div class="outcome-badge">${won ? '🎉 MISSION ACCOMPLISHED!' : '🛸 CREW RETURN TO ORBIT'}</div>
          <h2>${won ? 'Outstanding Leadership, Junior Commander!' : 'Crew Returned Safely to Lunar Orbit!'}</h2>
          ${won ? `<div class="outcome-stars" aria-label="${s.mission.stars} out of 3 stars">${stars}</div>` : ''}
          <p class="mg-intro">${s.mission.outcomeReason || ''}</p>
          <div class="outcome-stats">
            <div>📅 Days Completed: <strong>${s.mission.day} / ${BALANCE.time.missionDays}</strong></div>
            <div>🔬 Science Earned: <strong>${Math.round(s.resources.research)} / 100 pts</strong></div>
            <div>🎯 Goals Finished: <strong>${objDone} / ${OBJECTIVES.length}</strong></div>
            <div>🥬 Space Crops Grown: <strong>${s.stats.harvests}</strong></div>
          </div>
          <div class="fact-box">
            <div class="fact-tag">🧠 KEY LESSONS FROM THE MOON</div>
            <p>
              Running a lunar settlement takes engineering balance: splitting <strong>water into air</strong>,
              saving <strong>battery power</strong> before mountain shadows hit, brushing <strong>jagged Moon dust</strong>
              off solar cells, and hiding inside a <strong>water-walled storm shelter</strong> during solar storms!
            </p>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" id="modal-guide">📘 Review Science Guide</button>
            <button type="button" class="btn btn-primary btn-lg" id="modal-restart">🚀 Start Next Mission</button>
          </div>
        </div>
      `;
      modalContentEl.querySelector('#modal-guide')?.addEventListener('click', () => {
        SOUNDS.click();
        guideOpen = true;
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#modal-restart')?.addEventListener('click', handleRestart);
      return;
    }

    if (s.mission.status === 'intro' && welcomeOpen) {
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card welcome-card mg-animate-in">
          <div class="welcome-emblem-row">${renderBrandEmblem()}</div>
          <span class="welcome-tag">NASA SPACE APPS CHALLENGE 2026 · TEAM DOOMED CREW</span>
          <h1 class="welcome-title">ARTEMIS LUNAR BASE COMMANDER</h1>
          <p class="welcome-subtitle">JUNIOR ASTRONAUT MISSION TRAINER · SOUTH POLE OUTPOST</p>

          <div class="welcome-mission-grid">
            <div class="welcome-stat-cell">
              <span class="welcome-stat-label">EXPEDITION</span>
              <strong class="welcome-stat-val">5 Mission Runs</strong>
            </div>
            <div class="welcome-stat-cell">
              <span class="welcome-stat-label">CREW</span>
              <strong class="welcome-stat-val">4 Astronauts</strong>
            </div>
            <div class="welcome-stat-cell">
              <span class="welcome-stat-label">LOCATION</span>
              <strong class="welcome-stat-val">South Pole</strong>
            </div>
            <div class="welcome-stat-cell">
              <span class="welcome-stat-label">GOAL</span>
              <strong class="welcome-stat-val">Safe Earth Return</strong>
            </div>
          </div>

          <p class="mg-intro">
            Welcome to Artemis Base! Manage breathing air, clean water, solar power, and space crops while keeping your 4 astronauts safe on the Moon.
          </p>

          <div class="welcome-actions-list">
            <button type="button" class="btn btn-primary btn-lg btn-full" id="welcome-start">
              🚀 Start Mission Briefing & Launch
            </button>
            <button type="button" class="btn btn-secondary btn-full" id="welcome-quick">
              ⚡ Jump Right In (Skip Briefing)
            </button>
            <div class="modal-btn-row">
              <button type="button" class="btn btn-secondary" id="welcome-sim-leak">🔍 Leak Hunter Sim</button>
              <button type="button" class="btn btn-secondary" id="welcome-sim-solar">☀️ Solar Aligner Sim</button>
            </div>
            <button type="button" class="btn btn-ghost btn-full" id="welcome-guide">
              📘 NASA Science Field Guide & Sources
            </button>
          </div>
        </div>
      `;

      modalContentEl.querySelector('#welcome-start')?.addEventListener('click', () => {
        SOUNDS.click();
        if (onStartStory) { welcomeOpen = false; onStartStory(); return; }
        welcomeOpen = false;
        tutorialStepIndex = 0;
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#welcome-quick')?.addEventListener('click', () => {
        SOUNDS.fanfare('Artemis Base mission launched!');
        welcomeOpen = false;
        store.dispatch({ type: 'finishTutorial' });
        store.dispatch({ type: 'startMission' });
        celebrateUntil = Date.now() + 3000;
        showToast('🚀 Artemis Base mission launched! Keep your crew safe!', 'good');
        onStartArrivalCinematic?.();
      });
      modalContentEl.querySelector('#welcome-sim-leak')?.addEventListener('click', () => {
        SOUNDS.click();
        openMinigame('leakHunter');
      });
      modalContentEl.querySelector('#welcome-sim-solar')?.addEventListener('click', () => {
        SOUNDS.click();
        openMinigame('solarAligner');
      });
      modalContentEl.querySelector('#welcome-guide')?.addEventListener('click', () => {
        SOUNDS.click();
        guideOpen = true;
        renderModal(store.getState());
      });
      return;
    }

    if (s.mission.status === 'intro' && !welcomeOpen) {
      const step = TUTORIAL_STEPS[tutorialStepIndex] || TUTORIAL_STEPS[0];
      const dots = TUTORIAL_STEPS.map(
        (_, idx) => `<span class="tut-dot ${idx === tutorialStepIndex ? 'is-active' : ''}"></span>`
      ).join('');
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card tutorial-card mg-animate-in">
          <div class="tutorial-step-tag">MISSION BRIEFING · STEP ${tutorialStepIndex + 1} OF ${TUTORIAL_STEPS.length}</div>
          <h2>${step.icon} ${step.title}</h2>
          <p class="mg-intro">${step.body.replace(/\n/g, '<br/>')}</p>
          <div class="fact-box">
            <div class="fact-tag">💡 COMMANDER GUIDANCE</div>
            <p>${step.tip}</p>
          </div>
          <div class="tut-dots-row" aria-hidden="true">${dots}</div>
          <div class="modal-actions">
            ${
              tutorialStepIndex > 0
                ? '<button type="button" class="btn btn-ghost" id="tut-prev">← Back</button>'
                : '<button type="button" class="btn btn-ghost" id="tut-welcome">← Main Menu</button>'
            }
            <div class="modal-actions-right">
              <button type="button" class="btn btn-secondary" id="tut-skip">⚡ Quick Launch</button>
              ${
                tutorialStepIndex < TUTORIAL_STEPS.length - 1
                  ? '<button type="button" class="btn btn-primary" id="tut-next">Next →</button>'
                  : '<button type="button" class="btn btn-primary btn-lg" id="tut-launch">🌕 Launch Moon Base!</button>'
              }
            </div>
          </div>
        </div>
      `;
      modalContentEl.querySelector('#tut-welcome')?.addEventListener('click', () => {
        SOUNDS.click();
        welcomeOpen = true;
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#tut-prev')?.addEventListener('click', () => {
        SOUNDS.click();
        tutorialStepIndex = Math.max(0, tutorialStepIndex - 1);
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#tut-next')?.addEventListener('click', () => {
        SOUNDS.click();
        tutorialStepIndex = Math.min(TUTORIAL_STEPS.length - 1, tutorialStepIndex + 1);
        renderModal(store.getState());
      });
      const startNow = () => {
        SOUNDS.fanfare('Expedition launched!');
        store.dispatch({ type: 'finishTutorial' });
        store.dispatch({ type: 'startMission' });
        celebrateUntil = Date.now() + 3000;
        showToast('🚀 Expedition launched! Keep your astronauts happy and safe!', 'good');
        onStartArrivalCinematic?.();
      };
      modalContentEl.querySelector('#tut-skip')?.addEventListener('click', startNow);
      modalContentEl.querySelector('#tut-launch')?.addEventListener('click', startNow);
      return;
    }

    if (isPaused) {
      modalBackdropEl.hidden = false;
      modalContentEl.innerHTML = `
        <div class="modal-card pause-card mg-animate-in">
          <span class="welcome-tag">SIMULATION PAUSED</span>
          <h2>⏸ Mission Paused</h2>
          <p class="mg-intro">Take a breath, Junior Commander! The Moon base simulation clock is stopped.</p>
          <div class="pause-actions">
            <button type="button" class="btn btn-primary btn-lg btn-full" id="pause-resume">
              ▶ Resume Mission (Space / Esc)
            </button>
            <button type="button" class="btn btn-secondary btn-full" id="pause-guide">
              📘 NASA Science Field Guide
            </button>
            <div class="modal-btn-row">
              <button type="button" class="btn btn-secondary" id="pause-leak">🔍 Leak Hunter Sim</button>
              <button type="button" class="btn btn-secondary" id="pause-solar">☀️ Solar Aligner Sim</button>
            </div>
            <button type="button" class="btn btn-ghost btn-full" id="pause-reset">
              ↻ Restart Mission
            </button>
          </div>
        </div>
      `;
      modalContentEl.querySelector('#pause-resume')?.addEventListener('click', () => {
        SOUNDS.click();
        runAction({ type: 'setSpeed', speed: 1 });
      });
      modalContentEl.querySelector('#pause-guide')?.addEventListener('click', () => {
        SOUNDS.click();
        guideOpen = true;
        renderModal(store.getState());
      });
      modalContentEl.querySelector('#pause-leak')?.addEventListener('click', () => {
        SOUNDS.click();
        openMinigame('leakHunter');
      });
      modalContentEl.querySelector('#pause-solar')?.addEventListener('click', () => {
        SOUNDS.click();
        openMinigame('solarAligner');
      });
      modalContentEl.querySelector('#pause-reset')?.addEventListener('click', handleRestart);
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

  // Keyboard Navigation (1-5 building slots, 0 camera overview, Space/Esc pause, M mute, S shelter, E/T building CTAs, R repair)
  window.addEventListener('keydown', (e) => {
    const s = store.getState();
    if (s.mission.inMinigame) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    if (e.key === 'Escape') {
      if (campaignOpen || settingsOpen || reportOpen || guideOpen) {
        campaignOpen = false;
        settingsOpen = false;
        reportOpen = false;
        guideOpen = false;
        renderModal(store.getState());
      } else if (s.cinematics?.active && s.cinematics.active !== 'none') {
        SOUNDS.click('Skipped opening sequence.');
        onSkipCinematic?.();
      } else if (scene?.getFocusedBuildingId?.()) {
        SOUNDS.click();
        scene.focusBuilding(null);
        showToast('🎥 Overview: Seeing all of Artemis Base!', 'info');
      } else if (s.mission.status === 'running') {
        const nextSpeed = s.mission.speed === 0 ? 1 : 0;
        runAction({ type: 'setSpeed', speed: nextSpeed });
      }
      return;
    }

    if (e.key === ' ' || e.code === 'Space') {
      if (!modalBackdropEl.hidden && !lastModalKey.includes('paused')) return;
      if (s.mission.status === 'running') {
        e.preventDefault();
        const nextSpeed = s.mission.speed === 0 ? 1 : 0;
        runAction({ type: 'setSpeed', speed: nextSpeed });
      }
      return;
    }

    if (e.key === 'm' || e.key === 'M') {
      const isMuted = SOUNDS.toggleMute();
      if (soundBtn) soundBtn.innerHTML = speakerSvg(isMuted);
      showToast(isMuted ? '🔇 Sound muted' : '🔊 Sound enabled', 'info');
      return;
    }

    if (!modalBackdropEl.hidden) return;

    const idx = Number(e.key) - 1;
    if (idx >= 0 && idx < BUILDING_ORDER.length) {
      selectBuilding(BUILDING_ORDER[idx], true);
    } else if (e.key === '0') {
      if (scene && typeof scene.focusBuilding === 'function') {
        scene.focusBuilding(null);
      }
      showToast('🎥 Overview: Seeing all of Artemis Base!', 'info');
    } else if (e.key === 's' || e.key === 'S') {
      runAction({ type: 'setShelter', on: !s.crew.sheltered });
    } else if (e.key === 'e' || e.key === 'E') {
      if (selectedBuilding === 'habitat') {
        runAction({ type: 'setShelter', on: !s.crew.sheltered });
      } else if (selectedBuilding === 'lifeSupport') {
        SOUNDS.click();
        openMinigame('leakHunter');
      } else if (selectedBuilding === 'solar') {
        SOUNDS.click();
        openMinigame('solarAligner');
      } else if (selectedBuilding === 'greenhouse') {
        runAction({ type: 'harvestCrops' });
      } else if (selectedBuilding === 'lab') {
        runAction({ type: 'collectIce' });
      } else if (selectedBuilding === 'comms') {
        SOUNDS.click();
        openMinigame('commsDelay');
      }
    } else if (e.key === 't' || e.key === 'T') {
      if (selectedBuilding === 'habitat') {
        runAction({ type: 'buildShielding' });
      } else if (selectedBuilding === 'solar') {
        runAction({ type: 'cleanPanels' });
      } else {
        runAction({ type: 'toggleModule', moduleId: selectedBuilding });
      }
    } else if (e.key === 'r' || e.key === 'R') {
      runAction({ type: 'repairModule', moduleId: selectedBuilding });
    }
  });

  store.subscribe(render);
  render(store.getState());

  return {
    selectBuilding: (id) => selectBuilding(id, false),
    setScene: (nextScene) => {
      scene = nextScene;
    },
    setCinematicProgress: (progress) => {
      liveCinematicProgress = Math.max(0, Math.min(1, Number(progress) || 0));
      const bar = cinematicBannerEl?.querySelector?.('#ui-cinematic-progress-fill');
      if (bar) {
        bar.style.width = `${Math.round(liveCinematicProgress * 1000) / 10}%`;
      }
    },
    showToast,
    showCaption,
    openCampaign: () => {
      campaignOpen = true;
      renderModal(store.getState());
    },
    openReport: () => {
      reportOpen = true;
      renderModal(store.getState());
    },
    setWebGLFallback: (unavailable, reason = '') => {
      webglFallbackState = { unavailable: Boolean(unavailable), reason };
      renderBanners(store.getState());
    },
    setInitLoading: (loading, progressText = '') => {
      initStatus = { loading: Boolean(loading), progressText };
      if (initBannerEl) {
        initBannerEl.hidden = !initStatus.loading;
        initBannerEl.textContent = initStatus.progressText || 'Initializing 3D Moon Outpost...';
      }
    },
  };
}
