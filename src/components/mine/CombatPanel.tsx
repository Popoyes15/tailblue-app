import React, { useEffect, useMemo, useState } from "react";
import { resolveMonsterImage } from "../../data/monsterVisuals";
import { cleanMineText } from "../../data/mineText";
import MinePetPortrait from "./MinePetPortrait";
import type { CombatEvent, MineCombat } from "../../types/mine";
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

function Bar({ value, max, kind }: { value: number; max: number; kind: "hp" | "energy" }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return <div className={`tm-combat-bar ${kind}`}><i style={{ width: `${pct}%` }} /></div>;
}

function Portrait({
  image,
  fallback,
  shake,
  defeated,
}: {
  image?: string | null;
  fallback: string;
  shake: boolean;
  defeated?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);

  return (
    <div className={`tm-fighter-portrait ${shake ? "tm-impact-shake" : ""} ${defeated ? "tm-defeated-vanish" : ""}`}>
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

function Resolution({
  combat,
  onComplete,
}: {
  combat: MineCombat;
  onComplete?: () => void;
}) {
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
  const [shake, setShake] = useState({ player: false, enemy: false, companion: false });

  const eventKey = useMemo(
    () => combat?.events.map((event) => `${event.type}:${event.amount}:${event.text}`).join("|") ?? "",
    [combat?.events],
  );

  useEffect(() => {
    if (!combat?.events.length || resolutionMode) return;
    const targets = new Set(
      combat.events
        .slice(-5)
        .map((event) => event.visualTarget)
        .filter(Boolean),
    );
    if (targets.size === 0) return;

    setShake({
      player: targets.has("player"),
      enemy: targets.has("enemy"),
      companion: targets.has("companion"),
    });

    const timer = window.setTimeout(
      () => setShake({ player: false, enemy: false, companion: false }),
      520,
    );
    return () => window.clearTimeout(timer);
  }, [eventKey, combat?.events, resolutionMode]);

  const enemyImage = useMemo(
    () => (combat ? resolveMonsterImage(combat.enemy) : undefined),
    [combat],
  );

  if (!combat || (!combat.active && !resolutionMode)) return null;

  const { player, enemy, companion } = combat;
  const victory = resolutionMode && combat.outcome === "player_victory";

  return (
    <div className="tm-overlay tm-combat-overlay">
      <article
        className={`tm-combat-shell ${resolutionMode ? "is-resolution" : ""} ${victory ? "is-victory" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Combat TailBlue"
      >
        {/* VOLONTAIREMENT AUCUNE CROIX : un combat actif est verrouillé. */}
        <header className="tm-combat-title">
          <div>
            <p className="tm-kicker">{resolutionMode ? "RÉSOLUTION DU COMBAT" : "COMBAT · MINE"}</p>
            <h2>{cleanMineText(enemy.name)}</h2>
            <p>{enemy.boss ? "Boss de l'Abîme" : `Créature niv. ${enemy.level ?? "?"}`} · chaque action est résolue par combat.py</p>
          </div>
          <div className="tm-combat-lock">{resolutionMode ? "⚔️ RÉSOLUTION" : "🔒 SORTIE VERROUILLÉE"}</div>
        </header>

        <div className="tm-arena">
          <section className="tm-fighter tm-player">
            <Portrait image={player.image} fallback={player.emoji || "🧭"} shake={shake.player} />
            <div className="tm-fighter-copy">
              <small>AVENTURIER</small>
              <h3>{cleanMineText(player.name)}</h3>
              <div className="tm-value"><span>❤️ Points de vie</span><strong>{player.hp}/{player.maxHp}</strong></div>
              <Bar value={player.hp} max={player.maxHp} kind="hp" />
              {player.energy != null && player.maxEnergy != null && (
                <>
                  <div className="tm-value"><span>🔷 Énergie combat</span><strong>{player.energy}/{player.maxEnergy}</strong></div>
                  <Bar value={player.energy} max={player.maxEnergy} kind="energy" />
                </>
              )}
              {player.statuses.length > 0 && <div className="tm-statuses">{player.statuses.map((status) => <span key={status}>{cleanMineText(status)}</span>)}</div>}
            </div>
          </section>

          <div className="tm-vs"><span>⚔</span><b>VS</b></div>

          <section className="tm-fighter tm-enemy">
            <Portrait
              image={enemyImage}
              fallback={enemy.emoji || "👹"}
              shake={shake.enemy}
              defeated={victory}
            />
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
          <section className={`tm-combat-pet ${shake.companion ? "tm-impact-shake" : ""}`}>
            <div className="tm-combat-pet-pic"><MinePetPortrait pet={companion} /></div>
            <div>
              <small>COMPAGNON</small>
              <strong>{cleanMineText(companion.name)}</strong>
              <span>Niv. {companion.level} · {cleanMineText(companion.role || "allié")}</span>
            </div>
            <div className="tm-combat-pet-bars">
              <span>❤️ {companion.hp}/{companion.maxHp}</span>
              <Bar value={companion.hp} max={companion.maxHp} kind="hp" />
              <span>⚡ {companion.energy}/{companion.maxEnergy}</span>
              <Bar value={companion.energy} max={companion.maxEnergy} kind="energy" />
            </div>
          </section>
        )}

        <section className="tm-live-round">
          <div className="tm-live-round-head">
            <div>
              <p className="tm-kicker">TOUR {combat.turn}</p>
              <h3>Ce qui vient de se passer</h3>
            </div>
            <span>{combat.events.length} événement(s) enregistré(s)</span>
          </div>
          <BattleFeed events={combat.events} />
        </section>

        {resolutionMode ? (
          <Resolution combat={combat} onComplete={onResolutionComplete} />
        ) : (
          <>
            <nav className="tm-combat-tabs">
              {(["actions", "skills", "items", "log"] as const).map((value) => (
                <button key={value} className={tab === value ? "selected" : ""} onClick={() => setTab(value)}>
                  {value === "actions" ? "⚔️ Actions" : value === "skills" ? "✨ Compétences" : value === "items" ? "🧪 Sac" : `📜 Journal (${combat.events.length})`}
                </button>
              ))}
            </nav>

            {tab === "actions" && (
              <div className="tm-combat-actions">
                <button className="primary" disabled={busy} onClick={onAttack}>
                  <span>⚔️</span><b>Attaquer</b><small>Attaque de base</small>
                </button>
                <button disabled={busy} onClick={() => setTab("skills")}>
                  <span>✨</span><b>Compétences</b><small>Techniques et magie</small>
                </button>
                <button disabled={busy} onClick={() => setTab("items")}>
                  <span>🧪</span><b>Objets</b><small>Potions du sac</small>
                </button>
                <button disabled={busy} onClick={onDefend}>
                  <span>🛡️</span><b>Défendre</b><small>Réduire les dégâts</small>
                </button>
                <button className="danger" disabled={busy || !combat.canFlee} onClick={onFlee}>
                  <span>🏃</span><b>Fuir</b><small>{combat.canFlee ? "Tentative réelle" : "Impossible contre ce boss"}</small>
                </button>
              </div>
            )}

            {tab === "skills" && (
              <div className="tm-skill-grid">
                {combat.skills.length === 0 ? (
                  <div className="tm-empty">Aucune compétence disponible.</div>
                ) : combat.skills.map((skill) => (
                  <button key={skill.id} disabled={busy || Boolean(skill.disabledReason)} onClick={() => onSkill(skill.id)}>
                    <div className="tm-skill-title"><strong>{cleanMineText(skill.name)}</strong><b>🔷 {skill.energyCost}</b></div>
                    <p>{cleanMineText(skill.description, "Compétence TailBlue")}</p>
                    <div className="tm-tags"><span>{cleanMineText(skill.element || "neutral")}</span>{skill.cooldown > 0 && <span>⏳ {skill.cooldown}</span>}</div>
                    {skill.disabledReason && <em>{cleanMineText(skill.disabledReason)}</em>}
                  </button>
                ))}
              </div>
            )}

            {tab === "items" && (
              <div className="tm-item-grid">
                {combat.items.length === 0 ? (
                  <div className="tm-empty">Ton sac ne contient aucun objet utilisable en combat.</div>
                ) : combat.items.map((item) => (
                  <button key={item.id} disabled={busy || !item.usable} onClick={() => onItem(item.id)}>
                    <strong>🧪 {cleanMineText(item.name)}</strong>
                    <b>×{item.quantity}</b>
                    <p>{cleanMineText(item.description)}</p>
                  </button>
                ))}
              </div>
            )}

            {tab === "log" && (
              <div className="tm-combat-log">
                {combat.events.length === 0 ? (
                  <p>Le combat commence…</p>
                ) : combat.events.map((event, index) => (
                  <div key={`${event.type}-${index}-${event.text}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <b>{eventIcon(event)}</b>
                    <p className={event.critical ? "critical" : ""}>{cleanMineText(event.text)}</p>
                    {event.amount > 0 && <em>{event.amount}</em>}
                  </div>
                ))}
              </div>
            )}

            <footer className="tm-combat-footer">
              Tour {combat.turn} · dégâts, esquives, critiques, compétences, compagnon, IA et fuite sont tous résolus côté serveur.
            </footer>
          </>
        )}
      </article>
    </div>
  );
}
