# Development Workflow

This is the canonical delivery sequence. Some discovery work can overlap, but implementation gates must remain in order.

## Gate 0 — Intake and repository reality check
A3 confirms current repository, branch, package scripts, existing assets, existing code and human constraints. Every agent must inspect the existing tree before proposing changes. Do not overwrite pre-existing user work. Capture baseline startup/build results if possible.

**Exit evidence:** repository inventory, current risks, task board, agreed MVP and scope exclusions.

## Gate 1 — Architecture and game direction
A1 coordinates system architecture, central state, mission loop and interface design. B1/C1/F1 identify presentation, simulation and test needs. The source and science plan begins with D1. A3 and human owner approve the module map, state ownership and contract version.

**Exit evidence:** architecture, gameplay loop, state model, integration contract v1, ownership matrix, acceptance criteria.

## Gate 2 — Research and content validation
D1 coordinates claim-level research across lunar environment, life support, radiation and power; D-S4 consolidates sources and validates provenance. E1 coordinates learning outcomes, science language and tutorial content. Gameplay values are tagged `REAL_SCIENTIFIC_FACT` or `SIMULATION_VALUE`.

**Exit evidence:** source register, claim matrix, caveats, gameplay assumptions, asset rights/provenance notes and approved learning map.

## Gate 3 — Vertical-slice implementation
Implement the smallest complete loop first: boot screen/outpost scene, shared state, one action affecting one or more resources, visible feedback and a win/warning/recovery path. Then add remaining core systems, mission events and the two minigames. The scene and UI consume the state contract; simulation does not depend on Three.js.

**Exit evidence:** integrated vertical slice runs in browser; no disconnected mock interactions.

## Gate 4 — Integration
B4's equivalent frontend integration owner (B-S4) wires application startup; C-S1 owns the state/simulation core; A-S3 owns integration contract definitions; A3 coordinates. Integrate by module and verify ESM imports, lifecycle, state snapshots, event effects, minigame callbacks and persistence schema. Use one writer for each shared file.

**Exit evidence:** clean Vite startup, all core modules load, one end-to-end action path, no critical console errors.

## Gate 5 — QA and hardening
F1 coordinates functional, code, performance and gameplay stress checks. Fix P0/P1 defects first. Re-run regression after each shared integration change. Verify scientific copy against claim IDs; test reset and invalid save behavior; test both minigames; inspect keyboard use and responsive layout.

**Exit evidence:** test execution log, bug log, performance/browser notes, science/content review and explicit not-run list.

## Gate 6 — Documentation and demo preparation
E1 ensures setup, controls, learning outcomes, limitations and project explanation are accurate. B1 ensures the demo starts reliably. A3 prepares a short demo path that proves actual interactions, not screenshots alone.

**Exit evidence:** clean-checkout README steps, feature-to-evidence map, known limitations and reproducible demo checklist.

## Gate 7 — Release recommendation and human approval
A3 consolidates department recommendations. F1 gives independent QA status. The human owner accepts the candidate, explicitly accepts any remaining risk, or requests changes. Never label a build production-ready or NASA-approved; this is a competition prototype.

## Critical path and allowed overlap
Architecture contract precedes shared implementation. Research may run in parallel by topic. UI copy/layout exploration can overlap if APIs and claims are marked provisional. Test-plan design can overlap architecture but final acceptance tests must reflect frozen behavior. Scene assets and isolated documentation can progress in parallel with simulation after owners/contracts are declared. Shared files are serialized.
