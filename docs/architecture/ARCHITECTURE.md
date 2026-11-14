# Architecture & Integration Contract — FROZEN v1

**Owner:** A3 (acting for Department A: A1/A-S1/A-S2/A-S3). **Status:** Frozen 2026-11-14 for MVP. Changes need an A3 decision record in `docs/project-decisions/`.

## 1. Game concept (A-S2 game loop)
The player is the **Junior Commander** of a 4-person lunar south-pole research outpost. Goal: keep the crew healthy for **7 mission days** and collect **100 research points**.

Core loop (every 0.5 s simulation step):
1. Crew consumes oxygen, food, water; habitat and equipment slowly wear out.
2. Solar panels charge the battery (affected by daylight, dust, panel alignment, health). Powered modules draw energy.
3. Powered modules produce: Life Support → oxygen + water recycling; Greenhouse → crop growth; Lab → research.
4. Background radiation slowly adds crew dose; shielding reduces it.
5. Mission events (scheduled + seeded-random) create problems and decisions.
6. Crew health falls when any vital need fails; it recovers when all are OK.

Player decisions: turn modules on/off (power allocation), repair modules (limited repair kits), plant/harvest crops, send rover for ice, build regolith shielding, shelter crew during solar storms, answer event decisions, and play two minigames.

**Win:** reach end of Day 7 with crew health > 0 → 1–3 stars (base, research ≥ 100, ≥ 4 objectives). **Lose:** crew health reaches 0 → "Mission Control brings the crew home safely" + lesson summary + retry.

1 mission day = 60 simulated seconds (SIMULATION_VALUE — the real lunar day is ~29.5 Earth days). Speed: pause / 1× / 2× / 3×.

## 2. Module layout
```
index.html                 B-S4  page shell, #app, <canvas id="scene">, #ui-root
src/main.js                B-S4  bootstrap: store, scheduler, scene, UI, save, minigame host
src/systems/GameState.js   C-S1  createInitialState, createStore (dispatch/tick/subscribe)
src/systems/ResourceSystem.js  C-S1  runs per-system ticks in fixed order, crew health, win/lose
src/systems/{LifeSupport,Power,Food,Radiation,Habitat}System.js  C-S1  pure tick functions
src/systems/MissionEventSystem.js  C-S2  scheduling, start/ongoing/resolve, decisions
src/systems/SaveSystem.js  C-S1  localStorage save/load/clear (versioned, defensive)
src/systems/rng.js         C-S1  seeded mulberry32 RNG
src/data/gameBalance.js    C-S4  ALL tunable numbers (SIMULATION_VALUE)
src/data/missionEvents.js  C-S2  event definitions
src/data/objectives.js     C-S4  mission objectives
src/data/scienceFacts.js   D-S4  sourced facts + source list
src/data/educationContent.js  E-S4  tutorial steps, glossary, building descriptions, hints
src/scene/**               B-S1  Three.js scene (procedural models)
src/ui/**, src/styles/**   B-S3  DOM HUD, panels, modals, toasts
src/minigames/**           C-S3  leakHunter.js, solarAligner.js, minigameHost.js
tests/*.test.js            F-S1  node --test simulation tests
```
`src/systems/**` and `src/data/**` must be importable in Node (no DOM / Three.js).

## 3. GameState shape (schemaVersion 1)
```js
{
  schemaVersion: 1,
  seed: 12345, rngState: 12345,
  mission: { status: 'intro'|'running'|'won'|'lost', tick: 0, elapsed: 0 /*sim s*/, day: 1,
             timeOfDay: 0..1, isDaylight: true, speed: 1, inMinigame: false,
             tutorialDone: false, outcomeReason: null, stars: 0 },
  resources: { oxygen, water, food, battery, research },        // 0..100 game units
  power: { generation, consumption, net, brownout: false },     // derived each step
  crew: { count: 4, health: 100, radiationDose: 0, sheltered: false },
  modules: {
    habitat:     { health, online: true },                       // always online
    lifeSupport: { health, online },
    solar:       { health, online: true, dust: 0..1, alignment: 0..1 },
    greenhouse:  { health, online, planted: bool, growth: 0..100 },
    lab:         { health, online },
  },
  shieldLevel: 0..3,
  inventory: { repairKits },
  cooldowns: { collectIce: 0, buildShielding: 0, cleanPanels: 0 }, // sim seconds remaining
  activeEvents: [ { instanceId, eventId, phase: 'warning'|'active', remaining, startedAt } ],
  pendingDecision: null | { instanceId, eventId },
  firedScheduled: [eventId...], eventHistory: [{eventId, day, outcome}],
  objectives: { [objectiveId]: true },
  stats: { harvests, experimentsTime, stormsSheltered, repairs, minigameWins: {leakHunter, solarAligner} },
  log: [ { id, day, kind: 'info'|'good'|'warn'|'bad', text } ]   // newest first, max 40
}
```

