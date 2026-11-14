# Junior Astronaut Mission Trainer — AI Agent Swarm System

A reusable, prompt-based operating package for coordinating a 31-role AI development organization for the NASA Space Apps Challenge 2026 project. **This repository is the agent deployment package only. It does not contain the game and does not launch any agents.**

## At a glance

- **31 individual prompt files:** 1 Chief Orchestrator, 6 Department Leads and 24 Specialists.
- **6 department configurations:** each lead coordinates exactly four specialists.
- **16 requested master/protocol/template documents** across master, protocol and template folders, plus deployment runbooks.
- **10 consolidated workstreams:** the original core-role responsibilities remain represented without creating extra agent instances.
- **Technology target:** Three.js, HTML5, CSS3, vanilla JavaScript ES modules, Vite and LocalStorage.
- **Primary controls:** single-writer ownership, frozen contracts, explicit handoffs, traceable science claims and evidence-based QA.

## Important role-count interpretation

The source specification names 15 department “core roles” but separately fixes the deployment count at 31 (one orchestrator + six leads + 24 specialists). To satisfy both constraints without silently changing the agent count, the six lead prompts carry the additional core-role function mandates. The registry records all 15 titles and maps them into ten workstreams W01–W10. The prompt files still contain exactly 31 deployable role identities; no extra hidden core-role agents are expected.

## Folder map

```text
agent-swarm-system/
├── README.md
├── GENERATION_MANIFEST.md
├── VALIDATION_REPORT.md
├── master/                 # project context, registry, chart, model matrix, activation, A3 prompt
├── departments/            # six configs, six lead prompts, 24 specialist prompts
├── protocols/              # eight operating and technical protocols
├── templates/              # daily report, handoff, final review
└── deployment/             # activation order, session setup, parallel plan, integration gates
```

## Recommended reading order
1. `master/MASTER_PROJECT_CONTEXT.md`
2. `master/MASTER_AGENT_REGISTRY.md` and `master/ORGANIZATION_CHART.md`
3. `master/MODEL_ASSIGNMENT_MATRIX.md` — model labels are project-provided and not independently verified.
4. `protocols/SWARM_OPERATING_PROTOCOL.md`
5. `protocols/FILE_OWNERSHIP_MATRIX.md` and `protocols/INTEGRATION_CONTRACTS.md`
6. `protocols/SCIENTIFIC_VALIDATION_POLICY.md` and `protocols/QA_AND_TESTING_STANDARD.md`
7. `master/AGENT_ACTIVATION_GUIDE.md` and the deployment runbooks
8. The specific department configuration and role prompt for each task

## How to use an agent prompt

1. Choose an exact Agent ID from the registry.
2. Open a separate AI conversation or invoke that role through a platform with confirmed sub-agent support.
3. Paste the full role prompt. Provide the current repository state, relevant master docs, and one bounded Task ID.
4. Specify exact output paths, owner/reviewer, dependencies, acceptance tests and whether file editing is permitted.
5. Require a handoff using `templates/AGENT_HANDOFF_TEMPLATE.md`.
6. The department lead reviews and consolidates. A3 coordinates cross-department work. The human owner retains final release authority.

**Do not infer that an agent is launched because a prompt file exists.** When no actual agent-launch capability exists, the human operator opens separate conversations and copies the handoffs between them. Do not describe sequential separate sessions as autonomous parallel execution.

## How to coordinate work

- Use one canonical task board. The lightweight schema is defined in `protocols/TASK_MANAGEMENT_SYSTEM.md`.
- Give each task one accountable owner and one reviewer.
- Parallelize only independent work with disjoint paths and frozen interfaces.
- Respect the ownership matrix; ask the owner for changes rather than overwriting their files.
- Keep the MVP small: one coherent playable mission loop, five core systems, mission events and exactly two minigames.
- Separate `REAL_SCIENTIFIC_FACT` from `SIMULATION_VALUE`; trace claims to the source register.
- Mark tests `NOT RUN` when they were not executed. Do not claim successful tests without evidence.

## Model allocation warning
The model names are exactly those supplied in the brief. Availability, tools, model versions, context windows, browsing, file access and autonomous agent launching may vary. Check the actual session. If a model is unavailable, record the substitute and why; do not silently change the matrix.

## Scope boundary
This package does not implement the game, generate game assets, access NASA sources, or launch agents. It defines roles, prompts, organization, ownership, communication, task flow, integration contracts and quality gates. The actual game repository is a separate project.

## Package integrity
See `GENERATION_MANIFEST.md` for the complete file list and generated status, and `VALIDATION_REPORT.md` for structural checks and the role-count interpretation.
