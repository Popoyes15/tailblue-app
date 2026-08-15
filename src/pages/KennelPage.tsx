import { useEffect, useMemo, useState } from "react";
import {
  companionApi,
  companionApiConfigured,
} from "../api/companionApi";
import { ImageStage } from "../components/companions/CompanionUi";
import {
  KENNELS,
  PET_FOODS,
  PROVISION_LEVELS,
} from "../data/companionsLocalData";
import type {
  CompanionSnapshotDto,
  KennelSnapshotDto,
  ProvisionSnapshotDto,
} from "../types/companions";
import "../components/companions/companionsFinal.css";

type Tab = "kennel" | "team" | "provisions";

function localKennel(): KennelSnapshotDto {
  const royal = KENNELS.find((item) => item.id === "royal_tsundere")!;

  return {
    currentKennel: {
      ...royal,
      bonusPlaces: royal.bonusPlaces,
      royal: true,
    },
    gallery: KENNELS.map((item) => ({
      ...item,
      bonusPlaces: item.bonusPlaces,
      royal: item.id === "royal_tsundere",
    })),
    activeIds: [],
    activeLimit: 6,
    totalCapacity: null,
    canUpgrade: false,
    nextKennelId: null,
    upgradeBlockReason:
      "Aperçu local du Chenil Royal. Le backend décidera du vrai chenil.",
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
    inventory: [],
    canUpgrade: false,
    nextLevel: null,
    upgradeBlockReason:
      "Aperçu local : aucune dépense n'est effectuée.",
  };
}

