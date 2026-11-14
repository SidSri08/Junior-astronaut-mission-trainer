# Master Agent Registry

**Authorized deployment size: 31 named roles.** One Chief Orchestrator, six Department Leads and 24 Specialists (four per department). The 15 original core-role titles are retained as function mandates across the six lead roles; they are not additional agent instances. Ten consolidated workstreams W01–W10 preserve the original delivery responsibilities.

## Reporting hierarchy

- Human Project Owner → A3 Chief Orchestrator.
- A3 → six Department Leads A1, B1, C1, D1, E1 and F1.
- Each Department Lead → its four listed specialists only.
- Specialists do not create nested teams or autonomously coordinate across departments. Cross-department requests route through the lead and A3.

## Agent roster

| ID | Named role | Assigned model | Department | Primary responsibility |
|---|---|---|---|---|
| A3 | Chief Orchestrator | Orchestrator (Argon) | Organization-wide | Coordinates six leads; scope, priorities, dependencies, gates, escalation |
| A1 | Chief Technical Architect and Game Director | Claude Opus 5.5 | Architecture and Game Direction | Department leadership; four-specialist delegation; consolidation and approval |
| A-S1 | System Architect | GPT-oss 120B | Architecture and Game Direction | Design module boundaries, central GameState shape, dependency direction, state lifecycle, and the smallest maintainable architecture. |
| A-S2 | Game Mechanics Analyst | Claude Sonnet 5.5 | Architecture and Game Direction | Specify a short mission loop, player choices, success/recovery conditions, pacing, system trade-offs, and observable consequences. |
| A-S3 | Integration Architect | Gemini 4 Argon | Architecture and Game Direction | Define exact ESM APIs, parameters, return shapes, initialization order, state access, action dispatch, events, minigames, and persistence contracts. |
| A-S4 | Architecture Auditor | GPT-oss 120B | Architecture and Game Direction | Independently audit scope, dependencies, coupling, state ownership, persistence, risks, and unnecessary complexity. |
| B1 | Three.js Environment Engineer and Frontend Lead | Gemini 4 Argon | 3D Environment and Frontend | Department leadership; four-specialist delegation; consolidation and approval |
| B-S1 | Three.js Scene Specialist | Gemini 4 Argon | 3D Environment and Frontend | Implement scene graph, lunar terrain, camera, lighting, renderer settings, resize handling, and render lifecycle. |
| B-S2 | 3D Asset Specialist | Gemini 4 Hydrogen | 3D Environment and Frontend | Select/prepare a small set of habitat, solar, rover, and prop assets; optimize and document provenance/usage terms. |
| B-S3 | UI/UX Specialist | Gemini 3.8 Flash | 3D Environment and Frontend | Implement a child-readable HUD for five systems, mission status, actions, alerts, overlays, accessibility, and responsive CSS. |
| B-S4 | Frontend Integration Specialist | Claude Sonnet 5.5 | 3D Environment and Frontend | Wire Vite entry, one GameState instance, scene/UI lifecycle, action dispatch, system initialization, save/load, and cleanup. |
| C1 | Resource Systems Engineer and Gameplay Simulation Lead | Claude Sonnet 5.5 | Gameplay and Simulation | Department leadership; four-specialist delegation; consolidation and approval |
| C-S1 | Resource Simulation Analyst | Claude Sonnet 5.5 | Gameplay and Simulation | Own the canonical mission state and implement deterministic oxygen/life-support, power, food, radiation-protection, habitat-condition, and safe save/load behavior with explicit causes and bounds. |
| C-S2 | Decision Systems Designer | Gemini 4 Argon | Gameplay and Simulation | Design and implement mission events, triggers, choices, consequences, expiry, scheduling, and idempotent resolution. |
| C-S3 | Minigame Mechanics Designer | Gemini 3.8 Flash | Gameplay and Simulation | Design and prototype exactly two short learning minigames with deterministic scoring and clean lifecycle integration. |
| C-S4 | Gameplay Balance Analyst | GPT-oss 120B | Gameplay and Simulation | Own central tunable values, difficulty/pacing scenarios, recovery windows, and evidence-based balance recommendations. |
| D1 | NASA Scientific Research Analyst and Research Lead | Gemini 4 Hydrogen | NASA Research and Visual References | Department leadership; four-specialist delegation; consolidation and approval |
| D-S1 | Lunar Science Researcher | Gemini 4 Hydrogen | NASA Research and Visual References | Research lunar gravity, terrain/regolith, dust, illumination, thermal context, and region-specific lunar exploration facts. |
| D-S2 | Life Support Researcher | Claude Sonnet 5.5 | NASA Research and Visual References | Research oxygen, atmosphere revitalization, water recovery, food systems, and human life-support concepts. |
| D-S3 | Radiation and Power Researcher | GPT-oss 120B | NASA Research and Visual References | Research lunar power/storage, illumination, space weather, radiation types, and shielding concepts/trade-offs. |
| D-S4 | Asset and Source Validator | Claude Opus 5.5 | NASA Research and Visual References | Independently verify scientific sources, source metadata, image/model/audio/font rights, attribution, and approval status. |
| E1 | Technical Documentation Engineer and Educational Content Lead | Gemini 3.8 Flash | Education and Documentation | Department leadership; four-specialist delegation; consolidation and approval |
| E-S1 | Child Learning Specialist | Gemini 3.8 Flash | Education and Documentation | Define observable learning outcomes, age-aware progression, inclusive interaction guidance, and a short learning-evidence rubric. |
| E-S2 | Science Communication Specialist | Claude Sonnet 5.5 | Education and Documentation | Translate approved claims into child-friendly explanations, tooltips, glossary entries, analogies, and feedback. |
| E-S3 | Technical Documentation Specialist | GPT-oss 120B | Education and Documentation | Write README, developer setup, module guide, troubleshooting, known limitations, and judge-facing project explanation. |
| E-S4 | Tutorial and UX Writer | Gemini 4 Hydrogen | Education and Documentation | Write first-launch tutorial, controls, minigame directions, alerts, mission prompts, and calm recovery/error copy. |
| F1 | QA Engineer and Quality Engineering Lead | GPT-oss 120B | Quality Assurance | Department leadership; four-specialist delegation; consolidation and approval |
| F-S1 | Functional Test Engineer | GPT-oss 120B | Quality Assurance | Test clean startup, main player journeys, five systems, events, both minigames, and save/load. |
| F-S2 | Code Audit Specialist | Claude Opus 5.5 | Quality Assurance | Review state integrity, import/API boundaries, async errors, cleanup, storage parsing, asset loading, and maintainability. |
| F-S3 | Performance Test Engineer | Gemini 4 Argon | Quality Assurance | Measure startup/rendering/asset/memory/responsive performance on specified browser/device. |
| F-S4 | Gameplay Stress Tester | Claude Sonnet 5.5 | Quality Assurance | Probe resource extremes, repeated actions, event duplication, minigame exploits, save corruption, and unfair recovery paths. |

