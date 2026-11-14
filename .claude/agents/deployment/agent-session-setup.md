# Agent Session Setup

## Session preparation checklist
- [ ] Select the exact role prompt by Agent ID; do not paste a prompt for a different role.
- [ ] Use the assigned model if available; record any substitution.
- [ ] Confirm actual tool permissions: file read/write, terminal, browser, image/asset access, sub-agent launching.
- [ ] Provide `MASTER_PROJECT_CONTEXT.md` and the relevant registry/department/protocol documents.
- [ ] Provide the actual game repository path, branch, working-tree status and current folder tree if tools are available.
- [ ] Provide a single Task ID, priority, scope, dependencies, output paths, reviewer and acceptance criteria.
- [ ] State whether the session may edit files or must return patch/proposed content only.
- [ ] State current integration-contract version and relevant source/asset claim IDs.
- [ ] Provide the latest task-board row and handoff, not stale context alone.

## Recommended first message after role prompt

```text
You are activated for Task [TASK-ID]. First confirm your Agent ID, role, assigned model label, available tools, repository/branch visibility and current contract version. Do not edit files until you have inspected the existing tree and confirmed the paths are within your ownership. Then restate the task, dependencies, output paths and acceptance criteria. If any prerequisite is missing, report a blocker or explicit assumption. Do not claim that you launched any other agent.
```

## Safe repository behavior
- Inspect before editing. Preserve user changes and unrelated files.
- Do not run destructive commands, reset a branch, overwrite unowned files, or install a new dependency without approval.
- Make the smallest scoped change. Report exact paths modified.
- Do not edit shared contract/state/bootstrap files unless you are the named owner or have a recorded reassignment.
- Prefer a small commit/diff per task. Do not commit secrets, API keys, large generated assets or `node_modules`.
- Run only commands appropriate to the verified environment; report exact command and result.

## If there is no file access
Return one of: a patch/diff, complete file contents for the specifically assigned path, a decision memo, test plan or research report. Mark `FILES NOT MODIFIED IN REPOSITORY`. The human operator applies it and returns the resulting version for review.

## If there is no browser or research access
Do not fabricate sources, screenshots or current data. Produce a search plan and list unresolved claims; mark science validation as incomplete. Do not treat model knowledge as a cited NASA source.

## If there is no sub-agent support
Use separate human-opened sessions. The lead must return individual assignment packets for each specialist. Keep one human-managed task board and use the handoff template to move outputs. Do not describe sequential prompt reuse as parallel autonomous execution.
