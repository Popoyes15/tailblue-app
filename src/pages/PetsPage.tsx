import { useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import {
  companionApi,
  companionApiConfigured,
} from "../api/companionApi";
import {
  ImageStage,
  OwnedState,
  StatBar,
} from "../components/companions/CompanionUi";
import { PETS } from "../data/companionsLocalData";
import type {
  CompanionDefinitionDto,
  CompanionSnapshotDto,
  OwnedCompanionDto,
} from "../types/companions";
import "../components/companions/companionsFinal.css";

type Scope = "owned" | "catalog";

function localCatalog(): CompanionDefinitionDto[] {
  return PETS.map((pet) => ({
    id: pet.id,
    name: pet.name,
    image: pet.image,
    description: pet.description,
    bonus: pet.bonus,
    rarity: pet.rarity,
    habitat: pet.habitat,
    temperament: pet.temperament,
    family: pet.family,
    story:
      (pet as typeof pet & { story?: string; histoire?: string }).story ??
      (pet as typeof pet & { story?: string; histoire?: string }).histoire ??
      undefined,
    stats: pet.stats,
    abilities: pet.abilities.map((ability) => ({
      name: ability.nom ?? "Capacité",
      description: ability.description ?? "",
    })),
    forms: Object.entries(pet.forms).map(([id, form]) => ({
      id,
      name: form.name,
      image: form.image,
      description: form.description,
      title: form.title,
    })),
  }));
}

export default function PetsPage() {
  const [snapshot, setSnapshot] = useState<CompanionSnapshotDto>({
    catalog: localCatalog(),
    owned: [],
  });
  const [scope, setScope] = useState<Scope>(
    companionApiConfigured ? "owned" : "catalog",
  );
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [nickname, setNickname] = useState("");
  const [storyOpen, setStoryOpen] = useState(false);

  useEffect(() => {
    if (!companionApiConfigured) return;

    companionApi
      .getCompanions()
      .then(setSnapshot)
      .catch(() => {
        // On conserve le catalogue local pour que l'app ne casse jamais.
      });
  }, []);

  const ownedMap = useMemo(
    () => new Map(snapshot.owned.map((pet) => [pet.id, pet])),
    [snapshot.owned],
  );

  const families = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(snapshot.catalog.map((pet) => pet.family).filter(Boolean)),
      ).sort(),
    ],
    [snapshot.catalog],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");

    return snapshot.catalog.filter((pet) => {
      if (scope === "owned" && !ownedMap.has(pet.id)) return false;
      if (family !== "all" && pet.family !== family) return false;

      if (!q) return true;

      return [
        pet.name,
        pet.description,
        pet.habitat,
        pet.temperament,
        pet.bonus,
      ]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(q);
    });
  }, [family, ownedMap, query, scope, snapshot.catalog]);

  const selected =
    snapshot.catalog.find((pet) => pet.id === selectedId) ?? null;
  const selectedOwned = selected
    ? ownedMap.get(selected.id)
    : undefined;

  async function toggleActive(owned: OwnedCompanionDto) {
    if (!companionApiConfigured || busy) return;

    try {
      setBusy(true);
      setMessage("");
      const next = await companionApi.setActive(
        owned.id,
        !owned.active,
      );
      setSnapshot(next);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier l'équipe.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function petCompanion(owned: OwnedCompanionDto) {
    if (!companionApiConfigured || busy) return;

    try {
      setBusy(true);
      setMessage("");
      const next = await companionApi.pet(owned.id);
      setSnapshot(next);
      setMessage("💜 Papouille enregistrée par TailBlue.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de papouiller ce compagnon.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function renameCompanion(owned: OwnedCompanionDto) {
    const value = nickname.trim();
    if (!companionApiConfigured || busy || !value) return;

    try {
      setBusy(true);
      setMessage("");
      const next = await companionApi.rename(owned.id, value);
      setSnapshot(next);
      setNickname("");
      setMessage("✏️ Surnom enregistré.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de modifier le surnom.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tb-comp-page">
      <header className="tb-comp-heading">
        <div>
          <p className="tb-comp-eyebrow">🐾 COMPAGNONS TAILBLUE</p>
          <h1>Pets</h1>
          <p>
            Tes compagnons ne sont pas de simples bonus : niveau, XP,
            confiance, PV, énergie, capacités et formes sont conservés par
            le moteur TailBlue.
          </p>
        </div>

        <div className="tb-comp-source">
          <i />
          {companionApiConfigured
            ? "Backend TailBlue"
            : "Catalogue local"}
        </div>
      </header>

      <div className="tb-comp-toolbar">
        <div className="tb-comp-segmented">
          <button
            className={scope === "owned" ? "is-active" : ""}
            onClick={() => setScope("owned")}
          >
            🐾 Mes compagnons
          </button>
          <button
            className={scope === "catalog" ? "is-active" : ""}
            onClick={() => setScope("catalog")}
          >
            📚 Catalogue
          </button>
        </div>

        <input
          value={query}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
          placeholder="Rechercher un compagnon…"
        />

        <select
          value={family}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => setFamily(event.target.value)}
        >
          {families.map((value) => (
            <option key={value} value={value}>
              {value === "all" ? "Toutes les familles" : value}
            </option>
          ))}
        </select>
      </div>

      {!companionApiConfigured && scope === "owned" ? (
        <div className="tb-comp-empty">
          <span>🔌</span>
          <h2>Les vrais compagnons apparaîtront ici.</h2>
          <p>
            En local, TailBlue ne prétend pas connaître les pets possédés.
            Passe sur Catalogue pour tester l'interface.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="tb-comp-empty">
          <span>🐾</span>
          <h2>Aucun compagnon trouvé.</h2>
          <p>Modifie les filtres ou la recherche.</p>
        </div>
      ) : (
        <div className="tb-comp-pet-grid">
          {visible.map((pet) => {
            const owned = ownedMap.get(pet.id);

            return (
              <button
                className="tb-comp-pet-card"
                key={pet.id}
                onClick={() => {
                  setSelectedId(pet.id);
                  setMessage("");
                  setNickname("");
                  setStoryOpen(false);
                }}
              >
                <ImageStage
                  image={owned?.currentImage || pet.image}
                  alt={owned?.displayName || pet.name}
                  className="tb-comp-pet-card-image"
                />

                <div className="tb-comp-pet-card-body">
                  <div className="tb-comp-pet-card-top">
                    <span>{pet.rarity}</span>
                    {owned && <b>✓ Possédé</b>}
                  </div>

                  <h3>{owned?.displayName || pet.name}</h3>
                  <p>{pet.bonus}</p>

                  <OwnedState definition={pet} owned={owned} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="tb-comp-modal-backdrop"
          onClick={() => { setSelectedId(null); setStoryOpen(false); }}
        >
          <article
            className="tb-comp-modal"
            onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
          >
            <button
              className="tb-comp-modal-close"
              onClick={() => { setSelectedId(null); setStoryOpen(false); }}
            >
              ×
            </button>

            <ImageStage
              image={selectedOwned?.currentImage || selected.image}
              alt={selectedOwned?.displayName || selected.name}
              className="tb-comp-detail-image"
            />

            <div className="tb-comp-detail-body">
              <div className="tb-comp-detail-title">
                <div>
                  <p className="tb-comp-eyebrow">{selected.rarity}</p>
                  <h2>{selectedOwned?.displayName || selected.name}</h2>
                  {selectedOwned?.nickname && (
                    <small>{selected.name}</small>
                  )}
                </div>

                {selectedOwned && (
                  <span className="tb-comp-level-pill">
                    Niv. {selectedOwned.level}
                  </span>
                )}
              </div>

              <p className="tb-comp-detail-description">
                {selected.description}
              </p>

              <div
                role="button"
                tabIndex={0}
                aria-expanded={storyOpen}
                onClick={() => setStoryOpen((old) => !old)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setStoryOpen((old) => !old);
                  }
                }}
                style={{
                  width: "100%",
                  minHeight: 58,
                  display: "grid",
                  gridTemplateColumns: "40px minmax(0, 1fr) 24px",
                  alignItems: "center",
                  gap: 11,
                  margin: "4px 0 17px",
                  padding: "9px 12px",
                  boxSizing: "border-box",
                  border: storyOpen
                    ? "1px solid rgba(184, 143, 255, 0.38)"
                    : "1px solid rgba(153, 120, 223, 0.18)",
                  borderRadius: 13,
                  background: storyOpen
                    ? "linear-gradient(135deg, rgba(70,49,112,.40), rgba(21,36,66,.92))"
                    : "linear-gradient(135deg, rgba(30,42,75,.88), rgba(15,28,54,.92))",
                  color: "#dce6f4",
                  cursor: "pointer",
                  userSelect: "none",
                  outline: "none",
                  boxShadow: storyOpen
                    ? "0 0 22px rgba(149,104,224,.10), inset 0 1px 0 rgba(255,255,255,.03)"
                    : "0 8px 18px rgba(0,0,0,.10), inset 0 1px 0 rgba(255,255,255,.025)",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    display: "grid",
                    placeItems: "center",
                    border: "1px solid rgba(179,139,244,.14)",
                    borderRadius: 11,
                    background: "rgba(165,125,229,.10)",
                    fontSize: 18,
                  }}
                >
                  📖
                </div>

                <div style={{ minWidth: 0 }}>
                  <small
                    style={{
                      display: "block",
                      marginBottom: 3,
                      color: "#7d91ab",
                      fontSize: 7,
                      fontWeight: 900,
                      letterSpacing: ".14em",
                      lineHeight: 1.2,
                    }}
                  >
                    CHRONIQUES
                  </small>
                  <strong
                    style={{
                      display: "block",
                      color: "#d9e4f2",
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: 11,
                      fontWeight: 700,
                      lineHeight: 1.25,
                    }}
                  >
                    Histoire du compagnon
                  </strong>
                </div>

                <span
                  style={{
                    width: 24,
                    color: storyOpen ? "#c6a8f2" : "#9d84ca",
                    fontSize: 15,
                    textAlign: "center",
                    lineHeight: 1,
                  }}
                >
                  {storyOpen ? "⌃" : "⌄"}
                </span>
              </div>

              {storyOpen && (
                <section className="tb-comp-story-panel">
                  <div className="tb-comp-story-heading">
                    <span>📖</span>
                    <div>
                      <p className="tb-comp-eyebrow">CHRONIQUES DU COMPAGNON</p>
                      <h3>
                        {selectedOwned?.displayName || selected.name}
                      </h3>
                    </div>
                  </div>

                  <div className="tb-comp-story-text">
                    {selected.story ? (
                      selected.story
                        .split(/\n{2,}/)
                        .map((paragraph, index) => (
                          <p key={`${selected.id}-story-${index}`}>
                            {paragraph}
                          </p>
                        ))
                    ) : (
                      <p>
                        {companionApiConfigured
                          ? "Aucune chronique connue pour ce compagnon."
                          : "La vraie chronique de ce compagnon sera chargée depuis pets.py lorsque le backend TailBlue sera connecté."}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {selectedOwned && (
                <div className="tb-comp-live-stats">
                  <StatBar
                    label="PV"
                    value={selectedOwned.hp}
                    max={selectedOwned.maxHp}
                    icon="❤️"
                    kind="hp"
                  />
                  <StatBar
                    label="Énergie"
                    value={selectedOwned.energy}
                    max={selectedOwned.maxEnergy}
                    icon="⚡"
                    kind="energy"
                  />
                  <StatBar
                    label="Confiance"
                    value={selectedOwned.affection}
                    max={100}
                    icon="💜"
                    kind="trust"
                  />
                  <StatBar
                    label="XP"
                    value={selectedOwned.xp}
                    max={Math.max(1, selectedOwned.xpForNextLevel ?? 100)}
                    icon="✨"
                    kind="xp"
                  />
                </div>
              )}

              <div className="tb-comp-meta-grid">
                <Meta label="Habitat" value={selected.habitat} />
                <Meta label="Tempérament" value={selected.temperament} />
                <Meta label="Famille" value={selected.family} />
                <Meta
                  label="Relation"
                  value={selectedOwned?.trustLabel ?? "—"}
                />
              </div>

              <section className="tb-comp-section">
                <p className="tb-comp-eyebrow">⭐ POUVOIR</p>
                <div className="tb-comp-power">{selected.bonus}</div>
              </section>

              <section className="tb-comp-section">
                <p className="tb-comp-eyebrow">⚔️ STATISTIQUES</p>
                <div className="tb-comp-number-grid">
                  {Object.entries(selected.stats).map(([key, value]) => (
                    <div key={key}>
                      <small>{key}</small>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              {selected.abilities.length > 0 && (
                <section className="tb-comp-section">
                  <p className="tb-comp-eyebrow">✨ CAPACITÉS</p>
                  <div className="tb-comp-ability-list">
                    {selected.abilities.map((ability, index) => (
                      <div key={`${ability.name}-${index}`}>
                        <strong>{ability.name}</strong>
                        <p>{ability.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selected.forms.length > 0 && (
                <section className="tb-comp-section">
                  <p className="tb-comp-eyebrow">🌙 FORMES</p>
                  <div className="tb-comp-form-grid">
                    {selected.forms.map((form) => (
                      <div key={form.id}>
                        {form.image && (
                          <ImageStage
                            image={form.image}
                            alt={form.name}
                            className="tb-comp-form-image"
                          />
                        )}
                        <strong>{form.name}</strong>
                        {form.title && <small>{form.title}</small>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {selectedOwned && (
                <section className="tb-comp-owned-actions">
                  <div>
                    <button
                      onClick={() => toggleActive(selectedOwned)}
                      disabled={busy}
                    >
                      {selectedOwned.active
                        ? "🏠 Mettre au chenil"
                        : "⚔️ Activer"}
                    </button>
                    <button
                      onClick={() => petCompanion(selectedOwned)}
                      disabled={busy}
                    >
                      💜 Papouiller
                    </button>
                  </div>

                  {selectedOwned.canRename && (
                    <div className="tb-comp-rename">
                      <input
                        value={nickname}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          setNickname(event.target.value)
                        }
                        maxLength={24}
                        placeholder="Nouveau surnom…"
                      />
                      <button
                        onClick={() => renameCompanion(selectedOwned)}
                        disabled={busy || !nickname.trim()}
                      >
                        ✏️ Renommer
                      </button>
                    </div>
                  )}

                  {message && (
                    <p className="tb-comp-action-message">{message}</p>
                  )}

                  {!companionApiConfigured && (
                    <p className="tb-comp-preview-note">
                      Les actions sont activées uniquement lorsque le backend
                      TailBlue authentifié est connecté.
                    </p>
                  )}
                </section>
              )}
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <small>{label}</small>
      <strong>{value || "—"}</strong>
    </div>
  );
}
