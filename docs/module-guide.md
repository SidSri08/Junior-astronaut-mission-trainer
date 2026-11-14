# Module-by-Module Code Guide

**Owner:** Department E (E-S3 Technical Documentation)  
**Contract Reference:** `docs/architecture/ARCHITECTURE.md`

---

## 1. Architectural Overview

The codebase is organized around a strict **unidirectional data flow** and **single fixed-step scheduler**:

```
┌───────────────────────────────────────────────────────────────────┐
│                          src/main.js                              │
│  • Fixed-step scheduler (0.5 s step) → store.step(0.5)            │
│  • requestAnimationFrame loop → scene.render(rawDt)               │
└───────────────┬───────────────────────────────────┬───────────────┘
                │ getState() / subscribe()          │ dispatch(action)
                ▼                                   │
┌───────────────────────────────┐                   │
│   src/systems/GameState.js    │◄──────────────────┘
│   (Canonical Immutable Store) │
└───────┬───────────────┬───────┘
        │               │
        ▼               ▼
┌──────────────┐ ┌──────────────────────────────────────────────────┐
│ src/scene/** │ │ src/ui/** & src/minigames/**                     │
│ Three.js 3D  │ │ DOM HUD, Building Inspector, NASA Guide, Modals  │
└──────────────┘ └──────────────────────────────────────────────────┘
```

- **No DOM or Three.js in `src/systems/**` or `src/data/**`:** Every simulation and data module can be imported directly in Node.js for fast headless testing (`npm test`).
- **Frozen Snapshots:** `store.getState()` returns a deep-frozen clone of the state tree so UI and 3D scene code can never accidentally mutate simulation state outside an allowlisted action.

---

## 2. `src/data/` — Declarative Data, Balance, Science & Pedagogy

| File | Owner | Responsibility & Exports |
|---|---|---|
| `src/data/gameBalance.js` | C-S4 | Exports `BALANCE` (`label: 'SIMULATION_VALUE'`). Centralizes all gameplay rates: time step (`0.5 s`), mission length (`7 days × 60 s`), starting resources, crew consumption, module power draws, radiation rates, wear rates, action costs/cooldowns, and minigame rewards. |
| `src/data/missionEvents.js` | C-S2 | Exports `MISSION_EVENTS` and `EVENT_IDS`. Defines 9 scheduled and seeded-random events (`dustyPanels`, `oxygenLeak`, `solarStorm`, `longShadow`, `micrometeoroid`, `generatorFault`, `recyclerClog`, `supplyLander`, `rockDiscovery`), including `kidText`, `lesson`, `onStart`, `ongoing`, and player `choices`. |
| `src/data/objectives.js` | C-S4 | Exports `OBJECTIVES`—7 milestone checks (`firstHarvest`, `research50`, `shelterStorm`, `leakHunter`, `solarAligner`, `buildShield`, `research100`) evaluated after every simulation step and action. |
| `src/data/scienceFacts.js` | D-S4 | Exports `SOURCES` (`S01`–`S12`), `FACTS` (28 `REAL_SCIENTIFIC_FACT` entries across 7 topics with `kidText` and `caveat`), `factsFor(topic)`, and `factById(id)`. |
| `src/data/educationContent.js` | E-S4 | Exports `TUTORIAL_STEPS` (4 onboarding slides), `BUILDING_INFO` (role and operation guide for all 5 buildings), `RESOURCE_HELP` (tooltips), `GLOSSARY` (6 core lunar terms), and `getContextualHint(state)` (priority-ordered diagnostic banner). |

---

## 3. `src/systems/` — Pure Simulation Engine & Persistence

| File | Owner | Responsibility & Exports |
|---|---|---|
| `src/systems/GameState.js` | C-S1 | Exports `createInitialState({ seed })` and `createStore(initialState)`. Manages the canonical `schemaVersion: 1` state tree, caches deep-frozen snapshots (`getState()`), notifies subscribers (`subscribe(fn)`), advances ticks (`step(dt)`), and routes player actions (`dispatch(action)`). |
| `src/systems/ResourceSystem.js` | C-S1 | Exports `advanceSimulationStep(state, dt, B)`, `applyPlayerAction(state, action, B)`, `tickCrewHealth`, and `checkObjectives`. Executes subsystems in a fixed deterministic order each tick (`Power → LifeSupport → Food → Lab → Radiation → Habitat → MissionEvents → CrewHealth → Objectives → Win/Lose`) and validates all 14 allowlisted player actions. |
| `src/systems/PowerSystem.js` | C-S1 | Exports `computePower(state, B)`, `tickPower(state, dt, B)`, and `solarMultiplier(state)`. Computes solar generation (`solarPeak × alignment × (1 - dust) × efficiency × daylight × eventMultiplier`), sums module consumption, updates battery %, and manages hysteresis blackout recovery (`brownout` at `0%`, restores at `12%`). |
| `src/systems/LifeSupportSystem.js` | C-S1 | Exports `tickLifeSupport(state, dt, B)`. When powered, electrolyzes water (`waterForOxygen: 0.12/s`) to produce breathable oxygen (`oxygenMake: 0.7/s`) and recycles water (`waterRecycle: 0.16/s`). Applies crew breathing/drinking and low-health hull leak penalties. |
| `src/systems/FoodSystem.js` | C-S1 | Exports `tickFood(state, dt, B)` and `tickLab(state, dt, B)`. Handles crew food consumption, hydroponic crop growth (`+1.1%/s` when powered with water), and Science Lab research generation (`+0.45/s` when powered and crew is not sheltered). |
| `src/systems/RadiationSystem.js` | C-S1 | Exports `radiationRate(state, B)` and `tickRadiation(state, dt, B)`. Computes cosmic ray background dose reduced by `shieldLevel` (`22%` per level), adds acute solar storm dose (`1.6/s` unsheltered vs. `0.12/s` sheltered), and tracks `exposedSeconds` for the storm shelter objective. |
| `src/systems/HabitatSystem.js` | C-S1 | Exports `tickHabitat(state, dt, B)` and `MODULE_NAMES`. Applies gradual mechanical wear to all 5 modules, settles trace lunar dust onto solar panels (`+0.0006/s`), and logs warnings when module health drops below `40%` or `15%` (`brokenBelow`). |
| `src/systems/MissionEventSystem.js` | C-S2 | Exports `startEvent`, `finishEventInstance`, `finishEventsByType`, `resolveEventDecision`, `tickMissionEvents`, and `applyEffects`. Triggers scheduled events at their exact day/time, rolls once per day (`day >= 2`) using the seeded RNG for random events, advances `warning → active` timers, and applies decision choices. |
| `src/systems/SaveSystem.js` | C-S1 | Exports `saveGame`, `loadGame`, `clearSave`, and `validateSavedState` under key `jamt.save.v1`. Defensively validates `schemaVersion`, numeric bounds (`0..100`), and module presence, and resets `mission.inMinigame = false` on reload so players are never soft-locked. |
| `src/systems/rng.js` | C-S1 | Exports `nextRandom(state)` implementing a deterministic `mulberry32` PRNG whose state (`state.rngState`) is stored inside `GameState` for reproducible event rolls across saves and tests. |
| `src/systems/util.js` | C-S1 | Exports pure helpers: `clamp`, `addLog` (ring buffer of 40 newest entries), `efficiency(health, brokenBelow)`, `isEventActive`, `hasEvent`, and `isPowered`. |

