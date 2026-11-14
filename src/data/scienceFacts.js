// Department D (D1 / D-S4 owner of record) — Verified Scientific Fact & Source Module.
// Plain ES module, zero imports. Every entry in FACTS carries label: 'REAL_SCIENTIFIC_FACT'
// and maps to one or more canonical entries in SOURCES.

export const SOURCES = {
  S01: {
    title: 'Earth’s Moon — Overview & Facts',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/moon/facts/',
    accessed: '2026-11-14',
  },
  S02: {
    title: 'Moon’s South Pole — Water Ice & Illumination',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/moon/lunar-water/',
    accessed: '2026-11-14',
  },
  S03: {
    title: 'LCROSS (Lunar Crater Observation and Sensing Satellite) Mission Overview',
    publisher: 'NASA Science',
    url: 'https://science.nasa.gov/mission/lcross/',
    accessed: '2026-11-14',
  },
  S04: {
    title: 'Artemis Program Overview',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/humans-in-space/artemis/',
    accessed: '2026-11-14',
  },
  S05: {
    title: 'Environmental Control and Life Support System (ECLSS)',
    publisher: 'NASA Marshall Space Flight Center',
    url: 'https://www.nasa.gov/missions/station/iss-research/environmental-control-and-life-support-system/',
    accessed: '2026-11-14',
  },
  S06: {
    title: 'In-Situ Resource Utilization (ISRU) — Oxygen from Regolith and Water',
    publisher: 'NASA Space Technology Mission Directorate',
    url: 'https://www.nasa.gov/space-technology-mission-directorate/isru/',
    accessed: '2026-11-14',
  },
  S07: {
    title: 'Solar Power & Fission Surface Power on the Moon',
    publisher: 'NASA Glenn Research Center',
    url: 'https://www.nasa.gov/space-technology-mission-directorate/tdm/fission-surface-power/',
    accessed: '2026-11-14',
  },
  S08: {
    title: 'Growing Plants in Space (Veggie & Advanced Plant Habitat)',
    publisher: 'NASA Kennedy Space Center',
    url: 'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/',
    accessed: '2026-11-14',
  },
  S09: {
    title: 'Why Space Radiation Matters',
    publisher: 'NASA Human Research Program',
    url: 'https://www.nasa.gov/hrp/radiation/why-space-radiation-matters/',
    accessed: '2026-11-14',
  },
  S10: {
    title: 'Lunar Regolith, Dust Hazards & Micrometeoroid Environment',
    publisher: 'NASA Johnson Space Center / Astromaterials',
    url: 'https://science.nasa.gov/moon/regolith/',
    accessed: '2026-11-14',
  },
  S11: {
    title: '3D-Printed Lunar Habitats & Regolith Construction (MMPACT / ICON)',
    publisher: 'NASA Marshall Space Flight Center',
    url: 'https://www.nasa.gov/directorates/stmd/tech-demo-missions-program/moon-to-mars-planetary-autonomous-construction-technologies-mmpact/',
    accessed: '2026-11-14',
  },
  S12: {
    title: 'Spacesuits and Pressurized Habitation on the Moon',
    publisher: 'NASA',
    url: 'https://www.nasa.gov/humans-in-space/spacesuits/',
    accessed: '2026-11-14',
  },
};

