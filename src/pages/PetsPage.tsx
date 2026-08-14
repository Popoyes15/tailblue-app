import { useMemo, useState } from "react";
import { PETS } from "../data/tailblueLocalData";
import FilterSelect from "../components/FilterSelect";
import "./realPages.css";

// TEMPORAIRE : remplacé ensuite par les pets réellement possédés dans le profil TailBlue.
const CURRENT_PLAYER_OWNED_PET_IDS = new Set(["sugus"]);

export default function PetsPage() {
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [ownership, setOwnership] = useState<"owned" | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const families = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(PETS.map((pet) => pet.family).filter(Boolean))
      ).sort(),
    ],
    []
  );

  const filtered = PETS.filter((pet) => {
    const q = query.trim().toLocaleLowerCase("fr");

    const matchesQuery =
      !q ||
      pet.name.toLocaleLowerCase("fr").includes(q) ||
      pet.description.toLocaleLowerCase("fr").includes(q) ||
      pet.habitat.toLocaleLowerCase("fr").includes(q);

    const matchesFamily =
      family === "all" || pet.family === family;

    const matchesOwnership =
      ownership === "all" ||
      CURRENT_PLAYER_OWNED_PET_IDS.has(pet.id);

    return matchesQuery && matchesFamily && matchesOwnership;
  });

  const selected =
    PETS.find((pet) => pet.id === selectedId) ?? null;

  return (
    <section className="real-page">
      <div className="real-page-heading">
        <div>
          <p className="eyebrow">COMPAGNONS TAILBLUE</p>
          <h2>Pets</h2>
          <p className="real-muted">
            Consulte tes compagnons ou explore tous les familiers de TailBlue.
          </p>
        </div>

        <FilterSelect
          value={ownership}
          onChange={(value) =>
            setOwnership(value as "owned" | "all")
          }
          options={[
            { value: "owned", label: "Mes pets" },
            { value: "all", label: "Tous les pets" },
          ]}
        />
      </div>

      <div className="pets-toolbar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un compagnon…"
        />

        <select
          className="secondary-select"
          value={family}
          onChange={(e) => setFamily(e.target.value)}
        >
          {families.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "Toutes les familles" : value}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-filter-state">
          Aucun compagnon ne correspond à ces filtres.
        </div>
      ) : (
        <div className="pet-grid-real">
          {filtered.map((pet) => (
            <button
              key={pet.id}
              className="pet-card-real"
              onClick={() => setSelectedId(pet.id)}
            >
              <div
                className="pet-image-wrap"
                style={{ backgroundImage: `url("${pet.image}")` }}
              >
                <div className="pet-image-blur" />
                <img src={pet.image} alt={pet.name} />
              </div>

              <div className="pet-card-copy">
                <div className="pet-card-topline">
                  <span className="pet-rarity">
                    {pet.rarity || "Rareté inconnue"}
                  </span>

                  {CURRENT_PLAYER_OWNED_PET_IDS.has(pet.id) && (
                    <span className="owned-mini-badge">
                      ✓ Possédé
                    </span>
                  )}
                </div>

                <h3>{pet.name}</h3>
                <p>{pet.bonus || "Aucun bonus indiqué"}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div
          className="detail-backdrop"
          onClick={() => setSelectedId(null)}
        >
          <article
            className="detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="detail-close"
              onClick={() => setSelectedId(null)}
            >
              ×
            </button>

            <div
              className="detail-image-stage"
              style={{ backgroundImage: `url("${selected.image}")` }}
            >
              <div className="detail-image-blur" />
              <img src={selected.image} alt={selected.name} />
            </div>

            <div className="detail-body">
              <p className="eyebrow">{selected.rarity}</p>
              <h2>{selected.name}</h2>
              <p className="real-muted">
                {selected.description}
              </p>

              <div className="detail-meta-grid">
                <div>
                  <span>Habitat</span>
                  <strong>{selected.habitat || "—"}</strong>
                </div>
                <div>
                  <span>Tempérament</span>
                  <strong>{selected.temperament || "—"}</strong>
                </div>
                <div>
                  <span>Famille</span>
                  <strong>{selected.family || "—"}</strong>
                </div>
                <div>
                  <span>Bonus</span>
                  <strong>{selected.bonus || "—"}</strong>
                </div>
              </div>

              <h3>Statistiques</h3>
              <div className="stats-mini-grid">
                {Object.entries(selected.stats).map(
                  ([key, value]) => (
                    <div key={key}>
                      <span>{key}</span>
                      <strong>{value}</strong>
                    </div>
                  )
                )}
              </div>

              {selected.abilities.length > 0 && (
                <>
                  <h3>Capacités</h3>
                  <div className="ability-list">
                    {selected.abilities.map(
                      (ability, index) => (
                        <div
                          key={`${ability.nom}-${index}`}
                        >
                          <strong>
                            {ability.nom || "Capacité"}
                          </strong>
                          <span>
                            {ability.description || ""}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}

              {Object.keys(selected.forms).length > 0 && (
                <>
                  <h3>Formes</h3>
                  <div className="forms-row">
                    {Object.entries(selected.forms).map(
                      ([id, form]) => (
                        <div className="form-card" key={id}>
                          {form.image && (
                            <img
                              src={form.image}
                              alt={form.name}
                            />
                          )}
                          <strong>{form.name}</strong>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
