# Gameplay refinement audit and roadmap

## Baseline — 15 November 2026

The working tree already contains substantial development. Preserve it. AGENTS.md is empty; the 31-page checklist is the quality gate. The reference image guides a colorful lunar game HUD, not a static background. The existing vanilla Vite + direct Three.js architecture matches the checklist's zero-React alternative; no framework migration is planned.

Baseline: 25 Node tests pass; production build passes with a large-bundle warning. Existing systems include six selectable modules, nine campaign challenges, deterministic simulation, saves, synthesized audio, accessibility settings, arrival and evacuation cinematics. Procedural scene assets need artistic review, not wholesale replacement.

## Assessment and controlled milestones

1. Gameplay foundation: reject premature scenario completion, duplicate rewards, invalid task results and repeated strategies; distinguish abandonment from results; retain the legacy seven-day survival mode while making campaign mode explicit. Test all boundaries before presentation work.
2. Task overhaul: preserve the existing spatial scanner, solar calibration, allocation, layout and shielding mechanics. Add distinct circuit rotation, filtration sequencing, rover route exploration and sample inspection activities. Each needs practice, pause, reset, timeout, debrief, real resource effects and retry.
3. Story: Nova and Mission Control introduce the mission before arrival, then guide inspection, first fault, sustainability, storm preparation and Earth return. Short dialogue beats and clear next actions take priority over long exposition.
4. Progression/UI: earned XP, levels, stars and collection entries from verified task outcomes; functional Base, Training, Missions, Learn and Collection destinations. Preserve the six-module focus controller and color-coded HUD. Display simulation labels and objective progress.
5. Animation/assets/audio: reuse the continuous Three.js runtime, astronaut deployment, rover and module models; use task-specific SVG machinery and route feedback. Reuse original synthesized sounds and reduced-motion settings. New NASA assets require source/license checks before download or attribution.
6. QA: test complete campaign, abandonment, duplicate callbacks, reset, saves, pause and fair timers; build production; exercise browser interactions at desktop and narrow widths. Record actual evidence and outstanding art/playtest/release gates.

## Checklist mapping and release boundaries

- Sections 09–19: state transitions, three scenarios, five completed runs, task lifecycle, seeded variation and persistence are core engineering gates.
- Sections 05–08 and 21: functional module interactions, child-readable controls, input access, purposeful motion and feedback.
- Sections 22–23: no invented NASA numbers; training scores, timing, site telemetry and shielding are simulation values. Offline by default.
- Sections 20, 24–27: production/browser evidence, target-device performance, child playtests, source review and team/demo sign-off remain separate gates. Passing unit tests does not satisfy these human reviews.

This document records progress, not release approval. The full checklist remains unchanged.
