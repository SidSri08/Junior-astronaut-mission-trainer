# Pedagogical Design & Learning Guide (Ages 7–12)

**Owner:** Department E (E1 Technical Documentation Engineer & Educational Content Lead — E-S1/E-S2/E-S4)  
**Target Audience:** Learners aged 7–12 (Grades 2–7), Educators, Parents, and NASA Space Apps Challenge 2026 Judges  
**Related Modules:** `src/data/educationContent.js`, `src/data/scienceFacts.js`, `src/minigames/leakHunter.js`, `src/minigames/solarAligner.js`

---

## 1. Educational Philosophy: "Learn by Commanding"

**Junior Astronaut Mission Trainer** puts children aged 7–12 into the role of **Junior Commander** of a 4-astronaut lunar outpost near the Moon's South Pole. Instead of presenting passive quizzes or walls of textbook prose, the game embeds authentic NASA engineering principles directly into the cause-and-effect loop of keeping an outpost alive for 7 mission days.

Our pedagogical approach follows three core principles:
1. **Concrete Cause-and-Effect Over Abstract Numbers:** Every subsystem change is immediately visible in both the 3D lunar scene (dust on solar panels, glowing pink-purple greenhouse LEDs, regolith sandbags stacked on the habitat roof, orange solar-storm particles) and the top resource bar.
2. **Safe Failure ("No Scary Game Over"):** If vital resources run out and crew health reaches 0%, astronauts never die—**Mission Control brings the crew home safely in the return lander**, explains which life-support dependency failed, and invites the player to apply that lesson on the next attempt.
3. **Strict Separation of Real Science vs. Game Pacing:** Every factual statement in the game carries a `REAL_SCIENTIFIC_FACT` label backed by an official NASA source in `src/data/scienceFacts.js`, while sped-up gameplay constants in `src/data/gameBalance.js` are explicitly labeled `SIMULATION_VALUE` (for example, 1 mission day = 60 seconds in-game vs. ~29.53 Earth days on the real Moon).

---

## 2. Learning Objectives Across the Five Core Outpost Systems

Each of the five interactive outpost buildings teaches a distinct pillar of lunar surface habitation aligned with NASA's Artemis program:

| Outpost System | Building in 3D Scene | Core NASA Concept | What Ages 7–12 Learn (Learning Objectives) | Key Facts (`scienceFacts.js`) |
|---|---|---|---|---|
| **1. Oxygen & Water (ECLSS)** | **Life Support (ECLSS)** | Electrolysis (`H₂O → H₂ + O₂`), closed-loop water recovery (~98% on ISS), and Permanently Shadowed Region (PSR) crater ice mining (ISRU). | • Understand that the Moon is an airless vacuum (`F-OXY-01`).<br>• Discover that breathable oxygen is made from water using electricity (`F-OXY-02`).<br>• Realize why recycling water (`F-WAT-03`) and mining polar crater ice (`F-WAT-01`, `F-WAT-02`) are essential when Earth resupply is costly (`F-WAT-04`). | `F-OXY-01`..`04`, `F-WAT-01`..`04` |
| **2. Solar Power & Cosine Law** | **Vertical Solar Array (VSAT)** | Low-horizon polar illumination (~1.54° lunar axial tilt), cosine angle efficiency ($\cos \theta$), electrostatic lunar dust adhesion, and energy storage during terrain shadows. | • Explain why vertical solar arrays are used at the lunar South Pole where the Sun skims the horizon (`F-POW-01`).<br>• Observe how aiming a panel straight at the Sun maximizes power (`F-POW-04`) and how clingy Moon dust blocks light (`F-POW-03`).<br>• Practice load-shedding during mountain shadows (`F-POW-02`). | `F-POW-01`..`04`, `F-MON-03` |
| **3. Hydroponic Food Production** | **Lunar Hydroponic Greenhouse** | Soilless hydroponic cultivation under red/blue LED grow lights, water-to-biomass conversion, and psychological/nutritional crew support. | • Contrast sterile, sharp lunar regolith (`F-MON-04`) with hydroponic plant pillows and LED grow lights (`F-FOD-02`).<br>• Understand that growing space greens requires electricity, liquid water, and time (`F-FOD-01`, `F-FOD-03`), complementing packaged Earth rations (`F-FOD-04`). | `F-FOD-01`..`04` |
| **4. Radiation Shielding** | **Crew Habitat & Storm Shelter** | Galactic Cosmic Rays (GCRs) vs. acute Solar Particle Events (SPEs), lack of a global lunar magnetosphere/atmosphere, and bulk regolith mass shielding. | • Recognize why the Moon lacks Earth's atmospheric and magnetic radiation shields (`F-RAD-01`).<br>• Differentiate between steady cosmic rays (mitigated by packing regolith bags on the habitat roof, `F-RAD-04`) and sudden solar storms requiring an inner water-walled shelter (`F-RAD-02`, `F-RAD-03`). | `F-RAD-01`..`04` |
| **5. Habitat Maintenance** | **All 5 Outpost Modules** | Hypervelocity micrometeoroid impacts, abrasive glass-like regolith dust, thermal extremes, and spare-parts logistics (Repair Kits). | • Understand why tiny space pebbles hit the Moon faster than bullets (`F-HAB-01`) and why jagged lunar dust wears down seals and machinery (`F-HAB-02`).<br>• Learn proactive maintenance before equipment drops below critical efficiency thresholds. | `F-HAB-01`..`04` |

