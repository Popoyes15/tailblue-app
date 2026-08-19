/*
 * TailBlue - priorité audio de la Mine
 *
 * Le service audio général et le service audio de la Mine utilisent chacun
 * leurs propres HTMLAudioElement. Ce petit arbitre est chargé très tôt dans
 * l'application et garde la trace des lecteurs audio lancés.
 *
 * Quand la page Mine prend le focus :
 *   - l'ambiance générale (ambient/ambience) est mise en pause ;
 *   - les musiques spécifiques à la Mine restent autorisées.
 *
 * Quand on quitte la Mine :
 *   - l'ambiance générale reprend là où elle avait été stoppée,
 *     sauf si elle a été explicitement coupée entre-temps dans les paramètres.
 */

type TailBlueAudioWindow = Window & {
  __tailblueMineAudioFocusInstalled?: boolean;
  __tailblueMineAudioFocusActive?: boolean;
  __tailblueTrackedAudio?: Set<HTMLMediaElement>;
  __tailbluePausedByMine?: Set<HTMLMediaElement>;
  __tailblueDoNotResumeAfterMine?: Set<HTMLMediaElement>;
};

const tbWindow = window as TailBlueAudioWindow;

const tracked =
  tbWindow.__tailblueTrackedAudio ??
  (tbWindow.__tailblueTrackedAudio = new Set<HTMLMediaElement>());

const pausedByMine =
  tbWindow.__tailbluePausedByMine ??
  (tbWindow.__tailbluePausedByMine = new Set<HTMLMediaElement>());

const doNotResume =
  tbWindow.__tailblueDoNotResumeAfterMine ??
  (tbWindow.__tailblueDoNotResumeAfterMine = new Set<HTMLMediaElement>());

const mediaProto = HTMLMediaElement.prototype;

const nativePlay = mediaProto.play;
const nativePause = mediaProto.pause;

let internalPause = false;
let internalResume = false;

function normalizedSource(media: HTMLMediaElement) {
  const raw =
    media.currentSrc ||
    (media instanceof HTMLAudioElement ? media.src : "") ||
    "";

  try {
    return decodeURIComponent(raw).toLowerCase();
  } catch {
    return raw.toLowerCase();
  }
}

function isGeneralAmbient(media: HTMLMediaElement) {
  const src = normalizedSource(media);

  if (!src) return false;

  // Ne jamais confondre la musique Mine avec l'ambiance générale.
  if (
    src.includes("mine-exploration") ||
    src.includes("mine_exploration") ||
    src.includes("mine%20exploration") ||
    src.includes("/mine/") ||
    src.includes("combat") ||
    src.includes("battle")
  ) {
    return false;
  }

  return (
    src.includes("ambient.mp3") ||
    src.includes("ambience.mp3") ||
    src.includes("/audio/ambient") ||
    src.includes("/audio/ambience") ||
    /\bambient\b/.test(src) ||
    /\bambience\b/.test(src)
  );
}

function pauseForMine(media: HTMLMediaElement) {
  if (media.paused || media.ended) return;

  internalPause = true;
  try {
    nativePause.call(media);
    pausedByMine.add(media);
    doNotResume.delete(media);
  } finally {
    internalPause = false;
  }
}

function pauseGeneralAmbientTracks() {
  for (const media of tracked) {
    if (isGeneralAmbient(media)) pauseForMine(media);
  }

  document.querySelectorAll("audio").forEach((media) => {
    tracked.add(media);
    if (isGeneralAmbient(media)) pauseForMine(media);
  });
}

function resumeGeneralAmbientTracks() {
  for (const media of [...pausedByMine]) {
    pausedByMine.delete(media);

    if (doNotResume.has(media)) {
      doNotResume.delete(media);
      continue;
    }

    if (media.ended) continue;

    internalResume = true;
    try {
      void nativePlay.call(media).catch(() => undefined);
    } finally {
      internalResume = false;
    }
  }
}

if (!tbWindow.__tailblueMineAudioFocusInstalled) {
  tbWindow.__tailblueMineAudioFocusInstalled = true;

  mediaProto.play = function (...args: Parameters<HTMLMediaElement["play"]>) {
    tracked.add(this);

    if (
      tbWindow.__tailblueMineAudioFocusActive &&
      isGeneralAmbient(this)
    ) {
      pausedByMine.add(this);
      return Promise.resolve();
    }

    if (!internalResume) doNotResume.delete(this);

    return nativePlay.apply(this, args);
  };

  mediaProto.pause = function (...args: Parameters<HTMLMediaElement["pause"]>) {
    tracked.add(this);

    if (
      !internalPause &&
      tbWindow.__tailblueMineAudioFocusActive &&
      pausedByMine.has(this) &&
      isGeneralAmbient(this)
    ) {
      doNotResume.add(this);
    }

    return nativePause.apply(this, args);
  };
}

export function setMineAudioFocus(active: boolean) {
  tbWindow.__tailblueMineAudioFocusActive = active;

  if (active) {
    pauseGeneralAmbientTracks();
    requestAnimationFrame(() => pauseGeneralAmbientTracks());
    window.setTimeout(pauseGeneralAmbientTracks, 80);
    window.setTimeout(pauseGeneralAmbientTracks, 300);
    return;
  }

  resumeGeneralAmbientTracks();
}

export function isMineAudioFocusActive() {
  return Boolean(tbWindow.__tailblueMineAudioFocusActive);
}
