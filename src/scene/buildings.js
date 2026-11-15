// Procedural 3D models for all lunar outpost modules, lander, and rover (B-S1).
import * as THREE from 'three';
import { clamp, damp, dampAngle, num, canvasTexture, makeGlow } from './sceneUtils.js';
import { sampleTerrainHeight } from './terrain.js';

export const INTERACTIVE_BUILDING_IDS = ['habitat', 'lifeSupport', 'solar', 'greenhouse', 'lab'];

export const BUILDING_LAYOUT = {
  habitat: { x: 0, z: 0, radius: 4.5, focusHeight: 2.3, camDist: 14 },
  lifeSupport: { x: -7.5, z: -3.2, radius: 2.9, focusHeight: 1.8, camDist: 11 },
  solar: { x: -1.8, z: -11.5, radius: 4.8, focusHeight: 3.4, camDist: 15 },
  greenhouse: { x: 8.5, z: -2.2, radius: 3.8, focusHeight: 1.8, camDist: 12.5 },
  lab: { x: 5.8, z: 6.8, radius: 3.2, focusHeight: 2.2, camDist: 11.5 },
  lander: { x: -12.8, z: 8.5, radius: 3.8, focusHeight: 2.6, camDist: 14 },
  rover: { x: 11.5, z: 9.0, radius: 2.2, focusHeight: 1.2, camDist: 10 },
};

function tagBuildingRecursive(group, buildingId) {
  group.userData.buildingId = buildingId;
  group.traverse((obj) => {
    obj.userData.buildingId = buildingId;
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
}

function createWarningBeacon(yOffset = 3.6) {
  const group = new THREE.Group();
  group.position.y = yOffset;

  const mast = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.07, 0.45, 8),
    new THREE.MeshStandardMaterial({ color: 0x3a3f47, roughness: 0.6, metalness: 0.5 })
  );
  mast.position.y = -0.2;
  group.add(mast);

  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0x551111,
    emissive: new THREE.Color(0xff1e1e),
    emissiveIntensity: 0,
    roughness: 0.25,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), bulbMat);
  group.add(bulb);

  const glow = makeGlow(0xff2a2a, 1.8, 0);
  group.add(glow);

  return { group, bulbMat, glow };
}

function createSolarCellTexture() {
  return canvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#12295a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3867b8';
    ctx.lineWidth = 2;
    for (let y = 0; y <= h; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#7ba8e8';
    ctx.lineWidth = 1.5;
    for (let x = 0; x <= w; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  });
}

