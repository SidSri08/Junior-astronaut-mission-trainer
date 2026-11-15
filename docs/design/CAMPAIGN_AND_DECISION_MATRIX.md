# Campaign, Strategy Trade-Offs & Carry-Over Matrix

**Project:** Junior Astronaut Mission Trainer (NASA Space Apps Challenge 2026 — Team Doomed Crew)  
**Architecture Stack:** Vite (`^8.3.8`) + Vanilla ES Modules + direct Three.js (`^0.187.0`) (Zero React / No Next.js)

---

## 1. 3-Scenario × 3-Mini-Game Campaign Structure (`src/data/scenarios.js`)

| Scenario ID | Title | Bounded Timer Windows | 3 Mini-Games (`src/minigames/*`) | Carry-Over Effects (`src/systems/CampaignSystem.js`) |
| --- | --- | --- | --- | --- |
| `siteSetup` | Scenario 1: Landing & Base Site Setup | `28–38s`, `30–42s`, `25–35s` | `siteSelector`, `moduleLayout`, `solarAligner` | Updates solar alignment bonus, dust penalty & initial water balance |
| `systemsBalance` | Scenario 2: Systems Balance & Resource Survival | `28–38s`, `24–34s`, `28–38s` | `powerRouter`, `leakHunter`, `greenhouseBalance` | Carries remaining repair kits, subsystem wear & greenhouse output |
| `radiationComms` | Scenario 3: Radiation Storm & Deep Space Comms | `22–32s`, `26–36s`, `26–36s` | `shelterResponse`, `shieldBuilder`, `commsDelay` | Updates `shieldLevel`, radiation reduction & Comms signal calibration |

---

## 2. Engineering Strategy Trade-Offs (No Single "Perfect" Answer)

- **`siteSetup`:**
  - `ridgePower` (*Sunny Ridge Overlook*): `+12%` Battery, `+0.08` Solar Alignment, `+4` Science; trade-off `-8%` Water, `+0.04` Dust buildup. Recovery: *Mine Crater Ice*.
  - `craterRim` (*Shadow-Rim Ice Camp*): `+14%` Water, `+5` Science; trade-off `-10%` Battery, `-0.06` Solar Alignment. Recovery: *Solar Aligner* or throttle Science Lab.
- **`systemsBalance`:**
  - `scienceSurge` (*Full-Power Lab Surge*): `+14` Science, `+0.08` Comms calibration; trade-off `-12%` Battery, `-8%` Life Support health. Recovery: *Power Grid Router* + Repair Kit.
  - `conservationMode` (*Eco-Recycling Loop*): `+10%` Air, `+8%` Food, `+1` Repair Kit; trade-off `-4` Science pace. Recovery: harvest Greenhouse & run telemetry.
- **`radiationComms`:**
  - `thickRegolith` (*Deep Regolith Trench & Water Wall*): `+1` Shield Level, `-12%` Radiation dose; trade-off `-14%` Battery, `-8%` Water. Recovery: *Mine Crater Ice*.
  - `highGainRelay` (*Priority Comms Beacon & Fast Shelter Drill*): `+0.16` Comms calibration, `+10` Science; trade-off `-6%` Air, `-5%` Food. Recovery: stack layers in *Regolith Shield Stacker*.

---

## 3. Run Counting & 5-Run Evacuation Ending Rules

1. `campaign.completedRuns` initializes at `0` (`totalRunsRequired = 5`).
2. `completedRuns` increments by `+1` strictly **once** when a full scenario reaches `result` state (guarded by `runCompletedLogged` and `completedRunTokens` idempotency tracking in `CampaignSystem.js`).
3. Starting, pausing, cancelling, or completing a single mini-game does **not** increment `completedRuns`.
4. When `completedRuns >= 5`, `campaign.endingTriggered` becomes `true`, blocking any 6th scenario launch (`CAMPAIGN_ENDED`) and triggering the 3D evacuation sequence (`wrapUp -> boarding -> liftoff`) followed by the Final Campaign Report (`computeCampaignReport`) and `resetCampaign` replay option.

