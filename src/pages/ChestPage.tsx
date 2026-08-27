// TAILBLUE_CHESTS_DESKTOP_V4_MINIGAMES_20260822
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  chestApi,
  getCachedChestSnapshot,
} from "../api/chestApi"; // TAILBLUE_POLISH_PACK_V3_20260826
import type {
  ChestMysteryEventDto,
  ChestBonusCardEventDto,
  ChestBonusCardRevealDto,
  ChestBonusScratchClaimDto,
  ChestBonusScratchEventDto,
  ChestMysteryResolveDto,
  ChestOpenResultDto,
  ChestOmenDto,
  ChestSnapshotDto,
} from "../types/chest";
import { createChestAudioEngine } from "./chestAudio";
import "./ChestPage.css";

type ChestVisualPhase =
  | "idle"
  | "awakening"
  | "rumble"
  | "protected"
  | "opening"
  | "opened"
  | "mimic"
  | "reward";

type ExperienceStage =
  | "idle"
  | "key"
  | "server"
  | "omen"
  | "protection"
  | "mystery-memory"
  | "mystery-input"
  | "mystery-result"
  | "opening-ready"
  | "opening"
  | "bonus-cards"
  | "bonus-scratch"
  | "reward-sealed"
  | "reward-flash"
  | "reward-revealed"
  | "mimic-empty"
  | "mimic-eyes"
  | "mimic-story";

const AUDIO_STORAGE_KEY = "tailblue.chests.audioEnabled";
const JOURNAL_STORAGE_KEY = "tailblue.chests.journalEntries";
const KEY_HOLD_MS = 680;

const FALLBACK_OMEN: ChestOmenDto = {
  tier: "common",
  intensity: 0.3,
  line: "Une faible lueur bleue s'échappe du sceau.",
};

