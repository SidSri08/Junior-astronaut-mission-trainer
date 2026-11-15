// All quantities and equipment layouts below are training simulation values.
export const TRAINING_TASKS = [
  { id: 'leakHunter', icon: '💨', title: 'Oxygen leak repair', module: 'lifeSupport', mechanic: 'Track a signal and patch the hull', reward: 'Restore air and habitat condition' },
  { id: 'circuitRepair', icon: '⚡', title: 'Circuit restoration', module: 'solar', mechanic: 'Rotate conductors to power a machine', reward: '+10 power reserve, +4 science' },
  { id: 'waterPurifier', icon: '💧', title: 'Water purification', module: 'lifeSupport', mechanic: 'Arrange filters, then test the water', reward: '+12 water, +4 science' },
  { id: 'greenhouseBalance', icon: '🌱', title: 'Greenhouse management', module: 'greenhouse', mechanic: 'Balance lamps, mist and airflow', reward: '+8 food, +4 science' },
  { id: 'roverExplorer', icon: '🛞', title: 'Lunar rover expedition', module: 'lab', mechanic: 'Drive around craters, collect and return', reward: '+8 water, +8 science' },
  { id: 'shelterResponse', icon: '🛡️', title: 'Solar storm response', module: 'habitat', mechanic: 'Secure equipment and shelter the crew', reward: 'Reduce exposure and protect the crew' },
  { id: 'sampleAnalysis', icon: '🔬', title: 'Sample identification', module: 'lab', mechanic: 'Inspect clues and sort lunar samples', reward: '+10 science and a discovery' },
  { id: 'solarAligner', icon: '☀️', title: 'Solar calibration', module: 'solar', mechanic: 'Clean dust and aim the panels', reward: 'Improve power generation' },
  { id: 'siteSelector', icon: '🧭', title: 'Site survey', module: 'comms', mechanic: 'Scan and compare terrain', reward: '+5 water, +4 science' },
  { id: 'moduleLayout', icon: '🏗️', title: 'Outpost layout', module: 'habitat', mechanic: 'Plan safe zones within a cable budget', reward: '+5 habitat condition, +4 science' },
  { id: 'powerRouter', icon: '🔌', title: 'Power allocation', module: 'solar', mechanic: 'Balance breakers through two shadow waves', reward: '+8 power reserve, +4 science' },
  { id: 'shieldBuilder', icon: '🪨', title: 'Shield workshop', module: 'habitat', mechanic: 'Balance layers against a mass budget', reward: '+1 shield level, +4 science' },
  { id: 'commsDelay', icon: '📡', title: 'Earth signal relay', module: 'comms', mechanic: 'Aim the dish and wait for acknowledgments', reward: 'Improve signal quality, +4 science' },
];
export const taskById = (id) => TRAINING_TASKS.find((task) => task.id === id);