function buildHabitatModule() {
  const root = new THREE.Group();
  root.name = 'habitat';
  const pos = BUILDING_LAYOUT.habitat;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xe8edf5,
    roughness: 0.45,
    metalness: 0.2,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x2c6496,
    roughness: 0.5,
    metalness: 0.35,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x454d59,
    roughness: 0.6,
    metalness: 0.55,
  });

  // Base platform legs + skirt
  const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(3.55, 3.85, 0.45, 24), darkMetal);
  basePlate.position.y = 0.22;
  root.add(basePlate);

  // Main cylindrical hull
  const mainCylinder = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.3, 2.1, 28), hullMat);
  mainCylinder.position.y = 1.45;
  root.add(mainCylinder);

  // Accent ribs
  for (const ry of [0.65, 2.35]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.26, 0.08, 10, 36), trimMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ry;
    root.add(ring);
  }

  // Upper geodesic dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hullMat
  );
  dome.position.y = 2.45;
  root.add(dome);

  // Top cupola hatch
  const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.35, 16), darkMetal);
  cupola.position.y = 5.55;
  root.add(cupola);

  // Airlock tunnel extending toward front-right (+Z/+X)
  const airlockGroup = new THREE.Group();
  airlockGroup.rotation.y = 0.35;
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.2, 16), hullMat);
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.set(0, 1.25, 3.6);
  airlockGroup.add(tunnel);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.9, 0.4), darkMetal);
  doorFrame.position.set(0, 1.2, 4.65);
  airlockGroup.add(doorFrame);

  // Airlock steps
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.14, 0.32), darkMetal);
    step.position.set(0, 0.2 + s * 0.22, 5.25 - s * 0.28);
    airlockGroup.add(step);
  }
  root.add(airlockGroup);

  // Glowing habitat windows around the hull
  const windowMat = new THREE.MeshStandardMaterial({
    color: 0xffdf9a,
    emissive: new THREE.Color(0xffb84d),
    emissiveIntensity: 1.3,
    roughness: 0.2,
    metalness: 0.1,
  });

  const windowAngles = [-2.4, -1.65, -0.9, 1.15, 1.9, 2.65];
  for (const ang of windowAngles) {
    const winFrame = new THREE.Group();
    winFrame.rotation.y = ang;
    const pane = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.52, 0.15), windowMat);
    pane.position.set(0, 1.65, 3.22);
    winFrame.add(pane);
    root.add(winFrame);
  }

  // Cupola skylight window
  const skylight = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16), windowMat);
  skylight.position.y = 5.71;
  root.add(skylight);

  const habGlow = makeGlow(0xffc766, 6.2, 0.45);
  habGlow.position.set(0, 2.2, 0);
  root.add(habGlow);

  // Regolith radiation shield berm mound around and over habitat (scales with shieldLevel 0..3)
  const bermGroup = new THREE.Group();
  bermGroup.name = 'regolithBerm';
  const bermMat = new THREE.MeshStandardMaterial({
    color: 0x6b6f78,
    roughness: 0.96,
    metalness: 0.03,
  });

  // Ring of packed regolith sandbag-style mounds leaving airlock open
  const bermSegments = 16;
  for (let i = 0; i < bermSegments; i++) {
    const a = (i / bermSegments) * Math.PI * 2;
    // Leave gap around airlock direction (~0.35 rad from +Z -> atan2(x,z) ~ 0.35)
    const dirFromAirlock = Math.atan2(Math.sin(a - 0.35), Math.cos(a - 0.35));
    if (Math.abs(dirFromAirlock) < 0.42) continue;

    const r = 3.55;
    const seg = new THREE.Mesh(new THREE.SphereGeometry(1.15, 12, 10), bermMat);
    seg.position.set(Math.sin(a) * r, 0.85, Math.cos(a) * r);
    seg.scale.set(1.25, 2.1, 1.15);
    bermGroup.add(seg);
  }

  // Upper regolith cap shell that covers dome at higher shield levels
  const capShell = new THREE.Mesh(
    new THREE.SphereGeometry(3.48, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
    bermMat
  );
  capShell.position.y = 2.38;
  bermGroup.add(capShell);

  bermGroup.scale.set(1, 0.01, 1);
  bermGroup.visible = false;
  root.add(bermGroup);

  const beacon = createWarningBeacon(6.1);
  root.add(beacon.group);

  tagBuildingRecursive(root, 'habitat');

  return {
    root,
    windowMat,
    habGlow,
    bermGroup,
    capShell,
    beacon,
    currentBermScale: 0,
  };
}

function buildLifeSupportModule() {
  const root = new THREE.Group();
  root.name = 'lifeSupport';
  const pos = BUILDING_LAYOUT.lifeSupport;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xdce3ec,
    roughness: 0.48,
    metalness: 0.25,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x3b434f,
    roughness: 0.6,
    metalness: 0.5,
  });
  const o2Mat = new THREE.MeshStandardMaterial({
    color: 0x2e86de,
    roughness: 0.35,
    metalness: 0.3,
  });
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x17a589,
    roughness: 0.35,
    metalness: 0.3,
  });

  // Base skid
  const skid = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.35, 3.2), frameMat);
  skid.position.y = 0.18;
  root.add(skid);

  // Main processing unit housing
  const mainBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 2.2), bodyMat);
  mainBox.position.set(-0.6, 1.25, 0);
  root.add(mainBox);

  // Oxygen & Water spherical/cylindrical storage tanks
  const o2Tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.85, 18), o2Mat);
  o2Tank1.position.set(1.15, 1.25, -0.65);
  root.add(o2Tank1);

  const o2Tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.85, 18), o2Mat);
  o2Tank2.position.set(1.15, 1.25, 0.65);
  root.add(o2Tank2);

  const waterSphere = new THREE.Mesh(new THREE.SphereGeometry(0.68, 18, 14), waterMat);
  waterSphere.position.set(-0.6, 2.65, 0);
  root.add(waterSphere);

  // Rotating ECLSS cooling fan on side/top
  const fanGroup = new THREE.Group();
  fanGroup.position.set(-0.6, 1.35, 1.14);
  const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.06, 8, 20), frameMat);
  fanGroup.add(fanRing);

  const bladesGroup = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(0.78, 0.14, 0.04);
  for (let i = 0; i < 3; i++) {
    const b = new THREE.Mesh(bladeGeo, frameMat);
    b.rotation.z = (i * Math.PI) / 3;
    bladesGroup.add(b);
  }
  fanGroup.add(bladesGroup);
  root.add(fanGroup);

  // Status indicator light strip
  const indicatorMat = new THREE.MeshStandardMaterial({
    color: 0x38ef7d,
    emissive: new THREE.Color(0x2ecc71),
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const indicator = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.08), indicatorMat);
  indicator.position.set(-0.6, 1.95, 1.12);
  root.add(indicator);

  const statusGlow = makeGlow(0x2ecc71, 2.4, 0.55);
  statusGlow.position.set(-0.6, 2.0, 1.3);
  root.add(statusGlow);

  // Connecting utility umbilical pipes from Life Support toward Habitat (0, 0)
  const dx = BUILDING_LAYOUT.habitat.x - pos.x;
  const dz = BUILDING_LAYOUT.habitat.z - pos.z;
  const pipeLen = Math.hypot(dx, dz) - 3.2;
  const pipeAngle = Math.atan2(dx, dz);

  const pipeGroup = new THREE.Group();
  pipeGroup.rotation.y = pipeAngle;
  for (const offset of [-0.18, 0.18]) {
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, pipeLen, 10),
      offset < 0 ? o2Mat : waterMat
    );
    pipe.rotation.x = Math.PI / 2;
    pipe.position.set(offset, 0.45, pipeLen * 0.5 + 1.2);
    pipeGroup.add(pipe);
  }
  root.add(pipeGroup);

  const beacon = createWarningBeacon(3.65);
  beacon.group.position.x = -0.6;
  root.add(beacon.group);

  tagBuildingRecursive(root, 'lifeSupport');

  return {
    root,
    bladesGroup,
    indicatorMat,
    statusGlow,
    beacon,
  };
}

