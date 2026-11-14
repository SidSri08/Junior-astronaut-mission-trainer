// Department C (C-S2 owner of record) — mission event definitions.
// Numbers are SIMULATION_VALUEs. `factId` links to a sourced fact in scienceFacts.js
// (if the fact ID does not exist, the UI simply shows no fact).
//
// Effect format (applied by MissionEventSystem via applyEffects):
//   { resources: { oxygen: +10 }, modules: { habitat: { health: -20 } },
//     inventory: { repairKits: +2 }, solarDust: +0.4, research: +5 }
// Choice: { id, label, detail, cost?, effects?, resolves?: true, opensMinigame?: 'leakHunter' }

export const MISSION_EVENTS = {
  dustyPanels: {
    id: 'dustyPanels', icon: '🌫️', topic: 'power', kind: 'warn',
    title: 'Dusty Solar Panels',
    kidText: 'The rover kicked up Moon dust and it stuck to the solar panels! Dusty panels make less electricity.',
    lesson: 'Moon dust is very fine and clingy. Clean panels catch more sunlight.',
    schedule: { day: 2, at: 0.15 }, random: { weight: 3, minDay: 2 },
    onStart: { solarDust: +0.4 },
    choices: [
      { id: 'minigame', label: '☀️ Fix it in Solar Aligner', detail: 'Brush off dust and aim the panels (best result).', opensMinigame: 'solarAligner', resolves: true },
      { id: 'clean', label: '🧹 Quick clean', detail: 'Costs 4% battery. Removes some dust.', cost: { battery: 4 }, effects: { solarDust: -0.3 }, resolves: true },
      { id: 'later', label: '⏳ Deal with it later', detail: 'Panels stay dusty for now.', resolves: true },
    ],
  },

  oxygenLeak: {
    id: 'oxygenLeak', icon: '💨', topic: 'oxygen', kind: 'bad',
    title: 'Oxygen Leak!',
    kidText: 'A tiny hole in the habitat wall is letting air escape into space. Oxygen is dropping fast!',
    lesson: 'Space has no air, so any small hole lets the habitat air rush out. Leaks must be found and sealed quickly.',
    schedule: { day: 3, at: 0.2 }, random: { weight: 2, minDay: 4 },
    ongoing: { perSecond: { oxygen: -0.9 } },
    durationSeconds: null, // lasts until fixed
    choices: [
      { id: 'minigame', label: '🔍 Hunt the leak (Leak Hunter)', detail: 'Use the pressure sensor to find and seal the holes.', opensMinigame: 'leakHunter' },
      { id: 'patch', label: '🧰 Quick patch', detail: 'Uses 1 repair kit. Seals the leak right away.', cost: { repairKits: 1 }, resolves: true },
    ],
  },

  solarStorm: {
    id: 'solarStorm', icon: '☢️', topic: 'radiation', kind: 'bad',
    title: 'Solar Storm Warning!',
    kidText: 'The Sun just burst out a cloud of fast particles. They arrive soon! Send the crew to the storm shelter.',
    lesson: 'The Moon has no thick air or magnetic field to block Sun particles, so astronauts hide behind extra shielding.',
    schedule: { day: 4, at: 0.1 }, random: { weight: 1, minDay: 5 },
    warningSeconds: 18,
    durationSeconds: 20,
  },

  longShadow: {
    id: 'longShadow', icon: '⛰️', topic: 'power', kind: 'warn',
    title: 'Mountain Shadow Coming',
    kidText: 'At the Moon’s south pole the Sun stays low, so a mountain shadow will cover the solar panels for a while. Save battery!',
    lesson: 'When panels are in shadow, the outpost runs on batteries. Turning off extra machines saves energy.',
    schedule: { day: 5, at: 0.05 },
    warningSeconds: 10,
    durationSeconds: 28,
    modifiers: { solarMultiplier: 0 },
  },

  micrometeoroid: {
    id: 'micrometeoroid', icon: '☄️', topic: 'habitat', kind: 'bad',
    title: 'Micrometeoroid Hit',
    kidText: 'A space pebble smaller than a grain of rice hit the habitat at super speed! The wall is damaged.',
    lesson: 'With no air to slow them down, tiny space rocks hit the Moon very fast. Habitats need strong walls and repairs.',
    random: { weight: 3, minDay: 2 },
    onStart: { modules: { habitat: { health: -18 } } },
    choices: [
      { id: 'repair', label: '🧰 Repair now', detail: 'Uses 1 repair kit. Habitat +25.', cost: { repairKits: 1 }, effects: { modules: { habitat: { health: +25 } } }, resolves: true },
      { id: 'later', label: '⏳ Repair later', detail: 'Save the kit. The habitat stays damaged.', resolves: true },
    ],
  },

  generatorFault: {
    id: 'generatorFault', icon: '⚙️', topic: 'oxygen', kind: 'bad',
    title: 'Oxygen Machine Fault',
    kidText: 'The oxygen-making machine is making a funny noise. It is working worse than before.',
    lesson: 'Machines that keep astronauts alive need checks and spare parts, because the nearest shop is on Earth!',
    random: { weight: 2, minDay: 2 },
    onStart: { modules: { lifeSupport: { health: -30 } } },
    choices: [
      { id: 'repair', label: '🧰 Fix it now', detail: 'Uses 1 repair kit. Life Support +35.', cost: { repairKits: 1 }, effects: { modules: { lifeSupport: { health: +35 } } }, resolves: true },
      { id: 'later', label: '⏳ Keep it running', detail: 'It makes less oxygen until repaired.', resolves: true },
    ],
  },

  recyclerClog: {
    id: 'recyclerClog', icon: '🚰', topic: 'water', kind: 'warn',
    title: 'Water Recycler Clogged',
    kidText: 'The filter that cleans used water is clogged. Water is not being recycled!',
    lesson: 'Space stations clean and reuse almost all their water. Without recycling, water runs out fast.',
    random: { weight: 2, minDay: 2 },
    ongoing: { perSecond: { water: -0.16 } },
    durationSeconds: null,
    choices: [
      { id: 'clean', label: '🧽 Clean the filter', detail: 'Costs 8% battery. Fixes it.', cost: { battery: 8 }, resolves: true },
      { id: 'kit', label: '🧰 New filter', detail: 'Uses 1 repair kit. Fixes it.', cost: { repairKits: 1 }, resolves: true },
    ],
  },

  supplyLander: {
    id: 'supplyLander', icon: '🚀', topic: 'moon', kind: 'good',
    title: 'Supply Lander Arriving',
    kidText: 'A cargo lander from Earth has room for ONE crate. Which one does the outpost need most?',
    lesson: 'Sending supplies from Earth is slow and costly, so a Moon base must choose carefully and make what it can.',
    schedule: { day: 6, at: 0.3 }, random: { weight: 1, minDay: 3 },
    choices: [
      { id: 'food', label: '🥫 Food crate', detail: 'Food +30', effects: { resources: { food: +30 } }, resolves: true },
      { id: 'parts', label: '🧰 Spare parts', detail: 'Repair kits +2', effects: { inventory: { repairKits: +2 } }, resolves: true },
      { id: 'water', label: '💧 Water tanks', detail: 'Water +30', effects: { resources: { water: +30 } }, resolves: true },
    ],
  },

  rockDiscovery: {
    id: 'rockDiscovery', icon: '🪨', topic: 'moon', kind: 'good',
    title: 'Interesting Rock Found!',
    kidText: 'The rover found a shiny rock near a crater. Scientists want to study it!',
    lesson: 'Moon rocks tell the story of how the Moon and Earth formed.',
    random: { weight: 2, minDay: 1 },
    onStart: { research: +8 },
  },
};

export const EVENT_IDS = Object.keys(MISSION_EVENTS);

