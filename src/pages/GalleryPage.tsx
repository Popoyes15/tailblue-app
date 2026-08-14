import { useMemo, useState } from "react";
import { HOUSES, PETS } from "../data/tailblueLocalData";
import { DRAGONS, KENNELS, MUSEUMS, PROVISION_LEVELS } from "../data/worldLocalData";
import "./remainingPages.css";

type GalleryAsset = { id: string; category: string; name: string; image: string; subtitle: string };

export default function GalleryPage() {
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<GalleryAsset | null>(null);

  const assets = useMemo<GalleryAsset[]>(() => [
    ...PETS.map((pet) => ({ id: `pet-${pet.id}`, category: "pets", name: pet.name, image: pet.image, subtitle: pet.rarity })),
    ...DRAGONS.map((dragon) => ({ id: `dragon-${dragon.id}`, category: "dragons", name: dragon.name, image: dragon.image, subtitle: dragon.rarity })),
    ...HOUSES.map((house) => ({ id: `house-${house.id}`, category: "houses", name: house.name, image: house.image, subtitle: "Résidence" })),
    ...KENNELS.map((kennel) => ({ id: `kennel-${kennel.id}`, category: "kennels", name: kennel.name, image: kennel.image, subtitle: "Chenil" })),
    ...PROVISION_LEVELS.map((item) => ({ id: `provision-${item.level}`, category: "provisions", name: item.name, image: item.image, subtitle: `Niveau ${item.level}` })),
    ...MUSEUMS.map((museum) => ({ id: `museum-${museum.id}`, category: "museums", name: museum.name, image: museum.image, subtitle: "Musée" })),
  ], []);

  const filtered = category === "all" ? assets : assets.filter((asset) => asset.category === category);

  const categories = [
    ["all", "Tout"],
    ["pets", "Pets"],
    ["dragons", "Dragons"],
    ["houses", "Maisons"],
    ["kennels", "Chenils"],
    ["provisions", "Provisions"],
    ["museums", "Musées"],
  ];

  return (
    <section className="extra-page">
      <div className="extra-heading">
        <div>
          <p className="eyebrow">ARCHIVES VISUELLES</p>
          <h2>Galerie</h2>
          <p className="extra-muted">
            Parcours les illustrations locales utilisées dans TailBlue.
          </p>
        </div>
        <span className="source-badge">{filtered.length} visuels</span>
      </div>

      <div className="gallery-filters">
        {categories.map(([id, label]) => (
          <button key={id} className={category === id ? "selected" : ""} onClick={() => setCategory(id)}>
            {label}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        {filtered.map((asset) => (
          <button key={asset.id} className="gallery-tile" onClick={() => setSelected(asset)}>
            <div style={{ backgroundImage: `url("${asset.image}")` }}>
              <span />
              <img src={asset.image} alt={asset.name} />
            </div>
            <section><small>{asset.subtitle}</small><strong>{asset.name}</strong></section>
          </button>
        ))}
      </div>

      {selected && (
        <div className="gallery-lightbox" onClick={() => setSelected(null)}>
          <article onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)}>×</button>
            <div className="lightbox-image" style={{ backgroundImage: `url("${selected.image}")` }}>
              <span />
              <img src={selected.image} alt={selected.name} />
            </div>
            <div className="lightbox-copy"><small>{selected.subtitle}</small><h2>{selected.name}</h2><code>{selected.image}</code></div>
          </article>
        </div>
      )}
    </section>
  );
}
