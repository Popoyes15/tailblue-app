import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
  type CSSProperties,
} from "react";
import { resolveMonsterImage } from "../../data/monsterVisuals";
import { cleanMineText } from "../../data/mineText";
import { playMineSfx } from "../../services/mineAudioService";
import MinePetPortrait from "./MinePetPortrait";
import type { CombatEvent, CombatSkill, MineCombat } from "../../types/mine";
import "./mineUltra.css";

// TAILBLUE_HOTFIX_V4_20260821
// TAILBLUE_HOTFIX_V41_20260821
// TAILBLUE_HOTFIX_V42_FINISH_FX_20260821

type Props = {
  combat?: MineCombat | null;
  busy?: boolean;
  resolutionMode?: boolean;
  onResolutionComplete?: () => void;
  onSequenceComplete?: (combat: MineCombat) => void;
  onAttack: () => void | Promise<void>;
  onSkill: (skillId: string) => void | Promise<void>;
  onItem: (itemId: string) => void | Promise<void>;
  onDefend: () => void | Promise<void>;
  onFlee: () => void | Promise<void>;
};

type Target = "none" | "player" | "enemy" | "companion";
type PlayerSignature = "frieren" | "therian" | "generic";
type FxKind = "impact" | "laser" | "slash" | "heal" | "guard" | "pet" | "potion";

type FxState = {
  id: number;
  kind: FxKind;
  target: Target;
  signature?: PlayerSignature;
  left?: number;
  top?: number;
};

type PlayerAura = {
  kind: "heal" | "guard";
  signature: PlayerSignature;
};

