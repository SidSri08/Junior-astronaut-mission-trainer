# Parallel Execution Plan

## Principles
Parallelism is conditional, not a target. Work is parallel only when dependencies are ready, paths do not overlap and contracts are stable. A three-person beginner development team has limited integration capacity; keep the number of simultaneous implementation streams small enough to review and merge.

## Recommended waves

| Wave | Parallel work | Required prerequisite | Integration rule |
|---|---|---|---|
| 0 — Inventory | A3 repository inventory; F1 initial risk/test outline | Human confirms repo access | No code edits. |
| 1 — Design | A-S1 architecture; A-S2 game loop; D-S1/D-S2/D-S3 research by topic | Shared project context | Distinct docs; A-S3 checks API implications. |
| 2 — Contracts | A-S3 integration contracts; A-S4 audit; D-S4 source/claim consolidation | Wave 1 drafts available | A1/D1 consolidate; human/A3 approve contract version. |
| 3 — Isolated implementation | B-S1 scene; B-S2 assets; B-S3 UI shell; C-S1 simulation core; C-S4 balance data | Frozen interface and file ownership | Disjoint paths only; config contract shared but one writer. |
| 4 — Dependent implementation | C-S2 events; C-S3 minigames; B-S4 app bootstrap; E-S4 tutorial copy | State/action/lifecycle contracts; stable controls | Integrate in controlled order; avoid simultaneous changes to main bootstrap. |
| 5 — Validation/documentation | F-S1 functional tests; F-S2 code audit; F-S3 performance; F-S4 stress tests; E-S3 README | Integrated candidate build | QA reports are separate; code owners fix. |
| 6 — Consolidation | Department leads; A3 integration and release review | Handoffs and QA evidence complete | Human owner makes final decision. |

## Integration sequence for shared code
1. C-S1 lands and documents GameState/action/snapshot API.
2. A-S3 verifies interface and version; B-S3 and B-S1 implement against it.
3. C-S2 and C-S3 implement event/minigame clients against approved APIs.
4. B-S4 composes and starts the modules; one owner edits bootstrap.
5. F-S1 verifies vertical slice; F-S2 audits the changed interfaces.
6. C-S4 balance changes go through a single config owner; D-S4 validates any science-linked values.

## Concurrency limits and anti-patterns
- Avoid all 31 sessions active at once. The role count is an organization map, not a concurrency requirement.
- Do not let multiple models independently generate `main.js`, `GameState.js`, mission event data or the same source register.
- Do not merge incompatible architecture proposals before A1/A3 decision.
- Do not hand UI copy to E-S4 before controls/mechanics stabilize, except clearly marked provisional drafts.
- Do not ask QA to author fixes in code-owned paths.
- Do not parallelize work whose only shared artifact is an unapproved contract.

## Human integration checkpoint
After each wave, the human operator should collect handoffs, confirm files exist, run the relevant command/test, update task status, and provide the resulting repository state to the next sessions. A3's synthesis is not a substitute for checking the actual integrated build.