function cleanDiscordText(value: string | null | undefined) {
  return String(value ?? "")
    .replace(/\\n/g, "\n")
    .replace(/^\s*>\s?/gm, "")
    .replace(/<a?:[A-Za-z0-9_]+:\d+>/g, "")
    .replace(/[*_~`]+/g, "")
    .replace(/\|\|/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CH").format(value);
}

function rarityClass(rarity?: string | null) {
  const value = String(rarity ?? "").toLocaleLowerCase("fr");
  if (value.includes("royal")) return "royal";
  if (value.includes("mythique")) return "mythic";
  if (value.includes("légendaire") || value.includes("legendaire")) return "legendary";
  if (value.includes("épique") || value.includes("epique")) return "epic";
  if (value.includes("rare")) return "rare";
  if (value.includes("peu commun")) return "uncommon";
  return "common";
}

function ChestKeyIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 100" aria-hidden="true">
      <defs>
        <linearGradient id="tb4-key-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset="0.35" stopColor="#ffd66e" />
          <stop offset="0.72" stopColor="#c28b2b" />
          <stop offset="1" stopColor="#6f4613" />
        </linearGradient>
        <filter id="tb4-key-shadow" x="-30%" y="-50%" width="170%" height="210%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#000814" floodOpacity="0.62" />
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#82c9ff" floodOpacity="0.22" />
        </filter>
      </defs>
      <g filter="url(#tb4-key-shadow)">
        <circle cx="45" cy="50" r="29" fill="#14233c" stroke="url(#tb4-key-gold)" strokeWidth="11" />
        <circle cx="45" cy="50" r="13" fill="#07101f" stroke="#ffe9a6" strokeWidth="3" opacity="0.95" />
        <path d="M70 50 H178" fill="none" stroke="url(#tb4-key-gold)" strokeWidth="14" strokeLinecap="round" />
        <path d="M118 50 V73 H136 V58 H153 V78 H169 V64 H187" fill="none" stroke="url(#tb4-key-gold)" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M74 45 H171" fill="none" stroke="#fff4c7" strokeWidth="2.5" strokeLinecap="round" opacity="0.72" />
        <path d="M24 35 C35 23 56 22 68 37" fill="none" stroke="#fff7d5" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
        <circle cx="194" cy="50" r="6" fill="#fff0ae" />
      </g>
    </svg>
  );
}

function ChestModel({
  phase,
  hime,
  interactive = false,
  keyMode = false,
}: {
  phase: ChestVisualPhase;
  hime: boolean;
  interactive?: boolean;
  keyMode?: boolean;
}) {
  const opened =
    phase === "opening" ||
    phase === "opened" ||
    phase === "mimic" ||
    phase === "reward";

  return (
    <div
      className={`tb4-chest-stage is-${phase} ${hime ? "is-hime" : ""} ${interactive ? "is-interactive" : ""} ${keyMode ? "is-key-scene" : ""}`}
      data-chest-stage={interactive ? "interactive" : undefined}
    >
      <div className="tb4-scene-aura" aria-hidden="true"><i /><i /><i /></div>
      <svg className="tb4-chest-svg" viewBox="0 0 760 560" role="img" aria-label="Coffre TailBlue">
        <defs>
          <linearGradient id="tb4-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={hime ? "#5367e8" : "#345fcd"} />
            <stop offset="0.48" stopColor={hime ? "#2d398f" : "#193b8d"} />
            <stop offset="1" stopColor="#0b153f" />
          </linearGradient>
          <linearGradient id="tb4-lid" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor={hime ? "#7182ff" : "#4d7ee6"} />
            <stop offset="0.55" stopColor={hime ? "#3345ad" : "#244da9"} />
            <stop offset="1" stopColor="#101b55" />
          </linearGradient>
          <linearGradient id="tb4-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff0a8" />
            <stop offset="0.32" stopColor="#f2c75e" />
            <stop offset="0.7" stopColor="#9b681e" />
            <stop offset="1" stopColor="#e0b24b" />
          </linearGradient>
          <radialGradient id="tb4-void" cx="50%" cy="45%" r="72%">
            <stop offset="0" stopColor="#11182d" />
            <stop offset="0.55" stopColor="#050814" />
            <stop offset="1" stopColor="#000208" />
          </radialGradient>
          <radialGradient id="tb4-magic" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={hime ? "#ddccff" : "#b5e6ff"} stopOpacity="0.65" />
            <stop offset="0.35" stopColor={hime ? "#796cff" : "#4dafff"} stopOpacity="0.24" />
            <stop offset="1" stopColor="#0c1c4e" stopOpacity="0" />
          </radialGradient>
          <filter id="tb4-soft-shadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="20" stdDeviation="14" floodColor="#00030c" floodOpacity="0.6" />
          </filter>
          <filter id="tb4-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="10" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g className="tb4-chest-core" filter="url(#tb4-soft-shadow)">
          <ellipse className="tb4-ground-glow" cx="380" cy="495" rx="245" ry="42" fill="url(#tb4-magic)" />
          <ellipse cx="380" cy="496" rx="205" ry="27" fill="#02050d" opacity="0.64" />

          <g className="tb4-body">
            <rect x="125" y="285" width="510" height="205" rx="34" fill="url(#tb4-body)" stroke="url(#tb4-gold)" strokeWidth="6" />
            <path d="M131 332 H629" stroke="#6c8cf2" strokeWidth="3" opacity="0.26" />
            <path d="M130 420 H630" stroke="url(#tb4-gold)" strokeWidth="20" />
            <rect x="183" y="294" width="28" height="184" rx="13" fill="url(#tb4-gold)" />
            <rect x="549" y="294" width="28" height="184" rx="13" fill="url(#tb4-gold)" />
            <path d="M197 302 V468" stroke="#fff1ad" strokeWidth="3" opacity="0.45" />
            <path d="M563 302 V468" stroke="#fff1ad" strokeWidth="3" opacity="0.45" />

            <g className="tb4-cavity">
              <ellipse className="tb4-cavity-light" cx="380" cy="348" rx="168" ry="40" fill="url(#tb4-magic)" />
              <path d="M195 350 Q380 334 565 350" fill="none" stroke="#071122" strokeWidth="8" strokeLinecap="round" opacity="0.2" />
            </g>

            <g
              className={`tb4-lock ${keyMode ? "is-key-target" : ""}`}
              data-chest-lock={keyMode ? "true" : undefined}
            >
              <rect x="323" y="337" width="114" height="132" rx="27" fill="#52462d" stroke="url(#tb4-gold)" strokeWidth="6" />
              <rect x="332" y="348" width="96" height="112" rx="22" fill={hime ? "#463d68" : "#2c3f5e"} opacity="0.88" />
              {keyMode ? (
                <g className="tb4-keyhole">
                  <circle cx="380" cy="392" r="17" fill="#02060e" stroke="#f9d978" strokeWidth="4" />
                  <path d="M369 401 L363 438 H397 L391 401 Z" fill="#02060e" stroke="#f9d978" strokeWidth="4" strokeLinejoin="round" />
                </g>
              ) : (
                <text x="380" y="414" textAnchor="middle" fill="#ffeca4" fontSize="47" fontWeight="800">{hime ? "♛" : "✦"}</text>
              )}
            </g>
          </g>

          <g className={`tb4-lid ${opened ? "is-open" : ""}`}>
            <path d="M139 295 V226 C139 160 197 116 259 110 H501 C563 116 621 160 621 226 V295 Z" fill="url(#tb4-lid)" stroke="url(#tb4-gold)" strokeWidth="6" />
            <path d="M153 260 H607" stroke="url(#tb4-gold)" strokeWidth="22" />
            <path d="M194 142 Q380 82 566 142" fill="none" stroke="#a9c4ff" strokeWidth="5" opacity="0.18" />
            <path d="M194 142 Q380 103 566 142" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.16" />
            <rect x="187" y="143" width="27" height="144" rx="13" fill="url(#tb4-gold)" />
            <rect x="546" y="143" width="27" height="144" rx="13" fill="url(#tb4-gold)" />
            <path d="M201 153 V276" stroke="#fff0aa" strokeWidth="3" opacity="0.5" />
            <path d="M560 153 V276" stroke="#fff0aa" strokeWidth="3" opacity="0.5" />
            <path d="M139 295 H621" stroke="#3a2a0f" strokeWidth="8" opacity="0.42" />
          </g>
        </g>
      </svg>

      <div className="tb4-particles" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => <i key={index} />)}
      </div>
    </div>
  );
}


function BonusCardDraft({
  event,
  onReveal,
  onComplete,
}: {
  event: ChestBonusCardEventDto;
  onReveal: (cardId: string) => Promise<ChestBonusCardRevealDto>;
  onComplete: () => void;
}) {
  const [revealed, setRevealed] = useState<Record<string, ChestBonusCardRevealDto>>({});
  const [busyCard, setBusyCard] = useState<string | null>(null);
  const revealedCount = Object.keys(revealed).length;
  const complete = revealedCount >= event.picks;

  async function choose(cardId: string) {
    if (busyCard || complete || revealed[cardId]) return;
    setBusyCard(cardId);
    try {
      const result = await onReveal(cardId);
      setRevealed((current) => ({ ...current, [cardId]: result }));
    } finally {
      setBusyCard(null);
    }
  }

  return (
    <section className="tb4-card-game">
      <p className="tb-chests-kicker">CHOIX BONUS</p>
      <h2>Cinq cartes. Tu peux en garder trois.</h2>
      <p>{cleanDiscordText(event.hint)}</p>
      <div className="tb4-card-row">
        {event.cards.map((card, index) => {
          const result = revealed[card.cardId];
          const rarity = result?.reward.rarity ?? "hidden";
          return (
            <button
              type="button"
              key={card.cardId}
              className={`tb4-loot-card rarity-${rarity} ${result ? "is-revealed" : ""} ${busyCard === card.cardId ? "is-shaking" : ""}`}
              disabled={Boolean(busyCard) || complete || Boolean(result)}
              onClick={() => void choose(card.cardId)}
            >
              <span className="tb4-loot-card-inner">
                <span className="tb4-loot-card-back">
                  <i>✦</i>
                  <b>{index + 1}</b>
                  <small>CHOISIS-MOI</small>
                </span>
                <span className="tb4-loot-card-front">
                  <i>{result?.reward.rarity === "legendary" ? "★" : result?.reward.rarity === "rare" ? "◆" : "✦"}</i>
                  <strong>{result?.reward.display ?? "Mystère"}</strong>
                  <small>{result ? `×${result.reward.amount}` : ""}</small>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="tb4-card-counter">{Math.min(revealedCount, event.picks)} / {event.picks} cartes révélées</div>
      {complete ? (
        <button type="button" className="tb-v2-primary" onClick={onComplete}>Revenir au coffre</button>
      ) : (
        <span className="tb-v2-next">Clique sur une carte · sa couleur apparaît au retournement</span>
      )}
    </section>
  );
}

function ScratchBonusGame({
  event,
  onClaim,
  onComplete,
}: {
  event: ChestBonusScratchEventDto;
  onClaim: () => Promise<ChestBonusScratchClaimDto>;
  onComplete: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scratchedRef = useRef(new Set<string>());
  const claimingRef = useRef(false);
  const [result, setResult] = useState<ChestBonusScratchClaimDto | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = 520;
    const height = 220;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#6f8db0");
    gradient.addColorStop(.5, "#b9c7d6");
    gradient.addColorStop(1, "#526d8d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.font = "800 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("GRATTE LE SCEAU", width / 2, height / 2 + 6);
  }, []);

  async function scratch(eventPointer: ReactPointerEvent<HTMLCanvasElement>) {
    if (result || eventPointer.buttons === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((eventPointer.clientX - rect.left) / rect.width) * 520;
    const y = ((eventPointer.clientY - rect.top) / rect.height) * 220;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const gx = Math.max(0, Math.min(12, Math.floor(x / 40)));
    const gy = Math.max(0, Math.min(5, Math.floor(y / 40)));
    scratchedRef.current.add(`${gx}:${gy}`);
    const next = Math.min(1, scratchedRef.current.size / 42);
    setProgress(next);
    if (next >= .48 && !claimingRef.current) {
      claimingRef.current = true;
      try {
        const claimed = await onClaim();
        setResult(claimed);
      } finally {
        claimingRef.current = false;
      }
    }
  }

  return (
    <section className="tb4-scratch-game">
      <p className="tb-chests-kicker">SCEAU À GRATTER</p>
      <h2>{result ? "Quelque chose brillait sous le métal…" : cleanDiscordText(event.intro)}</h2>
      <div className={`tb4-scratch-ticket ${result ? `rarity-${result.reward.rarity}` : ""}`}>
        <div className="tb4-scratch-prize">
          <i>{result?.reward.rarity === "legendary" ? "★" : "✦"}</i>
          <strong>{result?.reward.display ?? "???"}</strong>
          <small>{result ? `×${result.reward.amount}` : "Un petit bonus se cache dessous"}</small>
        </div>
        {!result ? (
          <canvas
            ref={canvasRef}
            className="tb4-scratch-canvas"
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); void scratch(e); }}
            onPointerMove={(e) => void scratch(e)}
          />
        ) : null}
      </div>
      {!result ? <span className="tb-v2-next">Gratté à {Math.round(progress * 100)} %</span> : null}
      {result ? <button type="button" className="tb-v2-primary" onClick={onComplete}>Revenir au coffre</button> : null}
    </section>
  );
}

function BonusCard({
  icon,
  title,
  detail,
}: {
  icon: string;
  title: string;
  detail: string;
}) {
  return (
    <article className="tb-chest-bonus">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function OmenScene({ omen, hime }: { omen: ChestOmenDto; hime: boolean }) {
  return (
    <div
      className={`tb4-omen omen-${omen.tier} ${hime ? "is-hime" : ""}`}
      style={{ "--tb4-omen": Math.max(0, Math.min(1, omen.intensity)) } as CSSProperties}
    >
      <ChestModel phase="awakening" hime={hime} />
      <div className="tb4-omen-halo" aria-hidden="true"><i /><i /></div>
    </div>
  );
}

function OpenChestScene({ hime }: { hime: boolean }) {
  const [lifting, setLifting] = useState(false);

  useEffect(() => {
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => setLifting(true));
    });
    return () => {
      window.cancelAnimationFrame(outer);
      if (inner) window.cancelAnimationFrame(inner);
    };
  }, []);

  return (
    <div className="tb4-opening-shot">
      <ChestModel phase={lifting ? "opening" : "rumble"} hime={hime} />
      <div className={`tb4-opening-rays ${lifting ? "is-live" : ""}`} aria-hidden="true" />
    </div>
  );
}

function RewardFlashScene({ hime }: { hime: boolean }) {
  return (
    <div className="tb4-reward-flash-scene">
      <ChestModel phase="reward" hime={hime} />
      <div className="tb4-reward-flash-burst" aria-hidden="true">
        <i /><i /><i />
      </div>
    </div>
  );
}

function MimicInspectionScene({ hime, eyes }: { hime: boolean; eyes: boolean }) {
  return (
    <div className={`tb4-mimic-inspection ${eyes ? "has-eyes" : ""}`}>
      <div className="tb4-camera-frame">
        <ChestModel phase="opened" hime={hime} />
        <div className="tb4-mimic-depth" aria-hidden="true">
          <i className="tb4-eye left" />
          <i className="tb4-eye right" />
        </div>
      </div>
    </div>
  );
}

export default function ChestPage() {
  const audioRef = useRef(createChestAudioEngine());
  const hoverPlayedRef = useRef(false);
  const keyHoldTimerRef = useRef<number | null>(null);
  const freeKeyRef = useRef<HTMLDivElement | null>(null);
  const lastKeyReadyRef = useRef(false);

  const targetProximityRef = useRef(0);
  const targetLeanRef = useRef(0);
  const proximityValueRef = useRef(0);
  const leanValueRef = useRef(0);
  const interactiveStageRef = useRef<HTMLElement | null>(null);
  const interactiveVaultRef = useRef<HTMLElement | null>(null);
  const pointerInsideVaultRef = useRef(false);
  const keyModeRef = useRef(false);

  const [snapshot, setSnapshot] =
    useState<ChestSnapshotDto | null>(() => getCachedChestSnapshot());
  const [loading, setLoading] =
    useState(() => getCachedChestSnapshot() === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [stage, setStage] = useState<ExperienceStage>("idle");
  const [sceneOpen, setSceneOpen] = useState(false);
  const [outcome, setOutcome] = useState<ChestOpenResultDto | null>(null);
  const [protectionIndex, setProtectionIndex] = useState(0);
  const [mimicIndex, setMimicIndex] = useState(0);

  const [keyReady, setKeyReady] = useState(false);
  const [keyHolding, setKeyHolding] = useState(false);

  const [mystery, setMystery] = useState<ChestMysteryEventDto | null>(null);
  const [mysterySelection, setMysterySelection] = useState<string[]>([]);
  const [mysteryResult, setMysteryResult] = useState<ChestMysteryResolveDto | null>(null);
  const [mysteryBusy, setMysteryBusy] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
    return raw == null ? true : raw === "1";
  });
  const [journalEntries, setJournalEntries] = useState<Array<{ id: string; title: string; detail: string }>>(() => {
    try {
      const raw = window.localStorage.getItem(JOURNAL_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, 6) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    audioRef.current.setEnabled(soundEnabled);
    window.localStorage.setItem(AUDIO_STORAGE_KEY, soundEnabled ? "1" : "0");
  }, [soundEnabled]);

  useEffect(() => {
    window.localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journalEntries.slice(0, 6)));
  }, [journalEntries]);

  useEffect(() => {
    if (stage === "opening-ready") {
      audioRef.current.play("rumble");
    }
  }, [stage]);

  useEffect(() => () => {
    audioRef.current.dispose();
    if (keyHoldTimerRef.current != null) {
      window.clearTimeout(keyHoldTimerRef.current);
    }
  }, []);

  useEffect(() => {
    let frame = 0;
    let alive = true;

    const animate = (time: number) => {
      if (!alive) return;

      const currentProximity = proximityValueRef.current;
      const targetProximity = targetProximityRef.current;
      const currentLean = leanValueRef.current;
      const targetLean = targetLeanRef.current;

      const proximityEase = targetProximity > currentProximity ? 0.105 : 0.028;
      const leanEase = Math.abs(targetLean) > Math.abs(currentLean) ? 0.09 : 0.035;

      let nextProximity = currentProximity + (targetProximity - currentProximity) * proximityEase;
      let nextLean = currentLean + (targetLean - currentLean) * leanEase;

      if (Math.abs(targetProximity - nextProximity) < 0.0005) nextProximity = targetProximity;
      if (Math.abs(targetLean - nextLean) < 0.0005) nextLean = targetLean;

      proximityValueRef.current = nextProximity;
      leanValueRef.current = nextLean;

      const chestStage = interactiveStageRef.current;
      if (chestStage) {
        const living = Math.max(0, (nextProximity - 0.26) / 0.74);
        const wobble = Math.sin(time / 115) * living * 1.9 + Math.sin(time / 61) * living * 0.55;
        chestStage.style.setProperty("--tb-chest-proximity", nextProximity.toFixed(4));
        chestStage.style.setProperty("--tb-chest-lean", nextLean.toFixed(4));
        chestStage.style.setProperty("--tb-chest-wobble", wobble.toFixed(4));
      }

      const vault = interactiveVaultRef.current;
      if (vault) {
        if (pointerInsideVaultRef.current && !keyModeRef.current && nextProximity >= 0.22) {
          keyModeRef.current = true;
          vault.classList.add("is-key-mode");
        } else if (keyModeRef.current && (!pointerInsideVaultRef.current || nextProximity <= 0.12)) {
          keyModeRef.current = false;
          vault.classList.remove("is-key-mode");
        }
      }

      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      interactiveVaultRef.current?.classList.remove("is-key-mode");
    };
  }, []);


  const appendJournalEntry = useCallback((title: string, detail: string) => {
    const cleanTitle = cleanDiscordText(title);
    const cleanDetail = cleanDiscordText(detail);
    if (!cleanTitle) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: cleanTitle,
      detail: cleanDetail,
    };
    setJournalEntries((current) => [entry, ...current].slice(0, 6));
  }, []);

  const placeFreeKey = useCallback((x: number, y: number) => {
    if (!freeKeyRef.current) return;
    freeKeyRef.current.style.setProperty("--tb4-key-x", `${x}px`);
    freeKeyRef.current.style.setProperty("--tb4-key-y", `${y}px`);
  }, []);

  const resetFreeKeyPosition = useCallback(() => {
    const stageElement = document.querySelector<HTMLElement>(".tb4-key-stage");
    if (!stageElement) return;
    placeFreeKey(stageElement.clientWidth * 0.22, stageElement.clientHeight * 0.72);
  }, [placeFreeKey]);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await chestApi.snapshot();
      setSnapshot(next);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de charger les coffres TailBlue.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const bonuses = useMemo(() => {
    if (!snapshot) return [];
    const items: Array<{ icon: string; title: string; detail: string }> = [];

    if (snapshot.bonuses.costReduced) {
      items.push({
        icon: "🐦‍⬛",
        title: "Corbeau Voleur",
        detail: `Prix négocié à ${snapshot.cost} cookies`,
      });
    }
    if (snapshot.bonuses.cookieBonusPercent > 0) {
      items.push({
        icon: "🦊",
        title: "Renard Mystique",
        detail: `+${snapshot.bonuses.cookieBonusPercent}% sur les gains en cookies`,
      });
    }
    if (snapshot.bonuses.refundChancePercent > 0) {
      items.push({
        icon: "🦝",
        title: "Raton Voleur",
        detail: `${snapshot.bonuses.refundChancePercent}% de chance de récupérer le coût`,
      });
    }
    if (snapshot.bonuses.mimicProtectionPercent > 0) {
      items.push({
        icon: "👻",
        title: "Mimic apprivoisé",
        detail: `${snapshot.bonuses.mimicProtectionPercent}% de protection contre un coffre maudit`,
      });
    }
    return items;
  }, [snapshot]);

  const isHime = snapshot?.isHime === true;
  const omen = outcome?.presentation?.omen ?? FALLBACK_OMEN;

  function handleVaultMouseMove(event: ReactMouseEvent<HTMLElement>) {
    const vault = event.currentTarget;
    const chestStage = vault.querySelector<HTMLElement>('[data-chest-stage="interactive"]');

    interactiveVaultRef.current = vault;
    interactiveStageRef.current = chestStage;
    pointerInsideVaultRef.current = true;

    if (!chestStage || !snapshot?.canOpen || busy) {
      targetProximityRef.current = 0;
      targetLeanRef.current = 0;
      hoverPlayedRef.current = false;
      return;
    }

    const chest = chestStage.querySelector<HTMLElement>(".tb4-chest-core");
    const rect = (chest ?? chestStage).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    const nearestX = Math.max(rect.left, Math.min(event.clientX, rect.right));
    const nearestY = Math.max(rect.top, Math.min(event.clientY, rect.bottom));
    const edgeDistance = Math.hypot(event.clientX - nearestX, event.clientY - nearestY);

    const magicRadius = 245;
    const raw = Math.max(0, Math.min(1, 1 - edgeDistance / magicRadius));
    const nextProximity = Math.pow(raw, 0.82);
    const horizontal = Math.max(
      -1,
      Math.min(1, (event.clientX - centerX) / (rect.width * 0.72)),
    );

    targetProximityRef.current = nextProximity;
    targetLeanRef.current = horizontal * nextProximity;

    if (nextProximity >= 0.44 && !hoverPlayedRef.current) {
      audioRef.current.play("approach");
      hoverPlayedRef.current = true;
    } else if (nextProximity < 0.18) {
      hoverPlayedRef.current = false;
    }
  }

  function clearChestProximity() {
    pointerInsideVaultRef.current = false;
    targetProximityRef.current = 0;
    targetLeanRef.current = 0;
    hoverPlayedRef.current = false;
    interactiveVaultRef.current?.classList.remove("is-key-mode");
    keyModeRef.current = false;
  }

  function openKeyRitual() {
    if (!snapshot?.canOpen || busy) return;
    setConfirmOpen(false);
    setError(null);
    setStage("key");
    setSceneOpen(true);
    setKeyReady(false);
    lastKeyReadyRef.current = false;
    setKeyHolding(false);
    window.requestAnimationFrame(resetFreeKeyPosition);
  }

  function handleKeyMove(event: ReactPointerEvent<HTMLDivElement>) {
    const stageRect = event.currentTarget.getBoundingClientRect();
    const lock = event.currentTarget.querySelector<SVGGraphicsElement>('[data-chest-lock="true"]');
    const lockRect = lock?.getBoundingClientRect();
    const pointerX = event.clientX - stageRect.left;
    const pointerY = event.clientY - stageRect.top;

    // Aucun aimant : la clé suit EXACTEMENT la souris.
    placeFreeKey(pointerX, pointerY);

    if (!lockRect) {
      if (lastKeyReadyRef.current) {
        lastKeyReadyRef.current = false;
        setKeyReady(false);
      }
      return;
    }

    const lockClientX = lockRect.left + lockRect.width / 2;
    const lockClientY = lockRect.top + lockRect.height * 0.52;
    const distance = Math.hypot(event.clientX - lockClientX, event.clientY - lockClientY);
    const ready = distance <= Math.max(58, Math.min(78, lockRect.width * 0.62));

    if (ready !== lastKeyReadyRef.current) {
      lastKeyReadyRef.current = ready;
      setKeyReady(ready);
      if (ready) audioRef.current.play("approach");
    }
  }

  function cancelKeyHold() {
    if (keyHoldTimerRef.current != null) {
      window.clearTimeout(keyHoldTimerRef.current);
      keyHoldTimerRef.current = null;
    }
    setKeyHolding(false);
  }

  function beginKeyHold() {
    if (!keyReady || keyHolding || busy) return;
    setKeyHolding(true);
    audioRef.current.play("click");
    keyHoldTimerRef.current = window.setTimeout(() => {
      keyHoldTimerRef.current = null;
      setKeyHolding(false);
      void requestChestOutcome();
    }, KEY_HOLD_MS);
  }

  async function requestChestOutcome() {
    setBusy(true);
    setStage("server");
    try {
      const result = await chestApi.open();
      setOutcome(result);
      setSnapshot(result.snapshot);
      setMystery(result.mysteryEvent ?? null);
      setProtectionIndex(0);
      setMimicIndex(0);
      setMysterySelection([]);
      setMysteryResult(null);
      setStage("omen");
      audioRef.current.play("rumble");
    } catch (cause) {
      setSceneOpen(false);
      setStage("idle");
      setError(cause instanceof Error ? cause.message : "L'ouverture du coffre a échoué.");
      void refresh();
    } finally {
      setBusy(false);
    }
  }

  function afterOmen() {
    if (!outcome) return;
    if (outcome.mimicProtected && outcome.protectionLines.length > 0) {
      setProtectionIndex(0);
      setStage("protection");
      return;
    }
    if (mystery) {
      setStage("mystery-memory");
      return;
    }
    setStage("opening-ready");
  }

  function advanceProtection() {
    if (!outcome) return;
    const next = protectionIndex + 1;
    if (next < outcome.protectionLines.length) {
      setProtectionIndex(next);
      return;
    }
    setStage("opening-ready");
  }

  async function resolveMystery() {
    if (!mystery || !outcome || mysterySelection.length !== mystery.sequence.length || mysteryBusy) return;
    setMysteryBusy(true);
    try {
      const result = await chestApi.resolveMystery(mystery.eventId, mysterySelection);
      setMysteryResult(result);
      setSnapshot(result.snapshot);
      setStage("mystery-result");
      if (result.success && result.bonusCookies > 0) {
        appendJournalEntry("Bonus de sceau", `+${formatNumber(result.bonusCookies)} cookies`);
      }
      audioRef.current.play(result.success ? "reveal" : "rumble");
    } catch (cause) {
      setMysteryResult({
        success: false,
        bonusCookies: 0,
        message: cause instanceof Error ? cause.message : "Le sceau s'est dissipé.",
        snapshot: snapshot ?? outcome.snapshot,
      });
      setStage("mystery-result");
    } finally {
      setMysteryBusy(false);
    }
  }

  function stageAfterOpening() {
    if (outcome?.kind === "mimic") {
      setStage("mimic-empty");
      return;
    }
    const bonus = outcome?.bonusEvent;
    if (bonus?.kind === "card_draft") {
      setStage("bonus-cards");
      return;
    }
    if (bonus?.kind === "scratch") {
      setStage("bonus-scratch");
      return;
    }
    setStage("reward-sealed");
  }

  async function revealBonusCard(eventId: string, cardId: string) {
    const result = await chestApi.revealBonusCard(eventId, cardId);
    setSnapshot(result.snapshot);
    appendJournalEntry(result.reward.display, `Bonus carte · ×${result.reward.amount}`);
    return result;
  }

  async function claimScratchBonus(eventId: string) {
    const result = await chestApi.claimScratchBonus(eventId);
    setSnapshot(result.snapshot);
    appendJournalEntry(result.reward.display, `Bonus grattage · ×${result.reward.amount}`);
    return result;
  }

  function startOpeningAnimation() {
    setStage("opening");
    audioRef.current.play("open");
    window.setTimeout(stageAfterOpening, 1250);
  }

  function revealReward() {
    if (!outcome?.reward) return;
    setStage("reward-flash");
    appendJournalEntry(outcome.reward.display, outcome.reward.rarity ?? "Récompense obtenue");
    window.setTimeout(() => {
      setStage("reward-revealed");
      // Le son de fin choisi par l'utilisateur joue exactement au BAM du résultat.
      audioRef.current.play("reveal");
    }, 820);
  }

  function revealMimicEyes() {
    setStage("mimic-eyes");
    audioRef.current.play("rumble");
  }

  function revealMimicStory() {
    setMimicIndex(0);
    setStage("mimic-story");
    audioRef.current.play("reveal");
  }

  function advanceMimicStory() {
    if (!outcome?.mimic) return;
    const lines = outcome.mimic.lines.map(cleanDiscordText).filter(Boolean);
    if (mimicIndex + 1 < lines.length) {
      setMimicIndex((current) => current + 1);
    }
  }

  function closeExperience() {
    setSceneOpen(false);
    setStage("idle");
    setOutcome(null);
    setMystery(null);
    setMysteryResult(null);
    setMysterySelection([]);
    setMimicIndex(0);
    setProtectionIndex(0);
    void refresh();
  }

  if (loading && !snapshot) {
    return (
      <section className="tb-chests-page is-loading">
        <div className="tb-chests-loader">
          <span>✦</span>
          <p>La réserve royale prépare les coffres…</p>
        </div>
      </section>
    );
  }

  const mimicLines = outcome?.mimic?.lines.map(cleanDiscordText).filter(Boolean) ?? [];
  const currentMimicLine = mimicLines[mimicIndex] ?? "Le coffre était un Mimic.";
  const currentProtectionLine = cleanDiscordText(outcome?.protectionLines[protectionIndex]);

  return (
    <section className={`tb-chests-page ${isHime ? "is-hime" : ""}`}>
      <header className="tb-chests-header">
        <div>
          <p className="tb-chests-kicker">AVENTURE · TRÉSORERIE DU ROYAUME</p>
          <h1>{isHime ? "Coffres Royaux" : "Coffres"}</h1>
          <p>
            {isHime
              ? "La Couronne n'a jamais vraiment eu le sens de la modération."
              : "Chaque coffre garde son secret jusqu'au dernier instant."}
          </p>
        </div>

        <div className="tb-chests-total">
          <small>OUVERTURES</small>
          <strong>{formatNumber(snapshot?.totalOpened ?? 0)}</strong>
          <span>depuis le début</span>
        </div>
      </header>

      {error && (
        <div className="tb-chests-error">
          <span>⚠️</span>
          <p>{error}</p>
          <button type="button" onClick={() => void refresh()}>
            Réessayer
          </button>
        </div>
      )}

      <div className="tb-chests-grid">
        <aside className="tb-chests-status-card">
          <p className="tb-chests-kicker">{isHime ? "PRIVILÈGE ROYAL" : "RÉSERVE DU JOUR"}</p>

          {isHime ? (
            <div className="tb-chests-royal-status">
              <span>♛</span>
              <strong>Accès illimité</strong>
              <p>Les frais sont entièrement pris en charge par le Royaume.</p>
            </div>
          ) : (
            <>
              <div className="tb-chests-counter">
                <strong>{snapshot?.remainingToday ?? 0}</strong>
                <span>/ 3</span>
              </div>
              <p className="tb-chests-counter-label">
                coffre{snapshot?.remainingToday === 1 ? "" : "s"} encore disponible
                {snapshot?.remainingToday === 1 ? "" : "s"} aujourd'hui
              </p>
              <div className="tb-chests-dots" aria-label="Coffres restants">
                {Array.from({ length: 3 }, (_, index) => (
                  <i
                    key={index}
                    className={index < (snapshot?.remainingToday ?? 0) ? "available" : "used"}
                  />
                ))}
              </div>
            </>
          )}

          <div className="tb-chests-side-stack">
            <div className="tb-chests-wallet">
              <span>🍪</span>
              <div>
                <small>TES COOKIES</small>
                <strong>{formatNumber(snapshot?.cookies ?? 0)}</strong>
              </div>
            </div>

            <div className="tb-chests-journal-card">
              <div className="tb-chests-journal-head">
                <small>JOURNAL</small>
                <span>{journalEntries.length ? `${journalEntries.length} note${journalEntries.length > 1 ? "s" : ""}` : "vide"}</span>
              </div>
              <div className="tb-chests-journal-list">
                {journalEntries.length ? (
                  journalEntries.map((entry) => (
                    <article key={entry.id} className="tb-chests-journal-entry">
                      <strong>{entry.title}</strong>
                      <small>{entry.detail}</small>
                    </article>
                  ))
                ) : (
                  <p className="tb-chests-journal-empty">Tes dernières récompenses apparaîtront ici.</p>
                )}
              </div>
            </div>
          </div>

          <div className="tb-chests-cost">
            <span>Coût d'ouverture</span>
            <strong>{isHime ? "Gratuit" : `${snapshot?.cost ?? 50} 🍪`}</strong>
          </div>
        </aside>

        <main
          className="tb-chests-vault"
          onMouseMove={handleVaultMouseMove}
          onMouseLeave={clearChestProximity}
        >
          <div className="tb-vault-ceiling">
            <span />
            <b>✦</b>
            <span />
          </div>

          <div className="tb-vault-copy">
            <p className="tb-chests-kicker">{isHime ? "COFFRE DE LA COURONNE" : "UN COFFRE T'ATTEND"}</p>
            <h2>
              {snapshot?.canOpen
                ? "Approche la clé. Le coffre réagira avant même de s'ouvrir."
                : "Le coffre reste fermé pour l'instant."}
            </h2>
          </div>

          <button
            type="button"
            className="tb-chest-trigger"
            disabled={!snapshot?.canOpen || busy}
            onClick={() => setConfirmOpen(true)}
          >
            <ChestModel phase="idle" hime={isHime} interactive />
            <span className="tb-chest-trigger-legend">
              {snapshot?.canOpen
                ? "Approche-toi du coffre · clique pour préparer la clé"
                : snapshot?.blockedReason ?? "Le coffre refuse encore de s'ouvrir."}
            </span>
          </button>

          <p className="tb-chests-mystery">✦ Les présages ne disent jamais tout.</p>

          {snapshot?.blockedReason && (
            <div className="tb-chests-blocked">
              {snapshot.ko ? "😵" : "🔒"} {snapshot.blockedReason}
            </div>
          )}
        </main>

        <aside className="tb-chests-bonuses-card">
          <p className="tb-chests-kicker">COMPAGNONS</p>
          <h3>Influences actives</h3>
          <p className="tb-chests-side-copy">
            Certains compagnons peuvent modifier discrètement une ouverture.
          </p>

          <div className="tb-chests-bonus-list">
            {bonuses.length ? (
              bonuses.map((bonus) => (
                <BonusCard key={bonus.title} icon={bonus.icon} title={bonus.title} detail={bonus.detail} />
              ))
            ) : (
              <div className="tb-chests-no-bonus">
                <span>🐾</span>
                <strong>Aucun effet actif</strong>
                <p>Le coffre ne bénéficiera d'aucune aide particulière.</p>
              </div>
            )}
          </div>

          <div className="tb-chests-warning">
            <span>?</span>
            <p>Le Royaume décide du loot. L'application ne fait que donner vie à l'ouverture.</p>
          </div>
        </aside>
      </div>

      {confirmOpen && snapshot && (
        <div className="tb-chest-modal-layer" role="presentation">
          <section className={`tb-chest-confirm ${isHime ? "is-hime" : ""}`} role="dialog" aria-modal="true">
            <div className="tb-chest-confirm-icon">{isHime ? "♛" : "🎁"}</div>
            <p className="tb-chests-kicker">{isHime ? "COFFRE ROYAL" : "CONFIRMATION"}</p>
            <h2>{isHime ? "La Couronne veut-elle vraiment tenter sa chance ?" : "Souhaites-tu ouvrir ce coffre ?"}</h2>
            <p>
              {isHime
                ? "Aucun coût. Aucune limite. Mais le coffre n'a aucune obligation d'être gentil."
                : `${snapshot.cost} cookies seront engagés si l'ouverture se déroule normalement.`}
            </p>
            <div className="tb-chest-confirm-actions">
              <button type="button" className="secondary" onClick={() => setConfirmOpen(false)}>
                ✕ Le laisser fermé
              </button>
              <button type="button" className="primary" onClick={openKeyRitual}>
                🔑 Prendre la clé
              </button>
            </div>
          </section>
        </div>
      )}

      {sceneOpen && (
        <div className={`tb-v2-experience stage-${stage} ${outcome?.isHime || isHime ? "is-hime" : ""}`} role="dialog" aria-modal="true">
          <div className="tb-cinematic-noise" />
          <div className="tb-cinematic-vignette" />

          {stage === "key" && (
            <div className={`tb4-key-ritual ${keyReady ? "is-ready" : ""} ${keyHolding ? "is-holding" : ""}`}>
              <div className="tb4-key-copy">
                <p className="tb-chests-kicker">LE SCEAU ATTEND</p>
                <h2>Place la clé impériale dans la serrure.</h2>
                <span>{keyReady ? "La serrure t'attire · maintiens pour tourner la clé." : "Approche la pointe de la clé du véritable trou de serrure."}</span>
              </div>

              <div
                className="tb4-key-stage"
                onPointerMove={handleKeyMove}
                onPointerDown={beginKeyHold}
                onPointerUp={cancelKeyHold}
                onPointerCancel={cancelKeyHold}
                onPointerLeave={cancelKeyHold}
              >
                <ChestModel phase="awakening" hime={isHime} keyMode />
                <div
                  ref={freeKeyRef}
                  className="tb4-free-key"
                  aria-hidden="true"
                >
                  <ChestKeyIcon className="tb4-free-key-svg" />
                </div>
                <div className="tb4-key-help" aria-hidden="true">{keyReady ? "MAINTIENS" : ""}</div>
              </div>
            </div>
          )}

          {stage === "server" && (
            <section className="tb-v2-centered-copy">
              <ChestModel phase="rumble" hime={isHime} />
              <p className="tb-chests-kicker">LA SERRURE TOURNE</p>
              <h2>Le Royaume décide ce qui t'attend derrière le couvercle…</h2>
            </section>
          )}

          {stage === "omen" && outcome && (
            <section className="tb-v2-centered-copy tb-v2-clickable" onClick={afterOmen}>
              <p className="tb-chests-kicker">PRÉSAGE</p>
              <OmenScene omen={omen} hime={outcome.isHime} />
              <h2>{cleanDiscordText(omen.line)}</h2>
              <span className="tb-v2-next">Clique pour continuer</span>
            </section>
          )}

          {stage === "protection" && outcome && (
            <section className="tb-v2-centered-copy tb-v2-clickable" onClick={advanceProtection}>
              <ChestModel phase="protected" hime={outcome.isHime} />
              <p className="tb-chests-kicker">QUELQUE CHOSE INTERVIENT</p>
              <h2>{currentProtectionLine}</h2>
              <span className="tb-v2-next">Clique pour continuer</span>
            </section>
          )}

          {stage === "mystery-memory" && mystery && (
            <section className="tb-v2-mystery-panel">
              <p className="tb-chests-kicker">???</p>
              <h2>{cleanDiscordText(mystery.intro)}</h2>
              <p>{cleanDiscordText(mystery.hint)}</p>
              <div className="tb-v2-rune-sequence">
                {mystery.sequence.map((rune, index) => (
                  <span key={`${rune}-${index}`}>{rune}</span>
                ))}
              </div>
              <button type="button" className="tb-v2-primary" onClick={() => setStage("mystery-input")}>
                J'ai mémorisé les runes
              </button>
              <small>Ce sceau est un bonus. Ton loot normal ne peut pas être perdu.</small>
            </section>
          )}

          {stage === "mystery-input" && mystery && (
            <section className="tb-v2-mystery-panel">
              <p className="tb-chests-kicker">SCEAU INCONNU</p>
              <h2>Reproduis l'ordre.</h2>
              <div className="tb-v2-rune-answer">
                {Array.from({ length: mystery.sequence.length }, (_, index) => (
                  <span key={index}>{mysterySelection[index] ?? "·"}</span>
                ))}
              </div>
              <div className="tb-v2-rune-options">
                {mystery.options.map((rune) => (
                  <button
                    type="button"
                    key={rune}
                    disabled={mysterySelection.length >= mystery.sequence.length}
                    onClick={() => setMysterySelection((current) => [...current, rune])}
                  >
                    {rune}
                  </button>
                ))}
              </div>
              <div className="tb-v2-mystery-actions">
                <button type="button" onClick={() => setMysterySelection([])} disabled={!mysterySelection.length || mysteryBusy}>
                  Recommencer
                </button>
                <button
                  type="button"
                  className="tb-v2-primary"
                  disabled={mysterySelection.length !== mystery.sequence.length || mysteryBusy}
                  onClick={() => void resolveMystery()}
                >
                  {mysteryBusy ? "Les runes répondent…" : "Valider le sceau"}
                </button>
              </div>
            </section>
          )}

          {stage === "mystery-result" && mysteryResult && (
            <section className={`tb-v2-mystery-panel result-${mysteryResult.success ? "success" : "miss"}`}>
              <div className="tb-v2-mystery-result-icon">{mysteryResult.success ? "✦" : "◇"}</div>
              <p className="tb-chests-kicker">{mysteryResult.success ? "LE SCEAU CÈDE" : "LES RUNES S'ÉTEIGNENT"}</p>
              <h2>{cleanDiscordText(mysteryResult.message)}</h2>
              <button type="button" className="tb-v2-primary" onClick={() => setStage("opening-ready")}>
                Revenir au coffre
              </button>
            </section>
          )}

          {stage === "opening-ready" && outcome && (
            <section className="tb-v2-centered-copy tb-v2-clickable" onClick={startOpeningAnimation}>
              <p className="tb-chests-kicker">LE MOMENT EST VENU</p>
              <ChestModel phase="rumble" hime={outcome.isHime} />
              <h2>Le couvercle est prêt à céder.</h2>
              <span className="tb-v2-next">Clique sur le coffre pour l'ouvrir</span>
            </section>
          )}

          {stage === "opening" && outcome && (
            <section className="tb-v2-centered-copy">
              <p className="tb-chests-kicker">OUVERTURE</p>
              <OpenChestScene hime={outcome.isHime} />
              <h2>La lumière remonte lentement depuis le fond du coffre…</h2>
            </section>
          )}

          {stage === "bonus-cards" && outcome?.bonusEvent?.kind === "card_draft" && (
            <BonusCardDraft
              event={outcome.bonusEvent}
              onReveal={(cardId) => revealBonusCard(outcome.bonusEvent!.eventId, cardId)}
              onComplete={() => setStage("reward-sealed")}
            />
          )}

          {stage === "bonus-scratch" && outcome?.bonusEvent?.kind === "scratch" && (
            <ScratchBonusGame
              event={outcome.bonusEvent}
              onClaim={() => claimScratchBonus(outcome.bonusEvent!.eventId)}
              onComplete={() => setStage("reward-sealed")}
            />
          )}

          {stage === "reward-sealed" && outcome?.reward && (
            <section className="tb-v2-reward-stage">
              <p className="tb-chests-kicker">QUELQUE CHOSE ÉMERGE</p>
              <h2>La récompense reste encore scellée.</h2>
              <button
                type="button"
                className={`tb-v2-loot-seal form-${outcome.presentation?.revealForm ?? "orb"} omen-${omen.tier}`}
                onClick={revealReward}
              >
                <span>✦</span>
                <i />
                <b>?</b>
              </button>
              <span className="tb-v2-next">Clique sur le sceau pour révéler le contenu</span>
            </section>
          )}

          {stage === "reward-flash" && outcome?.reward && (
            <section className="tb-v2-reward-stage tb-v2-reward-flash-panel">
              <p className="tb-chests-kicker">RÉVÉLATION</p>
              <RewardFlashScene hime={outcome.isHime} />
              <h2>Une dernière étincelle traverse le coffre avant la révélation…</h2>
            </section>
          )}

          {stage === "reward-revealed" && outcome?.reward && (
            <section className={`tb-v2-reward-reveal rarity-${rarityClass(outcome.reward.rarity)}`}>
              {outcome.reward.gif ? (
                <div className="tb-v2-reward-gif"><img src={outcome.reward.gif} alt="Révélation du coffre" /></div>
              ) : null}
              <p className="tb-chests-kicker">{outcome.reward.rarity ?? "RÉCOMPENSE"}</p>
              <h2>{cleanDiscordText(outcome.reward.display)}</h2>
              {outcome.reward.type === "item" && (
                <div className="tb-v2-reward-details">
                  {outcome.reward.value != null ? <span>💰 Valeur · {outcome.reward.value} cookies</span> : null}
                  {outcome.reward.description ? <p>{cleanDiscordText(outcome.reward.description)}</p> : null}
                </div>
              )}
              {outcome.bonusLines.map((line) => <span className="tb-v2-bonus-line" key={line}>{cleanDiscordText(line)}</span>)}
              {outcome.companionLevelUps.map((levelup) => (
                <span className="tb-v2-bonus-line" key={`${levelup.petId}-${levelup.level}`}>
                  🎉 {cleanDiscordText(levelup.name)} passe niveau {levelup.level} · {cleanDiscordText(levelup.title)}
                </span>
              ))}
              {outcome.royalFlavor ? <p className="tb-v2-royal-flavor">{cleanDiscordText(outcome.royalFlavor)}</p> : null}
              <button type="button" className="tb-v2-primary" onClick={closeExperience}>Revenir à la réserve</button>
            </section>
          )}

          {(stage === "mimic-empty" || stage === "mimic-eyes") && outcome?.mimic && (
            <section
              className={`tb-v3-mimic-inspection tb-v2-clickable ${stage === "mimic-eyes" ? "is-looking-in" : ""}`}
              onClick={stage === "mimic-empty" ? revealMimicEyes : revealMimicStory}
            >
              <p className="tb-chests-kicker">{stage === "mimic-eyes" ? "…" : "UN SILENCE ÉTRANGE"}</p>
              <MimicInspectionScene hime={outcome.isHime} eyes={stage === "mimic-eyes"} />
              <h2>
                {stage === "mimic-eyes"
                  ? "Deux lueurs s'allument très loin sous le rebord."
                  : "Rien ne remonte du coffre."}
              </h2>
              <span className="tb-v2-next">
                {stage === "mimic-eyes" ? "Clique pour reculer" : "Clique pour regarder à l'intérieur"}
              </span>
            </section>
          )}

          {stage === "mimic-story" && outcome?.mimic && (
            <section className="tb-v2-mimic-story">
              {outcome.mimic.gif ? <div className="tb-v2-mimic-gif"><img src={outcome.mimic.gif} alt="Mimic" /></div> : null}
              <p className="tb-chests-kicker">⚠ COFFRE MAUDIT</p>
              <h2>{currentMimicLine}</h2>
              {mimicIndex + 1 < mimicLines.length ? (
                <button type="button" className="tb-v2-primary" onClick={advanceMimicStory}>Continuer</button>
              ) : (
                <>
                  <div className="tb-v2-mimic-consequence">
                    {outcome.isHime ? (
                      <>
                        <span>👑 Compteur royal : {outcome.mimic.swallowedCount ?? "?"} fois avalée</span>
                        {outcome.mimic.compensationCookies > 0 ? <span>🍪 +{outcome.mimic.compensationCookies} cookies de compensation</span> : null}
                      </>
                    ) : (
                      <span>😵 KO pendant {outcome.mimic.koMinutes} minutes</span>
                    )}
                  </div>
                  <button type="button" className="tb-v2-primary" onClick={closeExperience}>Revenir à la réserve</button>
                </>
              )}
            </section>
          )}
        </div>
      )}

      <button
        type="button"
        className={`tb-chest-sound-toggle ${soundEnabled ? "is-on" : "is-off"}`}
        onClick={() => setSoundEnabled((current) => !current)}
      >
        <span>{soundEnabled ? "🔊" : "🔇"}</span>
        <strong>{soundEnabled ? "Son des coffres" : "Son des coffres coupé"}</strong>
      </button>
    </section>
  );
}
