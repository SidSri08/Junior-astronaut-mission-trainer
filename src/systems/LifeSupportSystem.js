// C-S1 — oxygen and water: crew breathing/drinking, oxygen generator, water recycler.
import { clamp, addLog, efficiency, isPowered } from './util.js';

export function tickLifeSupport(state, dt, B) {
  const r = state.resources;
  const ls = state.modules.lifeSupport;
  const prevO2 = r.oxygen;

  if (isPowered(state, 'lifeSupport', B)) {
    const eff = efficiency(ls.health, B.wear.brokenBelow);
    if (r.water > 0) {
      // Electrolysis (simplified): water is split to make oxygen.
      r.oxygen += B.lifeSupport.oxygenMake * eff * dt;
      r.water -= B.lifeSupport.waterForOxygen * eff * dt;
    }
    r.water += B.lifeSupport.waterRecycle * eff * dt;
  }

  // Crew breathes and drinks.
  r.oxygen -= B.crew.oxygenUse * dt;
  r.water -= B.crew.waterUse * dt;

  // A badly damaged habitat slowly leaks air.
  if (state.modules.habitat.health < 30) r.oxygen -= B.wear.lowHealthLeak * dt;

  r.oxygen = clamp(r.oxygen);
  r.water = clamp(r.water);

  if (prevO2 >= 30 && r.oxygen < 30) addLog(state, 'warn', '💨 Oxygen is getting low! Check that Life Support is ON and has power.');
}

