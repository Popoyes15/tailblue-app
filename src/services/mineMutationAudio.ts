import type { MutationVisualFamily } from "../data/mineMutationCinematics";
import { mutationCinematic } from "../data/mineMutationCinematics";

type Direction = "north" | "south" | "east" | "west" | string;
type Phase = "call" | "reveal";

type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
  __tailblueMutationAudioContext?: AudioContext;
};

const audioWindow = window as AudioWindow;

function context() {
  const AudioCtor = window.AudioContext ?? audioWindow.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioWindow.__tailblueMutationAudioContext) {
    audioWindow.__tailblueMutationAudioContext = new AudioCtor();
  }
  return audioWindow.__tailblueMutationAudioContext;
}


let mutationUnlockInstalled = false;

export async function unlockMutationAudio() {
  const ctx = context();
  if (!ctx) return false;
  try {
    if (ctx.state !== "running") await ctx.resume();
    return ctx.state === "running";
  } catch {
    return false;
  }
}

export function installMutationAudioUnlock() {
  if (mutationUnlockInstalled) return () => undefined;
  mutationUnlockInstalled = true;

  const handler = () => {
    void unlockMutationAudio();
  };

  // Capture : le contexte est amorcé au même geste utilisateur que l'action
  // Mine (Entrer, déplacement, téléportation...), avant l'attente réseau.
  window.addEventListener("pointerdown", handler, true);
  window.addEventListener("click", handler, true);
  window.addEventListener("keydown", handler, true);

  return () => {
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("click", handler, true);
    window.removeEventListener("keydown", handler, true);
    mutationUnlockInstalled = false;
  };
}

function panFor(direction: Direction) {
  if (direction === "west") return -0.82;
  if (direction === "east") return 0.82;
  if (direction === "north") return -0.18;
  if (direction === "south") return 0.18;
  return 0;
}

function makeNoise(ctx: AudioContext, seconds = 2) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let previous = 0;
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    previous = previous * 0.985 + white * 0.15;
    data[index] = previous;
  }
  return buffer;
}

function destination(ctx: AudioContext, volume: number, pan: number) {
  const gain = ctx.createGain();
  gain.gain.value = volume;
  const panner = ctx.createStereoPanner?.();
  if (panner) {
    panner.pan.value = pan;
    gain.connect(panner);
    panner.connect(ctx.destination);
  } else {
    gain.connect(ctx.destination);
  }
  return gain;
}

function envelope(param: AudioParam, now: number, peak: number, duration: number, attack = 0.08) {
  param.cancelScheduledValues(now);
  param.setValueAtTime(0.0001, now);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), now + attack);
  param.exponentialRampToValueAtTime(0.0001, now + duration);
}

function oscillator(
  ctx: AudioContext,
  target: AudioNode,
  options: {
    type?: OscillatorType;
    start: number;
    duration: number;
    frequency: number;
    endFrequency?: number;
    gain?: number;
  },
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = options.type ?? "sine";
  osc.frequency.setValueAtTime(options.frequency, options.start);
  if (options.endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(options.endFrequency, options.start + options.duration);
  }
  envelope(gain.gain, options.start, options.gain ?? 0.18, options.duration, 0.025);
  osc.connect(gain);
  gain.connect(target);
  osc.start(options.start);
  osc.stop(options.start + options.duration + 0.05);
}

function noiseBurst(
  ctx: AudioContext,
  target: AudioNode,
  options: {
    start: number;
    duration: number;
    gain?: number;
    lowpass?: number;
    highpass?: number;
  },
) {
  const src = ctx.createBufferSource();
  src.buffer = makeNoise(ctx, options.duration + 0.2);
  const gain = ctx.createGain();
  let node: AudioNode = src;
  if (options.highpass) {
    const high = ctx.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = options.highpass;
    node.connect(high);
    node = high;
  }
  if (options.lowpass) {
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.value = options.lowpass;
    node.connect(low);
    node = low;
  }
  node.connect(gain);
  gain.connect(target);
  envelope(gain.gain, options.start, options.gain ?? 0.15, options.duration, 0.05);
  src.start(options.start);
  src.stop(options.start + options.duration + 0.08);
}

