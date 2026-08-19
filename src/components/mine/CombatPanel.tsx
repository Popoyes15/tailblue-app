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
import MinePetPortrait from "./MinePetPortrait";
import type { CombatEvent, CombatSkill, MineCombat } from "../../types/mine";
import "./mineUltra.css";

type Props = {
  combat?: MineCombat | null;
  busy?: boolean;
  resolutionMode?: boolean;
  onResolutionComplete?: () => void;
  onAttack: () => void | Promise<void>;
  onSkill: (skillId: string) => void | Promise<void>;
  onItem: (itemId: string) => void | Promise<void>;
  onDefend: () => void | Promise<void>;
  onFlee: () => void | Promise<void>;
};

type Target = "none" | "player" | "enemy" | "companion";
type FxKind = "impact" | "laser" | "slash" | "heal" | "guard" | "pet";

type FxState = {
  id: number;
  kind: FxKind;
  target: Target;
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

function playerSignature(combat?: MineCombat | null): "frieren" | "therian" | "generic" {
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

function skillFx(skill: CombatSkill, signature: ReturnType<typeof playerSignature>): FxState {
  const blob = `${normal(skill.name)} ${normal(skill.description)} ${normal(skill.element)}`;
  if (blob.includes("soin") || blob.includes("heal") || blob.includes("restaure") || blob.includes("fleur")) {
    return { id: Date.now(), kind: "heal", target: "player" };
  }
  if (blob.includes("barri") || blob.includes("bouclier") || blob.includes("protect") || blob.includes("déf")) {
    return { id: Date.now(), kind: "guard", target: "player" };
  }
  if (blob.includes("zoltraak") || blob.includes("zoltaak") || blob.includes("laser") || blob.includes("rayon") || signature === "frieren") {
    return { id: Date.now(), kind: "laser", target: "enemy" };
  }
  if (blob.includes("griff") || blob.includes("slash") || blob.includes("claw") || signature === "therian") {
    return { id: Date.now(), kind: "slash", target: "enemy" };
  }
  return { id: Date.now(), kind: "impact", target: "enemy" };
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

function CombatFx({ effect }: { effect: FxState | null }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !effect) return;
    el.getAnimations().forEach((animation) => animation.cancel());

    const common: KeyframeAnimationOptions = {
      duration: effect.kind === "laser" ? 760 : effect.kind === "pet" ? 620 : 560,
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
        { opacity: 0, transform: "scale(.35)" },
        { opacity: 1, transform: "scale(.8)", offset: .24 },
        { opacity: 0, transform: "scale(1.25)" },
      ], { ...common, duration: 720 });
    } else if (effect.kind === "guard") {
      el.animate([
        { opacity: 0, transform: "scale(.7) rotate(-12deg)" },
        { opacity: 1, transform: "scale(1) rotate(0)", offset: .3 },
        { opacity: 0, transform: "scale(1.08) rotate(8deg)" },
      ], { ...common, duration: 700 });
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

  const targetStyle: CSSProperties = effect.target === "enemy"
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
    heal: {
      width: 170, height: 170, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(190,255,225,.52), rgba(81,220,178,.26) 35%, transparent 67%)",
      boxShadow: "0 0 38px rgba(79,220,180,.28)",
    },
    guard: {
      width: 165, height: 165, clipPath: "polygon(25% 5%, 75% 5%, 96% 50%, 75% 95%, 25% 95%, 4% 50%)",
      border: "3px solid rgba(134,218,255,.92)", background: "radial-gradient(circle, rgba(101,193,238,.16), transparent 62%)",
      boxShadow: "inset 0 0 28px rgba(105,194,238,.15), 0 0 32px rgba(105,194,238,.28)",
    },
    pet: {
      width: 180, height: 92, borderRadius: 999,
      background: "radial-gradient(circle at 78% 52%, rgba(255,255,255,.92) 0 8px, transparent 9px), linear-gradient(90deg, transparent, rgba(169,123,255,.38) 40%, rgba(217,192,255,.58) 66%, transparent)",
      filter: "drop-shadow(0 0 22px rgba(167,122,255,.42))",
    },
  };

  return <div key={effect.id} ref={ref} className={`tm-v55-fx tm-v55-fx-${effect.kind}`} style={{ position: "absolute", zIndex: 40, pointerEvents: "none", opacity: 0, transformOrigin: "center", ...targetStyle, ...shapeStyle[effect.kind] }} aria-hidden="true" />;
}

