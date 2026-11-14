# Master Project Context — Junior Astronaut Mission Trainer

## Purpose and product vision
Create a browser-based educational game for children aged 7–12. The player operates a small, sustainable lunar outpost and makes understandable engineering decisions that affect crew safety, mission continuity, and resource resilience. The experience should feel like a playable mission, not a dashboard mock-up or a static science presentation.

## Competition and delivery context
- Competition: NASA Space Apps Challenge 2026.
- Team: three beginner developers.
- Effective build window: approximately four to five functional development days.
- Cost constraint: free tools and technologies wherever practical.
- Delivery: a local/browser-run prototype suitable for a live demonstration and review.
- This package defines the AI development organization only. It does not build the game or start agents.

## MVP experience
The player should be able to start a mission, understand the outpost status, make a small number of clear decisions, observe consequences over time, respond to events, and reach a success, warning, or recovery outcome. The five core resource/habitat systems are oxygen and life support, electrical power, food production, radiation protection, and habitat maintenance. Mission events create contextual consequences. Exactly two educational minigames reinforce concepts used by the main simulation.

## Required technology
- Three.js: 3D lunar environment, camera, lighting, scene objects and rendering.
- HTML5/CSS3: all readable HUD elements, menus, controls, cards, alerts and overlays.
- Vanilla JavaScript with ES modules: game rules and application logic.
- Vite: local development server and build tooling.
- LocalStorage: lightweight local persistence where needed; no account system or backend is required.
- Keep dependencies minimal. Any dependency requires a short justification, a free-use check and lead approval.

## Canonical project layout
```text
junior-astronaut-mission-trainer/
├── index.html
├── package.json
├── vite.config.js                 # only if required; otherwise Vite defaults
├── public/
│   ├── models/
│   ├── textures/
│   └── audio/
├── src/
│   ├── main.js
│   ├── app/                       # app composition / lifecycle helpers
│   ├── scene/                     # Three.js scene, camera, lighting, renderer
│   ├── buildings/                 # habitat and outpost visual objects
│   ├── systems/                   # GameState, resource systems, save/load
│   ├── minigames/                 # exactly two isolated mini experiences
│   ├── ui/                        # DOM-based HUD, panels, modals, controls
│   ├── data/                      # tunable gameplay configuration and events
│   └── styles/                    # CSS modules / stylesheets
├── docs/                          # research, science, architecture, QA evidence
└── README.md
```
Do not create a competing top-level architecture. If a path must change, Department A records the decision and A3 approves it before implementation.

## Design principles
1. **Playable first:** one complete, demonstrable loop outranks feature breadth.
2. **Causality:** every major action has a visible, explainable consequence.
3. **Scientific honesty:** real facts and game-tuned values are labeled separately.
4. **Child-readable:** concrete language, short instructions, calm feedback, and clear affordances.
5. **Meaningful trade-offs:** a choice may help one system while consuming or risking another.
6. **Beginner-maintainable:** readable modules, few dependencies, simple data flow, and documented commands.
7. **Graceful failure:** missing optional assets or malformed local save data should not make the app unusable.
8. **Demonstration reliability:** predictable starting state, reproducible mission, and a short presentation path.

## Shared gameplay and state rules
- One canonical `GameState` owns mutable gameplay state.
- UI and Three.js scene consume snapshots/read-only views; they do not maintain separate copies of resource values.
- User actions enter through named action functions and are validated by the gameplay layer.
- Simulation updates are deterministic for a fixed state, action sequence and configured time step wherever practical.
- Rendering runs independently from simulation updates. Do not mutate game state inside the render loop.
- Mission event effects must be applied once, be traceable, and have a clear result message.
- Each minigame has a documented start, active, completion, exit/cancel and reward/result contract.
- Save/load is centralized, versioned and resilient to invalid data. Persistence is optional for the first playable slice if schedule risk is high.

## Scientific integrity
Every scientific claim used in UI, tutorials, mechanics or documentation needs a claim ID and a source record. Prefer NASA official resources, NASA Artemis material, NASA DONKI when relevant, NASA OSDR where relevant, NASA lunar science pages, NASA Technical Reports Server (NTRS), and peer-reviewed research. Record title, publisher, URL or report identifier, publication/update date if available, access date, quoted/paraphrased claim, caveats and intended use. Do not treat a NASA image or general page as validation of a specific numeric threshold.

Use two explicit labels in research and design artifacts:
- `REAL_SCIENTIFIC_FACT`: a sourced statement, with a source ID and caveat.
- `SIMULATION_VALUE`: a game-tuning choice made for playability, not a real engineering limit or NASA recommendation.

Never invent NASA statistics, imply the game is an operational mission-planning tool, or represent simplified resource rules as flight-certified engineering.

## Scope controls and non-goals
No backend, multiplayer, account login, payments, real-time NASA API dependency, complex orbital physics, procedural world generator, heavy asset pipeline, or extra minigame unless the human project owner approves a change and the Chief Orchestrator records its impact. No agent may expand scope unilaterally.

## MVP acceptance baseline
A candidate MVP must start in a supported modern browser, show the lunar outpost and readable HUD, allow meaningful player actions, update all five core system indicators through shared state, show at least one mission event with a consequence, include exactly two playable educational minigames, show end/recovery feedback, and include a concise source register plus setup instructions. All claims in the demo must match implemented behavior and QA evidence. Optional features must be clearly marked as such.

## Human decision rights
The human project owner retains final authority over scope, schedule, risk acceptance, competition claims, science claim publication, and release/demo approval. The Chief Orchestrator recommends and coordinates; it does not overrule the human owner.
