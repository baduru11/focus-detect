let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const activeOscillators: OscillatorNode[] = [];
const activeGains: GainNode[] = [];
let sirenInterval: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): { ctx: AudioContext; gain: GainNode } {
  if (!audioCtx || audioCtx.state === "closed") {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return { ctx: audioCtx, gain: masterGain! };
}

function createOscillator(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  type: OscillatorType = "sine",
  volume: number = 0.3
): { osc: OscillatorNode; oscGain: GainNode } {
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  oscGain.gain.value = volume;
  osc.connect(oscGain);
  oscGain.connect(destination);
  activeOscillators.push(osc);
  activeGains.push(oscGain);
  return { osc, oscGain };
}

function cleanupOscillator(osc: OscillatorNode, oscGain: GainNode): void {
  const oscIdx = activeOscillators.indexOf(osc);
  if (oscIdx !== -1) activeOscillators.splice(oscIdx, 1);
  const gainIdx = activeGains.indexOf(oscGain);
  if (gainIdx !== -1) activeGains.splice(gainIdx, 1);
  try {
    osc.disconnect();
    oscGain.disconnect();
  } catch {
    // already disconnected
  }
}

/** Gentle two-note ascending chime (440Hz -> 660Hz), ~300ms, low volume */
export function playChime(): void {
  const { ctx, gain } = getAudioContext();
  const now = ctx.currentTime;

  // First note: 440Hz
  const { osc: osc1, oscGain: g1 } = createOscillator(ctx, gain, 440, "sine", 0.15);
  g1.gain.setValueAtTime(0.15, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc1.start(now);
  osc1.stop(now + 0.15);
  osc1.onended = () => cleanupOscillator(osc1, g1);

  // Second note: 660Hz
  const { osc: osc2, oscGain: g2 } = createOscillator(ctx, gain, 660, "sine", 0.15);
  g2.gain.setValueAtTime(0.001, now + 0.15);
  g2.gain.linearRampToValueAtTime(0.15, now + 0.16);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.3);
  osc2.onended = () => cleanupOscillator(osc2, g2);
}

/** Urgent three-note descending-ascending pattern, medium volume, plays twice */
export function playAlert(): void {
  const { ctx, gain } = getAudioContext();
  const now = ctx.currentTime;
  const notes = [880, 660, 880];
  const noteDuration = 0.15;
  const gap = 0.05;
  const volume = 0.35;

  for (let repeat = 0; repeat < 2; repeat++) {
    const offset = repeat * (notes.length * (noteDuration + gap) + 0.1);
    notes.forEach((freq, i) => {
      const start = now + offset + i * (noteDuration + gap);
      const { osc, oscGain } = createOscillator(ctx, gain, freq, "square", volume);
      oscGain.gain.setValueAtTime(volume, start);
      oscGain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);
      osc.start(start);
      osc.stop(start + noteDuration);
      osc.onended = () => cleanupOscillator(osc, oscGain);
    });
  }
}

/** Alternating 880Hz/440Hz siren oscillation, continuous loop, loud */
export function playSiren(): void {
  stop();
  const { ctx, gain } = getAudioContext();
  const { osc, oscGain } = createOscillator(ctx, gain, 880, "sawtooth", 0.4);

  // Oscillate frequency between 880 and 440
  let high = true;
  osc.frequency.value = 880;
  osc.start();

  sirenInterval = setInterval(() => {
    const now = ctx.currentTime;
    osc.frequency.linearRampToValueAtTime(high ? 440 : 880, now + 0.3);
    high = !high;
  }, 300);

  // Store reference so stop() can clean up
  osc.onended = () => {
    cleanupOscillator(osc, oscGain);
    if (sirenInterval) {
      clearInterval(sirenInterval);
      sirenInterval = null;
    }
  };
}

/** Stop all active oscillators and disconnect nodes */
export function stop(): void {
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }
  // Copy arrays since cleanup mutates them
  [...activeOscillators].forEach((osc) => {
    try {
      osc.stop();
    } catch {
      // already stopped
    }
  });
  [...activeGains].forEach((g) => {
    try {
      g.disconnect();
    } catch {
      // already disconnected
    }
  });
  activeOscillators.length = 0;
  activeGains.length = 0;
}

/** Set master volume (0-1) */
export function setVolume(level: number): void {
  const clamped = Math.max(0, Math.min(1, level));
  if (masterGain) {
    masterGain.gain.value = clamped;
  }
}
