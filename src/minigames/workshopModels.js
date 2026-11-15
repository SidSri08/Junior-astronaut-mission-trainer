// Pure task models. Equipment, budgets and sample readings are simulated.
export const rotatePorts = (ports, turns) => ports.map((port) => (port + turns) % 4);
// Ports: north=0, east=1, south=2, west=3. A solvable snake through all nine tiles.
export const CIRCUIT_PORTS = [[3, 1], [3, 1], [3, 2], [1, 2], [1, 3], [0, 3], [0, 1], [3, 1], [3, 1]];
export function traceCircuit(rotations) {
  const lit = [];
  let index = 0;
  let incoming = 3;
  while (!lit.includes(index)) {
    const ports = rotatePorts(CIRCUIT_PORTS[index], rotations[index]);
    if (!ports.includes(incoming)) break;
    lit.push(index);
    const outgoing = ports.find((port) => port !== incoming);
    if (index === 8 && outgoing === 1) return { lit, connected: true };
    const x = index % 3, y = Math.floor(index / 3);
    const nx = x + [0, 1, 0, -1][outgoing], ny = y + [-1, 0, 1, 0][outgoing];
    if (nx < 0 || nx > 2 || ny < 0 || ny > 2) break;
    index = ny * 3 + nx;
    incoming = (outgoing + 2) % 4;
  }
  return { lit, connected: false };
}

export const FILTER_STAGES = [
  { id: 'screen', icon: '▦', name: 'Particle screen', clue: 'Catch grit before it reaches the other filters.' },
  { id: 'carbon', icon: '◆', name: 'Carbon filter', clue: 'Remove some dissolved impurities after the grit.' },
  { id: 'membrane', icon: '≋', name: 'Fine membrane', clue: 'A finer separation stage follows the carbon filter.' },
  { id: 'disinfect', icon: '✦', name: 'Disinfection', clue: 'Treat the water after filtration, before storage.' },
];
export const correctFilterOrder = (order) => FILTER_STAGES.every((stage, i) => order[i] === stage.id);

export const ROVER_MAP = { width: 8, height: 6, base: 40, samples: [2, 22, 37], rocks: [9, 10, 12, 17, 20, 26, 27, 28, 34] };
export function moveRover(position, direction, battery) {
  const { width, height, rocks } = ROVER_MAP;
  const x = position % width, y = Math.floor(position / width);
  const delta = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] }[direction];
  if (!delta || battery <= 0) return { position, battery, moved: false };
  const nx = x + delta[0], ny = y + delta[1], next = ny * width + nx;
  if (nx < 0 || nx >= width || ny < 0 || ny >= height || rocks.includes(next)) return { position, battery, moved: false };
  return { position: next, battery: battery - 1, moved: true };
}

export const LAB_SAMPLES = [
  { id: 'A', color: '#727a87', shape: 'smooth', reading: 'Dark, fine-grained volcanic rock', bin: 'basalt' },
  { id: 'B', color: '#d9d6c9', shape: 'crystal', reading: 'Light-colored rock rich in feldspar', bin: 'anorthosite' },
  { id: 'C', color: '#a58a7b', shape: 'fragments', reading: 'Different rock fragments joined together', bin: 'breccia' },
];