function normal(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function Bar({ value, max, kind }: { value: number; max: number; kind: "hp" | "energy" }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return <div className={`tm-combat-bar ${kind}`}><i style={{ width: `${pct}%` }} /></div>;
}

function Portrait({
  image,
  fallback,
  defeated,
}: {
  image?: string | null;
  fallback: string;
  defeated?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);

  return (
    <div className={`tm-fighter-portrait ${defeated ? "tm-defeated-vanish" : ""}`}>
      {image && !failed ? (
        <img src={image} alt="" draggable={false} onError={() => setFailed(true)} />
      ) : (
        <span>{fallback}</span>
      )}
    </div>
  );
}

function eventIcon(event: CombatEvent) {
  if (event.critical) return "💥";
  if (event.visualTarget === "enemy") return "⚔️";
  if (event.visualTarget === "player") return "💢";
  if (event.visualTarget === "companion") return "🐾";
  if (event.type.includes("heal")) return "💚";
  if (event.type.includes("status")) return "✨";
  return "•";
}

function BattleFeed({ events }: { events: CombatEvent[] }) {
  const recent = events.slice(-4);
  if (recent.length === 0) {
    return <div className="tm-battle-feed empty">⚔️ Le combat commence…</div>;
  }

  return (
    <div className="tm-battle-feed">
      {recent.map((event, index) => (
        <div key={`${event.type}-${event.text}-${index}`} className={event.critical ? "critical" : ""}>
          <span>{eventIcon(event)}</span>
          <p>{cleanMineText(event.text)}</p>
          {event.amount > 0 && <b>{event.amount}</b>}
        </div>
      ))}
    </div>
  );
}

function Resolution({ combat, onComplete }: { combat: MineCombat; onComplete?: () => void }) {
  const outcome = combat.outcome;
  const victory = outcome === "player_victory";
  const defeat = outcome === "player_defeat";
  const fled = outcome === "fled";

  useEffect(() => {
    const timer = window.setTimeout(() => onComplete?.(), victory ? 2600 : 2200);
    return () => window.clearTimeout(timer);
  }, [onComplete, victory]);

  return (
    <div className={`tm-combat-resolution ${victory ? "victory" : defeat ? "defeat" : fled ? "fled" : ""}`}>
      <span className="tm-resolution-rune">{victory ? "✦" : defeat ? "✕" : "➜"}</span>
      <p>{victory ? "COMBAT TERMINÉ" : defeat ? "EXPÉDITION BRISÉE" : "REPLI RÉUSSI"}</p>
      <h2>{victory ? "VICTOIRE" : defeat ? "DÉFAITE" : "FUITE"}</h2>
      <strong>{victory ? `${cleanMineText(combat.enemy.name)} est vaincu.` : defeat ? "Tu t'effondres dans l'Abîme." : "Tu échappes au combat."}</strong>
      {combat.rewards && victory && (
        <div className="tm-resolution-rewards">
          {combat.rewards.xp > 0 && <span>✨ +{combat.rewards.xp} XP</span>}
          {combat.rewards.combatXp > 0 && <span>⚔️ +{combat.rewards.combatXp} XP combat</span>}
          {combat.rewards.cookies > 0 && <span>🍪 +{combat.rewards.cookies}</span>}
        </div>
      )}
      <small>La Mine reprend dans un instant…</small>
    </div>
  );
}

function targetFromEvent(event: CombatEvent, combat: MineCombat): Target {
  if (event.targetId) {
    if (event.targetId === combat.enemy.id) return "enemy";
    if (event.targetId === combat.player.id) return "player";
    if (combat.companion && event.targetId === combat.companion.id) return "companion";
  }
  if (event.visualTarget === "enemy" || event.visualTarget === "player" || event.visualTarget === "companion") {
    return event.visualTarget;
  }
  return "none";
}

function playerSignature(combat?: MineCombat | null): PlayerSignature {
  if (!combat) return "generic";
  const race = normal(combat.player.race);
  const blob = [
    race,
    normal(combat.player.family),
    normal(combat.player.name),
    ...combat.skills.map((skill) => `${normal(skill.name)} ${normal(skill.description)} ${normal(skill.element)}`),
  ].join(" ");

  if (blob.includes("frieren") || blob.includes("zoltraak") || blob.includes("zoltaak")) return "frieren";
  if (blob.includes("therian") || blob.includes("griff") || blob.includes("claw")) return "therian";
  return "generic";
}

function skillFx(skill: CombatSkill, signature: PlayerSignature): FxState {
  const blob = `${normal(skill.name)} ${normal(skill.description)} ${normal(skill.element)}`;
  if (blob.includes("soin") || blob.includes("heal") || blob.includes("restaure") || blob.includes("fleur")) {
    return { id: Date.now(), kind: "heal", target: "player", signature };
  }
  if (blob.includes("barri") || blob.includes("bouclier") || blob.includes("protect") || blob.includes("déf")) {
    return { id: Date.now(), kind: "guard", target: "player", signature };
  }
  if (blob.includes("zoltraak") || blob.includes("zoltaak") || blob.includes("laser") || blob.includes("rayon") || signature === "frieren") {
    return { id: Date.now(), kind: "laser", target: "enemy", signature };
  }
  if (blob.includes("griff") || blob.includes("slash") || blob.includes("claw") || signature === "therian") {
    return { id: Date.now(), kind: "slash", target: "enemy", signature };
  }
  return { id: Date.now(), kind: "impact", target: "enemy", signature };
}

function shakeElement(ref: RefObject<HTMLElement | null>, intensity = 1) {
  const el = ref.current;
  if (!el) return;
  el.getAnimations().forEach((animation) => animation.cancel());
  const px = Math.max(4, Math.round(8 * intensity));
  el.animate(
    [
      { transform: "translate3d(0,0,0) scale(1)", filter: "brightness(1)" },
      { transform: `translate3d(-${px}px,2px,0) scale(1.01)`, filter: "brightness(1.32)" },
      { transform: `translate3d(${px}px,-2px,0) scale(.995)`, filter: "brightness(1.15)" },
      { transform: `translate3d(-${Math.ceil(px * .65)}px,1px,0) scale(1)`, filter: "brightness(1.08)" },
      { transform: `translate3d(${Math.ceil(px * .35)}px,0,0) scale(1)`, filter: "brightness(1)" },
      { transform: "translate3d(0,0,0) scale(1)", filter: "brightness(1)" },
    ],
    { duration: 430, easing: "cubic-bezier(.36,.07,.19,.97)" },
  );
}

function lungeEnemy(
  ref: RefObject<HTMLElement | null>,
  target: Target,
  intensity = 1,
) {
  const el = ref.current;
  if (!el) return;

  const x = Math.round(118 * Math.max(.95, intensity));
  const y = target === "companion" ? 42 : 0;

  el.getAnimations().forEach((animation) => animation.cancel());
  el.animate(
    [
      { transform: "translate3d(0,0,0) scale(1)", filter: "brightness(1)" },
      { transform: "translate3d(14px,-4px,0) scale(1.04)", filter: "brightness(1.08)", offset: .16 },
      { transform: `translate3d(-${x}px,${y}px,0) scale(1.13)`, filter: "brightness(1.38) contrast(1.08)", offset: .48 },
      { transform: `translate3d(-${Math.round(x * .76)}px,${Math.round(y * .8)}px,0) scale(1.08)`, filter: "brightness(1.23)", offset: .65 },
      { transform: "translate3d(9px,-2px,0) scale(1.025)", filter: "brightness(1.06)", offset: .86 },
      { transform: "translate3d(0,0,0) scale(1)", filter: "brightness(1)" },
    ],
    { duration: 940, easing: "cubic-bezier(.16,.82,.18,1)", fill: "both" },
  );
}

function pressButton(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.animate(
    [
      { transform: "translateY(-2px) scale(1)" },
      { transform: "translateY(0) scale(.965)" },
      { transform: "translateY(-1px) scale(1.015)" },
      { transform: "translateY(0) scale(1)" },
    ],
    { duration: 260, easing: "cubic-bezier(.2,.9,.2,1)" },
  );
}

function DeathAsh({ side }: { side: "player" | "enemy" }) {
  return (
    <div className={`tm-death-ash is-${side}`} aria-hidden="true">
      <i /><i /><i /><i /><i /><i /><i /><i />
      <i /><i /><i /><i /><i /><i /><i /><i />
      <i /><i /><i /><i />
    </div>
  );
}


function CombatFx({ effect }: { effect: FxState | null }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !effect) return;
    el.getAnimations().forEach((animation) => animation.cancel());

    const common: KeyframeAnimationOptions = {
      duration:
        effect.kind === "laser"
          ? 820
          : effect.kind === "heal" || effect.kind === "guard" || effect.kind === "potion"
            ? 980
            : effect.kind === "pet"
              ? 680
              : 620,
      easing: "cubic-bezier(.2,.9,.25,1)",
      fill: "both",
    };

    if (effect.kind === "laser") {
      el.animate([
        { opacity: 0, transform: "scaleX(.04)" },
        { opacity: 1, transform: "scaleX(1)", offset: .16 },
        { opacity: 1, transform: "scaleX(1)", offset: .7 },
        { opacity: 0, transform: "scaleX(1.03)" },
      ], common);
    } else if (effect.kind === "slash") {
      el.animate([
        { opacity: 0, transform: "rotate(-52deg) scale(.7)" },
        { opacity: 1, transform: "rotate(-16deg) scale(1)", offset: .28 },
        { opacity: 0, transform: "rotate(20deg) scale(1.1)" },
      ], common);
    } else if (effect.kind === "heal") {
      el.animate([
        { opacity: 0, transform: "scale(.3) rotate(-10deg)" },
        { opacity: 1, transform: "scale(.92) rotate(2deg)", offset: .28 },
        { opacity: 1, transform: "scale(1.04) rotate(0)", offset: .62 },
        { opacity: 0, transform: "scale(1.24) rotate(8deg)" },
      ], { ...common, duration: 1080 });
    } else if (effect.kind === "guard") {
      el.animate([
        { opacity: 0, transform: "scale(.5)" },
        { opacity: 1, transform: "scale(1.02)", offset: .28 },
        { opacity: .94, transform: "scale(.98)", offset: .72 },
        { opacity: 0, transform: "scale(1.12)" },
      ], { ...common, duration: 1120 });
    } else if (effect.kind === "potion") {
      el.animate([
        { opacity: 0, transform: "translateY(18px) scale(.45)" },
        { opacity: 1, transform: "translateY(0) scale(.9)", offset: .24 },
        { opacity: 1, transform: "translateY(-8px) scale(1.04)", offset: .62 },
        { opacity: 0, transform: "translateY(-30px) scale(1.2)" },
      ], { ...common, duration: 1060 });
    } else if (effect.kind === "pet") {
      el.animate([
        { opacity: 0, transform: "translate(-70px,28px) scale(.6)" },
        { opacity: 1, transform: "translate(-10px,4px) scale(1)", offset: .52 },
        { opacity: 0, transform: "translate(30px,-6px) scale(1.08)" },
      ], common);
    } else {
      el.animate([
        { opacity: 0, transform: "scale(.2)" },
        { opacity: 1, transform: "scale(1)", offset: .28 },
        { opacity: 0, transform: "scale(1.5)" },
      ], common);
    }
  }, [effect]);

  if (!effect) return null;

  const targetStyle: CSSProperties =
    effect.kind === "laser"
      ? { left: "28%", right: "10%", top: "50%" }
      : effect.left != null && effect.top != null
        ? { left: effect.left, top: effect.top }
        : effect.target === "enemy"
          ? { right: "10%", top: "22%" }
          : effect.target === "player"
            ? { left: "10%", top: "22%" }
            : { left: "50%", bottom: 0 };

  const shapeStyle: Record<FxKind, CSSProperties> = {
    impact: {
      width: 150, height: 150, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(255,255,255,.98) 0 8%, rgba(129,219,255,.94) 9% 18%, rgba(70,165,232,.48) 19% 38%, rgba(50,139,207,.14) 39% 60%, transparent 61%)",
      boxShadow: "0 0 34px rgba(91,192,246,.42)",
    },
    laser: {
      left: "28%", right: "10%", top: "50%", width: "auto", height: 12, borderRadius: 999,
      transformOrigin: "left center",
      background: "linear-gradient(90deg, rgba(103,192,255,0), rgba(98,199,255,.96) 20%, rgba(255,255,255,1) 52%, rgba(123,197,255,.46) 82%, transparent)",
      boxShadow: "0 0 14px rgba(104,198,255,.72), 0 0 38px rgba(86,171,255,.46)",
    },
    slash: {
      width: 200, height: 200, borderTop: "6px solid rgba(229,248,255,.98)", borderRight: "6px solid rgba(105,210,255,.96)",
      borderRadius: "50%", filter: "drop-shadow(0 0 14px rgba(93,197,246,.55))",
    },
    heal: effect.signature === "frieren" ? {
      width: 178, height: 178, borderRadius: "50%",
      border: "2px solid rgba(208,241,255,.96)",
      background: "radial-gradient(circle, rgba(255,255,255,.84) 0 7%, rgba(118,211,255,.48) 8% 28%, rgba(93,130,255,.18) 29% 51%, transparent 67%)",
      boxShadow: "0 0 24px rgba(187,235,255,.72), 0 0 52px rgba(88,169,255,.4)",
    } : effect.signature === "therian" ? {
      width: 178, height: 178, borderRadius: "46% 54% 42% 58%",
      border: "3px double rgba(153,255,190,.9)",
      background: "radial-gradient(circle, rgba(222,255,232,.7), rgba(63,204,128,.3) 38%, rgba(138,89,226,.12) 58%, transparent 70%)",
      boxShadow: "0 0 28px rgba(81,225,143,.48), 0 0 52px rgba(135,88,226,.2)",
    } : {
      width: 170, height: 170, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(190,255,225,.52), rgba(81,220,178,.26) 35%, transparent 67%)",
      boxShadow: "0 0 38px rgba(79,220,180,.28)",
    },
    guard: effect.signature === "frieren" ? {
      width: 176, height: 176, clipPath: "polygon(50% 0, 86% 18%, 100% 52%, 78% 92%, 50% 100%, 22% 92%, 0 52%, 14% 18%)",
      border: "4px solid rgba(211,242,255,.98)",
      background: "radial-gradient(circle, rgba(164,223,255,.22), rgba(78,144,255,.12) 48%, transparent 70%)",
      boxShadow: "inset 0 0 34px rgba(169,224,255,.3), 0 0 24px rgba(200,240,255,.68), 0 0 48px rgba(74,153,255,.38)",
    } : effect.signature === "therian" ? {
      width: 176, height: 176, clipPath: "polygon(50% 0, 64% 28%, 96% 18%, 74% 50%, 98% 75%, 61% 70%, 50% 100%, 39% 70%, 2% 75%, 26% 50%, 4% 18%, 36% 28%)",
      border: "4px solid rgba(244,208,116,.94)",
      background: "radial-gradient(circle, rgba(255,233,156,.2), rgba(127,71,39,.14) 46%, transparent 70%)",
      boxShadow: "0 0 24px rgba(255,196,85,.46), 0 0 48px rgba(160,87,53,.3)",
    } : {
      width: 165, height: 165, clipPath: "polygon(25% 5%, 75% 5%, 96% 50%, 75% 95%, 25% 95%, 4% 50%)",
      border: "3px solid rgba(134,218,255,.92)", background: "radial-gradient(circle, rgba(101,193,238,.16), transparent 62%)",
      boxShadow: "inset 0 0 28px rgba(105,194,238,.15), 0 0 32px rgba(105,194,238,.28)",
    },
    potion: {
      width: 254, height: 254, borderRadius: "50%",
      border: "2px solid rgba(174,255,225,.72)",
      background: "radial-gradient(circle, rgba(255,255,255,.92) 0 4%, rgba(124,255,207,.46) 5% 14%, transparent 15% 32%, rgba(89,178,255,.18) 33% 38%, transparent 39% 52%, rgba(189,110,255,.14) 53% 58%, transparent 59%)",
      boxShadow: "inset 0 0 38px rgba(114,255,205,.22), 0 0 28px rgba(126,255,215,.58), 0 0 72px rgba(96,171,255,.42)",
    },
    pet: {
      width: 180, height: 92, borderRadius: 999,
      background: "radial-gradient(circle at 78% 52%, rgba(255,255,255,.92) 0 8px, transparent 9px), linear-gradient(90deg, transparent, rgba(169,123,255,.38) 40%, rgba(217,192,255,.58) 66%, transparent)",
      filter: "drop-shadow(0 0 22px rgba(167,122,255,.42))",
    },
  };

  return <div key={effect.id} ref={ref} className={`tm-v55-fx tm-v55-fx-${effect.kind}`} style={{ position: "absolute", zIndex: 40, pointerEvents: "none", opacity: 0, transformOrigin: "center", ...targetStyle, ...shapeStyle[effect.kind] }} aria-hidden="true" />;
}


