// Web Audio API Procedural Sound Synthesizer
// Zero external audio files required, zero latency, child-friendly feedback.

let audioCtx = null;
let muted = false;
let volume = 0.75;
let activeThrusterLoop = null;
const captionListeners = new Set();

try {
  if (typeof window !== 'undefined' && window.localStorage) {
    muted = window.localStorage.getItem('jamt_sound_muted') === 'true';
    const savedVol = Number(window.localStorage.getItem('jamt_sound_volume'));
    if (Number.isFinite(savedVol) && savedVol >= 0 && savedVol <= 1) {
      volume = savedVol;
    }
  }
} catch (_) {
  muted = false;
}

function emitCaption(text) {
  if (!text) return;
  for (const fn of captionListeners) {
    try {
      fn(text);
    } catch (_) {}
  }
}

function getContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export const SOUNDS = {
  isMuted() {
    return muted;
  },
  getVolume() {
    return volume;
  },
  setVolume(nextVol) {
    volume = Math.max(0, Math.min(1, Number(nextVol) || 0));
    if (activeThrusterLoop) {
      if (muted || volume <= 0.01) {
        this.stopThrusterLoop();
      } else {
        activeThrusterLoop.update(activeThrusterLoop.level);
      }
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('jamt_sound_volume', String(volume));
      }
    } catch (_) {}
    return volume;
  },
  setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    if (muted) {
      this.stopThrusterLoop();
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('jamt_sound_muted', String(muted));
      }
    } catch (_) {}
    return muted;
  },
  onCaption(fn) {
    if (typeof fn !== 'function') return () => {};
    captionListeners.add(fn);
    return () => captionListeners.delete(fn);
  },
  toggleMute() {
    return this.setMuted(!muted);
  },
  click(caption) {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.08 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  },
  action(caption) {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  },
  alert(caption = 'Alert chime: Check outpost status!') {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(440, now + 0.1);
    gain.gain.setValueAtTime(0.12 * volume, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.25);
  },
  success(caption = 'Success chime!') {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.09 * volume, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.16);
    });
  },
  fanfare(caption = 'Mission celebration fanfare!') {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.12 * volume, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.35);
    });
  },
  scan(caption) {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.05 * volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  },
  patch(caption) {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.18);
    gain.gain.setValueAtTime(0.14 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.2);
  },
  thruster(caption = 'Thruster ignition burn') {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.45);
    gain.gain.setValueAtTime(0.07 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.45);
  },
  startThrusterLoop(level = 0.5) {
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    if (activeThrusterLoop) {
      activeThrusterLoop.update(level);
      return;
    }
    try {
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.04 * white) / 1.04;
        lastOut = output[i];
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, ctx.currentTime);

      const subOsc = ctx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(52, ctx.currentTime);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.28, ctx.currentTime);

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);

      noise.connect(filter);
      subOsc.connect(subGain);
      subGain.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      noise.start();
      subOsc.start();

      const controller = {
        level: 0,
        update(nextLevel) {
          const clamped = Math.max(0, Math.min(1, Number(nextLevel) || 0));
          controller.level = clamped;
          const t = ctx.currentTime;
          const targetGain = muted || volume <= 0.01 ? 0.0001 : 0.0001 + clamped * 0.14 * volume;
          masterGain.gain.setTargetAtTime(targetGain, t, 0.09);
          filter.frequency.setTargetAtTime(110 + clamped * 190, t, 0.12);
          subOsc.frequency.setTargetAtTime(42 + clamped * 24, t, 0.12);
        },
        stop() {
          try {
            const t = ctx.currentTime;
            masterGain.gain.setTargetAtTime(0.0001, t, 0.06);
            setTimeout(() => {
              try {
                noise.stop();
                subOsc.stop();
                noise.disconnect();
                subOsc.disconnect();
                filter.disconnect();
                masterGain.disconnect();
              } catch (_) {}
            }, 160);
          } catch (_) {}
        },
      };
      activeThrusterLoop = controller;
      controller.update(level);
    } catch (_) {}
  },
  updateThrusterLoop(level = 0.5) {
    if (muted || volume <= 0.01) {
      this.stopThrusterLoop();
      return;
    }
    if (!activeThrusterLoop) {
      if (level > 0.04) this.startThrusterLoop(level);
      return;
    }
    activeThrusterLoop.update(level);
  },
  stopThrusterLoop() {
    if (!activeThrusterLoop) return;
    activeThrusterLoop.stop();
    activeThrusterLoop = null;
  },
  touchdown(caption = 'Touchdown confirmed!') {
    this.stopThrusterLoop();
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(74, now);
    thud.frequency.exponentialRampToValueAtTime(30, now + 0.36);
    thudGain.gain.setValueAtTime(0.18 * volume, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.38);

    [440, 587.33].forEach((freq, idx) => {
      const ping = ctx.createOscillator();
      const gain = ctx.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(freq, now + 0.18 + idx * 0.09);
      gain.gain.setValueAtTime(0.07 * volume, now + 0.18 + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + idx * 0.09 + 0.22);
      ping.connect(gain);
      gain.connect(ctx.destination);
      ping.start(now + 0.18 + idx * 0.09);
      ping.stop(now + 0.18 + idx * 0.09 + 0.22);
    });
  },
  hatchOpen(caption = 'Airlock hatch unlatched') {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [220, 310].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.11);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.72, now + i * 0.11 + 0.12);
      gain.gain.setValueAtTime(0.09 * volume, now + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.11 + 0.13);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.11);
      osc.stop(now + i * 0.11 + 0.13);
    });
  },
  moduleOnline(caption = 'Outpost module online') {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [392, 523.25, 659.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.065);
      gain.gain.setValueAtTime(0.075 * volume, now + i * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.18);
    });
  },
  confirmationBeep(caption) {
    emitCaption(caption);
    if (muted || volume <= 0.01) return;
    const ctx = getContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.5, now);
    osc.frequency.setValueAtTime(783.99, now + 0.09);
    gain.gain.setValueAtTime(0.065 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  },
};
