import { MINE_AUDIO_ASSETS, type MineAudioAsset } from "./mineAudioManifest.generated";

export type MineMusicMode = "off" | "exploration" | "combat";
export type MineSfxName =
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
  | "defeat";

export type MineAudioSettings = {
  enabled: boolean;
  explorationMusicEnabled: boolean;
  combatMusicEnabled: boolean;
  explorationSfxEnabled: boolean;
  combatSfxEnabled: boolean;
  explorationMusicVolume: number;
  combatMusicVolume: number;
  explorationSfxVolume: number;
  combatSfxVolume: number;
};

const MINE_AUDIO_SETTINGS_KEY = "tailblue.mine.audio.settings.v1";

const DEFAULT_MINE_AUDIO_SETTINGS: MineAudioSettings = {
  enabled: true,
  explorationMusicEnabled: true,
  combatMusicEnabled: true,
  explorationSfxEnabled: true,
  combatSfxEnabled: true,
  explorationMusicVolume: 0.30,
  combatMusicVolume: 0.40,
  explorationSfxVolume: 0.60,
  combatSfxVolume: 0.60,
};

function clampAudioVolume(value: unknown, fallback: number) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
}

function loadMineAudioSettings(): MineAudioSettings {
  try {
    const raw = window.localStorage.getItem(MINE_AUDIO_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_MINE_AUDIO_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<MineAudioSettings>;

    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : true,
      explorationMusicEnabled:
        typeof parsed.explorationMusicEnabled === "boolean" ? parsed.explorationMusicEnabled : true,
      combatMusicEnabled:
        typeof parsed.combatMusicEnabled === "boolean" ? parsed.combatMusicEnabled : true,
      explorationSfxEnabled:
        typeof parsed.explorationSfxEnabled === "boolean" ? parsed.explorationSfxEnabled : true,
      combatSfxEnabled:
        typeof parsed.combatSfxEnabled === "boolean" ? parsed.combatSfxEnabled : true,
      explorationMusicVolume: clampAudioVolume(
        parsed.explorationMusicVolume,
        DEFAULT_MINE_AUDIO_SETTINGS.explorationMusicVolume,
      ),
      combatMusicVolume: clampAudioVolume(
        parsed.combatMusicVolume,
        DEFAULT_MINE_AUDIO_SETTINGS.combatMusicVolume,
      ),
      explorationSfxVolume: clampAudioVolume(
        parsed.explorationSfxVolume,
        DEFAULT_MINE_AUDIO_SETTINGS.explorationSfxVolume,
      ),
      combatSfxVolume: clampAudioVolume(
        parsed.combatSfxVolume,
        DEFAULT_MINE_AUDIO_SETTINGS.combatSfxVolume,
      ),
    };
  } catch {
    return { ...DEFAULT_MINE_AUDIO_SETTINGS };
  }
}

let mineAudioSettings = loadMineAudioSettings();

function isCombatSfx(name: MineSfxName) {
  return (
    name === "hit" ||
    name === "hurt" ||
    name === "pet" ||
    name === "victory" ||
    name === "defeat"
  );
}

function musicSettingEnabled(mode: Exclude<MineMusicMode, "off">) {
  return mode === "combat"
    ? mineAudioSettings.combatMusicEnabled
    : mineAudioSettings.explorationMusicEnabled;
}

function musicSettingVolume(mode: Exclude<MineMusicMode, "off">) {
  return mode === "combat"
    ? mineAudioSettings.combatMusicVolume
    : mineAudioSettings.explorationMusicVolume;
}

function sfxSettingEnabled(name: MineSfxName) {
  return isCombatSfx(name)
    ? mineAudioSettings.combatSfxEnabled
    : mineAudioSettings.explorationSfxEnabled;
}

function sfxSettingVolume(name: MineSfxName) {
  return isCombatSfx(name)
    ? mineAudioSettings.combatSfxVolume
    : mineAudioSettings.explorationSfxVolume;
}

const MUSIC_KEYWORDS: Record<Exclude<MineMusicMode, "off">, string[]> = {
  exploration: [
    "mine exploration",
    "exploration",
    "explore",
    "mine",
    "dungeon",
    "cave",
    "abime",
    "abyss",
    "ambient",
    "ambience",
    "bgm",
    "ost",
  ],
  combat: ["combat", "battle", "fight", "boss", "enemy", "theme", "bgm", "ost"],
};

