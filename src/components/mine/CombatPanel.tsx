import { useState } from "react";
import type { CombatStateDto } from "../../types/backend";
import "./mineInteractions.css";

type Props = {
  combat: CombatStateDto | null;
  onClose: () => void;
  onAttack: () => void | Promise<void>;
  onSkill: (skillId: string) => void | Promise<void>;
  onDefend: () => void | Promise<void>;
  onFlee: () => void | Promise<void>;
};

function Bar({ value, max, kind }: { value: number; max: number; kind: "hp" | "energy" }) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));

  return (
    <div className={`combat-bar ${kind}`}>
      <div style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function CombatPanel({
  combat,
  onClose,
  onAttack,
  onSkill,
  onDefend,
  onFlee,
}: Props) {
  const [tab, setTab] = useState<"actions" | "skills" | "log">("actions");

  if (!combat?.active) return null;

  const { player, enemy, companion } = combat;

  return (
    <div className="mine-overlay combat-overlay">
      <article className="combat-shell">
        <button className="mine-sheet-close" onClick={onClose}>×</button>

        <header className="combat-title">
          <div>
            <p className="eyebrow">COMBAT DANS L'ABÎME</p>
            <h2>{enemy.name}</h2>
          </div>
          <span className="combat-live">⚔️ EN COURS</span>
        </header>

        <div className="combat-arena">
          <section className="fighter-card player">
            <div className="fighter-portrait">
              {player.image ? <img src={player.image} alt={player.name} /> : <span>{player.emoji ?? "🧍"}</span>}
            </div>
            <div className="fighter-copy">
              <small>AVENTURIER</small>
              <h3>{player.name}</h3>
              <div className="fighter-value"><span>❤️ PV</span><strong>{player.hp}/{player.maxHp}</strong></div>
              <Bar value={player.hp} max={player.maxHp} kind="hp" />
              {player.energy != null && player.maxEnergy != null ? (
                <>
                  <div className="fighter-value"><span>⚡ Énergie</span><strong>{player.energy}/{player.maxEnergy}</strong></div>
                  <Bar value={player.energy} max={player.maxEnergy} kind="energy" />
                </>
              ) : null}
            </div>
          </section>

          <div className="combat-vs">
            <span>⚔️</span>
            <strong>VS</strong>
          </div>

          <section className="fighter-card enemy">
            <div className="fighter-portrait">
              {enemy.image ? <img src={enemy.image} alt={enemy.name} /> : <span>{enemy.emoji ?? "👹"}</span>}
            </div>
            <div className="fighter-copy">
              <small>ENNEMI</small>
              <h3>{enemy.name}</h3>
              <div className="fighter-value"><span>❤️ PV</span><strong>{enemy.hp}/{enemy.maxHp}</strong></div>
              <Bar value={enemy.hp} max={enemy.maxHp} kind="hp" />
            </div>
          </section>
        </div>

        {companion ? (
          <div className="combat-companion">
            <span>{companion.emoji ?? "🐾"}</span>
            <div>
              <small>COMPAGNON</small>
              <strong>{companion.name}</strong>
            </div>
            <div className="companion-hp">
              ❤️ {companion.hp}/{companion.maxHp}
            </div>
          </div>
        ) : null}

        <nav className="combat-tabs">
          <button className={tab === "actions" ? "selected" : ""} onClick={() => setTab("actions")}>Actions</button>
          <button className={tab === "skills" ? "selected" : ""} onClick={() => setTab("skills")}>Compétences</button>
          <button className={tab === "log" ? "selected" : ""} onClick={() => setTab("log")}>Journal</button>
        </nav>

        {tab === "actions" ? (
          <div className="combat-actions">
            <button className="attack" onClick={onAttack}><span>⚔️</span><strong>Attaque</strong><small>Attaque de base</small></button>
            <button onClick={() => setTab("skills")}><span>✨</span><strong>Compétences</strong><small>Techniques disponibles</small></button>
            <button onClick={onDefend}><span>🛡️</span><strong>Défendre</strong><small>Préparer le prochain tour</small></button>
            <button disabled={!combat.canFlee} onClick={onFlee}><span>🏃</span><strong>Fuir</strong><small>{combat.canFlee ? "Tenter de quitter le combat" : "Impossible ici"}</small></button>
          </div>
        ) : null}

        {tab === "skills" ? (
          <div className="skill-grid">
            {combat.skills.length === 0 ? (
              <div className="mine-empty-state">
                <span>📖</span>
                <strong>Aucune compétence chargée</strong>
                <p>Le backend enverra les vraies compétences du joueur.</p>
              </div>
            ) : combat.skills.map((skill) => (
              <button
                key={skill.id}
                disabled={Boolean(skill.disabledReason)}
                onClick={() => onSkill(skill.id)}
              >
                <span className="skill-icon">{skill.emoji ?? "✨"}</span>
                <div>
                  <div className="skill-title"><strong>{skill.name}</strong><b>⚡ {skill.energyCost}</b></div>
                  <p>{skill.description}</p>
                  {skill.damage ? <small>⚔️ {skill.damage} dégâts</small> : null}
                  {skill.disabledReason ? <em>{skill.disabledReason}</em> : null}
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {tab === "log" ? (
          <div className="combat-log">
            {combat.log.length === 0 ? <p>Le combat vient de commencer.</p> : combat.log.map((line, index) => (
              <div key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{line}</p></div>
            ))}
          </div>
        ) : null}
      </article>
    </div>
  );
}