export const FACTS = [
  // --- MOON (4 facts) ---
  {
    id: 'F-MON-01',
    topic: 'moon',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Gravity on the Moon is about one-sixth as strong as on Earth, so you would weigh much less there!',
    sourceIds: ['S01'],
    caveat: 'Surface gravity on the Moon is approximately 1.62 m/s² (about 16.5% of Earth’s 9.81 m/s²); mass stays constant while weight decreases.',
  },
  {
    id: 'F-MON-02',
    topic: 'moon',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'One full day-and-night cycle on the Moon lasts about 29 and a half Earth days.',
    sourceIds: ['S01'],
    caveat: 'The lunar synodic day (sunrise to sunrise) is ~29.53 Earth days; mid-latitude sites experience ~14.75 Earth days of daylight and ~14.75 days of darkness.',
  },
  {
    id: 'F-MON-03',
    topic: 'moon',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'NASA’s Artemis missions target the Moon’s south pole because high ridges get lots of sunlight while dark craters hold water ice.',
    sourceIds: ['S02', 'S04'],
    caveat: 'Because the Moon’s axial tilt is only ~1.54°, illuminated peaks near the south pole receive extended sunlight while adjacent crater floors remain in permanent shadow.',
  },
  {
    id: 'F-MON-04',
    topic: 'moon',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'The Moon is covered in powdery gray soil and broken rock called regolith, made by billions of years of meteorite crashes.',
    sourceIds: ['S01', 'S10'],
    caveat: 'Lunar regolith contains no organic matter or liquid water; grains are angular, abrasive, and rich in silicate minerals and impact glass.',
  },

  // --- OXYGEN (4 facts) ---
  {
    id: 'F-OXY-01',
    topic: 'oxygen',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'The Moon has almost no air, so astronauts must live inside sealed habitats and wear spacesuits outside to breathe.',
    sourceIds: ['S01', 'S12'],
    caveat: 'The Moon has an extremely tenuous surface-bounded exosphere (~10⁻¹² bar), which is effectively a hard vacuum for human physiology.',
  },
  {
    id: 'F-OXY-02',
    topic: 'oxygen',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Spacecraft life-support machines split water molecules with electricity to make fresh oxygen for astronauts to breathe.',
    sourceIds: ['S05'],
    caveat: 'The ISS Oxygen Generation Assembly electrolyzes purified water into breathable O₂ and byproduct H₂ (which is vented or combined with CO₂ in a Sabatier reactor).',
  },
  {
    id: 'F-OXY-03',
    topic: 'oxygen',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Even a tiny hole in a space habitat wall lets air rush out into space, so crews use sensors to find and seal leaks.',
    sourceIds: ['S05', 'S12'],
    caveat: 'Small cabin leaks typically depressurize a large module slowly over hours or days, monitored via pressure transducers and ultrasonic leak detectors.',
  },
  {
    id: 'F-OXY-04',
    topic: 'oxygen',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Lunar rocks and soil are nearly half oxygen by weight, locked tightly inside minerals that future machines can bake out!',
    sourceIds: ['S06', 'S10'],
    caveat: 'Lunar regolith is roughly 40–45% oxygen by mass bound in metal oxides (e.g., ilmenite, silicates); extracting it requires high-temperature carbothermal, hydrogen, or molten-salt electrolysis.',
  },

  // --- WATER (4 facts) ---
  {
    id: 'F-WAT-01',
    topic: 'water',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'In 2009, NASA’s LCROSS spacecraft crashed into shadowy Cabeus crater and proved real water ice hides near the Moon’s south pole.',
    sourceIds: ['S02', 'S03'],
    caveat: 'LCROSS detected ~5.6 ± 2.9% water ice by mass in the excavated Cabeus ejecta plume, alongside volatile compounds such as CO, H₂S, and NH₃.',
  },
  {
    id: 'F-WAT-02',
    topic: 'water',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Deep craters at the Moon’s poles never see sunlight, staying freezing cold for billions of years so water ice never melts.',
    sourceIds: ['S02'],
    caveat: 'Permanently Shadowed Regions (PSRs) reach temperatures below ~40–110 K (−233 °C to −163 °C), acting as cold traps where ice sublimates negligibly.',
  },
  {
    id: 'F-WAT-03',
    topic: 'water',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'On the International Space Station, recycling machines clean and reuse more than 90 percent of the crew’s water!',
    sourceIds: ['S05'],
    caveat: 'NASA’s ECLSS Water Recovery System (combined with brine processing) has demonstrated ~98% water recovery from cabin humidity condensate and urine on the ISS.',
  },
  {
    id: 'F-WAT-04',
    topic: 'water',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Water is very heavy and expensive to launch from Earth, so harvesting Moon ice helps astronauts stay longer.',
    sourceIds: ['S04', 'S06'],
    caveat: 'Water has a density of 1 kg/L; ISRU water extraction reduces Earth launch mass and can supply drinking water, life support O₂, and LH₂/LOX propellant.',
  },

  // --- POWER (4 facts) ---
  {
    id: 'F-POW-01',
    topic: 'power',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'At the Moon’s south pole, the Sun skims low along the horizon, so tall vertical solar panels work best to catch sunlight.',
    sourceIds: ['S02', 'S07'],
    caveat: 'Near the lunar poles, solar elevation stays within a few degrees of the horizon; vertical, gimbaled solar arrays minimize cosine losses and terrain shadowing.',
  },
  {
    id: 'F-POW-02',
    topic: 'power',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'When a mountain blocks the Sun, a Moon base must run on stored battery power or backup generators.',
    sourceIds: ['S02', 'S07'],
    caveat: 'Even the best-illuminated south-pole ridges experience multi-day eclipse periods during parts of the lunar year, requiring energy storage (batteries/regenerative fuel cells) or fission surface power.',
  },
  {
    id: 'F-POW-03',
    topic: 'power',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Clingy Moon dust sticks to solar panels with static electricity and blocks sunlight, cutting down the power they make.',
    sourceIds: ['S07', 'S10'],
    caveat: 'UV photoemission and solar-wind charging electrostatically levitate and adhere fine regolith dust (<20 µm) to optical and photovoltaic surfaces.',
  },
  {
    id: 'F-POW-04',
    topic: 'power',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Solar panels make the most electricity when they point straight at the Sun instead of facing it at a slant.',
    sourceIds: ['S07'],
    caveat: 'Incident solar irradiance scales with the cosine of the incidence angle (I = I₀ cos θ); tracking arrays rotate to keep θ near 0°.',
  },

  // --- FOOD (4 facts) ---
  {
    id: 'F-FOD-01',
    topic: 'food',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Astronauts have grown and eaten fresh leafy greens and chili peppers inside special plant chambers in space!',
    sourceIds: ['S08'],
    caveat: 'ISS crews have grown red romaine lettuce, mizuna mustard, zinnias, and Española Improved chili peppers in the Veggie and Advanced Plant Habitat payloads.',
  },
  {
    id: 'F-FOD-02',
    topic: 'food',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Space greenhouses use bright red and blue LED grow lights, carefully measured water, and nutrients instead of ordinary dirt.',
    sourceIds: ['S08'],
    caveat: 'Spaceflight plant habitats use hydroponic or porous clay media (arcillite) with controlled-release fertilizer and red/blue/green LED spectra tuned for photosynthesis.',
  },
  {
    id: 'F-FOD-03',
    topic: 'food',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Growing plants in a space habitat gives astronauts fresh vitamins, recycles air and water, and cheers up the crew.',
    sourceIds: ['S08'],
    caveat: 'Photosynthesis consumes CO₂ and releases O₂ while transpiration contributes to cabin humidity (recoverable as clean water), alongside documented psychological benefits.',
  },
  {
    id: 'F-FOD-04',
    topic: 'food',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Early Moon crews still bring most of their packaged meals from Earth because growing a full farm takes lots of power and space.',
    sourceIds: ['S04', 'S08'],
    caveat: 'Calorically complete bioregenerative food production requires tens of square meters and kilowatts of lighting per crew member; early Artemis missions rely primarily on shelf-stable Earth rations.',
  },

  // --- RADIATION (4 facts) ---
  {
    id: 'F-RAD-01',
    topic: 'radiation',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Unlike Earth, the Moon has no thick atmosphere or global magnetic shield to block space radiation.',
    sourceIds: ['S01', 'S09'],
    caveat: 'The Moon lacks a global dipole magnetosphere (retaining only weak localized crustal magnetic anomalies) and atmospheric mass shielding.',
  },
  {
    id: 'F-RAD-02',
    topic: 'radiation',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Space radiation comes from two main sources: steady cosmic rays from deep space and sudden solar storms from the Sun.',
    sourceIds: ['S09'],
    caveat: 'Lunar surface crews face chronic Galactic Cosmic Rays (GCRs, high-energy protons and heavy ions) and acute Solar Particle Events (SPEs, mostly energetic protons).',
  },
  {
    id: 'F-RAD-03',
    topic: 'radiation',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'When a solar storm heads toward the Moon, astronauts move into a heavily shielded storm shelter until it passes.',
    sourceIds: ['S04', 'S09'],
    caveat: 'SPEs can deliver hazardous doses over hours to days; mission architectures use space-weather alerts and high-areal-density storm shelters (including water walls and equipment bays).',
  },
  {
    id: 'F-RAD-04',
    topic: 'radiation',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Piling thick layers of Moon soil (regolith) over a habitat helps block harmful radiation and tiny space rocks.',
    sourceIds: ['S09', 'S11'],
    caveat: 'Bulk regolith berms or sintered shells (~0.5–3 m thick depending on density and target dose) attenuate solar protons, secondary radiation, and micrometeoroids.',
  },

  // --- HABITAT (4 facts) ---
  {
    id: 'F-HAB-01',
    topic: 'habitat',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Tiny space pebbles called micrometeoroids zip into the Moon faster than a speeding bullet because there is no air to slow them down.',
    sourceIds: ['S01', 'S10'],
    caveat: 'Micrometeoroids impact the lunar surface at hypervelocities averaging ~15–20 km/s (up to ~70 km/s), requiring multi-wall Whipple shields or regolith cover.',
  },
  {
    id: 'F-HAB-02',
    topic: 'habitat',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Broken bits of Moon dust are jagged like tiny shards of glass because no wind or flowing water has ever worn them smooth.',
    sourceIds: ['S10'],
    caveat: 'Micrometeoroid bombardment fractures silicate minerals and creates agglutinates with sharp edges that abrade suit seals, bearings, and radiator surfaces.',
  },
  {
    id: 'F-HAB-03',
    topic: 'habitat',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'Without air to spread heat around, sunny places on the Moon get boiling hot while dark shadows drop way below freezing!',
    sourceIds: ['S01', 'S02'],
    caveat: 'Lunar daytime temperatures near the equator reach ~120 °C (250 °F), while night and polar shadow temperatures drop to −130 °C to −246 °C (−208 °F to −410 °F).',
  },
  {
    id: 'F-HAB-04',
    topic: 'habitat',
    label: 'REAL_SCIENTIFIC_FACT',
    kidText: 'NASA is testing robot 3D printers that melt or bake Moon dirt into sturdy walls, landing pads, and protective domes.',
    sourceIds: ['S06', 'S11'],
    caveat: 'NASA’s MMPACT project explores laser/microwave sintering and regolith-based concrete to construct infrastructure using local lunar materials.',
  },
];

export function factsFor(topic) {
  return FACTS.filter(f => f.topic === topic);
}

export function factById(id) {
  return FACTS.find(f => f.id === id) || null;
}
