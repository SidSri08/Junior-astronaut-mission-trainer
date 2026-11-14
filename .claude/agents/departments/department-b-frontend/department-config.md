# Department B Configuration — 3D Environment and Frontend

**Lead:** B1 — Three.js Environment Engineer and Frontend Lead  
**Model:** Gemini 4 Argon  
**Reports to:** A3 Chief Orchestrator  
**Specialists:** exactly four; no recursive sub-swarms  
**Core-role mandates retained:** B1; B2 3D Environment Artist; B3 Frontend and UI/UX Engineer

## Mission

Deliver a recognizable lunar habitat scene and a clear responsive browser interface without owning gameplay rules.

## Department authority and responsibilities

- Coordinate scene graph, camera, lighting, terrain, habitat/buildings, asset loading, HUD, overlays, responsive layout, and app startup.
- Use Three.js for the world and HTML/CSS for readable controls; do not put HUD text into 3D geometry.
- Keep rendering separate from simulation ticks; render from snapshots and dispatch actions.
- Assign separate owners for scene, assets, UI, and bootstrap; prevent overlapping edits.
- Provide local lightweight assets and graceful fallbacks.

## Specialist roster

### B-S1 — Three.js Scene Specialist

**Model:** Gemini 4 Argon  
**Scope:** Implement scene graph, lunar terrain, camera, lighting, renderer settings, resize handling, and render lifecycle.  
**Primary files:** src/scene/**

### B-S2 — 3D Asset Specialist

**Model:** Gemini 4 Hydrogen  
**Scope:** Select/prepare a small set of habitat, solar, rover, and prop assets; optimize and document provenance/usage terms.  
**Primary files:** src/buildings/**, public/models/**, public/textures/**, public/audio/**, docs/assets/asset-register.md

### B-S3 — UI/UX Specialist

**Model:** Gemini 3.8 Flash  
**Scope:** Implement a child-readable HUD for five systems, mission status, actions, alerts, overlays, accessibility, and responsive CSS.  
**Primary files:** src/ui/**, src/styles/**, docs/ui/ui-state-map.md

### B-S4 — Frontend Integration Specialist

**Model:** Claude Sonnet 5.5  
**Scope:** Wire Vite entry, one GameState instance, scene/UI lifecycle, action dispatch, system initialization, save/load, and cleanup.  
**Primary files:** index.html, package.json, vite.config.js, src/main.js, src/app/**

## Required inputs

- Master project context and current task board.
- Current repository tree/commit if implementation is requested.
- Current integration contract and file ownership matrix.
- Validated science/source/asset information where relevant.
- Department dependency and acceptance criteria.

## Department deliverables

- `src/scene, src/buildings, src/ui, src/styles, src/main.js, index.html, package/Vite wiring, docs/assets/asset-register.md`

## Execution rules

1. Lead decomposes the work into tasks with unique IDs.
2. Every task has one writer, one reviewer, a priority, dependencies, path, acceptance criteria, and test evidence requirements.
3. Run specialists in parallel only when inputs and files are independent.
4. Specialist reports to lead through the handoff template.
5. Lead consolidates and approves one canonical artifact before cross-department handoff.
6. A shared API/source register/balance file has a single writer at a time.
7. Cross-department contract or scope changes are escalated; no unilateral interface changes.

## Acceptance standards

- Scene stable at common laptop resolutions.
- HUD readable for ages 7–12 and not color-only.
- Render loop does not mutate gameplay state.
- Missing optional asset does not prevent startup.

## Verification

- Launch with Vite and inspect console.
- Resize browser and check canvas/HUD.
- Test absent-asset fallback.
- Profile representative scene and avoid excessive draw calls/allocations.

## Escalation

Escalate when evidence is unavailable, file ownership conflicts, an API change affects another department, a blocker threatens the critical path, or a science statement/asset cannot be validated. Give A3 the impact, options, recommendation, and decision needed.
