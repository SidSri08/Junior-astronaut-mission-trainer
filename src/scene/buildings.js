// Procedural 3D models for all lunar outpost modules, lander, and rover (B-S1).
import * as THREE from 'three';
import { clamp, damp, dampAngle, num, canvasTexture, makeGlow } from './sceneUtils.js';
import { sampleTerrainHeight } from './terrain.js';

export const INTERACTIVE_BUILDING_IDS = ['habitat', 'lifeSupport', 'solar', 'greenhouse', 'lab', 'comms'];

function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * clamp(t, 0, 1);
}

function smooth01(edge0, edge1, x) {
  const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export const BUILDING_LAYOUT = {
  habitat: { x: 0, z: 0, radius: 4.5, focusHeight: 2.3, camDist: 13.5 },
  lifeSupport: { x: -7.5, z: 0.4, radius: 3.0, focusHeight: 1.8, camDist: 11.2 },
  solar: { x: -5.8, z: -7.8, radius: 4.8, focusHeight: 3.3, camDist: 14.5 },
  greenhouse: { x: 6.6, z: -5.2, radius: 3.8, focusHeight: 1.8, camDist: 12.5 },
  lab: { x: 7.8, z: 1.6, radius: 3.2, focusHeight: 2.1, camDist: 11.5 },
  comms: { x: 1.2, z: -9.6, radius: 2.8, focusHeight: 2.6, camDist: 11.2 },
  lander: { x: -6.2, z: 7.5, radius: 3.8, focusHeight: 2.5, camDist: 13.5 },
  rover: { x: 10.6, z: 6.8, radius: 2.2, focusHeight: 1.2, camDist: 10 },
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

  // Main cylindrical hull + upper geodesic dome grouped for pneumatic inflation deployment
  const coreHullGroup = new THREE.Group();
  coreHullGroup.position.y = 0.42;

  const mainCylinder = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.3, 2.1, 28), hullMat);
  mainCylinder.position.y = 1.03;
  coreHullGroup.add(mainCylinder);

  // Accent ribs
  for (const ry of [0.23, 1.93]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.26, 0.08, 10, 36), trimMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = ry;
    coreHullGroup.add(ring);
  }

  // Upper geodesic dome
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(3.2, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
    hullMat
  );
  dome.position.y = 2.03;
  coreHullGroup.add(dome);

  // Top cupola hatch
  const cupola = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.15, 0.35, 16), darkMetal);
  cupola.position.y = 5.13;
  coreHullGroup.add(cupola);

  root.add(coreHullGroup);

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
    pane.position.set(0, 1.23, 3.22);
    winFrame.add(pane);
    coreHullGroup.add(winFrame);
  }

  // Cupola skylight window + glowing amber beacon + rooftop comms dish
  const skylight = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16), windowMat);
  skylight.position.y = 5.29;
  coreHullGroup.add(skylight);

  // Radiation Shelter status collar ring around the base (cyan when storm shelter active/shielded)
  const shelterTrimMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x0ea5e9),
    emissiveIntensity: 0.35,
    roughness: 0.35,
    metalness: 0.4,
  });
  const shelterCollar = new THREE.Mesh(new THREE.TorusGeometry(3.68, 0.055, 8, 36), shelterTrimMat);
  shelterCollar.rotation.x = Math.PI / 2;
  shelterCollar.position.y = 0.44;
  root.add(shelterCollar);

  // NASA Insignia decal badge on front upper dome
  const nasaLogoTex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0b3d91';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(16, 76);
    ctx.quadraticCurveTo(64, 34, 114, 52);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NASA', w / 2, h / 2 + 2);
  });
  const logoBadge = new THREE.Mesh(
    new THREE.CircleGeometry(0.72, 24),
    new THREE.MeshBasicMaterial({ map: nasaLogoTex, transparent: true })
  );
  logoBadge.position.set(0, 3.43, 2.92);
  logoBadge.rotation.x = -0.48;
  coreHullGroup.add(logoBadge);

  const habGlow = makeGlow(0xffc766, 6.6, 0.52);
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

  const beacon = createWarningBeacon(5.68);
  coreHullGroup.add(beacon.group);

  tagBuildingRecursive(root, 'habitat');

  return {
    root,
    basePlate,
    coreHullGroup,
    airlockGroup,
    shelterTrimMat,
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

  // Deployable upper processing deck
  const upperMachinery = new THREE.Group();
  upperMachinery.position.y = 0.35;

  // Main processing unit housing
  const mainBox = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.9, 2.2), bodyMat);
  mainBox.position.set(-0.6, 0.9, 0);
  upperMachinery.add(mainBox);

  // Oxygen & Water spherical/cylindrical storage tanks
  const o2Tank1 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.85, 18), o2Mat);
  o2Tank1.position.set(1.15, 0.9, -0.65);
  upperMachinery.add(o2Tank1);

  const o2Tank2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.85, 18), o2Mat);
  o2Tank2.position.set(1.15, 0.9, 0.65);
  upperMachinery.add(o2Tank2);

  const waterSphere = new THREE.Mesh(new THREE.SphereGeometry(0.68, 18, 14), waterMat);
  waterSphere.position.set(-0.6, 2.3, 0);
  upperMachinery.add(waterSphere);

  // Rotating ECLSS cooling fan on side/top
  const fanGroup = new THREE.Group();
  fanGroup.position.set(-0.6, 1.0, 1.14);
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
  upperMachinery.add(fanGroup);

  // Status indicator light strip
  const indicatorMat = new THREE.MeshStandardMaterial({
    color: 0x38ef7d,
    emissive: new THREE.Color(0x2ecc71),
    emissiveIntensity: 1.4,
    roughness: 0.2,
  });
  const indicator = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.08), indicatorMat);
  indicator.position.set(-0.6, 1.6, 1.12);
  upperMachinery.add(indicator);

  const statusGlow = makeGlow(0x2ecc71, 2.4, 0.55);
  statusGlow.position.set(-0.6, 1.65, 1.3);
  upperMachinery.add(statusGlow);

  // Water droplet icon badge on front housing for quick visual clarity
  const dropTex = canvasTexture(96, 96, (ctx, w, h) => {
    ctx.fillStyle = '#0c1f3d';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(48, 20);
    ctx.bezierCurveTo(68, 44, 68, 68, 48, 72);
    ctx.bezierCurveTo(28, 68, 28, 44, 48, 20);
    ctx.fill();
  });
  const waterBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.78),
    new THREE.MeshBasicMaterial({ map: dropTex })
  );
  waterBadge.position.set(-0.6, 0.7, 1.12);
  upperMachinery.add(waterBadge);

  const beacon = createWarningBeacon(3.3);
  beacon.group.position.x = -0.6;
  upperMachinery.add(beacon.group);
  root.add(upperMachinery);

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

  tagBuildingRecursive(root, 'lifeSupport');

  return {
    root,
    skid,
    upperMachinery,
    pipeGroup,
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
  const towers = [];
  for (const [mx, mz] of mastOffsets) {
    const tower = new THREE.Group();
    tower.position.set(mx, 0, mz);

    const tripod = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 0.5, 8), baseMat);
    tripod.position.y = 0.25;
    tower.add(tripod);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 4.9, 10), mastMat);
    mast.geometry.translate(0, 2.45, 0);
    mast.position.y = 0.2;
    tower.add(mast);

    // Rotating head + folding left/right vertical solar wings
    const pivot = new THREE.Group();
    pivot.position.y = 2.85;

    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 0.14), mastMat);
    pivot.add(crossbar);

    const wingPivots = [];
    for (const side of [-0.58, 0.58]) {
      const wingGroup = new THREE.Group();
      wingGroup.position.set(side < 0 ? -0.1 : 0.1, 0, 0);
      const localX = side < 0 ? -0.48 : 0.48;

      const wingFrame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 3.6, 0.06), mastMat);
      wingFrame.position.set(localX, 0, 0);
      wingGroup.add(wingFrame);

      const cellFace = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 3.45), panelMat);
      cellFace.position.set(localX, 0, 0.038);
      wingGroup.add(cellFace);

      const cellBack = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 3.45), panelMat);
      cellBack.rotation.y = Math.PI;
      cellBack.position.set(localX, 0, -0.038);
      wingGroup.add(cellBack);

      pivot.add(wingGroup);
      wingPivots.push({ side, group: wingGroup });
    }

    tower.add(pivot);
    root.add(tower);
    pivots.push(pivot);
    towers.push({ tower, mast, pivot, wingPivots });
  }

  const beacon = createWarningBeacon(5.5);
  root.add(beacon.group);

  tagBuildingRecursive(root, 'solar');

  return {
    root,
    hub,
    pivots,
    towers,
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

  // Deployable upper canopy dome & arch ribs (pivoted at cradle top y=0.55)
  const canopyGroup = new THREE.Group();
  canopyGroup.position.y = 0.55;

  // Transparent Quonset-style half-cylinder dome tunnel
  const domeGeo = new THREE.CylinderGeometry(2.0, 2.0, 5.8, 24, 1, false, 0, Math.PI);
  domeGeo.rotateZ(Math.PI / 2);
  domeGeo.rotateY(Math.PI / 2);
  const domeMesh = new THREE.Mesh(domeGeo, glassMat);
  canopyGroup.add(domeMesh);

  // Structural ribs along the greenhouse tunnel
  for (const rz of [-2.8, -1.4, 0, 1.4, 2.8]) {
    const rib = new THREE.Mesh(
      new THREE.TorusGeometry(2.02, 0.06, 8, 24, Math.PI),
      archMat
    );
    rib.position.set(0, 0, rz);
    canopyGroup.add(rib);
  }

  // End caps
  for (const rz of [-2.9, 2.9]) {
    const cap = new THREE.Mesh(
      new THREE.CircleGeometry(2.0, 20, 0, Math.PI),
      baseMat
    );
    cap.position.set(0, 0, rz);
    if (rz < 0) cap.rotation.y = Math.PI;
    canopyGroup.add(cap);
  }
  root.add(canopyGroup);

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
  growBar.position.set(0, 1.7, 0);
  canopyGroup.add(growBar);

  const growGlow = makeGlow(0xf368e0, 5.2, 0.65);
  growGlow.position.set(0, 1.5, 0);
  root.add(growGlow);

  const beacon = createWarningBeacon(2.6);
  canopyGroup.add(beacon.group);

  tagBuildingRecursive(root, 'greenhouse');

  return {
    root,
    cradle,
    canopyGroup,
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

  const podGroup = new THREE.Group();
  podGroup.position.y = 0.4;

  const body = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.3, 2.0, 8), hullMat);
  body.position.y = 1.0;
  podGroup.add(body);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(2.26, 2.26, 0.28, 8), accentMat);
  band.position.y = 1.55;
  podGroup.add(band);

  // Side spectrometer bay
  const bay = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.3, 1.5), hullMat);
  bay.position.set(1.9, 0.65, 0);
  podGroup.add(bay);

  // Lab viewport glow
  const labWinMat = new THREE.MeshStandardMaterial({
    color: 0x74b9ff,
    emissive: new THREE.Color(0x00cec9),
    emissiveIntensity: 1.35,
    roughness: 0.2,
  });
  const viewport = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.12), labWinMat);
  viewport.position.set(0, 1.0, 2.2);
  podGroup.add(viewport);

  const labGlow = makeGlow(0x00d2d3, 3.8, 0.5);
  labGlow.position.set(0, 1.2, 1.6);
  podGroup.add(labGlow);

  root.add(podGroup);

  // Glowing Flask emblem badge on Lab wall
  const flaskTex = canvasTexture(96, 96, (ctx, w, h) => {
    ctx.fillStyle = '#0c1f3d';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(40, 22);
    ctx.lineTo(56, 22);
    ctx.lineTo(56, 42);
    ctx.lineTo(72, 72);
    ctx.lineTo(24, 72);
    ctx.lineTo(40, 42);
    ctx.closePath();
    ctx.fill();
  });
  const flaskBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.78, 0.78),
    new THREE.MeshBasicMaterial({ map: flaskTex })
  );
  flaskBadge.position.set(0, 0.95, 2.28);
  podGroup.add(flaskBadge);

  // Rotating deep-space telemetry dish on roof
  const dishPivot = new THREE.Group();
  dishPivot.position.set(-0.35, 2.0, -0.2);

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
  podGroup.add(dishPivot);

  const beacon = createWarningBeacon(3.75);
  beacon.group.position.set(0.85, 2.35, 0.6);
  podGroup.add(beacon.group);

  tagBuildingRecursive(root, 'lab');

  return {
    root,
    base,
    podGroup,
    bay,
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
    emissive: new THREE.Color(0xff6b2c),
    emissiveIntensity: 0,
    roughness: 0.55,
    metalness: 0.5,
  });
  const hatchFrameMat = new THREE.MeshStandardMaterial({
    color: 0x283244,
    roughness: 0.5,
    metalness: 0.6,
  });
  const cabinGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffe4a0,
    emissive: new THREE.Color(0xffc864),
    emissiveIntensity: 0.15,
    roughness: 0.25,
  });

  // Main upper descent & ascent body (dips softly on landing shock absorber compression)
  const hullGroup = new THREE.Group();
  root.add(hullGroup);

  // Descent stage octagonal gold-foil body (rotated PI/8 so flat faces align with +-X/+-Z)
  const stage = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.95, 1.8, 8), goldFoilMat);
  stage.position.y = 1.95;
  stage.rotation.y = Math.PI / 8;
  hullGroup.add(stage);

  // Upper ascent/crew cabin deck
  const upperDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.58, 1.25, 8), strutMat);
  upperDeck.position.y = 3.42;
  upperDeck.rotation.y = Math.PI / 8;
  hullGroup.add(upperDeck);

  // Top docking collar + thruster attitude quads
  const dockCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.78, 0.35, 12), hatchFrameMat);
  dockCollar.position.y = 4.18;
  hullGroup.add(dockCollar);

  // Engine bell underneath + animated vacuum thruster cone + cool-down glow
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.0, 16, 1, true), nozzleMat);
  bell.position.y = 0.95;
  hullGroup.add(bell);

  const plumeMat = new THREE.MeshBasicMaterial({
    color: 0xffd875,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const thrusterPlume = new THREE.Mesh(new THREE.ConeGeometry(0.68, 3.6, 16), plumeMat);
  thrusterPlume.position.y = -0.82;
  thrusterPlume.visible = false;
  hullGroup.add(thrusterPlume);

  // Airlock Hatch + Warm Cabin Interior + Deployable EVA Boarding Ladder (+X/Base facing side)
  const hatchMount = new THREE.Group();
  hatchMount.rotation.y = -0.18;
  hullGroup.add(hatchMount);

  const cabinRecess = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.05, 0.72), cabinGlowMat);
  cabinRecess.position.set(1.25, 2.55, 0);
  hatchMount.add(cabinRecess);

  const doorwayFrame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.18, 0.86), hatchFrameMat);
  doorwayFrame.position.set(1.52, 2.55, 0);
  hatchMount.add(doorwayFrame);

  const cabinLight = new THREE.PointLight(0xffcf86, 0, 7.5, 1.6);
  cabinLight.position.set(1.5, 2.65, 0);
  hatchMount.add(cabinLight);

  const hatchDoorPivot = new THREE.Group();
  hatchDoorPivot.position.set(1.62, 2.55, -0.38);
  const hatchLeaf = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.08, 0.76), goldFoilMat);
  hatchLeaf.position.set(0, 0, 0.38);
  hatchDoorPivot.add(hatchLeaf);
  const hatchWindow = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.34), cabinGlowMat);
  hatchWindow.position.set(0.01, 0.16, 0.38);
  hatchDoorPivot.add(hatchWindow);
  hatchMount.add(hatchDoorPivot);

  const porch = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.9), hatchFrameMat);
  porch.position.set(1.86, 1.92, 0);
  hatchMount.add(porch);

  const ladderPivot = new THREE.Group();
  ladderPivot.position.set(2.08, 1.90, 0);
  ladderPivot.rotation.z = 0.26;
  const ladderRailL = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.96, 8), strutMat);
  ladderRailL.position.set(0, -0.98, -0.26);
  ladderPivot.add(ladderRailL);
  const ladderRailR = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.96, 8), strutMat);
  ladderRailR.position.set(0, -0.98, 0.26);
  ladderPivot.add(ladderRailR);
  for (let r = 0; r < 6; r++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.54, 8), goldFoilMat);
    rung.rotation.x = Math.PI / 2;
    rung.position.set(0, -0.22 - r * 0.31, 0);
    ladderPivot.add(rung);
  }
  hatchMount.add(ladderPivot);

  const dustRingMat = new THREE.MeshBasicMaterial({
    color: 0xcbd5e1,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const dustRingGeo = new THREE.RingGeometry(1.4, 4.2, 32);
  dustRingGeo.rotateX(-Math.PI / 2);
  const dustRing = new THREE.Mesh(dustRingGeo, dustRingMat);
  dustRing.position.y = 0.12;
  dustRing.visible = false;
  root.add(dustRing);

  // Four articulated landing gear legs + footpads (footpads stay grounded on y = 0.07)
  const legs = [];
  for (let i = 0; i < 4; i++) {
    const legGroup = new THREE.Group();
    legGroup.rotation.y = (i * Math.PI) / 2 + Math.PI / 4;

    const legDeployPivot = new THREE.Group();
    legDeployPivot.position.set(1.75, 1.55, 0);

    const upperStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 2.05, 8), strutMat);
    upperStrut.position.set(0.65, -0.58, 0);
    upperStrut.rotation.z = 0.68;
    legDeployPivot.add(upperStrut);

    const sideBrace = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.35, 8), strutMat);
    sideBrace.position.set(0.68, -0.15, 0);
    sideBrace.rotation.z = 1.15;
    legDeployPivot.add(sideBrace);

    const lowerStrut = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.15, 8), goldFoilMat);
    lowerStrut.position.set(1.22, -1.16, 0);
    lowerStrut.rotation.z = 0.42;
    legDeployPivot.add(lowerStrut);

    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.56, 0.14, 14), goldFoilMat);
    pad.position.set(1.45, -1.48, 0);
    legDeployPivot.add(pad);

    legGroup.add(legDeployPivot);
    root.add(legGroup);
    legs.push({ legGroup, legDeployPivot, pad });
  }

  // Blinking navigation strobe on top of Cargo Lander
  const strobeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x38bdf8),
    emissiveIntensity: 1.5,
  });
  const strobeBulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), strobeMat);
  strobeBulb.position.set(0, 4.45, 0);
  hullGroup.add(strobeBulb);
  const strobeGlow = makeGlow(0x38bdf8, 2.2, 0.7);
  strobeGlow.position.set(0, 4.45, 0);
  hullGroup.add(strobeGlow);

  // Computes clean world coordinates for astronaut descending lander hatch -> ladder -> lunar surface
  function getEgressWorldPose(progress) {
    const p = clamp(progress, 0, 1);
    const rotY = -0.18;
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const baseY = sampleTerrainHeight(pos.x, pos.z);
    let lx = 1.4;
    let ly = 2.02;
    let facing = -0.18;

    if (p < 0.2) {
      const k = p / 0.2;
      lx = 1.4 + k * 0.62;
      ly = 2.02 - k * 0.08;
      facing = Math.PI * 0.5 - 0.18;
    } else if (p < 0.82) {
      const k = (p - 0.2) / 0.62;
      lx = 2.02 + k * 0.65;
      ly = 1.94 * (1 - k);
      facing = -Math.PI * 0.5 - 0.18; // climbing facing ladder while stepping down rungs
    } else {
      const k = (p - 0.82) / 0.18;
      lx = 2.67 + k * 0.75;
      ly = 0;
      facing = lerpAngle(-Math.PI * 0.5 - 0.18, Math.PI * 0.5 - 0.18, k);
    }

    const wx = pos.x + lx * cosY;
    const wz = pos.z - lx * sinY;
    const groundAtFoot = sampleTerrainHeight(wx, wz);
    return {
      x: wx,
      y: Math.max(groundAtFoot, baseY + ly),
      z: wz,
      facing,
      climbing: p >= 0.2 && p < 0.82,
      walkingOff: p >= 0.82,
    };
  }

  tagBuildingRecursive(root, 'lander');
  return {
    root,
    hullGroup,
    legs,
    hatchDoorPivot,
    cabinGlowMat,
    cabinLight,
    ladderPivot,
    nozzleMat,
    strobeMat,
    strobeGlow,
    thrusterPlume,
    plumeMat,
    dustRing,
    dustRingMat,
    getEgressWorldPose,
  };
}