## 4. Store API (`GameState.js`)
```js
createInitialState({ seed }) -> state
createStore(initialState) -> {
  getState() -> frozen deep snapshot (rebuilt only after a change),
  subscribe(fn(snapshot, change)) -> unsubscribe,
  dispatch(action) -> { ok, code, message },      // action = { type, ...payload }
  step(dtSimSeconds) -> void,                      // ONLY called by main.js scheduler
  replaceState(state)                              // used by load/reset
}
```
### Allowlisted actions
| type | payload | effect |
|---|---|---|
| `startMission` | – | status intro→running |
| `setSpeed` | `speed` 0–3 | 0 = pause |
| `toggleModule` | `moduleId` (lifeSupport/greenhouse/lab) | power allocation |
| `repairModule` | `moduleId` | −1 kit, +health |
| `plantCrops` / `harvestCrops` | – | greenhouse |
| `collectIce` | – | −battery, +water, cooldown |
| `buildShielding` | – | −battery, −kit?, shieldLevel+1 (max 3) |
| `cleanPanels` | – | quick manual dust clean (weaker than minigame) |
| `setShelter` | `on` bool | crew to storm shelter (lab paused) |
| `resolveDecision` | `instanceId`, `choiceId` | apply choice |
| `setMinigameOpen` | `open` bool | pauses simulation while open |
| `completeMinigame` | `gameId`, `success`, `score` 0–1 | validated rewards |
| `finishTutorial` | – | |
Unknown types → `{ ok:false, code:'UNKNOWN_ACTION' }`, no mutation.

## 5. Scene API (`src/scene/OutpostScene.js`, B-S1)
```js
createOutpostScene({ canvas, onSelectBuilding(buildingId) }) -> {
  update(snapshot), render(deltaSeconds), resize(w, h), focusBuilding(buildingId|null), destroy()
}
```
Building IDs: `habitat`, `lifeSupport`, `solar`, `greenhouse`, `lab` (interactive); `lander`, `rover` (decorative). Scene reads: `mission.timeOfDay/isDaylight`, `modules.*.health/online`, `modules.solar.dust/alignment`, `modules.greenhouse.planted/growth`, `crew.sheltered`, `shieldLevel`, `activeEvents[].eventId/phase`, `power.brownout`.

## 6. UI API (`src/ui/ui.js`, B-S3)
`mountUI({ root, store, openMinigame(gameId), onRestart, scene })`. UI never computes resource maths.

## 7. Minigame contract (C-S3)
```js
createLeakHunter({ container, context, onComplete })   // same for createSolarAligner
  -> { start(), destroy() }
onComplete({ gameId, success, score /*0..1*/ })        // host dispatches completeMinigame
```
- **Leak Hunter** (oxygen): find hidden hull leaks with a pressure sensor (warmer/colder), tap to seal before timer ends. Success resolves `oxygenLeak` event; fail halves leak.
- **Solar Aligner** (power): rotate panels to face the low south-pole Sun (output = cos of angle error) and brush off dust over 3 rounds. Score sets `solar.alignment`, clears dust.

## 8. Single-writer ownership (this MVP)
| Path | Owner of record | Written by (actual) |
|---|---|---|
| `src/scene/**` | B-S1 | B-S1 subagent |
| `src/data/scienceFacts.js`, `docs/science/**` | D-S4 / D1 | Department D subagent |
| `src/systems/**`, `src/data/gameBalance.js`, `missionEvents.js`, `objectives.js` | C-S1 / C-S2 / C-S4 | A3 directly |
| `src/minigames/**` | C-S3 | A3 directly |
| `src/ui/**`, `src/styles/**`, `index.html`, `src/main.js` | B-S3 / B-S4 | A3 directly |
| `src/data/educationContent.js`, `docs/education/**` | E-S4 / E1 | A3 draft → Department E review |
| `docs/qa/**`, `tests/**` | F1 / F-S1 | A3 unit tests; Department F independent QA |
| `README.md`, `docs/*.md` | E-S3 | A3 |

## 9. Persistence
Key `jamt.save.v1`. Autosave every 10 sim seconds and after each player action; on load, validate schemaVersion and numeric ranges, else start fresh with a friendly notice. "New Mission" clears the save.

