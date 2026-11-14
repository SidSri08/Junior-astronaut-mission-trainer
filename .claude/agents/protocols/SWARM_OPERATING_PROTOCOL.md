# Swarm Operating Protocol

## 1. Purpose and authority
This protocol defines how 31 named roles collaborate on one game repository. The human project owner retains final authority. A3 coordinates six department leads; each lead coordinates exactly four specialists. Specialists are departmental resources, not independent sub-swarms. No role may create additional agents or claim an agent has been launched without a confirmed platform action.

## 2. Core operating principles
- One task, one accountable owner, one primary output, one reviewer.
- One canonical file owner at a time. Reviewers comment or propose patches; they do not overwrite the owner's file.
- Freeze shared contracts before parallel implementation.
- Parallelize independent research, design and isolated modules; sequence shared-file edits and dependency-bound work.
- Evidence before status. A statement of confidence is not proof of completion.
- Prefer a small integrated feature over several disconnected feature branches.
- Protect the agreed MVP and timebox optional work.

## 3. Work intake and decomposition
A3 receives the goal and creates a Task ID. The relevant lead turns it into bounded tasks. Every task must include: objective, scope, output path, owner, reviewer, priority, dependencies, inputs, acceptance criteria, test/evidence requirement, target checkpoint and status. Tasks without a clear output or acceptance test are planning notes, not implementation tasks.

## 4. Department lead operating cycle
Each lead must:
1. Inspect the latest project and department state.
2. Split work into independently verifiable artifacts.
3. Assign tasks to the four specialists using exact IDs and owned paths.
4. Identify dependencies and decide whether tasks may run in parallel.
5. Publish assignment packets; in separate-session mode the human operator opens sessions.
6. Track progress, ask for evidence, and escalate blockers.
7. Review specialist deliverables against acceptance criteria.
8. Resolve conflicting recommendations or submit alternatives to A3.
9. Consolidate one departmental output and record decisions.
10. Report to A3 using the standard status format.

## 5. Parallel execution rules
Parallel work is allowed when all prerequisites exist, output paths are disjoint, and shared APIs are frozen. Research on separate science topics, independent test-case design, isolated scene assets, and tutorial copy can run concurrently. Do not parallelize edits to `src/main.js`, `src/systems/GameState.js`, central configuration, shared contracts or a single register. For those, use one writer and reviewers or serialize changes.

## 6. Conflict resolution
When two agents propose incompatible values, APIs, file structures or claims:
- Stop implementation of the disputed interface/claim.
- Record both proposals, evidence, downstream impact and time cost.
- The responsible lead recommends one or a minimal compatible alternative.
- A3 decides cross-department technical coordination; the human owner decides scope, schedule, high-risk trade-offs and public claims.
- Update the canonical decision log/contract and notify all affected owners before work resumes.

## 7. Consolidation and approval
A lead may approve a departmental artifact only after checking completeness, source/contract consistency, file ownership, tests, unresolved assumptions and reviewer comments. A3 accepts cross-department integration only after the applicable integration gate passes. QA retains independence and can recommend `NO-GO`; the human owner makes the release decision.

## 8. Change control
A change to stack, project structure, central state, data contract, required feature count, scientific claim, storage schema or MVP scope requires a written change record: change ID, reason, alternatives, owners affected, schedule/test impact, approval, effective version and migration steps. Emergency fixes still need an after-the-fact record.

## 9. Required evidence
Implementation: path, diff/commit, startup or test output. Research: claim ID, source record, exact support and caveat. Design: user flow and acceptance criteria. QA: environment, build identity, steps, expected/actual, evidence and verdict. Documentation: steps followed and verified source-of-truth. If no evidence exists, status is `IN PROGRESS`, `BLOCKED` or `NOT RUN`—never `DONE` or `PASS`.

## 10. Failure and escalation conditions
Escalate immediately for an unowned critical dependency, simultaneous writers, unverified high-impact science, API incompatibility, broken startup, data loss, serious child-safety/accessibility concern, or a blocker threatening the demo. Use the task management severity and blocker format. Record mitigation owner and next decision time/checkpoint.