function buildSolarArrayModule() {
  const root = new THREE.Group();
  root.name = 'solar';
  const pos = BUILDING_LAYOUT.solar;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const mastMat = new THREE.MeshStandardMaterial({
    color: 0x9aa3b0,
    roughness: 0.45,
    metalness: 0.65,
  });
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x3b424d,
    roughness: 0.65,
    metalness: 0.45,
  });

  const cellTex = createSolarCellTexture();
  const panelMat = new THREE.MeshStandardMaterial({
    map: cellTex,
    color: new THREE.Color(0xffffff),
    emissive: new THREE.Color(0x0c2448),
    emissiveIntensity: 0.45,
    roughness: 0.28,
    metalness: 0.35,
  });

  // Central junction box
  const hub = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 1.2), baseMat);
  hub.position.y = 0.35;
  root.add(hub);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x4cd137,
    emissive: new THREE.Color(0x4cd137),
    emissiveIntensity: 1.2,
  });
  const hubLed = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.14, 0.08), ledMat);
  hubLed.position.set(0, 0.5, 0.62);
  root.add(hubLed);

  // 5 tall vertical-ish south-pole solar towers (NASA VSAT style)
  const mastOffsets = [
    [-4.2, -0.8],
    [-2.1, 0.7],
    [0.0, -0.8],
    [2.1, 0.7],
    [4.2, -0.8],
  ];

  const pivots = [];
  for (const [mx, mz] of mastOffsets) {
    const tower = new THREE.Group();
    tower.position.set(mx, 0, mz);

    const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 0.5, 8), baseMat);
    tripod.position.y = 0.25;
    tower.add(tripod);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 4.9, 10), mastMat);
    mast.position.y = 2.65;
    tower.add(mast);

    // Rotating head + vertical solar wings
    const pivot = new THREE.Group();
    pivot.position.y = 2.85;

    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.14), mastMat);
    pivot.add(crossbar);

    for (const side of [-0.58, 0.58]) {
      const wingFrame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 3.6, 0.06), mastMat);
      wingFrame.position.set(side, 0, 0);
      pivot.add(wingFrame);

      const cellFace = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 3.45), panelMat);
      cellFace.position.set(side, 0, 0.038);
      pivot.add(cellFace);

      const cellBack = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 3.45), panelMat);
      cellBack.rotation.y = Math.PI;
      cellBack.position.set(side, 0, -0.038);
      pivot.add(cellBack);
    }

    tower.add(pivot);
    root.add(tower);
    pivots.push(pivot);
  }

  const beacon = createWarningBeacon(5.5);
  root.add(beacon.group);

  tagBuildingRecursive(root, 'solar');

  return {
    root,
    pivots,
    panelMat,
    ledMat,
    beacon,
    currentYaw: 0,
  };
}

