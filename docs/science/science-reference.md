# Lunar Outpost Science Reference Brief (D-S1 / D-S4)

**Owner:** Department D (D1 NASA Scientific Research Analyst)  
**Target Audience:** Curriculum reviewers, judges, and developers verifying the scientific foundation of *Junior Astronaut Mission Trainer*.  
**Citation Key:** Bracketed codes (`[S01]`–`[S12]`) refer to `docs/science/source-register.md` and `src/data/scienceFacts.js`.

---

## 1. The Lunar Environment (`topic: 'moon'`)
* **Gravity:** The Moon’s surface gravity is approximately $1.62\text{ m/s}^2$, or about one-sixth (16.5%) of Earth’s gravity (`F-MON-01`, `[S01]`). Reduced gravity lowers the weight of structures and rovers but affects human muscle/bone conditioning and fluid behavior.
* **Day/Night Cycle & Illumination:** At mid-latitudes, the lunar synodic day lasts **29.53 Earth days**—roughly 14.75 Earth days of continuous sunlight followed by 14.75 Earth days of darkness (`F-MON-02`, `[S01]`). However, because the Moon’s axial tilt is only **$1.54^\circ$**, topography dominates illumination at the **lunar south pole**: high crater rims receive grazing sunlight for over 70–90% of the lunar year, while adjacent deep crater floors lie in permanent shadow (`F-MON-03`, `[S02, S04]`).
* **Regolith:** Billions of years of meteoroid and micrometeoroid impacts have pulverized the upper several meters of lunar crust into a fine, powdery, fragmented layer of rock and mineral glass called **regolith** (`F-MON-04`, `[S01, S10]`).

## 2. Breathable Air & Oxygen (`topic: 'oxygen'`)
* **Lunar Vacuum:** The Moon has only an ultra-thin, collisionless **surface-bounded exosphere** ($\sim 10^{-12}\text{ bar}$), offering zero breathable air or atmospheric pressure (`F-OXY-01`, `[S01, S12]`). Habitats must maintain a sealed, pressurized atmosphere, and astronauts require pressurized spacesuits for extravehicular activity (EVA).
* **Water Electrolysis:** Modern spacecraft Environmental Control and Life Support Systems (ECLSS), such as the Oxygen Generation Assembly on the International Space Station (ISS), generate breathable oxygen by electrolyzing purified water ($2\text{H}_2\text{O} \rightarrow 2\text{H}_2 + \text{O}_2$), which requires a steady supply of electrical power and water (`F-OXY-02`, `[S05]`).
* **Hull Integrity & Leaks:** Because internal cabin pressure pushes outward against the vacuum of space, any hull perforation causes air to escape (`F-OXY-03`, `[S05, S12]`). Crews use pressure sensors and acoustic/ultrasonic detectors to pinpoint and seal leaks.
* **ISRU Oxygen from Regolith:** Chemically, lunar regolith is **40–45% oxygen by weight**, locked tightly inside silicate and oxide minerals such as ilmenite ($\text{FeTiO}_3$). NASA’s ISRU projects demonstrate high-temperature reactors that extract this bound oxygen for breathing air and rocket propellant (`F-OXY-04`, `[S06, S10]`).

## 3. Water Ice & Closed-Loop Recycling (`topic: 'water'`)
* **Discovery of Polar Water Ice (LCROSS, 2009):** On October 9, 2009, NASA’s **LCROSS** mission impacted its spent Centaur upper stage into the permanently shadowed floor of **Cabeus crater** near the lunar south pole (`F-WAT-01`, `[S02, S03]`). Spectrometers flying through the ejecta plume confirmed approximately **5.6% water ice by mass**, along with other volatiles.
* **Permanently Shadowed Regions (PSRs):** Polar crater floors never receive direct sunlight and stay below $40\text{–}110\text{ K}$ ($-233^\circ\text{C}$ to $-163^\circ\text{C}$), acting as ancient cryogenic cold traps where water ice stays frozen over billions of years (`F-WAT-02`, `[S02]`).
* **Closed-Loop Water Recovery:** Because water is dense ($1\text{ kg/L}$) and costly to launch from Earth (`F-WAT-04`, `[S04, S06]`), habitats must recycle nearly every drop. On the ISS, NASA’s ECLSS Water Recovery System captures cabin humidity condensate (sweat and breath) and distills wastewater to recover **more than 90% (up to ~98%)** of water (`F-WAT-03`, `[S05]`).

