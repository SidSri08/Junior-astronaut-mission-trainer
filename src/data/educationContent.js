// E-S4 / E1 — Child-friendly educational copy (ages 7–12):
// tutorial steps, building guides, resource explanations, glossary, and smart hints.

export const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    icon: '👩‍🚀',
    title: 'Welcome, Junior Commander!',
    body: 'You are the leader of a Moon base at the Lunar South Pole! Four astronauts are counting on you to keep them safe, happy, and well-fed for 7 Moon days while collecting 100 Science Points.',
    tip: '⏱️ Fast Moon Days: 1 day in this game is just 60 seconds so you can play a whole mission in a few minutes! (On the real Moon, one day-night cycle takes 29.5 Earth days!)',
  },
  {
    id: 'resources',
    icon: '📊',
    title: 'Check Your Astronaut Dashboard',
    body: 'Look at the top bar to check on your crew:\n• 💨 Air (Oxygen) — Do our astronauts have enough air?\n• 💧 Water & 🥬 Food — Are they hydrated and fed?\n• 🔋 Electricity — Is the battery charged?\n• 🛡️ Safety (Radiation) — How safe is our Moon home?',
    tip: '💡 Watch the Electricity number (+ or −). If it shows a minus (−), your battery is draining!',
  },
  {
    id: 'buildings',
    icon: '🏗️',
    title: 'Explore Your 3D Moon Base',
    body: 'Click any building on the Moon (or on the left menu) to peek inside! You can switch machines ON or OFF to save electricity, fix damage with Repair Kits, harvest space lettuce, or pile Moon dirt (regolith) on the roof as a radiation shield.',
    tip: '🎥 Drag with your mouse to spin the camera around your base, and scroll to zoom in close to the astronauts!',
  },
  {
    id: 'minigames',
    icon: '🎮',
    title: 'Play Two Space Training Games!',
    body: 'Whenever an alarm sounds—or anytime you want a boost—play your two training games:\n• 🔍 Leak Hunter: Use an ultrasonic scanner to find and patch hissing air leaks!\n• ☀️ Solar Aligner: Brush sticky Moon dust off your solar panels and aim them at the Sun!',
    tip: '🌟 Winning mini-games fixes base problems, boosts your supplies, AND earns bonus Science Points!',
  },
];

export const BUILDING_INFO = {
  habitat: {
    id: 'habitat',
    name: 'Crew Home & Storm Shelter',
    icon: '🏠',
    topic: 'habitat',
    role: 'Where your 4 astronauts sleep, eat, and stay safe! Inside is a special water-walled Storm Shelter.',
    howItWorks: 'Always stays on. Pack bags of Moon soil (regolith) onto the roof to block space radiation, and call the crew inside the Storm Shelter whenever a Solar Storm warning appears!',
  },
  lifeSupport: {
    id: 'lifeSupport',
    name: 'Air & Water Maker (Life Support)',
    icon: '💨',
    topic: 'oxygen',
    role: 'Uses electricity to split water into fresh breathing air (Oxygen) and recycles the crew’s water!',
    howItWorks: 'Uses 3 Electricity (W) and needs Water to make Oxygen. If a tiny meteor pokes a hole in the hull, play Leak Hunter to seal it!',
  },
  solar: {
    id: 'solar',
    name: 'Tall Solar Panels',
    icon: '☀️',
    topic: 'power',
    role: 'Tall solar towers that catch low sunlight at the Moon’s South Pole to charge your battery.',
    howItWorks: 'Sticky Moon dust and bad angles block sunlight! Play Solar Aligner to brush off the dust and aim the panels straight at the Sun.',
  },
  greenhouse: {
    id: 'greenhouse',
    name: 'Space Greenhouse',
    icon: '🌱',
    topic: 'food',
    role: 'Grows crunchy space lettuce and cherry tomatoes under glowing pink-purple LED lights!',
    howItWorks: 'Uses 3 Electricity (W) and a sip of Water while plants grow. When plants reach 100%, click Harvest for +30% Food!',
  },
  lab: {
    id: 'lab',
    name: 'Science Lab & Ice Rover',
    icon: '🔬',
    topic: 'moon',
    role: 'Studies Moon rocks and ice to earn Science Points, and sends the Rover to scoop ice from dark craters.',
    howItWorks: 'Uses 4 Electricity (W). Tip: If a mountain shadow blocks the Sun, turn the Lab OFF for a little while to save battery for Air!',
  },
};