function buildGreenhouseModule() {
  const root = new THREE.Group();
  root.name = 'greenhouse';
  const pos = BUILDING_LAYOUT.greenhouse;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0xd8e0ea,
    roughness: 0.5,
    metalness: 0.25,
  });
  const archMat = new THREE.MeshStandardMaterial({
    color: 0x485460,
    roughness: 0.45,
    metalness: 0.55,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xdff6ff,
    emissive: new THREE.Color(0xd946ef),
    emissiveIntensity: 0.35,
    roughness: 0.15,
    metalness: 0.05,
    transparent: true,
    opacity: 0.52,
  });

  // Hydroponic base cradle
  const cradle = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.55, 6.2), baseMat);
  cradle.position.y = 0.28;
  root.add(cradle);

  // Transparent Quonset-style half-cylinder dome tunnel
  const domeGeo = new THREE.CylinderGeometry(2.0, 2.0, 5.8, 24, 1, false, 0, Math.PI);
  domeGeo.rotateZ(Math.PI / 2);
  domeGeo.rotateY(Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, glassMat);
  domeMesh.position.y = 0.55;
  root.add(domeMesh);

  // Structural ribs along the greenhouse tunnel
  for (const rz of [-2.8, -1.4, 0, 1.4, 2.8]) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(2.02, 0.06, 8, 24, Math.PI),
      archMat
    );
    rib.position.set(0, 0.55, rz);
    root.add(rib);
  }

  // End caps
  for (const rz of [-2.9, 2.9]) {
    const cap = new THREE.Mesh(
      new THREE.CircleGeometry(2.0, 20, 0, Math.PI),
      baseMat
    );
    cap.position.set(0, 0.55, rz);
    if (rz < 0) cap.rotation.y = Math.PI;
    root.add(cap);
  }

  // Interior hydroponic trays & plants
  const trayMat = new THREE.MeshStandardMaterial({ color: 0x2f3640, roughness: 0.7 });
  const plantLeafMat = new THREE.MeshStandardMaterial({
    color: 0x2ecc71,
    emissive: new THREE.Color(0x145a32),
    emissiveIntensity: 0.3,
    roughness: 0.55,
  });
  const cropFruitMat = new THREE.MeshStandardMaterial({
    color: 0xff5252,
    roughness: 0.4,
  });

  const cropsGroup = new THREE.Group();
  cropsGroup.position.y = 0.65;

  for (const tx of [-0.95, 0.95]) {
    const tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 4.8), trayMat);
    tray.position.set(tx, 0.62, 0);
    root.add(tray);

    for (let pz = -2.0; pz <= 2.0; pz += 0.65) {
      const plantCluster = new THREE.Group();
      plantCluster.position.set(tx, 0.1, pz);

      const bush1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.28, 1), plantLeafMat);
      bush1.position.set(-0.12, 0.2, 0);
      plantCluster.add(bush1);

      const bush2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 1), plantLeafMat);
      bush2.position.set(0.14, 0.18, 0.08);
      plantCluster.add(bush2);

      const tomato = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), cropFruitMat);
      tomato.position.set(0, 0.34, 0.06);
      plantCluster.add(tomato);

      cropsGroup.add(plantCluster);
    }
  }
  root.add(cropsGroup);

  // Overhead magenta/pink LED grow light bar
  const growBarMat = new THREE.MeshStandardMaterial({
    color: 0xff77ff,
    emissive: new THREE.Color(0xe84393),
    emissiveIntensity: 1.6,
  });
  const growBar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 4.8), growBarMat);
  growBar.position.set(0, 2.25, 0);
  root.add(growBar);

  const growGlow = makeGlow(0xf368e0, 5.2, 0.65);
  growGlow.position.set(0, 1.5, 0);
  root.add(growGlow);

  const beacon = createWarningBeacon(3.15);
  root.add(beacon.group);

  tagBuildingRecursive(root, 'greenhouse');

  return {
    root,
    glassMat,
    cropsGroup,
    growBarMat,
    growGlow,
    beacon,
    currentCropScale: 0.2,
  };
}

