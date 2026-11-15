// Act 1 & Campaign Evacuation Timeline Director:
// Orchestrates Scenes 1–6 (~73s normal / ~7.2s reducedMotion), synced beat titles,
// captions, sound triggers, and instantaneous clean Skip-to-Completed-Outpost handoff.
import { clamp } from '../sceneUtils.js';
import { evaluateAct1Frame, evaluateEvacuationFrame } from './AnimationController.js';

export const ACT1_SCENES = [
  {
    key: 'scene1_approach',
    label: 'SCENE 1 · MOON APPROACH',
    duration: 10.0,
    reducedDuration: 1.1,
    caption: 'Mission Control: Lunar approach confirmed. Prepare for descent.',
    title: '',
    subtitle: '',
    soundCue: 'thrusterStart',
  },
  {
    key: 'scene2_descent',
    label: 'SCENE 2 · DESCENT & LANDING',
    duration: 16.0,
    reducedDuration: 1.5,
    caption: 'Guidance: Powered braking active — landing gear deployed.',
    title: '',
    subtitle: '',
    soundCue: 'descentBurn',
  },
  {
    key: 'scene3_touchdown',
    label: 'SCENE 3 · TOUCHDOWN',
    duration: 6.0,
    reducedDuration: 1.1,
    caption: 'Mission Control: Engine cutoff confirmed. Outpost pad stable.',
    title: 'LUNAR TOUCHDOWN',
    subtitle: 'Landing successful. Outpost establishment beginning.',
    soundCue: 'touchdown',
  },
  {
    key: 'scene4_egress',
    label: 'SCENE 4 · EVA EGRESS',
    duration: 11.0,
    reducedDuration: 1.1,
    caption: 'Commander stepping onto the Lunar South Pole to survey the site.',
    title: '',
    subtitle: '',
    soundCue: 'hatchOpen',
  },
  {
    key: 'scene5_establishment',
    label: 'SCENE 5 · BASE ESTABLISHMENT',
    duration: 22.0,
    reducedDuration: 1.5,
    caption: 'Automated outpost modules unfolding and connecting power & life support.',
    title: '',
    subtitle: '',
    soundCue: 'moduleStart',
  },
  {
    key: 'scene6_reveal',
    label: 'SCENE 6 · OUTPOST READY',
    duration: 8.0,
    reducedDuration: 1.0,
    caption: 'All systems nominal. Handing outpost control to Commander.',
    title: 'OUTPOST ESTABLISHED',
    subtitle: 'Your lunar base is ready. Commander, take control of your mission.',
    soundCue: 'completeFanfare',
  },
];

const SCENE5_SUBBEATS = [
  { minP: 0.0, key: 'scan', caption: 'Landing zone assessed.', sound: 'scan' },
  { minP: 0.13, key: 'habitat', caption: 'Deploying Habitat & Radiation Storm Shelter...', sound: 'moduleOnline' },
  { minP: 0.30, key: 'solar', caption: 'Unfolding Solar Array wings toward low South Pole sunlight...', sound: 'moduleOnline' },
  { minP: 0.47, key: 'lifesupport', caption: 'Life Support & Food Greenhouse initializing...', sound: 'moduleOnline' },
  { minP: 0.67, key: 'comms', caption: 'Communications Relay locking onto Earth & Science Lab online...', sound: 'confirmationBeep' },
  { minP: 0.85, key: 'inspection', caption: 'Final outpost inspection complete. Crew ready for duty.', sound: 'moduleOnline' },
];