export const RESOURCE_HELP = {
  oxygen: {
    label: 'Air (Oxygen)',
    question: 'Do our astronauts have enough air?',
    icon: '💨',
    explain: 'Do our astronauts have enough air? Astronauts breathe oxygen every second. The Air & Water Maker splits water to make fresh oxygen.',
  },
  water: {
    label: 'Clean Water',
    question: 'Do we have enough clean water?',
    icon: '💧',
    explain: 'Do we have enough clean water? Needed for drinking, making oxygen, and growing plants. Send the Rover to mine crater ice when low!',
  },
  food: {
    label: 'Space Food',
    question: 'Do we have enough food?',
    icon: '🥬',
    explain: 'Do we have enough food? Keeps your astronauts energized. Grow and harvest fresh space greens in the Greenhouse!',
  },
  battery: {
    label: 'Electricity',
    question: 'How much electricity is available?',
    icon: '🔋',
    explain: 'How much electricity is available? Solar panels charge the battery in sunlight. If it hits 0%, a blackout pauses machines until it recharges to 12%.',
  },
  radiation: {
    label: 'Radiation Safety',
    question: 'How safe is our Moon home?',
    icon: '🛡️',
    explain: 'How safe is our Moon home? Lower radiation (0%) is safest! Pack Moon soil shields on the Habitat and use the Storm Shelter during solar storms.',
  },
  crew: {
    label: 'Crew Health',
    question: 'Are our astronauts healthy?',
    icon: '👩‍🚀',
    explain: 'Are our astronauts healthy? Keep all 4 astronauts healthy for 7 Moon days with plenty of air, clean water, fresh food, and radiation protection!',
  },
  research: {
    label: 'Science Points',
    question: 'How much have we discovered?',
    icon: '🔬',
    explain: 'How much have we discovered? Earned by running the Science Lab and winning mini-games. Reach 100 points for a 3-star victory!',
  },
};

export const GLOSSARY = [
  {
    term: '🪨 Regolith (Moon Dirt)',
    meaning: 'The powdery grey dust and crushed rock covering the Moon, made by billions of years of meteoroids crashing into the surface.',
  },
  {
    term: '⚡ Electrolysis (Splitting Water)',
    meaning: 'Using electricity to split water (H₂O) into hydrogen and breathable oxygen (O₂). Real astronauts on the Space Station breathe air made this way!',
  },
  {
    term: '💨 ECLSS (Life Support)',
    meaning: 'Environmental Control and Life Support System — NASA’s name for the machines that make air, clean out carbon dioxide, and recycle water.',
  },
  {
    term: '🧊 Shadowed Crater (PSR)',
    meaning: 'Deep craters at the Moon’s poles where sunlight never reaches. Billions of tons of ancient water ice are frozen inside!',
  },
  {
    term: '☀️ Solar Storm',
    meaning: 'A wave of fast particles blasted out by the Sun. Since the Moon has no air or magnetic shield like Earth, astronauts hide inside thick shelter walls.',
  },
  {
    term: '🛠️ ISRU (Living Off the Land)',
    meaning: 'In-Situ Resource Utilization — using Moon ice for water and Moon dirt for shields instead of launching everything on rockets from Earth!',
  },
  {
    term: '☄️ Micrometeoroid (Space Pebble)',
    meaning: 'A tiny speck of space rock zooming faster than a bullet! Because the Moon has no atmosphere to burn them up, habitats need tough multi-layer walls.',
  },
  {
    term: '🏔️ South Pole Sunlight Ridges',
    meaning: 'High mountain peaks near the Moon’s South Pole catch low grazing sunlight for most of the year, right next door to dark icy craters!',
  },
];