function buildLabModule() {
  const root = new THREE.Group();
  root.name = 'lab';
  const pos = BUILDING_LAYOUT.lab;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xe3e9f2,
    roughness: 0.42,
    metalness: 0.25,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x0984e3,
    roughness: 0.45,
    metalness: 0.35,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x353b48,
    roughness: 0.55,
    metalness: 0.5,
  });

  // Octagonal science pod
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 0.4, 8), darkMat);
  base.position.y = 0.2;
  root.add(base);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.3, 2.0, 8), hullMat);
  body.position.y = 1.4;
  root.add(body);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.26, 2.26, 0.28, 8), accentMat);
  band.position.y = 1.95;
  root.add(band);

  // Side spectrometer bay
  const bay = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.5), hullMat);
  bay.position.set(1.9, 1.05, 0);
  root.add(bay);

  // Lab viewport glow
  const labWinMat = new THREE.MeshStandardMaterial({
    color: 0x74b9ff,
    emissive: new THREE.Color(0x00cec9),
    emissiveIntensity: 1.35,
    roughness: 0.2,
  });
  const viewport = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.12), labWinMat);
  viewport.position.set(0, 1.4, 2.2);
  root.add(viewport);

  const labGlow = makeGlow(0x00d2d3, 3.8, 0.5);
  labGlow.position.set(0, 1.6, 1.6);
  root.add(labGlow);

  // Rotating deep-space telemetry dish on roof
  const dishPivot = new THREE.Group();
  dishPivot.position.set(-0.35, 2.4, -0.2);

  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.7, 12), darkMat);
  pedestal.position.y = 0.35;
  dishPivot.add(pedestal);

  const dishHead = new THREE.Group();
  dishHead.position.y = 0.8;
  dishHead.rotation.x = -0.55;

  const dishBowl = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 20, 12, 0, Math.PI * 2, 0, 0.95),
    new THREE.MeshStandardMaterial({
      color: 0xf5f7fa,
      roughness: 0.35,
      metalness: 0.4,
      side: THREE.DoubleSide,
    })
  );
  dishBowl.rotation.x = Math.PI;
  dishHead.add(dishBowl);

  const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.75, 8), darkMat);
  feedHorn.rotation.x = Math.PI / 2;
  feedHorn.position.z = 0.55;
  dishHead.add(feedHorn);

  const feedTip = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), labWinMat);
  feedTip.position.z = 0.92;
  dishHead.add(feedTip);

  dishPivot.add(dishHead);
  root.add(dishPivot);

  const beacon = createWarningBeacon(4.15);
  beacon.group.position.set(0.85, 2.75, 0.6);
  root.add(beacon.group);

  tagBuildingRecursive(root, 'lab');

  return {
    root,
    dishPivot,
    labWinMat,
    labGlow,
    beacon,
  };
}

function buildCargoLander() {
  const root = new THREE.Group();
  root.name = 'lander';
  const pos = BUILDING_LAYOUT.lander;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const goldFoilMat = new THREE.MeshStandardMaterial({
    color: 0xe1a12c,
    roughness: 0.32,
    metalness: 0.78,
  });
  const strutMat = new THREE.MeshStandardMaterial({
    color: 0xb2bec3,
    roughness: 0.45,
    metalness: 0.65,
  });
  const nozzleMat = new THREE.MeshStandardMaterial({
    color: 0x2d3436,
    roughness: 0.6,
    metalness: 0.5,
  });

  // Descent stage octagonal gold-foil body
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.95, 1.8, 8), goldFoilMat);
  stage.position.y = 1.95;
  root.add(stage);

  // Upper cargo deck
  const upperDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.55, 1.1, 8), strutMat);
  upperDeck.position.y = 3.35;
  root.add(upperDeck);

  // Engine bell underneath
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.0, 16, 1, true), nozzleMat);
  bell.position.y = 0.95;
  root.add(bell);

  // Four landing legs + footpads
  for (let i = 0; i < 4; i++) {
    const legGroup = new THREE.Group();
    legGroup.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;

    const mainStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.7, 8), strutMat);
    mainStrut.position.set(2.35, 1.15, 0);
    mainStrut.rotation.z = 0.62;
    legGroup.add(mainStrut);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.55, 0.14, 14), goldFoilMat);
    pad.position.set(3.15, 0.07, 0);
    legGroup.add(pad);

    root.add(legGroup);
  }

  // Blinking navigation strobe on top of Cargo Lander
  const strobeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x38bdf8),
    emissiveIntensity: 1.5,
  });
  const strobeBulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), strobeMat);
  strobeBulb.position.set(0, 4.05, 0);
  root.add(strobeBulb);
  const strobeGlow = makeGlow(0x38bdf8, 2.2, 0.7);
  strobeGlow.position.set(0, 4.05, 0);
  root.add(strobeGlow);

  tagBuildingRecursive(root, 'lander');
  return { root, strobeMat, strobeGlow };
}

