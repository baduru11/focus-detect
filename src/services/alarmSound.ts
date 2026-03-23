// ---------------------------------------------------------------------------
// Alarm Sound System
// Primary: AudioBuffer playback from .mp3 files
// Fallback: Web Audio oscillator-based sounds (original implementation)
// ---------------------------------------------------------------------------

// Module-level state
let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let savedVolume = 0.7;
let currentSource: AudioBufferSourceNode | OscillatorNode | null = null;
const audioBufferCache: Map<string, AudioBuffer> = new Map();
let audioContextResumed = false;

// Oscillator fallback state
const activeOscillators: OscillatorNode[] = [];
const activeGains: GainNode[] = [];
let sirenInterval: ReturnType<typeof setInterval> | null = null;

// Sound file paths (bundled in /public/sounds/)
const SOUND_FILES = {
  chime: '/sounds/chime.mp3',
  alert: '/sounds/alert.mp3',
  siren: '/sounds/siren.mp3',
  phaseChime: '/sounds/phase-chime.mp3',
};

// ---------------------------------------------------------------------------
// AudioContext management
// ---------------------------------------------------------------------------

function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContext();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = savedVolume;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Resume AudioContext on first user interaction to satisfy browser autoplay
 * policy. Registers one-shot listeners that auto-remove after firing.
 */
function ensureAudioResumed(): void {
  if (audioContextResumed) return;

  const resume = () => {
    audioCtx?.resume();
    audioContextResumed = true;
    document.removeEventListener('click', resume);
    document.removeEventListener('keydown', resume);
  };
  document.addEventListener('click', resume, { once: true });
  document.addEventListener('keydown', resume, { once: true });
}

// ---------------------------------------------------------------------------
// AudioBuffer loading & playback
// ---------------------------------------------------------------------------

async function loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
  if (audioBufferCache.has(url)) return audioBufferCache.get(url)!;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for ${url}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const ctx = getAudioContext();
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    audioBufferCache.set(url, buffer);
    return buffer;
  } catch (e) {
    console.warn(`Failed to load audio ${url}, will use oscillator fallback:`, e);
    return null;
  }
}

function playBuffer(buffer: AudioBuffer, loop = false): void {
  stop();
  const ctx = getAudioContext();
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = loop;
  source.connect(masterGain!);
  source.start();
  currentSource = source;
}

// ---------------------------------------------------------------------------
// Volume control
// ---------------------------------------------------------------------------

/** Set master volume (0-1). Persists across sound changes. */
export function setVolume(vol: number): void {
  savedVolume = Math.max(0, Math.min(1, vol));
  if (masterGain) {
    masterGain.gain.value = savedVolume;
  }
}

/** Get current master volume (0-1). */
export function getVolume(): number {
  return savedVolume;
}

// ---------------------------------------------------------------------------
// Public play functions — try .mp3 first, fallback to oscillator
// ---------------------------------------------------------------------------

/** Gentle notification chime (Level 1) */
export async function playChime(): Promise<void> {
  ensureAudioResumed();
  const buffer = await loadAudioBuffer(SOUND_FILES.chime);
  if (buffer) {
    playBuffer(buffer);
    return;
  }
  playChimeFallback();
}

/** Urgent alert tone (Level 2) */
export async function playAlert(): Promise<void> {
  ensureAudioResumed();
  const buffer = await loadAudioBuffer(SOUND_FILES.alert);
  if (buffer) {
    playBuffer(buffer);
    return;
  }
  playAlertFallback();
}

/** Dramatic siren loop (Level 3) */
export async function playSiren(): Promise<void> {
  ensureAudioResumed();
  const buffer = await loadAudioBuffer(SOUND_FILES.siren);
  if (buffer) {
    playBuffer(buffer, true);
    return;
  }
  playSirenFallback();
}

/** Subtle phase transition chime */
export async function playPhaseChime(): Promise<void> {
  ensureAudioResumed();
  const buffer = await loadAudioBuffer(SOUND_FILES.phaseChime);
  if (buffer) {
    playBuffer(buffer);
    return;
  }
  playPhaseChimeFallback();
}

// ---------------------------------------------------------------------------
// Stop
// ---------------------------------------------------------------------------

/** Stop all active sounds (buffer sources and oscillators). Does not close AudioContext. */
export function stop(): void {
  // Stop buffer source if active
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // already stopped
    }
    try {
      currentSource.disconnect();
    } catch {
      // already disconnected
    }
    currentSource = null;
  }

  // Stop siren interval
  if (sirenInterval) {
    clearInterval(sirenInterval);
    sirenInterval = null;
  }

  // Stop all fallback oscillators
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

// ---------------------------------------------------------------------------
// Oscillator helpers (shared by fallback functions)
// ---------------------------------------------------------------------------

function createOscillator(
  ctx: AudioContext,
  destination: AudioNode,
  frequency: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
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

// ---------------------------------------------------------------------------
// Fallback oscillator implementations (original alarm sounds)
// ---------------------------------------------------------------------------

/** Gentle two-note ascending chime (440Hz -> 660Hz), ~300ms, low volume */
function playChimeFallback(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // First note: 440Hz
  const { osc: osc1, oscGain: g1 } = createOscillator(ctx, masterGain!, 440, 'sine', 0.15);
  g1.gain.setValueAtTime(0.15, now);
  g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc1.start(now);
  osc1.stop(now + 0.15);
  osc1.onended = () => cleanupOscillator(osc1, g1);

  // Second note: 660Hz
  const { osc: osc2, oscGain: g2 } = createOscillator(ctx, masterGain!, 660, 'sine', 0.15);
  g2.gain.setValueAtTime(0.001, now + 0.15);
  g2.gain.linearRampToValueAtTime(0.15, now + 0.16);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.3);
  osc2.onended = () => cleanupOscillator(osc2, g2);
}

/** Urgent three-note descending-ascending pattern, medium volume, plays twice */
function playAlertFallback(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const notes = [880, 660, 880];
  const noteDuration = 0.15;
  const gap = 0.05;
  const volume = 0.35;

  for (let repeat = 0; repeat < 2; repeat++) {
    const offset = repeat * (notes.length * (noteDuration + gap) + 0.1);
    notes.forEach((freq, i) => {
      const start = now + offset + i * (noteDuration + gap);
      const { osc, oscGain } = createOscillator(ctx, masterGain!, freq, 'square', volume);
      oscGain.gain.setValueAtTime(volume, start);
      oscGain.gain.exponentialRampToValueAtTime(0.001, start + noteDuration);
      osc.start(start);
      osc.stop(start + noteDuration);
      osc.onended = () => cleanupOscillator(osc, oscGain);
    });
  }
}

/** Alternating 880Hz/440Hz siren oscillation, continuous loop, loud */
function playSirenFallback(): void {
  stop();
  const ctx = getAudioContext();
  const { osc, oscGain } = createOscillator(ctx, masterGain!, 880, 'sawtooth', 0.4);

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

/** Subtle phase transition: soft 523Hz sine, ~200ms fade-out */
function playPhaseChimeFallback(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  const { osc, oscGain } = createOscillator(ctx, masterGain!, 523, 'sine', 0.1);
  oscGain.gain.setValueAtTime(0.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
  osc.start(now);
  osc.stop(now + 0.2);
  osc.onended = () => cleanupOscillator(osc, oscGain);
}
