// C-S1 — Master simulation step and player actions (pure, deterministic).

import { BALANCE } from '../data/gameBalance.js';
import { OBJECTIVES } from '../data/objectives.js';
import { clamp, addLog } from './util.js';
import { tickPower, computePower } from './PowerSystem.js';
import { tickLifeSupport } from './LifeSupportSystem.js';
import { tickFood, tickLab } from './FoodSystem.js';
import { tickRadiation } from './RadiationSystem.js';
import { tickHabitat, MODULE_NAMES } from './HabitatSystem.js';
import { tickMissionEvents, finishEventsByType, resolveEventDecision } from './MissionEventSystem.js';

export function checkObjectives(state) {
  for (const obj of OBJECTIVES) {
    if (!state.objectives[obj.id] && obj.check(state)) {
      state.objectives[obj.id] = true;
      addLog(state, 'good', `✅ Objective complete: ${obj.text}`);
    }
  }
}

export function tickCrewHealth(state, dt, B) {
  const r = state.resources;
  const c = state.crew;
  const h = state.modules.habitat;
  let drain = 0;

  if (r.oxygen < B.crewHealth.lowOxygen) drain += B.crewHealth.lowOxygenDrain;
  if (r.food <= 0) drain += B.crewHealth.noFoodDrain;
  if (r.water <= 0) drain += B.crewHealth.noWaterDrain;
  if (c.radiationDose >= B.radiation.dangerDose) drain += B.crewHealth.radiationDrain;
  if (h.health < B.crewHealth.badHabitat) drain += B.crewHealth.badHabitatDrain;

  if (drain > 0) {
    c.health = clamp(c.health - drain * dt);
  } else if (r.oxygen > 40 && r.food > 20 && r.water > 20 && c.radiationDose < 50 && h.health > 40) {
    c.health = clamp(c.health + B.crewHealth.recover * dt);
  }
}

export function advanceSimulationStep(state, dt, B = BALANCE) {
  if (state.mission.status !== 'running' || state.mission.inMinigame || state.mission.speed === 0) {
    return;
  }

  // Advance mission clock
  state.mission.tick += 1;
  state.mission.elapsed = Math.round((state.mission.elapsed + dt) * 100) / 100;
  const dayLen = B.time.dayLengthSeconds;
  const totalDays = Math.floor(state.mission.elapsed / dayLen) + 1;
  const prevDay = state.mission.day;
  state.mission.day = Math.min(B.time.missionDays, totalDays);
  state.mission.timeOfDay = (state.mission.elapsed % dayLen) / dayLen;
  state.mission.isDaylight = state.mission.timeOfDay < B.time.daylightFraction;

  if (state.mission.day !== prevDay && totalDays <= B.time.missionDays) {
    addLog(state, 'info', `🌅 Mission Day ${state.mission.day} has begun!`);
  }

  // Decrement action cooldowns
  for (const k of Object.keys(state.cooldowns)) {
    if (state.cooldowns[k] > 0) {
      state.cooldowns[k] = Math.max(0, Math.round((state.cooldowns[k] - dt) * 10) / 10);
    }
  }

  // Tick systems in fixed deterministic order
  tickPower(state, dt, B);
  tickLifeSupport(state, dt, B);
  tickFood(state, dt, B);
  tickLab(state, dt, B);
  tickRadiation(state, dt, B);
  tickHabitat(state, dt, B);
  tickMissionEvents(state, dt, B);
  tickCrewHealth(state, dt, B);
  checkObjectives(state);

  // Check lose condition
  if (state.crew.health <= 0) {
    state.mission.status = 'lost';
    let reason = 'Crew health dropped to zero.';
    if (state.resources.oxygen <= 5) reason = 'Oxygen ran dangerously low, so Mission Control evacuated the crew.';
    else if (state.resources.water <= 0) reason = 'Water supplies ran out, so Mission Control brought the crew home early.';
    else if (state.resources.food <= 0) reason = 'Food supplies ran out, so Mission Control ended the mission early.';
    else if (state.crew.radiationDose >= B.radiation.dangerDose) reason = 'Radiation exposure climbed too high during solar storms.';
    state.mission.outcomeReason = reason;
    state.mission.stars = 0;
    addLog(state, 'bad', `🚨 Mission ended early: ${reason}`);
    return;
  }

  // Check win condition (survived all 7 mission days)
  if (state.mission.elapsed >= B.time.missionDays * dayLen) {
    state.mission.status = 'won';
    const objCount = Object.values(state.objectives).filter(Boolean).length;
    let stars = 1;
    if (state.resources.research >= B.win.researchGoal) stars += 1;
    if (objCount >= B.win.objectivesForStar) stars += 1;
    state.mission.stars = stars;
    state.mission.outcomeReason = `Your crew stayed healthy for all ${B.time.missionDays} lunar mission days and collected ${Math.round(state.resources.research)} research points!`;
    addLog(state, 'good', `🎉 Mission Accomplished! You earned ${stars} / 3 stars!`);
  }
}