function buildAstronautFigure(accentHex = 0x38bdf8) {
  const fig = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({
    color: 0xf5f8fc,
    roughness: 0.45,
    metalness: 0.15,
  });
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: new THREE.Color(0xd97706),
    emissiveIntensity: 0.35,
    roughness: 0.15,
    metalness: 0.85,
  });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: new THREE.Color(accentHex),
    emissiveIntensity: 0.4,
    roughness: 0.35,
  });

  // Torso + PLSS life-support backpack
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.52, 12), suitMat);
  torso.position.y = 0.62;
  fig.add(torso);

  const chestBadge = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.08), stripeMat);
  chestBadge.position.set(0, 0.66, 0.22);
  fig.add(chestBadge);

  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.46, 0.22), suitMat);
  backpack.position.set(0, 0.66, -0.22);
  fig.add(backpack);

  // Helmet + gold visor + helmet beacon
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), suitMat);
  helmet.position.y = 1.05;
  fig.add(helmet);

  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), visorMat);
  visor.position.set(0, 1.05, 0.08);
  fig.add(visor);

  const helmetBeacon = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), stripeMat);
  helmetBeacon.position.set(0, 1.31, 0);
  fig.add(helmetBeacon);

  // Left & Right Arms and Legs for walking/waving animation
  const leftArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.38, 8), suitMat);
  leftArm.position.set(-0.29, 0.64, 0);
  fig.add(leftArm);

  const rightArm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.38, 8), suitMat);
  rightArm.position.set(0.29, 0.64, 0);
  fig.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.38, 8), suitMat);
  leftLeg.position.set(-0.11, 0.22, 0);
  fig.add(leftLeg);

  const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.38, 8), suitMat);
  rightLeg.position.set(0.11, 0.22, 0);
  fig.add(rightLeg);

  fig.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return { fig, leftArm, rightArm, leftLeg, rightLeg };
}

function buildLunarRover() {
  const root = new THREE.Group();
  root.name = 'rover';
  const pos = BUILDING_LAYOUT.rover;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const chassisMat = new THREE.MeshStandardMaterial({
    color: 0xf1f2f6,
    roughness: 0.4,
    metalness: 0.3,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd49b27,
    roughness: 0.35,
    metalness: 0.7,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x2f3542,
    roughness: 0.75,
    metalness: 0.35,
  });
  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff3b0,
    emissive: new THREE.Color(0xffeaa7),
    emissiveIntensity: 1.5,
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.45, 2.1), chassisMat);
  chassis.position.y = 0.65;
  root.add(chassis);

  const batteryPack = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.42, 0.9), goldMat);
  batteryPack.position.set(0, 1.05, -0.35);
  root.add(batteryPack);

  // Camera mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.85, 8), chassisMat);
  mast.position.set(0, 1.25, 0.65);
  root.add(mast);

  const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.26), chassisMat);
  camHead.position.set(0, 1.7, 0.68);
  root.add(camHead);

  for (const hx of [-0.4, 0.4]) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), headlightMat);
    lamp.position.set(hx, 0.68, 1.06);
    root.add(lamp);
  }

  // 4 wheels
  const wheels = [];
  for (const wx of [-0.78, 0.78]) {
    for (const wz of [-0.72, 0.72]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.26, 14), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, 0.36, wz);
      root.add(wheel);
      wheels.push(wheel);
    }
  }

  tagBuildingRecursive(root, 'rover');
  return { root, wheels, pathAngle: 0 };
}

const CLEAN_SOLAR_COLOR = new THREE.Color(0xffffff);
const DUSTY_SOLAR_COLOR = new THREE.Color(0x8c7b65);

