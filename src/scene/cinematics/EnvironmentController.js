// Act 1 & Outpost Environment Controller:
// Manages orbital curved lunar approach dome, vacuum regolith thruster dust spray,
// engine ground point-light, focus spotlight, and environmental storm/leak/ambient particles.
import * as THREE from 'three';
import { clamp, damp, canvasTexture, getGlowTexture, makeGlow } from '../sceneUtils.js';
import { BUILDING_LAYOUT } from '../buildings.js';
import { sampleTerrainHeight } from '../terrain.js';

function createOrbitalMoonDome() {
  const radius = 280;
  const moonTex = canvasTexture(1024, 512, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#5a6370');
    grad.addColorStop(0.5, '#687280');
    grad.addColorStop(1, '#4b5360');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Deterministic highland maria blotches
    for (let i = 0; i < 48; i++) {
      const x = ((i * 193) % 997) / 997 * w;
      const y = ((i * 317) % 991) / 991 * h;
      const r = 36 + (i % 5) * 26;
      const mGrad = ctx.createRadialGradient(x, y, 2, x, y, r);
      mGrad.addColorStop(0, i % 2 === 0 ? 'rgba(42, 48, 58, 0.34)' : 'rgba(130, 140, 154, 0.22)');
      mGrad.addColorStop(1, 'rgba(70, 78, 90, 0)');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Crisp orbital craters + ejecta rims visible from approach altitude
    for (let i = 0; i < 160; i++) {
      const cx = ((i * 271 + 41) % 1009) / 1009 * w;
      const cy = ((i * 409 + 19) % 1013) / 1013 * h;
      const cr = 5 + (i % 9) * 3.4;
      ctx.fillStyle = 'rgba(34, 40, 48, 0.42)';
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(182, 192, 206, 0.36)';
      ctx.lineWidth = Math.max(1, cr * 0.14);
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 1.04, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  moonTex.wrapS = THREE.RepeatWrapping;
  moonTex.wrapT = THREE.ClampToEdgeWrapping;
  moonTex.repeat.set(3, 2);

  const geo = new THREE.SphereGeometry(radius, 64, 40);
  const mat = new THREE.MeshStandardMaterial({
    map: moonTex,
    roughness: 0.94,
    metalness: 0.02,
    transparent: true,
    opacity: 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  // Placed tangent directly beneath outpost origin so terrain transitions without square clipping
  mesh.position.set(0, -radius - 0.35, 0);
  mesh.receiveShadow = false;
  mesh.castShadow = false;
  return { mesh, mat };
}

function createLanderDustSpray(count = 160) {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const ages = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    ages[i] = Math.random();
    positions[i * 3 + 1] = -999;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    map: getGlowTexture(),
    color: 0xd9e1eb,
    size: 1.55,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  points.visible = false;

  const landerBase = BUILDING_LAYOUT.lander;

  function update(dt, active, intensity, offsetX = 0, offsetZ = 0) {
    const targetOpacity = active ? clamp(intensity * 0.72, 0, 0.78) : 0;
    mat.opacity = damp(mat.opacity, targetOpacity, active ? 7 : 4.5, dt);
    points.visible = mat.opacity > 0.015;
    if (!points.visible) return;

    const originX = landerBase.x + offsetX;
    const originZ = landerBase.z + offsetZ;
    const groundY = sampleTerrainHeight(originX, originZ) + 0.16;
    const posAttr = geo.attributes.position;

    for (let i = 0; i < count; i++) {
      ages[i] += dt * (1.25 + (i % 7) * 0.12);
      if (ages[i] >= 1) {
        ages[i] -= 1;
        const angle = (i * 2.39996 + Math.random() * 0.35) % (Math.PI * 2);
        const speed = (6.5 + Math.random() * 8.5) * (0.45 + intensity * 0.65);
        velocities[i * 3] = Math.cos(angle) * speed;
        velocities[i * 3 + 1] = (0.4 + Math.random() * 1.1) * intensity;
        velocities[i * 3 + 2] = Math.sin(angle) * speed;
        posAttr.setXYZ(i, originX + Math.cos(angle) * 0.4, groundY, originZ + Math.sin(angle) * 0.4);
      } else {
        // Pure vacuum ballistic outward spray: high horizontal radial sweep, lunar gravity pulls down cleanly
        let x = posAttr.getX(i) + velocities[i * 3] * dt;
        let y = posAttr.getY(i) + velocities[i * 3 + 1] * dt;
        let z = posAttr.getZ(i) + velocities[i * 3 + 2] * dt;
        velocities[i * 3 + 1] -= 2.4 * dt; // 1/6g lunar gravity pull-down
        const floorY = sampleTerrainHeight(x, z) + 0.08;
        if (y < floorY) {
          y = floorY;
          velocities[i * 3 + 1] = 0;
        }
        posAttr.setXYZ(i, x, y, z);
      }
    }
    posAttr.needsUpdate = true;
  }

  return { points, update };
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
      posAttr.setXYZ(i, Math.cos(angle) * spread * 0.45 + t * 0.9, t * 2.6, Math.sin(angle) * spread * 0.45 + t * 1.3);
    }
    posAttr.needsUpdate = true;
  }

  return { points, update };
}

function createAmbientLunarDust() {
  const count = 85;
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 42;
    positions[i * 3 + 1] = 0.35 + Math.random() * 5.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 42;
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    map: getGlowTexture(),
    color: 0xcbd5e1,
    size: 0.42,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);

  function update(dt, elapsed) {
    const posAttr = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      const p = phases[i];
      let x = posAttr.getX(i) + Math.sin(elapsed * 0.4 + p) * 0.22 * dt;
      let y = posAttr.getY(i) + (0.04 + Math.cos(elapsed * 0.55 + p) * 0.14) * dt;
      let z = posAttr.getZ(i) + Math.cos(elapsed * 0.35 + p) * 0.22 * dt;
      if (x < -21) x = 21;
      if (x > 21) x = -21;
      if (y < 0.25) y = 5.6;
      if (y > 5.8) y = 0.35;
      if (z < -21) z = 21;
      if (z > 21) z = -21;
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  }

  return { points, update };
}

export function createEnvironmentController({ scene, sunLight, sky }) {
  const baseSkyColor = new THREE.Color(0x040914);
  const warningSkyColor = new THREE.Color(0x281706);
  const stormSkyColor = new THREE.Color(0x361108);
  const currentSkyColor = baseSkyColor.clone();
  const scratchSkyColor = baseSkyColor.clone();

  scene.background = currentSkyColor;
  scene.fog = new THREE.FogExp2(0x070a12, 0.0045);

  const sunElevationRad = THREE.MathUtils.degToRad(9.0);
  const orbitalDome = createOrbitalMoonDome();
  scene.add(orbitalDome.mesh);

  const landerDustSpray = createLanderDustSpray(160);
  scene.add(landerDustSpray.points);

  const stormParticles = createSolarStormParticles();
  scene.add(stormParticles.points);

  const leakParticles = createOxygenLeakParticles();
  scene.add(leakParticles.points);

  const ambientDust = createAmbientLunarDust();
  scene.add(ambientDust.points);

  // Downward engine nozzle illumination light during braking & touchdown
  const thrusterLight = new THREE.PointLight(0xffb84d, 0, 26, 1.5);
  scene.add(thrusterLight);

  // Subtle focus spotlight illuminating inspected module while surrounding modules dim softly
  const focusSpot = new THREE.SpotLight(0xe0f2fe, 0, 36, Math.PI * 0.24, 0.55, 1.1);
  focusSpot.position.set(4, 15, 12);
  scene.add(focusSpot);
  scene.add(focusSpot.target);

  // Micrometeoroid flash
  const meteorFlashSprite = makeGlow(0xfff2cc, 16, 0);
  meteorFlashSprite.position.set(1.5, 4.5, -1.5);
  scene.add(meteorFlashSprite);
  const meteorPointLight = new THREE.PointLight(0xffd27d, 0, 32);
  meteorPointLight.position.copy(meteorFlashSprite.position);
  scene.add(meteorPointLight);

  let lowQualityMode = false;
  let meteorFlashTimer = 0;

  function triggerMeteorFlash(duration = 1.35) {
    meteorFlashTimer = Math.max(meteorFlashTimer, duration);
  }

  function setLowQuality(enabled) {
    lowQualityMode = Boolean(enabled);
    ambientDust.points.visible = !lowQualityMode;
  }

  function update({ snapshot, dt, elapsedClock, sceneFx, focusedBuildingId, orbitalVisibility = 0 }) {
    const timeOfDay = Number(snapshot?.mission?.timeOfDay ?? 0.22);
    const isDaylight = snapshot?.mission?.isDaylight !== false;
    const events = Array.isArray(snapshot?.activeEvents) ? snapshot.activeEvents : [];
    const stormEvent = events.find((e) => e?.eventId === 'solarStorm');
    const hasLongShadow = events.some((e) => e?.eventId === 'longShadow');
    const hasOxygenLeak = events.some((e) => e?.eventId === 'oxygenLeak');
    const hasActiveMeteor = events.some((e) => e?.eventId === 'micrometeoroid' && e.phase === 'active');

    // 1. Solar elevation & crisp South-Pole shadows
    const sunAzimuth = -0.55 + Math.sin(timeOfDay * Math.PI * 2) * 0.65;
    const sunDist = 135;
    const cosEl = Math.cos(sunElevationRad);
    const sinEl = Math.sin(sunElevationRad);
    const sunX = Math.sin(sunAzimuth) * cosEl * sunDist;
    const sunY = sinEl * sunDist;
    const sunZ = -Math.cos(sunAzimuth) * cosEl * sunDist;

    sunLight.position.set(sunX, sunY, sunZ);
    sky.sunVisual.position.set(sunX * 1.15, sunY * 1.15, sunZ * 1.15);

    let targetSunIntensity = 2.9;
    if (!isDaylight || hasLongShadow) {
      targetSunIntensity = 0.32;
    } else if (stormEvent?.phase === 'active') {
      targetSunIntensity = 3.2;
    }
    sunLight.intensity = damp(sunLight.intensity, targetSunIntensity, 4, dt);

    const haloScale = !isDaylight || hasLongShadow ? 0.45 : 1.0;
    sky.sunHaloInner.scale.setScalar(28 * haloScale);
    sky.sunHaloOuter.scale.setScalar(58 * haloScale);

    // 2. Curved Orbital Moon Approach dome visibility + vacuum fog attenuation in orbit
    const orbVis = clamp(orbitalVisibility, 0, 1);
    orbitalDome.mat.opacity = orbVis > 0.01 ? orbVis : 0;
    orbitalDome.mesh.visible = orbitalDome.mat.opacity > 0.01;
    scene.fog.density = clamp(0.0045 * (1 - orbVis * 0.72), 0.001, 0.0045);

    // 3. Space Sky / Solar Storm warning tint
    const stormPulse = 0.5 + 0.5 * Math.sin(elapsedClock * 4.5);
    let targetSky = baseSkyColor;
    if (stormEvent?.phase === 'warning') {
      targetSky = scratchSkyColor.copy(baseSkyColor).lerp(warningSkyColor, 0.45 + 0.35 * stormPulse);
    } else if (stormEvent?.phase === 'active') {
      targetSky = scratchSkyColor.copy(baseSkyColor).lerp(stormSkyColor, 0.72 + 0.25 * stormPulse);
    }
    currentSkyColor.lerp(targetSky, 1 - Math.exp(-4 * dt));
    scene.fog.color.copy(currentSkyColor);

    stormParticles.update(dt, Boolean(stormEvent), stormEvent?.phase === 'active' ? 1.0 : 0.35);
    leakParticles.update(dt, hasOxygenLeak);

    // 4. Thruster ground spotlight + ballistic regolith dust spray
    const lPos = BUILDING_LAYOUT.lander;
    const lx = lPos.x + (sceneFx.landerOffsetX || 0);
    const lz = lPos.z + (sceneFx.landerOffsetZ || 0);
    const lGround = sampleTerrainHeight(lx, lz);
    const lAlt = Math.max(0, sceneFx.landerAltitude || 0);
    const tPower = clamp(sceneFx.thrusterPower || 0, 0, 1);
    const dustPower = clamp(sceneFx.dustPlumeIntensity || 0, 0, 1);

    thrusterLight.position.set(lx, lGround + Math.max(0.45, lAlt * 0.75), lz);
    const proxBoost = clamp(1 - lAlt / 14, 0.15, 1);
    thrusterLight.intensity = tPower > 0.02 ? tPower * proxBoost * 16 : 0;

    landerDustSpray.update(dt, !lowQualityMode && dustPower > 0.04, dustPower, sceneFx.landerOffsetX || 0, sceneFx.landerOffsetZ || 0);

    // 5. Focused module key spotlight
    if (focusedBuildingId && BUILDING_LAYOUT[focusedBuildingId]) {
      const fSpec = BUILDING_LAYOUT[focusedBuildingId];
      const fGround = sampleTerrainHeight(fSpec.x, fSpec.z);
      focusSpot.target.position.set(fSpec.x, fGround + fSpec.focusHeight * 0.65, fSpec.z);
      focusSpot.position.set(fSpec.x + 5.5, fGround + 12.5, fSpec.z + 8.5);
      focusSpot.intensity = damp(focusSpot.intensity, 18, 7, dt);
    } else {
      focusSpot.intensity = damp(focusSpot.intensity, 0, 8, dt);
    }

    // 6. Micrometeoroid impact flash
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

    // 7. Earth rotation, star twinkle, ambient dust drift
    sky.earthMesh.rotation.y += dt * 0.06;
    if (Array.isArray(sky.twinkleLayers)) {
      sky.twinkleLayers.forEach((tMat, idx) => {
        tMat.opacity = 0.42 + 0.48 * Math.sin(elapsedClock * (2.2 + idx * 1.1) + idx * 2.1);
      });
    }
    if (!lowQualityMode) {
      ambientDust.update(dt, elapsedClock);
    }
    ambientDust.points.visible = !lowQualityMode;

    return { sunAzimuth };
  }

  return {
    update,
    setLowQuality,
    triggerMeteorFlash,
  };
}