function eventFingerprint(event: CombatEvent) {
  return [event.type, event.text, event.actorId ?? "", event.targetId ?? "", event.amount, event.critical ? 1 : 0, event.visualTarget ?? ""].join("|");
}

function eventLooksHealing(event: CombatEvent) {
  const blob = `${normal(event.type)} ${normal(event.text)} ${normal(event.animation)}`;
  return blob.includes("heal") || blob.includes("soin") || blob.includes("récup") || blob.includes("recup") || blob.includes("regen") || blob.includes("guéri") || blob.includes("gueri");
}

function eventLooksGuarding(event: CombatEvent) {
  const blob = `${normal(event.type)} ${normal(event.text)} ${normal(event.animation)}`;
  return (
    blob.includes("shield") ||
    blob.includes("guard") ||
    blob.includes("barri") ||
    blob.includes("bouclier") ||
    blob.includes("protect") ||
    blob.includes("défend") ||
    blob.includes("defend") ||
    blob.includes("fortif")
  );
}

function eventReadingDelay(event: CombatEvent, actor: "player" | "enemy" | "companion") {
  const text = cleanMineText(event.text);
  const extra = Math.min(1200, Math.max(0, text.length - 24) * 18);
  const base = actor === "enemy" ? 1850 : actor === "companion" ? 1450 : 1600;
  return base + extra + (event.critical ? 260 : 0);
}

