# Communication Protocol

## Channels and reporting path
The default reporting path is Specialist → Department Lead → A3 → Human Project Owner. Cross-department requests route through the requesting agent's lead to A3, who identifies the receiving lead. Specialists may communicate directly only to clarify a declared interface or review request, and must copy the lead on the result. Direct discussion does not authorize a scope or contract change.

## Message types
Use a clear prefix in session messages or task-board updates:
- `[ASSIGNMENT]` new bounded task with owner, reviewer, output path and acceptance criteria.
- `[STATUS]` progress update with evidence and next step.
- `[HANDOFF]` completed artifact ready for review.
- `[BLOCKER]` dependency or missing decision preventing work.
- `[DECISION]` approved choice with authority and version.
- `[CONTRACT-CHANGE]` proposed interface or schema modification; no implementation until approved.
- `[DEFECT]` reproducible problem with severity and reproduction.
- `[RISK]` uncertainty with probability/impact and mitigation owner.

## Message structure
Keep messages concise but complete: Task ID; sender/recipient; status; context; exact artifact or interface; decision/request; evidence; deadline/checkpoint. Link to paths relative to the game repository. Avoid ambiguous phrases such as “the latest file” or “I fixed it” without path/version.

## Handoff expectations
A handoff must use `templates/AGENT_HANDOFF_TEMPLATE.md`. Include all files created/modified, paths, assumptions, incomplete work, known defects, integration instructions, tests actually run and those not run, reviewer request and rollback note. Attach patch/diff or exact replacement content when the recipient cannot access the same repository.

## Reporting cadence
- Specialists report at task completion, at a blocker, and at the department checkpoint.
- Leads provide an integrated status at each agreed development checkpoint and immediately after a critical blocker or contract change.
- A3 maintains the cross-department view and sends a daily progress report to the human owner.
- The human owner confirms strategic decisions and release approval.

## Status vocabulary
Use only: `NOT STARTED`, `READY`, `IN PROGRESS`, `BLOCKED`, `IN REVIEW`, `CHANGES REQUESTED`, `DONE`, `ACCEPTED`, `NOT RUN`, `DEFERRED`, `CANCELLED`. `DONE` means owner reports artifact complete; `ACCEPTED` means reviewer/lead verified acceptance. Test verdicts are separate: `PASS`, `FAIL`, `NOT RUN`, `BLOCKED`.

## Disagreement etiquette
Separate facts, assumptions, preferences and risks. Cite source IDs for science, paths/lines for code, and acceptance criteria for quality. Do not silently edit another owner's work or treat model output as authority. Escalate unresolved disagreements with options and impact rather than repeating arguments.
