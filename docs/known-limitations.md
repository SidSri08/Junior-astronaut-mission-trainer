# Known Limitations & MVP Scope

**Owner:** Department E (E-S3 Technical Documentation)  
**Status:** MVP v1 (NASA Space Apps Challenge 2026)

---

## 1. Intentional MVP Scope Boundaries

To deliver a fast, reliable, zero-setup educational experience for ages 7–12 that runs entirely inside a browser tab, the following features are intentionally out of scope for this MVP:

- **Single-Player Local Session Only:** All mission progress is stored locally in the browser's `localStorage` (`jamt.save.v1`). There is no user login, cloud sync, or multi-player classroom leaderboard.
- **Single Outpost Layout:** The 5 interactive modules (`habitat`, `lifeSupport`, `solar`, `greenhouse`, `lab`) plus the cargo lander and crater rover are placed at fixed coordinates around the lunar South Pole pad (`src/scene/buildings.js`) rather than free-form city-builder placement.
- **No Audio Synthesis Required:** All alerts, ultrasonic leak detector readings (`COLD → WARM → HOT → PINPOINT`), and event warnings are communicated visually via color-coded HUD banners, 3D warning beacons, and particle effects so the game works silently in classrooms and judging halls without headphones.

---

## 2. Scientific & Simulation Simplifications (`SIMULATION_VALUE`)

While every fact in `src/data/scienceFacts.js` is grounded in NASA documentation (`REAL_SCIENTIFIC_FACT`), the underlying simulation (`src/data/gameBalance.js`) makes deliberate pedagogical simplifications so children aged 7–12 can complete a 7-day mission in 5–10 minutes:

| Real Lunar Engineering Reality | In-Game Simplification (`SIMULATION_VALUE`) | Why It Was Simplified for Ages 7–12 |
|---|---|---|
| **Synodic Lunar Day (~29.53 Earth days):** Mid-latitude sites have ~14.75 Earth days of daylight and ~14.75 days of darkness; illuminated south-pole ridges have ~80–90% sunlight broken by multi-day terrain eclipses. | `1 mission day = 60 simulated seconds` with an `80%` daylight fraction (`48 s` daylight, `12 s` shadow) plus a scheduled `longShadow` mountain eclipse on Day 5. | Lets learners experience 7 full day/shadow cycles and battery storage trade-offs in ~7 minutes. |
| **Stoichiometric Mass & Energy Balances:** Real ECLSS tracks kg of $\text{O}_2$, $\text{CO}_2$, $\text{H}_2\text{O}$, and kWh across Sabatier reactors, brine processors, and oxygen generators. | All resources (`oxygen`, `water`, `food`, `battery`, `research`) are normalized to `0–100%` game bars with coupled per-second flow rates. | Makes cross-system causality ("Life Support needs Water and Power to make Oxygen") immediately readable on a single top bar. |
| **Radiation Dosimetry (mSv / Sieverts):** Real space radiation is measured in millisieverts (mSv) with distinct tissue weighting for GCR heavy ions vs. SPE protons. | Radiation exposure is represented as a `0–100%` dose meter (`dangerDose: 75%`) that rises slowly from cosmic rays, spikes during solar storms, and slowly recovers when shielded. | Avoids confusing radiological units while clearly teaching the difference between permanent regolith shielding and temporary storm sheltering. |
| **Crop Growth Cycles (28–60+ days):** Real space lettuce (`Veggie`) takes ~28–35 Earth days from seed to harvest and supplements rather than replaces packaged food. | Hydroponic crops grow from `0% → 100%` in ~90 simulated seconds and yield `+30% Food` upon harvest. | Gives young players multiple rewarding plant-and-harvest cycles within a single 7-day mission. |

---

## 3. Procedural 3D Graphics & Asset Trade-Offs

- **100% Procedural Geometry & Textures:** All 3D buildings, craters, regolith textures, solar panels, hydroponic plant trays, and particle systems in `src/scene/` are built programmatically in Three.js using geometric primitives and 2D HTML5 Canvas textures (`canvasTexture`).
- **Why:** Eliminates external `.glb`/`.gltf` network fetches, prevents broken asset paths offline, and keeps the repository lightweight and instant to load.
- **Trade-Off:** Models have a clean, stylized low-poly "mission control tabletop" aesthetic rather than photorealistic CAD meshes.

---

## 4. Browser & Hardware Requirements

- **WebGL Support Required:** The 3D lunar scene requires a browser and GPU (integrated or discrete) with WebGL enabled (Chrome 105+, Edge 105+, Firefox 110+, Safari 16+).
- **Screen Size:** Optimized for desktop, laptop, and landscape tablet viewports (`>= 1024×640` recommended so the left building dock, center 3D viewport, and right Building Inspector remain visible side by side; responsive layout stacks panels on smaller screens).
- **LocalStorage Availability:** In strict private/incognito modes where `localStorage` is blocked, the game still runs normally in memory (`SaveSystem.js` catches storage exceptions gracefully), though mission progress will not persist across page reloads.
