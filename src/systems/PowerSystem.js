// C-S1 — electrical power: solar generation, consumption, battery, blackouts.
import { clamp, addLog, efficiency } from './util.js';

export function solarMultiplier(state) {
  let mult = 1;
  for (const inst of state.activeEvents) {
    if (inst.phase === 'active' && inst.modifiers && typeof inst.modifiers.solarMultiplier === 'number') {
      mult *= inst.modifiers.solarMultiplier;
    }
  }
  return mult;
}

export function computePower(state, B) {
  const { modules, crew } = state;
  const solar = modules.solar;
  const generation = state.mission.isDaylight
    ? B.power.solarPeak * solar.alignment * (1 - solar.dust) * efficiency(solar.health, B.wear.brokenBelow) * solarMultiplier(state)
    : 0;

  let consumption = B.power.habitatBase + (crew.sheltered ? B.power.shelterExtra : 0);
  if (!state.power.brownout) {
    if (modules.lifeSupport.online) consumption += B.lifeSupport.power;
    if (modules.greenhouse.online) consumption += B.greenhouse.power;
    if (modules.lab.online && !crew.sheltered) consumption += B.lab.power;
    if (modules.comms && modules.comms.online) consumption += B.comms.power;
  }
  return { generation, consumption, net: generation - consumption };
}

export function tickPower(state, dt, B) {
  const p = computePower(state, B);
  state.power.generation = Math.round(p.generation * 10) / 10;
  state.power.consumption = p.consumption;
  state.power.net = Math.round(p.net * 10) / 10;

  const before = state.resources.battery;
  state.resources.battery = clamp(before + p.net * B.power.batteryPerUnit * dt);

  if (!state.power.brownout && state.resources.battery <= 0) {
    state.power.brownout = true;
    addLog(state, 'bad', '🔌 Blackout! The battery is empty. Machines stopped. Turn some off so the battery can recharge.');
  } else if (state.power.brownout && state.resources.battery >= B.power.brownoutRecover) {
    state.power.brownout = false;
    addLog(state, 'good', '🔋 Power is back! The battery recharged enough to restart the machines.');
  } else if (before >= B.power.lowWarning && state.resources.battery < B.power.lowWarning) {
    addLog(state, 'warn', '🔋 Battery is getting low. Turn off machines you do not need.');
  }
}