function familySound(
  ctx: AudioContext,
  family: MutationVisualFamily,
  direction: Direction,
  phase: Phase,
) {
  const now = ctx.currentTime + 0.02;
  const strong = phase === "reveal" ? 1.24 : 1;
  const out = destination(ctx, 0.82, panFor(direction));

  switch (family) {
    case "wind": {
      noiseBurst(ctx, out, { start: now, duration: 2.2, gain: 0.23 * strong, highpass: 180, lowpass: 2400 });
      oscillator(ctx, out, { start: now + 0.2, duration: 1.7, frequency: 180, endFrequency: 520, gain: 0.07 * strong, type: "sine" });
      break;
    }
    case "silence": {
      oscillator(ctx, out, { start: now, duration: 2.4, frequency: 54, endFrequency: 46, gain: 0.17 * strong, type: "sine" });
      oscillator(ctx, out, { start: now + 1.55, duration: 0.45, frequency: 720, endFrequency: 1180, gain: 0.035 * strong, type: "triangle" });
      break;
    }
    case "scream": {
      oscillator(ctx, out, { start: now + 0.1, duration: 1.45, frequency: 620, endFrequency: 260, gain: 0.13 * strong, type: "sawtooth" });
      oscillator(ctx, out, { start: now + 0.17, duration: 1.25, frequency: 910, endFrequency: 390, gain: 0.065 * strong, type: "triangle" });
      noiseBurst(ctx, out, { start: now + 0.1, duration: 1.5, gain: 0.05 * strong, highpass: 700, lowpass: 3200 });
      break;
    }
    case "quake": {
      oscillator(ctx, out, { start: now, duration: 2.15, frequency: 48, endFrequency: 34, gain: 0.28 * strong, type: "sine" });
      noiseBurst(ctx, out, { start: now + 0.2, duration: 1.7, gain: 0.16 * strong, lowpass: 420 });
      [0.28, 0.62, 1.05, 1.42].forEach((offset, index) => oscillator(ctx, out, { start: now + offset, duration: 0.18, frequency: 92 - index * 8, endFrequency: 44, gain: 0.13 * strong, type: "square" }));
      break;
    }
    case "water": {
      noiseBurst(ctx, out, { start: now, duration: 2.35, gain: 0.08 * strong, highpass: 900, lowpass: 5200 });
      [0.18, 0.46, 0.83, 1.16, 1.54, 1.94].forEach((offset, index) => oscillator(ctx, out, { start: now + offset, duration: 0.25, frequency: 920 + index * 95, endFrequency: 520 + index * 45, gain: 0.055 * strong, type: "sine" }));
      break;
    }
    case "resonance": {
      [196, 293.7, 392, 587.3].forEach((frequency, index) => oscillator(ctx, out, { start: now + index * 0.035, duration: 2.5 - index * 0.18, frequency, endFrequency: frequency * 0.995, gain: (0.12 / (index + 1)) * strong, type: "sine" }));
      break;
    }
    case "frost": {
      noiseBurst(ctx, out, { start: now, duration: 2.15, gain: 0.13 * strong, highpass: 1700, lowpass: 7200 });
      [0.42, 0.91, 1.36, 1.72].forEach((offset, index) => oscillator(ctx, out, { start: now + offset, duration: 0.19, frequency: 2400 + index * 420, endFrequency: 1550 + index * 260, gain: 0.04 * strong, type: "triangle" }));
      break;
    }
    case "glow": {
      [440, 554.37, 659.25, 880].forEach((frequency, index) => oscillator(ctx, out, { start: now + index * 0.13, duration: 1.75, frequency, endFrequency: frequency * 1.04, gain: 0.065 * strong, type: "sine" }));
      oscillator(ctx, out, { start: now + 0.1, duration: 2.0, frequency: 1320, endFrequency: 1760, gain: 0.025 * strong, type: "triangle" });
      break;
    }
    case "presence": {
      [0.12, 0.6, 1.12].forEach((offset) => {
        oscillator(ctx, out, { start: now + offset, duration: 0.16, frequency: 76, endFrequency: 54, gain: 0.22 * strong, type: "sine" });
        oscillator(ctx, out, { start: now + offset + 0.18, duration: 0.13, frequency: 64, endFrequency: 46, gain: 0.15 * strong, type: "sine" });
      });
      noiseBurst(ctx, out, { start: now + 0.35, duration: 1.65, gain: 0.05 * strong, highpass: 1700, lowpass: 4300 });
      break;
    }
    case "heart": {
      [0.05, 0.72, 1.42].forEach((offset) => {
        oscillator(ctx, out, { start: now + offset, duration: 0.26, frequency: 58, endFrequency: 38, gain: 0.3 * strong, type: "sine" });
        oscillator(ctx, out, { start: now + offset + 0.22, duration: 0.18, frequency: 47, endFrequency: 32, gain: 0.2 * strong, type: "sine" });
      });
      oscillator(ctx, out, { start: now, duration: 2.5, frequency: 29, endFrequency: 25, gain: 0.12 * strong, type: "sine" });
      break;
    }
  }

  if (phase === "reveal") {
    // Craquement final + "ding" de découverte. Toujours synthétique : aucun
    // fichier supplémentaire à installer et aucune URL susceptible de casser.
    noiseBurst(ctx, out, { start: now + 2.05, duration: 0.52, gain: 0.26, lowpass: 1800 });
    oscillator(ctx, out, { start: now + 2.48, duration: 1.15, frequency: 784, endFrequency: 792, gain: 0.14, type: "sine" });
    oscillator(ctx, out, { start: now + 2.52, duration: 1.0, frequency: 1174.7, endFrequency: 1182, gain: 0.07, type: "sine" });
  }
}

export async function playMutationAudio(
  signatureId: number,
  direction: Direction,
  phase: Phase,
) {
  const ctx = context();
  if (!ctx) return false;
  try {
    if (!(await unlockMutationAudio())) return false;
    const definition = mutationCinematic(signatureId);
    familySound(ctx, definition.family, direction, phase);
    return true;
  } catch (error) {
    console.debug("[TailBlue Mutation Audio]", error);
    return false;
  }
}