function isTerminalOutcome(outcome?: string | null) {
  const value = normal(outcome);
  return value === "player_victory" || value === "player_defeat" || value === "fled";
}

function actorPhase(event: CombatEvent, combat: MineCombat): "player" | "enemy" | "companion" {
  if (event.actorId && event.actorId === combat.enemy.id) return "enemy";
  if (combat.companion && event.actorId && event.actorId === combat.companion.id) return "companion";
  if (!eventLooksHealing(event) && event.amount > 0 && (event.visualTarget === "player" || event.visualTarget === "companion")) return "enemy";
  return "player";
}

function withEventApplied(combat: MineCombat, event: CombatEvent): MineCombat {
  if (!event.amount) return combat;
  const target = targetFromEvent(event, combat);
  const healing = eventLooksHealing(event);
  const delta = healing ? event.amount : -event.amount;
  const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value + delta));
  if (target === "player") return { ...combat, player: { ...combat.player, hp: clamp(combat.player.hp, combat.player.maxHp) } };
  if (target === "enemy") return { ...combat, enemy: { ...combat.enemy, hp: clamp(combat.enemy.hp, combat.enemy.maxHp) } };
  if (target === "companion" && combat.companion) return { ...combat, companion: { ...combat.companion, hp: clamp(combat.companion.hp, combat.companion.maxHp) } };
  return combat;
}

