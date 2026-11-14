# Integration Contracts

**Status:** baseline contract proposal for Gate 1. A1/A-S3 own the canonical contract document; A3 coordinates cross-department approval. No agent should implement against a changing or unapproved shape. The names below are recommended starting points; final signatures must be confirmed against the actual codebase before implementation.

## 1. Dependency direction
`main.js` composes app modules. UI and Three.js scene consume state snapshots and dispatch named actions. Gameplay systems own game rules and state mutation. Data modules contain configuration only. Minigames receive a narrow context and return a result. No gameplay module imports DOM or Three.js. The render loop never advances simulation.

```text
main/app bootstrap
  ├── GameState + ResourceSystems + MissionEvents + SaveSystem
  ├── Three.js Scene (read-only snapshot)
  └── DOM UI (read-only snapshot + named action dispatch)
                         └── Minigames (isolated start/result contract)
```

## 2. Canonical GameState
One instance owns current mission data. Do not create independent resource copies in UI, scene, events or minigames. A recommended logical shape:

```js
{
  schemaVersion: 1,
  mission: { status: 'ready', elapsedTicks: 0, day: 1 },
  resources: {
    oxygen: { level: 100, status: 'nominal' },
    power: { level: 100, status: 'nominal' },
    food: { level: 100, status: 'nominal' },
    radiationProtection: { level: 100, status: 'nominal' },
    habitat: { level: 100, status: 'nominal' }
  },
  crew: { wellbeing: 100 },
  alerts: [],
  completedMinigames: [],
  eventHistory: [],
  lastUpdatedAt: null
}
```

This is a logical example, not a required numeric truth. A1/A-S1 and C1/C-S1 must finalize names, ranges, units/labels and validation rules. Values such as 0–100 are game abstractions, not physical units. Any displayed unit must be explained and scientifically qualified.

## 3. Proposed module API contracts

### Game state — owned by C-S1
```js
createInitialState(config) -> GameState
getSnapshot() -> ReadonlySnapshot
subscribe(listener) -> unsubscribeFunction
applyAction(action) -> ActionResult
advanceSimulation(stepConfig) -> TickResult
resetMission() -> GameState
```
`getSnapshot` must not expose mutable internal objects. All state mutations route through validated methods. Subscribers should be notified after a committed state update. Avoid unnecessary deep cloning on every render; use an explicit lightweight snapshot/update strategy.

### Resource systems — owned by C-S1
```js
calculateResourceTick(state, balanceConfig, tickContext) -> { nextState, changes, alerts }
applyResourceAction(state, action, balanceConfig) -> { nextState, result }
```
Rules must be deterministic for the same inputs. Validate finite values and boundary conditions. Do not read/write DOM or browser storage here. Explain trade-offs in returned results or event metadata.

### Mission events — owned by C-S2
```js
selectMissionEvent(state, eventConfig, randomSource) -> EventOrNull
applyMissionEvent(state, event) -> { nextState, effects, message }
```
Events require stable IDs and a one-time application guard. Randomness, if used, should be injectable/seedable for reproducible tests. Event effects must go through the state/simulation layer, not directly mutate UI elements.

### Minigames — owned by C-S3
```js
createMinigame({ gameId, onComplete, onExit, context }) -> MinigameController
controller.start()
controller.destroy()
```
The exact interface may be refined, but both minigames must implement the same lifecycle contract. Completion returns a structured result such as `{ gameId, success, score, reward, learningOutcomeId }`. Validate result values in the gameplay layer. Never allow arbitrary HTML/script payloads from results.

### UI — owned by B-S3
```js
mountUI({ rootElement, getSnapshot, subscribe, dispatchAction, openMinigame, onReset }) -> { destroy() }
```
UI renders from snapshots, sends named actions, and owns only presentation state (panel open, selected tab, focus). It must not calculate resource drain, change mission timers or edit the canonical GameState directly.

### Three.js scene — owned by B-S1
```js
createOutpostScene({ canvas, assetBaseUrl, onObjectAction }) -> {
  update(snapshot), resize(width, height), render(deltaSeconds), destroy()
}
```
Scene reads snapshots and may report selection/action intent through callbacks. It must not own authoritative game rules, resource values or save data.

### Save system — owned by C-S1
```js
saveGame(snapshot, storage = localStorage) -> SaveResult
loadGame(storage = localStorage) -> { ok, state, reason? }
clearSave(storage = localStorage) -> void
```
Use one namespaced key, version the data, parse defensively and validate schema/ranges. Handle unavailable storage, quota errors, malformed JSON and older schema safely. If persistence is deferred, keep the API boundary documented and mark it `DEFERRED`; do not build duplicate storage code in UI or app bootstrap.

## 4. Event and update lifecycle
1. Bootstrap creates one state instance and loads/validates initial state.
2. Scene and UI mount using snapshot/read/dispatch interfaces.
3. A player action is validated and committed by the gameplay layer.
4. A simulation tick is advanced by one controlled scheduler, not by the renderer.
5. Event selection/application happens at a defined simulation phase; event IDs cannot apply twice.
6. A new snapshot notifies UI/scene subscribers.
7. Save is triggered at explicit checkpoints/actions, not every animation frame.
8. On shutdown, UI/scene listeners and animation resources are disposed.

## 5. Action naming and payloads
Use a small allowlisted action vocabulary such as `allocatePower`, `startProduction`, `repairHabitat`, `activateShield`, `startMission`, `pauseMission`, `resetMission`, `startMinigame`, `completeMinigame`. These are examples, not approved final names. Each action must specify payload fields, validation, resource effects and UI feedback in the contract. Unknown actions return a rejected `ActionResult`; they must not mutate state.

## 6. Error and status contract
Use structured results with `ok`, stable `code`, user-safe `message`, and optional details. Do not throw uncontrolled errors across UI/scene boundaries for expected invalid actions. Log developer diagnostics without exposing stack traces to children. Asset failures should use fallback objects where practical.

## 7. Acceptance checks
- Exactly one canonical GameState instance exists.
- UI and scene cannot mutate authoritative state directly.
- Render loop and simulation tick are separate.
- Resource actions are deterministic and boundary-checked.
- Mission events are uniquely identified and applied once.
- Exactly two minigames share a lifecycle/result contract.
- Storage has one owner, a schema version and invalid-data recovery.
- Public exports/imports match every consumer and the startup sequence.
- Integration tests cover one complete action-to-visible-result path.
