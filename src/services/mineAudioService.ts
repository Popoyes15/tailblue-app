import { loadTailBlueSettings } from "../settings/tailblueSettings";

const TRACKS = {
  exploration: "/audio/mine-exploration.mp3",
  combat: "/audio/mine-combat.mp3",
} as const;

let currentTrack: HTMLAudioElement | null = null;
let currentMode: keyof typeof TRACKS | null = null;
const checked = new Map<string, Promise<boolean>>();

function settings() {
  return loadTailBlueSettings();
}

function volume(channel: "music" | "effects") {
  const cfg = settings();
  return Math.max(
    0,
    Math.min(
      1,
      cfg.masterVolume *
        (channel === "music" ? cfg.musicVolume : cfg.effectsVolume),
    ),
  );
}

async function exists(path: string) {
  const old = checked.get(path);
  if (old) return old;
  const check = fetch(path, { method: "HEAD", cache: "no-store" })
    .then((res) => res.ok)
    .catch(() => false);
  checked.set(path, check);
  return check;
}

function context() {
  const Window = window as typeof window & {
    webkitAudioContext?: typeof AudioContext;
    __tailblueMineAudioContext?: AudioContext;
  };
  const AudioContextCtor = window.AudioContext ?? Window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  Window.__tailblueMineAudioContext ??= new AudioContextCtor();
  return Window.__tailblueMineAudioContext;
}

function synth(
  frequencies: number[],
  duration = 0.12,
  gainScale = 0.09,
) {
  const cfg = settings();
  if (!cfg.sound) return;
  const ctx = context();
  if (!ctx) return;
  void ctx.resume();
  const start = ctx.currentTime;
  frequencies.forEach((frequency, index) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = index % 2 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume("effects") * gainScale),
      start + 0.012,
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start + index * 0.018);
    oscillator.stop(start + duration + 0.04);
  });
}

async function playFile(path: string) {
  if (!(await exists(path))) return false;
  const audio = new Audio(path);
  audio.volume = volume("effects");
  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

export async function setMineMusic(mode: "exploration" | "combat" | "off") {
  const cfg = settings();
  if (mode === "off" || !cfg.sound || !cfg.ambientMusic) {
    currentTrack?.pause();
    currentTrack = null;
    currentMode = null;
    return;
  }

  if (currentMode === mode && currentTrack) {
    currentTrack.volume = volume("music");
    return;
  }

  currentTrack?.pause();
  currentTrack = null;
  currentMode = mode;

  const path = TRACKS[mode];
  if (!(await exists(path))) return;

  const audio = new Audio(path);
  audio.loop = true;
  audio.volume = volume("music");
  currentTrack = audio;
  try {
    await audio.play();
  } catch {
    // Autoplay peut être bloqué jusqu'au premier clic. Le prochain appel réessaiera.
    currentTrack = null;
    currentMode = null;
  }
}

export async function playMineSfx(
  kind:
    | "step"
    | "mine"
    | "search"
    | "loot"
    | "event"
    | "rest"
    | "potion"
    | "hit"
    | "hurt"
    | "pet"
    | "victory"
    | "defeat",
) {
  const cfg = settings();
  if (!cfg.sound) return;
  const combatKind = ["hit", "hurt", "pet", "victory", "defeat"].includes(kind);
  if (combatKind && !cfg.combatSounds) return;
  if (!combatKind && !cfg.uiSounds) return;

  const optionalFile = `/audio/mine-${kind}.mp3`;
  if (await playFile(optionalFile)) return;

  const tones: Record<typeof kind, number[]> = {
    step: [190, 145],
    mine: [105, 165, 245],
    search: [320, 410, 520],
    loot: [660, 880, 1100],
    event: [240, 480, 720],
    rest: [330, 440, 550],
    potion: [500, 690, 920],
    hit: [120, 90],
    hurt: [165, 120],
    pet: [430, 620],
    victory: [520, 660, 880, 1040],
    defeat: [220, 170, 120],
  };
  synth(tones[kind], kind === "victory" || kind === "defeat" ? 0.35 : 0.12);
}
