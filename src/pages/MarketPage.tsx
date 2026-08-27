// TAILBLUE_WORLD_APP_V3_20260826
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { worldApi } from "../api/worldApi";
import TailBlueImageViewer from "../components/TailBlueImageViewer";
import {
  MARKET_BUILDINGS,
  MARKET_BUILDING_BY_ID,
  MARKET_STAGE_IMAGES,
} from "../data/worldData";
import { useWorldSnapshot } from "../hooks/useWorldSnapshot";
import type {
  MarketItemDto,
  MarketSnapshot,
} from "../types/world";

import "./worldV3.css";

type Mode = "buy" | "sell";
type OwnershipFilter =
  | "all"
  | "owned"
  | "unowned";
type SortMode =
  | "name"
  | "price-asc"
  | "price-desc"
  | "owned-desc";

const CATEGORY_LABELS:
  Record<string, string> = {
    equipment: "⚔️ Équipement",
    material: "🧱 Matériaux",
    consumable: "🧪 Consommables",
    plan: "📜 Plans",
    quest: "🗝️ Quête",
    relic: "🏺 Reliques",
  };

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLocaleLowerCase(
      "fr-CH",
    )
    .trim();
}

function number(value: number) {
  return value.toLocaleString(
    "fr-CH",
  );
}