---

## 3. Teaching Systems Thinking Through Causality & Trade-Offs

Rather than treating Oxygen, Water, Food, Power, and Radiation as five isolated meters, the simulation couples them into an authentic **interdependent network**. Children naturally discover **systems thinking** when solving multi-step chains:

```
[Solar Array] ──(Electricity)──► [Battery]
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
[Life Support: 3 Pwr]       [Greenhouse: 3 Pwr]          [Science Lab: 4 Pwr]
  • Uses Water (0.12/s)       • Uses Water (0.15/s)        • Produces Research
  • Makes Oxygen (0.70/s)     • Grows Fresh Food (+30%)    • Dispatches Ice Rover
  • Recycles Water (0.16/s)
```

### Pedagogical Trade-Off Moments Built Into Gameplay
- **The Water–Oxygen–Food Triangle:** If Oxygen runs low, turning Life Support ON isn't enough if Water is at 0%—because electrolysis splits water to make oxygen! Meanwhile, growing crops in the Greenhouse also consumes water. The player learns to dispatch the crater-mining rover (`collectIce`, costing 10% Battery) to replenish the shared water pool.
- **Shadow Load-Shedding (Day 5 Mountain Shadow & Night Phases):** When a mountain blocks the low South Pole Sun (`longShadow`), solar generation drops to 0. If the player leaves the Science Lab (4 Power), Greenhouse (3 Power), and Life Support (3 Power) running simultaneously, the battery drains to 0% and triggers a **Blackout (`brownout`)**, shutting down Life Support until the battery recovers to 12%. Players learn to prioritize human survival (Life Support) by temporarily switching off the Science Lab or Greenhouse.
- **Safety vs. Science Productivity (Day 4 Solar Storm):** Sending astronauts into the inner Storm Shelter reduces solar storm radiation by over 90% (`1.6/s` unsheltered vs. `0.12/s` sheltered), but pauses the Science Lab and adds `+1 Power` draw. Once the storm ends, the contextual hint bar reminds the player to release the crew so research can resume.
- **Scarcity of Repair Kits & Cargo Choices:** Players start with 4 Repair Kits. Packing regolith radiation shielding onto the Habitat costs 1 Repair Kit and 15% Battery per level, while fixing micrometeoroid damage or an oxygen generator fault also requires kits. On Day 6, the **Supply Lander** event asks the player to evaluate their base's state and choose one crate: Food (+30%), Spare Parts (+2 Repair Kits), or Water (+30%).

---

## 4. How the Two Minigames Reinforce Real NASA Concepts

Both hands-on minigames pause the main simulation clock (`setMinigameOpen`) so young players can focus on a tactile engineering task without time-pressure anxiety from background resource drain.

