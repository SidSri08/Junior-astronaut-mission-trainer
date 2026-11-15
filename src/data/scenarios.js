// Structured 3-Scenario Training Campaign (3 mini-games per scenario = 9 total challenges).
// Every major decision introduces real engineering trade-offs and carry-over consequences across runs.

export const SCENARIO_ORDER = ['siteSetup', 'systemsBalance', 'radiationComms'];

export const SCENARIOS = {
  siteSetup: {
    id: 'siteSetup',
    order: 1,
    title: 'Scenario 1: Landing & Base Site Setup',
    shortTitle: 'Site & Setup',
    badge: 'PHASE 01 • SOUTH POLE ARRIVAL',
    locationLabel: 'Lunar South Pole — Shackleton Rim',
    summary:
      'Pick a smart touchdown ridge, lay out your 6 outpost modules safely, and aim the solar wings before dust reduces power.',
    learningGoal:
      'Learn why South Pole peaks balance long grazing sunlight against nearby shadowed craters full of frozen water.',
    strategyChoices: [
      {
        id: 'ridgePower',
        label: 'Sunny Ridge Overlook (Max Solar, Steep Walk to Ice)',
        tradeoff: '+14% Power buffer & +10% solar alignment, but -8% Water & +4% rover dust buildup.',
        consequenceNote: 'Great electricity supply for winter peaks, but water reserves start tighter until you mine crater ice.',
        recoveryNote: 'Use Mine Crater Ice or tune Greenhouse water valves to rebuild reserves.',
        effects: { battery: 12, water: -8, solarAlignmentBonus: 0.08, dustDelta: 0.04, research: 4 },
      },
      {
        id: 'craterRim',
        label: 'Shadow-Rim Ice Camp (Rich Water, Lower Grazing Sun)',
        tradeoff: '+14% Water & +5 Science, but -10% Battery & -8% solar alignment.',
        consequenceNote: 'Steady water for oxygen and crops, though batteries drain faster if the Lab stays busy.',
        recoveryNote: 'Play Solar Aligner or switch the Lab off briefly during high load.',
        effects: { water: 14, battery: -10, solarAlignmentBonus: -0.06, research: 5 },
      },
    ],
    minigames: [
      {
        gameId: 'siteSelector',
        title: 'Landing Site Selector',
        summary: 'Compare sun hours, crater ice distance, and slope dust risk to pick the best South Pole pad.',
        timerMinSec: 28,
        timerMaxSec: 38,
        practiceHint: 'Sample terrain beacons without timer pressure before locking your 3 survey checks.',
      },
      {
        gameId: 'moduleLayout',
        title: 'Base Module Layout',
        summary: 'Place Habitat, Air/Water, Solar, Greenhouse, Lab & Comms within cable and safety limits.',
        timerMinSec: 30,
        timerMaxSec: 42,
        practiceHint: 'Drag or tap slots to see cable length vs dust-blast separation.',
      },
      {
        gameId: 'solarAligner',
        title: 'Solar Array Calibration',
        summary: 'Sweep away lander regolith dust and align panels with the low South Pole horizon Sun.',
        timerMinSec: 25,
        timerMaxSec: 35,
        practiceHint: 'Try dragging the Sun Dial ring gently to feel the sweet-spot glow.',
      },
    ],
    carryOverNote: 'Your site choice, module layout score, and initial solar calibration carry into Run 2+.',
  },

  systemsBalance: {
    id: 'systemsBalance',
    order: 2,
    title: 'Scenario 2: Systems Balance & Resource Survival',
    shortTitle: 'Systems Balance',
    badge: 'PHASE 02 • SUSTAINABLE OPERATIONS',
    locationLabel: 'Artemis Outpost — Closed-Loop Grid',
    summary:
      'Keep air, water, food, and electricity balanced as equipment wears down and crew demand rises.',
    learningGoal:
      'Understand closed-loop ECLSS recycling: water splits into oxygen, plants trade CO₂ for food/O₂, and power drives everything.',
    strategyChoices: [
      {
        id: 'scienceSurge',
        label: 'Full-Power Lab Surge (Faster Science, Heavy Drain)',
        tradeoff: '+14 Science & +8 Comms calibration, but -12% Battery & -8% Habitat/Life Support wear.',
        consequenceNote: 'Accelerates mission research milestones while stressing batteries and seals.',
        recoveryNote: 'Use Power Router to throttle non-critical loads or apply a Repair Kit.',
        effects: { research: 14, battery: -12, lifeSupportHealth: -8, commsCalibration: 0.08 },
      },
      {
        id: 'conservationMode',
        label: 'Eco-Recycling Loop (Steady Tanks, Slower Science)',
        tradeoff: '+10% Air, +8% Food & +1 Repair Kit, but -6% Science pace and crew boredom risk.',
        consequenceNote: 'Preserves life support health and buffers consumables for emergencies.',
        recoveryNote: 'Harvest Greenhouse crops and inspect lunar rock samples later to catch up on Science.',
        effects: { oxygen: 10, food: 8, repairKits: 1, research: -4 },
      },
    ],
    minigames: [
      {
        gameId: 'powerRouter',
        title: 'Power Grid Router',
        summary: 'Balance solar generation and battery drawdown across all 6 outpost systems without browning out.',
        timerMinSec: 28,
        timerMaxSec: 38,
        practiceHint: 'Adjust system sliders in practice mode until Net Power is >= 0 before starting.',
      },
      {
        gameId: 'leakHunter',
        title: 'Habitat Leak Hunter',
        summary: 'Sweep the hull pressure scanner across seams to pinpoint and patch micrometeoroid leaks.',
        timerMinSec: 24,
        timerMaxSec: 34,
        practiceHint: 'Listen/watch for the sonar pulse getting faster near a hidden leak.',
      },
      {
        gameId: 'greenhouseBalance',
        title: 'Greenhouse Bioreactor',
        summary: 'Tune grow lamps, irrigation mist, and CO₂ intake into the green optimal growth window.',
        timerMinSec: 28,
        timerMaxSec: 38,
        practiceHint: 'Test how lamps warm the dome while water mist cools it.',
      },
    ],
    carryOverNote: 'Remaining repair kits, system health, and greenhouse yield carry forward into Solar Storm defense.',
  },

  radiationComms: {
    id: 'radiationComms',
    order: 3,
    title: 'Scenario 3: Radiation Storm & Earth-Moon Comms',
    shortTitle: 'Storm & Comms',
    badge: 'PHASE 03 • SPACE WEATHER DEFENSE',
    locationLabel: 'South Pole Dish Array & Storm Shelter',
    summary:
      'Respond to an energetic solar storm alert, pack multi-layer shielding, and handle Earth-Moon signal delay.',
    learningGoal:
      'Discover why Earth radio signals take ~2.56 seconds round-trip and why local storm shelters + regolith walls save lives.',
    strategyChoices: [
      {
        id: 'thickRegolith',
        label: 'Deep Regolith Trench & Water Wall (Heavy Shield, High Power)',
        tradeoff: '+1 Shield Level & +12% Safety, but -14% Battery & -8% Water allocated to radiation wall.',
        consequenceNote: 'Significantly cuts solar proton exposure during CME bursts at the cost of power and water.',
        recoveryNote: 'Exit shelter immediately when all-clear arrives and mine crater ice to refill water.',
        effects: { shieldLevelDelta: 1, radiationShieldDelta: 12, battery: -14, water: -8 },
      },
      {
        id: 'highGainRelay',
        label: 'Priority Comms Beacon & Fast Shelter Drill (Fast Warnings)',
        tradeoff: '+18% Comms Signal, +10 Science & reduced delay, but -10% Air/Food used in shelter prep.',
        consequenceNote: 'Maximizes Earth Mission Control telemetry lock and research points, with lighter passive hull armor.',
        recoveryNote: 'Stack extra polyethylene/regolith during Shield Builder mini-game.',
        effects: { commsCalibration: 0.16, research: 10, oxygen: -6, food: -5 },
      },
    ],
    minigames: [
      {
        gameId: 'shelterResponse',
        title: 'Solar Storm Emergency Drill',
        summary: 'Read the NASA space-weather alert, cycle bulkheads in order, and shelter all 4 astronauts safely.',
        timerMinSec: 22,
        timerMaxSec: 32,
        practiceHint: 'Step through one dry bulkhead sequence before the solar proton wave arrives.',
      },
      {
        gameId: 'shieldBuilder',
        title: 'Regolith Shield Stacker',
        summary: 'Combine lunar soil, water bladders, and light hydrogen plastics to hit shielding targets inside mass limits.',
        timerMinSec: 26,
        timerMaxSec: 36,
        practiceHint: 'Hydrogen-rich layers block secondary radiation better per kilogram than rock alone.',
      },
      {
        gameId: 'commsDelay',
        title: 'Earth-Moon Signal Relay',
        summary: 'Account for ~2.56s round-trip radio travel time over 384,400 km to bounce science telemetry to Earth.',
        timerMinSec: 26,
        timerMaxSec: 36,
        practiceHint: 'Send one practice ping and watch the 1.28s uplink + 1.28s downlink signal wave.',
      },
    ],
    carryOverNote: 'After Run 5 finishes, your final scores trigger base wrap-up, lander boarding, and Earth return!',
  },
};

export function getScenarioById(scenarioId) {
  return SCENARIOS[scenarioId] || SCENARIOS[SCENARIO_ORDER[0]];
}

export function getAllScenarioMinigameIds() {
  const ids = [];
  for (const scId of SCENARIO_ORDER) {
    for (const mg of SCENARIOS[scId].minigames) {
      if (!ids.includes(mg.gameId)) ids.push(mg.gameId);
    }
  }
  return ids;
}

