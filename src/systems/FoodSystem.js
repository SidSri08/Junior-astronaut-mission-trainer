// C-S1 — food: crew eating and greenhouse crop growth. Also the science lab.
import { clamp, addLog, efficiency, isPowered } from './util.js';

export function tickFood(state, dt, B) {
  const r = state.resources;
  const gh = state.modules.greenhouse;
  const prevFood = r.food;

  r.food = clamp(r.food - B.crew.foodUse * dt);

  if (gh.planted && gh.growth < 100 && isPowered(state, 'greenhouse', B) && r.water > 0) {
    const eff = efficiency(gh.health, B.wear.brokenBelow);
    const before = gh.growth;
    gh.growth = clamp(gh.growth + B.greenhouse.growthPerSecond * eff * dt);
    r.water = clamp(r.water - B.greenhouse.waterUse * dt);
    if (before < 100 && gh.growth >= 100) addLog(state, 'good', '🥬 Crops are ready! Open the Greenhouse and harvest them.');
  }

  if (prevFood >= 25 && r.food < 25) addLog(state, 'warn', '🥫 Food is running low. Grow and harvest crops in the Greenhouse.');
}

export function tickLab(state, dt, B) {
  if (state.crew.sheltered || !isPowered(state, 'lab', B)) return;
  const eff = efficiency(state.modules.lab.health, B.wear.brokenBelow);
  const commsBoost =
    state.modules.comms && state.modules.comms.online && !state.power.brownout
      ? 1 + (B.comms?.researchBonusMultiplier || 0.1)
      : 1;
  const before = state.resources.research;
  state.resources.research = clamp(before + B.lab.researchPerSecond * eff * commsBoost * dt);
  if (before < 100 && state.resources.research >= 100) addLog(state, 'good', '🏆 Research goal reached! Great science, Commander!');
}

