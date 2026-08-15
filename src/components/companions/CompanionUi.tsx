import type {
  CompanionDefinitionDto,
  OwnedCompanionDto,
} from "../../types/companions";

export function ImageStage({
  image,
  alt,
  className = "",
}: {
  image: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`tb-comp-image-stage ${className}`}
      style={{ backgroundImage: `url("${image}")` }}
    >
      <div className="tb-comp-image-blur" />
      <img src={image} alt={alt} />
    </div>
  );
}

export function StatBar({
  label,
  value,
  max,
  icon,
  kind,
}: {
  label: string;
  value: number;
  max: number;
  icon: string;
  kind: "hp" | "energy" | "trust" | "xp";
}) {
  const pct = Math.max(
    0,
    Math.min(100, (value / Math.max(1, max)) * 100),
  );

  return (
    <div className={`tb-comp-statbar is-${kind}`}>
      <div className="tb-comp-statbar-label">
        <span>{icon} {label}</span>
        <strong>{value}/{max}</strong>
      </div>
      <div className="tb-comp-statbar-track">
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function OwnedState({
  definition,
  owned,
}: {
  definition: CompanionDefinitionDto;
  owned?: OwnedCompanionDto;
}) {
  if (!owned) {
    return (
      <div className="tb-comp-owned-state is-unowned">
        <span>📖</span>
        <div>
          <small>Catalogue</small>
          <strong>{definition.rarity}</strong>
        </div>
      </div>
    );
  }

  return (
    <div className="tb-comp-owned-state">
      <span>{owned.active ? "⚔️" : "🏠"}</span>
      <div>
        <small>{owned.active ? "Équipe active" : "Au chenil"}</small>
        <strong>Niveau {owned.level}</strong>
      </div>
    </div>
  );
}
