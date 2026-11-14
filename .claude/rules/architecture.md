---
paths: ["src/**/*.js", "index.html"]
---
# Architecture rules
- Contracts in `docs/architecture/ARCHITECTURE.md` are frozen. Do not rename exports, building IDs, action types, or snapshot fields without an A3 decision record.
- Single writer per file (see ARCHITECTURE.md §8). To change another owner's file, request it from the owner.
- `src/systems/**` and `src/data/**` must not import DOM APIs or Three.js (keeps them testable in Node).
- `src/ui/**` and `src/scene/**` never mutate state; they call `store.dispatch({ type, ...payload })`.
- No new dependencies; Three.js addons come from `three/examples/jsm/...`.
- Prefer procedural geometry; dispose geometries/materials on destroy.

