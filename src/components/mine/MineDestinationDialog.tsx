import { createPortal } from "react-dom";
import type { MineDestination } from "../../types/mine";

type Props = {
  mode: "entry" | "teleport";
  destinations: MineDestination[];
  busy?: boolean;
  companionLabel?: string;
  onSelect: (destination: MineDestination) => void;
  onClose: () => void;
};

function destinationIcon(destination: MineDestination) {
  if (destination.kind === "resume") return "🧭";
  if (destination.kind === "entrance") return "🚪";
  return "🏕️";
}

export default function MineDestinationDialog({
  mode,
  destinations,
  busy = false,
  companionLabel,
  onSelect,
  onClose,
}: Props) {
  const entry = mode === "entry";

  return createPortal(
    <div
      className="tm-destination-overlay"
      onMouseDown={() => !busy && onClose()}
    >
      <section
        className="tm-destination-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={entry ? "Choisir un point de descente" : "Téléportation Mine"}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className="tm-kicker">
              {entry ? "PRÉPARATION · DESCENTE" : "RÉSEAU DES REFUGES"}
            </p>
            <h2>
              {entry ? "Où veux-tu descendre ?" : "Choisis ta destination"}
            </h2>
            <p>
              {entry
                ? "Reprends exactement où tu t'étais arrêtée ou utilise un Refuge que tu as construit."
                : "Une salle de repos sûre peut activer le réseau. Seuls l'entrée et les Refuges construits sont des destinations permanentes."}
            </p>
          </div>
          <button type="button" disabled={busy} onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        {entry && companionLabel && (
          <div className="tm-destination-expedition">
            <span>🐾</span>
            <div>
              <small>EXPÉDITION</small>
              <strong>{companionLabel}</strong>
            </div>
          </div>
        )}

        <div className="tm-destination-list">
          {destinations.map((destination) => (
            <button
              type="button"
              key={destination.id}
              disabled={busy}
              onClick={() => onSelect(destination)}
              className={`is-${destination.kind}`}
            >
              <span className="tm-destination-icon">
                {destinationIcon(destination)}
              </span>
              <div>
                <strong>{destination.label}</strong>
                <small>{destination.description}</small>
              </div>
              <b>→</b>
            </button>
          ))}
        </div>

        <footer>
          <span>
            {entry
              ? "Les salles de repos temporaires ne sont jamais proposées comme point de départ."
              : "Téléportation impossible en combat ou depuis une salle dangereuse."}
          </span>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