## Ten implementation workstreams retained

| Workstream | Identity | Accountable lead | Coverage / retained core-role identities |
|---|---|---|---|
| W01 | Architecture and Game Direction | A1 Chief Technical Architect + A2 Game Director | A1 |
| W02 | 3D Environment and Art | B1 Three.js Environment Engineer + B2 3D Environment Artist | B1 |
| W03 | Frontend and UI/UX | B3 Frontend and UI/UX Engineer | B1 |
| W04 | Resource Simulation | C1 Resource Systems Engineer | C1 |
| W05 | Gameplay and Mission Events | C2 Gameplay and Mission Events Engineer | C1 |
| W06 | Minigame Development | C3 Minigame Developer | C1 |
| W07 | NASA Research and Visual References | D1 NASA Scientific Research Analyst + D2 Visual Research and Asset Specialist | D1 |
| W08 | Education and Documentation | E1 Technical Documentation Engineer + E2 Educational Content Designer | E1 |
| W09 | Quality Assurance | F1 QA Engineer | F1 |
| W10 | Code Review, Debugging, Balance and Simulation Testing | F2 Code Reviewer and Debugging Engineer + F3 Gameplay Balance and Simulation Tester | F1 |

## Original core-role identity mapping

The following titles remain visible as scoped mandates, not as extra agent IDs: A2 Game Director → A1 lead mandate; B2 3D Environment Artist and B3 Frontend and UI/UX Engineer → B1 lead mandate; C2 Gameplay and Mission Events Engineer and C3 Minigame Developer → C1 lead mandate; D2 Visual Research and Asset Specialist → D1 lead mandate; E2 Educational Content Designer → E1 lead mandate; F2 Code Reviewer and Debugging Engineer and F3 Gameplay Balance and Simulation Tester → F1 lead mandate. The specialist roles deepen these functions through bounded implementation/review work. The exact 31 prompt files define the deployable instances.

## Model capability caveat

Model names are used exactly as supplied by the project owner. Their current availability, context windows, tool access, agent-launch ability, coding ability and safety behavior have not been independently verified. Re-check each environment before deployment. A role's prompt must not assume it can access files, browse, run commands or launch other agents unless the active session actually exposes those capabilities.
