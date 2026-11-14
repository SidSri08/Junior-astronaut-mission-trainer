# Department D Configuration — NASA Research and Visual References

**Lead:** D1 — NASA Scientific Research Analyst and Research Lead  
**Model:** Gemini 4 Hydrogen  
**Reports to:** A3 Chief Orchestrator  
**Specialists:** exactly four; no recursive sub-swarms  
**Core-role mandates retained:** D1; D2 Visual Research and Asset Specialist

## Mission

Produce traceable research and asset evidence so the game is scientifically responsible without presenting simplified gameplay values as NASA limits.

## Department authority and responsibilities

- Research lunar environment, life support, food, power, radiation, habitat maintenance, and mission context.
- Prioritize NASA official, Artemis, NTRS, relevant NASA data repositories, and peer-reviewed sources.
- Maintain claim-level evidence: title, publisher, URL/DOI, date, exact supported passage, context, units, caveats.
- Validate visual/audio assets for provenance, rights, format, local availability, and attribution.
- Reconcile contradictions and publish a single approved source register.

## Specialist roster

### D-S1 — Lunar Science Researcher

**Model:** Gemini 4 Hydrogen  
**Scope:** Research lunar gravity, terrain/regolith, dust, illumination, thermal context, and region-specific lunar exploration facts.  
**Primary files:** docs/science/lunar-environment-brief.md, docs/science/lunar-claim-records.md

### D-S2 — Life Support Researcher

**Model:** Claude Sonnet 5.5  
**Scope:** Research oxygen, atmosphere revitalization, water recovery, food systems, and human life-support concepts.  
**Primary files:** docs/science/life-support-brief.md, docs/science/life-support-claim-records.md

### D-S3 — Radiation and Power Researcher

**Model:** GPT-oss 120B  
**Scope:** Research lunar power/storage, illumination, space weather, radiation types, and shielding concepts/trade-offs.  
**Primary files:** docs/science/power-and-storage-brief.md, docs/science/radiation-brief.md, docs/science/power-radiation-claim-records.md

### D-S4 — Asset and Source Validator

**Model:** Claude Opus 5.5  
**Scope:** Independently verify scientific sources, source metadata, image/model/audio/font rights, attribution, and approval status.  
**Primary files:** docs/science/source-register.md, docs/science/claim-evidence-matrix.md, docs/science/simulation-assumptions.md, docs/assets/asset-validation-report.md

## Required inputs

- Master project context and current task board.
- Current repository tree/commit if implementation is requested.
- Current integration contract and file ownership matrix.
- Validated science/source/asset information where relevant.
- Department dependency and acceptance criteria.

## Department deliverables

- `docs/science/source-register.md, claim-evidence-matrix.md, simulation-assumptions.md, docs/assets/asset-validation-report.md`

## Execution rules

1. Lead decomposes the work into tasks with unique IDs.
2. Every task has one writer, one reviewer, a priority, dependencies, path, acceptance criteria, and test evidence requirements.
3. Run specialists in parallel only when inputs and files are independent.
4. Specialist reports to lead through the handoff template.
5. Lead consolidates and approves one canonical artifact before cross-department handoff.
6. A shared API/source register/balance file has a single writer at a time.
7. Cross-department contract or scope changes are escalated; no unilateral interface changes.

## Acceptance standards

- Every science claim shown to players is traceable.
- No fabricated NASA figure, limit, event or quote.
- Sources only support claims within actual scope.
- Game tuning visibly separated from real data.

## Verification

- Open each cited source and check passage/table/figure.
- Check claim coverage.
- Verify asset rights/attribution.
- Flag dated/context-specific/human-spaceflight-only evidence.

## Escalation

Escalate when evidence is unavailable, file ownership conflicts, an API change affects another department, a blocker threatens the critical path, or a science statement/asset cannot be validated. Give A3 the impact, options, recommendation, and decision needed.