export function createCinematicController({ onAudioCue } = {}) {
  const state = {
    mode: 'none', // 'none' | 'arrival' | 'evacuation'
    stage: 'idle',
    elapsed: 0,
    duration: 0,
    reducedMotion: false,
    sceneIndex: -1,
    previousShotKey: '',
    firedSubBeats: new Set(),
    firedSceneSounds: new Set(),
    onStageChange: null,
    onComplete: null,
  };

  function getSceneDurations() {
    return ACT1_SCENES.map((s) => (state.reducedMotion ? s.reducedDuration : s.duration));
  }

  function start(mode, opts = {}) {
    const normalizedMode = mode === 'landing' || mode === 'setup' ? 'arrival' : mode || 'none';
    state.mode = normalizedMode;
    state.elapsed = 0;
    state.reducedMotion = Boolean(opts.reducedMotion);
    state.onStageChange = opts.onStageChange || null;
    state.onComplete = opts.onComplete || null;
    state.sceneIndex = -1;
    state.previousShotKey = '';
    state.firedSubBeats.clear();
    state.firedSceneSounds.clear();

    if (normalizedMode === 'arrival') {
      const durations = getSceneDurations();
      state.duration = durations.reduce((acc, v) => acc + v, 0);
      const first = ACT1_SCENES[0];
      state.stage = first.key;
      state.sceneIndex = 0;
      state.firedSceneSounds.add(first.key);
      onAudioCue?.(first.soundCue, { thrusterLevel: 0.25 });
      state.onStageChange?.({
        mode: 'arrival',
        stage: first.key,
        label: first.label,
        caption: first.caption,
        title: first.title,
        subtitle: first.subtitle,
        progress: 0,
      });
    } else if (normalizedMode === 'evacuation') {
      state.duration = state.reducedMotion ? 1.2 : 5.8;
      state.stage = 'wrapUp';
      onAudioCue?.('thrusterStart', { thrusterLevel: 0.55 });
      state.onStageChange?.({
        mode: 'evacuation',
        stage: 'wrapUp',
        label: 'CAMPAIGN COMPLETE · RETURN TO EARTH',
        caption: 'Run 5/5 complete! Crew securing instruments & boarding lander...',
        title: '',
        subtitle: '',
        progress: 0,
      });
    } else {
      state.mode = 'none';
      state.stage = 'idle';
      state.duration = 0;
    }
  }

  function skip() {
    if (state.mode === 'none') return;
    const finishedMode = state.mode;
    const cb = state.onComplete;
    state.mode = 'none';
    state.stage = 'idle';
    state.elapsed = 0;
    state.sceneIndex = -1;
    state.previousShotKey = '';
    onAudioCue?.('stopAll');
    cb?.(finishedMode, { skipped: true });
  }

  function step(dt) {
    if (state.mode === 'none') {
      return { active: false };
    }

    state.elapsed += dt;
    const totalProgress = clamp(state.elapsed / Math.max(0.1, state.duration), 0, 1);

    if (state.mode === 'arrival') {
      const durations = getSceneDurations();
      let accum = 0;
      let idx = ACT1_SCENES.length - 1;
      let localElapsed = 0;
      for (let i = 0; i < durations.length; i++) {
        if (state.elapsed < accum + durations[i] || i === durations.length - 1) {
          idx = i;
          localElapsed = state.elapsed - accum;
          break;
        }
        accum += durations[i];
      }

      const sceneDef = ACT1_SCENES[idx];
      const localProgress = clamp(localElapsed / Math.max(0.05, durations[idx]), 0, 1);

      if (idx !== state.sceneIndex) {
        state.sceneIndex = idx;
        state.stage = sceneDef.key;
        if (!state.firedSceneSounds.has(sceneDef.key)) {
          state.firedSceneSounds.add(sceneDef.key);
          onAudioCue?.(sceneDef.soundCue, {
            thrusterLevel: sceneDef.key === 'scene2_descent' ? 0.85 : 0,
          });
        }
        state.onStageChange?.({
          mode: 'arrival',
          stage: sceneDef.key,
          label: sceneDef.label,
          caption: sceneDef.caption,
          title: sceneDef.title,
          subtitle: sceneDef.subtitle,
          progress: totalProgress,
        });
      }

      // Scene 2 continuous engine audio & touchdown thud trigger right on footpad contact
      if (sceneDef.key === 'scene2_descent') {
        const contactT = localProgress;
        if (contactT < 0.88) {
          onAudioCue?.('thrusterUpdate', { thrusterLevel: contactT < 0.74 ? 0.9 : 0.45 });
        } else if (!state.firedSubBeats.has('descent_cutoff')) {
          state.firedSubBeats.add('descent_cutoff');
          onAudioCue?.('thrusterStop');
        }
      }

      // Scene 4 scanner sweep chime trigger when scanner comes up
      if (sceneDef.key === 'scene4_egress' && localProgress >= 0.78 && !state.firedSubBeats.has('scene4_scan')) {
        state.firedSubBeats.add('scene4_scan');
        onAudioCue?.('scan');
      }

      // Scene 5 module establishment captions & boot chimes
      if (sceneDef.key === 'scene5_establishment') {
        for (const sub of SCENE5_SUBBEATS) {
          if (localProgress >= sub.minP && !state.firedSubBeats.has(sub.key)) {
            state.firedSubBeats.add(sub.key);
            if (sub.sound) onAudioCue?.(sub.sound);
            state.onStageChange?.({
              mode: 'arrival',
              stage: sceneDef.key,
              label: sceneDef.label,
              caption: sub.caption,
              title: '',
              subtitle: '',
              progress: totalProgress,
            });
          }
        }
      }

      const evalRes = evaluateAct1Frame({
        sceneKey: sceneDef.key,
        sceneProgress: localProgress,
        elapsedClock: state.elapsed,
        reducedMotion: state.reducedMotion,
        previousShotKey: state.previousShotKey,
      });
      state.previousShotKey = evalRes.shotKey;

      const completed = totalProgress >= 1;
      if (completed) {
        const doneCb = state.onComplete;
        state.mode = 'none';
        state.stage = 'idle';
        state.previousShotKey = '';
        onAudioCue?.('stopAll');
        doneCb?.('arrival', { skipped: false });
      }

      return {
        active: !completed,
        completed,
        mode: 'arrival',
        progress: totalProgress,
        ...evalRes,
      };
    }

    // Evacuation mode
    const evac = evaluateEvacuationFrame({
      progress: totalProgress,
      reducedMotion: state.reducedMotion,
    });
    if (state.stage !== evac.stage) {
      state.stage = evac.stage;
      state.onStageChange?.({
        mode: 'evacuation',
        stage: evac.stage,
        label: 'CAMPAIGN COMPLETE',
        caption: evac.caption,
        title: '',
        subtitle: '',
        progress: totalProgress,
      });
    }
    if (evac.sceneFx.thrusterPower > 0) {
      onAudioCue?.('thrusterUpdate', { thrusterLevel: evac.sceneFx.thrusterPower });
    }
    const completed = totalProgress >= 1;
    if (completed) {
      const doneCb = state.onComplete;
      state.mode = 'none';
      state.stage = 'idle';
      onAudioCue?.('stopAll');
      doneCb?.('evacuation', { skipped: false });
    }
    return {
      active: !completed,
      completed,
      mode: 'evacuation',
      progress: totalProgress,
      sceneFx: evac.sceneFx,
      cameraCue: evac.cameraCue,
      orbitalVisibility: totalProgress > 0.72 ? clamp((totalProgress - 0.72) * 3.5, 0, 1) : 0,
    };
  }

  return {
    start,
    skip,
    step,
    isActive: () => state.mode !== 'none',
    getMode: () => state.mode,
  };
}