function buildCommsModule() {
  const root = new THREE.Group();
  root.name = 'comms';
  const pos = BUILDING_LAYOUT.comms;
  root.position.set(pos.x, sampleTerrainHeight(pos.x, pos.z), pos.z);

  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x3b4963,
    roughness: 0.45,
    metalness: 0.5,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: 0xe6edf6,
    roughness: 0.3,
    metalness: 0.4,
  });
  const linkMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x0ea5e9),
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  // Ground foundation & electronics box
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.6, 0.45, 16), baseMat);
  plinth.position.y = 0.22;
  root.add(plinth);

  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.85, 1.15), trimMat);
  cabinet.position.y = 0.85;
  root.add(cabinet);

  // Telescopic lattice mast (bottom pivot at cabinet top y = 1.25)
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.24, 2.35, 10), baseMat);
  mast.geometry.translate(0, 1.175, 0);
  mast.position.y = 0.92;
  root.add(mast);

  // Earth-pointing parabolic high-gain relay dish
  const dishPivot = new THREE.Group();
  dishPivot.position.set(0, 3.25, 0);

  const dishHead = new THREE.Group();

  const dishMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.28,
    metalness: 0.45,
    side: THREE.DoubleSide,
  });
  const dishBowl = new THREE.Mesh(
    new THREE.SphereGeometry(1.25, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.42),
    dishMat
  );
  dishBowl.rotation.x = Math.PI * 0.72;
  dishHead.add(dishBowl);

  const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.09, 0.9, 8), baseMat);
  feedHorn.position.set(0, 0.42, -0.52);
  feedHorn.rotation.x = -Math.PI * 0.28;
  dishHead.add(feedHorn);

  const feedBulb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), linkMat);
  feedBulb.position.set(0, 0.76, -0.82);
  dishHead.add(feedBulb);

  const linkGlow = makeGlow(0x38bdf8, 2.8, 0.65);
  linkGlow.position.copy(feedBulb.position);
  dishHead.add(linkGlow);

  dishPivot.add(dishHead);
  root.add(dishPivot);

  const beacon = createWarningBeacon(2.9);
  beacon.group.position.set(0.65, 1.35, 0.55);
  root.add(beacon.group);

  tagBuildingRecursive(root, 'comms');
  return { root, cabinet, mast, dishPivot, dishHead, linkMat, linkGlow, beacon };
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

  // Portable mission-control site scanner prop + ground telemetry pulse ring (shown in Scene 4–5)
  const scannerGroup = new THREE.Group();
  scannerGroup.position.set(0.32, 0.65, 0.35);
  scannerGroup.visible = false;

  const scannerStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.42, 8), stripeMat);
  scannerStem.position.y = -0.05;
  scannerGroup.add(scannerStem);

  const scannerHeadMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x00d2ff),
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const scannerHead = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.22), scannerHeadMat);
  scannerHead.position.set(0, 0.16, 0.05);
  scannerGroup.add(scannerHead);

  const scanBeamRingMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const scanBeamRingGeo = new THREE.RingGeometry(0.65, 0.85, 28);
  scanBeamRingGeo.rotateX(-Math.PI / 2);
  const scanBeamRing = new THREE.Mesh(scanBeamRingGeo, scanBeamRingMat);
  scanBeamRing.position.set(0, -0.58, 0.45);
  scannerGroup.add(scanBeamRing);

  fig.add(scannerGroup);

  fig.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return {
    fig,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    scannerGroup,
    scannerHead,
    scanBeamRing,
    scanBeamRingMat,
  };
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

