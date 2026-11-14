# Task Management System

## Task record schema
Every tracked task must have:

| Field | Required content |
|---|---|
| Task ID | Stable unique ID, e.g. `C1-RES-003` |
| Title / objective | Verb-led, observable outcome |
| Department / owner | One accountable agent ID |
| Reviewer | One named reviewer or lead |
| Priority | P0–P3 |
| Status | Approved status vocabulary |
| Dependencies | Task IDs / contract version / input path |
| Output paths | Exact files or deliverable paths |
| Acceptance criteria | Observable pass conditions |
| Evidence | Commit/diff, command output, source IDs, screenshots or test log |
| Checkpoint | Human-agreed checkpoint or milestone |
| Risk / blocker | Impact, mitigation owner, decision needed |

## Priority definitions
- **P0 — Critical:** app cannot start, core state/data integrity broken, unsafe or materially false science claim, release-blocking regression, or task directly on critical path. Interrupt other work and escalate to A3.
- **P1 — High:** required MVP feature, contract, core learning flow, integration blocker or acceptance test. Complete before optional polish.
- **P2 — Normal:** meaningful quality improvement or supporting documentation needed for reliable demo.
- **P3 — Optional:** stretch polish, low-risk enhancement or post-MVP idea. Do not displace P0/P1 work.

## Status transitions
`NOT STARTED → READY → IN PROGRESS → IN REVIEW → ACCEPTED`. Any active task may move to `BLOCKED`, `CHANGES REQUESTED`, `DEFERRED` or `CANCELLED` with a reason. `DONE` is owner completion, not acceptance. `NOT RUN` applies to a test or check that has not been executed. A task may not be `ACCEPTED` while required tests are `FAIL`, `NOT RUN` or `BLOCKED`, unless a named authority explicitly records a risk acceptance and scope limitation.

## Definition of Ready
A task is READY only when it has one owner, output paths, inputs, dependencies, frozen interface if relevant, acceptance criteria, reviewer and an appropriately small scope. If not, keep it in `NOT STARTED` or mark `BLOCKED` on missing definition.

## Definition of Done
- All expected outputs exist and are non-empty.
- Deliverables match the task's exact scope and ownership rules.
- Assumptions and limitations are documented.
- Applicable tests/checks are run with evidence; unrun tests are explicit.
- No known critical defect is concealed.
- Handoff is complete and reviewer has been requested.

## Definition of Accepted
The reviewer verifies the artifact against acceptance criteria, checks evidence and compatibility with current contracts, confirms any required downstream consumer can use it, and records `ACCEPTED` or `CHANGES REQUESTED` with findings.

## Dependency management
Represent dependencies as task IDs and identify hard blockers vs soft sequencing preferences. A task cannot begin implementation while a hard dependency is incomplete. A3 maintains critical-path dependencies. If a dependency misses its checkpoint, lead proposes a scope-safe alternative or a replan; never fabricate completion.

## Scope control
Keep one prioritized MVP backlog and a separate P3/stretch list. Every new task must either satisfy a requirement, reduce a material risk, or be explicitly accepted as optional. Features that add backend, real-time APIs, accounts, complex physics or new minigames require formal change control.

## Suggested lightweight tracker
A Markdown task board or spreadsheet is sufficient. Do not add a project-management dependency. Suggested columns: `ID | Task | Owner | Reviewer | Priority | Status | Depends on | Output | Acceptance | Evidence | Blocker`.