## 4. Solar Power, Dust & Shadows (`topic: 'power'`)
* **Low-Angle Polar Sunlight:** At the lunar south pole, the Sun stays within a few degrees of the horizon, slowly circling the sky (`F-POW-01`, `[S02, S07]`). Tall, vertically deployed solar arrays that rotate to track the Sun capture this horizontal light far better than flat roof-mounted panels.
* **Cosine Angle Dependence:** Solar arrays produce maximum power when oriented perpendicular to incoming sunlight; tilting away reduces power proportionally to $\cos\theta$ (`F-POW-04`, `[S07]`).
* **Terrain Shadows & Energy Storage:** Surrounding mountains and crater rims periodically cast shadows across south-pole sites (`F-POW-02`, `[S02, S07]`). During shadow periods, an outpost must draw from rechargeable batteries, regenerative fuel cells, or compact fission surface power systems, and shed non-essential electrical loads.
* **Electrostatic Dust Adhesion:** Ultraviolet light and solar-wind plasma give fine lunar dust grains an electrostatic charge, causing them to cling stubbornly to solar panels and block sunlight (`F-POW-03`, `[S07, S10]`).

## 5. Space Agriculture & Crew Nutrition (`topic: 'food'`)
* **Spaceflight Crop Experiments:** In the ISS **Veggie** and **Advanced Plant Habitat** chambers, astronauts have successfully grown and harvested red romaine lettuce, mizuna mustard greens, radishes, and chili peppers (`F-FOD-01`, `[S08]`).
* **Controlled-Environment Hydroponics & LEDs:** Raw lunar regolith lacks organic nutrients and contains sharp particles and reactive iron, so space greenhouses use targeted red/blue LED lighting, controlled water delivery, and nutrient pillows or hydroponics (`F-FOD-02`, `[S08]`).
* **Bioregenerative Co-Benefits vs. Power Cost:** Growing crops provides fresh vitamins, absorbs $\text{CO}_2$, releases $\text{O}_2$, transpires clean water vapor, and improves crew psychological well-being (`F-FOD-03`, `[S08]`). However, because lighting and climate control demand substantial electrical power and volume, early lunar crews rely mostly on prepackaged rations shipped from Earth (`F-FOD-04`, `[S04, S08]`).

## 6. Space Radiation & Regolith Shielding (`topic: 'radiation'`)
* **Lack of Natural Planetary Shielding:** Unlike Earth, the Moon has neither a dense atmosphere nor a global dipolar magnetic field (`F-RAD-01`, `[S01, S09]`).
* **GCRs vs. Solar Particle Events:** Astronauts face two distinct radiation hazards (`F-RAD-02`, `[S09]`):
  1. **Galactic Cosmic Rays (GCRs):** A steady background of high-energy protons and heavy atomic nuclei originating outside the solar system.
  2. **Solar Particle Events (SPEs / Solar Storms):** Intense, temporary bursts of energetic protons ejected by solar flares and coronal mass ejections.
* **Storm Shelters & Regolith Overburden:** During a solar storm, crews retreat to a heavily shielded **storm shelter** surrounded by high-hydrogen materials such as water tanks and food supplies (`F-RAD-03`, `[S04, S09]`). For long-term protection, piling or 3D-printing thick layers of local **lunar regolith** over the habitat attenuates both radiation and micrometeoroids (`F-RAD-04`, `[S09, S11]`).

## 7. Habitat Engineering & Surface Hazards (`topic: 'habitat'`)
* **Hypervelocity Micrometeoroids:** With no atmosphere to burn them up, sand-to-pebble-sized **micrometeoroids** strike the lunar surface at $15\text{–}70\text{ km/s}$—many times faster than a rifle bullet (`F-HAB-01`, `[S01, S10]`). Habitats require multi-wall Whipple shields, regolith cover, and repair kits.
* **Abrasive Dust:** Because the Moon has no wind or liquid water erosion, regolith dust particles remain jagged and glassy, abrading airlock seals, spacesuit joints, and air/water filters (`F-HAB-02`, `[S10]`).
* **Thermal Extremes:** Without an atmosphere to transfer heat, lunar surface temperatures swing from roughly $+120^\circ\text{C}$ ($+250^\circ\text{F}$) in direct sunlight to below $-130^\circ\text{C}$ ($-208^\circ\text{F}$) in darkness (`F-HAB-03`, `[S01, S02]`), requiring active thermal control and insulation.
* **Autonomous Regolith Construction:** Through projects like **MMPACT**, NASA is developing robotic 3D printing and microwave/laser sintering systems to fuse loose lunar soil into landing pads, blast walls, and protective habitat shells (`F-HAB-04`, `[S06, S11]`).
