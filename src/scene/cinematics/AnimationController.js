// Act 1 & Act 3 Parametric Animation & Choreography Solver:
// Computes per-frame spacecraft kinematics, deployable base rigging states, EVA egress poses,
// vacuum dust/plume levels, and synchronized camera framing without any DOM dependencies.
import { clamp } from '../sceneUtils.js';
import { BUILDING_LAYOUT } from '../buildings.js';
import { sampleTerrainHeight } from '../terrain.js';
import { OVERVIEW_CAMERA, OVERVIEW_TARGET } from './CameraController.js';

function smooth01(a, b, x) {
  const t = clamp((x - a) / Math.max(0.0001, b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t) {
  const c = clamp(t, 0, 1);
  return 1 - Math.pow(1 - c, 3);
}

function easeInOutCubic(t) {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function lerpNum(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function lerpVec3(a, b, t) {
  const c = clamp(t, 0, 1);
  return [a[0] + (b[0] - a[0]) * c, a[1] + (b[1] - a[1]) * c, a[2] + (b[2] - a[2]) * c];
}

export function evaluateAct1Frame({
  sceneKey,
  sceneProgress,
  elapsedClock,
  reducedMotion = false,
  previousShotKey = '',
}) {
  const p = clamp(sceneProgress, 0, 1);
  const lPos = BUILDING_LAYOUT.lander;
  const lGroundY = sampleTerrainHeight(lPos.x, lPos.z);

  const deployProgress = {
    habitat: 0,
    solar: 0,
    lifeSupport: 0,
    greenhouse: 0,
    comms: 0,
    lab: 0,
    flag: 0,
  };

  const sceneFx = {
    focusedId: null,
    setupStage: 0,
    deployProgress,
    landerAltitude: 0,
    landerOffsetX: 0,
    landerOffsetZ: 0,
    landerPitch: 0,
    landerYaw: 0,
    landerRoll: 0,
    gearDeploy: 1,
    suspensionCompress: 0,
    hatchOpen: 0,
    ladderDeploy: 0,
    thrusterPower: 0,
    nozzleHeat: 0,
    dustPlumeIntensity: 0,
    astro1EgressProgress: null,
    astroWalkTarget: null,
    astroFacingAngle: null,
    scannerActive: false,
    hideAstronauts: true,
    astro2Visible: false,
    roverActive: false,
    evacuating: false,
    boarded: false,
  };

  let shotKey = sceneKey;
  let cameraCue = {
    pos: [OVERVIEW_CAMERA.x, OVERVIEW_CAMERA.y, OVERVIEW_CAMERA.z],
    target: [OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z],
    cut: false,
    dampSpeed: 4.5,
    impulseY: 0,
  };
  let orbitalVisibility = 0;

  // SCENE 1 — THE MOON APPROACH (Orbital sweep above curved lunar horizon & Earth)
  if (sceneKey === 'scene1_approach') {
    const k = easeInOutCubic(p);
    sceneFx.landerOffsetX = 18 * (1 - k);
    sceneFx.landerOffsetZ = 28 * (1 - k);
    sceneFx.landerAltitude = lerpNum(38, 24, k);
    sceneFx.landerPitch = lerpNum(-0.22, -0.14, k);
    sceneFx.landerYaw = lerpNum(0.32, 0.08, k);
    sceneFx.gearDeploy = 0.2;
    sceneFx.thrusterPower = 0.22 + 0.14 * Math.sin(p * Math.PI);
    sceneFx.nozzleHeat = 0.38;
    orbitalVisibility = 1.0;

    const lx = lPos.x + sceneFx.landerOffsetX;
    const ly = lGroundY + sceneFx.landerAltitude;
    const lz = lPos.z + sceneFx.landerOffsetZ;

    cameraCue = {
      pos: [lx + lerpNum(6.8, 12.0, k), ly + lerpNum(5.5, 3.2, k), lz + lerpNum(12.8, 10.5, k)],
      target: lerpVec3([lx - 4, ly - 5, lz - 36], [lx, ly + 0.6, lz - 10], k),
      cut: previousShotKey !== shotKey,
      dampSpeed: 3.5,
      impulseY: 0,
    };
  }
  // SCENE 2 — DESCENT AND LANDING (Shots A, B, C: gear deploy, thruster ground light, dust spray, touchdown)
  else if (sceneKey === 'scene2_descent') {
    if (p < 0.38) {
      shotKey = 'scene2_shotA';
      const sA = p / 0.38;
      const k = easeInOutCubic(sA);
      sceneFx.landerAltitude = lerpNum(24, 10.5, k);
      sceneFx.landerPitch = lerpNum(-0.14, 0, k);
      sceneFx.landerYaw = lerpNum(0.08, 0, k);
      sceneFx.gearDeploy = lerpNum(0.2, 0.68, smooth01(0.15, 1, sA));
      sceneFx.thrusterPower = lerpNum(0.45, 0.94, smooth01(0, 0.4, sA));
      sceneFx.nozzleHeat = lerpNum(0.45, 0.95, sA);
      orbitalVisibility = 1.0;

      const ly = lGroundY + sceneFx.landerAltitude;
      cameraCue = {
        pos: [lPos.x + 12.2, lGroundY + lerpNum(19.5, 11.2, k), lPos.z + 10.2],
        target: [lPos.x, ly + 1.3, lPos.z],
        cut: previousShotKey !== shotKey && !previousShotKey.startsWith('scene1'),
        dampSpeed: 4.5,
        impulseY: 0,
      };
    } else if (p < 0.74) {
      shotKey = 'scene2_shotB';
      const sB = (p - 0.38) / 0.36;
      const k = easeInOutCubic(sB);
      sceneFx.landerAltitude = lerpNum(10.5, 2.5, k);
      sceneFx.gearDeploy = lerpNum(0.68, 1.0, smooth01(0, 0.45, sB));
      sceneFx.thrusterPower = 0.92;
      sceneFx.nozzleHeat = 1.0;
      sceneFx.dustPlumeIntensity = smooth01(0.08, 0.75, sB);
      orbitalVisibility = lerpNum(1.0, 0.45, sB);

      const ly = lGroundY + sceneFx.landerAltitude;
      cameraCue = {
        pos: [lPos.x + lerpNum(6.8, 7.6, sB), lGroundY + 1.15, lPos.z + 8.8],
        target: [lPos.x, ly + 0.85, lPos.z],
        cut: !reducedMotion && previousShotKey !== shotKey,
        dampSpeed: 5.0,
        impulseY: 0,
      };
    } else {
      shotKey = 'scene2_shotC';
      const sC = (p - 0.74) / 0.26;
      const contactT = smooth01(0, 0.62, sC);
      const postTouchT = smooth01(0.62, 1.0, sC);

      sceneFx.landerAltitude = lerpNum(2.5, 0, easeOutCubic(contactT));
      sceneFx.gearDeploy = 1.0;
      sceneFx.thrusterPower = contactT < 1 ? lerpNum(0.85, 0.4, contactT) : lerpNum(0.4, 0, postTouchT * 1.8);
      sceneFx.nozzleHeat = lerpNum(1.0, 0.45, postTouchT);
      sceneFx.dustPlumeIntensity = contactT < 1 ? 0.95 : clamp(1 - postTouchT * 1.45, 0, 0.95);
      orbitalVisibility = lerpNum(0.45, 0, sC);

      // Physical suspension cushion right at footpad contact (0.62 .. 0.94 of Shot C)
      if (sC >= 0.58 && sC < 0.94) {
        const compU = (sC - 0.58) / 0.36;
        sceneFx.suspensionCompress = Math.sin(compU * Math.PI) * (1 - compU * 0.45);
      }

      const impulseY =
        !reducedMotion && sC >= 0.58 && sC < 0.88
          ? Math.exp(-9 * (sC - 0.58)) * Math.sin((sC - 0.58) * 95) * 0.14
          : 0;

      cameraCue = {
        pos: [lPos.x + 11.4, lGroundY + 3.4, lPos.z + 13.4],
        target: [lPos.x + 0.5, lGroundY + lerpNum(2.2, 1.65, contactT), lPos.z],
        cut: !reducedMotion && previousShotKey !== shotKey,
        dampSpeed: 5.2,
        impulseY,
      };
    }
  }
  // SCENE 3 — TOUCHDOWN CONFIRMATION (Slow contemplative push on gold lander in crisp sunlight)
  else if (sceneKey === 'scene3_touchdown') {
    const k = easeInOutCubic(p);
    sceneFx.landerAltitude = 0;
    sceneFx.gearDeploy = 1;
    sceneFx.nozzleHeat = lerpNum(0.45, 0.04, k);

    cameraCue = {
      pos: lerpVec3([lPos.x + 9.4, lGroundY + 3.2, lPos.z + 9.6], [lPos.x + 6.4, lGroundY + 2.55, lPos.z + 5.8], k),
      target: [lPos.x + 0.4, lGroundY + 2.05, lPos.z],
      cut: false,
      dampSpeed: 3.4,
      impulseY: 0,
    };
  }
  // SCENE 4 — ASTRONAUT EXITS THE SPACECRAFT (Hatch opening, warm light, ladder climb-down, site scanner)
  else if (sceneKey === 'scene4_egress') {
    const k = clamp(p, 0, 1);
    sceneFx.hatchOpen = smooth01(0.02, 0.2, k);
    sceneFx.ladderDeploy = smooth01(0.08, 0.25, k);

    if (k >= 0.24 && k < 0.72) {
      sceneFx.hideAstronauts = false;
      sceneFx.astro1EgressProgress = smooth01(0.24, 0.72, k);
    } else if (k >= 0.72) {
      sceneFx.hideAstronauts = false;
      sceneFx.astro1EgressProgress = null;
      sceneFx.astroWalkTarget = { x: -1.8, z: 6.2 };
      sceneFx.astroFacingAngle = 0.65;
      sceneFx.scannerActive = k > 0.78;
    }

    cameraCue = {
      pos: lerpVec3(
        [lPos.x + 7.2, lGroundY + 2.45, lPos.z + 4.4],
        [lPos.x + 7.8, lGroundY + 2.05, lPos.z + 6.2],
        k
      ),
      target: lerpVec3([lPos.x + 1.5, lGroundY + 2.15, lPos.z], [lPos.x + 3.4, lGroundY + 1.1, lPos.z - 0.6], smooth01(0.24, 0.9, k)),
      cut: !reducedMotion && previousShotKey !== shotKey && previousShotKey !== 'scene3_touchdown',
      dampSpeed: 4.0,
      impulseY: 0,
    };
  }
  // SCENE 5 — ESTABLISHING THE LUNAR BASE (Scan -> Habitat -> Solar -> LifeSupport/Greenhouse -> Comms/Lab -> Inspection)
  else if (sceneKey === 'scene5_establishment') {
    sceneFx.hideAstronauts = false;
    sceneFx.hatchOpen = 1 - smooth01(0.75, 0.95, p);
    sceneFx.ladderDeploy = 1;
    sceneFx.setupStage = 6;

    // Staggered believable automated mechanical deployment curves
    deployProgress.habitat = smooth01(0.11, 0.31, p);
    deployProgress.solar = smooth01(0.29, 0.49, p);
    deployProgress.lifeSupport = smooth01(0.46, 0.62, p);
    deployProgress.greenhouse = smooth01(0.53, 0.69, p);
    deployProgress.comms = smooth01(0.66, 0.80, p);
    deployProgress.lab = smooth01(0.72, 0.86, p);
    deployProgress.flag = smooth01(0.84, 0.96, p);

    sceneFx.roverActive = p >= 0.8;
    sceneFx.astro2Visible = p >= 0.84;

    if (p < 0.13) {
      shotKey = 'scene5_scan';
      sceneFx.scannerActive = true;
      sceneFx.astroWalkTarget = { x: -1.4, z: 4.8 };
      sceneFx.astroFacingAngle = 0.45;
      cameraCue = {
        pos: [1.5, 3.6, 12.2],
        target: [-0.8, 1.2, 2.2],
        cut: false,
        dampSpeed: 3.6,
        impulseY: 0,
      };
    } else if (p < 0.32) {
      shotKey = 'scene5_habitat';
      const u = (p - 0.13) / 0.19;
      sceneFx.astroWalkTarget = { x: -3.2, z: 3.4 };
      sceneFx.astroFacingAngle = Math.atan2(3.2, -3.4);
      cameraCue = {
        pos: lerpVec3([2.2, 4.2, 12.0], [5.2, 4.9, 11.2], u),
        target: [0, 2.2, 0],
        cut: false,
        dampSpeed: 3.8,
        impulseY: 0,
      };
    } else if (p < 0.50) {
      shotKey = 'scene5_solar';
      const u = (p - 0.32) / 0.18;
      sceneFx.astroWalkTarget = { x: -2.2, z: -2.2 };
      sceneFx.astroFacingAngle = Math.atan2(-3.6, -5.6);
      cameraCue = {
        pos: lerpVec3([3.4, 5.4, 7.6], [-0.4, 5.2, 4.4], u),
        target: [-5.8, 2.6, -7.8],
        cut: false,
        dampSpeed: 3.6,
        impulseY: 0,
      };
    } else if (p < 0.69) {
      shotKey = 'scene5_lifesupport_greenhouse';
      const u = (p - 0.50) / 0.19;
      sceneFx.astroWalkTarget = { x: -2.8, z: 2.2 };
      sceneFx.astroFacingAngle = Math.atan2(-4.5, -1.8);
      cameraCue = {
        pos: lerpVec3([-1.5, 4.8, 10.6], [6.4, 4.8, 7.8], u),
        target: lerpVec3([-5.0, 1.8, -0.4], [3.4, 1.7, -3.2], u),
        cut: false,
        dampSpeed: 3.4,
        impulseY: 0,
      };
    } else if (p < 0.86) {
      shotKey = 'scene5_comms_lab';
      const u = (p - 0.69) / 0.17;
      sceneFx.astroWalkTarget = { x: 2.8, z: 2.4 };
      sceneFx.astroFacingAngle = Math.atan2(-1.6, -12.0);
      cameraCue = {
        pos: lerpVec3([6.4, 4.8, 7.8], [5.8, 5.4, 11.8], u),
        target: lerpVec3([2.2, 2.6, -7.6], [3.6, 2.1, -3.8], u),
        cut: false,
        dampSpeed: 3.4,
        impulseY: 0,
      };
    } else {
      shotKey = 'scene5_inspection';
      const u = (p - 0.86) / 0.14;
      sceneFx.astroWalkTarget = { x: 3.6, z: 4.2 };
      sceneFx.astroFacingAngle = -0.35;
      cameraCue = {
        pos: lerpVec3([5.8, 5.4, 11.8], [3.6, 5.6, 16.5], u),
        target: [0.4, 2.3, -0.6],
        cut: false,
        dampSpeed: 3.4,
        impulseY: 0,
      };
    }
  }
  // SCENE 6 — COMPLETED OUTPOST REVEAL (Sweeping crane pullback directly into default OVERVIEW_CAMERA)
  else if (sceneKey === 'scene6_reveal') {
    const k = easeInOutCubic(p);
    deployProgress.habitat = 1;
    deployProgress.solar = 1;
    deployProgress.lifeSupport = 1;
    deployProgress.greenhouse = 1;
    deployProgress.comms = 1;
    deployProgress.lab = 1;
    deployProgress.flag = 1;

    sceneFx.setupStage = 6;
    sceneFx.hatchOpen = 0;
    sceneFx.ladderDeploy = 1;
    sceneFx.hideAstronauts = false;
    sceneFx.astro2Visible = true;
    sceneFx.roverActive = true;

    cameraCue = {
      pos: lerpVec3(
        [3.6, 5.6, 16.5],
        [OVERVIEW_CAMERA.x, OVERVIEW_CAMERA.y, OVERVIEW_CAMERA.z],
        k
      ),
      target: lerpVec3(
        [0.4, 2.3, -0.6],
        [OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z],
        k
      ),
      cut: false,
      dampSpeed: 6.5,
      impulseY: 0,
    };
  }

  // Soft breathing micro-hover idle on orbital thruster only when needed
  if (sceneFx.thrusterPower > 0 && !reducedMotion) {
    sceneFx.thrusterPower = clamp(sceneFx.thrusterPower + Math.sin(elapsedClock * 24) * 0.03, 0, 1);
  }

  return {
    sceneFx,
    cameraCue,
    shotKey,
    orbitalVisibility,
  };
}

export function evaluateEvacuationFrame({ progress, reducedMotion = false }) {
  const tNorm = clamp(progress, 0, 1);
  const lPos = BUILDING_LAYOUT.lander;

  const sceneFx = {
    focusedId: null,
    setupStage: 6,
    landerAltitude: 0,
    thrusterPower: 0,
    dustPlumeIntensity: 0,
    evacuating: false,
    boarded: false,
    hatchOpen: tNorm < 0.5 ? 1 : clamp(1 - (tNorm - 0.5) * 4, 0, 1),
    ladderDeploy: 1,
  };

  let stage = 'wrapUp';
  let caption = 'Crew securing core samples & placing outpost into standby...';
  let cameraCue = null;

  if (tNorm < 0.34) {
    stage = 'wrapUp';
    sceneFx.evacuating = true;
    caption = 'Crew securing core samples & placing base into standby...';
  } else if (tNorm < 0.5) {
    stage = 'boarding';
    sceneFx.boarded = true;
    sceneFx.thrusterPower = 0.55;
    caption = 'All 4 astronauts aboard ascent stage — ignition sequence ready.';
  } else {
    stage = 'liftoff';
    const climbT = (tNorm - 0.5) / 0.5;
    sceneFx.boarded = true;
    sceneFx.thrusterPower = 1;
    sceneFx.landerAltitude = Math.pow(climbT, 1.8) * 30;
    sceneFx.dustPlumeIntensity = clamp(1 - climbT * 2.5, 0, 1);
    caption = 'Liftoff! Ascending toward lunar orbit & Earth homeward trajectory.';
    cameraCue = {
      pos: [0, 7.2, 27],
      target: [lPos.x * (1 - climbT), 2.5 + sceneFx.landerAltitude * 0.65, -climbT * 18],
      cut: false,
      dampSpeed: reducedMotion ? 10 : 4.5,
      impulseY: 0,
    };
  }

  return { stage, caption, sceneFx, cameraCue };
}