---

## 4. `src/scene/` — Procedural Three.js Lunar South-Pole Scene

| File | Owner | Responsibility & Exports |
|---|---|---|
| `src/scene/OutpostScene.js` | B-S1 | Exports `createOutpostScene({ canvas, onSelectBuilding })`. Manages the `THREE.WebGLRenderer`, `PerspectiveCamera`, `OrbitControls`, raycast hover/click picking, smooth camera focus transitions (`focusBuilding`), low-elevation polar directional sun light (`7.5°`), and particle systems for **Solar Storms**, **Oxygen Leaks**, and the animated **Ice-Mining Rover**. |
| `src/scene/buildings.js` | B-S1 | Exports `createOutpostBuildings()`, `INTERACTIVE_BUILDING_IDS`, and `BUILDING_LAYOUT`. Procedurally constructs 3D meshes for all 5 interactive buildings (`habitat`, `lifeSupport`, `solar`, `greenhouse`, `lab`) plus `lander` and `rover`. Dynamically updates visual state: regolith sandbag layers (`shieldLevel 1..3`), solar panel yaw & dust tint, greenhouse crop growth scale & pink-purple LED glow, warning beacons, and window lights during blackouts or storm sheltering. |
| `src/scene/terrain.js` | B-S1 | Exports `createLunarTerrain()`, `createSkyAndCelestials()`, and `sampleTerrainHeight(x, z)`. Generates a 210×210m vertex-colored lunar crater field around a flattened outpost pad, procedural regolith canvas texture, distant horizon mountain ring, starfield, glowing low-horizon Sun, and crescent Earth in the sky. |
| `src/scene/sceneUtils.js` | B-S1 | Exports procedural utilities (`mulberry32`, `valueNoise`, `fbm`, `smoothstep`, `damp`, `dampAngle`, `canvasTexture`, `getGlowTexture`, `makeGlow`, `disposeObject`) so the 3D scene requires zero external `.glb` or image files. |

---

## 5. `src/ui/` & `src/minigames/` — DOM Interface & Interactive Training

| File | Owner | Responsibility & Exports |
|---|---|---|
| `src/ui/ui.js` | B-S3 | Exports `mountUI({ root, store, openMinigame, onRestart, scene })`. Renders the top resource dashboard, speed controls (`⏸`, `1×`, `2×`, `3×`), active event & contextual hint banners, left building switcher & objectives checklist, right **Building Inspector** (with context-sensitive actions and paired NASA science fact card), **Interactive Decision Modal**, **4-Step Tutorial Modal**, **📘 NASA Science Field Guide Modal**, and **Win/Lose Outcome Modal**. |
| `src/minigames/minigameHost.js` | C-S3 | Exports `createMinigameHost({ container, store })`. Pauses the main simulation via `setMinigameOpen(true)`, mounts either `createLeakHunter` or `createSolarAligner`, and dispatches `completeMinigame({ gameId, success, score })` when finished. |
| `src/minigames/leakHunter.js` | C-S3 | Exports `createLeakHunter({ container, context, onComplete })`. Implements **Minigame 1: Leak Hunter**, where players scan a habitat hull grid with an ultrasonic sensor (`COLD → WARM → HOT → PINPOINT`) using mouse, touch, or keyboard arrows to patch 3 micrometeoroid air leaks within 25 seconds. |
| `src/minigames/solarAligner.js` | C-S3 | Exports `createSolarAligner({ container, context, onComplete })`. Implements **Minigame 2: Solar Aligner**, where players tap 6 electrostatic Moon-dust spots to clean the vertical solar array and rotate the panel azimuth slider (`-80°..+80°`) to match the South Pole Sun (`cos(diff)` efficiency). |
