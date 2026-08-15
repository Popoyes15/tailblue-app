import { useMemo, useState } from "react";
import {
  GALLERY_ITEMS,
  type GalleryCategory,
  type GalleryItem,
} from "../data/worldData";
import "./worldFinal.css";

type Filter = "all" | GalleryCategory;

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "houses", label: "🏠 Maisons" },
  { id: "museums", label: "🏛️ Musées" },
  { id: "market", label: "🏘️ Marché" },
];

export default function GalleryPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const items = useMemo(
    () =>
      filter === "all"
        ? GALLERY_ITEMS
        : GALLERY_ITEMS.filter((item) => item.category === filter),
    [filter],
  );

  return (
    <section className="world-page">
      <header className="world-heading">
        <div>
          <span className="world-eyebrow">MONDE • ARCHIVES VISUELLES</span>
          <h1>🖼️ Galerie</h1>
          <p>
            Une galerie propre à l’application. Elle n’effectue aucune action
            gameplay et utilise uniquement les illustrations déjà présentes
            dans TailBlue.
          </p>
        </div>
        <div className="world-api-pill is-live">● Locale</div>
      </header>

      <div className="world-tabs">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            className={filter === entry.id ? "active" : ""}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="world-gallery-grid">
        {items.map((item) => (
          <button
            key={item.id}
            className="world-gallery-card"
            onClick={() => setSelected(item)}
          >
            <div>
              <img src={item.image} alt="" />
            </div>
            <span>
              <b>{item.title}</b>
              <small>{item.subtitle}</small>
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          className="world-modal-backdrop"
          role="presentation"
          onMouseDown={() => setSelected(null)}
        >
          <div
            className="world-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.title}
            onMouseDown={(event: { stopPropagation: () => void }) => event.stopPropagation()}
          >
            <button
              className="world-modal-close"
              onClick={() => setSelected(null)}
              aria-label="Fermer"
            >
              ×
            </button>
            <div className="world-modal-image">
              <div
                className="world-image-blur"
                style={{ backgroundImage: `url("${selected.image}")` }}
              />
              <img src={selected.image} alt={selected.title} />
            </div>
            <div className="world-modal-copy">
              <span className="world-kicker">{selected.category}</span>
              <h2>{selected.title}</h2>
              <p>{selected.subtitle}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
