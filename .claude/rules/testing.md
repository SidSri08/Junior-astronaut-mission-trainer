---
paths: ["tests/**", "docs/qa/**"]
---
# Testing rules
- Simulation tests use Node's built-in runner (`node --test tests/`), no extra packages.
- Record evidence (command, output summary, date) in `docs/qa/`. Never report a test as passed unless it was run.
- Before declaring a milestone done: `npm test` passes, `npm run build` succeeds, the game loads with zero console errors.
- Severity: Critical (crash/unplayable), High (core system broken), Medium (wrong but playable), Low (cosmetic). Critical/High must be fixed before release.
- Fix authors do not self-certify; QA re-verifies.

