// Main Three.js Lunar South-Pole Outpost Scene (B-S1).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  clamp,
  damp,
  num,
  getGlowTexture,
  makeGlow,
  disposeObject,
} from './sceneUtils.js';
import {
  createLunarTerrain,
  createSkyAndCelestials,
  sampleTerrainHeight,
} from './terrain.js';
import {
  INTERACTIVE_BUILDING_IDS,
  BUILDING_LAYOUT,
  createOutpostBuildings,
} from './buildings.js';

const OVERVIEW_TARGET = new THREE.Vector3(0, 1.4, 0);
const OVERVIEW_CAMERA = new THREE.Vector3(0, 18.5, 29.5);
const SUN_ELEVATION_RAD = THREE.MathUtils.degToRad(7.5); // Low ~7.5° lunar south-pole sun

function createRingIndicator(innerRadius, outerRadius, colorHex, opacity) {
  const geo = new THREE.RingGeometry(innerRadius, outerRadius, 48);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.visible = false;
  mesh.renderOrder = 2;
  return { mesh, mat };
}

function createSolarStormParticles() {
  const count = 260;
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 65;
    positions[i * 3 + 1] = 1 + Math.random() * 24;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 65;

    velocities[i * 3] = -18 - Math.random() * 14;
    velocities[i * 3 + 1] = -3.5 - Math.random() * 3;
    velocities[i * 3 + 2] = 10 + Math.random() * 8;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    map: getGlowTexture(),
    color: 0xff6b35,
    size: 1.35,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  points.visible = false;

  function update(dt, active, intensity = 1) {
    mat.opacity = damp(mat.opacity, active ? 0.85 * intensity : 0, 5, dt);
    points.visible = mat.opacity > 0.02;
    if (!points.visible) return;

    const posAttr = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      let x = posAttr.getX(i) + velocities[i * 3] * dt;
      let y = posAttr.getY(i) + velocities[i * 3 + 1] * dt;
      let z = posAttr.getZ(i) + velocities[i * 3 + 2] * dt;

      if (y < 0.2 || x < -35 || z > 35) {
        x = 28 + Math.random() * 18;
        y = 8 + Math.random() * 18;
        z = -28 + (Math.random() - 0.5) * 36;
      }
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  return { points, update };
}

function createOxygenLeakParticles() {
  const count = 48;
  const positions = new Float32Array(count * 3);
  const ages = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    ages[i] = Math.random();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    map: getGlowTexture(),
    color: 0xdff9fb,
    size: 1.4,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  // Position at habitat airlock seam
  const habPos = BUILDING_LAYOUT.habitat;
  points.position.set(habPos.x + 1.15, sampleTerrainHeight(habPos.x, habPos.z) + 1.85, habPos.z + 2.85);
  points.visible = false;

  function update(dt, leaking) {
    mat.opacity = damp(mat.opacity, leaking ? 0.85 : 0, 6, dt);
    points.visible = mat.opacity > 0.02;
    if (!points.visible) return;

    const posAttr = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      ages[i] += dt * (0.85 + (i % 5) * 0.15);
      if (ages[i] >= 1) ages[i] -= 1;

      const t = ages[i];
      const spread = t * 1.4;
      const angle = i * 2.39996;
      const x = Math.cos(angle) * spread * 0.45 + t * 0.9;
      const y = t * 2.6;
      const z = Math.sin(angle) * spread * 0.45 + t * 1.3;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  return { points, update };
}

export function createOutpostScene({ canvas, onSelectBuilding } = {}) {
  if (!canvas) {
    throw new Error('createOutpostScene requires a canvas element');
  }

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  const baseSkyColor = new THREE.Color(0x03050a);
  const warningSkyColor = new THREE.Color(0x281706);
  const stormSkyColor = new THREE.Color(0x361108);
  const currentSkyColor = baseSkyColor.clone();
  scene.background = currentSkyColor;
  scene.fog = new THREE.FogExp2(0x070a12, 0.0045);

  const initialWidth = canvas.clientWidth || window.innerWidth || 1024;
  const initialHeight = canvas.clientHeight || window.innerHeight || 768;
  renderer.setSize(initialWidth, initialHeight, false);

  const camera = new THREE.PerspectiveCamera(45, initialWidth / initialHeight, 0.5, 420);
  camera.position.copy(OVERVIEW_CAMERA);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(OVERVIEW_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 7;
  controls.maxDistance = 58;
  controls.minPolarAngle = 0.14;
  controls.maxPolarAngle = Math.PI * 0.465;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.32;

  let userControllingCamera = false;
  let cameraTransitioning = false;
  const desiredTarget = OVERVIEW_TARGET.clone();
  const desiredCameraPos = OVERVIEW_CAMERA.clone();

  const onControlsStart = () => {
    userControllingCamera = true;
    cameraTransitioning = false;
    controls.autoRotate = false;
  };
  const onControlsEnd = () => {
    userControllingCamera = false;
    if (!focusedBuildingId) {
      controls.autoRotate = true;
    }
  };
  controls.addEventListener('start', onControlsStart);
  controls.addEventListener('end', onControlsEnd);

  // Lighting: South-Pole low-elevation directional Sun + Hemisphere + Ambient fill
  const hemiLight = new THREE.HemisphereLight(0x7c96c4, 0x2d313b, 0.62);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0x4a5568, 0.45);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xfff3db, 2.5);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 20;
  sunLight.shadow.camera.far = 190;
  const shadowExtent = 28;
  sunLight.shadow.camera.left = -shadowExtent;
  sunLight.shadow.camera.right = shadowExtent;
  sunLight.shadow.camera.top = shadowExtent;
  sunLight.shadow.camera.bottom = -shadowExtent;
  sunLight.shadow.bias = -0.0005;
  scene.add(sunLight);

  // Terrain, Sky, and Buildings
  const terrainGroup = createLunarTerrain();
  scene.add(terrainGroup);

  const sky = createSkyAndCelestials();
  scene.add(sky.skyGroup);

  const buildings = createOutpostBuildings();
  scene.add(buildings.group);

  // Event particle & flash effects
  const stormParticles = createSolarStormParticles();
  scene.add(stormParticles.points);

  const leakParticles = createOxygenLeakParticles();
  scene.add(leakParticles.points);

  const meteorFlashSprite = makeGlow(0xfff2cc, 16, 0);
  meteorFlashSprite.position.set(1.5, 4.5, -1.5);
  scene.add(meteorFlashSprite);
  const meteorPointLight = new THREE.PointLight(0xffd27d, 0, 32);
  meteorPointLight.position.copy(meteorFlashSprite.position);
  scene.add(meteorPointLight);

  // Hover & Selection Rings
  const hoverRing = createRingIndicator(1.0, 1.16, 0x54d2ff, 0.72);
  const selectRing = createRingIndicator(1.05, 1.26, 0xffd166, 0.9);
  scene.add(hoverRing.mesh, selectRing.mesh);

  function placeRingUnderBuilding(ring, buildingId, scaleMult = 1) {
    if (!buildingId || !BUILDING_LAYOUT[buildingId]) {
      ring.mesh.visible = false;
      return;
    }
    const spec = BUILDING_LAYOUT[buildingId];
    const y = sampleTerrainHeight(spec.x, spec.z) + 0.06;
    ring.mesh.position.set(spec.x, y, spec.z);
    ring.mesh.scale.setScalar(spec.radius * scaleMult);
    ring.mesh.visible = true;
  }

  // State tracking
  let latestSnapshot = null;
  let elapsedClock = 0;
  let hoveredBuildingId = null;
  let focusedBuildingId = null;
  let meteorFlashTimer = 0;
  const seenMeteorInstances = new Set();

  // Pointer & Raycasting
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  let pointerDownPos = null;

  function getInteractiveBuildingAtPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointerNdc, camera);
    const hits = raycaster.intersectObjects(buildings.interactiveRoots, true);
    for (const hit of hits) {
      let obj = hit.object;
      while (obj) {
        const id = obj.userData?.buildingId;
        if (id && INTERACTIVE_BUILDING_IDS.includes(id)) {
          return id;
        }
        obj = obj.parent;
      }
    }
    return null;
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    pointerDownPos = { x: e.clientX, y: e.clientY };
  }

  function onPointerMove(e) {
    const hitId = getInteractiveBuildingAtPointer(e.clientX, e.clientY);
    if (hitId !== hoveredBuildingId) {
      hoveredBuildingId = hitId;
      canvas.style.cursor = hoveredBuildingId ? 'pointer' : 'grab';
      placeRingUnderBuilding(hoverRing, hoveredBuildingId, 1.0);
    }
  }

  function onPointerUp(e) {
    if (!pointerDownPos) return;
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    pointerDownPos = null;

    // Ignore drags: only fire selection if pointer moved < 5px
    if (Math.hypot(dx, dy) >= 5) return;

    const hitId = getInteractiveBuildingAtPointer(e.clientX, e.clientY);
    if (hitId && INTERACTIVE_BUILDING_IDS.includes(hitId)) {
      if (typeof onSelectBuilding === 'function') {
        onSelectBuilding(hitId);
      }
    }
  }

  function onPointerLeave() {
    hoveredBuildingId = null;
    hoverRing.mesh.visible = false;
    canvas.style.cursor = 'grab';
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerLeave);

  function update(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') return;
    latestSnapshot = snapshot;

    // Detect micrometeoroid event trigger for brief flash
    const events = Array.isArray(snapshot.activeEvents) ? snapshot.activeEvents : [];
    for (const ev of events) {
      if (ev && ev.eventId === 'micrometeoroid') {
        const key = ev.instanceId || `${ev.eventId}_${ev.startedAt || 0}`;
        if (!seenMeteorInstances.has(key)) {
          seenMeteorInstances.add(key);
          meteorFlashTimer = 1.35;
        }
      }
    }
  }

  function focusBuilding(buildingId = null) {
    const validId = buildingId && BUILDING_LAYOUT[buildingId] ? buildingId : null;
    focusedBuildingId = validId;

    if (validId) {
      const spec = BUILDING_LAYOUT[validId];
      const groundY = sampleTerrainHeight(spec.x, spec.z);
      desiredTarget.set(spec.x, groundY + spec.focusHeight, spec.z);

      // Position camera at a pleasant 3/4 viewing angle relative to the building
      const angle = Math.atan2(spec.x, spec.z + 0.01) * 0.35;
      const dist = spec.camDist || 12.5;
      desiredCameraPos.set(
        spec.x + Math.sin(angle) * dist * 0.65,
        groundY + spec.focusHeight + dist * 0.48,
        spec.z + Math.cos(angle) * dist * 0.92
      );
      controls.autoRotate = false;
      placeRingUnderBuilding(selectRing, validId, 1.04);
    } else {
      desiredTarget.copy(OVERVIEW_TARGET);
      desiredCameraPos.copy(OVERVIEW_CAMERA);
      controls.autoRotate = !userControllingCamera;
      selectRing.mesh.visible = false;
    }

    cameraTransitioning = true;
  }

  function render(deltaSeconds = 1 / 60) {
    const dt = clamp(num(deltaSeconds, 1 / 60), 0.001, 0.1);
    elapsedClock += dt;

    // 1. Sun position & intensity (low south-pole horizon sweep)
    const timeOfDay = num(latestSnapshot?.mission?.timeOfDay, 0.22);
    const isDaylight = latestSnapshot?.mission?.isDaylight !== false;

    const events = Array.isArray(latestSnapshot?.activeEvents)
      ? latestSnapshot.activeEvents
      : [];
    const stormEvent = events.find((e) => e?.eventId === 'solarStorm');
    const hasLongShadow = events.some((e) => e?.eventId === 'longShadow');
    const hasOxygenLeak = events.some((e) => e?.eventId === 'oxygenLeak');
    const hasActiveMeteor = events.some(
      (e) => e?.eventId === 'micrometeoroid' && e.phase === 'active'
    );

    // Sweep sun gently along the northern/western horizon so shadows stay long and dramatic
    const sunAzimuth = -0.55 + Math.sin(timeOfDay * Math.PI * 2) * 0.65;
    const sunDist = 135;
    const cosEl = Math.cos(SUN_ELEVATION_RAD);
    const sinEl = Math.sin(SUN_ELEVATION_RAD);
    const sunX = Math.sin(sunAzimuth) * cosEl * sunDist;
    const sunY = sinEl * sunDist;
    const sunZ = -Math.cos(sunAzimuth) * cosEl * sunDist;

    sunLight.position.set(sunX, sunY, sunZ);
    sky.sunVisual.position.set(sunX * 1.15, sunY * 1.15, sunZ * 1.15);

    let targetSunIntensity = 2.55;
    if (!isDaylight || hasLongShadow) {
      targetSunIntensity = 0.28;
    } else if (stormEvent?.phase === 'active') {
      targetSunIntensity = 2.95;
    }
    sunLight.intensity = damp(sunLight.intensity, targetSunIntensity, 4, dt);

    const haloScale = !isDaylight || hasLongShadow ? 0.45 : 1.0;
    sky.sunHaloInner.scale.setScalar(28 * haloScale);
    sky.sunHaloOuter.scale.setScalar(58 * haloScale);

    // 2. Solar storm sky tint & particles
    const stormPulse = 0.5 + 0.5 * Math.sin(elapsedClock * 4.5);
    let targetSky = baseSkyColor;
    if (stormEvent?.phase === 'warning') {
      targetSky = baseSkyColor.clone().lerp(warningSkyColor, 0.45 + 0.35 * stormPulse);
    } else if (stormEvent?.phase === 'active') {
      targetSky = baseSkyColor.clone().lerp(stormSkyColor, 0.72 + 0.25 * stormPulse);
    }
    currentSkyColor.lerp(targetSky, 1 - Math.exp(-4 * dt));
    scene.fog.color.copy(currentSkyColor);

    stormParticles.update(
      dt,
      Boolean(stormEvent),
      stormEvent?.phase === 'active' ? 1.0 : 0.35
    );

    // 3. Oxygen leak vapor puff at habitat
    leakParticles.update(dt, hasOxygenLeak);

    // 4. Micrometeoroid impact flash
    if (hasActiveMeteor && meteorFlashTimer <= 0) {
      meteorFlashTimer = 0.65;
    }
    if (meteorFlashTimer > 0) {
      meteorFlashTimer = Math.max(0, meteorFlashTimer - dt);
      const flash = Math.sin((meteorFlashTimer / 1.35) * Math.PI) * 1.8;
      meteorFlashSprite.material.opacity = clamp(flash, 0, 1);
      meteorPointLight.intensity = Math.max(0, flash * 8);
    } else {
      meteorFlashSprite.material.opacity = 0;
      meteorPointLight.intensity = 0;
    }

    // 5. Rotate Earth slowly & animate rings
    sky.earthMesh.rotation.y += dt * 0.06;
    if (hoverRing.mesh.visible) {
      hoverRing.mat.opacity = 0.55 + 0.25 * Math.sin(elapsedClock * 5.0);
    }
    if (selectRing.mesh.visible) {
      const s = BUILDING_LAYOUT[focusedBuildingId]?.radius || 3.5;
      const breath = 1.02 + 0.04 * Math.sin(elapsedClock * 3.5);
      selectRing.mesh.scale.setScalar(s * breath);
    }

    // 6. Update all buildings, modules, beacons, and rover
    buildings.updateBuildings(latestSnapshot, dt, elapsedClock, sunAzimuth);

    // 7. Smooth camera focus lerp & OrbitControls update
    controls.target.lerp(desiredTarget, 1 - Math.exp(-6 * dt));
    if (cameraTransitioning && !userControllingCamera) {
      camera.position.lerp(desiredCameraPos, 1 - Math.exp(-5 * dt));
      if (
        camera.position.distanceToSquared(desiredCameraPos) < 0.04 &&
        controls.target.distanceToSquared(desiredTarget) < 0.02
      ) {
        cameraTransitioning = false;
      }
    }
    controls.update();

    renderer.render(scene, camera);
  }

  function resize(width, height) {
    const w = Math.max(1, Math.floor(num(width, canvas.clientWidth || window.innerWidth || 1024)));
    const h = Math.max(1, Math.floor(num(height, canvas.clientHeight || window.innerHeight || 768)));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function destroy() {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    controls.removeEventListener('start', onControlsStart);
    controls.removeEventListener('end', onControlsEnd);
    controls.dispose();
    disposeObject(scene);
    renderer.dispose();
  }

  return {
    update,
    render,
    resize,
    focusBuilding,
    destroy,
  };
}