### Minigame 1: Leak Hunter (`src/minigames/leakHunter.js`)
- **NASA Concept:** Atmospheric pressure differential in a hard vacuum and ultrasonic acoustic leak detection (`F-OXY-01`, `F-OXY-03`).
- **Gameplay Mechanic:** Micrometeoroids have punctured 3 tiny holes in the hull. Because air rushing into a vacuum creates an ultrasonic hiss, the player sweeps an **Ultrasonic Hull Scanner** across the wall grid (via mouse, touch, or arrow keys) and watches the sensor readout shift from `🔵 COLD` → `🟡 WARM` → `🟠 HOT` → `🔴 PINPOINT!`. Clicking fires a sealant patch.
- **Pedagogical Takeaway:** Even when a hull perforation is too small to see with the naked eye, instruments can detect the pressure/acoustic gradient. Even a partial attempt reduces the leak rate by more than half (`effectScale = 0.45`), rewarding effort while teaching why rapid containment matters.

### Minigame 2: Solar Aligner (`src/minigames/solarAligner.js`)
- **NASA Concept:** Lambert's Cosine Law of solar irradiance ($I = I_0 \cos \theta$), low-elevation polar sunlight (`F-POW-01`, `F-POW-04`), and electrostatic lunar dust mitigation (`F-POW-03`).
- **Gameplay Mechanic:**
  1. **Step 1 (Dust Mitigation):** Players tap 6 clingy grey Moon-dust patches on the vertical solar panels to brush them clean (raising cleanliness from 40% to 100%).
  2. **Step 2 (Cosine Alignment):** Players rotate the vertical array slider (`-80°` to `+80°`) while watching a top-down compass comparing the **Panel Normal (`▲ Panel Front`)** to the incoming **Sun Direction (`☀️ SUN`)**. The UI live-calculates $\cos(\theta_{\text{panel}} - \theta_{\text{sun}})$ so children see output climb to 100% as the angle error approaches $0^\circ$.
- **Pedagogical Takeaway:** Turns trigonometry ($\cos \theta$) into an intuitive visual target for 7–12 year olds: *"Point the panel face straight at the Sun and keep the glass clean!"*

---

## 5. Age-Appropriate Vocabulary & Scaffolding (Ages 7–12)

All player-facing copy in `src/data/educationContent.js`, `src/data/missionEvents.js`, and `src/data/scienceFacts.js` is written at a **Grade 3–5 reading level** (~15–28 words per explanation) while introducing authentic aerospace terminology with immediate context:

1. **Paired Term + Plain-English Meaning:** Technical acronyms are never used bare. Instead, building cards and glossary entries pair the real NASA term with an everyday explanation:
   - *Electrolysis* → *"Splits water with electricity to make breathable Oxygen"*
   - *Regolith* → *"Powdery grey Moon dust and crushed rock covering the lunar surface"*
   - *ECLSS* → *"Environmental Control and Life Support System — the machines that clean air, make oxygen, and recycle water"*
   - *Permanently Shadowed Region (PSR)* → *"Deep craters near the Moon's poles where sunlight never reaches and water ice is trapped"*
   - *ISRU (In-Situ Resource Utilization)* → *"Living off the land in space—using local Moon water ice and soil instead of launching everything from Earth"*
2. **Two-Tier Science Cards (`kidText` + `caveat`):** In `src/data/scienceFacts.js`, every fact has a friendly `kidText` for 7–10 year olds alongside an engineering `caveat` (with exact SI units like $1.62\text{ m/s}^2$, $40\text{–}110\text{ K}$, and $\cos \theta$) for older 11–12 year olds, parents, teachers, and judges inspecting the **📘 NASA Guide**.
3. **Just-In-Time Contextual Hints (`getContextualHint`):** Rather than overwhelming players upfront, the smart hint banner at the top of the screen diagnoses the highest-priority outpost problem in real time (e.g., *"💧 Life Support needs Water to make Oxygen! Send the Rover for crater ice"*) and tells the player both **why** it is happening and **which action** fixes it.