export function getContextualHint(state) {
  const r = state.resources;
  const m = state.modules;
  const hasStorm = state.activeEvents.some((e) => e.eventId === 'solarStorm');
  const hasLeak = state.activeEvents.some((e) => e.eventId === 'oxygenLeak');

  if (hasStorm && !state.crew.sheltered) {
    return {
      kind: 'bad',
      mood: '🚨',
      text: 'Solar Storm incoming! Click "Send Crew to Storm Shelter" so your astronauts stay safe inside!',
    };
  }
  if (!hasStorm && state.crew.sheltered) {
    return {
      kind: 'warn',
      mood: '👩‍🚀',
      text: 'All clear! The Solar Storm has passed—click "All Clear: Exit Storm Shelter" so your crew can get back to science!',
    };
  }
  if (hasLeak) {
    return {
      kind: 'bad',
      mood: '🔍',
      text: 'Whoosh! Air is leaking from the hull! Play "Leak Hunter" or use a Repair Kit to patch it up!',
    };
  }
  if (state.power.brownout) {
    return {
      kind: 'bad',
      mood: '🔌',
      text: 'Power nap! Battery hit 0%. Switch OFF the Lab or Greenhouse so the solar panels can recharge the battery to 12%.',
    };
  }
  if (r.oxygen < 35) {
    if (!m.lifeSupport.online) {
      return {
        kind: 'bad',
        mood: '💨',
        text: 'Air is getting low because Life Support is turned OFF! Click Life Support and switch it ON.',
      };
    }
    if (r.water < 10) {
      return {
        kind: 'bad',
        mood: '💧',
        text: 'Life Support needs Water to make Oxygen! Click "Mine Crater Ice" to scoop up fresh water.',
      };
    }
    return {
      kind: 'warn',
      mood: '💨',
      text: 'Air is getting low! Play "Leak Hunter" or repair the Life Support building.',
    };
  }
  if (r.water < 28) {
    return {
      kind: 'warn',
      mood: '🧊',
      text: 'Water tank is under 30%! Click "Mine Crater Ice" to send the rover for frozen Moon water.',
    };
  }
  if (m.greenhouse.planted && m.greenhouse.growth >= 100) {
    return {
      kind: 'good',
      mood: '🥬',
      text: 'Yum! Your space lettuce is 100% grown! Click "Harvest Ready Crops!" for +30% Food!',
    };
  }
  if (r.battery < 30 && state.power.net < 0) {
    return {
      kind: 'warn',
      mood: '🔋',
      text: 'Battery is draining! Play "Solar Aligner" for more solar power, or switch the Science Lab OFF for a bit.',
    };
  }
  const damagedEntry = Object.entries(m).find(([, mod]) => mod && mod.health < 50);
  if (damagedEntry) {
    const [modId] = damagedEntry;
    const modName = BUILDING_INFO[modId]?.name || 'a building';
    return {
      kind: 'warn',
      mood: '🧰',
      text: `${modName} is damaged! Click it and use a Repair Kit (+40% Health) so it keeps working well.`,
    };
  }
  if (m.solar.dust > 0.35 || m.solar.alignment < 0.75) {
    return {
      kind: 'info',
      mood: '☀️',
      text: 'Friendly tip: Your solar panels have Moon dust on them! Play "Solar Aligner" to boost electricity!',
    };
  }
  if (state.shieldLevel === 0 && state.mission.day >= 2) {
    return {
      kind: 'info',
      mood: '🛡️',
      text: 'Commander tip: Click "Pack Regolith Shield" to add Moon-soil protection before a Solar Storm arrives!',
    };
  }
  if (r.research >= 75) {
    return {
      kind: 'good',
      mood: '🌟',
      text: 'Amazing progress! You are super close to 100 Science Points! Keep your crew happy and safe!',
    };
  }
  return {
    kind: 'info',
    mood: '😊',
    text: 'Great job, Commander! Your Moon home is running smoothly. Click any building or play a training game!',
  };
}
