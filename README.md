# 🌕 Junior Astronaut Mission Trainer

**Browser-Based 3D Educational Lunar Outpost Simulation for Ages 7–12**  
*Built for the NASA Space Apps Challenge 2026*

---

## 1. Project Overview

**Junior Astronaut Mission Trainer** puts young learners (ages 7–12) in command of a 4-astronaut lunar research outpost located near the **Moon's South Pole**—the real target region of NASA's Artemis missions. Players must keep their crew healthy for **7 mission days** while operating interconnected life-support systems, managing solar power across mountain shadows, growing hydroponic crops, shielding the habitat with lunar regolith, responding to dynamic space-weather and mechanical emergencies, and collecting **100 Research Points**.

### Key Highlights
- **Interactive 3D Lunar South-Pole Base (Three.js):** Procedural cratered terrain, low-horizon polar Sun (~7.5° elevation), hanging Earth in a starry sky, animated ice-mining rover, and 5 interactive outpost buildings that visually reflect simulation state (solar panel tilt & dust coating, regolith shielding sandbags, greenhouse crop trays, solar storm particle clouds, oxygen leak plumes, and emergency beacons).
- **Deterministic Systems Simulation:** A pure, headless-testable state machine (`src/systems/`) modeling the real trade-offs between Oxygen, Water, Food, Electrical Power, Radiation Dose, and Habitat Integrity.
- **Two Hands-On STEM Minigames:** **Leak Hunter** (ultrasonic hull pressure scanner) and **Solar Aligner** (Lambert's Cosine Law $\cos \theta$ + electrostatic lunar dust brushing).
- **Verified NASA Science Grounding:** 28 kid-friendly facts across 7 topics mapped to 12 official NASA sources (`src/data/scienceFacts.js`), strictly separated from gameplay-tuned numbers (`SIMULATION_VALUE` in `src/data/gameBalance.js`).
- **Zero External Asset Dependencies:** Runs 100% locally in any modern browser using Three.js, HTML5, CSS3, Vanilla ES Modules, Vite, and `localStorage`.

---

## 2. Live Gameplay Loop

Every `0.5 s` simulation step (`1 mission day = 60 s` at `1×` speed; adjustable to Pause, `1×`, `2×`, or `3×`):

1. **Crew Consumption & Wear:** The 4-astronaut crew breathes Oxygen (`0.45/s`), eats Food (`0.20/s`), and drinks Water (`0.05/s`), while abrasive lunar dust and thermal stress slowly wear down outpost modules.
2. **Polar Solar Generation & Battery Storage:** During the daylight portion of each cycle, the Vertical Solar Array generates power based on sunlight, panel alignment ($\cos \theta$), dust cleanliness, and module health. Surplus power charges the battery; deficits drain it. If Battery reaches `0%`, a **Blackout (`brownout`)** stops all powered modules until the battery recharges to `12%`.
3. **Coupled Resource Production:**
   - **Life Support (`3 Power`):** Electrolyzes Water (`0.12/s`) to generate breathable Oxygen (`0.70/s`) and recycles used water (`0.16/s`).
   - **Hydroponic Greenhouse (`3 Power`):** Uses Water (`0.15/s`) under LED grow lights to grow space greens (`0% → 100%`), yielding `+30% Food` per harvest.
   - **Science Lab (`4 Power`):** Studies lunar rock and ice cores (`+0.45 Research/s`) when astronauts are on duty (not in the storm shelter) and dispatches the crater ice-mining rover (`+25% Water`, `-10% Battery`).
4. **Radiation & Space Weather:** Galactic Cosmic Rays slowly add background dose (`0.03/s`), reduced by up to 3 levels of **Regolith Shielding** (`22%` reduction per level). Sudden **Solar Storms** spike radiation unless the crew enters the inner water-walled Storm Shelter.
5. **Scheduled & Seeded-Random Events:** From dusty solar panels (Day 2), hull air leaks (Day 3), solar storms (Day 4), and mountain shadows (Day 5) to Earth supply landers (Day 6) and micrometeoroid impacts.
6. **Mission Outcome:**
   - **Win (1–3 Stars):** Complete all 7 mission days with Crew Health > `0%`. Earn `★` for survival, `★★` for `≥ 100` Research Points, and `★★★` for completing at least 4 of the 7 Mission Objectives.
   - **Safe Evacuation (Lose):** If Crew Health reaches `0%`, Mission Control brings the crew home safely in the return lander, explains what went wrong, and lets the player retry.

---

## 3. The Five Core Outpost Systems

| Building | Power Draw | Inputs | Outputs / Actions | Real NASA Parallel |
|---|---|---|---|---|
| **🏠 Crew Habitat & Storm Shelter** | `2` Base (`+1` when sheltering) | Repair Kits, Battery | **Pack Regolith Shielding** (Levels `0→3`), **Shelter Crew** during Solar Storms | Artemis surface habitat, MMPACT regolith berms, water-walled SPE storm shelter |
| **💨 Life Support (ECLSS)** | `3` (Toggleable) | Water (`0.12/s`) | **Oxygen** (`+0.70/s`), **Recycled Water** (`+0.16/s`), **Leak Hunter** minigame | ISS Oxygen Generation Assembly (water electrolysis) & Water Recovery System (~98%) |
| **☀️ Vertical Solar Array (VSAT)** | `0` (Generator) | Polar Sunlight | Up to **20 Power** at 100% alignment & 0% dust; **Solar Aligner** & **Quick Clean** | NASA Vertical Solar Array Technology (VSAT) for low-angle lunar south-pole sunlight |
| **🌱 Hydroponic Greenhouse** | `3` (Toggleable) | Water (`0.15/s`) | **Harvest Crops** (`+30% Food` at 100% growth) | ISS Veggie & Advanced Plant Habitat (red/blue LED hydroponics) |
| **🔬 Lunar Science Lab & Rover Bay** | `4` (Toggleable) | Crew on duty, Battery | **Research Points** (`+0.45/s`), **Mine Crater Ice** (`+25% Water`, `-10% Battery`) | Artemis geology curation & VIPER/ISRU polar crater water-ice harvesting |

---

## 4. Two Educational Minigames

1. **🔍 Leak Hunter (`src/minigames/leakHunter.js`):**
   - **Concept:** In a hard vacuum, cabin air escaping through micrometeoroid punctures produces an ultrasonic hiss.
   - **Action:** Sweep the habitat hull grid using mouse, touch, or arrow keys. Watch the ultrasonic sensor (`🔵 COLD` → `🟡 WARM` → `🟠 HOT` → `🔴 PINPOINT!`) and fire sealant patches to seal all 3 leaks within 25 seconds.
   - **Reward:** Resolves active `oxygenLeak` events, restores `+10% Oxygen`, repairs `+15% Habitat Health`, and awards `+8 Research Points`.
2. **☀️ Solar Aligner (`src/minigames/solarAligner.js`):**
   - **Concept:** Electrostatic lunar dust blocks photovoltaic cells, and solar irradiance follows Lambert's Cosine Law ($I = I_0 \cos \theta$).
   - **Action:** Tap 6 clingy Moon-dust patches to brush the vertical panels clean, then rotate the array (`-80°` to `+80°`) so the panel normal points directly at the South Pole Sun (`0°` error = `100%` cosine efficiency).
   - **Reward:** Updates `modules.solar.alignment`, clears panel dust, resolves `dustyPanels` events, and awards `+8 Research Points`.

---

## 5. Scientific Grounding: `REAL_SCIENTIFIC_FACT` vs. `SIMULATION_VALUE`

To prevent players or educators from confusing arcade time-scaling with real astrophysics, the codebase enforces a strict two-file boundary:

- **`REAL_SCIENTIFIC_FACT` (`src/data/scienceFacts.js`):** Contains 28 peer-reviewed/NASA-sourced educational facts across 7 topics (`moon`, `oxygen`, `water`, `power`, `food`, `radiation`, `habitat`) linked to 12 official NASA URLs (`S01`–`S12`). Each fact provides both a child-friendly `kidText` and a rigorous engineering `caveat` (e.g., lunar gravity $1.62\text{ m/s}^2$, synodic period $29.53\text{ Earth days}$, LCROSS Cabeus crater $5.6 \pm 2.9\%$ water ice, PSR temperatures $40\text{–}110\text{ K}$).
- **`SIMULATION_VALUE` (`src/data/gameBalance.js`):** Contains all gameplay-tuned rates and thresholds (`BALANCE.label === 'SIMULATION_VALUE'`), such as `dayLengthSeconds: 60` so a 7-day mission can be played in ~7 minutes in a classroom or judging session.

See [`docs/science/`](docs/science/) and [`docs/education/learning-guide.md`](docs/education/learning-guide.md) for full documentation.

---

## 6. Quick Start, Build & Test Commands

### Prerequisites
- **Node.js** `>= 18.0.0` (includes `npm` and the built-in `node --test` runner)
- Any modern desktop or tablet browser with WebGL support (Chrome, Edge, Firefox, Safari)

### Commands
```bash
# 1. Install dependencies (Three.js + Vite)
npm install

# 2. Start the local development server (http://localhost:5173)
npm run dev

# 3. Run the headless simulation & scientific integrity test suite
npm test

# 4. Build production bundle to dist/
npm run build
```

---

## 7. 3-Minute Live Judge Demonstration Script

Use this step-by-step script to experience the full arc of **Junior Astronaut Mission Trainer** in 3 minutes:

1. **0:00 – 0:30 | Welcome & 3D Lunar South-Pole Outpost:**
   - Open `http://localhost:5173`. Step through the 4-slide **Junior Commander Tutorial** (noting the explicit explanation that 1 mission day = 60 seconds in-game vs. 29.5 Earth days on the Moon) and click **🚀 Start Mission**.
   - Drag the mouse to orbit around the 3D lunar crater rim: point out the low-horizon South Pole Sun, the Earth hanging in the black sky, the glowing pink-purple **Hydroponic Greenhouse**, and the rotating **Vertical Solar Array**.
2. **0:30 – 1:15 | Interactive Buildings, Cosine Law & Solar Aligner:**
   - Click the **☀️ Vertical Solar Array** in 3D (or on the left sidebar) to focus the camera.
   - Click **☀️ Play Solar Aligner**. Brush off the 6 grey Moon-dust patches and rotate the array slider until it aligns with the Sun (`0°` error, `100%` output). Click **✅ Lock In Alignment** to earn `+8 Research` and watch the 3D solar panels rotate to the new angle.
3. **1:15 – 2:00 | Resource Coupling, Crater Ice Rover & Leak Hunter:**
   - Click the **🔬 Lunar Science Lab** and click **🧊 Mine Crater Ice**—watch the 3D rover drive out to a shadowy crater and replenish `+25% Water` (which Life Support needs for oxygen electrolysis!).
   - Click the **💨 Life Support (ECLSS)** building and launch **🔍 Play Leak Hunter**. Sweep the hull grid using the ultrasonic sensor (`COLD → WARM → HOT → PINPOINT`) and click to seal all 3 micrometeoroid holes.
4. **2:00 – 2:35 | Space Weather, Regolith Shielding & Speed Controls:**
   - Click the **🏠 Crew Habitat** and click **⛏️ Pack Regolith Shielding**—observe physical sandbags of lunar soil appear on top of the 3D habitat roof (`Shield 1/3`).
   - Switch simulation speed to **`3×`** in the top bar to advance through **Day 4's Solar Storm Warning** (`☢️`). Click **🛡️ Shelter Crew** to move the astronauts into the inner water-walled shelter while orange solar particles sweep across the 3D base, then release them once the storm clears.
5. **2:35 – 3:00 | NASA Science Field Guide & Persistence:**
   - Click **📘 NASA Guide** in the top-right bar to inspect the 28 sourced `REAL_SCIENTIFIC_FACT` cards, the kid-friendly glossary, and the `REAL_SCIENTIFIC_FACT` vs. `SIMULATION_VALUE` pledge.
   - Refresh the browser tab to show automatic `localStorage` mission restoration (`💾 Restored your saved Lunar Outpost mission!`).

---

## 8. Project Layout

```text
├── index.html                        # App shell (#scene canvas, #ui-root, #minigame-root)
├── package.json                      # Scripts (dev, build, preview, test) & deps (three, vite)
├── src/
│   ├── main.js                       # Bootstrap, autosave wiring & fixed-step (0.5 s) scheduler
│   ├── data/
│   │   ├── gameBalance.js            # All SIMULATION_VALUE tunable parameters
│   │   ├── missionEvents.js          # 9 scheduled & random lunar mission events
│   │   ├── objectives.js             # 7 mission checklist objectives
│   │   ├── scienceFacts.js           # 28 REAL_SCIENTIFIC_FACT entries + 12 NASA sources
│   │   └── educationContent.js       # Tutorial steps, building guides, glossary & smart hints
│   ├── systems/
│   │   ├── GameState.js              # Canonical state factory & immutable snapshot store
│   │   ├── ResourceSystem.js         # Master tick orchestrator, player actions & win/lose logic
│   │   ├── PowerSystem.js            # Solar generation, module load & blackout recovery
│   │   ├── LifeSupportSystem.js      # Water electrolysis (O2), water recycling & consumption
│   │   ├── FoodSystem.js             # Hydroponic crop growth, food consumption & lab research
│   │   ├── RadiationSystem.js        # GCR background, regolith shielding & solar storm doses
│   │   ├── HabitatSystem.js          # Module wear, dust accumulation & breakdown alerts
│   │   ├── MissionEventSystem.js     # Event scheduling, warning/active phases & decision modals
│   │   ├── SaveSystem.js             # Defensive localStorage persistence (jamt.save.v1)
│   │   ├── rng.js                    # Seeded deterministic RNG (mulberry32)
│   │   └── util.js                   # Shared pure simulation helpers
│   ├── scene/
│   │   ├── OutpostScene.js           # Three.js renderer, camera, lighting & particle effects
│   │   ├── buildings.js              # Procedural 3D meshes for all 7 outpost structures
│   │   ├── terrain.js                # Cratered lunar south-pole heightmap, Earth, Sun & stars
│   │   └── sceneUtils.js             # Procedural canvas textures, noise & smoothing math
│   ├── minigames/
│   │   ├── minigameHost.js           # Modal host bridging minigames to GameState actions
│   │   ├── leakHunter.js             # Minigame 1: Ultrasonic hull leak scanner
│   │   └── solarAligner.js           # Minigame 2: Polar solar array alignment & dust brushing
│   ├── ui/
│   │   └── ui.js                     # DOM HUD, Building Inspector, NASA Guide & modals
│   └── styles/
│       └── main.css                  # Responsive mission-control styling
├── tests/                            # Headless Node test suite (node --test)
└── docs/
    ├── architecture/ARCHITECTURE.md  # Frozen system contract & state schema
    ├── education/learning-guide.md   # Pedagogical design for ages 7–12
    ├── science/                      # Scientific accuracy verification notes
    ├── developer-setup.md            # Setup, commands, troubleshooting & tuning guide
    ├── module-guide.md               # Module-by-module code walkthrough
    └── known-limitations.md          # MVP scope, simplifications & browser requirements
```
