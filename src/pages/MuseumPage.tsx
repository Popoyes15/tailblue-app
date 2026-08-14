import { useState } from "react";
import FilterSelect from "../components/FilterSelect";
import { MUSEUMS } from "../data/worldLocalData";
import "./remainingPages.css";

const CURRENT_MUSEUM_ID = "chateau";

const demoPieces = [
  { emoji: "🏔️", name: "Trophée — La Couronne ensevelie", rarity: "🟣 Épique", value: 0 },
  { emoji: "🌲", name: "Trophée — Quelque chose rôde à l'est", rarity: "🟣 Épique", value: 0 },
  { emoji: "🕷️", name: "Trophée — Les fils sous la chapelle", rarity: "🔵 Rare", value: 0 },
];

export default function MuseumPage() {
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [selectedId, setSelectedId] = useState(CURRENT_MUSEUM_ID);
  const [rarity, setRarity] = useState("all");

  const museums = scope === "mine"
    ? MUSEUMS.filter((item) => item.id === CURRENT_MUSEUM_ID)
    : MUSEUMS;

  const selected = museums.find((item) => item.id === selectedId) ?? museums[0] ?? MUSEUMS[0];
  const pieces = rarity === "all" ? demoPieces : demoPieces.filter((item) => item.rarity.includes(rarity));

  function changeScope(value: string) {
    const next = value as "mine" | "all";
    setScope(next);
    setSelectedId(next === "mine" ? CURRENT_MUSEUM_ID : MUSEUMS[0].id);
  }

  return (
    <section className="extra-page">
      <div className="extra-heading">
        <div>
          <p className="eyebrow">COLLECTION DU ROYAUME</p>
          <h2>Musée</h2>
          <p className="extra-muted">
            Expose les pièces rares de tes aventures et visite les différents styles de musée associés aux résidences.
          </p>
        </div>

        <FilterSelect
          value={scope}
          onChange={changeScope}
          options={[
            { value: "mine", label: "Mon musée" },
            { value: "all", label: "Tous les musées" },
          ]}
        />
      </div>

      <article className="museum-hero">
        <div className="museum-image" style={{ backgroundImage: `url("${selected.image}")` }}>
          <div />
          <img src={selected.image} alt={selected.name} />
        </div>
        <div className="museum-copy">
          <p className="eyebrow">{selected.id === CURRENT_MUSEUM_ID ? "👑 TON MUSÉE" : "APERÇU"}</p>
          <h2>{selected.name}</h2>
          <p>{selected.description}</p>
          <div className="museum-stats">
            <div><span>Pièces exposées</span><strong>Backend</strong></div>
            <div><span>Valeur estimée</span><strong>Backend</strong></div>
            <div><span>Rareté max</span><strong>Backend</strong></div>
          </div>
        </div>
      </article>

      {scope === "all" && (
        <div className="extra-thumb-grid">
          {museums.map((museum) => (
            <button
              key={museum.id}
              className={`extra-thumb ${museum.id === selected.id ? "selected" : ""}`}
              onClick={() => setSelectedId(museum.id)}
            >
              <div style={{ backgroundImage: `url("${museum.image}")` }}>
                <img src={museum.image} alt={museum.name} />
              </div>
              <span>{museum.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="collection-heading">
        <div><p className="eyebrow">VITRINES</p><h3>Collection</h3></div>
        <select value={rarity} onChange={(e) => setRarity(e.target.value)}>
          <option value="all">Toute la collection</option>
          <option value="Royal">👑 Royal</option>
          <option value="Mythique">🌌 Mythique</option>
          <option value="Légendaire">🟡 Légendaire</option>
          <option value="Épique">🟣 Épique</option>
          <option value="Rare">🔵 Rare</option>
        </select>
      </div>

      <div className="museum-piece-grid">
        {pieces.map((piece) => (
          <article key={piece.name} className="museum-piece">
            <span>{piece.emoji}</span>
            <div><small>{piece.rarity}</small><h3>{piece.name}</h3><p>Pièce destinée aux collections et chroniques.</p></div>
          </article>
        ))}
      </div>

      <div className="extra-note">
        🏛️ Les pièces affichées ici servent de démonstration visuelle. La vraie collection sera lue depuis <code>joueur["musee"]</code> et filtrée avec les raretés déjà prévues par le bot.
      </div>
    </section>
  );
}
