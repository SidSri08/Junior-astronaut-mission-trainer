import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import {
  ACT1_SCENES,
  createCinematicController,
} from '../src/scene/cinematics/CinematicController.js';
import {
  evaluateAct1Frame,
  evaluateEvacuationFrame,
} from '../src/scene/cinematics/AnimationController.js';
import {
  OVERVIEW_CAMERA,
  OVERVIEW_TARGET,
  createCameraController,
} from '../src/scene/cinematics/CameraController.js';
import {
  BUILDING_LAYOUT,
  INTERACTIVE_BUILDING_IDS,
} from '../src/scene/buildings.js';

function createMockControls() {
  const listeners = new Map();
  return {
    target: new THREE.Vector3(),
    autoRotate: false,
    addEventListener(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
    },
    removeEventListener(type, fn) {
      listeners.get(type)?.delete(fn);
    },
    update() {},
    listenerCount(type) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

test('ACT1_SCENES defines 6 chronological scenes totaling 73s normal / 7.3s reduced motion', () => {
  assert.equal(ACT1_SCENES.length, 6);
  assert.deepEqual(
    ACT1_SCENES.map((s) => s.key),
    [
      'scene1_approach',
      'scene2_descent',
      'scene3_touchdown',
      'scene4_egress',
      'scene5_establishment',
      'scene6_reveal',
    ],
  );

  const totalNormal = ACT1_SCENES.reduce((sum, s) => sum + s.duration, 0);
  const totalReduced = ACT1_SCENES.reduce((sum, s) => sum + s.reducedDuration, 0);
  assert.ok(Math.abs(totalNormal - 73.0) < 1e-6);
  assert.ok(Math.abs(totalReduced - 7.3) < 1e-6);

  const touchdownScene = ACT1_SCENES.find((s) => s.key === 'scene3_touchdown');
  const revealScene = ACT1_SCENES.find((s) => s.key === 'scene6_reveal');
  assert.equal(touchdownScene?.title, 'LUNAR TOUCHDOWN');
  assert.equal(revealScene?.title, 'OUTPOST ESTABLISHED');
});

test('createCinematicController progresses through Act 1 scenes 1-6, fires Scene 5 sub-beats, and resets cleanly on skip()', () => {
  const cues = [];
  const stageEvents = [];
  const ctrl = createCinematicController({
    onAudioCue: (cue) => cues.push(cue),
  });

  assert.equal(ctrl.isActive(), false);
  assert.equal(ctrl.getMode(), 'none');

  ctrl.start('arrival', {
    reducedMotion: false,
    onStageChange: (ev) => stageEvents.push(ev),
  });
  assert.equal(ctrl.isActive(), true);
  assert.equal(ctrl.getMode(), 'arrival');

  // Step halfway through scene 1 (5s into 10s scene1_approach)
  const midScene1 = ctrl.step(5.0);
  assert.equal(midScene1.active, true);
  assert.equal(midScene1.shotKey, 'scene1_approach');

  // Step into scene 3 touchdown (total 27s > 10 + 16 = 26s)
  const intoTouchdown = ctrl.step(22.0);
  assert.equal(intoTouchdown.shotKey, 'scene3_touchdown');
  assert.ok(stageEvents.some((e) => e.stage === 'scene3_touchdown' && e.title === 'LUNAR TOUCHDOWN'));

  // Step into scene 5 establishment across sub-beats (43s .. 65s)
  ctrl.step(17.0); // 44s -> scan
  ctrl.step(4.0);  // 48s -> habitat
  ctrl.step(3.0);  // 51s -> solar
  ctrl.step(4.0);  // 55s -> lifesupport
  ctrl.step(4.0);  // 59s -> comms
  ctrl.step(3.5);  // 62.5s -> inspection

  const s5Captions = stageEvents
    .filter((e) => e.stage === 'scene5_establishment')
    .map((e) => e.caption);
  for (const snippet of [
    'Landing zone assessed.',
    'Deploying Habitat',
    'Unfolding Solar Array',
    'Life Support & Food Greenhouse',
    'Communications Relay',
    'Final outpost inspection',
  ]) {
    assert.ok(
      s5Captions.some((c) => c.includes(snippet)),
      `Expected Scene 5 caption matching "${snippet}"`,
    );
  }

  // Calling skip() mid-sequence resets state and emits stopAll cue
  ctrl.skip();
  assert.equal(ctrl.isActive(), false);
  assert.equal(ctrl.getMode(), 'none');
  assert.ok(cues.includes('stopAll'));
});

test('createCinematicController completes arrival under reduced motion and supports evacuation mode', () => {
  let completedInfo = null;
  const ctrl = createCinematicController();
  ctrl.start('arrival', {
    reducedMotion: true,
    onComplete: (mode, meta) => {
      completedInfo = { mode, meta };
    },
  });

  // Total reduced duration is 7.3s
  const finished = ctrl.step(8.0);
  assert.equal(finished.completed, true);
  assert.equal(finished.active, false);
  assert.equal(ctrl.isActive(), false);
  assert.equal(ctrl.getMode(), 'none');
  assert.deepEqual(completedInfo, { mode: 'arrival', meta: { skipped: false } });

  ctrl.start('evacuation', { reducedMotion: false });
  assert.equal(ctrl.isActive(), true);
  assert.equal(ctrl.getMode(), 'evacuation');
  const evacMid = ctrl.step(1.0);
  assert.equal(evacMid.active, true);
});

test('evaluateAct1Frame handles orbital approach, descent shots, gear deploy, strut compression, and reduced-motion micro-impulse', () => {
  // Scene 1: orbital descent 38 -> 24 and full orbital visibility
  const s1Start = evaluateAct1Frame({
    sceneKey: 'scene1_approach',
    sceneProgress: 0,
    elapsedClock: 0,
  });
  const s1End = evaluateAct1Frame({
    sceneKey: 'scene1_approach',
    sceneProgress: 1,
    elapsedClock: 10,
  });
  assert.equal(s1Start.orbitalVisibility, 1);
  assert.equal(s1End.orbitalVisibility, 1);
  assert.ok(Math.abs(s1Start.sceneFx.landerAltitude - 38) < 1e-3);
  assert.ok(Math.abs(s1End.sceneFx.landerAltitude - 24) < 1e-3);

  // Scene 2: Shots A/B/C, landing gear deploy 0.2 -> 1.0, touchdown compression, reducedMotion impulseY === 0
  const s2ShotA = evaluateAct1Frame({
    sceneKey: 'scene2_descent',
    sceneProgress: 0.05,
    elapsedClock: 10.8,
  });
  const s2ShotB = evaluateAct1Frame({
    sceneKey: 'scene2_descent',
    sceneProgress: 0.45,
    elapsedClock: 17.2,
  });
  const s2ShotC = evaluateAct1Frame({
    sceneKey: 'scene2_descent',
    sceneProgress: 0.92,
    elapsedClock: 24.7,
    reducedMotion: false,
  });
  const s2ShotCReduced = evaluateAct1Frame({
    sceneKey: 'scene2_descent',
    sceneProgress: 0.92,
    elapsedClock: 24.7,
    reducedMotion: true,
  });

  assert.equal(s2ShotA.shotKey, 'scene2_shotA');
  assert.equal(s2ShotB.shotKey, 'scene2_shotB');
  assert.equal(s2ShotC.shotKey, 'scene2_shotC');
  assert.ok(s2ShotA.sceneFx.gearDeploy >= 0.2);
  assert.equal(s2ShotC.sceneFx.gearDeploy, 1.0);
  assert.ok(s2ShotC.sceneFx.suspensionCompress > 0);
  assert.equal(s2ShotCReduced.cameraCue.impulseY, 0);
  assert.notEqual(s2ShotC.cameraCue.impulseY, 0);
});

test('evaluateAct1Frame handles Scene 4 egress, Scene 5 staged deployment, Scene 6 overview convergence, and evacuation', () => {
  // Scene 4 egress
  const s4End = evaluateAct1Frame({
    sceneKey: 'scene4_egress',
    sceneProgress: 1,
    elapsedClock: 43,
  });
  assert.equal(s4End.sceneFx.hatchOpen, 1);
  assert.equal(s4End.sceneFx.ladderDeploy, 1);
  assert.ok(s4End.sceneFx.scannerActive);

  const s4MidClimb = evaluateAct1Frame({
    sceneKey: 'scene4_egress',
    sceneProgress: 0.5,
    elapsedClock: 37.5,
  });
  assert.ok(s4MidClimb.sceneFx.astro1EgressProgress > 0 && s4MidClimb.sceneFx.astro1EgressProgress < 1);

  // Scene 5 staggered module deployment reaches 1 for all core modules + flag
  const s5Mid = evaluateAct1Frame({
    sceneKey: 'scene5_establishment',
    sceneProgress: 0.25,
    elapsedClock: 48.5,
  });
  const s5End = evaluateAct1Frame({
    sceneKey: 'scene5_establishment',
    sceneProgress: 1,
    elapsedClock: 65,
  });
  assert.ok(s5Mid.sceneFx.deployProgress.habitat > s5Mid.sceneFx.deployProgress.comms);
  for (const id of [...INTERACTIVE_BUILDING_IDS, 'flag']) {
    assert.equal(s5End.sceneFx.deployProgress[id], 1);
  }

  // Scene 6 converges exactly onto OVERVIEW_CAMERA (0, 6.8, 25.5) and OVERVIEW_TARGET (0, 2.5, -0.4)
  const s6End = evaluateAct1Frame({
    sceneKey: 'scene6_reveal',
    sceneProgress: 1,
    elapsedClock: 73,
  });
  const camPos = new THREE.Vector3(...s6End.cameraCue.pos);
  const camTarget = new THREE.Vector3(...s6End.cameraCue.target);
  assert.ok(camPos.distanceTo(OVERVIEW_CAMERA) < 1e-4);
  assert.ok(camTarget.distanceTo(OVERVIEW_TARGET) < 1e-4);

  // Evacuation frame sanity check
  const evac = evaluateEvacuationFrame({ progress: 0.5, reducedMotion: false });
  assert.ok(evac.stage);
  assert.ok(evac.sceneFx);
  assert.ok(evac.cameraCue);
});

test('createCameraController focuses all 6 interactive buildings, handles overview transitions, invalid IDs, and disposes cleanly', () => {
  assert.ok(BUILDING_LAYOUT.habitat);
  assert.equal(INTERACTIVE_BUILDING_IDS.length, 6);

  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 1400);
  const controls = createMockControls();
  const camCtrl = createCameraController({ camera, controls });

  assert.equal(camCtrl.getFocusedBuildingId(), null);

  for (const id of INTERACTIVE_BUILDING_IDS) {
    const focused = camCtrl.focusBuilding(id);
    assert.equal(focused, id);
    assert.equal(camCtrl.getFocusedBuildingId(), id);
    camCtrl.updateInteractive(0.1);
  }

  // Invalid building ID falls back cleanly to overview
  const invalidResult = camCtrl.focusBuilding('nonexistent_module');
  assert.equal(invalidResult, null);
  assert.equal(camCtrl.getFocusedBuildingId(), null);

  camCtrl.transitionToOverview({ reducedMotion: true });
  assert.equal(camCtrl.getFocusedBuildingId(), null);
  assert.ok(camera.position.distanceTo(OVERVIEW_CAMERA) < 1e-4);

  camCtrl.snapToOverview();
  assert.ok(camera.position.distanceTo(OVERVIEW_CAMERA) < 1e-4);
  assert.ok(controls.target.distanceTo(OVERVIEW_TARGET) < 1e-4);

  assert.ok(controls.listenerCount('start') > 0);
  camCtrl.dispose();
  assert.equal(controls.listenerCount('start'), 0);
  assert.equal(controls.listenerCount('end'), 0);
});
