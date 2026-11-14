# Final Project Review Checklist

Mark each item `PASS`, `FAIL`, `NOT RUN`, `NOT APPLICABLE` or `DEFERRED` and add evidence/path/owner. Do not mark a checklist item PASS based on intention.

## A. Engineering and architecture
- [ ] Vite project starts from documented clean setup.
- [ ] Stack matches Three.js + HTML5/CSS3 + vanilla JS modules + Vite; no unapproved framework/backend.
- [ ] One canonical GameState instance and documented module boundaries exist.
- [ ] Rendering is separate from simulation update; no gameplay mutation in render loop.
- [ ] Imports/exports and lifecycle cleanup are verified.
- [ ] Shared interfaces match `INTEGRATION_CONTRACTS.md` and have no competing versions.
- [ ] LocalStorage, if included, has one owner, schema version and malformed-data handling.
- [ ] Browser console has no known critical error on demo path.

## B. Gameplay
- [ ] Mission start, meaningful player actions, consequences and outcomes work.
- [ ] Oxygen/life support, power, food, radiation protection and habitat maintenance use shared state.
- [ ] Resource trade-offs are observable and understandable.
- [ ] Mission event appears at the intended phase and its effects apply once.
- [ ] Exactly two educational minigames are playable.
- [ ] Both minigames support start, completion and exit/cancel behavior.
- [ ] Reset/recovery flow is understandable and reproducible.
- [ ] No required gameplay feature is merely a decorative mock control.

## C. Science
- [ ] Every material scientific claim has a claim ID and traceable source.
- [ ] Source title, publisher, URL/report ID, date/access date and supporting section are recorded.
- [ ] `REAL_SCIENTIFIC_FACT` and `SIMULATION_VALUE` are clearly distinguished.
- [ ] No fabricated NASA statistics, thresholds or attribution remain.
- [ ] Topic caveats are preserved for lunar environment, life support, power, radiation and food.
- [ ] Asset provenance/license/attribution has been checked per asset.
- [ ] The project does not claim NASA endorsement, certification or operational capability.

## D. Education and UX
- [ ] Target age 7–12 is reflected in instructions, vocabulary and text density.
- [ ] Every required learning objective maps to a real game action or feedback moment.
- [ ] Tutorials match actual controls and current UI.
- [ ] Status is not communicated by color alone.
- [ ] Main controls have clear labels and feedback; keyboard focus is visible where relevant.
- [ ] Error and failure copy supports recovery rather than blaming the player.

## E. Visual and performance
- [ ] Three.js lunar setting and outpost are recognizable.
- [ ] HUD is HTML/CSS, readable and layered correctly over the scene.
- [ ] Layout survives representative browser resizing.
- [ ] Asset files are local or have robust fallbacks; no fragile remote-only dependency.
- [ ] Performance statements are measured and include environment/method.
- [ ] No obvious runaway animation, event listener or timer behavior remains.

## F. QA evidence
- [ ] Functional, integration, state-boundary, minigame and regression cases were executed.
- [ ] All Critical/S0 defects are closed.
- [ ] High/S1 defects are closed or formally accepted by the human owner with limitation stated.
- [ ] Not-run and blocked tests are disclosed.
- [ ] Fixes to shared contracts/state/bootstrap have regression evidence.
- [ ] F1 has produced GO / CONDITIONAL GO / NO-GO recommendation.

## G. Documentation and presentation
- [ ] README setup works from a clean checkout.
- [ ] Controls, learning goals and known limitations are accurate.
- [ ] Demo sequence can be repeated without hidden setup.
- [ ] Presentation claims are traceable to implemented features and evidence.
- [ ] Screenshots/video are from the actual build and not misleading mockups.
- [ ] Human owner has approved final scope and remaining risks.

## Final decision
**QA recommendation:** [GO / CONDITIONAL GO / NO-GO]  
**Human release decision:** [APPROVED / NOT APPROVED]  
**Accepted risks / limitations:** [list]  
**Build identity:** [commit/tag/date]  
**Evidence location:** [folder/link]
