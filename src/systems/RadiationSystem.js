// C-S1 — radiation exposure. Dose is a 0–100 game bar (SIMULATION_VALUE), not sieverts.
import { clamp, isEventActive } from './util.js';

export function radiationRate(state, B) {
  const shield = 1 - state.shieldLevel * B.radiation.shieldReduction;
  let rate = B.radiation.background * shield;
  if (isEventActive(state, 'solarStorm')) {
    rate += state.crew.sheltered ? B.radiation.stormSheltered : B.radiation.stormUnsheltered * shield;
  }
  return rate;
}

export function tickRadiation(state, dt, B) {
  const storm = isEventActive(state, 'solarStorm');
  let dose = state.crew.radiationDose + radiationRate(state, B) * dt;
  if (!storm) dose -= B.radiation.recoveryPerSecond * dt;
  state.crew.radiationDose = clamp(dose);

  if (storm && !state.crew.sheltered) {
    const inst = state.activeEvents.find((e) => e.eventId === 'solarStorm' && e.phase === 'active');
    if (inst) inst.exposedSeconds = (inst.exposedSeconds || 0) + dt;
  }
}

