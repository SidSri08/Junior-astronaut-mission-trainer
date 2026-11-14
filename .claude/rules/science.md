---
paths: ["src/data/**", "docs/science/**", "docs/education/**", "src/ui/**"]
---
# Science rules
- Two labels only: `REAL_SCIENTIFIC_FACT` (has source ID, caveat) and `SIMULATION_VALUE` (game tuning, not a NASA number).
- Preferred sources: NASA (Artemis, science.nasa.gov, NTRS), ESA/JAXA official, peer-reviewed papers. Record title, publisher, URL, access date.
- Never invent statistics. If unsure, omit the number or soften ("scientists think…").
- Never imply game mechanics (0–100 bars, compressed day/night, minigames) are real NASA operations.
- Player-facing facts must come from `src/data/scienceFacts.js` and be child-readable (ages 7–12, short sentences).

