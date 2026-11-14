# File Ownership Matrix

**Rule:** one primary writer per path. Reviewers may comment or submit a patch to the owner; they do not independently replace the canonical file. Paths below are the default ownership plan, to be confirmed at Gate 1 against the actual repository.

| Path / path family | Primary writer | Reviewer / approver | Notes |
|---|---|---|---|
| `index.html`, `package.json`, `vite.config.js` (if needed), `src/main.js`, `src/app/**` | B-S4 | B1, A-S3 | Sole app bootstrap and wiring owner. Avoid adding Vite config unless needed. |
| `src/scene/**` | B-S1 | B1, B-S4 | Scene graph, renderer, camera, lighting, resize and render lifecycle. |
| `src/buildings/**`, `public/models/**`, `public/textures/**`, `public/audio/**`, `docs/assets/asset-register.md` | B-S2 | B-S1, B1, D-S4 | Building objects and local assets; coordinate with B-S1; D-S4 separately validates provenance/rights. |
| `src/ui/**`, `src/styles/**`, `docs/ui/ui-state-map.md` | B-S3 | B1, B-S4, E-S4 | UI consumes snapshot/action contracts; no resource arithmetic. |
| `src/systems/GameState.js`, `src/systems/ResourceSystem.js`, `src/systems/LifeSupportSystem.js`, `src/systems/PowerSystem.js`, `src/systems/FoodSystem.js`, `src/systems/RadiationSystem.js`, `src/systems/HabitatSystem.js`, `src/systems/SaveSystem.js` | C-S1 | C1, A-S3, F-S2 | Canonical state, resource calculations and persistence have one writer. |
| `src/systems/MissionEventSystem.js`, `src/data/missionEvents.js` | C-S2 | C1, A-S3, D1/D-S4 for science | Event scheduling/effects and event data; do not duplicate resource logic. |
| `src/minigames/**` | C-S3 | C1, B-S3, E1 | Exactly two minigame modules, isolated and contract-compliant. |
| `src/data/gameBalance.js` | C-S4 | C1, D-S4, F-S4 | All tunable simulation values centralized and labeled. |
| `docs/architecture/**` | A-S1, A-S2, A-S3, A-S4 by assigned file | A1 | Separate named files; no shared draft file with multiple writers. |
| `docs/research/**`, `docs/science/**` | D-S1, D-S2, D-S3 by topic; D-S4 owns canonical claim/source register | D1 | Distinct topic briefs; D-S4 consolidates source IDs and validation report. |
| `docs/assets/asset-validation-report.md`, `docs/science/source-register.md`, `docs/science/claim-evidence-matrix.md`, `docs/science/simulation-assumptions.md` | D-S4 | D1, A-S4 | B-S2 owns the asset register; D-S4 owns a separate validation report. |
| `docs/education/**` | E-S1, E-S2, E-S4 by file | E1, D1 for factual claims | Do not rewrite approved mechanics or source claims. |
| `README.md`, `docs/developer-setup.md`, `docs/module-guide.md`, `docs/known-limitations.md` | E-S3 | E1, B-S4, F1 | README owner verifies commands against actual project. |
| `docs/qa/**` | F-S1, F-S2, F-S3, F-S4 by assigned report; F1 owns bug log and QA summary | F1, A3 for gate | QA records evidence; source-code changes remain with original code owner. |
| `docs/project-decisions/**` and cross-department task board | A3 or named human operator | Human owner | One canonical decision/task log location selected at startup. |

## Role-specific single-file rule
Each specialist prompt names intended output paths. A department lead may reassign only by recording the old owner, new owner, reason and effective checkpoint in the task board. Do not silently shift ownership. If a requested file is already owned, the requesting agent must submit a change request to the owner.

## Unassigned paths
Any file not listed above is unowned until A3 assigns it. Do not infer ownership from proximity or create a new module under another role's directory without agreement. Generated build output, `node_modules` and temporary screenshots are not source-of-truth deliverables and should not be committed unless explicitly required.
