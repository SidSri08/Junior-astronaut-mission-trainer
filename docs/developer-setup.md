# Developer Setup & Customization Guide

**Owner:** Department E (E-S3 Technical Documentation)  
**Related Files:** `package.json`, `src/data/gameBalance.js`, `src/data/missionEvents.js`, `src/systems/SaveSystem.js`

---

## 1. Prerequisites

**Junior Astronaut Mission Trainer** is intentionally lightweight and requires no database, backend server, or paid API keys.

- **Node.js:** Version `18.0.0` or newer (includes `npm` and Node's built-in `node --test` runner).
- **Web Browser:** Any modern browser with WebGL and ES Module support (Chrome, Edge, Firefox, or Safari).

Check your Node version before starting:
```bash
node --version
npm --version
```

---

## 2. Installation & Commands

Run all commands from the repository root directory:

| Command | Description |
|---|---|
| `npm install` | Installs the two project dependencies (`three` and `vite`). |
| `npm run dev` | Starts the Vite local development server at `http://localhost:5173` with hot module reload. |
| `npm test` | Runs the headless simulation and scientific fact test suite via `node --test tests/`. |
| `npm run build` | Bundles the production build into the `dist/` folder. |
| `npm run preview` | Serves the compiled `dist/` build locally to verify production behavior. |

> **Architecture Note:** `src/systems/**` and `src/data/**` are pure ES modules with zero DOM or Three.js imports so that `npm test` can execute thousands of simulation ticks in Node in under a second.

---

## 3. How to Tune Game Balance (`src/data/gameBalance.js`)

All gameplay-tuned numbers live in a single file: `src/data/gameBalance.js` (`export const BALANCE`, tagged `label: 'SIMULATION_VALUE'`). You never need to hunt for magic numbers inside UI or 3D scene files.

### Common Tuning Scenarios

1. **Adjust Mission Length or Day Speed (`BALANCE.time`):**
   ```js
   time: {
     stepSeconds: 0.5,          // Fixed physics/simulation step (keep at 0.5s)
     dayLengthSeconds: 60,      // Seconds per mission day at 1x speed
     missionDays: 7,            // Total days required to win
     daylightFraction: 0.8,     // Fraction of each day with polar sunlight (0.0 to 1.0)
     autosaveEverySeconds: 10,
   },
   ```
   *Tip:* For a quicker classroom demo, lowering `dayLengthSeconds` to `40` makes a full 7-day mission take under 5 minutes at `1×` speed.

2. **Make Resource Drain Easier or Harder (`BALANCE.crew` & `BALANCE.lifeSupport`):**
   - `crew.oxygenUse` (`0.45/s`), `crew.foodUse` (`0.2/s`), `crew.waterUse` (`0.05/s`) control how fast the 4 astronauts consume supplies.
   - `lifeSupport.oxygenMake` (`0.7/s`) and `lifeSupport.waterRecycle` (`0.16/s`) control how much margin the ECLSS module provides when healthy and powered.

3. **Tune Action Costs & Cooldowns (`BALANCE.actions`):**
   ```js
   actions: {
     repairAmount: 40,          // +Health per Repair Kit
     iceWater: 25,              // +Water % from crater rover mission
     iceBattery: 10,            // Battery % cost to send rover
     iceCooldown: 40,           // Cooldown in simulated seconds
     shieldBattery: 15,         // Battery % cost to pack regolith bags
     shieldKits: 1,             // Repair Kit cost per shield level
     shieldCooldown: 20,
     shieldMax: 3,
     cleanBattery: 4,
     cleanDust: 0.3,
     cleanCooldown: 15,
   },
   ```

> **Important:** After changing `src/data/gameBalance.js`, run `npm test` to confirm that automated invariants (like survival under normal play and blackout recovery thresholds) still pass.

---

## 4. How to Add or Edit Mission Events (`src/data/missionEvents.js`)

Mission events are declared declaratively in `src/data/missionEvents.js` inside `export const MISSION_EVENTS` and executed automatically by `src/systems/MissionEventSystem.js`.

### Event Definition Schema

```js
myNewEvent: {
  id: 'myNewEvent',
  icon: '🛰️',
  topic: 'moon',                 // Matches a topic in scienceFacts.js ('moon'|'oxygen'|'water'|'power'|'food'|'radiation'|'habitat')
  kind: 'warn',                  // Log/banner severity: 'info' | 'good' | 'warn' | 'bad'
  title: 'Communications Dish Drift',
  kidText: 'Earth radio signal is staticky! Should we spend battery power to re-aim the high-gain antenna?',
  lesson: 'Lunar South Pole bases communicate with Earth low on the northern horizon or via relay satellites.',

  // Optional: fire at a specific day and timeOfDay (0.0 to 1.0)
  schedule: { day: 3, at: 0.5 },

  // Optional: include in the seeded-random daily pool
  random: { weight: 2, minDay: 2 },

  // Optional: immediate effect when event starts
  onStart: { research: +5 },

  // Optional: interactive player decision modal
  choices: [
    {
      id: 'realign',
      label: '📡 Re-aim Antenna',
      detail: 'Costs 6% battery. Earns +10 Research Points.',
      cost: { battery: 6 },
      effects: { research: +10 },
      resolves: true,
    },
    {
      id: 'skip',
      label: '⏳ Wait for Orbit Pass',
      detail: 'No battery cost.',
      resolves: true,
    },
  ],
}
```

### Supported Effect & Choice Properties
- **`onStart` / `effects`:** Can modify `resources` (`{ oxygen, water, food, battery }`), `research` (number delta), `solarDust` (number delta), `modules` (`{ habitat: { health: -15 } }`), or `inventory` (`{ repairKits: +1 }`).
- **`ongoing`:** `{ perSecond: { oxygen: -0.9 } }` applies continuous drain until resolved.
- **`warningSeconds` & `durationSeconds`:** Used for timed environmental events like `solarStorm` or `longShadow`.
- **`modifiers`:** `{ solarMultiplier: 0 }` scales solar power generation while the event is in its `'active'` phase.
- **`opensMinigame`:** Setting `opensMinigame: 'leakHunter'` or `'solarAligner'` on a choice launches that minigame when clicked.

---

## 5. Troubleshooting

- **Game starts mid-mission instead of at Day 1:**
  - The game automatically saves progress to `localStorage` under the key `jamt.save.v1`. Click **↻ Reset** in the top-right bar of the HUD, or run `localStorage.removeItem('jamt.save.v1')` in the browser DevTools console and reload.
- **Port 5173 is already in use:**
  - Vite will automatically increment to the next free port (e.g., `http://localhost:5174`). Check the terminal output from `npm run dev`.
- **3D Scene looks sluggish or blank:**
  - Verify that hardware acceleration and WebGL are enabled in your browser settings (`chrome://gpu` in Chrome/Edge).
- **`npm test` fails after editing `src/systems/`:**
  - Ensure you did not import `window`, `document`, or `three` inside `src/systems/**` or `src/data/**`. Those directories must remain pure Node-compatible ES modules.
