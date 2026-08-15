import type {
  NotificationLevelSetting,
  TailBlueSettings,
} from "../settings/tailblueSettings";

export const TAILBLUE_AUDIO_ASSETS = {
  ambience: "/audio/ambience.mp3",
  uiClick: "/audio/ui-click.mp3",
  notification: "/audio/notification.mp3",
  urgent: "/audio/urgent.mp3",
  combat: "/audio/combat.mp3",
} as const;

let currentSettings: TailBlueSettings | null = null;
let ambienceAudio: HTMLAudioElement | null = null;
let ambienceStarted = false;

const availability = new Map<
  string,
  Promise<boolean>
>();

function getAudioContext(): AudioContext | null {
  const Context =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;

  if (!Context) return null;

  const globalWindow = window as typeof window & {
    __tailblueAudioContext?: AudioContext;
  };

  if (!globalWindow.__tailblueAudioContext) {
    globalWindow.__tailblueAudioContext =
      new Context();
  }

  return globalWindow.__tailblueAudioContext;
}

async function assetExists(path: string) {
  const existing = availability.get(path);
  if (existing) return existing;

  const check = fetch(path, {
    method: "HEAD",
    cache: "no-store",
  })
    .then((response) => response.ok)
    .catch(() => false);

  availability.set(path, check);
  return check;
}

function effectiveVolume(
  channel: "music" | "effects",
) {
  if (!currentSettings) return 0;

  const channelVolume =
    channel === "music"
      ? currentSettings.musicVolume
      : currentSettings.effectsVolume;

  return Math.max(
    0,
    Math.min(
      1,
      currentSettings.masterVolume * channelVolume,
    ),
  );
}

async function playFile(
  path: string,
  volume: number,
): Promise<boolean> {
  if (!(await assetExists(path))) {
    return false;
  }

  const audio = new Audio(path);
  audio.volume = Math.max(0, Math.min(1, volume));

  try {
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

function synthTone(
  frequencies: number[],
  duration = 0.08,
  volume = 0.05,
) {
  const context = getAudioContext();
  if (!context) return;

  void context.resume();

  const now = context.currentTime;

  for (const [index, frequency] of frequencies.entries()) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume / frequencies.length),
      now + 0.01,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration,
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now + index * 0.018);
    oscillator.stop(
      now + duration + index * 0.018 + 0.02,
    );
  }
}

export function configureAudio(
  settings: TailBlueSettings,
) {
  currentSettings = settings;

  if (!settings.sound || !settings.ambientMusic) {
    stopAmbience();
  } else if (ambienceAudio) {
    ambienceAudio.volume =
      effectiveVolume("music");
  }
}

export async function playUiClick() {
  if (
    !currentSettings?.sound ||
    !currentSettings.uiSounds
  ) {
    return;
  }

  const volume = effectiveVolume("effects");

  const played = await playFile(
    TAILBLUE_AUDIO_ASSETS.uiClick,
    volume,
  );

  if (!played) {
    synthTone([630], 0.045, volume * 0.12);
  }
}

export async function playNotificationTone(
  level: NotificationLevelSetting,
) {
  if (
    !currentSettings?.sound ||
    !currentSettings.notificationSounds
  ) {
    return;
  }

  const volume = effectiveVolume("effects");

  const path =
    level === "urgent"
      ? TAILBLUE_AUDIO_ASSETS.urgent
      : TAILBLUE_AUDIO_ASSETS.notification;

  const played = await playFile(path, volume);

  if (!played) {
    if (level === "urgent") {
      synthTone([440, 330, 440], 0.16, volume * 0.17);
    } else if (level === "success") {
      synthTone([660, 880], 0.16, volume * 0.15);
    } else {
      synthTone([580, 760], 0.13, volume * 0.13);
    }
  }
}

export async function playCombatSound() {
  if (
    !currentSettings?.sound ||
    !currentSettings.combatSounds
  ) {
    return;
  }

  const volume = effectiveVolume("effects");

  const played = await playFile(
    TAILBLUE_AUDIO_ASSETS.combat,
    volume,
  );

  if (!played) {
    synthTone([210, 145], 0.11, volume * 0.13);
  }
}

export async function ensureAmbienceStarted() {
  if (
    !currentSettings?.sound ||
    !currentSettings.ambientMusic ||
    ambienceStarted
  ) {
    return false;
  }

  if (
    !(await assetExists(
      TAILBLUE_AUDIO_ASSETS.ambience,
    ))
  ) {
    return false;
  }

  if (!ambienceAudio) {
    ambienceAudio = new Audio(
      TAILBLUE_AUDIO_ASSETS.ambience,
    );
    ambienceAudio.loop = true;
  }

  ambienceAudio.volume = effectiveVolume("music");

  try {
    await ambienceAudio.play();
    ambienceStarted = true;
    return true;
  } catch {
    return false;
  }
}

export function stopAmbience() {
  ambienceAudio?.pause();

  if (ambienceAudio) {
    ambienceAudio.currentTime = 0;
  }

  ambienceStarted = false;
}

export async function testAudio(
  kind:
    | "ui"
    | "notification"
    | "urgent"
    | "combat"
    | "ambience",
) {
  if (!currentSettings?.sound) {
    return false;
  }

  switch (kind) {
    case "ui":
      await playUiClick();
      return true;

    case "notification":
      await playNotificationTone("standard");
      return true;

    case "urgent":
      await playNotificationTone("urgent");
      return true;

    case "combat":
      await playCombatSound();
      return true;

    case "ambience": {
      const started = await ensureAmbienceStarted();

      if (!started) {
        const volume = effectiveVolume("music");
        synthTone(
          [220, 330, 440],
          0.75,
          volume * 0.08,
        );
      }

      return true;
    }
  }
}