export default function CombatPanel({
  combat,
  busy,
  resolutionMode = false,
  onResolutionComplete,
  onAttack,
  onSkill,
  onItem,
  onDefend,
  onFlee,
}: Props) {
  const [tab, setTab] = useState<"actions" | "skills" | "items" | "log">("actions");
  const [hoverTarget, setHoverTarget] = useState<Target>("none");
  const [fx, setFx] = useState<FxState | null>(null);
  const playerRef = useRef<HTMLElement | null>(null);
  const enemyRef = useRef<HTMLElement | null>(null);
  const companionRef = useRef<HTMLElement | null>(null);
  const fxTimer = useRef<number | null>(null);
  const lastEventKey = useRef("");

  const signature = useMemo(() => playerSignature(combat), [combat]);
  const enemyImage = useMemo(() => (combat ? resolveMonsterImage(combat.enemy) : undefined), [combat]);

  const eventKey = useMemo(
    () => combat?.events.map((event) => [event.type, event.amount, event.text, event.actorId ?? "", event.targetId ?? "", event.visualTarget ?? ""].join(":" )).join("|") ?? "",
    [combat?.events],
  );

  const showFx = (next: FxState, duration = 820) => {
    if (fxTimer.current) window.clearTimeout(fxTimer.current);
    const state = { ...next, id: Date.now() + Math.random() };
    setFx(state);
    fxTimer.current = window.setTimeout(() => {
      setFx((current) => current?.id === state.id ? null : current);
      fxTimer.current = null;
    }, duration);
  };

  useEffect(() => () => {
    if (fxTimer.current) window.clearTimeout(fxTimer.current);
  }, []);

  useEffect(() => {
    if (!combat?.events.length || eventKey === lastEventKey.current) return;
    lastEventKey.current = eventKey;
    const recent = combat.events.slice(-5);

    for (const event of recent) {
      const target = targetFromEvent(event, combat);
      const damaging = event.amount > 0 || event.critical || normal(event.type).includes("damage") || normal(event.type).includes("attack");
      const intensity = event.critical ? 1.25 : normal(event.intensity).includes("heavy") ? 1.15 : 1;

      if (target === "enemy" && damaging) shakeElement(enemyRef, intensity);
      if (target === "player" && damaging) shakeElement(playerRef, intensity);
      if (target === "companion" && damaging) shakeElement(companionRef, intensity);
    }

    const lastEnemyHit = [...recent].reverse().find((event) => targetFromEvent(event, combat) === "enemy" && (event.amount > 0 || event.critical));
    if (lastEnemyHit) {
      const fromPet = Boolean(combat.companion && lastEnemyHit.actorId && lastEnemyHit.actorId === combat.companion.id);
      const blob = `${normal(lastEnemyHit.animation)} ${normal(lastEnemyHit.type)} ${normal(lastEnemyHit.text)}`;
      if (fromPet) showFx({ id: 0, kind: "pet", target: "enemy" }, 700);
      else if (blob.includes("zoltraak") || blob.includes("laser") || signature === "frieren") showFx({ id: 0, kind: "laser", target: "enemy" }, 820);
      else if (blob.includes("griff") || blob.includes("slash") || signature === "therian") showFx({ id: 0, kind: "slash", target: "enemy" }, 700);
      else showFx({ id: 0, kind: "impact", target: "enemy" }, 620);
    }
  }, [eventKey, combat, signature]);

  if (!combat || (!combat.active && !resolutionMode)) return null;

  const { player, enemy, companion } = combat;
  const victory = resolutionMode && combat.outcome === "player_victory";

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

        <div className="tm-arena tm-v55-arena" style={{ position: "relative", isolation: "isolate" }}>
          <CombatFx effect={fx} />

          <section ref={playerRef} className={`tm-fighter tm-player ${hoverTarget === "player" ? "tm-v55-targeted" : ""}`} style={hoverTarget === "player" ? { borderColor: "rgba(102,207,255,.72)", boxShadow: "0 0 0 1px rgba(102,197,243,.28), 0 0 36px rgba(75,181,238,.24), inset 0 0 34px rgba(72,161,214,.10)" } : undefined}>
            <Portrait image={player.image} fallback={player.emoji || "🧭"} />
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

          <section ref={enemyRef} className={`tm-fighter tm-enemy ${hoverTarget === "enemy" ? "tm-v55-targeted" : ""}`} style={hoverTarget === "enemy" ? { borderColor: "rgba(255,128,128,.74)", boxShadow: "0 0 0 1px rgba(255,128,128,.24), 0 0 38px rgba(218,83,91,.24), inset 0 0 34px rgba(150,48,58,.10)" } : undefined}>
            <Portrait image={enemyImage} fallback={enemy.emoji || "👹"} defeated={victory} />
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
          <div className="tm-live-round-head"><div><p className="tm-kicker">TOUR {combat.turn}</p><h3>Ce qui vient de se passer</h3></div><span>{combat.events.length} événement(s) enregistré(s)</span></div>
          <BattleFeed events={combat.events} />
        </section>

        {resolutionMode ? (
          <Resolution combat={combat} onComplete={onResolutionComplete} />
        ) : (
          <>
            <nav className="tm-combat-tabs">
              {(["actions", "skills", "items", "log"] as const).map((value) => (
                <button key={value} className={tab === value ? "selected" : ""} onClick={(event) => { pressButton(event); setTab(value); }}>
                  {value === "actions" ? "⚔️ Actions" : value === "skills" ? "✨ Compétences" : value === "items" ? "🧪 Sac" : `📜 Journal (${combat.events.length})`}
                </button>
              ))}
            </nav>

            {tab === "actions" && (
              <div className="tm-combat-actions">
                <button className="primary tm-v55-interactive" disabled={busy} onMouseMove={(e) => spotlight(e, "enemy")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); showFx({ id: 0, kind: signature === "frieren" ? "laser" : signature === "therian" ? "slash" : "impact", target: "enemy" }); void onAttack(); }}><span>⚔️</span><b>Attaquer</b><small>Attaque de base</small></button>
                <button className="tm-v55-interactive" disabled={busy} onMouseMove={(e) => spotlight(e, "enemy")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); setTab("skills"); }}><span>✨</span><b>Compétences</b><small>Techniques et magie</small></button>
                <button className="tm-v55-interactive" disabled={busy} onMouseMove={(e) => spotlight(e, "player")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); setTab("items"); }}><span>🧪</span><b>Objets</b><small>Potions du sac</small></button>
                <button className="tm-v55-interactive" disabled={busy} onMouseMove={(e) => spotlight(e, "player")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); showFx({ id: 0, kind: "guard", target: "player" }); void onDefend(); }}><span>🛡️</span><b>Défendre</b><small>Réduire les dégâts</small></button>
                <button className="danger tm-v55-interactive" disabled={busy || !combat.canFlee} onClick={(event) => { pressButton(event); void onFlee(); }}><span>🏃</span><b>Fuir</b><small>{combat.canFlee ? "Tentative réelle" : "Impossible contre ce boss"}</small></button>
              </div>
            )}

            {tab === "skills" && (
              <div className="tm-skill-grid">
                {combat.skills.length === 0 ? <div className="tm-empty">Aucune compétence disponible.</div> : combat.skills.map((skill) => {
                  const preview = skillFx(skill, signature);
                  return (
                    <button key={skill.id} className="tm-v55-interactive" disabled={busy || Boolean(skill.disabledReason)} onMouseMove={(e) => spotlight(e, preview.target)} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); showFx(preview, preview.kind === "laser" ? 900 : 780); void onSkill(skill.id); }}>
                      <div className="tm-skill-title"><strong>{cleanMineText(skill.name)}</strong><b>🔷 {skill.energyCost}</b></div>
                      <p>{cleanMineText(skill.description, "Compétence TailBlue")}</p>
                      <div className="tm-tags"><span>{cleanMineText(skill.element || "neutral")}</span>{skill.cooldown > 0 && <span>⏳ {skill.cooldown}</span>}</div>
                      {skill.disabledReason && <em>{cleanMineText(skill.disabledReason)}</em>}
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "items" && (
              <div className="tm-item-grid">
                {combat.items.length === 0 ? <div className="tm-empty">Ton sac ne contient aucun objet utilisable en combat.</div> : combat.items.map((item) => (
                  <button key={item.id} className="tm-v55-interactive" disabled={busy || !item.usable} onMouseMove={(e) => spotlight(e, "player")} onMouseLeave={leaveSpotlight} onClick={(event) => { pressButton(event); showFx({ id: 0, kind: "heal", target: "player" }); void onItem(item.id); }}><strong>🧪 {cleanMineText(item.name)}</strong><b>×{item.quantity}</b><p>{cleanMineText(item.description)}</p></button>
                ))}
              </div>
            )}

            {tab === "log" && (
              <div className="tm-combat-log">
                {combat.events.length === 0 ? <p>Le combat commence…</p> : combat.events.map((event, index) => (
                  <div key={`${event.type}-${index}-${event.text}`}><span>{String(index + 1).padStart(2, "0")}</span><b>{eventIcon(event)}</b><p className={event.critical ? "critical" : ""}>{cleanMineText(event.text)}</p>{event.amount > 0 && <em>{event.amount}</em>}</div>
                ))}
              </div>
            )}

            <footer className="tm-combat-footer">Tour {combat.turn} · dégâts, esquives, critiques, compétences, compagnon, IA et fuite sont tous résolus côté serveur.</footer>
          </>
        )}
      </article>
    </div>
  );
}
