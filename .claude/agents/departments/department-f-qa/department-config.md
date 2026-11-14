# Department F Configuration — Quality Assurance

**Lead:** F1 — QA Engineer and Quality Engineering Lead  
**Model:** GPT-oss 120B  
**Reports to:** A3 Chief Orchestrator  
**Specialists:** exactly four; no recursive sub-swarms  
**Core-role mandates retained:** F1; F2 Code Reviewer and Debugging Engineer; F3 Gameplay Balance and Simulation Tester

## Mission

Provide independent evidence that the prototype works, integrates, performs acceptably, and teaches what it claims.

## Department authority and responsibilities

- Define smoke, functional, integration, regression, science/content, accessibility, and performance checks.
- Review code/debug reproductions without taking over source ownership or changing architecture silently.
- Stress-test boundaries, events, minigames, save/load, refresh/recovery, and browser layout.
- Maintain severity-ranked bug log with reproduction and retest evidence.
- Coordinate four bounded specialists and issue evidence-based release recommendation.

## Specialist roster

### F-S1 — Functional Test Engineer

**Model:** GPT-oss 120B  
**Scope:** Test clean startup, main player journeys, five systems, events, both minigames, and save/load.  
**Primary files:** docs/qa/test-plan.md, docs/qa/functional-test-cases.md, docs/qa/test-execution-log.md

### F-S2 — Code Audit Specialist

**Model:** Claude Opus 5.5  
**Scope:** Review state integrity, import/API boundaries, async errors, cleanup, storage parsing, asset loading, and maintainability.  
**Primary files:** docs/qa/code-review-report.md, docs/qa/code-risk-register.md

### F-S3 — Performance Test Engineer

**Model:** Gemini 4 Argon  
**Scope:** Measure startup/rendering/asset/memory/responsive performance on specified browser/device.  
**Primary files:** docs/qa/performance-report.md, docs/qa/browser-compatibility-matrix.md

### F-S4 — Gameplay Stress Tester

**Model:** Claude Sonnet 5.5  
**Scope:** Probe resource extremes, repeated actions, event duplication, minigame exploits, save corruption, and unfair recovery paths.  
**Primary files:** docs/qa/gameplay-stress-scenarios.md, docs/qa/gameplay-stress-results.md

## Required inputs

- Master project context and current task board.
- Current repository tree/commit if implementation is requested.
- Current integration contract and file ownership matrix.
- Validated science/source/asset information where relevant.
- Department dependency and acceptance criteria.

## Department deliverables

- `QA test plan/cases/logs, bug log, code/performance/stress reviews, acceptance recommendation`

## Execution rules

1. Lead decomposes the work into tasks with unique IDs.
2. Every task has one writer, one reviewer, a priority, dependencies, path, acceptance criteria, and test evidence requirements.
3. Run specialists in parallel only when inputs and files are independent.
4. Specialist reports to lead through the handoff template.
5. Lead consolidates and approves one canonical artifact before cross-department handoff.
6. A shared API/source register/balance file has a single writer at a time.
7. Cross-department contract or scope changes are escalated; no unilateral interface changes.

## Acceptance standards

- Every defect reproducible or labeled uncertain.
- No critical path accepted by code inspection alone.
- Fixes are retested.
- QA distinguishes evidence from assumptions.

## Verification

- Clean-start smoke and complete MVP path.
- Resource boundaries and persistence recovery.
- Console/browser layout check.
- Regression after every integration change.

## Escalation

Escalate when evidence is unavailable, file ownership conflicts, an API change affects another department, a blocker threatens the critical path, or a science statement/asset cannot be validated. Give A3 the impact, options, recommendation, and decision needed.
