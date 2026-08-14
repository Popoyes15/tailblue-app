import { useMemo, useState } from "react";
import {
  DEMO_INVENTORY,
  ITEM_TYPE_OPTIONS,
  RARITY_OPTIONS,
  type InventoryItem,
} from "../data/playerLocalData";
import "./playerPages.css";

const statLabels: Record<string, string> = {
  hp: "❤️ PV",
  attack: "⚔️ Attaque",
  defense: "🛡️ Défense",
  crit: "🎯 Critique",
  dodge: "💨 Esquive",
  luck: "🍀 Chance",
};

export default function InventoryPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [rarity, setRarity] = useState("all");
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");

    return DEMO_INVENTORY.filter((item) => {
      const matchesQuery =
        !q ||
        item.name.toLocaleLowerCase("fr").includes(q) ||
        item.description.toLocaleLowerCase("fr").includes(q) ||
        item.lore?.toLocaleLowerCase("fr").includes(q);

      const matchesType = type === "all" || item.type === type;
      const matchesRarity = rarity === "all" || item.rarity === rarity;

      return matchesQuery && matchesType && matchesRarity;
    });
  }, [query, type, rarity]);

  const totalQuantity = filtered.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <section className="player-page">
      <div className="player-page-heading">
        <div>
          <p className="eyebrow">SAC DE L'AVENTURIER</p>
          <h2>Inventaire</h2>
          <p className="player-muted">
            Objets, matériaux, équipements, consommables, plans et reliques.
          </p>
        </div>

        <div className="inventory-summary">
          <span>{filtered.length} types</span>
          <strong>{totalQuantity} objets</strong>
        </div>
      </div>

      <div className="inventory-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un objet…"
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          {ITEM_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={rarity}
          onChange={(e) => setRarity(e.target.value)}
        >
          {RARITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="inventory-category-strip">
        {ITEM_TYPE_OPTIONS.slice(1).map((option) => (
          <button
            key={option.value}
            className={type === option.value ? "selected" : ""}
            onClick={() =>
              setType(type === option.value ? "all" : option.value)
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="inventory-empty">
          <span>🎒</span>
          <h3>Aucun objet ici</h3>
          <p>Modifie les filtres ou la recherche.</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {filtered.map((item) => (
            <button
              className={`inventory-item rarity-${item.rarity}`}
              key={item.id}
              onClick={() => setSelected(item)}
            >
              <div className="inventory-item-top">
                <span className="item-emoji">{item.emoji}</span>
                <span className="item-quantity">×{item.quantity}</span>
              </div>

              <span className="item-rarity">{item.rarityLabel}</span>
              <h3>{item.name}</h3>
              <p>{item.description}</p>

              {item.stats && (
                <div className="item-stat-preview">
                  {Object.entries(item.stats)
                    .filter(([, value]) => value !== 0)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <span key={key}>
                        {statLabels[key]?.replace(/^.\s/, "") || key} +{value}
                      </span>
                    ))}
                </div>
              )}

              <span className="inventory-detail-link">
                Voir les détails →
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="sync-note">
        <strong>🎒 Inventaire RPG canonique : inventaire_equipement</strong>
        <span>
          Les quantités de cette maquette sont temporaires. Le backend remplacera
          ce tableau par le contenu réel du joueur sans changer cette interface.
        </span>
      </div>

      {selected && (
        <div
          className="item-modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <article
            className="item-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="item-modal-close"
              onClick={() => setSelected(null)}
            >
              ×
            </button>

            <div className={`item-modal-icon rarity-${selected.rarity}`}>
              {selected.emoji}
            </div>

            <div className="item-modal-body">
              <p className="eyebrow">{selected.rarityLabel}</p>
              <h2>{selected.name}</h2>
              <p className="item-modal-description">
                {selected.description}
              </p>

              <div className="item-meta-grid">
                <div>
                  <span>Type</span>
                  <strong>{selected.type}</strong>
                </div>
                <div>
                  <span>Quantité possédée</span>
                  <strong>×{selected.quantity}</strong>
                </div>
                <div>
                  <span>Emplacement</span>
                  <strong>{selected.slot || "—"}</strong>
                </div>
                <div>
                  <span>Élément</span>
                  <strong>{selected.element || "—"}</strong>
                </div>
              </div>

              {selected.stats && (
                <>
                  <h3>Statistiques</h3>
                  <div className="item-detail-stats">
                    {Object.entries(selected.stats)
                      .filter(([, value]) => value !== 0)
                      .map(([key, value]) => (
                        <div key={key}>
                          <span>{statLabels[key] || key}</span>
                          <strong>+{value}</strong>
                        </div>
                      ))}
                  </div>
                </>
              )}

              {selected.effects && selected.effects.length > 0 && (
                <>
                  <h3>Effets</h3>
                  <div className="item-effect-list">
                    {selected.effects.map((effect, index) => (
                      <div key={index}>✦ {effect}</div>
                    ))}
                  </div>
                </>
              )}

              {selected.lore && (
                <>
                  <h3>Histoire</h3>
                  <p className="item-lore">{selected.lore}</p>
                </>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
