# Junior Astronaut Mission Trainer — Shared Instructions

Browser-based 3D educational lunar-outpost game for children aged 7–12 (NASA Space Apps Challenge 2026).

## Stack (fixed — do not change)
Three.js · HTML5 · CSS3 · Vanilla JS (ES modules) · Vite · LocalStorage. No React, no backend, no auth, no multiplayer, no paid APIs. New npm packages require A3 approval.

## Commands
- `npm install` — install deps (three, vite)
- `npm run dev` — dev server (http://localhost:5173)
- `npm run build` — production build to `dist/`
- `npm test` — headless simulation tests (`node --test tests/`)

## Where things live
- Architecture & contracts: `docs/architecture/ARCHITECTURE.md` (frozen; change via A3)
- File ownership: `docs/architecture/ARCHITECTURE.md` §8 (single writer per file)
- Science: `docs/science/` · Education: `docs/education/` · QA evidence: `docs/qa/`
- Detailed swarm organization/protocols: `.claude/agents/` (README, master/, protocols/)
- Path-specific rules: `.claude/rules/architecture.md`, `science.md`, `testing.md`

## Golden rules
1. One canonical GameState (`src/systems/GameState.js`). UI and scene read snapshots and dispatch named actions only.
2. Render loop never advances the simulation; one fixed-step scheduler in `src/main.js` does.
3. Every science claim shown to players has a source ID in `src/data/scienceFacts.js`; game-tuned numbers live in `src/data/gameBalance.js` labelled `SIMULATION_VALUE`.
4. Never fabricate tests, results, or agent activity. Don't push to GitHub without human approval.

