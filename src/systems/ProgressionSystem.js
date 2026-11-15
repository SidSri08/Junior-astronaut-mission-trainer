import { taskById } from '../data/trainingTasks.js';

export const createProgression = () => ({ xp: 0, stars: 0, taskRecords: {}, rewardedAttempts: [], discoveries: [] });
export const commanderLevel = (xp = 0) => Math.floor(Math.max(0, xp) / 150) + 1;

export function recordTaskAchievement(state, action, token) {
  if (!taskById(action.gameId)) return;
  state.progression ||= createProgression();
  const p = state.progression;
  if (p.rewardedAttempts.includes(token)) return;
  p.rewardedAttempts.push(token);
  p.rewardedAttempts = p.rewardedAttempts.slice(-200);
  const quality = Math.max(0, Math.min(1, Number(action.qualityScore ?? action.score ?? 0)));
  const stars = action.success ? (quality >= 0.9 ? 3 : quality >= 0.7 ? 2 : 1) : 0;
  const previous = p.taskRecords[action.gameId] || { bestStars: 0, attempts: 0, bestQuality: 0 };
  p.stars += Math.max(0, stars - previous.bestStars);
  p.xp += action.success ? 25 + stars * 10 : 10;
  p.taskRecords[action.gameId] = { bestStars: Math.max(stars, previous.bestStars), attempts: previous.attempts + 1, bestQuality: Math.max(quality, previous.bestQuality) };
  if (action.gameId === 'sampleAnalysis' && action.success && !p.discoveries.includes('lunar-geologist')) p.discoveries.push('lunar-geologist');
  if (action.gameId === 'roverExplorer' && action.success && !p.discoveries.includes('trailblazer')) p.discoveries.push('trailblazer');
}

export function applyTrainingOutcome(state, action) {
  const success = Boolean(action.success);
  const add = (key, value) => { state.resources[key] = Math.max(0, Math.min(100, state.resources[key] + value)); };
  if (!success) {
    add('battery', -3);
    return;
  }
  const effects = {
    circuitRepair: { battery: 10, research: 4 }, waterPurifier: { water: 12, research: 4 },
    roverExplorer: { water: 8, research: 8 }, sampleAnalysis: { research: 10 },
    greenhouseBalance: { food: 8, research: 4 }, powerRouter: { battery: 8, research: 4 },
    siteSelector: { water: 5, research: 4 }, moduleLayout: { research: 4 },
    shelterResponse: { research: 4 }, shieldBuilder: { research: 4 }, commsDelay: { research: 4 },
  };
  for (const [key, amount] of Object.entries(effects[action.gameId] || {})) add(key, amount);
  if (action.gameId === 'moduleLayout') state.modules.habitat.health = Math.min(100, state.modules.habitat.health + 5);
  if (action.gameId === 'shieldBuilder') state.shieldLevel = Math.min(3, state.shieldLevel + 1);
  if (action.gameId === 'shelterResponse') { state.crew.sheltered = true; state.crew.radiationDose = Math.max(0, state.crew.radiationDose - 6); }
  if (action.gameId === 'commsDelay') state.modules.comms.signalQuality = Math.min(1.3, state.modules.comms.signalQuality + 0.1);
}
