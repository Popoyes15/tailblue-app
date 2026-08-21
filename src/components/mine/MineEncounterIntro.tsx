import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { cleanMineText } from "../../data/mineText";
import {
  MINE_ENCOUNTER_SOURCE_META,
  pickMineEncounterLine,
  type MineEncounterSource,
} from "../../data/mineEncounterIntros";
import { resolveMonsterImage } from "../../data/monsterVisuals";
import type { MineCombat } from "../../types/mine";

type Props = {
  combat: MineCombat;
  source: MineEncounterSource;
  onComplete: () => void;
};

const AUTO_START_MS = 4800;

export default function MineEncounterIntro({
  combat,
  source,
  onComplete,
}: Props) {
  const phrase = useMemo(
    () => pickMineEncounterLine(source),
    [combat.enemy.id, source],
  );
  const meta = MINE_ENCOUNTER_SOURCE_META[source];
  const enemyImage = resolveMonsterImage(combat.enemy);
  const enemyName = cleanMineText(combat.enemy.name, "Présence inconnue");

  useEffect(() => {
    const timer = window.setTimeout(onComplete, AUTO_START_MS);
    return () => window.clearTimeout(timer);
  }, [combat.enemy.id, onComplete, source]);

  return createPortal(
    <div
      className={`tm-encounter-intro-overlay ${combat.enemy.boss ? "is-boss" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Rencontre hostile : ${enemyName}`}
    >
      <div className="tm-encounter-backdrop">
        {enemyImage ? <img src={enemyImage} alt="" draggable={false} /> : null}
      </div>

      <div className="tm-encounter-noise" />
      <div className="tm-encounter-vignette" />
      <div className="tm-encounter-flash" />

      <div className="tm-encounter-particles" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
        <i /><i /><i /><i /><i /><i />
      </div>

      <section className="tm-encounter-stage">
        <div className="tm-encounter-source">
          <span>{meta.icon}</span>
          <div>
            <small>{meta.kicker}</small>
            <strong>{meta.label}</strong>
          </div>
        </div>

        <div className="tm-encounter-monster-wrap">
          <div className="tm-encounter-radar" />
          <div className="tm-encounter-monster">
            {enemyImage ? (
              <img src={enemyImage} alt="" draggable={false} />
            ) : (
              <span>{combat.enemy.emoji || "👹"}</span>
            )}
          </div>
        </div>

        <div className="tm-encounter-copy">
          <p className="tm-encounter-warning">
            {combat.enemy.boss ? "⚠️ MENACE MAJEURE" : "⚠️ PRÉSENCE HOSTILE"}
          </p>
          <p className="tm-encounter-line">{phrase}</p>

          <div className="tm-encounter-reveal">
            <small>{combat.enemy.boss ? "BOSS DÉTECTÉ" : "ADVERSAIRE DÉTECTÉ"}</small>
            <h2>{enemyName}</h2>
            <span>
              Niveau {combat.enemy.level ?? "?"}
              {combat.enemy.family ? ` · ${cleanMineText(combat.enemy.family)}` : ""}
            </span>
          </div>

          <div className="tm-encounter-ready">
            <i />
            <span>COMBAT IMMINENT</span>
            <i />
          </div>

          <button type="button" onClick={onComplete}>
            <span>⚔️</span>
            <div>
              <strong>Engager le combat</strong>
              <small>La rencontre commencera automatiquement</small>
            </div>
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
