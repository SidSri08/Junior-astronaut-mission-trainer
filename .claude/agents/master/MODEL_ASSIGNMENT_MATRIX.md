# Model Assignment Matrix

The model names below are the exact project-provided labels. Assignment is based on task fit, not a claim that capabilities or tools have been verified. Confirm actual availability and permissions in the deployment environment.

| Agent ID | Role | Model | Assignment rationale |
|---|---|---|---|
| A3 | Chief Orchestrator | Orchestrator (Argon) | Cross-department planning, prioritization, dependency control and status synthesis. |
| A1 | Chief Technical Architect and Game Director | Claude Opus 5.5 | Technical architecture, system reasoning, and game direction. |
| A-S1 | System Architect | GPT-oss 120B | Specialist assignment: Design module boundaries, central GameState shape, dependency direction, state lifecycle, and the smallest maintainable architecture. |
| A-S2 | Game Mechanics Analyst | Claude Sonnet 5.5 | Specialist assignment: Specify a short mission loop, player choices, success/recovery conditions, pacing, system trade-offs, and observable consequences. |
| A-S3 | Integration Architect | Gemini 4 Argon | Specialist assignment: Define exact ESM APIs, parameters, return shapes, initialization order, state access, action dispatch, events, minigames, and persistence contracts. |
| A-S4 | Architecture Auditor | GPT-oss 120B | Specialist assignment: Independently audit scope, dependencies, coupling, state ownership, persistence, risks, and unnecessary complexity. |
| B1 | Three.js Environment Engineer and Frontend Lead | Gemini 4 Argon | 3D scene/frontend coordination and visual implementation. |
| B-S1 | Three.js Scene Specialist | Gemini 4 Argon | Specialist assignment: Implement scene graph, lunar terrain, camera, lighting, renderer settings, resize handling, and render lifecycle. |
| B-S2 | 3D Asset Specialist | Gemini 4 Hydrogen | Specialist assignment: Select/prepare a small set of habitat, solar, rover, and prop assets; optimize and document provenance/usage terms. |
| B-S3 | UI/UX Specialist | Gemini 3.8 Flash | Specialist assignment: Implement a child-readable HUD for five systems, mission status, actions, alerts, overlays, accessibility, and responsive CSS. |
| B-S4 | Frontend Integration Specialist | Claude Sonnet 5.5 | Specialist assignment: Wire Vite entry, one GameState instance, scene/UI lifecycle, action dispatch, system initialization, save/load, and cleanup. |
| C1 | Resource Systems Engineer and Gameplay Simulation Lead | Claude Sonnet 5.5 | Gameplay logic, deterministic simulation and mechanics. |
| C-S1 | Resource Simulation Analyst | Claude Sonnet 5.5 | Specialist assignment: Own the canonical mission state and implement deterministic oxygen/life-support, power, food, radiation-protection, habitat-condition, and safe save/load behavior with explicit causes and bounds. |
| C-S2 | Decision Systems Designer | Gemini 4 Argon | Specialist assignment: Design and implement mission events, triggers, choices, consequences, expiry, scheduling, and idempotent resolution. |
| C-S3 | Minigame Mechanics Designer | Gemini 3.8 Flash | Specialist assignment: Design and prototype exactly two short learning minigames with deterministic scoring and clean lifecycle integration. |
| C-S4 | Gameplay Balance Analyst | GPT-oss 120B | Specialist assignment: Own central tunable values, difficulty/pacing scenarios, recovery windows, and evidence-based balance recommendations. |
| D1 | NASA Scientific Research Analyst and Research Lead | Gemini 4 Hydrogen | Scientific research discovery and source-aware synthesis. |
| D-S1 | Lunar Science Researcher | Gemini 4 Hydrogen | Specialist assignment: Research lunar gravity, terrain/regolith, dust, illumination, thermal context, and region-specific lunar exploration facts. |
| D-S2 | Life Support Researcher | Claude Sonnet 5.5 | Specialist assignment: Research oxygen, atmosphere revitalization, water recovery, food systems, and human life-support concepts. |
| D-S3 | Radiation and Power Researcher | GPT-oss 120B | Specialist assignment: Research lunar power/storage, illumination, space weather, radiation types, and shielding concepts/trade-offs. |
| D-S4 | Asset and Source Validator | Claude Opus 5.5 | Specialist assignment: Independently verify scientific sources, source metadata, image/model/audio/font rights, attribution, and approval status. |
| E1 | Technical Documentation Engineer and Educational Content Lead | Gemini 3.8 Flash | Fast structured documentation and child-facing language production. |
| E-S1 | Child Learning Specialist | Gemini 3.8 Flash | Specialist assignment: Define observable learning outcomes, age-aware progression, inclusive interaction guidance, and a short learning-evidence rubric. |
| E-S2 | Science Communication Specialist | Claude Sonnet 5.5 | Specialist assignment: Translate approved claims into child-friendly explanations, tooltips, glossary entries, analogies, and feedback. |
| E-S3 | Technical Documentation Specialist | GPT-oss 120B | Specialist assignment: Write README, developer setup, module guide, troubleshooting, known limitations, and judge-facing project explanation. |
| E-S4 | Tutorial and UX Writer | Gemini 4 Hydrogen | Specialist assignment: Write first-launch tutorial, controls, minigame directions, alerts, mission prompts, and calm recovery/error copy. |
| F1 | QA Engineer and Quality Engineering Lead | GPT-oss 120B | Independent testing, code audit and defect-oriented reasoning. |
| F-S1 | Functional Test Engineer | GPT-oss 120B | Specialist assignment: Test clean startup, main player journeys, five systems, events, both minigames, and save/load. |
| F-S2 | Code Audit Specialist | Claude Opus 5.5 | Specialist assignment: Review state integrity, import/API boundaries, async errors, cleanup, storage parsing, asset loading, and maintainability. |
| F-S3 | Performance Test Engineer | Gemini 4 Argon | Specialist assignment: Measure startup/rendering/asset/memory/responsive performance on specified browser/device. |
| F-S4 | Gameplay Stress Tester | Claude Sonnet 5.5 | Specialist assignment: Probe resource extremes, repeated actions, event duplication, minigame exploits, save corruption, and unfair recovery paths. |

## Operating rules

1. Use the assigned model as the default for that prompt. The human operator may substitute only after recording the change and checking capability fit.
2. Never infer browser, terminal, repository, file-write, image-generation or sub-agent tools from the model name. Check session capabilities explicitly.
3. If an assigned model is unavailable, do not silently swap models; record the substitute, date, reason, and any quality-control adjustment.
4. Use independent review for high-impact architecture, science claims, and release QA. Independence means a separate review pass, not necessarily another launched agent.
5. Prefer deterministic test evidence over model confidence.
