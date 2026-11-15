// Act 1 & Interactive Camera Choreography Controller:
// Handles multi-shot cinematic tracking, smooth damp transitions, micro-impulse landing feedback,
// exact overview handoff, and interactive building focus/return without resetting the scene.
import * as THREE from 'three';
import { BUILDING_LAYOUT } from '../buildings.js';
import { sampleTerrainHeight } from '../terrain.js';

export const OVERVIEW_TARGET = new THREE.Vector3(0, 2.5, -0.4);
export const OVERVIEW_CAMERA = new THREE.Vector3(0, 6.8, 25.5);

export function createCameraController({ camera, controls }) {
  let userControlling = false;
  let transitioning = false;
  let focusedBuildingId = null;

  const desiredTarget = OVERVIEW_TARGET.clone();
  const desiredCameraPos = OVERVIEW_CAMERA.clone();
  const cinematicTarget = new THREE.Vector3();
  const cinematicPos = new THREE.Vector3();

  const onControlsStart = () => {
    userControlling = true;
    transitioning = false;
    controls.autoRotate = false;
  };

  const onControlsEnd = () => {
    userControlling = false;
    if (!focusedBuildingId) {
      controls.autoRotate = true;
    }
  };

  controls.addEventListener('start', onControlsStart);
  controls.addEventListener('end', onControlsEnd);

  function snapToOverview() {
    focusedBuildingId = null;
    userControlling = false;
    transitioning = false;
    desiredTarget.copy(OVERVIEW_TARGET);
    desiredCameraPos.copy(OVERVIEW_CAMERA);
    controls.target.copy(OVERVIEW_TARGET);
    camera.position.copy(OVERVIEW_CAMERA);
    controls.autoRotate = true;
    controls.update();
  }

  function transitionToOverview({ reducedMotion = false } = {}) {
    focusedBuildingId = null;
    userControlling = false;
    desiredTarget.copy(OVERVIEW_TARGET);
    desiredCameraPos.copy(OVERVIEW_CAMERA);
    controls.autoRotate = true;
    if (reducedMotion) {
      controls.target.copy(desiredTarget);
      camera.position.copy(desiredCameraPos);
      transitioning = false;
      controls.update();
    } else {
      transitioning = true;
    }
  }

  function focusBuilding(buildingId = null, { reducedMotion = false } = {}) {
    const validId = buildingId && BUILDING_LAYOUT[buildingId] ? buildingId : null;
    if (!validId) {
      transitionToOverview({ reducedMotion });
      return null;
    }
    if (validId === focusedBuildingId && transitioning) {
      return validId;
    }

    focusedBuildingId = validId;
    userControlling = false;

    const spec = BUILDING_LAYOUT[validId];
    const groundY = sampleTerrainHeight(spec.x, spec.z);
    desiredTarget.set(spec.x, groundY + spec.focusHeight, spec.z);

    // Compute balanced 3/4 framing angle keeping foreground landmarks clear
    const angle = Math.atan2(spec.x, spec.z + 0.01) * 0.35;
    const dist = spec.camDist || 12.5;
    desiredCameraPos.set(
      spec.x + Math.sin(angle) * dist * 0.65,
      groundY + spec.focusHeight + dist * 0.48,
      spec.z + Math.cos(angle) * dist * 0.92
    );
    controls.autoRotate = false;

    if (reducedMotion) {
      controls.target.copy(desiredTarget);
      camera.position.copy(desiredCameraPos);
      transitioning = false;
      controls.update();
    } else {
      transitioning = true;
    }

    return validId;
  }

  function applyCinematicFrame({
    pos,
    target,
    cut = false,
    dampSpeed = 4.2,
    impulseY = 0,
    dt = 1 / 60,
  }) {
    cinematicPos.set(pos[0], pos[1] + impulseY, pos[2]);
    cinematicTarget.set(target[0], target[1], target[2]);
    controls.autoRotate = false;

    if (cut) {
      camera.position.copy(cinematicPos);
      controls.target.copy(cinematicTarget);
    } else {
      const alpha = 1 - Math.exp(-dampSpeed * dt);
      camera.position.lerp(cinematicPos, alpha);
      controls.target.lerp(cinematicTarget, 1 - Math.exp(-(dampSpeed + 1.4) * dt));
    }
    desiredCameraPos.copy(camera.position);
    desiredTarget.copy(controls.target);
    transitioning = false;
  }

  function updateInteractive(dt, { cinematicActive = false } = {}) {
    if (!cinematicActive) {
      if (!userControlling) {
        controls.target.lerp(desiredTarget, 1 - Math.exp(-6 * dt));
      }
      if (transitioning && !userControlling) {
        camera.position.lerp(desiredCameraPos, 1 - Math.exp(-5 * dt));
        if (
          camera.position.distanceToSquared(desiredCameraPos) < 0.04 &&
          controls.target.distanceToSquared(desiredTarget) < 0.02
        ) {
          transitioning = false;
        }
      }
    }
    controls.update();
  }

  function getFocusedBuildingId() {
    return focusedBuildingId;
  }

  function dispose() {
    controls.removeEventListener('start', onControlsStart);
    controls.removeEventListener('end', onControlsEnd);
  }

  return {
    focusBuilding,
    transitionToOverview,
    snapToOverview,
    applyCinematicFrame,
    updateInteractive,
    getFocusedBuildingId,
    dispose,
  };
}

