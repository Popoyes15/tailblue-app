import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  companionApi,
  companionApiConfigured,
  getCachedCompanionSnapshot,
  getCachedKennelSnapshot,
  getCachedProvisionSnapshot,
} from "../api/companionApi";
import CompanionImageLightbox from "../components/companions/CompanionImageLightbox";
import CompanionNotice, { type CompanionNoticeData } from "../components/companions/CompanionNotice";
import { CompanionStory } from "../components/companions/CompanionStory";
import { ImageStage, StatBar } from "../components/companions/CompanionUi";
import { KENNELS, PET_FOODS, PROVISION_LEVELS } from "../data/companionsLocalData";
import type {
  CompanionDefinitionDto,
  CompanionSnapshotDto,
  KennelSnapshotDto,
  OwnedCompanionDto,
  ProvisionSnapshotDto,
} from "../types/companions";
import "../components/companions/companionsFinal.css";

type Tab = "kennel" | "team" | "provisions";

type StoryTarget = {
  definition: CompanionDefinitionDto;
  owned: OwnedCompanionDto;
} | null;

type RenameTarget = {
  definition: CompanionDefinitionDto;
  owned: OwnedCompanionDto;
} | null;

function localKennel(): KennelSnapshotDto {
  const royal = KENNELS.find((item) => item.id === "royal_tsundere")!;
  return {
    currentKennel: { ...royal, royal: true },
    gallery: KENNELS.map((item) => ({ ...item, royal: item.id === "royal_tsundere" })),
    activeIds: [],
    activeLimit: 6,
    totalCapacity: null,
    canUpgrade: false,
    nextKennelId: null,
    upgradeBlockReason: "Aperçu local : le backend décidera du vrai chenil.",
    royalPrivilege: true,
  };
}

function localProvisions(): ProvisionSnapshotDto {
  const current = PROVISION_LEVELS[4];
  return {
    level: 5,
    current,
    levels: PROVISION_LEVELS.map((level) => ({ ...level })),
    stock: PET_FOODS.map((food) => ({ ...food })),
    foods: PET_FOODS.map((food) => ({ ...food })),
    inventory: [],
    canUpgrade: false,
    nextLevel: null,
    upgradeBlockReason: "Aperçu local : aucune dépense n'est effectuée.",
  };
}

