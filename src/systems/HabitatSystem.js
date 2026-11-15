// C-S1 — habitat and equipment wear, dust build-up.
import { clamp, addLog } from './util.js';

const MODULES = ['lifeSupport', 'solar', 'greenhouse', 'lab', 'comms'];
const NAMES = {
  habitat: 'Habitat',
  lifeSupport: 'Life Support',
  solar: 'Solar Array',
  greenhouse: 'Greenhouse',
  lab: 'Science Lab',
  comms: 'Communications Relay',
};

export function tickHabitat(state, dt, B) {
  const h = state.modules.habitat;
  const before = { habitat: h.health };
  h.health = clamp(h.health - B.wear.habitatPerSecond * dt);
  for (const id of MODULES) {
    const m = state.modules[id];
    before[id] = m.health;
    m.health = clamp(m.health - B.wear.modulePerSecond * dt);
  }
  // Fine dust slowly settles on the panels.
  state.modules.solar.dust = clamp(state.modules.solar.dust + 0.0006 * dt, 0, 0.9);

  for (const id of Object.keys(before)) {
    const now = state.modules[id].health;
    if (before[id] >= 40 && now < 40) addLog(state, 'warn', `🔧 ${NAMES[id]} needs repair (health below 40%).`);
    if (before[id] >= B.wear.brokenBelow && now < B.wear.brokenBelow) addLog(state, 'bad', `🛑 ${NAMES[id]} has broken down! Repair it to make it work again.`);
  }
}

export { NAMES as MODULE_NAMES };

