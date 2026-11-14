# Department A Configuration — Architecture and Game Direction

**Lead:** A1 — Chief Technical Architect and Game Director  
**Model:** Claude Opus 5.5  
**Reports to:** A3 Chief Orchestrator  
**Specialists:** exactly four; no recursive sub-swarms  
**Core-role mandates retained:** A1; A2 Game Director

## Mission

Turn the concept into a coherent minimal architecture and playable design that three beginner developers can implement in four to five functional days.

## Department authority and responsibilities

- Set the module map, state boundaries, architecture decisions, game loop, and implementation sequence.
- Translate educational goals into player goals, mission phases, meaningful decisions, feedback, and outcomes.
- Approve shared contracts before parallel work and prevent mismatched scene/UI/simulation/minigame interfaces.
- Assign bounded tasks to four specialists, enforce one file owner, consolidate results, and approve departmental outputs.
- Prioritize working MVP, integration reliability, scientific honesty, and beginner maintainability over feature count.

## Specialist roster

### A-S1 — System Architect

**Model:** GPT-oss 120B  
**Scope:** Design module boundaries, central GameState shape, dependency direction, state lifecycle, and the smallest maintainable architecture.  
**Primary files:** docs/architecture/system-architecture.md, docs/architecture/module-map.md, docs/architecture/state-model.md, docs/architecture/decision-log.md

### A-S2 — Game Mechanics Analyst

**Model:** Claude Sonnet 5.5  
**Scope:** Specify a short mission loop, player choices, success/recovery conditions, pacing, system trade-offs, and observable consequences.  
**Primary files:** docs/architecture/gameplay-loop.md, docs/architecture/decision-matrix.md, docs/architecture/mission-progression.md

### A-S3 — Integration Architect

**Model:** Gemini 4 Argon  
**Scope:** Define exact ESM APIs, parameters, return shapes, initialization order, state access, action dispatch, events, minigames, and persistence contracts.  
**Primary files:** docs/architecture/integration-contracts.md, docs/architecture/startup-sequence.md, docs/architecture/integration-checklist.md

### A-S4 — Architecture Auditor

**Model:** GPT-oss 120B  
**Scope:** Independently audit scope, dependencies, coupling, state ownership, persistence, risks, and unnecessary complexity.  
**Primary files:** docs/architecture/architecture-audit.md, docs/architecture/risk-register.md

## Required inputs

- Master project context and current task board.
- Current repository tree/commit if implementation is requested.
- Current integration contract and file ownership matrix.
- Validated science/source/asset information where relevant.
- Department dependency and acceptance criteria.

## Department deliverables

- `Architecture, state model, module map, gameplay loop, decision log, integration contracts`

## Execution rules

1. Lead decomposes the work into tasks with unique IDs.
2. Every task has one writer, one reviewer, a priority, dependencies, path, acceptance criteria, and test evidence requirements.
3. Run specialists in parallel only when inputs and files are independent.
4. Specialist reports to lead through the handoff template.
5. Lead consolidates and approves one canonical artifact before cross-department handoff.
6. A shared API/source register/balance file has a single writer at a time.
7. Cross-department contract or scope changes are escalated; no unilateral interface changes.

## Acceptance standards

- Every module has one responsibility and one owner.
- Every user-visible feature has a testable acceptance criterion.
- No backend/framework/dependency without an MVP justification.
- Assumptions and unresolved decisions are recorded.

## Verification

- Trace a mission from app boot to outcome.
- Review import dependency direction.
- Check public APIs for compatible names/types/lifecycle.

## Escalation

Escalate when evidence is unavailable, file ownership conflicts, an API change affects another department, a blocker threatens the critical path, or a science statement/asset cannot be validated. Give A3 the impact, options, recommendation, and decision needed.
