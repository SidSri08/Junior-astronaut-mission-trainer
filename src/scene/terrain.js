// Lunar south-pole terrain, sky, Earth, Sun, and distant horizon ridges (B-S1).
import * as THREE from 'three';
import { mulberry32, fbm, smoothstep, clamp, canvasTexture, makeGlow } from './sceneUtils.js';

const CRATERS = [
  { x: -34, z: -26, r: 11, depth: 2.2, rim: 0.75 },
  { x: 38, z: -22, r: 9, depth: 1.8, rim: 0.6 },
  { x: -28, z: 34, r: 8.5, depth: 1.6, rim: 0.55 },
  { x: 30, z: 32, r: 12, depth: 2.4, rim: 0.8 },
  { x: 4, z: -44, r: 14, depth: 2.8, rim: 0.9 },
  { x: -52, z: 6, r: 15, depth: 2.9, rim: 0.95 },
  { x: 54, z: 4, r: 13, depth: 2.5, rim: 0.85 },
  { x: -12, z: 48, r: 10, depth: 1.9, rim: 0.65 },
  { x: 18, z: 22, r: 3.4, depth: 0.55, rim: 0.22 },
  { x: -19, z: -15, r: 3.0, depth: 0.5, rim: 0.2 },
];

/** Evaluate terrain height at world (x, z) so buildings/rocks/rover sit on the surface. */
export function sampleTerrainHeight(x, z) {
  const dist = Math.hypot(x, z);
  // Keep outpost pad around radius 24 mostly flat for buildings
  const padFlatten = smoothstep(19, 30, dist);

  let h = fbm(x * 0.035, z * 0.035, 4, 101) * 2.4 * padFlatten;
  h += fbm(x * 0.12, z * 0.12, 2, 307) * 0.35 * smoothstep(14, 24, dist);

  // Add craters with raised rims
  for (const c of CRATERS) {
    const d = Math.hypot(x - c.x, z - c.z) / c.r;
    if (d < 1.45) {
      if (d < 1.0) {
        const bowl = 1 - d * d;
        h -= c.depth * bowl * bowl;
      }
      const rimFactor = Math.exp(-Math.pow((d - 1.03) / 0.2, 2));
      h += c.rim * rimFactor;
    }
  }

  // Gentle rise near outer horizon
  const rimRise = smoothstep(55, 98, dist) * (3.5 + 2.2 * fbm(x * 0.025, z * 0.025, 3, 509));
  return h + rimRise;
}

export function createLunarTerrain() {
  const group = new THREE.Group();
  group.name = 'lunarTerrain';

  // Procedural regolith detail texture
  const regolithTex = canvasTexture(
    256,
    256,
    (ctx, w, h) => {
      const rand = mulberry32(4242);
      ctx.fillStyle = '#7b7f86';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 4500; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const v = Math.floor(100 + (rand() - 0.5) * 48);
        ctx.fillStyle = `rgb(${v},${v},${v + 2})`;
        ctx.fillRect(x, y, rand() < 0.8 ? 1.5 : 3, rand() < 0.8 ? 1.5 : 3);
      }
      for (let i = 0; i < 40; i++) {
        const x = rand() * w;
        const y = rand() * h;
        const r = 3 + rand() * 9;
        ctx.strokeStyle = 'rgba(210,214,222,0.22)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    { repeat: [22, 22] }
  );

  const size = 210;
  const segs = 140;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = sampleTerrainHeight(x, z);
    pos.setY(i, y);

    const n = fbm(x * 0.08, z * 0.08, 3, 777);
    const shade = clamp(0.62 + y * 0.025 + n * 0.08, 0.42, 0.82);
    colors[i * 3] = shade;
    colors[i * 3 + 1] = shade * 1.01;
    colors[i * 3 + 2] = shade * 1.04;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: regolithTex,
    vertexColors: true,
    roughness: 0.94,
    metalness: 0.04,
  });

  const ground = new THREE.Mesh(geo, mat);
  ground.receiveShadow = true;
  ground.name = 'groundMesh';
  group.add(ground);

  // Subtle landing/outpost pad rings etched in regolith
  const padRingGeo = new THREE.RingGeometry(18.2, 18.7, 64);
  padRingGeo.rotateX(-Math.PI / 2);
  const padRingMat = new THREE.MeshBasicMaterial({
    color: 0x565b66,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
  });
  const padRing = new THREE.Mesh(padRingGeo, padRingMat);
  padRing.position.y = 0.03;
  group.add(padRing);

  // Distant south-pole horizon mountain ring (Shackleton rim vibe)
  const ridgeGeo = new THREE.CylinderGeometry(118, 128, 22, 96, 6, true);
  const rPos = ridgeGeo.attributes.position;
  for (let i = 0; i < rPos.count; i++) {
    const vx = rPos.getX(i);
    const vy = rPos.getY(i);
    const vz = rPos.getZ(i);
    const angle = Math.atan2(vz, vx);
    const t = clamp((vy + 11) / 22, 0, 1); // 0 at bottom, 1 at crest
    const crest =
      6 +
      5.5 * Math.sin(angle * 5 + 0.7) * Math.cos(angle * 3 - 0.4) +
      4.5 * fbm(Math.cos(angle) * 3.5, Math.sin(angle) * 3.5, 4, 919);
    const newY = -4 + t * Math.max(2.5, crest);
    rPos.setY(i, newY);
  }
  ridgeGeo.computeVertexNormals();

  const ridgeMat = new THREE.MeshStandardMaterial({
    color: 0x4c515c,
    roughness: 0.96,
    metalness: 0.02,
    side: THREE.BackSide,
  });
  const ridges = new THREE.Mesh(ridgeGeo, ridgeMat);
  ridges.name = 'horizonRidges';
  group.add(ridges);

  // Scatter lunar boulders/rocks outside main building footprints
  const rocksGroup = new THREE.Group();
  rocksGroup.name = 'lunarRocks';
  const rand = mulberry32(9001);
  const rockBaseGeo = new THREE.DodecahedronGeometry(1, 1);
  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x6f737c,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });

  for (let i = 0; i < 65; i++) {
    const angle = rand() * Math.PI * 2;
    const radius = i < 18 ? 14 + rand() * 14 : 24 + rand() * 55;
    const rx = Math.cos(angle) * radius;
    const rz = Math.sin(angle) * radius;
    // Keep clear of immediate building spots
    if (Math.hypot(rx, rz) < 12) continue;

    const ry = sampleTerrainHeight(rx, rz);
    const rock = new THREE.Mesh(rockBaseGeo, rockMat);
    const s = 0.25 + Math.pow(rand(), 2) * 1.45;
    rock.scale.set(s * (0.8 + rand() * 0.5), s * (0.55 + rand() * 0.45), s * (0.8 + rand() * 0.5));
    rock.position.set(rx, ry + s * 0.22, rz);
    rock.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
    rock.castShadow = true;
    rock.receiveShadow = true;
    rocksGroup.add(rock);
  }
  group.add(rocksGroup);

  return group;
}

