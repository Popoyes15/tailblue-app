import { useEffect, useMemo, useState, type ChangeEvent, type MouseEvent } from "react";
import {
  companionApi,
  companionApiConfigured,
  getCachedCompanionSnapshot,
} from "../api/companionApi";
import CompanionNotice, {
  type CompanionNoticeData,
} from "../components/companions/CompanionNotice";
import { CompanionStory, plainTailBlueText } from "../components/companions/CompanionStory";
import { ImageStage, OwnedState, StatBar } from "../components/companions/CompanionUi";
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

function isDragon(definition: CompanionDefinitionDto) {
  return definition.family === "dragons";
}

export default function PetsPage() {
  const cachedSnapshot = companionApiConfigured ? getCachedCompanionSnapshot() : null;
  const [snapshot, setSnapshot] = useState<CompanionSnapshotDto | null>(
    companionApiConfigured ? cachedSnapshot : { catalog: localCatalog(), owned: [] },
  );
  const [loading, setLoading] = useState(companionApiConfigured && !cachedSnapshot);
  const [scope, setScope] = useState<Scope>(companionApiConfigured ? "owned" : "catalog");
  const [query, setQuery] = useState("");
  const [family, setFamily] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [nickname, setNickname] = useState("");
  const [storyOpen, setStoryOpen] = useState(false);
  const [notice, setNotice] = useState<CompanionNoticeData | null>(null);

  useEffect(() => {
    if (!companionApiConfigured) return;
    let cancelled = false;

    void companionApi
      .getCompanions()
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch((error) => {
        if (!cancelled && !getCachedCompanionSnapshot()) {
          setNotice({
            icon: "⚠️",
            title: "Bestiaire indisponible",
            message: error instanceof Error ? error.message : "Impossible de charger les compagnons TailBlue.",
            tone: "error",
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const catalog = snapshot?.catalog ?? [];
  const owned = snapshot?.owned ?? [];

  const ownedMap = useMemo(
    () => new Map(owned.map((pet) => [pet.id, pet])),
    [owned],
  );

  const families = useMemo(
    () => [
      "all",
      ...Array.from(new Set(catalog.map((pet) => pet.family).filter(Boolean))).sort(),
    ],
    [catalog],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");

    return catalog.filter((pet) => {
      if (scope === "owned" && !ownedMap.has(pet.id)) return false;
      if (family !== "all" && pet.family !== family) return false;
      if (!q) return true;

      return [
        pet.name,
        pet.description,
        pet.habitat,
        pet.temperament,
        pet.bonus,
        plainTailBlueText(pet.story),
      ]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(q);
    });
  }, [catalog, family, ownedMap, query, scope]);

  const selected = catalog.find((pet) => pet.id === selectedId) ?? null;
  const selectedOwned = selected ? ownedMap.get(selected.id) : undefined;

  if (loading && !snapshot) {
    return (
      <section className="tb-comp-page tb-comp-loading-page">
        <div className="tb-comp-loading-orb">🐾</div>
        <p className="tb-comp-eyebrow">SANCTUAIRE DES COMPAGNONS</p>
        <h1>Le bestiaire s'ouvre…</h1>
        <p>TailBlue récupère tes compagnons auprès du Royaume.</p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="tb-comp-page tb-comp-loading-page">
        <div className="tb-comp-loading-orb">⚠️</div>
        <h1>Le bestiaire ne répond pas.</h1>
        <p>Le dernier état réel n'était pas encore disponible sur cet appareil.</p>
        <CompanionNotice notice={notice} onClose={() => setNotice(null)} />
      </section>
    );
  }

  async function toggleActive(pet: OwnedCompanionDto) {
    if (!companionApiConfigured || busy) return;
    try {
      setBusy(true);
      const next = await companionApi.setActive(pet.id, !pet.active);
      setSnapshot(next);
      setNotice({
        icon: pet.active ? "🏠" : "⚔️",
        title: pet.active ? "Retour au sanctuaire" : "Équipe mise à jour",
        message: pet.active
          ? `${pet.displayName} se repose maintenant au chenil.`
          : `${pet.displayName} rejoint ton équipe active.`,
        tone: "success",
      });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Équipe inchangée", message: error instanceof Error ? error.message : "Action impossible.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function petCompanion(pet: OwnedCompanionDto) {
    if (!companionApiConfigured || busy) return;
    try {
      setBusy(true);
      const result = await companionApi.pet(pet.id);
      setSnapshot(result.companions);
      setNotice({
        icon: "💜",
        title: `Un moment avec ${pet.displayName}`,
        message: result.text || `${pet.displayName} profite de la papouille.`,
        tone: "success",
        stats: [
          ...(result.energyGain ? [{ icon: "⚡", label: `+${result.energyGain} énergie` }] : []),
          ...(result.affectionGain ? [{ icon: "💜", label: `+${result.affectionGain} confiance` }] : []),
        ],
      });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Pas maintenant", message: error instanceof Error ? error.message : "Papouille impossible.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function renameCompanion(pet: OwnedCompanionDto) {
    const value = nickname.trim();
    if (!companionApiConfigured || busy || !value) return;
    try {
      setBusy(true);
      const next = await companionApi.rename(pet.id, value);
      setSnapshot(next);
      setNickname("");
      setNotice({ icon: "✏️", title: "Nouveau surnom", message: `${pet.displayName} répond désormais à « ${value} » dans TailBlue.`, tone: "success" });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Surnom refusé", message: error instanceof Error ? error.message : "Impossible de modifier le surnom.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function adoptCompanion(definition: CompanionDefinitionDto) {
    if (!companionApiConfigured || busy || !definition.adoptable) return;
    try {
      setBusy(true);
      const result = await companionApi.adopt(definition.id);
      setSnapshot(result.companions);
      setNotice({
        icon: "🐾",
        title: "Nouveau compagnon !",
        message: result.text,
        tone: "success",
        stats: result.price > 0 ? [{ icon: "🍪", label: `${new Intl.NumberFormat("fr-CH").format(result.price)} cookies` }] : undefined,
      });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Adoption impossible", message: error instanceof Error ? error.message : "TailBlue a refusé l'adoption.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tb-comp-page tb-pets-v3-page">
      <header className="tb-comp-heading">
        <div>
          <p className="tb-comp-eyebrow">🐾 COMPAGNONS TAILBLUE</p>
          <h1>Pets</h1>
          <p>
            Catalogue, chroniques, adoption et progression réelle : les cartes viennent du moteur Python et « Mes compagnons » reste synchronisé avec ton compte Discord.
          </p>
        </div>
        <div className="tb-comp-source"><i />{companionApiConfigured ? "Backend TailBlue" : "Catalogue local"}</div>
      </header>

      <div className="tb-comp-toolbar">
        <div className="tb-comp-segmented">
          <button className={scope === "owned" ? "is-active" : ""} onClick={() => setScope("owned")}>🐾 Mes compagnons</button>
          <button className={scope === "catalog" ? "is-active" : ""} onClick={() => setScope("catalog")}>📚 Catalogue</button>
        </div>
        <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Rechercher un compagnon, une chronique…" />
        <select value={family} onChange={(event: ChangeEvent<HTMLSelectElement>) => setFamily(event.target.value)}>
          {families.map((value) => <option key={value} value={value}>{value === "all" ? "Toutes les familles" : value}</option>)}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="tb-comp-empty"><span>🐾</span><h2>Aucun compagnon trouvé.</h2><p>Modifie les filtres ou la recherche.</p></div>
      ) : (
        <div className="tb-comp-pet-grid">
          {visible.map((pet) => {
            const petOwned = ownedMap.get(pet.id);
            return (
              <button
                className="tb-comp-pet-card"
                key={pet.id}
                onClick={() => {
                  setSelectedId(pet.id);
                  setNickname("");
                  setStoryOpen(false);
                }}
              >
                <ImageStage image={petOwned?.currentImage || pet.image} fallbackImages={pet.forms.map((form) => form.image ?? "")} alt={petOwned?.displayName || pet.name} className="tb-comp-pet-card-image" />
                <div className="tb-comp-pet-card-body">
                  <div className="tb-comp-pet-card-top"><span>{pet.rarity}</span>{petOwned && <b>✓ Possédé</b>}</div>
                  <h3>{petOwned?.displayName || pet.name}</h3>
                  <p>{pet.bonus}</p>
                  <OwnedState definition={pet} owned={petOwned} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="tb-comp-modal-backdrop" onClick={() => { setSelectedId(null); setStoryOpen(false); }}>
          <article className="tb-comp-modal tb-comp-modal-v3" onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
            <button className="tb-comp-modal-close" onClick={() => { setSelectedId(null); setStoryOpen(false); }}>×</button>

            <div className="tb-comp-detail-hero-v3">
              <ImageStage image={selectedOwned?.currentImage || selected.image} fallbackImages={selected.forms.map((form) => form.image ?? "")} alt={selectedOwned?.displayName || selected.name} className="tb-comp-detail-image-v3" />
              <div className="tb-comp-detail-hero-shade" />
              <div className="tb-comp-detail-hero-copy">
                <p className="tb-comp-eyebrow">{selected.rarity}</p>
                <h2>{selectedOwned?.displayName || selected.name}</h2>
                <p>{selected.description}</p>
              </div>
              {selectedOwned && <span className="tb-comp-level-pill tb-comp-level-pill-v3">Niv. {selectedOwned.level}</span>}
            </div>

            <div className="tb-comp-detail-body tb-comp-detail-body-v3">
              <button className={`tb-story-toggle-v3 ${storyOpen ? "is-open" : ""}`} onClick={() => setStoryOpen((old) => !old)}>
                <span>📖</span><div><small>CHRONIQUES</small><strong>Histoire du compagnon</strong></div><b>{storyOpen ? "⌃" : "⌄"}</b>
              </button>

              {storyOpen && (
                <section className="tb-comp-story-panel tb-comp-story-panel-v3">
                  <div className="tb-comp-story-heading"><span>📖</span><div><p className="tb-comp-eyebrow">CHRONIQUES DU COMPAGNON</p><h3>{selectedOwned?.displayName || selected.name}</h3></div></div>
                  <CompanionStory story={selected.story} />
                </section>
              )}

              {selectedOwned && (
                <div className="tb-comp-live-stats">
                  <StatBar label="PV" value={selectedOwned.hp} max={selectedOwned.maxHp} icon="❤️" kind="hp" />
                  <StatBar label="Énergie" value={selectedOwned.energy} max={selectedOwned.maxEnergy} icon="⚡" kind="energy" />
                  <StatBar label="Confiance" value={selectedOwned.affection} max={100} icon="💜" kind="trust" />
                  <StatBar label="XP" value={selectedOwned.xp} max={Math.max(1, selectedOwned.xpForNextLevel ?? 100)} icon="✨" kind="xp" />
                </div>
              )}

              <div className="tb-comp-meta-grid">
                <Meta label="Habitat" value={selected.habitat} />
                <Meta label="Tempérament" value={selected.temperament} />
                <Meta label="Famille" value={selected.family} />
                <Meta label="Relation" value={selectedOwned?.trustLabel ?? "—"} />
              </div>

              <section className="tb-comp-section"><p className="tb-comp-eyebrow">⭐ POUVOIR</p><div className="tb-comp-power">{selected.bonus}</div></section>

              <section className="tb-comp-section">
                <p className="tb-comp-eyebrow">⚔️ STATISTIQUES</p>
                <div className="tb-comp-number-grid">{Object.entries(selected.stats).map(([key, value]) => <div key={key}><small>{key}</small><strong>{value}</strong></div>)}</div>
              </section>

              {selected.abilities.length > 0 && (
                <section className="tb-comp-section"><p className="tb-comp-eyebrow">✨ CAPACITÉS</p><div className="tb-comp-ability-list">{selected.abilities.map((ability, index) => <div key={`${ability.name}-${index}`}><strong>{ability.name}</strong><p>{ability.description}</p></div>)}</div></section>
              )}

              {selected.forms.length > 0 && (
                <section className="tb-comp-section"><p className="tb-comp-eyebrow">🌙 FORMES</p><div className="tb-comp-form-grid">{selected.forms.map((form) => <div key={form.id}>{form.image && <ImageStage image={form.image} alt={form.name} className="tb-comp-form-image" />}<strong>{form.name}</strong>{form.title && <small>{form.title}</small>}</div>)}</div></section>
              )}

              {selectedOwned ? (
                <section className="tb-comp-owned-actions tb-comp-owned-actions-v3">
                  <div className="tb-pet-action-grid-v3">
                    <button onClick={() => void toggleActive(selectedOwned)} disabled={busy}>{selectedOwned.active ? "🏠 Mettre au repos" : "⚔️ Activer"}</button>
                    <button onClick={() => void petCompanion(selectedOwned)} disabled={busy}>💜 Papouiller</button>
                  </div>
                  <div className="tb-comp-rename tb-comp-rename-v3">
                    <input value={nickname} onChange={(event: ChangeEvent<HTMLInputElement>) => setNickname(event.target.value)} maxLength={24} placeholder={selectedOwned.canRename ? "Nouveau surnom…" : "Surnom disponible au niveau 10"} disabled={!selectedOwned.canRename} />
                    <button onClick={() => void renameCompanion(selectedOwned)} disabled={busy || !selectedOwned.canRename || !nickname.trim()}>✏️ Renommer</button>
                  </div>
                </section>
              ) : (
                <section className="tb-adoption-v3">
                  {isDragon(selected) ? (
                    <div className="tb-special-obtention-v3"><span>🥚</span><div><strong>Lignée de l'Œuf des Origines</strong><p>Ce dragon n'est pas acheté directement : il peut naître à l'Élevage lorsque l'œuf est prêt.</p></div></div>
                  ) : selected.adoptable && !selected.giftOnly ? (
                    <button className="tb-comp-primary" onClick={() => void adoptCompanion(selected)} disabled={busy || !companionApiConfigured}>
                      🐾 Adopter {selected.price ? `• ${new Intl.NumberFormat("fr-CH").format(selected.price)} 🍪` : ""}
                    </button>
                  ) : (
                    <div className="tb-special-obtention-v3"><span>🔒</span><div><strong>Obtention spéciale</strong><p>Ce compagnon est lié à un événement, un cadeau ou une règle unique du Royaume.</p></div></div>
                  )}
                </section>
              )}
            </div>
          </article>
        </div>
      )}

      <CompanionNotice notice={notice} onClose={() => setNotice(null)} />
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div><small>{label}</small><strong>{value || "—"}</strong></div>;
}
