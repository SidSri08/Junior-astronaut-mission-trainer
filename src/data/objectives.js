// Department C (C-S4 owner of record) — mission objectives shown in the HUD checklist.
// `check(state)` is a pure function evaluated after each step/action.

export const OBJECTIVES = [
  { id: 'firstHarvest', icon: '🥬', text: 'Harvest your first crop', check: (s) => s.stats.harvests >= 1 },
  { id: 'research50', icon: '🔬', text: 'Collect 50 research points', check: (s) => s.resources.research >= 50 },
  { id: 'shelterStorm', icon: '🛡️', text: 'Keep the crew safe in a solar storm', check: (s) => s.stats.stormsSheltered >= 1 },
  { id: 'leakHunter', icon: '🔍', text: 'Win Leak Hunter', check: (s) => s.stats.minigameWins.leakHunter >= 1 },
  { id: 'solarAligner', icon: '☀️', text: 'Win Solar Aligner', check: (s) => s.stats.minigameWins.solarAligner >= 1 },
  { id: 'buildShield', icon: '⛏️', text: 'Build regolith shielding', check: (s) => s.shieldLevel >= 1 },
  { id: 'research100', icon: '🏆', text: 'Reach 100 research points', check: (s) => s.resources.research >= 100 },
];

