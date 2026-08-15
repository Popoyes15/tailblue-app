import type { PotionDto } from "../../types/backend";
import "./mineInteractions.css";

type Props = {
  open: boolean;
  potions: PotionDto[];
  onClose: () => void;
  onUse: (potionId: string) => void | Promise<void>;
};

export default function PotionMenu({ open, potions, onClose, onUse }: Props) {
  if (!open) return null;

  return (
    <div className="mine-overlay" onMouseDown={onClose}>
      <article className="mine-sheet potion-sheet" onMouseDown={(e) => e.stopPropagation()}>
        <button className="mine-sheet-close" onClick={onClose}>×</button>

        <div className="mine-sheet-heading">
          <div className="mine-sheet-symbol">🧪</div>
          <div>
            <p className="eyebrow">SAC D'ALCHIMIE</p>
            <h2>Potions disponibles</h2>
            <p>Choisis l'objet à utiliser. Rien n'est consommé avant ta confirmation.</p>
          </div>
        </div>

        {potions.length === 0 ? (
          <div className="mine-empty-state">
            <span>🫙</span>
            <strong>Aucune potion disponible</strong>
            <p>Les vraies quantités viendront de l'inventaire RPG.</p>
          </div>
        ) : (
          <div className="potion-list">
            {potions.map((potion) => (
              <button
                key={potion.id}
                className="potion-card"
                disabled={potion.quantity <= 0}
                onClick={() => onUse(potion.id)}
              >
                <span className="potion-icon">{potion.emoji ?? "🧪"}</span>

                <div className="potion-copy">
                  <div>
                    <strong>{potion.name}</strong>
                    <b>×{potion.quantity}</b>
                  </div>
                  <p>{potion.description}</p>
                  <div className="potion-effects">
                    {potion.heal ? <span>❤️ +{potion.heal} PV</span> : null}
                    {potion.energy ? <span>⚡ +{potion.energy} énergie</span> : null}
                  </div>
                </div>

                <span className="potion-use">Utiliser →</span>
              </button>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
