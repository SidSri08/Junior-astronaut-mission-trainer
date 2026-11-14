# Department C Configuration — Gameplay and Simulation

**Lead:** C1 — Resource Systems Engineer and Gameplay Simulation Lead  
**Model:** Claude Sonnet 5.5  
**Reports to:** A3 Chief Orchestrator  
**Specialists:** exactly four; no recursive sub-swarms  
**Core-role mandates retained:** C1; C2 Gameplay and Mission Events Engineer; C3 Minigame Developer

## Mission

Implement a deterministic, explainable lunar-outpost simulation with meaningful decisions across the five core systems and two small minigames.

## Department authority and responsibilities

- Define deterministic update rules, units, initial conditions, thresholds, event cadence, and recovery outcomes.
- Keep gameplay logic out of rendering and DOM handlers; expose stable ESM APIs and snapshots.
- Ensure every decision has a transparent cause/effect result.
- Coordinate two isolated minigames with safe start/complete/exit/reward contracts.
- Assign separate owners for systems, events, minigames, and balance config; publish one canonical ruleset.

## Specialist roster

### C-S1 — Resource Simulation Analyst

**Model:** Claude Sonnet 5.5  
**Scope:** Own the canonical mission state and implement deterministic oxygen/life-support, power, food, radiation-protection, habitat-condition, and safe save/load behavior with explicit causes and bounds.  
**Primary files:** src/systems/GameState.js, src/systems/ResourceSystem.js, src/systems/LifeSupportSystem.js, src/systems/PowerSystem.js, src/systems/FoodSystem.js, src/systems/RadiationSystem.js, src/systems/HabitatSystem.js, src/systems/SaveSystem.js

### C-S2 — Decision Systems Designer

**Model:** Gemini 4 Argon  
**Scope:** Design and implement mission events, triggers, choices, consequences, expiry, scheduling, and idempotent resolution.  
**Primary files:** src/systems/MissionEventSystem.js, src/data/missionEvents.js, docs/gameplay/mission-event-catalog.md

### C-S3 — Minigame Mechanics Designer

**Model:** Gemini 3.8 Flash  
**Scope:** Design and prototype exactly two short learning minigames with deterministic scoring and clean lifecycle integration.  
**Primary files:** src/minigames/**, docs/gameplay/minigame-specs.md

### C-S4 — Gameplay Balance Analyst

**Model:** GPT-oss 120B  
**Scope:** Own central tunable values, difficulty/pacing scenarios, recovery windows, and evidence-based balance recommendations.  
**Primary files:** src/data/gameBalance.js, docs/gameplay/balance-scenarios.md, docs/gameplay/tuning-log.md

## Required inputs

- Master project context and current task board.
- Current repository tree/commit if implementation is requested.
- Current integration contract and file ownership matrix.
- Validated science/source/asset information where relevant.
- Department dependency and acceptance criteria.

## Department deliverables

- `src/systems/**, src/minigames/**, src/data/gameBalance.js, docs/gameplay/**`

## Execution rules

1. Lead decomposes the work into tasks with unique IDs.
2. Every task has one writer, one reviewer, a priority, dependencies, path, acceptance criteria, and test evidence requirements.
3. Run specialists in parallel only when inputs and files are independent.
4. Specialist reports to lead through the handoff template.
5. Lead consolidates and approves one canonical artifact before cross-department handoff.
6. A shared API/source register/balance file has a single writer at a time.
7. Cross-department contract or scope changes are escalated; no unilateral interface changes.

## Acceptance standards

- Every resource change has a traceable cause.
- Same state/actions produce same results where required.
- Gameplay numbers are labeled simulation values unless source-validated.
- Minigames cannot corrupt central state.

## Verification

- Test normal, low, zero, max and recovery states.
- Repeat deterministic scenarios.
- Test event duplicate protection.
- Test minigame lifecycle and reward-once behavior.

## Escalation

Escalate when evidence is unavailable, file ownership conflicts, an API change affects another department, a blocker threatens the critical path, or a science statement/asset cannot be validated. Give A3 the impact, options, recommendation, and decision needed.
