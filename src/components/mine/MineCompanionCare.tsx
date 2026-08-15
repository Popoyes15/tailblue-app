import { useMemo, useState } from "react";
import type { MineSnapshotDto } from "../../types/backend";
import "./mineInteractions.css";

type Props = {
  open: boolean;
  companion: MineSnapshotDto["companion"];
  busy?: boolean;
  onClose: () => void;
  onFeed: (foodId: string) => void | Promise<void>;
  onCuddle: () => void | Promise<void>;
};

export default function MineCompanionCare({
  open,
  companion,
  busy = false,
  onClose,
  onFeed,
  onCuddle,
}: Props) {
  const foods = companion?.availableFoods ?? [];

  const [selectedFood, setSelectedFood] = useState("");

  const effectiveFood = useMemo(() => {
    if (
      selectedFood &&
      foods.some((food) => food.id === selectedFood)
    ) {
      return selectedFood;
    }

    return foods[0]?.id ?? "";
  }, [foods, selectedFood]);

  if (!open || !companion) return null;

  return (
    <div className="mine-overlay">
      <article className="mine-sheet mine-pet-care-sheet">
        <button
          className="mine-sheet-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>

        <header className="mine-pet-care-header">
          <div className="mine-pet-care-avatar">
            {companion.image ? (
              <img src={companion.image} alt={companion.name} />
            ) : (
              <span>{companion.emoji ?? "🐾"}</span>
            )}
          </div>

          <div>
            <p className="eyebrow">COMPAGNON D'EXPÉDITION</p>
            <h2>{companion.name}</h2>
            {companion.trustLabel && (
              <p>{companion.trustLabel}</p>
            )}
          </div>
        </header>

        <div className="mine-pet-vitals">
          <Vital
            icon="❤️"
            label="PV"
            value={companion.hp}
            max={companion.maxHp}
          />
          <Vital
            icon="⚡"
            label="Énergie"
            value={companion.energy}
            max={companion.maxEnergy}
          />
        </div>

        <section className="mine-pet-care-section">
          <p className="eyebrow">🍖 NOURRIR</p>
          <h3>Provisions disponibles</h3>

          {foods.length === 0 ? (
            <div className="mine-pet-care-empty">
              Aucune provision disponible dans le sac.
            </div>
          ) : (
            <>
              <select
                value={effectiveFood}
                onChange={(event) =>
                  setSelectedFood(event.target.value)
                }
              >
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} ×{food.quantity} • ❤️ +{food.heal} •
                    ⚡ +{food.energy}
                    {food.preference
                      ? ` • ${food.preference}`
                      : ""}
                  </option>
                ))}
              </select>

              <button
                className="mine-pet-care-primary"
                disabled={busy || !effectiveFood}
                onClick={() => onFeed(effectiveFood)}
              >
                🍖 Nourrir {companion.name}
              </button>
            </>
          )}
        </section>

        <section className="mine-pet-care-section">
          <p className="eyebrow">💜 LIEN</p>
          <h3>Papouiller</h3>
          <p className="mine-pet-care-copy">
            La vraie récupération d'énergie, la confiance et le cooldown
            sont calculés par <code>pets.py</code>.
          </p>

          <button
            className="mine-pet-care-secondary"
            disabled={busy || companion.canPet === false}
            onClick={onCuddle}
          >
            💜 Papouiller
          </button>
        </section>

        <p className="mine-pet-care-note">
          Nourrir ou papouiller ne permet jamais de quitter un combat
          actif ni de contourner le moteur de la Mine.
        </p>
      </article>
    </div>
  );
}

function Vital({
  icon,
  label,
  value,
  max,
}: {
  icon: string;
  label: string;
  value?: number;
  max?: number;
}) {
  const known = value != null && max != null;
  const pct = known
    ? Math.max(
        0,
        Math.min(100, (value / Math.max(1, max)) * 100),
      )
    : 0;

  return (
    <div>
      <div>
        <span>{icon} {label}</span>
        <strong>
          {known ? `${value}/${max}` : "—"}
        </strong>
      </div>
      <div className="mine-pet-vital-track">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