const SFX_KEYWORDS: Record<MineSfxName, string[]> = {
  step: ["step", "footstep", "foot", "walk", "pas", "door", "porte"],
  mine: ["pickaxe", "pioche", "mining", "ore", "minerai", "mine hit"],
  search: ["search", "fouille", "inspect", "scan"],
  loot: ["loot", "chest", "coffre", "reward", "treasure", "pickup"],
  event: ["event", "spark", "anomaly", "magic effect"],
  rest: ["rest", "sleep", "camp", "repos"],
  potion: ["potion", "drink", "heal", "soin"],
  hit: ["enemy hit", "hit", "impact", "attack", "slash", "strike"],
  hurt: ["player hurt", "hurt", "damage", "ouch", "player hit"],
  pet: ["pet attack", "companion", "paw", "familiar"],
  victory: ["victory", "win", "success", "clear", "complete"],
  defeat: ["defeat", "lose", "death", "gameover", "fail"],
};

type MineAudioWindow = Window & {
  __tailblueMineMusicRegistry?: Set<HTMLAudioElement>;
};

const audioWindow = window as MineAudioWindow;
const musicRegistry =
  audioWindow.__tailblueMineMusicRegistry ??
  (audioWindow.__tailblueMineMusicRegistry = new Set<HTMLAudioElement>());

/* Coupe une éventuelle ancienne piste issue d'un HMR V5.7+. */
for (const oldTrack of [...musicRegistry]) {
  try {
    oldTrack.pause();
    oldTrack.currentTime = 0;
  } catch {}
  musicRegistry.delete(oldTrack);
}

let unlocked = false;
let pendingMusic: MineMusicMode = "off";
let currentMusicMode: MineMusicMode = "off";
let musicAudio: HTMLAudioElement | null = null;
let unlockInstalled = false;
let lastError = "";
let musicRequestId = 0;

function norm(value: string) {
  try {
    return decodeURIComponent(value)
      .toLowerCase()
      .replace(/[\\_\-]+/g, " ");
  } catch {
    return value.toLowerCase().replace(/[\\_\-]+/g, " ");
  }
}

function textFor(asset: MineAudioAsset) {
  return norm(`${asset.original} ${asset.url}`);
}

function isMineExploration(asset: MineAudioAsset) {
  return textFor(asset).includes("mine exploration");
}

function isMusicLike(asset: MineAudioAsset) {
  const value = textFor(asset);

  return (
    isMineExploration(asset) ||
    /\bambient\b|\bambience\b|\bbgm\b|\bost\b|\btheme\b|\bmusic\b|\bmusique\b/.test(value)
  );
}

function keywordScore(asset: MineAudioAsset, keywords: string[]) {
  const value = textFor(asset);
  let score = 0;

  for (const keyword of keywords) {
    const needle = norm(keyword);
    if (value.includes(needle)) score += 30 + needle.length;
  }

  return score;
}

function musicCandidates(mode: Exclude<MineMusicMode, "off">) {
  const assets = [...MINE_AUDIO_ASSETS];

  if (mode === "exploration") {
    const official = assets
      .filter(isMineExploration)
      .sort((a, b) => b.bytes - a.bytes);

    const rest = assets
      .filter((asset) => !isMineExploration(asset))
      .sort((a, b) => {
        const ambientPenaltyA =
          /\bambient\b|\bambience\b/.test(textFor(a)) ? 10000 : 0;
        const ambientPenaltyB =
          /\bambient\b|\bambience\b/.test(textFor(b)) ? 10000 : 0;

        return (
          keywordScore(b, MUSIC_KEYWORDS.exploration) -
            ambientPenaltyB -
          (keywordScore(a, MUSIC_KEYWORDS.exploration) -
            ambientPenaltyA)
        );
      });

    return [...official, ...rest];
  }

  return assets.sort(
    (a, b) =>
      keywordScore(b, MUSIC_KEYWORDS[mode]) -
      keywordScore(a, MUSIC_KEYWORDS[mode]),
  );
}

function sfxCandidates(name: MineSfxName) {
  /*
   * IMPORTANT :
   * On NE FAIT PLUS de fallback sur toute la bibliothèque audio.
   *
   * Avant V5.8, si aucun vrai "step"/"hit"/etc. n'était trouvé,
   * ambient.mp3 ou une autre musique pouvait devenir le SFX gagnant et jouer
   * entièrement sous mine-exploration.mp3.
   */
  return [...MINE_AUDIO_ASSETS]
    .map((asset) => ({
      asset,
      score: keywordScore(asset, SFX_KEYWORDS[name]),
    }))
    .filter(({ asset, score }) => score > 0 && !isMusicLike(asset))
    .sort((a, b) => b.score - a.score || a.asset.bytes - b.asset.bytes)
    .map(({ asset }) => asset);
}