export function createOutpostBuildings() {
  const group = new THREE.Group();
  group.name = 'outpostBuildings';

  const habitat = buildHabitatModule();
  const lifeSupport = buildLifeSupportModule();
  const solar = buildSolarArrayModule();
  const greenhouse = buildGreenhouseModule();
  const lab = buildLabModule();
  const lander = buildCargoLander();
  const rover = buildLunarRover();
  const astro1 = buildAstronautFigure(0x38bdf8);
  const astro2 = buildAstronautFigure(0xfbbf24);

  group.add(
    habitat.root,
    lifeSupport.root,
    solar.root,
    greenhouse.root,
    lab.root,
    lander.root,
    rover.root,
    astro1.fig,
    astro2.fig
  );

  const interactiveRoots = [
    habitat.root,
    lifeSupport.root,
    solar.root,
    greenhouse.root,
    lab.root,
  ];

  const byId = {
    habitat: habitat.root,
    lifeSupport: lifeSupport.root,
    solar: solar.root,
    greenhouse: greenhouse.root,
    lab: lab.root,
    lander: lander.root,
    rover: rover.root,
  };

  function updateBuildings(snapshot, dt, elapsedClock, sunAzimuthRad) {
    const mods = snapshot?.modules || {};
    const brownout = Boolean(snapshot?.power?.brownout);
    const sheltered = Boolean(snapshot?.crew?.sheltered);
    const shieldLevel = clamp(num(snapshot?.shieldLevel, 0), 0, 3);
    const collectingIce = num(snapshot?.cooldowns?.collectIce, 0) > 0;

    // 1. Habitat: window glow + regolith shield berm height (0..3)
    const habHealth = num(mods.habitat?.health, 100);
    const habTargetEmissive = brownout ? 0.45 : sheltered ? 2.4 : 1.3;
    habitat.windowMat.emissiveIntensity = damp(
      habitat.windowMat.emissiveIntensity,
      habTargetEmissive,
      6,
      dt
    );
    habitat.habGlow.material.opacity = damp(
      habitat.habGlow.material.opacity,
      brownout ? 0.16 : sheltered ? 0.78 : 0.45,
      6,
      dt
    );

    const targetBerm = shieldLevel / 3;
    habitat.currentBermScale = damp(habitat.currentBermScale, targetBerm, 4, dt);
    habitat.bermGroup.visible = habitat.currentBermScale > 0.02;
    habitat.bermGroup.scale.set(
      0.94 + habitat.currentBermScale * 0.12,
      Math.max(0.02, habitat.currentBermScale),
      0.94 + habitat.currentBermScale * 0.12
    );
    habitat.capShell.visible = shieldLevel >= 2;

    // 2. Life Support: fan spin + indicator light
    const lsOnline = mods.lifeSupport?.online !== false && !brownout;
    const lsHealth = num(mods.lifeSupport?.health, 100);
    if (lsOnline) {
      lifeSupport.bladesGroup.rotation.z += dt * 7.5;
    }
    lifeSupport.indicatorMat.emissiveIntensity = damp(
      lifeSupport.indicatorMat.emissiveIntensity,
      lsOnline ? 1.45 : 0.08,
      6,
      dt
    );
    lifeSupport.statusGlow.material.opacity = damp(
      lifeSupport.statusGlow.material.opacity,
      lsOnline ? 0.55 : 0.04,
      6,
      dt
    );

    // 3. Solar Array: yaw alignment toward sun + dust tint
    const solarOnline = mods.solar?.online !== false;
    const solarHealth = num(mods.solar?.health, 100);
    const alignment = clamp(num(mods.solar?.alignment, 1), 0, 1);
    const dust = clamp(num(mods.solar?.dust, 0), 0, 1);

    // When alignment = 1, panels face the Sun azimuth; lower alignment rotates them away
    const targetYaw = sunAzimuthRad + (1 - alignment) * 1.45;
    solar.currentYaw = dampAngle(solar.currentYaw, targetYaw, 4.5, dt);
    for (let i = 0; i < solar.pivots.length; i++) {
      solar.pivots[i].rotation.y = solar.currentYaw;
    }

    // Tint solar panels toward dusty brown-grey proportional to dust (0..1)
    solar.panelMat.color.lerpColors(CLEAN_SOLAR_COLOR, DUSTY_SOLAR_COLOR, dust * 0.85);
    solar.panelMat.roughness = 0.25 + dust * 0.6;
    solar.panelMat.emissiveIntensity = solarOnline && !brownout ? 0.45 * (1 - dust * 0.65) : 0.08;
    solar.ledMat.emissiveIntensity = solarOnline ? 1.2 : 0.1;

    // 4. Greenhouse: crop growth scale + planted visibility + purple-pink grow light
    const ghOnline = mods.greenhouse?.online !== false && !brownout;
    const ghHealth = num(mods.greenhouse?.health, 100);
    const planted = Boolean(mods.greenhouse?.planted);
    const growth = clamp(num(mods.greenhouse?.growth, 0), 0, 100);

    greenhouse.cropsGroup.visible = planted;
    const targetCropScale = planted ? 0.22 + (growth / 100) * 0.95 : 0.01;
    greenhouse.currentCropScale = damp(greenhouse.currentCropScale, targetCropScale, 5, dt);
    const cropBreath = ghOnline ? 1 + 0.03 * Math.sin(elapsedClock * 2.4) : 1;
    greenhouse.cropsGroup.scale.set(
      cropBreath,
      Math.max(0.05, greenhouse.currentCropScale * cropBreath),
      cropBreath
    );

    greenhouse.growBarMat.emissiveIntensity = damp(
      greenhouse.growBarMat.emissiveIntensity,
      ghOnline ? 1.7 : 0.05,
      6,
      dt
    );
    greenhouse.glassMat.emissiveIntensity = damp(
      greenhouse.glassMat.emissiveIntensity,
      ghOnline ? 0.42 : 0.03,
      6,
      dt
    );
    greenhouse.growGlow.material.opacity = damp(
      greenhouse.growGlow.material.opacity,
      ghOnline ? 0.68 : 0.03,
      6,
      dt
    );

    // 5. Science Lab: rotating telemetry dish when online
    const labOnline = mods.lab?.online !== false && !brownout && !sheltered;
    const labHealth = num(mods.lab?.health, 100);
    if (labOnline) {
      lab.dishPivot.rotation.y += dt * 0.65;
    }
    lab.labWinMat.emissiveIntensity = damp(
      lab.labWinMat.emissiveIntensity,
      labOnline ? 1.4 : 0.1,
      6,
      dt
    );
    lab.labGlow.material.opacity = damp(
      lab.labGlow.material.opacity,
      labOnline ? 0.52 : 0.04,
      6,
      dt
    );

    // 6. Warning beacons flash red on any module with health < 40 or offline
    const pulse = 0.5 + 0.5 * Math.sin(elapsedClock * 9.5);
    const checks = [
      [habitat.beacon, habHealth, mods.habitat?.online !== false],
      [lifeSupport.beacon, lsHealth, mods.lifeSupport?.online !== false],
      [solar.beacon, solarHealth, mods.solar?.online !== false],
      [greenhouse.beacon, ghHealth, mods.greenhouse?.online !== false],
      [lab.beacon, labHealth, mods.lab?.online !== false],
    ];
    for (const [beacon, hp, online] of checks) {
      const warn = hp < 40 || !online;
      beacon.bulbMat.emissiveIntensity = warn ? 0.4 + pulse * 2.4 : 0;
      beacon.glow.material.opacity = warn ? 0.25 + pulse * 0.7 : 0;
    }

    // 7. Decorative rover slowly drives an oval loop path around the east/south crater rim
    const roverSpeed = collectingIce ? 0.55 : 0.22;
    rover.pathAngle = (rover.pathAngle + dt * roverSpeed) % (Math.PI * 2);
    const a = rover.pathAngle;
    const rx = 13.5 + Math.cos(a) * 5.2;
    const rz = 9.5 + Math.sin(a) * 3.8;
    const nextA = a + 0.05;
    const nrx = 13.5 + Math.cos(nextA) * 5.2;
    const nrz = 9.5 + Math.sin(nextA) * 3.8;
    const ry = sampleTerrainHeight(rx, rz);

    rover.root.position.set(rx, ry, rz);
    rover.root.rotation.y = Math.atan2(nrx - rx, nrz - rz);
    for (const w of rover.wheels) {
      w.rotation.x += dt * roverSpeed * 5.0;
    }

    // 8. Cargo Lander blinking navigation strobe
    const landerBlink = Math.pow(0.5 + 0.5 * Math.sin(elapsedClock * 3.8), 6);
    lander.strobeMat.emissiveIntensity = 0.25 + landerBlink * 2.2;
    lander.strobeGlow.material.opacity = 0.12 + landerBlink * 0.65;

    // 9. Animated Lunar Astronauts (visible outside when not sheltered)
    astro1.fig.visible = !sheltered;
    astro2.fig.visible = !sheltered;
    if (!sheltered) {
      // Astronaut 1 walks in open plaza between Habitat airlock steps and Greenhouse
      const t1 = elapsedClock * 0.45;
      const ax1 = 4.8 + Math.sin(t1) * 1.1;
      const az1 = 2.8 + Math.cos(t1 * 0.8) * 0.9;
      const hop1 = Math.abs(Math.sin(elapsedClock * 3.4)) * 0.18;
      astro1.fig.position.set(ax1, sampleTerrainHeight(ax1, az1) + hop1, az1);
      astro1.fig.rotation.y = Math.atan2(Math.cos(t1) * 1.1, -Math.sin(t1 * 0.8) * 0.72);
      const swing1 = Math.sin(elapsedClock * 3.4) * 0.45;
      astro1.leftArm.rotation.x = swing1;
      astro1.rightArm.rotation.x = -swing1;
      astro1.leftLeg.rotation.x = -swing1 * 0.8;
      astro1.rightLeg.rotation.x = swing1 * 0.8;

      // Astronaut 2 patrols open plaza between Habitat and Lander/Lab & waves cheerfully
      const t2 = elapsedClock * 0.35 + 1.7;
      const ax2 = -4.2 + Math.cos(t2) * 1.4;
      const az2 = 5.6 + Math.sin(t2) * 1.1;
      const hop2 = Math.abs(Math.sin(elapsedClock * 2.9 + 1.1)) * 0.14;
      astro2.fig.position.set(ax2, sampleTerrainHeight(ax2, az2) + hop2, az2);
      astro2.fig.rotation.y = Math.atan2(-Math.sin(t2) * 1.4, Math.cos(t2) * 1.1);
      const swing2 = Math.sin(elapsedClock * 2.9) * 0.35;
      astro2.leftArm.rotation.x = swing2;
      astro2.rightArm.position.y = 0.78;
      astro2.rightArm.rotation.z = -2.35 + Math.sin(elapsedClock * 5.2) * 0.32; // friendly raised wave
      astro2.leftLeg.rotation.x = -swing2 * 0.7;
      astro2.rightLeg.rotation.x = swing2 * 0.7;
    }
  }

  return {
    group,
    interactiveRoots,
    byId,
    updateBuildings,
  };
}
