// TAILBLUE_CHESTS_DESKTOP_V4_20260822
export type ChestSoundCue = "approach" | "click" | "rumble" | "open" | "reveal";

const EXTENSIONS = ["mp3", "wav", "ogg", "m4a", "aac"] as const;
const BASENAMES: Record<ChestSoundCue, string[]> = {
  approach: ["coffre_approche", "chest_approach", "approach"],
  click: ["coffre_clic", "chest_click", "click"],
  rumble: ["coffre_tremble", "chest_rumble", "rumble"],
  open: ["coffre_ouverture", "chest_open", "open"],
  reveal: ["coffre_recompense", "chest_reveal", "reveal"],
};

function candidates(cue: ChestSoundCue) {
  return BASENAMES[cue].flatMap((base) => EXTENSIONS.map((extension) => `/audio/${base}.${extension}`));
}

function probeAudio(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const audio = new Audio();
    let done = false;
    const finish = (value: string | null) => {
      if (done) return;
      done = true;
      audio.oncanplaythrough = null;
      audio.onerror = null;
      window.clearTimeout(timer);
      resolve(value);
    };
    const timer = window.setTimeout(() => finish(null), 550);
    audio.preload = "auto";
    audio.oncanplaythrough = () => finish(src);
    audio.onerror = () => finish(null);
    audio.src = src;
    audio.load();
  });
}

function audioContextCtor() {
  return window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

export class ChestAudioEngine {
  private enabled = true;
  private resolved = new Map<ChestSoundCue, string | null>();
  private resolving = new Map<ChestSoundCue, Promise<string | null>>();
  private active = new Set<HTMLAudioElement>();
  private ctx: AudioContext | null = null;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      this.active.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      this.active.clear();
    }
  }

  dispose() {
    this.setEnabled(false);
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }

  play(cue: ChestSoundCue) {
    if (!this.enabled) return;
    void this.playResolved(cue);
  }

  private ensureContext() {
    const Ctor = audioContextCtor();
    if (!Ctor) return null;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  private builtin(cue: ChestSoundCue) {
    // Fallbacks volontairement légers : aucun bruit blanc / aucun "aspirateur".
    if (cue === "reveal" || cue === "click") return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + 0.01;
    const notes = cue === "approach"
      ? [{ f: 520, d: .12, g: .012 }, { f: 780, d: .16, g: .009 }]
      : cue === "rumble"
        ? [{ f: 72, d: .55, g: .014 }, { f: 108, d: .42, g: .009 }]
        : [{ f: 105, d: .28, g: .014 }, { f: 392, d: .34, g: .008 }, { f: 587, d: .42, g: .006 }];

    notes.forEach((note, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + index * .055;
      osc.type = cue === "rumble" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(note.f, start);
      if (cue === "open" && index === 0) osc.frequency.exponentialRampToValueAtTime(72, start + note.d);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.linearRampToValueAtTime(note.g, start + .025);
      gain.gain.exponentialRampToValueAtTime(.0001, start + note.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + note.d + .03);
    });
  }

  private async resolve(cue: ChestSoundCue) {
    if (this.resolved.has(cue)) return this.resolved.get(cue) ?? null;
    const existing = this.resolving.get(cue);
    if (existing) return existing;
    const work = (async () => {
      for (const src of candidates(cue)) {
        const valid = await probeAudio(src);
        if (valid) {
          this.resolved.set(cue, valid);
          this.resolving.delete(cue);
          return valid;
        }
      }
      this.resolved.set(cue, null);
      this.resolving.delete(cue);
      return null;
    })();
    this.resolving.set(cue, work);
    return work;
  }

  private async playResolved(cue: ChestSoundCue) {
    const src = await this.resolve(cue);
    if (!this.enabled) return;
    if (!src) {
      this.builtin(cue);
      return;
    }
    const audio = new Audio(src);
    audio.preload = "auto";
    this.active.add(audio);
    const cleanup = () => this.active.delete(audio);
    audio.onended = cleanup;
    audio.onerror = cleanup;
    try {
      await audio.play();
    } catch {
      cleanup();
    }
  }
}

export function createChestAudioEngine() {
  return new ChestAudioEngine();
}