export default function KennelPage() {
  const [tab, setTab] = useState<Tab>("kennel");
  const [kennel, setKennel] = useState<KennelSnapshotDto>(
    localKennel(),
  );
  const [provisions, setProvisions] =
    useState<ProvisionSnapshotDto>(localProvisions());
  const [companions, setCompanions] =
    useState<CompanionSnapshotDto>({
      catalog: [],
      owned: [],
    });
  const [galleryId, setGalleryId] = useState(
    kennel.currentKennel?.id ?? "royal_tsundere",
  );
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [petFoodSelection, setPetFoodSelection] =
    useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!companionApiConfigured) return;

    Promise.all([
      companionApi.getKennel(),
      companionApi.getProvisions(),
      companionApi.getCompanions(),
    ])
      .then(([nextKennel, nextProvisions, nextCompanions]) => {
        setKennel(nextKennel);
        setProvisions(nextProvisions);
        setCompanions(nextCompanions);
        setGalleryId(
          nextKennel.currentKennel?.id ??
            nextKennel.gallery[0]?.id ??
            "",
        );
      })
      .catch(() => {
        // Le mode local reste visible.
      });
  }, []);

  const selectedKennel =
    kennel.gallery.find((item) => item.id === galleryId) ??
    kennel.currentKennel ??
    kennel.gallery[0];

  const ownedMap = useMemo(
    () => new Map(companions.owned.map((pet) => [pet.id, pet])),
    [companions.owned],
  );

  const catalogMap = useMemo(
    () => new Map(companions.catalog.map((pet) => [pet.id, pet])),
    [companions.catalog],
  );

  const kennelPets = companions.owned
    .map((owned) => ({
      owned,
      definition: catalogMap.get(owned.id),
    }))
    .filter((entry) => entry.definition);

  const foodInventory = useMemo(
    () =>
      new Map(
        provisions.inventory.map((entry) => [
          entry.foodId,
          entry.quantity,
        ]),
      ),
    [provisions.inventory],
  );

  const basketTotal = Object.entries(basket).reduce(
    (total, [foodId, quantity]) => {
      const food = provisions.stock.find(
        (item) => item.id === foodId,
      );
      return total + (food?.price ?? 0) * quantity;
    },
    0,
  );

  function addFood(foodId: string, delta: number) {
    setBasket((old) => {
      const next = Math.max(
        0,
        Math.min(99, (old[foodId] ?? 0) + delta),
      );

      return {
        ...old,
        [foodId]: next,
      };
    });
  }

  async function buyBasket() {
    if (!companionApiConfigured || busy) return;

    const entries = Object.entries(basket).filter(
      ([, quantity]) => quantity > 0,
    );

    if (!entries.length) return;

    try {
      setBusy(true);
      setMessage("");

      let next = provisions;

      for (const [foodId, quantity] of entries) {
        next = await companionApi.buyFood(foodId, quantity);
      }

      setProvisions(next);
      setBasket({});
      setMessage("🛍️ Provisions ajoutées au sac.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'effectuer cet achat.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function upgradeProvision() {
    if (!companionApiConfigured || busy) return;

    try {
      setBusy(true);
      setMessage("");
      setProvisions(await companionApi.upgradeProvisions());
      setMessage("✨ Intendance améliorée.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Amélioration impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function upgradeKennel(kennelId: string) {
    if (!companionApiConfigured || busy) return;

    try {
      setBusy(true);
      setMessage("");
      const next = await companionApi.upgradeKennel(kennelId);
      setKennel(next);
      setGalleryId(next.currentKennel?.id ?? kennelId);
      setMessage("🏗️ Nouveau chenil enregistré.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Amélioration impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function feedKennelPet(petId: string) {
    const foodId = petFoodSelection[petId];

    if (!companionApiConfigured || busy || !foodId) return;

    try {
      setBusy(true);
      setMessage("");

      const result = await companionApi.feed(petId, foodId);

      setCompanions(result.companions);

      if (result.provisions) {
        setProvisions(result.provisions);
      } else {
        setProvisions(await companionApi.getProvisions());
      }

      setMessage(
        `${result.text}${
          result.hpGain ? ` • ❤️ +${result.hpGain} PV` : ""
        }${
          result.energyGain
            ? ` • ⚡ +${result.energyGain} énergie`
            : ""
        }${
          result.affectionGain
            ? ` • 💜 +${result.affectionGain} confiance`
            : ""
        }`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Impossible de nourrir ce compagnon.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tb-comp-page">
      <header className="tb-comp-heading">
        <div>
          <p className="tb-comp-eyebrow">🏠 SANCTUAIRE DES COMPAGNONS</p>
          <h1>Chenil</h1>
          <p>
            Résidence, équipe active et intendance des provisions sont
            réunies ici. La logique d'achat, de capacité et de privilège
            reste côté Python.
          </p>
        </div>

        <div className="tb-comp-source">
          <i />
          {companionApiConfigured
            ? "Backend TailBlue"
            : "Aperçu local"}
        </div>
      </header>

      <nav className="tb-comp-tabs">
        <button
          className={tab === "kennel" ? "is-active" : ""}
          onClick={() => setTab("kennel")}
        >
          🏠 Résidence
        </button>
        <button
          className={tab === "team" ? "is-active" : ""}
          onClick={() => setTab("team")}
        >
          🐾 Compagnons
        </button>
        <button
          className={tab === "provisions" ? "is-active" : ""}
          onClick={() => setTab("provisions")}
        >
          🍖 Provisions
        </button>
      </nav>

      {message && (
        <div className="tb-comp-inline-message">{message}</div>
      )}

      {tab === "kennel" && selectedKennel && (
        <div className="tb-kennel-layout">
          <main className="tb-kennel-main">
            <ImageStage
              image={selectedKennel.image}
              alt={selectedKennel.name}
              className="tb-kennel-hero"
            />

            <article className="tb-kennel-copy-card">
              <div className="tb-kennel-title">
                <div>
                  <p className="tb-comp-eyebrow">
                    {selectedKennel.id ===
                    kennel.currentKennel?.id
                      ? "TON CHENIL"
                      : "GALERIE DES CHENILS"}
                  </p>
                  <h2>{selectedKennel.name}</h2>
                </div>

                {selectedKennel.royal && (
                  <span className="tb-royal-pill">
                    👑 Privilège royal
                  </span>
                )}
              </div>

              <p>{selectedKennel.description}</p>

              <div className="tb-kennel-stats">
                <div>
                  <small>Capacité totale</small>
                  <strong>
                    {selectedKennel.royal
                      ? "∞"
                      : kennel.totalCapacity ?? "—"}
                  </strong>
                </div>
                <div>
                  <small>Compagnons actifs</small>
                  <strong>
                    {kennel.activeIds.length}/{kennel.activeLimit}
                  </strong>
                </div>
                <div>
                  <small>Places ajoutées</small>
                  <strong>
                    {selectedKennel.bonusPlaces == null
                      ? "∞"
                      : `+${selectedKennel.bonusPlaces}`}
                  </strong>
                </div>
                <div>
                  <small>Prix</small>
                  <strong>
                    {selectedKennel.royal
                      ? "Royal"
                      : `${formatNumber(selectedKennel.price)} 🍪`}
                  </strong>
                </div>
              </div>

              {selectedKennel.id !== kennel.currentKennel?.id &&
                !selectedKennel.royal && (
                  <button
                    className="tb-comp-primary"
                    disabled={
                      !companionApiConfigured ||
                      busy ||
                      !kennel.canUpgrade
                    }
                    onClick={() =>
                      upgradeKennel(selectedKennel.id)
                    }
                  >
                    🏗️ Acheter / améliorer
                  </button>
                )}

              {kennel.upgradeBlockReason && (
                <p className="tb-comp-preview-note">
                  {kennel.upgradeBlockReason}
                </p>
              )}
            </article>
          </main>

          <aside className="tb-kennel-gallery">
            <div className="tb-comp-side-title">
              <span>🏛️</span>
              <div>
                <p className="tb-comp-eyebrow">GALERIE</p>
                <h3>Les refuges du Royaume</h3>
              </div>
            </div>

            <div className="tb-kennel-gallery-list">
              {kennel.gallery.map((item) => (
                <button
                  key={item.id}
                  className={
                    item.id === selectedKennel.id
                      ? "is-selected"
                      : ""
                  }
                  onClick={() => setGalleryId(item.id)}
                >
                  <img src={item.image} alt="" />
                  <div>
                    <strong>{item.name}</strong>
                    <small>
                      {item.royal
                        ? "Privilège royal"
                        : `${formatNumber(item.price)} 🍪 • +${item.bonusPlaces}`}
                    </small>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {tab === "team" && (
        <div className="tb-team-panel">
          <div className="tb-team-heading">
            <div>
              <p className="tb-comp-eyebrow">⚔️ FORMATION ACTIVE</p>
              <h2>
                {kennel.activeIds.length}/{kennel.activeLimit} compagnons
              </h2>
            </div>
            <p>
              Les pets choisis ici sont l'équipe générale. Le compagnon
              emmené dans la Mine reste un système séparé.
            </p>
          </div>

          {!companionApiConfigured ? (
            <div className="tb-comp-empty compact">
              <span>🔌</span>
              <h2>Les vrais compagnons ne sont pas encore chargés.</h2>
              <p>
                Après connexion au backend, ce panneau affichera tous les
                compagnons possédés avec leur statut et les provisions
                réellement disponibles.
              </p>
            </div>
          ) : kennelPets.length === 0 ? (
            <div className="tb-comp-empty compact">
              <span>🏠</span>
              <h2>Aucun compagnon dans le chenil.</h2>
              <p>Les compagnons adoptés apparaîtront ici.</p>
            </div>
          ) : (
            <div className="tb-team-grid tb-kennel-pet-grid">
              {kennelPets.map(({ owned, definition }) => {
                const availableFoods = provisions.stock.filter(
                  (food) => (foodInventory.get(food.id) ?? 0) > 0,
                );

                const selectedFood =
                  petFoodSelection[owned.id] ??
                  availableFoods[0]?.id ??
                  "";

                return (
                  <article key={owned.id}>
                    <ImageStage
                      image={
                        owned.currentImage ||
                        definition!.image
                      }
                      alt={owned.displayName}
                      className="tb-team-image"
                    />

                    <div className="tb-kennel-pet-card-copy">
                      <div className="tb-kennel-pet-title">
                        <div>
                          <strong>{owned.displayName}</strong>
                          <small>
                            Niveau {owned.level} • {owned.trustLabel}
                          </small>
                        </div>
                        <span
                          className={
                            owned.active
                              ? "tb-pet-status active"
                              : "tb-pet-status"
                          }
                        >
                          {owned.active ? "⚔️ Actif" : "🏠 Chenil"}
                        </span>
                      </div>

                      <div className="tb-kennel-pet-vitals">
                        <span>
                          ❤️ {owned.hp}/{owned.maxHp}
                        </span>
                        <span>
                          ⚡ {owned.energy}/{owned.maxEnergy}
                        </span>
                      </div>

                      <div className="tb-kennel-feed">
                        <select
                          value={selectedFood}
                          disabled={availableFoods.length === 0 || busy}
                          onChange={(event) =>
                            setPetFoodSelection((old) => ({
                              ...old,
                              [owned.id]: event.target.value,
                            }))
                          }
                        >
                          {availableFoods.length === 0 ? (
                            <option value="">
                              Aucune provision disponible
                            </option>
                          ) : (
                            availableFoods.map((food) => (
                              <option key={food.id} value={food.id}>
                                {food.name} ×
                                {foodInventory.get(food.id) ?? 0} •
                                ❤️ +{food.heal} • ⚡ +{food.energy}
                              </option>
                            ))
                          )}
                        </select>

                        <button
                          onClick={() =>
                            feedKennelPet(owned.id)
                          }
                          disabled={
                            busy ||
                            availableFoods.length === 0 ||
                            !selectedFood
                          }
                        >
                          🍖 Nourrir
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "provisions" && (
        <div className="tb-provision-layout">
          <main className="tb-provision-main">
            <article className="tb-provision-hero-card">
              <ImageStage
                image={provisions.current.image}
                alt={provisions.current.name}
                className="tb-provision-hero-art"
              />

              <div className="tb-provision-hero-copy">
                <p className="tb-comp-eyebrow">
                  🍖 INTENDANCE • NIVEAU {provisions.level}/5
                </p>
                <h2>{provisions.current.name}</h2>
                <p>{provisions.current.description}</p>

                {provisions.nextLevel ? (
                  <div className="tb-provision-next">
                    <div>
                      <small>Prochaine amélioration</small>
                      <strong>
                        {provisions.nextLevel.name}
                      </strong>
                    </div>
                    <span>
                      {formatNumber(
                        provisions.nextLevel.price,
                      )}{" "}
                      🍪
                    </span>
                  </div>
                ) : (
                  <div className="tb-provision-max">
                    👑 Intendance au niveau maximal.
                  </div>
                )}

                <button
                  className="tb-comp-primary"
                  onClick={upgradeProvision}
                  disabled={
                    !companionApiConfigured ||
                    busy ||
                    !provisions.canUpgrade
                  }
                >
                  ✨ Améliorer l'intendance
                </button>

                {provisions.upgradeBlockReason && (
                  <p className="tb-comp-preview-note">
                    {provisions.upgradeBlockReason}
                  </p>
                )}
              </div>
            </article>

            <section className="tb-food-section">
              <div className="tb-food-heading">
                <div>
                  <p className="tb-comp-eyebrow">🛒 STOCK DISPONIBLE</p>
                  <h2>Provisions</h2>
                </div>
                {provisions.cookies != null && (
                  <span>
                    🍪 {formatNumber(provisions.cookies)}
                  </span>
                )}
              </div>

              <div className="tb-food-grid">
                {provisions.stock.map((food) => {
                  const quantity = basket[food.id] ?? 0;

                  return (
                    <article key={food.id}>
                      <div className="tb-food-name">
                        <strong>{food.name}</strong>
                        <span>Niv. {food.level}</span>
                      </div>

                      <div className="tb-food-effects">
                        <span>❤️ +{food.heal} PV</span>
                        <span>⚡ +{food.energy}</span>
                      </div>

                      <div className="tb-food-owned">
                        Sac : ×
                        {foodInventory.get(food.id) ?? 0}
                      </div>

                      <div className="tb-food-bottom">
                        <strong>{food.price} 🍪</strong>

                        <div className="tb-food-qty">
                          <button
                            onClick={() =>
                              addFood(food.id, -1)
                            }
                          >
                            −
                          </button>
                          <span>{quantity}</span>
                          <button
                            onClick={() =>
                              addFood(food.id, 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </main>

          <aside className="tb-basket">
            <div className="tb-comp-side-title">
              <span>🧺</span>
              <div>
                <p className="tb-comp-eyebrow">PANIER</p>
                <h3>Commande</h3>
              </div>
            </div>

            <div className="tb-basket-lines">
              {Object.entries(basket).filter(
                ([, quantity]) => quantity > 0,
              ).length === 0 ? (
                <p>Aucune provision sélectionnée.</p>
              ) : (
                Object.entries(basket)
                  .filter(([, quantity]) => quantity > 0)
                  .map(([foodId, quantity]) => {
                    const food = provisions.stock.find(
                      (item) => item.id === foodId,
                    );
                    if (!food) return null;

                    return (
                      <div key={foodId}>
                        <span>
                          {food.name} ×{quantity}
                        </span>
                        <strong>
                          {formatNumber(
                            food.price * quantity,
                          )}{" "}
                          🍪
                        </strong>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="tb-basket-total">
              <span>Total</span>
              <strong>{formatNumber(basketTotal)} 🍪</strong>
            </div>

            <button
              className="tb-comp-primary"
              onClick={buyBasket}
              disabled={
                !companionApiConfigured ||
                busy ||
                basketTotal <= 0
              }
            >
              🛍️ Acheter
            </button>

            {!companionApiConfigured && (
              <p className="tb-comp-preview-note">
                Le panier est testable localement, mais aucun cookie ni
                inventaire n'est modifié sans backend.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CH").format(value);
}
