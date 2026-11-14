# Integration Gates

## Gate I0 — Baseline
**Owner:** A3 with human operator  
**Checks:** repository exists; branch and working tree known; existing startup/build behavior recorded; no user work overwritten; stack/structure confirmed.  
**Evidence:** repository inventory, baseline command/output, risk list.  
**Stop condition:** no repository access or unresolved destructive-change risk.

## Gate I1 — Architecture freeze
**Owner:** A1; coordination by A3  
**Checks:** approved module map, central state model, import direction, simulation/render separation, event/minigame/save APIs, exactly two minigames, one file owner per critical path.  
**Evidence:** versioned architecture/integration contract and decision record.  
**Stop condition:** incompatible public APIs or competing state ownership.

## Gate I2 — Research and content freeze
**Owner:** D1  
**Checks:** claim IDs, source traceability, caveats, gameplay-value labels, asset rights/attribution, child-facing content review.  
**Evidence:** source register, claim matrix, asset register/validation report.  
**Stop condition:** unverified material claim presented as fact or unknown asset license for a required redistributable asset.

## Gate I3 — Vertical slice
**Owner:** C1 and B1; coordinated by A3  
**Checks:** browser starts, scene/UI show one canonical state, one action causes a visible state result, no critical console error.  
**Evidence:** build/commit, exact interaction steps, test log.  
**Stop condition:** decorative-only controls, duplicate state or rendering-driven gameplay mutation.

## Gate I4 — Feature integration
**Owner:** A3; departments B/C  
**Checks:** all five system indicators/actions, mission event with one-time consequence, exactly two minigames, coherent recovery/outcome, asset fallback, persistence only if in scope.  
**Evidence:** end-to-end test cases, interface compatibility, handoffs.  
**Stop condition:** broken required feature, unowned interface, or unresolved shared-file conflict.

## Gate I5 — QA acceptance
**Owner:** F1  
**Checks:** functional/integration/stress/performance/content/accessibility/regression evidence; no open S0; S1 status resolved or formally risk-accepted; all not-run tests disclosed.  
**Evidence:** test execution log, defect register, review reports and QA recommendation.  
**Stop condition:** concealed failure, fabricated PASS, material science misinformation or critical defect.

## Gate I6 — Demo readiness
**Owner:** A3 recommendation; human owner approval  
**Checks:** clean setup, short reproducible demo path, accurate claims, readable UI, known limitations, backup plan and current build identity.  
**Evidence:** completed review checklist and rehearsed demo notes.  
**Stop condition:** demo cannot be reliably reproduced or presentation overstates implemented behavior.

## Final decision states
- `PASS`: gate evidence satisfies all required checks.
- `CONDITIONAL`: a documented low/medium risk or agreed limitation remains; human approval required.
- `FAIL`: stop and remediate before proceeding.
- `NOT RUN`: no evidence; it is not a pass.