function buildNasaFlag() {
  const flagGroup = new THREE.Group();
  flagGroup.name = 'nasaFlag';
  const fx = 4.4;
  const fz = 7.4;
  flagGroup.position.set(fx, sampleTerrainHeight(fx, fz), fz);
  flagGroup.rotation.y = -0.18;

  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xdbeafe,
    roughness: 0.35,
    metalness: 0.7,
  });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 2.75, 10), poleMat);
  pole.position.y = 1.38;
  flagGroup.add(pole);

  const topCrossbar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.28, 8), poleMat);
  topCrossbar.rotation.z = Math.PI / 2;
  topCrossbar.position.set(0.62, 2.68, 0);
  flagGroup.add(topCrossbar);

  const flagTex = canvasTexture(192, 128, (ctx, w, h) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#0b3d91';
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = '#0b3d91';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(42, 82);
    ctx.quadraticCurveTo(96, 36, 152, 54);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NASA', w / 2, h / 2 + 2);
  });

  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 0.8),
    new THREE.MeshStandardMaterial({
      map: flagTex,
      roughness: 0.5,
      side: THREE.DoubleSide,
    })
  );
  banner.position.set(0.62, 2.26, 0);
  flagGroup.add(banner);

  flagGroup.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return flagGroup;
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
  const comms = buildCommsModule();
  const lander = buildCargoLander();
  const rover = buildLunarRover();
  const nasaFlag = buildNasaFlag();
  const astro1 = buildAstronautFigure(0x38bdf8);
  const astro2 = buildAstronautFigure(0xfbbf24);

  group.add(
    habitat.root,
    lifeSupport.root,
    solar.root,
    greenhouse.root,
    lab.root,
    comms.root,
    lander.root,
    rover.root,
    nasaFlag,
    astro1.fig,
    astro2.fig
  );

  const interactiveRoots = [
    habitat.root,
    lifeSupport.root,
    solar.root,
    greenhouse.root,
    lab.root,
    comms.root,
  ];

  const byId = {
    habitat: habitat.root,
    lifeSupport: lifeSupport.root,
    solar: solar.root,
    greenhouse: greenhouse.root,
    lab: lab.root,
    comms: comms.root,
    lander: lander.root,
    rover: rover.root,
  };

  const moduleList = [
    { id: 'habitat', root: habitat.root },
    { id: 'lifeSupport', root: lifeSupport.root },
    { id: 'solar', root: solar.root },
    { id: 'greenhouse', root: greenhouse.root },
    { id: 'lab', root: lab.root },
    { id: 'comms', root: comms.root },
  ];

  // Capture base color & emissive of each interactive module for clean non-destructive focus dimming
  const trackedMaterials = {};
  for (const mod of moduleList) {
    const seenMats = new Set();
    const entries = [];
    mod.root.traverse((obj) => {
      if (!obj.isMesh || !obj.material) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (seenMats.has(mat)) continue;
        seenMats.add(mat);
        entries.push({
          mat,
          baseColor: mat.color ? mat.color.clone() : null,
        });
      }
    });
    trackedMaterials[mod.id] = { entries, currentDim: 1 };
  }

  let astro1WalkAccum = 0;

  function updateBuildings(snapshot, dt, elapsedClock, sunAzimuthRad, sceneFx = {}) {
    const mods = snapshot?.modules || {};
    const brownout = Boolean(snapshot?.power?.brownout);
    const sheltered = Boolean(snapshot?.crew?.sheltered);
    const shieldLevel = clamp(num(snapshot?.shieldLevel, 0), 0, 3);
    const collectingIce = num(snapshot?.cooldowns?.collectIce, 0) > 0;
    const focusedId = sceneFx.focusedId || null;
    const setupStage = typeof sceneFx.setupStage === 'number' ? sceneFx.setupStage : 6;
    const deployMap = sceneFx.deployProgress || null;
    const landerAlt = num(sceneFx.landerAltitude, 0);
    const landerPitch = num(sceneFx.landerPitch, 0);
    const landerRoll = num(sceneFx.landerRoll, 0);
    const gearDeploy = clamp(num(sceneFx.gearDeploy, 1), 0, 1);
    const suspensionCompress = clamp(num(sceneFx.suspensionCompress, 0), 0, 1);
    const hatchOpen = clamp(num(sceneFx.hatchOpen, 0), 0, 1);
    const ladderDeploy = clamp(num(sceneFx.ladderDeploy, 0), 0, 1);
    const thrusterPower = clamp(num(sceneFx.thrusterPower, 0), 0, 1);
    const nozzleHeat = clamp(num(sceneFx.nozzleHeat, thrusterPower), 0, 1);
    const dustPlumeIntensity = clamp(num(sceneFx.dustPlumeIntensity, 0), 0, 1);
    const evacuating = Boolean(sceneFx.evacuating);

    const getDeploy = (id, idx) => {
      if (deployMap && typeof deployMap[id] === 'number') {
        return clamp(deployMap[id], 0, 1);
      }
      return idx < setupStage ? 1 : 0;
    };

    // Subtle focus highlighting / unfocused dimming across all 6 core modules
    const focusDimFactor = (id) => {
      const rec = trackedMaterials[id];
      const targetDim = !focusedId || focusedId === id ? 1.0 : 0.62;
      if (!rec) return targetDim;
      rec.currentDim = damp(rec.currentDim, targetDim, 7, dt);
      for (const entry of rec.entries) {
        if (entry.baseColor && entry.mat.color && id !== 'solar') {
          entry.mat.color.copy(entry.baseColor).multiplyScalar(rec.currentDim);
        }
      }
      return rec.currentDim;
    };
    const glowScale = (id) => (!focusedId || focusedId === id ? (focusedId === id ? 1.2 : 1.0) : 0.34);

    // 1. Habitat & Storm Shelter: deploy rigging, window glow, shelter collar + regolith shield berm
    const habDeploy = getDeploy('habitat', 0);
    habitat.root.visible = habDeploy > 0.005;
    if (habitat.root.visible) {
      const padT = smooth01(0, 0.28, habDeploy);
      const expandT = smooth01(0.18, 0.88, habDeploy);
      const lockT = smooth01(0.45, 0.95, habDeploy);
      habitat.basePlate.scale.set(0.35 + 0.65 * padT, 0.25 + 0.75 * padT, 0.35 + 0.65 * padT);
      habitat.coreHullGroup.scale.set(
        0.58 + 0.42 * expandT,
        0.14 + 0.86 * expandT,
        0.58 + 0.42 * expandT
      );
      habitat.airlockGroup.scale.setScalar(0.35 + 0.65 * lockT);
      habitat.airlockGroup.position.set(0, 0, -1.0 * (1 - lockT));
    }
    focusDimFactor('habitat');

    const habOnlineFactor = smooth01(0.7, 1.0, habDeploy);
    const habHealth = num(mods.habitat?.health, 100);
    const gsHab = glowScale('habitat');
    const habTargetEmissive = (brownout ? 0.45 : sheltered ? 2.4 : 1.3) * gsHab * habOnlineFactor;
    habitat.windowMat.emissiveIntensity = damp(habitat.windowMat.emissiveIntensity, habTargetEmissive, 6, dt);
    habitat.habGlow.material.opacity = damp(
      habitat.habGlow.material.opacity,
      (brownout ? 0.16 : sheltered ? 0.8 : 0.45) * gsHab * habOnlineFactor,
      6,
      dt
    );
    habitat.shelterTrimMat.emissiveIntensity = damp(
      habitat.shelterTrimMat.emissiveIntensity,
      (sheltered ? 1.85 : shieldLevel > 0 ? 0.95 : focusedId === 'habitat' ? 0.72 : 0.28) * habOnlineFactor,
      6,
      dt
    );

    const targetBerm = (shieldLevel / 3) * habOnlineFactor;
    habitat.currentBermScale = damp(habitat.currentBermScale, targetBerm, 4, dt);
    habitat.bermGroup.visible = habitat.currentBermScale > 0.02;
    habitat.bermGroup.scale.set(
      0.94 + habitat.currentBermScale * 0.12,
      Math.max(0.02, habitat.currentBermScale),
      0.94 + habitat.currentBermScale * 0.12
    );
    habitat.capShell.visible = shieldLevel >= 2 && habDeploy > 0.8;

    // 2. Life Support: skid & machinery unfold + umbilical extend + fan spin + green indicator
    const lsDeploy = getDeploy('lifeSupport', 1);
    lifeSupport.root.visible = lsDeploy > 0.005;
    if (lifeSupport.root.visible) {
      const skidT = smooth01(0, 0.25, lsDeploy);
      const rigT = smooth01(0.2, 0.82, lsDeploy);
      const pipeT = smooth01(0.55, 1.0, lsDeploy);
      lifeSupport.skid.scale.set(0.4 + 0.6 * skidT, 0.4 + 0.6 * skidT, 0.4 + 0.6 * skidT);
      lifeSupport.upperMachinery.scale.set(1, 0.12 + 0.88 * rigT, 1);
      lifeSupport.pipeGroup.scale.set(1, 1, 0.05 + 0.95 * pipeT);
    }
    focusDimFactor('lifeSupport');

    const lsActive = smooth01(0.72, 1.0, lsDeploy);
    const lsOnline = mods.lifeSupport?.online !== false && !brownout && lsDeploy > 0.72;
    const lsHealth = num(mods.lifeSupport?.health, 100);
    const gsLs = glowScale('lifeSupport');
    if (lsOnline) {
      lifeSupport.bladesGroup.rotation.z += dt * 7.5 * lsActive;
    }
    lifeSupport.indicatorMat.emissiveIntensity = damp(
      lifeSupport.indicatorMat.emissiveIntensity,
      (lsOnline ? 1.55 : 0.06) * gsLs * lsActive,
      6,
      dt
    );
    lifeSupport.statusGlow.material.opacity = damp(
      lifeSupport.statusGlow.material.opacity,
      (lsOnline ? 0.58 : 0.04) * gsLs * lsActive,
      6,
      dt
    );

    // 3. Solar Array: sequential mast telescope + wing unfold (90deg -> 0) + yaw alignment toward sun + dust tint
    const solarDeploy = getDeploy('solar', 2);
    solar.root.visible = solarDeploy > 0.005;
    const solarDim = focusDimFactor('solar');
    if (solar.root.visible) {
      const hubT = smooth01(0, 0.22, solarDeploy);
      solar.hub.scale.setScalar(0.35 + 0.65 * hubT);
      solar.towers.forEach((tObj, i) => {
        const localDelay = i * 0.07;
        const mastT = smooth01(0.08 + localDelay, 0.55 + localDelay, solarDeploy);
        const wingT = smooth01(0.48 + localDelay * 0.6, 0.96, solarDeploy);
        tObj.mast.scale.y = 0.08 + 0.92 * mastT;
        tObj.pivot.position.y = 0.65 + 2.2 * mastT;
        for (const wp of tObj.wingPivots) {
          wp.group.rotation.y = (1 - wingT) * (wp.side < 0 ? 1.48 : -1.48);
          wp.group.scale.y = 0.35 + 0.65 * mastT;
        }
      });
    }

    const solarActive = smooth01(0.7, 1.0, solarDeploy);
    const solarOnline = mods.solar?.online !== false && solarDeploy > 0.7;
    const solarHealth = num(mods.solar?.health, 100);
    const alignment = clamp(num(mods.solar?.alignment, 1), 0, 1);
    const dust = clamp(num(mods.solar?.dust, 0), 0, 1);

    const targetYaw = sunAzimuthRad + (1 - alignment) * 1.45;
    solar.currentYaw = dampAngle(solar.currentYaw, targetYaw, 4.5, dt);
    const stowedYawOffset = (1 - smooth01(0.65, 1.0, solarDeploy)) * 1.25;
    for (let i = 0; i < solar.pivots.length; i++) {
      solar.pivots[i].rotation.y = solar.currentYaw + stowedYawOffset;
    }

    solar.panelMat.color.lerpColors(CLEAN_SOLAR_COLOR, DUSTY_SOLAR_COLOR, dust * 0.85).multiplyScalar(solarDim);
    solar.panelMat.roughness = 0.25 + dust * 0.6;
    const gsSolar = glowScale('solar');
    solar.panelMat.emissiveIntensity =
      (solarOnline && !brownout ? 0.45 * (1 - dust * 0.65) : 0.08) * gsSolar * solarActive;
    solar.ledMat.emissiveIntensity = (solarOnline ? 1.25 : 0.08) * gsSolar * solarActive;

    // 4. Greenhouse: cradle sets, Quonset ribs rise, crops sprout + pink grow lights ignite
    const ghDeploy = getDeploy('greenhouse', 3);
    greenhouse.root.visible = ghDeploy > 0.005;
    if (greenhouse.root.visible) {
      const cradleT = smooth01(0, 0.25, ghDeploy);
      const canopyT = smooth01(0.18, 0.86, ghDeploy);
      greenhouse.cradle.scale.set(0.4 + 0.6 * cradleT, 0.35 + 0.65 * cradleT, 0.4 + 0.6 * cradleT);
      greenhouse.canopyGroup.scale.set(0.75 + 0.25 * canopyT, 0.06 + 0.94 * canopyT, 1);
    }
    focusDimFactor('greenhouse');

    const ghLightT = smooth01(0.65, 1.0, ghDeploy);
    const gsGh = glowScale('greenhouse');
    const ghOnline = mods.greenhouse?.online !== false && !brownout && ghDeploy > 0.65;
    const ghHealth = num(mods.greenhouse?.health, 100);
    const planted = Boolean(mods.greenhouse?.planted);
    const growth = clamp(num(mods.greenhouse?.growth, 0), 0, 100);

    greenhouse.cropsGroup.visible = planted && ghDeploy > 0.35;
    const targetCropScale = planted ? (0.22 + (growth / 100) * 0.95) * smooth01(0.35, 0.95, ghDeploy) : 0.01;
    greenhouse.currentCropScale = damp(greenhouse.currentCropScale, targetCropScale, 5, dt);
    const cropBreath = ghOnline ? 1 + 0.03 * Math.sin(elapsedClock * 2.4) : 1;
    greenhouse.cropsGroup.scale.set(
      cropBreath,
      Math.max(0.04, greenhouse.currentCropScale * cropBreath),
      cropBreath
    );

    greenhouse.growBarMat.emissiveIntensity = damp(
      greenhouse.growBarMat.emissiveIntensity,
      (ghOnline ? 1.75 : 0.05) * gsGh * ghLightT,
      6,
      dt
    );
    greenhouse.glassMat.emissiveIntensity = damp(
      greenhouse.glassMat.emissiveIntensity,
      (ghOnline ? 0.42 : 0.03) * gsGh * ghLightT,
      6,
      dt
    );
    greenhouse.growGlow.material.opacity = damp(
      greenhouse.growGlow.material.opacity,
      (ghOnline ? 0.68 : 0.03) * gsGh * ghLightT,
      6,
      dt
    );

    // 5. Science Lab: octagonal pod extends onto foundation + deep-space dish rotation
    const labDeploy = getDeploy('lab', 4);
    lab.root.visible = labDeploy > 0.005;
    if (lab.root.visible) {
      const baseT = smooth01(0, 0.25, labDeploy);
      const podT = smooth01(0.18, 0.88, labDeploy);
      lab.base.scale.setScalar(0.35 + 0.65 * baseT);
      lab.podGroup.scale.set(0.65 + 0.35 * podT, 0.1 + 0.9 * podT, 0.65 + 0.35 * podT);
    }
    focusDimFactor('lab');

    const labActiveT = smooth01(0.7, 1.0, labDeploy);
    const gsLab = glowScale('lab');
    const labOnline = mods.lab?.online !== false && !brownout && !sheltered && labDeploy > 0.7;
    const labHealth = num(mods.lab?.health, 100);
    if (labOnline) {
      lab.dishPivot.rotation.y += dt * 0.65 * labActiveT;
    }
    lab.labWinMat.emissiveIntensity = damp(
      lab.labWinMat.emissiveIntensity,
      (labOnline ? 1.45 : 0.1) * gsLab * labActiveT,
      6,
      dt
    );
    lab.labGlow.material.opacity = damp(
      lab.labGlow.material.opacity,
      (labOnline ? 0.54 : 0.04) * gsLab * labActiveT,
      6,
      dt
    );

    // 6. Communications Relay: mast telescopes skyward, dish pitches from stowed zenith to lock onto Earth
    const commsDeploy = getDeploy('comms', 5);
    comms.root.visible = commsDeploy > 0.005;
    if (comms.root.visible) {
      const cabT = smooth01(0, 0.25, commsDeploy);
      const mastT = smooth01(0.18, 0.72, commsDeploy);
      const dishAimT = smooth01(0.58, 1.0, commsDeploy);
      comms.cabinet.scale.setScalar(0.35 + 0.65 * cabT);
      comms.mast.scale.y = 0.12 + 0.88 * mastT;
      comms.dishPivot.position.y = 1.25 + 2.0 * mastT;
      // Aim dish azimuth cleanly toward Earth at (26, 15.5, -104) relative to comms (1.2, 0, -9.6)
      const earthYaw = Math.atan2(-(26 - BUILDING_LAYOUT.comms.x), -(-104 - BUILDING_LAYOUT.comms.z));
      comms.dishHead.rotation.x = -(1 - dishAimT) * 1.15;
      comms.dishPivot.rotation.y =
        earthYaw * dishAimT + Math.sin(elapsedClock * 0.45) * 0.08 * dishAimT;
    }
    focusDimFactor('comms');

    const commsActiveT = smooth01(0.75, 1.0, commsDeploy);
    const commsOnline = mods.comms?.online !== false && !brownout && commsDeploy > 0.75;
    const commsHealth = num(mods.comms?.health, 100);
    const gsComms = glowScale('comms');
    comms.linkMat.emissiveIntensity = damp(
      comms.linkMat.emissiveIntensity,
      (commsOnline ? 1.6 : 0.08) * gsComms * commsActiveT,
      6,
      dt
    );
    comms.linkGlow.material.opacity = damp(
      comms.linkGlow.material.opacity,
      (commsOnline ? 0.68 : 0.04) * gsComms * commsActiveT,
      6,
      dt
    );

    // Warning beacons flash red only on deployed modules with health < 40 or offline
    const pulse = 0.5 + 0.5 * Math.sin(elapsedClock * 9.5);
    const checks = [
      [habitat.beacon, habHealth, mods.habitat?.online !== false, habDeploy],
      [lifeSupport.beacon, lsHealth, mods.lifeSupport?.online !== false, lsDeploy],
      [solar.beacon, solarHealth, mods.solar?.online !== false, solarDeploy],
      [greenhouse.beacon, ghHealth, mods.greenhouse?.online !== false, ghDeploy],
      [lab.beacon, labHealth, mods.lab?.online !== false, labDeploy],
      [comms.beacon, commsHealth, mods.comms?.online !== false, commsDeploy],
    ];
    for (const [beacon, hp, online, dProg] of checks) {
      const warn = dProg > 0.85 && (hp < 40 || !online);
      beacon.bulbMat.emissiveIntensity = warn ? 0.4 + pulse * 2.4 : 0;
      beacon.glow.material.opacity = warn ? 0.25 + pulse * 0.7 : 0;
    }

    // 7. NASA Flag & Lunar Rover deployment
    const flagDeploy = deployMap && typeof deployMap.flag === 'number' ? clamp(deployMap.flag, 0, 1) : 1;
    nasaFlag.visible = flagDeploy > 0.02;
    nasaFlag.scale.setScalar(Math.max(0.05, flagDeploy));

    const roverActive = sceneFx.roverActive !== false && labDeploy > 0.7;
    rover.root.visible = roverActive;
    if (roverActive) {
      const roverSpeed = collectingIce ? 0.55 : 0.22;
      rover.pathAngle = (rover.pathAngle + dt * roverSpeed) % (Math.PI * 2);
      const a = rover.pathAngle;
      const rx = 11.8 + Math.cos(a) * 1.8;
      const rz = 4.4 + Math.sin(a) * 2.4;
      const nextA = a + 0.05;
      const nrx = 11.8 + Math.cos(nextA) * 1.8;
      const nrz = 4.4 + Math.sin(nextA) * 2.4;
      const ry = sampleTerrainHeight(rx, rz);

      rover.root.position.set(rx, ry, rz);
      rover.root.rotation.y = Math.atan2(nrx - rx, nrz - rz);
      for (const w of rover.wheels) {
        w.rotation.x += dt * roverSpeed * 5.0;
      }
    }

    // 8. Cargo Lander attitude, gear deploy/compression, hatch/ladder kinematics, nozzle cool-down
    const landerBasePos = BUILDING_LAYOUT.lander;
    const landerGroundY = sampleTerrainHeight(landerBasePos.x, landerBasePos.z);
    lander.root.position.set(
      landerBasePos.x + num(sceneFx.landerOffsetX, 0),
      landerGroundY + landerAlt,
      landerBasePos.z + num(sceneFx.landerOffsetZ, 0)
    );
    lander.root.rotation.set(landerPitch, num(sceneFx.landerYaw, 0), landerRoll);

    lander.hullGroup.position.y = -0.22 * suspensionCompress;
    const gearAngle = -(1 - gearDeploy) * 0.62 - suspensionCompress * 0.09;
    for (const lObj of lander.legs) {
      lObj.legDeployPivot.rotation.z = gearAngle;
    }

    lander.hatchDoorPivot.rotation.y = hatchOpen * 1.95;
    lander.cabinGlowMat.emissiveIntensity = 0.08 + hatchOpen * 2.15;
    lander.cabinLight.intensity = hatchOpen * 3.8;
    lander.ladderPivot.visible = ladderDeploy > 0.03;
    lander.ladderPivot.scale.y = Math.max(0.05, ladderDeploy);

    lander.nozzleMat.emissiveIntensity = nozzleHeat * 1.9;
    lander.thrusterPlume.visible = thrusterPower > 0.03;
    if (lander.thrusterPlume.visible) {
      const flicker = 0.88 + 0.24 * Math.sin(elapsedClock * 38);
      lander.thrusterPlume.scale.set(
        0.75 + thrusterPower * 0.45,
        thrusterPower * flicker,
        0.75 + thrusterPower * 0.45
      );
      lander.plumeMat.opacity = clamp(thrusterPower * 0.84, 0, 0.92);
    } else {
      lander.plumeMat.opacity = 0;
    }

    lander.dustRing.visible = dustPlumeIntensity > 0.03;
    if (lander.dustRing.visible) {
      const ringScale = 0.75 + (1 - clamp(landerAlt / 5, 0, 1)) * 1.15;
      lander.dustRing.scale.setScalar(ringScale);
      lander.dustRingMat.opacity = clamp(dustPlumeIntensity * 0.48, 0, 0.58);
    } else {
      lander.dustRingMat.opacity = 0;
    }

    const landerBlink = Math.pow(0.5 + 0.5 * Math.sin(elapsedClock * 3.8), 6);
    lander.strobeMat.emissiveIntensity = 0.25 + landerBlink * 2.2;
    lander.strobeGlow.material.opacity = 0.12 + landerBlink * 0.65;

    // 9. Animated Lunar Astronauts (lander egress, portable scan, non-sliding outpost walk, or patrol)
    const boarded = Boolean(sceneFx.boarded);
    const hideAstronauts = Boolean(sceneFx.hideAstronauts);
    const hasEgress = typeof sceneFx.astro1EgressProgress === 'number';
    astro1.fig.visible = !sheltered && !boarded && !hideAstronauts;
    astro2.fig.visible = !sheltered && !boarded && !hideAstronauts && sceneFx.astro2Visible !== false;

    const scannerActive = Boolean(sceneFx.scannerActive);
    astro1.scannerGroup.visible = scannerActive && astro1.fig.visible;
    if (astro1.scannerGroup.visible) {
      const scanWave = (elapsedClock * 1.4) % 1;
      astro1.scannerHead.rotation.y = Math.sin(elapsedClock * 4.5) * 0.65;
      astro1.scanBeamRing.scale.setScalar(0.55 + scanWave * 2.2);
      astro1.scanBeamRingMat.opacity = (1 - scanWave) * 0.75;
    }

    if (astro1.fig.visible) {
      if (hasEgress) {
        const pose = lander.getEgressWorldPose(sceneFx.astro1EgressProgress);
        astro1.fig.position.set(pose.x, pose.y, pose.z);
        astro1.fig.rotation.y = pose.facing;
        if (pose.climbing) {
          const climbPhase = sceneFx.astro1EgressProgress * Math.PI * 12;
          astro1.leftArm.rotation.x = -0.9 + Math.sin(climbPhase) * 0.45;
          astro1.rightArm.rotation.x = -0.9 - Math.sin(climbPhase) * 0.45;
          astro1.leftLeg.rotation.x = Math.sin(climbPhase) * 0.42;
          astro1.rightLeg.rotation.x = -Math.sin(climbPhase) * 0.42;
        } else if (pose.walkingOff) {
          const stride = sceneFx.astro1EgressProgress * Math.PI * 10;
          astro1.leftArm.rotation.x = Math.sin(stride) * 0.35;
          astro1.rightArm.rotation.x = -Math.sin(stride) * 0.35;
          astro1.leftLeg.rotation.x = -Math.sin(stride) * 0.4;
          astro1.rightLeg.rotation.x = Math.sin(stride) * 0.4;
        } else {
          astro1.leftArm.rotation.x = 0;
          astro1.rightArm.rotation.x = 0;
          astro1.leftLeg.rotation.x = 0;
          astro1.rightLeg.rotation.x = 0;
        }
      } else if (sceneFx.astroWalkTarget) {
        const tx = sceneFx.astroWalkTarget.x;
        const tz = sceneFx.astroWalkTarget.z;
        const dxW = tx - astro1.fig.position.x;
        const dzW = tz - astro1.fig.position.z;
        const dist = Math.hypot(dxW, dzW);
        const maxSpeed = 2.4;
        if (dist > 0.08) {
          const step = Math.min(dist, maxSpeed * dt);
          astro1.fig.position.x += (dxW / dist) * step;
          astro1.fig.position.z += (dzW / dist) * step;
          astro1.fig.rotation.y = dampAngle(astro1.fig.rotation.y, Math.atan2(dxW, dzW), 9, dt);
          astro1WalkAccum += step * 3.8;
          const hop = Math.abs(Math.sin(astro1WalkAccum)) * 0.14;
          astro1.fig.position.y = sampleTerrainHeight(astro1.fig.position.x, astro1.fig.position.z) + hop;
          const swing = Math.sin(astro1WalkAccum) * 0.52;
          astro1.leftArm.rotation.x = swing;
          astro1.rightArm.rotation.x = scannerActive ? -0.75 : -swing;
          astro1.leftLeg.rotation.x = -swing * 0.85;
          astro1.rightLeg.rotation.x = swing * 0.85;
        } else {
          astro1.fig.position.y = sampleTerrainHeight(astro1.fig.position.x, astro1.fig.position.z);
          if (typeof sceneFx.astroFacingAngle === 'number') {
            astro1.fig.rotation.y = dampAngle(astro1.fig.rotation.y, sceneFx.astroFacingAngle, 7, dt);
          }
          astro1.leftArm.rotation.x = damp(astro1.leftArm.rotation.x, 0, 8, dt);
          astro1.rightArm.rotation.x = damp(astro1.rightArm.rotation.x, scannerActive ? -0.82 : 0, 8, dt);
          astro1.leftLeg.rotation.x = damp(astro1.leftLeg.rotation.x, 0, 8, dt);
          astro1.rightLeg.rotation.x = damp(astro1.rightLeg.rotation.x, 0, 8, dt);
        }
      } else if (evacuating) {
        const lx = landerBasePos.x + 2.6;
        const lz = landerBasePos.z;
        astro1.fig.position.x = damp(astro1.fig.position.x, lx, 3.5, dt);
        astro1.fig.position.z = damp(astro1.fig.position.z, lz, 3.5, dt);
        astro1.fig.position.y =
          sampleTerrainHeight(astro1.fig.position.x, astro1.fig.position.z) +
          Math.abs(Math.sin(elapsedClock * 4.2)) * 0.15;
        astro2.fig.position.x = damp(astro2.fig.position.x, lx + 0.6, 3.5, dt);
        astro2.fig.position.z = damp(astro2.fig.position.z, lz + 0.8, 3.5, dt);
        astro2.fig.position.y =
          sampleTerrainHeight(astro2.fig.position.x, astro2.fig.position.z) +
          Math.abs(Math.sin(elapsedClock * 4.2)) * 0.14;
      } else {
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

        const t2 = elapsedClock * 0.35 + 1.7;
        const ax2 = -1.2 + Math.cos(t2) * 1.3;
        const az2 = 6.8 + Math.sin(t2) * 1.0;
        const hop2 = Math.abs(Math.sin(elapsedClock * 2.9 + 1.1)) * 0.14;
        astro2.fig.position.set(ax2, sampleTerrainHeight(ax2, az2) + hop2, az2);
        astro2.fig.rotation.y = Math.atan2(-Math.sin(t2) * 1.3, Math.cos(t2) * 1.0);
        const swing2 = Math.sin(elapsedClock * 2.9) * 0.35;
        astro2.leftArm.rotation.x = swing2;
        astro2.rightArm.position.y = 0.78;
        astro2.rightArm.rotation.z = -2.35 + Math.sin(elapsedClock * 5.2) * 0.32;
        astro2.leftLeg.rotation.x = -swing2 * 0.7;
        astro2.rightLeg.rotation.x = swing2 * 0.7;
      }
    }
  }

  return {
    group,
    interactiveRoots,
    byId,
    lander,
    astro1,
    astro2,
    updateBuildings,
  };
}