export function createSkyAndCelestials() {
  const skyGroup = new THREE.Group();
  skyGroup.name = 'skyGroup';

  // Starfield points
  const starCount = 1400;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  const rand = mulberry32(1969);

  for (let i = 0; i < starCount; i++) {
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(0.03 + rand() * 0.97); // hemisphere above horizon
    const r = 165 + rand() * 15;
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = r * Math.cos(phi);
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const tint = rand();
    const brightness = 0.65 + rand() * 0.35;
    starColors[i * 3] = brightness * (tint < 0.25 ? 1.0 : tint < 0.6 ? 0.94 : 0.86);
    starColors[i * 3 + 1] = brightness * (tint < 0.25 ? 0.9 : 0.95);
    starColors[i * 3 + 2] = brightness * (tint > 0.6 ? 1.0 : 0.88);
  }

  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 1.15,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    sizeAttenuation: false,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.name = 'starfield';
  skyGroup.add(stars);

  // Small Earth sphere low on the horizon
  const earthTex = canvasTexture(256, 128, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1b4f9c');
    grad.addColorStop(0.5, '#1565c0');
    grad.addColorStop(1, '#0d3c78');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Continents
    ctx.fillStyle = '#3b8c52';
    const blobs = [
      [60, 42, 28, 18],
      [82, 75, 18, 24],
      [135, 38, 34, 16],
      [148, 66, 22, 25],
      [195, 45, 28, 18],
      [212, 84, 16, 12],
    ];
    for (const [bx, by, rx, ry] of blobs) {
      ctx.beginPath();
      ctx.ellipse(bx, by, rx, ry, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ice caps & cloud swirls
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(0, 0, w, 9);
    ctx.fillRect(0, h - 9, w, 9);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 4;
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(25 + i * 24, 24 + (i % 3) * 32, 18, 0.2, 2.2);
      ctx.stroke();
    }
  });

  const earthGroup = new THREE.Group();
  earthGroup.position.set(-88, 22, -112);
  const earthMesh = new THREE.Mesh(
    new THREE.SphereGeometry(5.8, 32, 24),
    new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.55,
      metalness: 0.05,
      emissive: new THREE.Color(0x1b4d89),
      emissiveIntensity: 0.45,
    })
  );
  earthGroup.add(earthMesh);

  const earthAtmo = makeGlow(0x4da6ff, 18, 0.55);
  earthGroup.add(earthAtmo);
  skyGroup.add(earthGroup);

  // Visible Sun sphere + warm glow sprite low on the horizon (~7° elevation)
  const sunVisual = new THREE.Group();
  const sunCore = new THREE.Mesh(
    new THREE.SphereGeometry(4.2, 24, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff7e2 })
  );
  sunVisual.add(sunCore);
  const sunHaloInner = makeGlow(0xffe6a3, 28, 0.95);
  const sunHaloOuter = makeGlow(0xffb85c, 58, 0.48);
  sunVisual.add(sunHaloInner, sunHaloOuter);
  skyGroup.add(sunVisual);

  return {
    skyGroup,
    stars,
    earthMesh,
    sunVisual,
    sunHaloInner,
    sunHaloOuter,
  };
}