function srcFor(asset: MineAudioAsset) {
  return new URL(asset.url, window.location.href).href;
}

function safeStop(audio?: HTMLAudioElement | null) {
  if (!audio) return;

  try {
    audio.pause();
  } catch {}

  try {
    audio.currentTime = 0;
  } catch {}
}

function stopAllMusic() {
  for (const audio of [...musicRegistry]) {
    safeStop(audio);
    musicRegistry.delete(audio);
  }

  safeStop(musicAudio);
  musicAudio = null;
}

export function getMineAudioSettings(): MineAudioSettings {
  return { ...mineAudioSettings };
}

export function setMineAudioSettings(
  patch: Partial<MineAudioSettings>,
): MineAudioSettings {
  mineAudioSettings = {
    ...mineAudioSettings,
    ...patch,
    explorationMusicVolume: clampAudioVolume(
      patch.explorationMusicVolume ?? mineAudioSettings.explorationMusicVolume,
      mineAudioSettings.explorationMusicVolume,
    ),
    combatMusicVolume: clampAudioVolume(
      patch.combatMusicVolume ?? mineAudioSettings.combatMusicVolume,
      mineAudioSettings.combatMusicVolume,
    ),
    explorationSfxVolume: clampAudioVolume(
      patch.explorationSfxVolume ?? mineAudioSettings.explorationSfxVolume,
      mineAudioSettings.explorationSfxVolume,
    ),
    combatSfxVolume: clampAudioVolume(
      patch.combatSfxVolume ?? mineAudioSettings.combatSfxVolume,
      mineAudioSettings.combatSfxVolume,
    ),
  };

  try {
    window.localStorage.setItem(
      MINE_AUDIO_SETTINGS_KEY,
      JSON.stringify(mineAudioSettings),
    );
  } catch {}

  if (
    !mineAudioSettings.enabled ||
    (currentMusicMode !== "off" && !musicSettingEnabled(currentMusicMode))
  ) {
    stopAllMusic();
    currentMusicMode = "off";
  } else if (musicAudio && currentMusicMode !== "off") {
    musicAudio.volume = musicSettingVolume(currentMusicMode);
  }

  if (
    mineAudioSettings.enabled &&
    pendingMusic !== "off" &&
    musicSettingEnabled(pendingMusic) &&
    currentMusicMode === "off"
  ) {
    void setMineMusic(pendingMusic);
  }

  return getMineAudioSettings();
}

export function resetMineAudioSettings(): MineAudioSettings {
  mineAudioSettings = { ...DEFAULT_MINE_AUDIO_SETTINGS };
  try {
    window.localStorage.setItem(
      MINE_AUDIO_SETTINGS_KEY,
      JSON.stringify(mineAudioSettings),
    );
  } catch {}

  if (musicAudio && currentMusicMode !== "off") {
    musicAudio.volume = musicSettingVolume(currentMusicMode);
  }

  if (pendingMusic !== "off") void setMineMusic(pendingMusic);
  return getMineAudioSettings();
}

async function tryPlay(
  asset: MineAudioAsset,
  volume: number,
  loop = false,
) {
  const audio = new Audio(srcFor(asset));
  audio.preload = "auto";
  audio.volume = volume;
  audio.loop = loop;
  await audio.play();
  return audio;
}

async function firstPlayable(
  candidates: MineAudioAsset[],
  volume: number,
  loop = false,
) {
  let errorText = "";

  for (const asset of candidates) {
    try {
      return {
        audio: await tryPlay(asset, volume, loop),
        asset,
      };
    } catch (error) {
      errorText = error instanceof Error ? error.message : String(error);
    }
  }

  lastError = errorText || "Aucun fichier audio lisible.";
  return null;
}

export async function unlockMineAudio() {
  if (unlocked) return true;

  if (!MINE_AUDIO_ASSETS.length) {
    lastError = "0 fichier audio détecté dans le build.";
    console.error("[TailBlue Mine Audio]", lastError);
    return false;
  }

  const probeAsset =
    MINE_AUDIO_ASSETS.find((asset) => !isMusicLike(asset)) ??
    MINE_AUDIO_ASSETS[0];

  try {
    const probe = await tryPlay(probeAsset, 0.001, false);
    safeStop(probe);
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.error("[TailBlue Mine Audio] Déverrouillage refusé.", lastError);
    return false;
  }

  unlocked = true;

  if (pendingMusic !== "off") {
    const requestId = ++musicRequestId;
    void actuallySetMusic(pendingMusic, requestId);
  }

  return true;
}

