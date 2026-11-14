# Agent Activation Guide

## Before activation
1. The human owner creates or selects the game repository and confirms the canonical branch.
2. Place this `agent-swarm-system` package beside the game repository or make it available read-only to all sessions.
3. Read `MASTER_PROJECT_CONTEXT.md`, `MASTER_AGENT_REGISTRY.md`, `MODEL_ASSIGNMENT_MATRIX.md`, `ORGANIZATION_CHART.md`, `SWARM_OPERATING_PROTOCOL.md`, `FILE_OWNERSHIP_MATRIX.md` and `INTEGRATION_CONTRACTS.md`.
4. Verify model availability, tool permissions, current repo path, branch, clean/dirty status, package manager and browser target. Do not assume a model can start sub-agents.
5. Appoint the human owner as final decision-maker and A3 as coordinator.

## Deployment modes

### Mode 1 — Actual sub-agent platform
Only use if the platform exposes a real agent-launch operation and confirms its invocation. Launch A3 first. A3 may then launch the six leads if authorized. Each lead may assign its four specialists through the supported mechanism. Do not create nested swarms beyond the stated hierarchy. Record returned agent/session identifiers in the task board. A prompt file alone does not launch an agent.

### Mode 2 — Separate AI conversations (portable default)
Open one conversation per role as needed. Paste that role's prompt in full, then provide current task assignment, relevant master docs, exact repository context and handoff template. Keep a human-managed task board. Start with A3, then open six lead sessions, then open specialists only when their prerequisites are ready. Copy deliverables back into the repository yourself unless that session has verified file access.

### Mode 3 — One model/session simulating coordination
Use only as a planning mode. The model may draft specialist assignment packets and review artifacts, but must label simulated delegation as simulated. It must not claim parallel execution or file changes that did not happen.

## Activation sequence
1. A3: repository/context inventory, risk map, task board and readiness request.
2. A1: architecture decisions and gameplay loop; D1: research plan and source register; parallelize only their independent planning artifacts.
3. A3 freezes module map, ownership and integration contract version with human approval.
4. B1, C1 and E1 leads plan implementation/documentation tasks; F1 defines tests against accepted criteria.
5. Specialists work only on assigned paths and declared interfaces. Leads review before A3 integration acceptance.
6. A3 runs integration gates; F1 reports independent QA evidence; human owner accepts scope and demo release.

## Required start packet per session
- Role-specific prompt file.
- `MASTER_PROJECT_CONTEXT.md`.
- Relevant department config and current contracts.
- One Task ID, owner, reviewer, priority, dependencies, output paths and acceptance criteria.
- Current task board row and last accepted handoff.
- Repository path/branch and exact allowed file scope if the session has tools.

## Evidence and honesty
A role may claim work only with evidence: file path and content summary, commit/hash when available, command and output for tests, URL/claim ID for research, or exact review findings. If it cannot access the repository, it should return patch content or a proposed change—not claim it edited files. If it cannot run tests, report `NOT RUN`, not `PASS`.
