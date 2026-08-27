// TAILBLUE_GUILD_AUDIO_V1_20260826
export type GuildAudioSettings = {
  musicEnabled: boolean;
  pageTurnsEnabled: boolean;
};

const STORAGE_KEY = "tailblue.guild.audio.settings.v1";
const MUSIC_URL = "/audio/mine-exploration.mp3";
const PAGE_URL = "/audio/bestiaire-page.mp3";

let settings: GuildAudioSettings = (() => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { musicEnabled: true, pageTurnsEnabled: true };
    const parsed = JSON.parse(raw) as Partial<GuildAudioSettings>;
    return {
      musicEnabled:
        typeof parsed.musicEnabled === "boolean" ? parsed.musicEnabled : true,
      pageTurnsEnabled:
        typeof parsed.pageTurnsEnabled === "boolean"
          ? parsed.pageTurnsEnabled
          : true,
    };
  } catch {
    return { musicEnabled: true, pageTurnsEnabled: true };
  }
})();

let guildActive = false;
let musicAudio: HTMLAudioElement | null = null;
let pageAudio: HTMLAudioElement | null = null;
let unlockInstalled = false;

function persist() {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

function stopMusic() {
  if (!musicAudio) return;
  try { musicAudio.pause(); } catch {}
  try { musicAudio.currentTime = 0; } catch {}
  musicAudio = null;
}

async function startMusic() {
  if (!guildActive || !settings.musicEnabled) {
    stopMusic();
    return;
  }

  if (!musicAudio) {
    musicAudio = new Audio(MUSIC_URL);
    musicAudio.preload = "auto";
    musicAudio.loop = true;
    musicAudio.volume = 0.28;
  }

  try {
    if (musicAudio.paused) await musicAudio.play();
  } catch {
    // Autoplay refusé : le prochain geste utilisateur réessaiera.
  }
}

export function getGuildAudioSettings(): GuildAudioSettings {
  return { ...settings };
}

export function setGuildAudioSettings(
  patch: Partial<GuildAudioSettings>,
): GuildAudioSettings {
  settings = { ...settings, ...patch };
  persist();

  if (!settings.musicEnabled) stopMusic();
  else if (guildActive) void startMusic();

  return getGuildAudioSettings();
}

export function setGuildAudioActive(active: boolean): void {
  guildActive = active;
  if (!active) stopMusic();
  else void startMusic();
}

export function installGuildAudioUnlock(): () => void {
  if (unlockInstalled) return () => undefined;
  unlockInstalled = true;

  const unlock = () => {
    if (guildActive && settings.musicEnabled) void startMusic();
  };

  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("click", unlock, true);
  window.addEventListener("keydown", unlock, true);

  return () => {
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("click", unlock, true);
    window.removeEventListener("keydown", unlock, true);
    unlockInstalled = false;
  };
}

export function playGuildPageTurn(): void {
  if (!settings.pageTurnsEnabled) return;

  try {
    if (!pageAudio) {
      pageAudio = new Audio(PAGE_URL);
      pageAudio.preload = "auto";
      pageAudio.volume = 0.42;
    }

    pageAudio.pause();
    pageAudio.currentTime = 0;
    const promise = pageAudio.play();
    if (promise) void promise.catch(() => {});
  } catch {}
}
