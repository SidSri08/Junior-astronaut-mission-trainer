# QA and Testing Standard

## QA independence
F1 owns the QA plan, bug log and release recommendation. Specialists F-S1–F-S4 produce distinct functional, code, performance and stress evidence. QA may identify and request fixes but must not silently rewrite source files owned by implementation agents. Source owners fix; QA retests.

## Test categories
1. **Startup / smoke:** clean Vite startup, expected page, Three.js canvas, no critical console/network errors, graceful optional asset fallback.
2. **Functional:** start/reset mission, all five core system actions/indicators, mission events, alerts, outcomes and recovery.
3. **Minigames:** exactly two; verify instructions, start, play, completion, cancel/exit, result validation and no duplicate reward.
4. **State / simulation:** bounds, deterministic ticks, trade-offs, invalid actions, event one-time effect, pause/reset behavior and state invariants.
5. **Persistence:** save/load, schema version, malformed JSON, missing storage, unavailable/quota behavior, reset and migration/defer status.
6. **Integration:** imports/exports, action payloads, subscription cleanup, lifecycle, app start/stop, UI/scene snapshot sync.
7. **Content/science:** claim IDs, source support, simulation value labels, caveats, child-friendly text and no unapproved NASA claims.
8. **Accessibility/usability:** readable font/contrast, not color-only states, keyboard operation where relevant, focus states, clear instructions, error/recovery copy.
9. **Responsive/browser:** target desktop/laptop browser sizes, canvas resize, overlay layout, supported browser version and fallback behavior.
10. **Performance/stability:** actual measured startup/render behavior on recorded device/browser, no runaway listeners/timers, avoid large assets and unnecessary per-frame allocation.
11. **Regression:** re-run affected tests after any fix to shared state, contracts, startup, event logic, persistence or UI dispatch.

## Severity definitions
- **Critical / S0:** app will not start, core gameplay unusable, data corruption/loss, severe safety/content misinformation, or release demo cannot proceed. Blocks release.
- **High / S1:** core required mechanic/minigame broken, major integration defect, persistent crash, severe UI blocker or materially misleading science. Blocks acceptance unless formally descoped by human owner.
- **Medium / S2:** important but recoverable defect, intermittent behavior, significant usability issue, or feature works with limitation. Must be documented with workaround/decision.
- **Low / S3:** cosmetic inconsistency, minor copy issue, edge case with low impact. May be deferred with owner approval.

## Defect record
Every bug: ID, severity, title, build/commit, browser/device, preconditions, exact reproduction steps, expected result, actual result, evidence, suspected area (not assumed root cause), owner, status, fix commit, retest result and release impact.

## Test execution record
For each case, record environment, build/commit, setup, steps, expected result, actual result, verdict (`PASS`, `FAIL`, `NOT RUN`, `BLOCKED`), evidence path and defect ID. A test marked `PASS` must have actually been run. Tests that are impossible to run remain `NOT RUN` or `BLOCKED`.

## Acceptance thresholds
- No open Critical/S0 defect.
- No open High/S1 defect on a required MVP flow unless the human owner formally accepts a documented risk and demo limitation.
- App can start from documented clean setup.
- Five core systems visibly connect to actual shared gameplay state.
- Mission event consequence is verified and not duplicated.
- Both minigames work through completion and exit paths.
- Central state/persistence behavior has been tested or explicitly descoped.
- No material unsourced science claim is presented as fact.
- Demo path has been rehearsed on the target browser/device.

## Performance evidence
Do not invent frame-rate, load-time or memory figures. Record device, OS, browser/version, viewport, scene conditions, measurement method, sample duration and observed result. Set realistic targets only after a baseline is measured. A stable, simple scene is preferable to chasing unverified FPS values.

## Release status
F1 reports `GO`, `CONDITIONAL GO` or `NO-GO`, with defects, not-run tests, assumptions and evidence. A3 consolidates. Only the human owner can approve the competition/demo release. No agent may call the prototype “production-ready” or NASA-certified.
