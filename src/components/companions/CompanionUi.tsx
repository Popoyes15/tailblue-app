import { useEffect, useMemo, useState } from "react";
import type {
  CompanionDefinitionDto,
  OwnedCompanionDto,
} from "../../types/companions";

export function ImageStage({
  image,
  alt,
  className = "",
  fallbackImages = [],
}: {
  image: string;
  alt: string;
  className?: string;
  fallbackImages?: string[];
}) {
  const candidates = useMemo(
    () => [image, ...fallbackImages].map((item) => String(item ?? "").trim()).filter(Boolean),
    [fallbackImages, image],
  );
  const candidateKey = candidates.join("\n");
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [candidateKey]);
  const current = candidates[index] ?? "";

  return (
    <div
      className={`tb-comp-image-stage ${className} ${current ? "" : "is-missing"}`}
      style={current ? { backgroundImage: `url("${current}")` } : undefined}
    >
      {current ? (
        <>
          <div className="tb-comp-image-blur" />
          <img
            src={current}
            alt={alt}
            draggable={false}
            onError={() => setIndex((old) => old + 1)}
          />
        </>
      ) : (
        <div className="tb-comp-image-placeholder" aria-label={alt}>
          <span>🐾</span><small>Illustration indisponible</small>
        </div>
      )}
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
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`tb-comp-statbar is-${kind}`}>
      <div className="tb-comp-statbar-label"><span>{icon} {label}</span><strong>{value}/{max}</strong></div>
      <div className="tb-comp-statbar-track"><div style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function OwnedState({ definition, owned }: { definition: CompanionDefinitionDto; owned?: OwnedCompanionDto }) {
  if (!owned) {
    return (
      <div className="tb-comp-owned-state is-unowned">
        <span>{definition.family === "dragons" ? "🥚" : "📖"}</span>
        <div><small>{definition.family === "dragons" ? "Éclosion" : "Catalogue"}</small><strong>{definition.rarity}</strong></div>
      </div>
    );
  }
  return (
    <div className="tb-comp-owned-state">
      <span>{owned.active ? "⚔️" : "🏠"}</span>
      <div><small>{owned.active ? "Équipe active" : "Au chenil"}</small><strong>Niveau {owned.level}</strong></div>
    </div>
  );
}
