# Project Task Breakdown, Architecture Decisions & Ownership Log

**Owner:** A3 Chief Project Orchestrator  
**Contract Reference:** `docs/architecture/ARCHITECTURE.md` (Frozen v1)

---

## 1. Stage-by-Stage Execution Plan & Status

| Stage | Description | Responsible Roles | Status |
|---|---|---|---|
| **Stage 1** | Environment audit, Git baseline, Node/npm check | A3 | Complete |
| **Stage 2** | Register 30 department/specialist prompts with YAML frontmatter; create `CLAUDE.md` and `.claude/rules/{architecture,science,testing}.md` | A3 | Complete |
| **Stage 3** | Freeze shared architecture, `GameState` schema v1, action vocabulary, scene/UI/minigame contracts in `docs/architecture/ARCHITECTURE.md` | A3 (acting for Dept A: A1, A-S1, A-S2, A-S3, A-S4) | Complete |
| **Stage 4** | Task breakdown & single-writer file ownership matrix | A3 | Complete |
| **Stage 5** | Playable vertical slice: `GameState`, `PowerSystem`, `LifeSupportSystem`, `ResourceSystem`, `SaveSystem`, Vite scaffold | A3 (acting for C1/C-S1/C-S4) | Complete |
| **Stage 6** | Full gameplay systems: `FoodSystem`, `RadiationSystem`, `HabitatSystem`, `MissionEventSystem`, `missionEvents.js`, `objectives.js`, and 2 minigames (`leakHunter.js`, `solarAligner.js`, `minigameHost.js`) | A3 (acting for C1, C-S1..C-S4) | Complete |
| **Stage 7** | Scientific research (`src/data/scienceFacts.js`, `docs/science/*`), 3D Three.js lunar environment (`src/scene/*`), child-friendly HUD & education (`src/ui/ui.js`, `src/data/educationContent.js`, `docs/education/*`) | Subagent `D1` (Dept D), Subagent `B-S1` (Dept B), Subagent `E1` (Dept E), A3 (`B-S3`/`B-S4`) | Complete |
| **Stage 8** | Integration, automated headless tests (`tests/simulation.test.js`), independent QA & stress testing (`docs/qa/qa-report.md`) | A3 + Subagent `F1` (Dept F) | Complete |
| **Stage 9** | Final documentation (`README.md`, `docs/developer-setup.md`, `docs/module-guide.md`, `docs/known-limitations.md`) | Subagent `E1` + A3 | Complete |

---

## 2. Single-Writer Ownership Record

Every file in the repository has a single writer to prevent merge or overwrite conflicts:

- `docs/architecture/ARCHITECTURE.md`, `docs/project-decisions/**`, `CLAUDE.md`, `.claude/rules/**`: **A3**
- `src/scene/sceneUtils.js`, `src/scene/terrain.js`, `src/scene/buildings.js`, `src/scene/OutpostScene.js`: **Subagent B-S1**
- `src/data/scienceFacts.js`, `docs/science/source-register.md`, `docs/science/claim-evidence-matrix.md`, `docs/science/simulation-assumptions.md`, `docs/science/science-reference.md`: **Subagent D1 (Department D)**
- `src/systems/**`, `src/data/gameBalance.js`, `src/data/missionEvents.js`, `src/data/objectives.js`, `src/minigames/**`: **A3 (performing C1 / C-S1..C-S4)**
- `index.html`, `src/main.js`, `src/ui/ui.js`, `src/styles/main.css`, `src/data/educationContent.js`: **A3 (performing B-S3 / B-S4 / E-S4)**
- `docs/education/learning-guide.md`, `README.md`, `docs/developer-setup.md`, `docs/module-guide.md`, `docs/known-limitations.md`: **Subagent E1 (Department E)**
- `tests/simulation.test.js`: **A3 (F-S1 baseline)**
- `docs/qa/**`: **Subagent F1 (Department F)**