export default function CombatPanel({
  combat,
  busy,
  resolutionMode = false,
  onResolutionComplete,
  onSequenceComplete,
  onAttack,
  onSkill,
  onItem,
  onDefend,
  onFlee,
}: Props) {
  const [tab, setTab] = useState<"actions" | "skills" | "items" | "log">("actions");
  const [hoverTarget, setHoverTarget] = useState<Target>("none");
  const [fx, setFx] = useState<FxState | null>(null);
  const [playerAura, setPlayerAura] = useState<PlayerAura | null>(null);
  const [displayCombat, setDisplayCombat] = useState<MineCombat | null>(combat ?? null);
  const [visibleEvents, setVisibleEvents] = useState<CombatEvent[]>(combat?.events.slice(-5) ?? []);
  const [resolvingTurn, setResolvingTurn] = useState(false);
  const [phase, setPhase] = useState<"ready" | "player" | "enemy" | "companion">("ready");
  const [phaseText, setPhaseText] = useState("À toi de jouer");
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLElement | null>(null);
  const enemyRef = useRef<HTMLElement | null>(null);
  const companionRef = useRef<HTMLElement | null>(null);
  const fxTimer = useRef<number | null>(null);
  const auraTimer = useRef<number | null>(null);
  const previousCombatRef = useRef<MineCombat | null>(null);
  const sequenceToken = useRef(0);

  const shownCombat = resolutionMode ? combat : (displayCombat ?? combat);
  const signature = useMemo(() => playerSignature(shownCombat), [shownCombat]);
  const enemyImage = useMemo(() => (shownCombat ? resolveMonsterImage(shownCombat.enemy) : undefined), [shownCombat]);

  const showFx = (next: FxState, duration = 820) => {
    if (fxTimer.current) window.clearTimeout(fxTimer.current);

    let anchored = next;
    if (next.kind !== "laser" && arenaRef.current && next.target !== "none") {
      const host =
        next.target === "player"
          ? playerRef.current?.querySelector<HTMLElement>(".tm-fighter-portrait")
          : next.target === "enemy"
            ? enemyRef.current?.querySelector<HTMLElement>(".tm-fighter-portrait")
            : companionRef.current?.querySelector<HTMLElement>(".tm-combat-pet-pic");

      if (host) {
        const arenaRect = arenaRef.current.getBoundingClientRect();
        const targetRect = host.getBoundingClientRect();
        const size =
          next.kind === "guard" ? 304 :
          next.kind === "heal" ? 280 :
          next.kind === "potion" ? 254 :
          next.kind === "slash" ? 200 :
          next.kind === "impact" ? 150 : 170;

        anchored = {
          ...next,
          left: targetRect.left - arenaRect.left + targetRect.width / 2 - size / 2,
          top: targetRect.top - arenaRect.top + targetRect.height / 2 - size / 2,
        };
      }
    }

    const state = { ...anchored, id: Date.now() + Math.random() };
    setFx(state);
    fxTimer.current = window.setTimeout(() => {
      setFx((current) => current?.id === state.id ? null : current);
      fxTimer.current = null;
    }, duration);
  };

  const showPlayerAura = (
    kind: PlayerAura["kind"],
    auraSignature: PlayerSignature,
    duration = 4600,
  ) => {
    if (auraTimer.current) window.clearTimeout(auraTimer.current);
    setPlayerAura({ kind, signature: auraSignature });
    auraTimer.current = window.setTimeout(() => {
      setPlayerAura(null);
      auraTimer.current = null;
    }, duration);
  };

  useEffect(() => () => {
    if (fxTimer.current) window.clearTimeout(fxTimer.current);
    if (auraTimer.current) window.clearTimeout(auraTimer.current);
  }, []);

  // Si le serveur refuse une action, aucun nouvel événement n'arrive.
  // On rend alors la main au joueur au lieu de laisser le bandeau bloqué
  // sur « ton action » alors que les boutons sont redevenus disponibles.
  useEffect(() => {
    if (busy || resolvingTurn || phase !== "player") return;
    const timer = window.setTimeout(() => {
      setPhase("ready");
      setPhaseText("À toi de jouer");
      setPlayerAura(null);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [busy, phase, resolvingTurn]);

  useEffect(() => {
    if (!combat) return;
    if (resolutionMode) {
      previousCombatRef.current = combat;
      setDisplayCombat(combat);
      setVisibleEvents(combat.events.slice(-5));
      setResolvingTurn(false);
      setPhase("ready");
      return;
    }

    const previous = previousCombatRef.current;
    previousCombatRef.current = combat;
    if (!previous) {
      setDisplayCombat(combat);
      setVisibleEvents(combat.events.slice(-5));
      return;
    }

    const previousKeys = previous.events.map(eventFingerprint);
    const currentKeys = combat.events.map(eventFingerprint);
    if (previousKeys.join("§") === currentKeys.join("§") && previous.turn === combat.turn) {
      setDisplayCombat(combat);
      if (isTerminalOutcome(combat.outcome) && combat.outcome !== previous.outcome) {
        const finishTimer = window.setTimeout(() => onSequenceComplete?.(combat), 2850);
        return () => window.clearTimeout(finishTimer);
      }
      return;
    }

    let added = combat.events;
    if (currentKeys.length >= previousKeys.length && previousKeys.every((key, index) => currentKeys[index] === key)) {
      added = combat.events.slice(previousKeys.length);
    }
    if (!added.length) {
      setDisplayCombat(combat);
      if (isTerminalOutcome(combat.outcome)) {
        const finishTimer = window.setTimeout(() => onSequenceComplete?.(combat), 2850);
        return () => window.clearTimeout(finishTimer);
      }
      return;
    }

    const token = ++sequenceToken.current;
    setResolvingTurn(true);
    setHoverTarget("none");
    setDisplayCombat(previous);
    setVisibleEvents(previous.events.slice(-5));

    const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    const runSequence = async () => {
      await wait(180);
      for (const event of added) {
        if (sequenceToken.current !== token) return;
        const actor = actorPhase(event, combat);
        const target = targetFromEvent(event, combat);
        const damaging = event.amount > 0 && !eventLooksHealing(event);
        const guarding = eventLooksGuarding(event);
        const intensity = event.critical ? 1.32 : normal(event.intensity).includes("heavy") ? 1.18 : 1;
        setPhase(actor);
        setPhaseText(cleanMineText(event.text, actor === "enemy" ? `${combat.enemy.name} attaque…` : "Action en cours…"));
        setVisibleEvents((old) => [...old, event].slice(-5));

        if (actor === "enemy") {
          lungeEnemy(enemyRef, target, intensity);
          await wait(330);
        }

        const blob = `${normal(event.animation)} ${normal(event.type)} ${normal(event.text)}`;
        if (target === "enemy") {
          const fromPet = actor === "companion";
          if (fromPet) showFx({ id: 0, kind: "pet", target: "enemy" }, 720);
          else if (blob.includes("zoltraak") || blob.includes("laser") || signature === "frieren") showFx({ id: 0, kind: "laser", target: "enemy" }, 860);
          else if (blob.includes("griff") || blob.includes("slash") || signature === "therian") showFx({ id: 0, kind: "slash", target: "enemy" }, 760);
          else showFx({ id: 0, kind: "impact", target: "enemy" }, 680);
          if (damaging) { shakeElement(enemyRef, intensity); void playMineSfx(actor === "companion" ? "pet" : "hit"); }
        } else if (target === "player") {
          if (guarding) {
            showPlayerAura("guard", signature);
          } else if (eventLooksHealing(event)) {
            showPlayerAura("heal", signature);
          } else {
            showFx({ id: 0, kind: "impact", target: "player" }, 760);
            if (damaging) {
              shakeElement(playerRef, intensity);
              void playMineSfx("hurt");
            }
          }
        } else if (target === "companion") {
          if (eventLooksHealing(event)) showFx({ id: 0, kind: "heal", target: "companion" }, 980);
          else if (damaging) {
            shakeElement(companionRef, intensity);
            void playMineSfx("pet");
          }
        }

        setDisplayCombat((current) => current ? withEventApplied(current, event) : current);
        await wait(eventReadingDelay(event, actor));
      }
      if (sequenceToken.current !== token) return;
      setDisplayCombat(combat);
      await wait(isTerminalOutcome(combat.outcome) ? 2850 : 320);
      if (sequenceToken.current !== token) return;

      setPlayerAura(null);
      if (auraTimer.current) {
        window.clearTimeout(auraTimer.current);
        auraTimer.current = null;
      }

      if (isTerminalOutcome(combat.outcome)) {
        setResolvingTurn(false);
        onSequenceComplete?.(combat);
        return;
      }

      setPhase("ready");
      setPhaseText("À toi de jouer");
      setResolvingTurn(false);
    };
    void runSequence();
    return () => { sequenceToken.current += 1; };
  }, [combat, resolutionMode, signature]);


  if (!combat || (!combat.active && !resolutionMode)) return null;

  const shown = shownCombat ?? combat;
  const { player, enemy, companion } = shown;
  const victory = resolutionMode && combat.outcome === "player_victory";
  const terminalVictory =
    !resolutionMode && normal(shown.outcome) === "player_victory";
  const terminalDefeat =
    !resolutionMode && normal(shown.outcome) === "player_defeat";
  const controlsLocked = Boolean(busy || resolvingTurn);

  if (resolutionMode) {
    return (
      <div className="tm-overlay tm-combat-overlay tm-combat-final-overlay">
        <article
          className={`tm-combat-shell tm-combat-final-shell ${victory ? "is-victory" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label="Résultat du combat TailBlue"
        >
          <Resolution combat={combat} onComplete={onResolutionComplete} />
        </article>
      </div>
    );
  }

  const spotlight = (event: MouseEvent<HTMLButtonElement>, target: Target) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    event.currentTarget.style.setProperty("--mx", `${x}px`);
    event.currentTarget.style.setProperty("--my", `${y}px`);
    event.currentTarget.style.backgroundImage = `radial-gradient(190px circle at ${x}px ${y}px, rgba(120,220,255,.34), rgba(70,160,220,.10) 42%, transparent 70%)`;
    event.currentTarget.style.borderColor = "rgba(112,211,255,.62)";
    event.currentTarget.style.boxShadow = "0 0 0 1px rgba(104,200,245,.20), 0 12px 28px rgba(0,0,0,.28), 0 0 28px rgba(77,177,230,.18)";
    setHoverTarget(target);
  };

  const leaveSpotlight = (event?: MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.currentTarget.style.removeProperty("background-image");
      event.currentTarget.style.removeProperty("border-color");
      event.currentTarget.style.removeProperty("box-shadow");
    }
    setHoverTarget("none");
  };

  return (
    <div className="tm-overlay tm-combat-overlay">
      <article className={`tm-combat-shell ${resolutionMode ? "is-resolution" : ""} ${victory ? "is-victory" : ""}`} role="dialog" aria-modal="true" aria-label="Combat TailBlue">
        <header className="tm-combat-title">
          <div>
            <p className="tm-kicker">{resolutionMode ? "RÉSOLUTION DU COMBAT" : "COMBAT · MINE"}</p>
            <h2>{cleanMineText(enemy.name)}</h2>
            <p>{enemy.boss ? "Boss de l'Abîme" : `Créature niv. ${enemy.level ?? "?"}`} · chaque action est résolue par combat.py</p>
          </div>
          <div className="tm-combat-lock">{resolutionMode ? "⚔️ RÉSOLUTION" : "🔒 SORTIE VERROUILLÉE"}</div>
        </header>

        <div ref={arenaRef} className={`tm-arena tm-v55-arena ${phase === "enemy" && resolvingTurn ? "is-enemy-turn" : ""}`} style={{ position: "relative", isolation: "isolate" }}>
          <CombatFx effect={fx} />

          <section ref={playerRef} className={`tm-fighter tm-player ${terminalDefeat ? "tm-fighter-dying tm-fighter-dying-player" : ""} ${hoverTarget === "player" ? "tm-v55-targeted" : ""}`} style={hoverTarget === "player" ? { borderColor: "rgba(102,207,255,.72)", boxShadow: "0 0 0 1px rgba(102,197,243,.28), 0 0 36px rgba(75,181,238,.24), inset 0 0 34px rgba(72,161,214,.10)" } : undefined}>
            {playerAura && (
              <div className={`tm-player-turn-aura is-${playerAura.kind} is-${playerAura.signature}`} aria-hidden="true">
                <i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
              </div>
            )}
            <Portrait image={player.image} fallback={player.emoji || "🧭"} />
            {terminalDefeat && <DeathAsh side="player" />}
            <div className="tm-fighter-copy">
              <small>AVENTURIER</small>
              <h3>{cleanMineText(player.name)}</h3>
              <div className="tm-value"><span>❤️ Points de vie</span><strong>{player.hp}/{player.maxHp}</strong></div>
              <Bar value={player.hp} max={player.maxHp} kind="hp" />
              {player.energy != null && player.maxEnergy != null && <><div className="tm-value"><span>🔷 Énergie combat</span><strong>{player.energy}/{player.maxEnergy}</strong></div><Bar value={player.energy} max={player.maxEnergy} kind="energy" /></>}
              {player.statuses.length > 0 && <div className="tm-statuses">{player.statuses.map((status) => <span key={status}>{cleanMineText(status)}</span>)}</div>}
            </div>
          </section>

          <div className="tm-vs"><span>⚔</span><b>VS</b></div>

          <section ref={enemyRef} className={`tm-fighter tm-enemy ${terminalVictory ? "tm-fighter-dying tm-fighter-dying-enemy" : ""} ${hoverTarget === "enemy" ? "tm-v55-targeted" : ""}`} style={hoverTarget === "enemy" ? { borderColor: "rgba(255,128,128,.74)", boxShadow: "0 0 0 1px rgba(255,128,128,.24), 0 0 38px rgba(218,83,91,.24), inset 0 0 34px rgba(150,48,58,.10)" } : undefined}>
            <Portrait image={enemyImage} fallback={enemy.emoji || "👹"} defeated={victory} />
            {terminalVictory && <DeathAsh side="enemy" />}
            <div className="tm-fighter-copy">
              <small>{enemy.boss ? "BOSS" : "ENNEMI"} · NIV. {enemy.level ?? "?"}</small>
              <h3>{cleanMineText(enemy.name)}</h3>
              <div className="tm-value"><span>❤️ Points de vie</span><strong>{enemy.hp}/{enemy.maxHp}</strong></div>
              <Bar value={enemy.hp} max={enemy.maxHp} kind="hp" />
              {enemy.statuses.length > 0 && <div className="tm-statuses">{enemy.statuses.map((status) => <span key={status}>{cleanMineText(status)}</span>)}</div>}
            </div>
          </section>
        </div>

        {companion && (
          <section ref={companionRef} className={`tm-combat-pet ${hoverTarget === "companion" ? "tm-v55-targeted" : ""}`} style={hoverTarget === "companion" ? { borderColor: "rgba(185,139,255,.72)", boxShadow: "0 0 0 1px rgba(185,139,255,.22), 0 0 32px rgba(150,105,230,.22)" } : undefined}>
            <div className="tm-combat-pet-pic"><MinePetPortrait pet={companion} /></div>
            <div><small>COMPAGNON</small><strong>{cleanMineText(companion.name)}</strong><span>Niv. {companion.level} · {cleanMineText(companion.role || "allié")}</span></div>
            <div className="tm-combat-pet-bars"><span>❤️ {companion.hp}/{companion.maxHp}</span><Bar value={companion.hp} max={companion.maxHp} kind="hp" /><span>⚡ {companion.energy}/{companion.maxEnergy}</span><Bar value={companion.energy} max={companion.maxEnergy} kind="energy" /></div>
          </section>
        )}

        <section className="tm-live-round">
          <div className="tm-live-round-head"><div><p className="tm-kicker">TOUR {shown.turn}</p><h3>Ce qui vient de se passer</h3></div><span>{visibleEvents.length} événement(s) affiché(s)</span></div>
          <BattleFeed events={visibleEvents} />
        </section>

        {!resolutionMode && (
          <div className={`tm-turn-banner tm-turn-banner-controls is-${phase} ${resolvingTurn ? "is-resolving" : ""}`}>
            <span>{phase === "enemy" ? "👹" : phase === "companion" ? "🐾" : phase === "player" ? "⚔️" : "✦"}</span>
            <div>
              <small>{phase === "enemy" ? `TOUR DE ${cleanMineText(enemy.name).toUpperCase()}` : phase === "companion" ? "TOUR DU COMPAGNON" : phase === "player" ? "TON ACTION" : "TON TOUR"}</small>
              <strong>{phaseText}</strong>
            </div>
            {resolvingTurn && <i />}
          </div>
        )}

        {resolutionMode ? (
          <Resolution combat={combat} onComplete={onResolutionComplete} />
        ) : (
          <>
            <nav className="tm-combat-tabs">
              {(["actions", "skills", "items", "log"] as const).map((value) => (
                <button key={value} className={tab === value ? "selected" : ""} onClick={(event) => { pressButton(event); setTab(value); }}>
                  {value === "actions" ? "⚔️ Actions" : value === "skills" ? "✨ Compétences" : value === "items" ? "🧪 Sac" : `📜 Journal (${visibleEvents.length})`}
                </button>
              ))}
            </nav>

            {tab === "actions" && (
              <div className="tm-combat-actions">
                <button className="primary tm-v55-interactive" disabled={controlsLocked} onMouseMove={(e) => spotlight(e, "enemy")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); setPhase("player"); setPhaseText("Ton action est envoyée au moteur de combat…"); void onAttack(); }}><span>⚔️</span><b>Attaquer</b><small>Attaque de base</small></button>
                <button className="tm-v55-interactive" disabled={controlsLocked} onMouseMove={(e) => spotlight(e, "enemy")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); setTab("skills"); }}><span>✨</span><b>Compétences</b><small>Techniques et magie</small></button>
                <button className="tm-v55-interactive" disabled={controlsLocked} onMouseMove={(e) => spotlight(e, "player")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); setTab("items"); }}><span>🧪</span><b>Objets</b><small>Potions du sac</small></button>
                <button className="tm-v55-interactive" disabled={controlsLocked} onMouseMove={(e) => spotlight(e, "player")} onMouseLeave={leaveSpotlight} onClick={(event) => {
                  pressButton(event);
                  setPhase("player");
                  setPhaseText("Tu te mets en garde…");
                  showPlayerAura("guard", signature);
                  void onDefend();
                }}><span>🛡️</span><b>Défendre</b><small>Réduire les dégâts</small></button>
                <button className="danger tm-v55-interactive" disabled={controlsLocked || !shown.canFlee} onClick={(event) => { pressButton(event); void onFlee(); }}><span>🏃</span><b>Fuir</b><small>{shown.canFlee ? "Tentative réelle" : "Impossible contre ce boss"}</small></button>
              </div>
            )}

            {tab === "skills" && (
              <aside className="tm-combat-side-panel tm-combat-side-left">
                <div className="tm-side-panel-head">
                  <div><small>GRIMOIRE</small><strong>Compétences</strong></div>
                  <button type="button" onClick={() => setTab("actions")} aria-label="Fermer">×</button>
                </div>
                <div className="tm-side-player-preview">
                  <div className="tm-side-player-avatar">
                    {player.image ? <img src={player.image} alt="" draggable={false} /> : <span>{player.emoji || "🧭"}</span>}
                  </div>
                  <div className="tm-side-player-copy">
                    <small>AVENTURIER</small>
                    <strong>{cleanMineText(player.name)}</strong>
                    <span>❤️ {player.hp}/{player.maxHp}{player.energy != null && player.maxEnergy != null ? ` · 🔷 ${player.energy}/${player.maxEnergy}` : ""}</span>
                  </div>
                </div>
                <div className="tm-skill-grid tm-side-scroll">
                  {shown.skills.length === 0 ? <div className="tm-empty">Aucune compétence disponible.</div> : shown.skills.map((skill) => {
                    const preview = skillFx(skill, signature);
                    return (
                      <button key={skill.id} className="tm-v55-interactive" disabled={controlsLocked || Boolean(skill.disabledReason)} onMouseMove={(e) => spotlight(e, preview.target)} onMouseLeave={leaveSpotlight} onClick={(event) => {
                        pressButton(event);
                        setPhase("player");
                        setPhaseText(`${cleanMineText(skill.name)} se prépare…`);
                        setTab("actions");
                        if (preview.kind === "heal" || preview.kind === "guard") {
                          const auraKind: PlayerAura["kind"] = preview.kind;

                          window.setTimeout(
                            () => showPlayerAura(auraKind, signature),
                            70,
                          );
                        }
                        void onSkill(skill.id);
                      }}>
                        <div className="tm-skill-title"><strong>{cleanMineText(skill.name)}</strong><b>🔷 {skill.energyCost}</b></div>
                        <p>{cleanMineText(skill.description, "Compétence TailBlue")}</p>
                        <div className="tm-tags"><span>{cleanMineText(skill.element || "neutral")}</span>{skill.cooldown > 0 && <span>⏳ {skill.cooldown}</span>}</div>
                        {skill.disabledReason && <em>{cleanMineText(skill.disabledReason)}</em>}
                      </button>
                    );
                  })}
                </div>
              </aside>
            )}

            {tab === "items" && (
              <aside className="tm-combat-side-panel tm-combat-side-right">
                <div className="tm-side-panel-head">
                  <div><small>SAC DE COMBAT</small><strong>Potions & objets</strong></div>
                  <button type="button" onClick={() => setTab("actions")} aria-label="Fermer">×</button>
                </div>
                <div className="tm-item-grid tm-side-scroll">
                  {shown.items.length === 0 ? <div className="tm-empty">Ton sac ne contient aucun objet utilisable en combat.</div> : shown.items.map((item) => (
                    <button key={item.id} className="tm-v55-interactive" disabled={controlsLocked || !item.usable} onMouseMove={(e) => spotlight(e, "player")} onMouseLeave={leaveSpotlight} onClick={(event) => {
                      pressButton(event);
                      setPhase("player");
                      setPhaseText(`${cleanMineText(item.name)} est utilisé…`);
                      setTab("actions");
                      window.setTimeout(
                        () => showFx({ id: 0, kind: "potion", target: "player", signature }, 1700),
                        70,
                      );
                      void onItem(item.id);
                    }}><strong>🧪 {cleanMineText(item.name)}</strong><b>×{item.quantity}</b><p>{cleanMineText(item.description)}</p></button>
                  ))}
                </div>
              </aside>
            )}

            {tab === "log" && (
              <div className="tm-combat-log">
                {visibleEvents.length === 0 ? <p>Le combat commence…</p> : visibleEvents.map((event, index) => (
                  <div key={`${event.type}-${index}-${event.text}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{eventIcon(event)}</b><p className={event.critical ? "critical" : ""}>{cleanMineText(event.text)}</p>{event.amount > 0 && <em>{event.amount}</em>}</div>
                ))}
              </div>
            )}

            <footer className="tm-combat-footer">Tour {shown.turn} · dégâts, esquives, critiques, compétences, compagnon, IA et fuite sont tous résolus côté serveur.</footer>
          </>
        )}
      </article>
    </div>
  );
}
