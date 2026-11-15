// Department C (C-S4 owner of record) — ALL tunable gameplay numbers.
// Every value here is a SIMULATION_VALUE: chosen for fun, fairness and learning,
// NOT a real NASA engineering number. Real facts live in scienceFacts.js.

export const BALANCE = {
  label: 'SIMULATION_VALUE',

  time: {
    stepSeconds: 0.5,          // fixed simulation step
    dayLengthSeconds: 60,      // one "mission day" (real lunar day ≈ 29.5 Earth days)
    missionDays: 7,
    daylightFraction: 0.8,     // part of each mission day with sunlight (south-pole ridge, simplified)
    autosaveEverySeconds: 10,
  },

  start: {
    oxygen: 85, water: 80, food: 70, battery: 80, research: 0,
    repairKits: 4, crewHealth: 100,
    moduleHealth: 90, solarDust: 0.1, solarAlignment: 0.8,
  },

  crew: {
    count: 4,
    oxygenUse: 0.45,      // per second, whole crew
    foodUse: 0.2,
    waterUse: 0.05,
  },

  lifeSupport: {
    power: 3,             // power units drawn when online
    oxygenMake: 0.7,      // per second at full health (electrolysis of water)
    waterForOxygen: 0.12, // water used to make oxygen
    waterRecycle: 0.16,   // water returned by the recycler
  },

  power: {
    solarPeak: 21,        // units at perfect alignment, no dust, full health, daylight (training simulation scale)
    habitatBase: 2,       // lights, heating, computers (always on)
    shelterExtra: 1,
    batteryPerUnit: 0.15, // % battery per (unit · second)
    brownoutRecover: 12,  // battery % needed to restart after a blackout
    lowWarning: 25,
  },

  greenhouse: {
    power: 3,
    waterUse: 0.15,
    growthPerSecond: 1.1, // 0→100 in ~90 s at full health
    harvestFood: 30,
  },

  lab: {
    power: 4,
    researchPerSecond: 0.45,
  },

  comms: {
    power: 1,
    researchBonusMultiplier: 0.12,
    defaultLatencySec: 2.56,
  },

  radiation: {
    background: 0.03,     // dose per second with no shielding
    shieldReduction: 0.22,// fraction removed per shield level
    stormUnsheltered: 1.6,
    stormSheltered: 0.12,
    dangerDose: 75,       // above this, crew health drops
    recoveryPerSecond: 0.01,
  },

  wear: {
    habitatPerSecond: 0.025,
    modulePerSecond: 0.02, 
    lowHealthLeak: 0.2,   // extra oxygen loss when habitat health < 30
    brokenBelow: 15,      // module stops working below this health
  },

  crewHealth: {
    lowOxygen: 15, lowOxygenDrain: 1.2,
    noFoodDrain: 0.35, noWaterDrain: 0.5, radiationDrain: 0.35, badHabitatDrain: 0.3,
    badHabitat: 20,
    recover: 0.12,
  },

  actions: {
    repairAmount: 40,
    iceWater: 25, iceBattery: 10, iceCooldown: 40,
    shieldBattery: 15, shieldKits: 1, shieldCooldown: 20, shieldMax: 3,
    cleanBattery: 4, cleanDust: 0.3, cleanCooldown: 15,
  },

  events: {
    randomChancePerDay: 0.65, // chance of an extra random event each mission day
    firstRandomDay: 2,
  },

  minigames: {
    leakHunter: { researchReward: 8, oxygenRestore: 10 },
    solarAligner: { researchReward: 8, minAlignment: 0.55 },
  },

  win: {
    researchGoal: 100,
    objectivesForStar: 4,
  },

  campaign: {
    label: 'SIMULATION_VALUE',
    totalRunsRequired: 5,
    warningThresholdSec: 8,
    qualityWeight: 0.65,
    speedWeight: 0.35,
  },
};