export function installMineAudioUnlock() {
  if (unlockInstalled) return () => undefined;

  unlockInstalled = true;

  const handler = () => {
    void unlockMineAudio();
  };

  window.addEventListener("pointerdown", handler, true);
  window.addEventListener("click", handler, true);
  window.addEventListener("keydown", handler, true);

  return () => {
    window.removeEventListener("pointerdown", handler, true);
    window.removeEventListener("click", handler, true);
    window.removeEventListener("keydown", handler, true);
    unlockInstalled = false;
  };
}

async function actuallySetMusic(
  mode: Exclude<MineMusicMode, "off">,
  requestId: number,
) {
  if (!unlocked) return;

  if (!mineAudioSettings.enabled || !musicSettingEnabled(mode)) {
    stopAllMusic();
    currentMusicMode = "off";
    return;
  }

  stopAllMusic();

  const candidates = musicCandidates(mode);

  for (const asset of candidates) {
    if (requestId !== musicRequestId || pendingMusic !== mode) return;

    let audio: HTMLAudioElement | null = null;

    try {
      audio = new Audio(srcFor(asset));
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = musicSettingVolume(mode);

      musicRegistry.add(audio);
      await audio.play();

      if (requestId !== musicRequestId || pendingMusic !== mode) {
        safeStop(audio);
        musicRegistry.delete(audio);
        return;
      }

      for (const other of [...musicRegistry]) {
        if (other !== audio) {
          safeStop(other);
          musicRegistry.delete(other);
        }
      }

      musicAudio = audio;
      currentMusicMode = mode;
      lastError = "";

      console.info(
        `[TailBlue Mine Audio] Musique ${mode}: ${asset.original}`,
      );
      return;
    } catch (error) {
      safeStop(audio);
      if (audio) musicRegistry.delete(audio);
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  currentMusicMode = "off";
}

export async function setMineMusic(mode: MineMusicMode) {
  pendingMusic = mode;
  const requestId = ++musicRequestId;

  if (mode === "off") {
    stopAllMusic();
    currentMusicMode = "off";
    return;
  }

  if (!unlocked) return;

  await actuallySetMusic(mode, requestId);
}

export async function playMineSfx(name: MineSfxName) {
  if (!mineAudioSettings.enabled || !sfxSettingEnabled(name)) return false;
  if (!unlocked && !(await unlockMineAudio())) return false;

  const candidates = sfxCandidates(name);

  /*
   * Pas de vrai bruitage correspondant = silence.
   * Surtout PAS une musique de secours.
   */
  if (!candidates.length) {
    console.debug(
      `[TailBlue Mine Audio] Aucun vrai SFX trouvé pour "${name}" — silence.`,
    );
    return false;
  }

  const baseVolume = sfxSettingVolume(name);
  const result = await firstPlayable(
    candidates,
    name === "victory" || name === "defeat"
      ? Math.min(1, baseVolume * 1.12)
      : baseVolume,
    false,
  );

  if (!result) return false;

  console.debug(
    `[TailBlue Mine Audio] SFX ${name}: ${result.asset.original}`,
  );

  return true;
}

export async function playMineAudioTest() {
  if (!unlocked && !(await unlockMineAudio())) {
    return `❌ Audio bloqué : ${lastError || "lecture refusée"}`;
  }

  const exploration = musicCandidates("exploration")[0];

  if (!exploration) {
    return "❌ Aucune musique d'exploration détectée";
  }

  let test: HTMLAudioElement | null = null;

  try {
    test = await tryPlay(exploration, 0.55, false);

    window.setTimeout(() => safeStop(test), 1800);

    return `✅ SON OK · ${exploration.original}`;
  } catch (error) {
    safeStop(test);
    return `❌ ${error instanceof Error ? error.message : String(error)}`;
  }
}

export function getMineAudioDebugInfo() {
  return {
    version: "5.9-user-audio-mixer",
    settings: getMineAudioSettings(),
    unlocked,
    pendingMusic,
    currentMusicMode,
    activeMusicTracks: musicRegistry.size,
    preferredExploration:
      musicCandidates("exploration")[0]?.original ?? null,
    sfx: Object.fromEntries(
      (Object.keys(SFX_KEYWORDS) as MineSfxName[]).map((name) => [
        name,
        sfxCandidates(name)[0]?.original ?? null,
      ]),
    ),
    assets: [...MINE_AUDIO_ASSETS],
    lastError,
  };
}
