import React, { useMemo, useState } from "react";
import type { MineCompanion, MineResult } from "../../types/mine";
import { cleanMineText } from "../../data/mineText";
import MinePetPortrait from "./MinePetPortrait";
import "./mineUltra.css";

type Props = {
  open: boolean;
  companion?: MineCompanion | null;
  busy?: boolean;
  onClose: () => void;
  onFeed: (foodId: string) => void | Promise<void>;
  onCuddle: () => void | Promise<void>;
  feedback?: MineResult | null;
};

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return <div className={`tm-mini-bar ${className}`}><i style={{ width: `${pct}%` }} /></div>;
}

export default function MineCompanionCare({ open, companion, busy, onClose, onFeed, onCuddle, feedback }: Props) {
  const foods = companion?.availableFoods ?? [];
  const [foodId, setFoodId] = useState("");
  const selected = useMemo(
    () => foods.some((food) => food.id === foodId) ? foodId : foods[0]?.id ?? "",
    [foodId, foods],
  );
  if (!open || !companion) return null;

  return (
    <div className="tm-overlay" onMouseDown={onClose}>
      <article className="tm-sheet tm-pet-sheet" onMouseDown={(event: React.MouseEvent) => event.stopPropagation()}>
        <button className="tm-close" onClick={onClose}>×</button>
        <header className="tm-pet-head">
          <div className="tm-pet-portrait">
            <MinePetPortrait pet={companion} />
          </div>
          <div>
            <p className="tm-kicker">COMPAGNON D'EXPÉDITION</p>
            <h2>{cleanMineText(companion.name)}</h2>
            <p>Niv. {companion.level} · {cleanMineText(companion.role || "compagnon")} · confiance {companion.trust}</p>
          </div>
        </header>

        {feedback && (
          <div className="tm-inline-feedback companion">
            <span>{feedback.emoji || "💜"}</span>
            <div>
              <small>RÉACTION DE TON COMPAGNON</small>
              <strong>{cleanMineText(feedback.title)}</strong>
              <p>{cleanMineText(feedback.message)}</p>
            </div>
          </div>
        )}

        <div className="tm-pet-vitals">
          <div><span>❤️ PV</span><strong>{companion.hp}/{companion.maxHp}</strong><Bar value={companion.hp} max={companion.maxHp} className="hp" /></div>
          <div><span>⚡ Énergie</span><strong>{companion.energy}/{companion.maxEnergy}</strong><Bar value={companion.energy} max={companion.maxEnergy} className="energy" /></div>
        </div>

        <div className="tm-pet-stats">
          <span>⚔️ {companion.attack}</span><span>🛡️ {companion.defense}</span><span>💨 {companion.speed}</span><span>🎯 {companion.crit}%</span><span>🌫️ {companion.dodge}%</span>
        </div>

        {companion.abilities.length > 0 && (
          <section className="tm-pet-section">
            <p className="tm-kicker">CAPACITÉS</p>
            <div className="tm-ability-list">
              {companion.abilities.map((ability) => (
                <div key={ability.id}><b>{cleanMineText(ability.name)}</b><span>⚡ {ability.energyCost}</span><p>{cleanMineText(ability.description)}</p></div>
              ))}
            </div>
          </section>
        )}

        <section className="tm-pet-section">
          <p className="tm-kicker">🍖 NOURRIR</p>
          {foods.length === 0 ? <p className="tm-muted">Aucune provision pour compagnon dans ton sac.</p> : (
            <div className="tm-feed-row">
              <select value={selected} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFoodId(e.target.value)}>
                {foods.map((food) => <option value={food.id} key={food.id}>{cleanMineText(food.name)} ×{food.quantity} · ❤️ {food.heal} · ⚡ {food.energy}{food.preference ? ` · ${cleanMineText(food.preference)}` : ""}</option>)}
              </select>
              <button disabled={busy || !selected} onClick={() => onFeed(selected)}>🍖 Nourrir</button>
            </div>
          )}
        </section>

        <section className="tm-pet-section tm-cuddle">
          <div><p className="tm-kicker">💜 LIEN</p><h3>Papouiller {cleanMineText(companion.name)}</h3><p>Énergie, affection et cooldown sont calculés par pets.py.</p></div>
          <button disabled={busy || companion.canPet === false} onClick={onCuddle}>💜 Papouiller</button>
        </section>
      </article>
    </div>
  );
}