export default function KennelPage() {
  const cachedKennel = companionApiConfigured ? getCachedKennelSnapshot() : null;
  const cachedProvisions = companionApiConfigured ? getCachedProvisionSnapshot() : null;
  const cachedCompanions = companionApiConfigured ? getCachedCompanionSnapshot() : null;

  const [tab, setTab] = useState<Tab>("kennel");
  const [kennel, setKennel] = useState<KennelSnapshotDto | null>(companionApiConfigured ? cachedKennel : localKennel());
  const [provisions, setProvisions] = useState<ProvisionSnapshotDto | null>(companionApiConfigured ? cachedProvisions : localProvisions());
  const [companions, setCompanions] = useState<CompanionSnapshotDto | null>(
    companionApiConfigured ? cachedCompanions : { catalog: [], owned: [] },
  );
  const [loading, setLoading] = useState(companionApiConfigured && (!cachedKennel || !cachedProvisions || !cachedCompanions));
  const [galleryId, setGalleryId] = useState(cachedKennel?.currentKennel?.id ?? "");
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [petFoodSelection, setPetFoodSelection] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<CompanionNoticeData | null>(null);
  const [lightbox, setLightbox] = useState<{ image: string; title: string } | null>(null);
  const [storyTarget, setStoryTarget] = useState<StoryTarget>(null);
  const [renameTarget, setRenameTarget] = useState<RenameTarget>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    if (!companionApiConfigured) return;
    let cancelled = false;

    void Promise.all([
      companionApi.getKennel(),
      companionApi.getProvisions(),
      companionApi.getCompanions(),
    ])
      .then(([nextKennel, nextProvisions, nextCompanions]) => {
        if (cancelled) return;
        setKennel(nextKennel);
        setProvisions(nextProvisions);
        setCompanions(nextCompanions);
        setGalleryId((current) => current || nextKennel.currentKennel?.id || nextKennel.gallery[0]?.id || "");
      })
      .catch((error) => {
        if (cancelled) return;
        if (!cachedKennel || !cachedProvisions || !cachedCompanions) {
          setNotice({ icon: "⚠️", title: "Sanctuaire indisponible", message: error instanceof Error ? error.message : "Impossible d'ouvrir le sanctuaire.", tone: "error" });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const catalogMap = useMemo(
    () => new Map((companions?.catalog ?? []).map((pet) => [pet.id, pet])),
    [companions],
  );

  const kennelPets = useMemo(
    () =>
      (companions?.owned ?? [])
        .map((owned) => ({ owned, definition: catalogMap.get(owned.id) }))
        .filter((entry): entry is { owned: OwnedCompanionDto; definition: CompanionDefinitionDto } => Boolean(entry.definition)),
    [catalogMap, companions],
  );

  const foodInventory = useMemo(
    () => new Map((provisions?.inventory ?? []).map((entry) => [entry.foodId, entry.quantity])),
    [provisions],
  );

  const allFoods = provisions?.foods ?? provisions?.stock ?? [];

  const basketTotal = useMemo(
    () =>
      Object.entries(basket).reduce((total, [foodId, quantity]) => {
        const food = provisions?.stock.find((item) => item.id === foodId);
        return total + (food?.price ?? 0) * quantity;
      }, 0),
    [basket, provisions],
  );

  useEffect(() => {
    const urls = new Set<string>();
    kennel?.gallery.forEach((item) => item.image && urls.add(item.image));
    provisions?.levels.forEach((item) => item.image && urls.add(item.image));
    kennelPets.forEach(({ owned, definition }) => {
      const image = owned.currentImage || definition.image;
      if (image) urls.add(image);
    });

    const preloaders = Array.from(urls).map((url) => {
      const image = new Image();
      image.decoding = "async";
      image.src = url;
      return image;
    });

    return () => {
      preloaders.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, [kennel?.gallery, provisions?.levels, kennelPets]);

  if (loading && (!kennel || !provisions || !companions)) {
    return (
      <section className="tb-comp-page tb-comp-loading-page">
        <div className="tb-comp-loading-orb">🏡</div>
        <p className="tb-comp-eyebrow">SANCTUAIRE DES COMPAGNONS</p>
        <h1>Les portes s'ouvrent…</h1>
        <p>TailBlue prépare la résidence, les compagnons et l'intendance.</p>
        <CompanionNotice notice={notice} onClose={() => setNotice(null)} />
      </section>
    );
  }

  if (!kennel || !provisions || !companions) {
    return (
      <section className="tb-comp-page tb-comp-loading-page">
        <div className="tb-comp-loading-orb">⚠️</div>
        <h1>Le sanctuaire ne répond pas.</h1>
        <p>Aucun état réel n'était encore disponible en cache.</p>
        <CompanionNotice notice={notice} onClose={() => setNotice(null)} />
      </section>
    );
  }

  const selectedKennel = kennel.gallery.find((item) => item.id === galleryId) ?? kennel.currentKennel ?? kennel.gallery[0];
  const currentIndex = kennel.currentKennel ? kennel.gallery.findIndex((item) => item.id === kennel.currentKennel?.id) : -1;

  function addFood(foodId: string, delta: number) {
    setBasket((old) => ({ ...old, [foodId]: Math.max(0, Math.min(99, (old[foodId] ?? 0) + delta)) }));
  }

  async function buyBasket() {
    if (!companionApiConfigured || busy) return;
    const entries = Object.entries(basket).filter(([, quantity]) => quantity > 0);
    if (!entries.length) return;

    try {
      setBusy(true);
      let next = provisions;
      for (const [foodId, quantity] of entries) next = await companionApi.buyFood(foodId, quantity);
      setProvisions(next);
      setBasket({});
      setNotice({ icon: "🧺", title: "Commande rangée", message: "L'intendance a reçu les provisions et les réserves sont déjà à jour.", tone: "success", stats: [{ icon: "🍪", label: `${formatNumber(basketTotal)} dépensés` }] });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Commande refusée", message: error instanceof Error ? error.message : "Achat impossible.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function upgradeProvision() {
    if (!companionApiConfigured || busy) return;
    try {
      setBusy(true);
      const next = await companionApi.upgradeProvisions();
      setProvisions(next);
      setNotice({ icon: "✨", title: "Intendance améliorée", message: `${next.current.name} est maintenant le niveau actif des provisions.`, tone: "success" });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Amélioration impossible", message: error instanceof Error ? error.message : "L'intendance n'a pas pu être améliorée.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function upgradeKennel(kennelId: string) {
    if (!companionApiConfigured || busy) return;
    try {
      setBusy(true);
      const next = await companionApi.upgradeKennel(kennelId);
      setKennel(next);
      setGalleryId(next.currentKennel?.id ?? kennelId);
      setNotice({ icon: "🏗️", title: "Nouveau refuge", message: `${next.currentKennel?.name ?? "Le chenil"} devient la résidence actuelle.`, tone: "success" });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Construction impossible", message: error instanceof Error ? error.message : "Amélioration impossible.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function setPetActive(pet: OwnedCompanionDto) {
    if (!companionApiConfigured || busy) return;
    try {
      setBusy(true);
      const nextCompanions = await companionApi.setActive(pet.id, !pet.active);
      setCompanions(nextCompanions);
      const nextKennel = await companionApi.getKennel();
      setKennel(nextKennel);
      setNotice({ icon: pet.active ? "🏠" : "⚔️", title: pet.active ? "Retour au repos" : "Départ en aventure", message: pet.active ? `${pet.displayName} retrouve le sanctuaire.` : `${pet.displayName} rejoint ton équipe active.`, tone: "success" });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Équipe inchangée", message: error instanceof Error ? error.message : "Impossible de modifier l'équipe.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function feedKennelPet(pet: OwnedCompanionDto) {
    const available = allFoods.filter((food) => (foodInventory.get(food.id) ?? 0) > 0);
    const foodId = petFoodSelection[pet.id] ?? available[0]?.id ?? "";
    if (!companionApiConfigured || busy || !foodId) return;

    try {
      setBusy(true);
      const result = await companionApi.feed(pet.id, foodId);
      setCompanions(result.companions);
      if (result.provisions) setProvisions(result.provisions);
      setNotice({
        icon: "🍖",
        title: `${pet.displayName} a mangé`,
        message: result.text || "Le repas a été servi dans le sanctuaire.",
        tone: "success",
        stats: [
          ...(result.hpGain ? [{ icon: "❤️", label: `+${result.hpGain} PV` }] : []),
          ...(result.energyGain ? [{ icon: "⚡", label: `+${result.energyGain} énergie` }] : []),
          ...(result.affectionGain ? [{ icon: "💜", label: `+${result.affectionGain} confiance` }] : []),
        ],
      });
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Repas impossible", message: error instanceof Error ? error.message : "Le compagnon n'a pas pu être nourri.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function petKennelCompanion(pet: OwnedCompanionDto) {
    if (!companionApiConfigured || busy) return;
    try {
      setBusy(true);
      const result = await companionApi.pet(pet.id);
      setCompanions(result.companions);
      setNotice({
        icon: "💜",
        title: `Papouille pour ${pet.displayName}`,
        message: result.text || `${pet.displayName} profite du moment.`,
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

  async function confirmRename() {
    if (!renameTarget || !renameTarget.owned.canRename || !renameValue.trim() || busy) return;
    try {
      setBusy(true);
      const oldName = renameTarget.owned.displayName;
      const next = await companionApi.rename(renameTarget.owned.id, renameValue.trim());
      setCompanions(next);
      setNotice({ icon: "✏️", title: "Surnom enregistré", message: `${oldName} répond désormais à « ${renameValue.trim()} » dans le sanctuaire.`, tone: "success" });
      setRenameTarget(null);
      setRenameValue("");
    } catch (error) {
      setNotice({ icon: "⚠️", title: "Surnom refusé", message: error instanceof Error ? error.message : "Impossible de renommer ce compagnon.", tone: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tb-comp-page tb-kennel-v3-page">
      <header className="tb-kennel-v2-heading">
        <div>
          <p className="tb-comp-eyebrow">🏡 SANCTUAIRE DES COMPAGNONS</p>
          <h1>Chenil</h1>
          <p>Le refuge, leur vie quotidienne et les réserves. Tout est relié aux vraies données TailBlue.</p>
        </div>
        <div className="tb-kennel-v2-summary">
          <div><small>Compagnons</small><strong>{kennel.ownedCount ?? companions.owned.length}/{kennel.totalCapacity ?? "∞"}</strong></div>
          <div><small>Équipe</small><strong>{kennel.activeIds.length}/{kennel.activeLimit}</strong></div>
          <div><small>Guilde</small><strong>{kennel.guildName ?? "Aucune"}</strong></div>
          <div><small>Cookies</small><strong>🍪 {formatNumber(kennel.cookies ?? provisions.cookies ?? 0)}</strong></div>
        </div>
      </header>

      <nav className="tb-sanctuary-tabs" aria-label="Sections du chenil">
        <button className={tab === "kennel" ? "is-active" : ""} onClick={() => setTab("kennel")}><span>🏠</span><div><strong>Résidence</strong><small>Le refuge & ses niveaux</small></div></button>
        <button className={tab === "team" ? "is-active" : ""} onClick={() => setTab("team")}><span>🐾</span><div><strong>Compagnons</strong><small>Histoire, soins & équipe</small></div></button>
        <button className={tab === "provisions" ? "is-active" : ""} onClick={() => setTab("provisions")}><span>🍖</span><div><strong>Provisions</strong><small>Réserves & intendance</small></div></button>
      </nav>

      {tab === "kennel" && selectedKennel && (
        <div className="tb-residence-v2-layout">
          <main className="tb-residence-v2-stage">
            <button className="tb-residence-v2-art tb-residence-clickable-v3" onClick={() => setLightbox({ image: selectedKennel.image, title: selectedKennel.name })}>
              <ImageStage image={selectedKennel.image} alt={selectedKennel.name} className="tb-residence-v2-image" />
              <div className="tb-residence-v2-badges">
                {selectedKennel.id === kennel.currentKennel?.id && <span>✦ Résidence actuelle</span>}
                {selectedKennel.royal && <span>👑 Privilège royal</span>}
                <span className="tb-residence-zoom-hint">⛶ Cliquer pour voir l'image</span>
              </div>
              <div className="tb-residence-v2-name">
                <p className="tb-comp-eyebrow">{selectedKennel.royal ? "DOMAINE DE LA COURONNE" : "REFUGE DU ROYAUME"}</p>
                <h2>{selectedKennel.name}</h2>
                <p>{selectedKennel.description}</p>
              </div>
            </button>

            <div className="tb-residence-v2-stats">
              <div><span>🐾</span><small>Capacité</small><strong>{selectedKennel.royal ? "∞" : kennel.totalCapacity ?? "—"}</strong></div>
              <div><span>⚔️</span><small>Actifs</small><strong>{kennel.activeIds.length}/{kennel.activeLimit}</strong></div>
              <div><span>🏘️</span><small>Extension</small><strong>{selectedKennel.bonusPlaces == null ? "∞" : `+${selectedKennel.bonusPlaces}`}</strong></div>
              <div><span>🍪</span><small>Valeur</small><strong>{selectedKennel.price ? formatNumber(selectedKennel.price) : "Royal"}</strong></div>
            </div>
          </main>

          <aside className="tb-residence-v2-path">
            <div className="tb-comp-side-title"><span>🗺️</span><div><p className="tb-comp-eyebrow">ÉVOLUTION DU REFUGE</p><h3>Galerie royale</h3></div></div>
            <div className="tb-kennel-path-list">
              {kennel.gallery.map((item, index) => {
                const isCurrent = item.id === kennel.currentKennel?.id;
                const acquired = item.royal ? kennel.royalPrivilege : currentIndex >= 0 && index <= currentIndex;
                return (
                  <button key={item.id} className={`${isCurrent ? "is-current" : ""} ${galleryId === item.id ? "is-selected" : ""}`} onClick={() => setGalleryId(item.id)}>
                    <span className="tb-kennel-path-dot">{item.royal ? "👑" : acquired ? "✓" : index + 1}</span>
                    <div><strong>{item.name}</strong><small>{item.bonusPlaces == null ? "Capacité infinie" : `+${item.bonusPlaces} place(s)`}</small></div>
                    <b>{item.price > 0 ? `${formatNumber(item.price)} 🍪` : "Royal"}</b>
                  </button>
                );
              })}
            </div>
            {selectedKennel.id !== kennel.currentKennel?.id && !selectedKennel.royal && (
              <button className="tb-comp-primary tb-residence-upgrade" onClick={() => void upgradeKennel(selectedKennel.id)} disabled={!companionApiConfigured || busy || !kennel.canUpgrade}>🏗️ Construire {selectedKennel.name}</button>
            )}
            {kennel.upgradeBlockReason && <p className="tb-comp-preview-note">{kennel.upgradeBlockReason}</p>}
          </aside>
        </div>
      )}

      {tab === "team" && (
        <section className="tb-team-v2-section tb-team-v3-section">
          <div className="tb-team-v2-heading"><div><p className="tb-comp-eyebrow">🐾 VIE DU SANCTUAIRE</p><h2>Compagnons résidents</h2></div><p>Leur fiche est enfin complète ici aussi : histoire, papouille, surnom au niveau 10, nourriture et équipe active.</p></div>
          {kennelPets.length === 0 ? (
            <div className="tb-comp-empty"><span>🐾</span><h2>Aucun compagnon ici pour le moment.</h2></div>
          ) : (
            <div className="tb-team-v2-grid tb-team-v3-grid">
              {kennelPets.map(({ owned, definition }) => {
                const availableFoods = allFoods.filter((food) => (foodInventory.get(food.id) ?? 0) > 0);
                const selectedFood = petFoodSelection[owned.id] ?? availableFoods[0]?.id ?? "";
                return (
                  <article className={owned.active ? "is-active" : "is-resting"} key={owned.id}>
                    <button className="tb-team-v2-portrait tb-team-image-button-v3" onClick={() => setLightbox({ image: owned.currentImage || definition.image, title: owned.displayName })}>
                      <ImageStage image={owned.currentImage || definition.image} alt={owned.displayName} className="tb-team-v2-image" />
                      <span>{owned.active ? "⚔️ En aventure" : "💤 Au repos"}</span>
                    </button>
                    <div className="tb-team-v2-copy">
                      <div className="tb-team-v2-title"><div><small>{definition.rarity}</small><h3>{owned.displayName}</h3><p>Niveau {owned.level} • {owned.trustLabel}</p></div></div>
                      <div className="tb-team-v2-bars">
                        <StatBar label="PV" value={owned.hp} max={owned.maxHp} icon="❤️" kind="hp" />
                        <StatBar label="Énergie" value={owned.energy} max={owned.maxEnergy} icon="⚡" kind="energy" />
                        <StatBar label="Confiance" value={owned.affection} max={100} icon="💜" kind="trust" />
                      </div>

                      <div className="tb-pet-tools-v3">
                        <button onClick={() => setStoryTarget({ definition, owned })}>📖 Histoire</button>
                        <button onClick={() => void petKennelCompanion(owned)} disabled={busy || !companionApiConfigured}>💜 Papouiller</button>
                        <button
                          onClick={() => { setRenameTarget({ definition, owned }); setRenameValue(owned.nickname ?? ""); }}
                          disabled={!owned.canRename || busy || !companionApiConfigured}
                          title={owned.canRename ? "Changer le surnom" : "Disponible au niveau 10"}
                        >
                          ✏️ {owned.canRename ? "Renommer" : "Niv. 10"}
                        </button>
                        <button onClick={() => void setPetActive(owned)} disabled={busy || !companionApiConfigured}>{owned.active ? "🏠 Reposer" : "⚔️ Activer"}</button>
                      </div>

                      <div className="tb-team-v2-feed">
                        <select value={selectedFood} disabled={!availableFoods.length || busy} onChange={(event) => setPetFoodSelection((old) => ({ ...old, [owned.id]: event.target.value }))}>
                          {!availableFoods.length && <option value="">Aucune provision disponible</option>}
                          {availableFoods.map((food) => <option value={food.id} key={food.id}>{food.name} ×{foodInventory.get(food.id) ?? 0} • ❤️ +{food.heal} • ⚡ +{food.energy}</option>)}
                        </select>
                        <button onClick={() => void feedKennelPet(owned)} disabled={!selectedFood || busy || !companionApiConfigured}>🍖 Nourrir</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "provisions" && (
        <div className="tb-provisions-v2-layout">
          <main>
            <article className="tb-intendance-v2-hero">
              <button className="tb-intendance-image-button-v3" onClick={() => setLightbox({ image: provisions.current.image, title: provisions.current.name })}>
                <ImageStage image={provisions.current.image} alt={provisions.current.name} className="tb-intendance-v2-image" />
                <span>⛶ Voir l'intendance</span>
              </button>
              <div>
                <p className="tb-comp-eyebrow">🍖 INTENDANCE • NIVEAU {provisions.level}/5</p>
                <h2>{provisions.current.name}</h2>
                <p>{provisions.current.description}</p>
                <div className="tb-intendance-v2-levels">{provisions.levels.map((level) => <i key={level.level} className={level.level <= provisions.level ? "is-unlocked" : ""}>{level.level}</i>)}</div>
                {provisions.nextLevel ? <div className="tb-intendance-v2-next"><div><small>Prochaine amélioration</small><strong>{provisions.nextLevel.name}</strong></div><b>{formatNumber(provisions.nextLevel.price)} 🍪</b></div> : <div className="tb-provision-max">👑 Intendance au niveau maximal.</div>}
                <button className="tb-comp-primary" onClick={() => void upgradeProvision()} disabled={!companionApiConfigured || busy || !provisions.canUpgrade}>✨ Améliorer l'intendance</button>
              </div>
            </article>

            <section className="tb-pantry-v2">
              <div className="tb-food-heading"><div><p className="tb-comp-eyebrow">🛒 MARCHÉ DU SANCTUAIRE</p><h2>Remplir les réserves</h2></div><span>🍪 {formatNumber(provisions.cookies ?? 0)}</span></div>
              <div className="tb-food-grid tb-food-grid-v2">
                {provisions.stock.map((food) => {
                  const quantity = basket[food.id] ?? 0;
                  return (
                    <article key={food.id} className={quantity ? "is-in-basket" : ""}>
                      <div className="tb-food-name"><strong>{food.name}</strong><span>Niv. {food.level}</span></div>
                      <div className="tb-food-effects"><span>❤️ +{food.heal}</span><span>⚡ +{food.energy}</span></div>
                      <div className="tb-food-owned">Dans les réserves : ×{foodInventory.get(food.id) ?? 0}</div>
                      <div className="tb-food-bottom"><strong>{formatNumber(food.price)} 🍪</strong><div className="tb-food-qty"><button onClick={() => addFood(food.id, -1)}>−</button><span>{quantity}</span><button onClick={() => addFood(food.id, 1)}>+</button></div></div>
                    </article>
                  );
                })}
              </div>
            </section>
          </main>

          <aside className="tb-basket tb-basket-v2">
            <div className="tb-comp-side-title"><span>🧺</span><div><p className="tb-comp-eyebrow">PANIER</p><h3>Commande de l'intendance</h3></div></div>
            <div className="tb-basket-lines">
              {!Object.values(basket).some((quantity) => quantity > 0) ? <p>Ajoute quelques provisions : elles apparaîtront ici.</p> : Object.entries(basket).filter(([, quantity]) => quantity > 0).map(([foodId, quantity]) => {
                const food = provisions.stock.find((item) => item.id === foodId);
                if (!food) return null;
                return <div key={foodId}><span>{food.name} ×{quantity}</span><strong>{formatNumber(food.price * quantity)} 🍪</strong></div>;
              })}
            </div>
            <div className="tb-basket-total"><span>Total</span><strong>{formatNumber(basketTotal)} 🍪</strong></div>
            <button className="tb-comp-primary" onClick={() => void buyBasket()} disabled={!companionApiConfigured || busy || basketTotal <= 0}>🛍️ Confier la commande</button>
          </aside>
        </div>
      )}

      {lightbox && <CompanionImageLightbox image={lightbox.image} title={lightbox.title} onClose={() => setLightbox(null)} />}

      {storyTarget && (
        <div className="tb-comp-modal-backdrop" onClick={() => setStoryTarget(null)}>
          <article className="tb-story-modal-v3" onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
            <button className="tb-comp-modal-close" onClick={() => setStoryTarget(null)}>×</button>
            <div className="tb-story-modal-hero-v3">
              <ImageStage image={storyTarget.owned.currentImage || storyTarget.definition.image} alt={storyTarget.owned.displayName} className="tb-story-modal-image-v3" />
              <div><p className="tb-comp-eyebrow">📖 CHRONIQUE DU SANCTUAIRE</p><h2>{storyTarget.owned.displayName}</h2><span>{storyTarget.definition.rarity} · Niveau {storyTarget.owned.level}</span></div>
            </div>
            <CompanionStory story={storyTarget.definition.story} />
          </article>
        </div>
      )}

      {renameTarget && (
        <div className="tb-comp-modal-backdrop" onClick={() => setRenameTarget(null)}>
          <article className="tb-rename-modal-v3" onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
            <button className="tb-comp-modal-close" onClick={() => setRenameTarget(null)}>×</button>
            <span className="tb-rename-icon-v3">✏️</span>
            <p className="tb-comp-eyebrow">NIVEAU 10 DÉBLOQUÉ</p>
            <h2>Changer le surnom de {renameTarget.owned.displayName}</h2>
            <p>Le nom original reste conservé dans le bestiaire. Le surnom sera utilisé dans TailBlue.</p>
            <input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} maxLength={24} autoFocus placeholder="Nouveau surnom…" />
            <button className="tb-comp-primary" onClick={() => void confirmRename()} disabled={busy || !renameValue.trim()}>Enregistrer le surnom</button>
          </article>
        </div>
      )}

      <CompanionNotice notice={notice} onClose={() => setNotice(null)} />
    </section>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CH").format(value);
}
