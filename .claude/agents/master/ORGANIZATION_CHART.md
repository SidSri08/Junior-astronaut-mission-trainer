# Organization Chart

```mermaid
flowchart TB
  H[Human Project Owner] --> A3[A3 Chief Orchestrator\nOrchestrator Argon]
  A3 --> A[A1 Architecture and Game Direction\nClaude Opus 5.5]
  A3 --> B[B1 3D Environment and Frontend\nGemini 4 Argon]
  A3 --> C[C1 Gameplay and Simulation\nClaude Sonnet 5.5]
  A3 --> D[D1 NASA Research and Visual References\nGemini 4 Hydrogen]
  A3 --> E[E1 Education and Documentation\nGemini 3.8 Flash]
  A3 --> F[F1 Quality Assurance\nGPT-oss 120B]
  A --> AS[A-S1 to A-S4\n4 specialists]
  B --> BS[B-S1 to B-S4\n4 specialists]
  C --> CS[C-S1 to C-S4\n4 specialists]
  D --> DS[D-S1 to D-S4\n4 specialists]
  E --> ES[E-S1 to E-S4\n4 specialists]
  F --> FS[F-S1 to F-S4\n4 specialists]
```

## Operating interpretation
The chart has 31 role identities: one orchestrator, six leads and 24 specialists. The bracketed specialist nodes are shorthand for the four individually named roles in the registry; every specialist has its own prompt file. Leads coordinate their four specialists directly. The Chief Orchestrator coordinates the leads. There is no recursive swarm hierarchy. In a platform without sub-agent launch support, each role runs in a separate human-opened session using its prompt and handoff packet.
