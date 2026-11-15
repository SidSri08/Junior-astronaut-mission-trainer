// Main Three.js Lunar South-Pole Outpost Scene Orchestrator.
// Composes terrain, procedural buildings, and modular Act 1 / interaction controllers
// inside one continuous WebGL scene without reloads or asset duplication.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { clamp, num, disposeObject } from './sceneUtils.js';
import { createLunarTerrain, createSkyAndCelestials, sampleTerrainHeight } from './terrain.js';
import { INTERACTIVE_BUILDING_IDS, BUILDING_LAYOUT, createOutpostBuildings } from './buildings.js';
import { createEnvironmentController } from './cinematics/EnvironmentController.js';
import { createCameraController, OVERVIEW_CAMERA, OVERVIEW_TARGET } from './cinematics/CameraController.js';
import { createCinematicController } from './cinematics/CinematicController.js';

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

export function createOutpostScene({
  canvas,
  onSelectBuilding,
  onContextLost,
  onContextRestored,
  onAudioCue,
  onCinematicProgress,
} = {}) {
  if (!canvas) {
    throw new Error('createOutpostScene requires a canvas element');
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    throw new Error(`WebGL initialization failed: ${err?.message || err}`);
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;

  let contextLost = false;
  const handleContextLost = (e) => {
    e.preventDefault();
    contextLost = true;
    onAudioCue?.('stopAll');
    if (typeof onContextLost === 'function') onContextLost();
  };
  const handleContextRestored = () => {
    contextLost = false;
    if (typeof onContextRestored === 'function') onContextRestored();
  };
  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  const scene = new THREE.Scene();
  const initialWidth = canvas.clientWidth || window.innerWidth || 1024;
  const initialHeight = canvas.clientHeight || window.innerHeight || 768;
  renderer.setSize(initialWidth, initialHeight, false);

  const camera = new THREE.PerspectiveCamera(46, initialWidth / initialHeight, 0.6, 1400);
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
  controls.autoRotateSpeed = 0.14;

  // Lighting: Low-elevation South-Pole directional Sun + Hemisphere + Earthshine fill
  const hemiLight = new THREE.HemisphereLight(0x90b8f8, 0x3b4252, 0.78);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0x556888, 0.52);
  scene.add(ambientLight);

  const earthFillLight = new THREE.DirectionalLight(0x60a5fa, 0.55);
  earthFillLight.position.set(26, 15.5, -104);
  scene.add(earthFillLight);

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.85);
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

  // Terrain, Sky, Buildings & Modular Controllers
  const terrainGroup = createLunarTerrain();
  scene.add(terrainGroup);

  const sky = createSkyAndCelestials();
  scene.add(sky.skyGroup);

  const buildings = createOutpostBuildings();
  scene.add(buildings.group);

  const envController = createEnvironmentController({ scene, sunLight, sky });
  const cameraController = createCameraController({ camera, controls });
  const cinematicController = createCinematicController({ onAudioCue });

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

  let latestSnapshot = null;
  let elapsedClock = 0;
  let hoveredBuildingId = null;
  const seenMeteorInstances = new Set();

  function setLowQuality(enabled) {
    const low = Boolean(enabled);
    renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !low;
    sunLight.castShadow = !low;
    envController.setLowQuality(low);
  }

  function focusBuilding(buildingId = null) {
    const reducedMotion = Boolean(latestSnapshot?.settings?.reducedMotion);
    const validId = cameraController.focusBuilding(buildingId, { reducedMotion });
    if (validId) {
      placeRingUnderBuilding(selectRing, validId, 1.04);
    } else {
      selectRing.mesh.visible = false;
    }
  }

  function startCinematic(mode, opts = {}) {
    hoveredBuildingId = null;
    hoverRing.mesh.visible = false;
    focusBuilding(null);
    controls.enabled = false;
    cinematicController.start(mode, {
      ...opts,
      reducedMotion: Boolean(opts.reducedMotion ?? latestSnapshot?.settings?.reducedMotion),
      onComplete: (doneMode, info) => {
        controls.enabled = true;
        if (info?.skipped) {
          cameraController.snapToOverview();
        } else {
          cameraController.transitionToOverview({
            reducedMotion: Boolean(latestSnapshot?.settings?.reducedMotion),
          });
        }
        onCinematicProgress?.(1);
        opts.onComplete?.(doneMode, info);
      },
    });
  }

  function skipCinematic() {
    if (!cinematicController.isActive()) return;
    cinematicController.skip();
    controls.enabled = true;
    cameraController.snapToOverview();
  }

  // Pointer & Raycasting
  const raycaster = new THREE.Raycaster();
  const pointerNdc = new THREE.Vector2();
  let pointerDownPos = null;

  function getInteractiveBuildingAtPointer(clientX, clientY) {
    if (cinematicController.isActive()) return null;
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
    if (cinematicController.isActive()) {
      if (hoveredBuildingId) {
        hoveredBuildingId = null;
        hoverRing.mesh.visible = false;
      }
      canvas.style.cursor = 'default';
      return;
    }
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

    if (Math.hypot(dx, dy) >= 5 || cinematicController.isActive()) return;

    const hitId = getInteractiveBuildingAtPointer(e.clientX, e.clientY);
    if (hitId && INTERACTIVE_BUILDING_IDS.includes(hitId)) {
      onSelectBuilding?.(hitId);
    } else if (cameraController.getFocusedBuildingId()) {
      // Clicking empty lunar ground outside modules smoothly returns to Overview
      onSelectBuilding?.(null);
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

    const events = Array.isArray(snapshot.activeEvents) ? snapshot.activeEvents : [];
    for (const ev of events) {
      if (ev && ev.eventId === 'micrometeoroid') {
        const key = ev.instanceId || `${ev.eventId}_${ev.startedAt || 0}`;
        if (!seenMeteorInstances.has(key)) {
          seenMeteorInstances.add(key);
          envController.triggerMeteorFlash(1.35);
        }
      }
    }
  }

  function render(deltaSeconds = 1 / 60) {
    const dt = clamp(num(deltaSeconds, 1 / 60), 0.001, 0.1);
    elapsedClock += dt;

    if (hoverRing.mesh.visible) {
      hoverRing.mat.opacity = 0.55 + 0.25 * Math.sin(elapsedClock * 5.0);
    }
    const activeFocusId = cameraController.getFocusedBuildingId();
    if (selectRing.mesh.visible && activeFocusId) {
      const s = BUILDING_LAYOUT[activeFocusId]?.radius || 3.5;
      const breath = 1.02 + 0.04 * Math.sin(elapsedClock * 3.5);
      selectRing.mesh.scale.setScalar(s * breath);
    }

    let sceneFx = {
      focusedId: activeFocusId,
      setupStage: 6,
      landerAltitude: 0,
      thrusterPower: 0,
      dustPlumeIntensity: 0,
      evacuating: false,
      boarded: false,
    };
    let orbitalVisibility = 0;

    if (cinematicController.isActive()) {
      const stepRes = cinematicController.step(dt);
      if (stepRes.active || stepRes.sceneFx) {
        sceneFx = stepRes.sceneFx;
        orbitalVisibility = num(stepRes.orbitalVisibility, 0);
        if (typeof stepRes.progress === 'number') {
          onCinematicProgress?.(stepRes.progress);
        }
        if (stepRes.cameraCue) {
          cameraController.applyCinematicFrame({ ...stepRes.cameraCue, dt });
        }
      }
    }

    const { sunAzimuth } = envController.update({
      snapshot: latestSnapshot,
      dt,
      elapsedClock,
      sceneFx,
      focusedBuildingId: cinematicController.isActive() ? null : activeFocusId,
      orbitalVisibility,
    });

    buildings.updateBuildings(latestSnapshot, dt, elapsedClock, sunAzimuth, sceneFx);
    cameraController.updateInteractive(dt, { cinematicActive: cinematicController.isActive() });

    if (!contextLost) {
      renderer.render(scene, camera);
    }
  }

  function resize(width, height) {
    const w = Math.max(1, Math.floor(num(width, canvas.clientWidth || window.innerWidth || 1024)));
    const h = Math.max(1, Math.floor(num(height, canvas.clientHeight || window.innerHeight || 768)));
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function destroy() {
    onAudioCue?.('stopAll');
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    cameraController.dispose();
    controls.dispose();
    disposeObject(scene);
    renderer.renderLists?.dispose?.();
    renderer.dispose();
  }

  return {
    update,
    render,
    resize,
    focusBuilding,
    getFocusedBuildingId: () => cameraController.getFocusedBuildingId(),
    startCinematic,
    skipCinematic,
    setLowQuality,
    destroy,
  };
}
