# Refinement implementation and verification

## Scope and baseline

15 November 2026. Existing uncommitted work was preserved. `.claude/agents/AGENTS.md` is empty. `checklist.pdf` was read completely and was not modified. The implementation follows its existing-project/vanilla Three.js alternative. The previous seven-day survival simulation remains supported, but explicitly starting a scenario enables the five-run campaign so its ending cannot be interrupted by the old timed victory.

The [audit and roadmap](../design/REFINEMENT_ROADMAP.md) records the architecture, gameplay, task, story, visual, asset and implementation plans before changes.

## Work completed

- Four original task mechanics: conductor rotation with live circuit tracing, filtration sequencing with click-swap and drag/drop, rover exploration with collision/battery/return planning, and observation-based sample classification. Thirteen training activities are accessible across the preserved nine campaign tasks and four new workshops.
- Greenhouse now requires planting, balancing conditions and harvesting. Solar calibration now has a real timer. Task environments use seeded randomness, and radio acknowledgments take the displayed 2.56-second simulated interval.
- Practice/abandonment is separate from completion. Abandoned tasks grant nothing; completed task results apply supplies, XP, best stars and discoveries. Duplicate callbacks, repeated strategy choices, unknown task results, non-finite scores and premature scenario completion are rejected.
- Shared task timer survives interaction rerenders. Pause blocks task input, freezes countdowns and delayed radio acknowledgments; retry clears task state. Keyboard focus returns to identified controls after task updates. The background HUD is inert during tasks/dialogue.
- Functional Base, Training Games, Missions, Learn and Collection navigation; commander profile, XP levels, stars, logbook and earned expedition patches. Buildings link directly to appropriate activities.
- Nova/Mission Control/crew dialogue introduces approach, inspection, a first repair, sustainability, storm preparation and the final run. Existing Three.js arrival and evacuation sequences remain the cinematic foundation.
- Five-run report includes crew/base condition, reserves, earned progress and character reactions. Completed Earth return persists across refreshes instead of replaying departure.
- Corrected the safety indicator direction, removed unsourced leak/solar fact arrays in favor of the existing fact register, labeled site data as simulated, and changed shielding percentages to training design points. Added a [source and asset register](../science/refinement-source-register.md) for new content.

## Files changed in this refinement

Existing files: `src/main.js`; `src/ui/ui.js`; `src/systems/{GameState,ResourceSystem,SaveSystem,CampaignSystem}.js`; `src/minigames/{minigameHost,minigameTemplate,leakHunter,solarAligner,greenhouseBalance,commsDelay,shieldBuilder,siteSelector}.js`.

New implementation: `src/data/trainingTasks.js`; `src/systems/ProgressionSystem.js`; `src/ui/missionDesk.js`; `src/styles/refinement.css`; `src/minigames/{workshopModels,circuitRepair,waterPurifier,roverExplorer,sampleAnalysis}.js`.

New verification/documentation: `tests/refinement.test.js`; `scripts/verify-workshops.mjs`; `scripts/verify-campaign.mjs`; this report; the refinement roadmap and science register. Other dirty files in the working tree predate this refinement.

## Verified evidence

| Check | Result |
| --- | --- |
| `npm test` | 32 tests passed: original 25 plus 7 regression tests. |
| `npm run build` | Production build succeeds. Existing large-bundle warning remains; bundle is about 913 kB minified / 243 kB gzip. |
| Production browser: four new workshops | Solved through actual UI controls; earned 220 XP, 12 stars and two discovery patches; workshop attempts did not increment campaign runs. |
| Task pause | Circuit countdown unchanged during a 1.2-second pause. |
| Persistence | XP and patches survived reload. |
| Mobile | Training browser checked at 390 × 844 with no horizontal document overflow. |
| Complete campaign | Fifteen task attempts across five complete scenario runs, including planting/harvest, actual radio waits, leak scanner and solar calibration; Earth-return report displayed. |
| Ending persistence | Reload reopened the report with five runs and `returnedToEarth: true`; no new departure triggered. |
| Browser runtime errors | None in workshop and complete-campaign runs. |

Browser tests used local Chrome, headless with SwiftShader, at 1440 × 900. This validates rendering/interaction correctness, not target-device GPU performance. Screenshots were inspected for the hub, circuit and mobile training screen and are available under `/private/tmp/astronaut-browser-qa/` during this session.

## Reproduce browser checks

Start the production preview on port 4173 (`npm run build`, then `npm run preview -- --host 127.0.0.1 --port 4173`). The optional scripts use Playwright and the local macOS Chrome executable. No browser-testing dependency was added to the game package. Install Playwright in a separate QA folder or supply its module via `PLAYWRIGHT_MODULE`.

Example with the session's QA install:

```sh
PLAYWRIGHT_MODULE=/private/tmp/astronaut-browser-qa/node_modules/playwright/index.mjs node scripts/verify-workshops.mjs
PLAYWRIGHT_MODULE=/private/tmp/astronaut-browser-qa/node_modules/playwright/index.mjs node scripts/verify-campaign.mjs
```

## Checklist status and incomplete release gates

Engineering checks covered sections 05–08 (module activities/input/UI), 09–16 (tasks, consequences, timers, five-run progression), 19 (state/save boundaries), 21 (feedback/reduced motion), 22–23 (simulation labeling/offline design), and 24 (regression/full-path verification). This is evidence for the tested items, not blanket sign-off for every item in those sections.

Still incomplete:

- Target-age child playtests, timer fairness at both bounds, physical touch-device checks, assistive-technology review, native-GPU frame/memory measurements and a long-session performance test.
- A dedicated 3D art/character animation pass, true facility interiors, unlockable additional structures and cosmetic customization beyond earned patches. Existing procedural models were preserved; no new NASA models were downloaded and no AAA-quality art completion is claimed.
- Dedicated background music/ambience and voice acting. Existing original synthesized feedback is reused; all new dialogue remains readable with audio muted.
- Full review of older science copy, all asset licenses, target deployment, clean-device rehearsal, fallback demonstration recording and team release sign-off.
- Dependency/asset bundle splitting remains a performance improvement. The preexisting `tests/simulation.test.js` has a trailing blank line reported by `git diff --check`; it was not changed by this refinement.

The project is a substantially expanded playable prototype. These outstanding requirements prevent claiming the entire master refinement or release checklist is complete.