export function applyPlayerAction(state, action, B = BALANCE) {
  if (!action || typeof action.type !== 'string') {
    return { ok: false, code: 'INVALID_ACTION', message: 'Missing action type.' };
  }

  switch (action.type) {
    case 'startMission': {
      state.mission.status = 'running';
      addLog(state, 'good', '🚀 Mission started! Keep your 4 astronauts healthy for 7 days.');
      const p = computePower(state, B);
      state.power.generation = Math.round(p.generation * 10) / 10;
      state.power.consumption = p.consumption;
      state.power.net = Math.round(p.net * 10) / 10;
      return { ok: true, code: 'MISSION_STARTED', message: 'Mission started!' };
    }

    case 'finishTutorial': {
      state.mission.tutorialDone = true;
      return { ok: true, code: 'TUTORIAL_DONE', message: 'Tutorial finished.' };
    }

    case 'setSpeed': {
      const s = Number(action.speed);
      if (![0, 1, 2, 3].includes(s)) {
        return { ok: false, code: 'BAD_SPEED', message: 'Speed must be 0, 1, 2, or 3.' };
      }
      state.mission.speed = s;
      return { ok: true, code: 'SPEED_SET', message: s === 0 ? 'Mission paused.' : `Speed set to ${s}×.` };
    }

    case 'toggleModule': {
      const id = action.moduleId;
      if (!['lifeSupport', 'greenhouse', 'lab'].includes(id)) {
        return { ok: false, code: 'CANNOT_TOGGLE', message: 'That building cannot be switched off.' };
      }
      const mod = state.modules[id];
      mod.online = !mod.online;
      const p = computePower(state, B);
      state.power.generation = Math.round(p.generation * 10) / 10;
      state.power.consumption = p.consumption;
      state.power.net = Math.round(p.net * 10) / 10;
      const label = MODULE_NAMES[id] || id;
      addLog(state, 'info', `${mod.online ? '🟢' : '⚪'} ${label} switched ${mod.online ? 'ON' : 'OFF'}.`);
      return { ok: true, code: 'MODULE_TOGGLED', message: `${label} is now ${mod.online ? 'ON' : 'OFF'}.` };
    }

    case 'repairModule': {
      const id = action.moduleId;
      const mod = state.modules[id];
      if (!mod) return { ok: false, code: 'UNKNOWN_MODULE', message: 'Unknown building.' };
      if (state.inventory.repairKits <= 0) {
        return { ok: false, code: 'NO_REPAIR_KITS', message: 'No repair kits left! Wait for a Supply Lander.' };
      }
      if (mod.health >= 99) {
        return { ok: false, code: 'ALREADY_HEALTHY', message: `${MODULE_NAMES[id]} is already in great shape.` };
      }
      state.inventory.repairKits -= 1;
      mod.health = clamp(mod.health + B.actions.repairAmount);
      state.stats.repairs += 1;
      addLog(state, 'good', `🧰 Repaired ${MODULE_NAMES[id]} (+${B.actions.repairAmount}% condition).`);
      return { ok: true, code: 'REPAIRED', message: `Repaired ${MODULE_NAMES[id]}!` };
    }

    case 'plantCrops': {
      const gh = state.modules.greenhouse;
      if (gh.planted) return { ok: false, code: 'ALREADY_PLANTED', message: 'Crops are already planted.' };
      gh.planted = true;
      gh.growth = 0;
      addLog(state, 'info', '🌱 Planted fresh space-lettuce seeds in the Greenhouse.');
      return { ok: true, code: 'PLANTED', message: 'Seeds planted!' };
    }

    case 'harvestCrops': {
      const gh = state.modules.greenhouse;
      if (!gh.planted || gh.growth < 100) {
        return { ok: false, code: 'NOT_READY', message: 'Crops are still growing!' };
      }
      state.resources.food = clamp(state.resources.food + B.greenhouse.harvestFood);
      gh.growth = 0;
      gh.planted = true; // Auto-replant so kids don't get stuck, or let them harvest & keep growing
      state.stats.harvests += 1;
      checkObjectives(state);
      addLog(state, 'good', `🥬 Harvested space greens! Food +${B.greenhouse.harvestFood}% (and replanted fresh seeds).`);
      return { ok: true, code: 'HARVESTED', message: `Harvested! Food +${B.greenhouse.harvestFood}%.` };
    }

    case 'collectIce': {
      if (state.cooldowns.collectIce > 0) {
        return { ok: false, code: 'COOLDOWN', message: `Rover is still recharging (${Math.ceil(state.cooldowns.collectIce)}s).` };
      }
      if (state.resources.battery < B.actions.iceBattery) {
        return { ok: false, code: 'LOW_BATTERY', message: `Need ${B.actions.iceBattery}% battery to send the rover.` };
      }
      state.resources.battery = clamp(state.resources.battery - B.actions.iceBattery);
      state.resources.water = clamp(state.resources.water + B.actions.iceWater);
      state.cooldowns.collectIce = B.actions.iceCooldown;
      addLog(state, 'good', `🧊 Rover mined crater water ice! Water +${B.actions.iceWater}%, Battery −${B.actions.iceBattery}%.`);
      return { ok: true, code: 'ICE_COLLECTED', message: `Rover brought back crater ice! Water +${B.actions.iceWater}%.` };
    }

    case 'buildShielding': {
      if (state.shieldLevel >= B.actions.shieldMax) {
        return { ok: false, code: 'MAX_SHIELD', message: 'Regolith shielding is already at maximum level (3/3).' };
      }
      if (state.cooldowns.buildShielding > 0) {
        return { ok: false, code: 'COOLDOWN', message: `Shielding crew is resting (${Math.ceil(state.cooldowns.buildShielding)}s).` };
      }
      if (state.resources.battery < B.actions.shieldBattery) {
        return { ok: false, code: 'LOW_BATTERY', message: `Need ${B.actions.shieldBattery}% battery to pack regolith shielding.` };
      }
      if (state.inventory.repairKits < B.actions.shieldKits) {
        return { ok: false, code: 'NO_KITS', message: `Need ${B.actions.shieldKits} repair kit for shielding bags.` };
      }
      state.resources.battery = clamp(state.resources.battery - B.actions.shieldBattery);
      state.inventory.repairKits -= B.actions.shieldKits;
      state.shieldLevel += 1;
      state.cooldowns.buildShielding = B.actions.shieldCooldown;
      checkObjectives(state);
      addLog(state, 'good', `⛏️ Packed lunar regolith bags onto the Habitat! Shield level is now ${state.shieldLevel}/3.`);
      return { ok: true, code: 'SHIELD_BUILT', message: `Shielding upgraded to Level ${state.shieldLevel}/3!` };
    }

    case 'cleanPanels': {
      if (state.cooldowns.cleanPanels > 0) {
        return { ok: false, code: 'COOLDOWN', message: `Brushes recharging (${Math.ceil(state.cooldowns.cleanPanels)}s).` };
      }
      if (state.resources.battery < B.actions.cleanBattery) {
        return { ok: false, code: 'LOW_BATTERY', message: `Need ${B.actions.cleanBattery}% battery.` };
      }
      state.resources.battery = clamp(state.resources.battery - B.actions.cleanBattery);
      state.modules.solar.dust = clamp(state.modules.solar.dust - B.actions.cleanDust, 0, 0.9);
      state.cooldowns.cleanPanels = B.actions.cleanCooldown;
      const p = computePower(state, B);
      state.power.generation = Math.round(p.generation * 10) / 10;
      state.power.net = Math.round(p.net * 10) / 10;
      addLog(state, 'good', '🧹 Brushed Moon dust off the solar panels.');
      return { ok: true, code: 'PANELS_CLEANED', message: 'Brushed off some Moon dust!' };
    }

    case 'setShelter': {
      const on = Boolean(action.on);
      state.crew.sheltered = on;
      const p = computePower(state, B);
      state.power.generation = Math.round(p.generation * 10) / 10;
      state.power.consumption = p.consumption;
      state.power.net = Math.round(p.net * 10) / 10;
      addLog(
        state,
        on ? 'info' : 'good',
        on
          ? '🛡️ Crew moved into the inner storm shelter. Science Lab is paused while they shelter.'
          : '👨‍🚀 Crew returned to their stations. Science Lab is active again!'
      );
      return { ok: true, code: 'SHELTER_SET', message: on ? 'Crew in storm shelter.' : 'Crew back on duty.' };
    }

    case 'resolveDecision': {
      return resolveEventDecision(state, action.instanceId, action.choiceId);
    }

    case 'setMinigameOpen': {
      state.mission.inMinigame = Boolean(action.open);
      return { ok: true, code: 'MINIGAME_STATE', message: 'Minigame state updated.' };
    }

    case 'completeMinigame': {
      state.mission.inMinigame = false;
      const gameId = action.gameId;
      const success = Boolean(action.success);
      const score = clamp(Number(action.score) || 0, 0, 1);

      if (gameId === 'leakHunter') {
        if (success) {
          finishEventsByType(state, 'oxygenLeak', 'minigame-sealed');
          state.resources.oxygen = clamp(state.resources.oxygen + B.minigames.leakHunter.oxygenRestore);
          state.resources.research = clamp(state.resources.research + B.minigames.leakHunter.researchReward);
          state.modules.habitat.health = clamp(state.modules.habitat.health + 15);
          state.stats.minigameWins.leakHunter += 1;
          addLog(
            state,
            'good',
            `🔍 Leak Hunter complete! Sealed all hull leaks (+${B.minigames.leakHunter.oxygenRestore}% O₂, +${B.minigames.leakHunter.researchReward} Research).`
          );
        } else {
          // Even if timer ran out, partial patch slows the leak by half
          for (const inst of state.activeEvents) {
            if (inst.eventId === 'oxygenLeak') inst.effectScale = 0.45;
          }
          state.resources.oxygen = clamp(state.resources.oxygen + 4);
          addLog(state, 'warn', '🔍 Leak Hunter: sealed some leaks, slowing the air loss. Try again or use a Repair Kit!');
        }
        checkObjectives(state);
        return { ok: true, code: 'LEAK_HUNTER_DONE', message: success ? 'All leaks sealed!' : 'Partial patch applied.' };
      }

      if (gameId === 'solarAligner') {
        const align = Math.max(B.minigames.solarAligner.minAlignment, Math.round((0.55 + score * 0.45) * 100) / 100);
        state.modules.solar.alignment = align;
        state.modules.solar.dust = clamp(state.modules.solar.dust * (1 - Math.max(0.6, score)), 0, 0.9);
        finishEventsByType(state, 'dustyPanels', 'minigame-cleaned');
        if (success) {
          state.resources.research = clamp(state.resources.research + B.minigames.solarAligner.researchReward);
          state.stats.minigameWins.solarAligner += 1;
          addLog(
            state,
            'good',
            `☀️ Solar Aligner complete! Panels aimed (${Math.round(align * 100)}%) and cleaned (+${B.minigames.solarAligner.researchReward} Research).`
          );
        } else {
          addLog(state, 'info', `☀️ Solar panels adjusted to ${Math.round(align * 100)}% alignment.`);
        }
        const p = computePower(state, B);
        state.power.generation = Math.round(p.generation * 10) / 10;
        state.power.net = Math.round(p.net * 10) / 10;
        checkObjectives(state);
        return { ok: true, code: 'SOLAR_ALIGNER_DONE', message: 'Solar panels updated!' };
      }

      return { ok: false, code: 'UNKNOWN_MINIGAME', message: 'Unknown minigame.' };
    }

    default:
      return { ok: false, code: 'UNKNOWN_ACTION', message: `Unknown action: ${action.type}` };
  }
}

