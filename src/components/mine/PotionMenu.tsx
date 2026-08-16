import React from "react";
import type { MinePotion, MineResult } from "../../types/mine";
import { cleanMineText } from "../../data/mineText";
import "./mineUltra.css";

type Props = {
  open: boolean;
  potions: MinePotion[];
  busy?: boolean;
  onClose: () => void;
  onUse: (id: string) => void | Promise<void>;
  feedback?: MineResult | null;
};

export default function PotionMenu({ open, potions, busy, onClose, onUse, feedback }: Props) {
  if (!open) return null;
  return (
    <div className="tm-overlay" onMouseDown={onClose}>
      <article className="tm-sheet" onMouseDown={(event: React.MouseEvent) => event.stopPropagation()}>
        <button className="tm-close" onClick={onClose} aria-label="Fermer">×</button>
        <header className="tm-sheet-head">
          <span className="tm-sheet-icon">🧪</span>
          <div>
            <p className="tm-kicker">SAC DE SOINS</p>
            <h2>Potions & soins</h2>
            <p>Potions, bandages et remèdes viennent directement de ton vrai inventaire TailBlue.</p>
          </div>
        </header>
        {feedback && (
          <div className="tm-inline-feedback potion">
            <span>{feedback.emoji || "🧪"}</span>
            <div>
              <small>OBJET UTILISÉ</small>
              <strong>{cleanMineText(feedback.title)}</strong>
              <p>{cleanMineText(feedback.message)}</p>
            </div>
          </div>
        )}

        <div className="tm-potion-list">
          {potions.length === 0 ? (
            <div className="tm-empty"><span>🫙</span><b>Aucun consommable utilisable ici.</b></div>
          ) : potions.map((potion) => (
            <button
              className="tm-potion"
              key={potion.id}
              disabled={busy || potion.quantity <= 0 || !potion.usable}
              onClick={() => onUse(potion.id)}
            >
              <span className="tm-potion-icon">{potion.emoji || "🧪"}</span>
              <div>
                <div className="tm-potion-title"><strong>{cleanMineText(potion.name)}</strong><b>×{potion.quantity}</b></div>
                <p>{cleanMineText(potion.description, "Consommable TailBlue")}</p>
                <div className="tm-tags">
                  {potion.heal > 0 && <span>❤️ +{potion.heal}</span>}
                  {potion.mineEnergy > 0 && <span>⚡ Mine +{potion.mineEnergy}</span>}
                  {potion.combatEnergy > 0 && <span>🔷 Combat +{potion.combatEnergy}</span>}
                  {potion.removeStatuses.length > 0 && <span>✨ Dissipe {potion.removeStatuses.length} statut(s)</span>}
                </div>
              </div>
              <span className="tm-use">Utiliser →</span>
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