export default function MarketPage() {
  const {
    snapshot,
    setSnapshot,
    loading,
    refreshing,
    error,
    refresh,
  } = useWorldSnapshot({
    cacheKey: "market",
    loader: worldApi.getMarket,
  });

  const [
    selectedBuildingId,
    setSelectedBuildingId,
  ] = useState("commons");

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState<string | null>(
    null,
  );

  const [mode, setMode] =
    useState<Mode>("buy");

  const [quantity, setQuantity] =
    useState(1);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("all");

  const [rarity, setRarity] =
    useState("all");

  const [ownership, setOwnership] =
    useState<OwnershipFilter>(
      "all",
    );

  const [sort, setSort] =
    useState<SortMode>("name");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [zoom, setZoom] =
    useState<{
      url: string;
      title: string;
    } | null>(null);

  const selectedBuilding =
    MARKET_BUILDING_BY_ID[
      selectedBuildingId as keyof
        typeof MARKET_BUILDING_BY_ID
    ] ??
    MARKET_BUILDING_BY_ID
      .commons;

  const buildingState =
    snapshot?.buildings.find(
      (entry) =>
        entry.id ===
        selectedBuilding.id,
    );

  const stage =
    snapshot?.stage ?? 0;

  const heroImage =
    selectedBuilding.id ===
    "commons"
      ? MARKET_STAGE_IMAGES[
          stage
        ] ??
        MARKET_STAGE_IMAGES[0]
      : selectedBuilding
          .interiorImage ??
        MARKET_STAGE_IMAGES[
          stage
        ] ??
        MARKET_STAGE_IMAGES[0];

  const shopItems =
    snapshot?.shops?.[
      selectedBuilding.id
    ] ?? [];

  const modeItems = useMemo(
    () =>
      mode === "buy"
        ? shopItems.filter(
            (item) =>
              item.buyPrice > 0,
          )
        : shopItems.filter(
            (item) =>
              item.sellPrice > 0 &&
              item.ownedQuantity >
                0,
          ),
    [mode, shopItems],
  );

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          modeItems
            .map(
              (item) =>
                item.category,
            )
            .filter(
              (
                value,
              ): value is string =>
                Boolean(value),
            ),
        ),
      ).sort(),
    [modeItems],
  );

  const rarities = useMemo(
    () =>
      Array.from(
        new Map(
          modeItems
            .filter(
              (item) =>
                item.rarityId ||
                item.rarity,
            )
            .map((item) => [
              item.rarityId ??
                item.rarity ??
                "",
              item.rarity ??
                item.rarityId ??
                "",
            ]),
        ).entries(),
      ),
    [modeItems],
  );

  const visibleItems =
    useMemo(() => {
      const query =
        normalize(search);

      const price = (
        item: MarketItemDto,
      ) =>
        mode === "buy"
          ? item.buyPrice
          : item.sellPrice;

      return modeItems
        .filter((item) => {
          if (
            category !== "all" &&
            item.category !==
              category
          )
            return false;

          if (
            rarity !== "all" &&
            (
              item.rarityId ??
              item.rarity ??
              ""
            ) !== rarity
          )
            return false;

          if (
            ownership ===
              "owned" &&
            item.ownedQuantity <= 0
          )
            return false;

          if (
            ownership ===
              "unowned" &&
            item.ownedQuantity > 0
          )
            return false;

          if (!query) return true;

          return normalize(
            [
              item.name,
              item.description,
              item.category,
              item.rarity,
              item.slotLabel,
              item.family,
              item.element,
              item.workshopLabel,
            ]
              .filter(Boolean)
              .join(" "),
          ).includes(query);
        })
        .sort((a, b) => {
          if (
            sort ===
            "price-asc"
          )
            return (
              price(a) - price(b)
            );

          if (
            sort ===
            "price-desc"
          )
            return (
              price(b) - price(a)
            );

          if (
            sort ===
            "owned-desc"
          )
            return (
              b.ownedQuantity -
                a.ownedQuantity ||
              a.name.localeCompare(
                b.name,
                "fr-CH",
              )
            );

          return a.name.localeCompare(
            b.name,
            "fr-CH",
          );
        });
    }, [
      category,
      mode,
      modeItems,
      ownership,
      rarity,
      search,
      sort,
    ]);

  const selectedItem =
    visibleItems.find(
      (item) =>
        item.id ===
        selectedItemId,
    ) ??
    visibleItems[0] ??
    null;

  useEffect(() => {
    setSelectedItemId(null);
    setQuantity(1);
  }, [
    selectedBuildingId,
    mode,
  ]);

  async function mutate(
    task: () =>
      Promise<MarketSnapshot>,
  ) {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const value =
        await task();
      setSnapshot(value);
      setQuantity(1);
      setMessage(
        "✅ Marché synchronisé avec TailBlue.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Action impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (
    loading &&
    !snapshot
  ) {
    return (
      <section className="wv3-state">
        <span>🛒</span>
        <h2>
          Ouverture du Marché…
        </h2>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="wv3-state">
        <span>⚠️</span>
        <h2>
          Marché indisponible
        </h2>
        <p>
          {error ??
            "Aucune donnée réelle reçue."}
        </p>
        <button
          onClick={() =>
            void refresh(false)
          }
        >
          Réessayer
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="wv3-page">
        <header className="wv3-heading">
          <div>
            <span className="wv3-eyebrow">
              MONDE • ÉCONOMIE
            </span>
            <h1>🏘️ Marché</h1>
            <p>
              Reconstruction, ateliers, achats et ventes utilisent toujours le moteur RPG canonique.
            </p>
          </div>

          <div className="wv3-heading-actions">
            <span className="wv3-live">
              ● Étape {stage}/5
            </span>
            <button
              className="wv3-refresh"
              disabled={
                refreshing || busy
              }
              onClick={() =>
                void refresh(false)
              }
            >
              ↻{" "}
              {refreshing
                ? "Synchro…"
                : "Actualiser"}
            </button>
          </div>
        </header>

        {(message || error) && (
          <div className="wv3-message">
            {message ||
              `⚠️ ${error}`}
          </div>
        )}

        <article className="wv3-market-hero">
          {/* TAILBLUE_MARKET_MEDIA_V4_20260826 */}
<button
            className="tb-market-media-v4"
            onClick={() =>
              setZoom({
                url: heroImage,
                title:
                  selectedBuilding.name,
              })
            }
          >
            <div
              className="tb-market-media-v4__backdrop"
              style={{
                backgroundImage:
                  `url("${heroImage}")`,
              }}
            />

            <img
              className="tb-market-media-v4__image"
              src={heroImage}
              alt={selectedBuilding.name}
            />

            <span className="tb-market-media-v4__zoom">
              ⛶ Agrandir
            </span>
          </button>

          <div className="wv3-market-copy">
            <span className="wv3-kicker">
              {selectedBuilding.id ===
              "commons"
                ? "PLACE DU MARCHÉ"
                : `ATELIER • ${
                    buildingState?.level ??
                    "—"
                  }/${
                    buildingState?.maxLevel ??
                    "—"
                  }`}
            </span>

            <h2>
              {
                selectedBuilding.emoji
              }{" "}
              {selectedBuilding.name}
            </h2>
            <p>
              {
                selectedBuilding.description
              }
            </p>

            <blockquote>
              <b>
                {
                  selectedBuilding
                    .merchant.name
                }{" "}
                —{" "}
                {
                  selectedBuilding
                    .merchant.title
                }
              </b>
              <span>
                «{" "}
                {
                  selectedBuilding
                    .merchant.greeting
                }{" "}
                »
              </span>
            </blockquote>

            <div className="wv3-chips">
              <span>
                🍪{" "}
                {number(
                  snapshot.cookies,
                )}
              </span>
              <span>
                🎒{" "}
                {
                  snapshot.rpgInventoryCount
                }{" "}
                objets
              </span>
              <span>
                🏗️ {stage}/5
              </span>
            </div>
          </div>
        </article>

        <nav className="wv3-market-buildings">
          {MARKET_BUILDINGS.map(
            (building) => {
              const state =
                snapshot.buildings.find(
                  (entry) =>
                    entry.id ===
                    building.id,
                );

              return (
                <button
                  key={building.id}
                  className={
                    selectedBuildingId ===
                    building.id
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setSelectedBuildingId(
                      building.id,
                    )
                  }
                >
                  <span>
                    {building.emoji}
                  </span>
                  <strong>
                    {building.name}
                  </strong>
                  <small>
                    {building.overviewOnly
                      ? "Place centrale"
                      : state?.owned
                        ? `Niv. ${state.level}/${state.maxLevel}`
                        : snapshot
                              .nextUnlockableBuildingId ===
                            building.id
                          ? `${number(
                              building.unlockCost,
                            )} 🍪`
                          : "À reconstruire"}
                  </small>
                </button>
              );
            },
          )}
        </nav>

        {selectedBuilding.id ===
        "commons" ? (
          <section className="wv3-panel">
            <header className="wv3-section-heading">
              <div>
                <span className="wv3-kicker">
                  RECONSTRUCTION
                </span>
                <h2>
                  Place du Marché
                </h2>
                <p>
                  Chaque atelier reste débloqué et amélioré par le vrai état RPG.
                </p>
              </div>
            </header>

            <div className="wv3-rebuild-grid">
              {MARKET_BUILDINGS.filter(
                (building) =>
                  !building.overviewOnly,
              ).map((building) => {
                const state =
                  snapshot.buildings.find(
                    (entry) =>
                      entry.id ===
                      building.id,
                  );

                return (
                  <article
                    key={building.id}
                    className={
                      state?.owned
                        ? "done"
                        : ""
                    }
                  >
                    <span>
                      {state?.owned
                        ? "✓"
                        : building.emoji}
                    </span>
                    <strong>
                      {building.name}
                    </strong>
                    <small>
                      {state?.owned
                        ? `Niveau ${state.level}/${state.maxLevel}`
                        : `${number(
                            building.unlockCost,
                          )} 🍪`}
                    </small>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="wv3-market-layout">
            <aside className="wv3-panel market-side">
              <span className="wv3-kicker">
                ATELIER
              </span>
              <h3>
                {
                  selectedBuilding.emoji
                }{" "}
                {
                  selectedBuilding.name
                }
              </h3>

              <div className="wv3-side-stats">
                <span>
                  <small>État</small>
                  <b>
                    {buildingState?.owned
                      ? "Reconstruit"
                      : "Fermé"}
                  </b>
                </span>
                <span>
                  <small>Niveau</small>
                  <b>
                    {buildingState?.owned
                      ? `${buildingState.level}/${buildingState.maxLevel}`
                      : "—"}
                  </b>
                </span>
                <span>
                  <small>
                    Coût initial
                  </small>
                  <b>
                    {number(
                      selectedBuilding.unlockCost,
                    )}{" "}
                    🍪
                  </b>
                </span>
              </div>

              {!buildingState?.owned ? (
                <button
                  className="wv3-primary"
                  disabled={
                    busy ||
                    buildingState
                      ?.canPurchase ===
                      false
                  }
                  onClick={() =>
                    void mutate(() =>
                      worldApi.buyMarketBuilding(
                        selectedBuilding.id,
                      )
                    )
                  }
                >
                  Reconstruire
                </button>
              ) : (
                <button
                  className="wv3-primary"
                  disabled={
                    busy ||
                    buildingState.level >=
                      buildingState.maxLevel ||
                    buildingState
                      .canUpgrade ===
                      false
                  }
                  onClick={() =>
                    void mutate(() =>
                      worldApi.upgradeMarketBuilding(
                        selectedBuilding.id,
                      )
                    )
                  }
                >
                  {buildingState.level >=
                  buildingState.maxLevel
                    ? "Atelier au maximum"
                    : `Améliorer • ${
                        buildingState.upgradeCost
                          ? `${number(
                              buildingState.upgradeCost,
                            )} 🍪`
                          : "niveau suivant"
                      }`}
                </button>
              )}

              {buildingState?.lockReason && (
                <div className="wv3-note">
                  {
                    buildingState.lockReason
                  }
                </div>
              )}
            </aside>

            <section className="wv3-panel shop">
              <header className="wv3-shop-heading">
                <div>
                  <span className="wv3-kicker">
                    BOUTIQUE
                  </span>
                  <h2>
                    Stock réel de{" "}
                    {
                      selectedBuilding
                        .merchant.name
                    }
                  </h2>
                </div>

                <div className="wv3-segmented">
                  <button
                    className={
                      mode === "buy"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setMode("buy")
                    }
                  >
                    🛒 Achat
                  </button>
                  <button
                    className={
                      mode === "sell"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setMode("sell")
                    }
                  >
                    💰 Vente
                  </button>
                </div>
              </header>

              {buildingState?.owned && (
                <div className="wv3-shop-filters">
                  <label className="wv3-search wide">
                    <span>⌕</span>
                    <input
                      value={search}
                      onChange={(event) =>
                        setSearch(
                          event.target
                            .value,
                        )
                      }
                      placeholder="Rechercher un objet…"
                    />
                  </label>

                  <div className="wv3-filter-grid">
                    <select
                      value={category}
                      onChange={(event) =>
                        setCategory(
                          event.target
                            .value,
                        )
                      }
                    >
                      <option value="all">
                        Toutes catégories
                      </option>
                      {categories.map(
                        (value) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {CATEGORY_LABELS[
                              value
                            ] ?? value}
                          </option>
                        ),
                      )}
                    </select>

                    <select
                      value={rarity}
                      onChange={(event) =>
                        setRarity(
                          event.target
                            .value,
                        )
                      }
                    >
                      <option value="all">
                        Toutes raretés
                      </option>
                      {rarities.map(
                        ([id, label]) => (
                          <option
                            key={id}
                            value={id}
                          >
                            {label}
                          </option>
                        ),
                      )}
                    </select>

                    <select
                      value={ownership}
                      onChange={(event) =>
                        setOwnership(
                          event.target
                            .value as OwnershipFilter,
                        )
                      }
                    >
                      <option value="all">
                        Toute possession
                      </option>
                      <option value="owned">
                        Possédés
                      </option>
                      {mode === "buy" && (
                        <option value="unowned">
                          Non possédés
                        </option>
                      )}
                    </select>

                    <select
                      value={sort}
                      onChange={(event) =>
                        setSort(
                          event.target
                            .value as SortMode,
                        )
                      }
                    >
                      <option value="name">
                        Nom A→Z
                      </option>
                      <option value="price-asc">
                        Prix croissant
                      </option>
                      <option value="price-desc">
                        Prix décroissant
                      </option>
                      <option value="owned-desc">
                        Quantité possédée
                      </option>
                    </select>
                  </div>
                </div>
              )}

              {!buildingState?.owned ? (
                <div className="wv3-empty">
                  <span>🔒</span>
                  <h3>
                    Atelier fermé
                  </h3>
                </div>
              ) : !visibleItems.length ? (
                <div className="wv3-empty">
                  <span>📭</span>
                  <h3>
                    Aucun objet
                  </h3>
                </div>
              ) : (
                <div className="wv3-shop-body">
                  <div className="wv3-shop-scroll">
                    {visibleItems.map(
                      (item) => (
                        <button
                          key={item.id}
                          className={
                            selectedItem
                              ?.id ===
                            item.id
                              ? "active"
                              : ""
                          }
                          onClick={() => {
                            setSelectedItemId(
                              item.id,
                            );
                            setQuantity(
                              1,
                            );
                          }}
                        >
                          <span className="wv3-item-icon">
                            {item.emoji ??
                              "📦"}
                          </span>
                          <span>
                            <strong>
                              {
                                item.name
                              }
                            </strong>
                            <small>
                              {item.rarity ??
                                "Rareté inconnue"}
                            </small>
                          </span>
                          <b>
                            {number(
                              mode ===
                                "buy"
                                ? item.buyPrice
                                : item.sellPrice,
                            )}{" "}
                            🍪
                          </b>
                        </button>
                      ),
                    )}
                  </div>

                  {selectedItem && (
                    <aside className="wv3-item-detail">
                      <span className="wv3-item-big">
                        {selectedItem.emoji ??
                          "📦"}
                      </span>
                      <span className="wv3-kicker">
                        {selectedItem.rarity ??
                          "Rareté inconnue"}
                      </span>
                      <h3>
                        {
                          selectedItem.name
                        }
                      </h3>
                      <p>
                        {selectedItem.description ||
                          "Objet du catalogue TailBlue."}
                      </p>

                      <div className="wv3-chips">
                        <span>
                          Possédé x
                          {
                            selectedItem
                              .ownedQuantity
                          }
                        </span>
                        {selectedItem.slotLabel && (
                          <span>
                            {
                              selectedItem.slotLabel
                            }
                          </span>
                        )}
                        {selectedItem.element && (
                          <span>
                            {
                              selectedItem.element
                            }
                          </span>
                        )}
                      </div>

                      <div className="wv3-quantity">
                        <button
                          onClick={() =>
                            setQuantity(
                              Math.max(
                                1,
                                quantity -
                                  1,
                              ),
                            )
                          }
                        >
                          −
                        </button>
                        <strong>
                          {quantity}
                        </strong>
                        <button
                          onClick={() =>
                            setQuantity(
                              Math.min(
                                99,
                                quantity +
                                  1,
                              ),
                            )
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="wv3-primary"
                        disabled={busy}
                        onClick={() =>
                          void mutate(() =>
                            worldApi.marketTransaction(
                              selectedBuilding.id,
                              selectedItem.id,
                              mode,
                              quantity,
                            )
                          )
                        }
                      >
                        {mode ===
                        "buy"
                          ? "Acheter"
                          : "Vendre"}{" "}
                        x{quantity} •{" "}
                        {number(
                          (
                            mode ===
                              "buy"
                              ? selectedItem.buyPrice
                              : selectedItem.sellPrice
                          ) *
                            quantity,
                        )}{" "}
                        🍪
                      </button>
                    </aside>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </section>

      <TailBlueImageViewer
        open={Boolean(zoom)}
        imageUrl={zoom?.url ?? null}
        title={zoom?.title ?? ""}
        onClose={() =>
          setZoom(null)
        }
      />
    </>
  );
}
