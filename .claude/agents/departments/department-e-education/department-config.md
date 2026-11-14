# Department E Configuration — Education and Documentation

**Lead:** E1 — Technical Documentation Engineer and Educational Content Lead  
**Model:** Gemini 3.8 Flash  
**Reports to:** A3 Chief Orchestrator  
**Specialists:** exactly four; no recursive sub-swarms  
**Core-role mandates retained:** E1; E2 Educational Content Designer

## Mission

Create age-appropriate learning outcomes, accurate player-facing explanations, tutorials, and reproducible developer documentation.

## Department authority and responsibilities

- Map each system to an observable learning objective and player-facing explanation.
- Simplify validated science without changing meaning or hiding uncertainty.
- Design onboarding, tooltips, minigame instructions, result feedback, and accessible microcopy.
- Maintain setup steps, architecture guide, controls, troubleshooting, limitations, attributions, and demo path.
- Use four specialists for learning design, science copy, technical docs, and tutorial copy; require validated source claims.

## Specialist roster

### E-S1 — Child Learning Specialist

**Model:** Gemini 3.8 Flash  
**Scope:** Define observable learning outcomes, age-aware progression, inclusive interaction guidance, and a short learning-evidence rubric.  
**Primary files:** docs/education/learning-objectives.md, docs/education/learning-map.md, docs/education/age-and-accessibility-review.md

### E-S2 — Science Communication Specialist

**Model:** Claude Sonnet 5.5  
**Scope:** Translate approved claims into child-friendly explanations, tooltips, glossary entries, analogies, and feedback.  
**Primary files:** docs/education/science-copy.md, docs/education/glossary.md, docs/education/claim-to-copy-map.md

### E-S3 — Technical Documentation Specialist

**Model:** GPT-oss 120B  
**Scope:** Write README, developer setup, module guide, troubleshooting, known limitations, and judge-facing project explanation.  
**Primary files:** README.md, docs/developer-setup.md, docs/module-guide.md, docs/known-limitations.md

### E-S4 — Tutorial and UX Writer

**Model:** Gemini 4 Hydrogen  
**Scope:** Write first-launch tutorial, controls, minigame directions, alerts, mission prompts, and calm recovery/error copy.  
**Primary files:** docs/education/tutorial-script.md, docs/education/ui-copy-deck.md, docs/education/error-and-feedback-copy.md

## Required inputs

- Master project context and current task board.
- Current repository tree/commit if implementation is requested.
- Current integration contract and file ownership matrix.
- Validated science/source/asset information where relevant.
- Department dependency and acceptance criteria.

## Department deliverables

- `README.md, docs/education/** and in-game copy deck/glossary`

## Execution rules

1. Lead decomposes the work into tasks with unique IDs.
2. Every task has one writer, one reviewer, a priority, dependencies, path, acceptance criteria, and test evidence requirements.
3. Run specialists in parallel only when inputs and files are independent.
4. Specialist reports to lead through the handoff template.
5. Lead consolidates and approves one canonical artifact before cross-department handoff.
6. A shared API/source register/balance file has a single writer at a time.
7. Cross-department contract or scope changes are escalated; no unilateral interface changes.

## Acceptance standards

- Educational copy is accurate and age-aware.
- Instructions match real behavior.
- Every science statement has a claim ID.
- Documentation reproduces setup on a clean checkout.

## Verification

- Have unfamiliar reviewer follow instructions.
- Check text length/terminology.
- Trace science copy to claims.
- Run README setup steps cleanly.

## Escalation

Escalate when evidence is unavailable, file ownership conflicts, an API change affects another department, a blocker threatens the critical path, or a science statement/asset cannot be validated. Give A3 the impact, options, recommendation, and decision needed.
