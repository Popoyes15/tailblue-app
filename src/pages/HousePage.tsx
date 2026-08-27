// TAILBLUE_WORLD_APP_V3_20260826
import {
  useMemo,
  useState,
} from "react";

import {
  resolveWorldAssetUrl,
  worldApi,
} from "../api/worldApi";
import TailBlueImageViewer from "../components/TailBlueImageViewer";
import { useWorldSnapshot } from "../hooks/useWorldSnapshot";
import type {
  HouseDefinition,
  HouseFurnitureDto,
} from "../types/world";

import "./worldV3.css";

type Tab =
  | "residence"
  | "catalogue"
  | "mobilier";

function number(value: number) {
  return value.toLocaleString("fr-CH");
}

function signed(
  value: number,
  suffix = "",
) {
  return `${value >= 0 ? "+" : ""}${value}${suffix}`;
}

function effectText(
  item: HouseFurnitureDto,
) {
  const labels:
    Record<string, string> = {
      mine_rest_minutes: "Repos Mine",
      activity_cooldown_minutes:
        "Cooldown Work/Hunt",
      xp_pct: "XP",
      cookies_pct: "Cookies",
    };

  const entries =
    Object.entries(
      item.effects ?? {},
    ).filter(([, value]) =>
      Number(value) !== 0
    );

  if (!entries.length) {
    return "Décoratif";
  }

  return entries
    .map(([key, value]) => {
      const numeric =
        Number(value);
      return `${
        labels[key] ?? key
      } ${
        numeric >= 0 ? "+" : ""
      }${numeric}`;
    })
    .join(" • ");
}

function houseImage(
  house?: HouseDefinition | null,
) {
  return resolveWorldAssetUrl(
    house?.imageUrl ??
    house?.image ??
    null,
  );
}

export default function HousePage() {
  const {
    snapshot,
    setSnapshot,
    loading,
    refreshing,
    error,
    refresh,
  } = useWorldSnapshot({
    cacheKey: "house",
    loader: worldApi.getHouse,
  });

  const [tab, setTab] =
    useState<Tab>("residence");

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [category, setCategory] =
    useState("all");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [zoom, setZoom] =
    useState<{
      url: string;
      title: string;
    } | null>(null);

  const catalog =
    snapshot?.catalog ?? [];

  const currentHouse =
    catalog.find(
      (house) =>
        house.id ===
        snapshot?.currentHouseId,
    ) ?? catalog[0];

  const selectedHouse =
    catalog.find(
      (house) =>
        house.id === selectedId,
    ) ?? currentHouse;

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          (snapshot?.furniture ?? [])
            .map((item) =>
              String(
                item.category ??
                "autres",
              )
            )
        ),
      ).sort((a, b) =>
        a.localeCompare(
          b,
          "fr-CH",
        )
      ),
    [snapshot],
  );

  const furniture = useMemo(
    () => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "fr-CH",
          );

      return (
        snapshot?.furniture ?? []
      ).filter((item) => {
        if (
          category !== "all" &&
          item.category !== category
        ) {
          return false;
        }

        if (!query) return true;

        return [
          item.name,
          item.description,
          item.category,
          effectText(item),
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(
            "fr-CH",
          )
          .includes(query);
      });
    },
    [
      category,
      search,
      snapshot,
    ],
  );

  async function mutate(
    task:
      () => Promise<
        NonNullable<
          typeof snapshot
        >
      >,
    success: string,
  ) {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const value =
        await task();
      setSnapshot(value);
      setMessage(success);
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
        <span>🏠</span>
        <h2>Ouverture de ta résidence…</h2>
        <p>
          Lecture de l’état réel TailBlue.
        </p>
      </section>
    );
  }

  if (!snapshot || !currentHouse) {
    return (
      <section className="wv3-state">
        <span>⚠️</span>
        <h2>Maison indisponible</h2>
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

  const image =
    houseImage(currentHouse);

  return (
    <>
      <section className="wv3-page">
        <header className="wv3-heading">
          <div>
            <span className="wv3-eyebrow">
              MONDE • RÉSIDENCE
            </span>
            <h1>🏠 Maison</h1>
            <p>
              Propriété, résidence partagée et mobilier viennent directement du moteur Discord.
            </p>
          </div>

          <div className="wv3-heading-actions">
            <span className="wv3-live">
              ● TailBlue synchronisé
            </span>
            <button
              className="wv3-refresh"
              onClick={() =>
                void refresh(false)
              }
              disabled={
                refreshing || busy
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

        <nav className="wv3-tabs">
          <button
            className={
              tab === "residence"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("residence")
            }
          >
            🏠 Résidence
          </button>
          <button
            className={
              tab === "catalogue"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("catalogue")
            }
          >
            🗝️ Catalogue
          </button>
          <button
            className={
              tab === "mobilier"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("mobilier")
            }
          >
            🪑 Mobilier
          </button>
        </nav>

        {tab === "residence" && (
          <>
            <article className="wv3-hero house">
              {image && (
                <button
                  className="wv3-hero-art"
                  onClick={() =>
                    setZoom({
                      url: image,
                      title:
                        currentHouse.name,
                    })
                  }
                >
                  <div
                    className="wv3-blur"
                    style={{
                      backgroundImage:
                        `url("${image}")`,
                    }}
                  />
                  <img
                    src={image}
                    alt={
                      currentHouse.name
                    }
                  />
                  <span>⛶ Agrandir</span>
                </button>
              )}

              <div className="wv3-hero-copy">
                <span className="wv3-kicker">
                  RÉSIDENCE ACTUELLE
                </span>
                <h2>
                  {currentHouse.name}
                </h2>
                <p>
                  {
                    currentHouse.description
                  }
                </p>

                <div className="wv3-chips">
                  <span>
                    ✨ Niveau{" "}
                    {
                      snapshot.playerLevel
                    }
                  </span>
                  <span>
                    🍪{" "}
                    {number(
                      snapshot.cookies,
                    )}
                  </span>
                  <span>
                    🪑{" "}
                    {
                      snapshot.furnitureSlotsUsed
                    }
                    /
                    {
                      snapshot.furnitureSlotsTotal
                    }
                  </span>
                  {snapshot.sharedResidence && (
                    <span>
                      💞 Foyer partagé
                      {snapshot.spouseName
                        ? ` avec ${snapshot.spouseName}`
                        : ""}
                    </span>
                  )}
                </div>
              </div>
            </article>

            <div className="wv3-stat-grid four">
              <article>
                <span>🍪 Cookies</span>
                <strong>
                  {signed(
                    currentHouse.effect
                      .cookiesPct,
                    " %",
                  )}
                </strong>
              </article>
              <article>
                <span>✨ XP</span>
                <strong>
                  {signed(
                    currentHouse.effect
                      .xpPct,
                    " %",
                  )}
                </strong>
              </article>
              <article>
                <span>
                  ⏳ Work / Hunt
                </span>
                <strong>
                  {signed(
                    currentHouse.effect
                      .cooldownMinutes,
                    " min",
                  )}
                </strong>
              </article>
              <article>
                <span>
                  🎨 Mobilier
                </span>
                <strong>
                  {snapshot.furnitureStyle ??
                    "Personnel"}
                </strong>
              </article>
            </div>

            {snapshot.sharedResidence && (
              <div className="wv3-note">
                💞 Ta résidence effective est partagée. Une nouvelle propriété personnelle n’expulse pas automatiquement ton conjoint : même règle que Discord.
              </div>
            )}
          </>
        )}

        {tab === "catalogue" && (
          <div className="wv3-catalog-layout">
            <div className="wv3-card-grid house-cards">
              {catalog.map(
                (house) => {
                  const owned =
                    snapshot.ownedHouseId ===
                    house.id;
                  const selected =
                    selectedHouse?.id ===
                    house.id;

                  const lockedLevel =
                    snapshot.playerLevel <
                    house.levelRequired;

                  const lockedMoney =
                    house.price != null &&
                    snapshot.cookies <
                      house.price;

                  return (
                    <button
                      key={house.id}
                      className={[
                        "wv3-house-card",
                        selected
                          ? "selected"
                          : "",
                        owned
                          ? "owned"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        setSelectedId(
                          house.id,
                        )
                      }
                    >
                      {houseImage(
                        house,
                      ) && (
                        <img
                          src={
                            houseImage(
                              house,
                            )!
                          }
                          alt=""
                        />
                      )}
                      <div>
                        <strong>
                          {house.name}
                        </strong>
                        <small>
                          Niveau{" "}
                          {
                            house.levelRequired
                          }
                        </small>
                        <span>
                          {house.price ==
                          null
                            ? "Réservée"
                            : `${number(
                                house.price,
                              )} 🍪`}
                        </span>
                        {owned && (
                          <em>
                            ✓ Possédée
                          </em>
                        )}
                        {!owned &&
                          lockedLevel && (
                            <em>
                              🔒 Niveau
                            </em>
                          )}
                        {!owned &&
                          !lockedLevel &&
                          lockedMoney && (
                            <em>
                              🍪 Fonds
                            </em>
                          )}
                      </div>
                    </button>
                  );
                },
              )}
            </div>

            {selectedHouse && (
              <article className="wv3-selected">
                {houseImage(
                  selectedHouse,
                ) && (
                  <button
                    className="wv3-selected-art"
                    onClick={() =>
                      setZoom({
                        url:
                          houseImage(
                            selectedHouse,
                          )!,
                        title:
                          selectedHouse.name,
                      })
                    }
                  >
                    <div
                      className="wv3-blur"
                      style={{
                        backgroundImage:
                          `url("${houseImage(
                            selectedHouse,
                          )}")`,
                      }}
                    />
                    <img
                      src={
                        houseImage(
                          selectedHouse,
                        )!
                      }
                      alt={
                        selectedHouse.name
                      }
                    />
                  </button>
                )}

                <div>
                  <span className="wv3-kicker">
                    CATALOGUE ROYAL
                  </span>
                  <h2>
                    {
                      selectedHouse.name
                    }
                  </h2>
                  <p>
                    {
                      selectedHouse.description
                    }
                  </p>

                  <div className="wv3-chips">
                    <span>
                      🍪{" "}
                      {signed(
                        selectedHouse
                          .effect
                          .cookiesPct,
                        " %",
                      )}
                    </span>
                    <span>
                      ✨{" "}
                      {signed(
                        selectedHouse
                          .effect.xpPct,
                        " %",
                      )}
                    </span>
                    <span>
                      ⏳{" "}
                      {signed(
                        selectedHouse
                          .effect
                          .cooldownMinutes,
                        " min",
                      )}
                    </span>
                    <span>
                      🪑{" "}
                      {
                        selectedHouse.furnitureSlots
                      }{" "}
                      slots
                    </span>
                  </div>

                  <button
                    className="wv3-primary"
                    disabled={
                      busy ||
                      !selectedHouse
                        .purchasable ||
                      snapshot
                        .ownedHouseId ===
                        selectedHouse.id ||
                      snapshot
                        .playerLevel <
                        selectedHouse
                          .levelRequired ||
                      (
                        selectedHouse
                          .price != null &&
                        snapshot.cookies <
                          selectedHouse
                            .price
                      )
                    }
                    onClick={() =>
                      void mutate(
                        () =>
                          worldApi.buyHouse(
                            selectedHouse.id,
                          ),
                        "🏠 Propriété enregistrée dans TailBlue.",
                      )
                    }
                  >
                    {snapshot
                      .ownedHouseId ===
                    selectedHouse.id
                      ? "✓ Déjà possédée"
                      : selectedHouse
                            .price ==
                          null
                        ? "Non achetable"
                        : `Acheter • ${number(
                            selectedHouse.price,
                          )} 🍪`}
                  </button>
                </div>
              </article>
            )}
          </div>
        )}

        {tab === "mobilier" && (
          <section className="wv3-panel">
            <header className="wv3-section-heading">
              <div>
                <span className="wv3-kicker">
                  AMÉNAGEMENT
                </span>
                <h2>
                  Mobilier réel
                </h2>
                <p>
                  Acheter, installer et ranger modifient le même profil que les boutons Discord.
                </p>
              </div>

              <strong>
                {
                  snapshot.furnitureSlotsUsed
                }
                /
                {
                  snapshot.furnitureSlotsTotal
                }{" "}
                installés
              </strong>
            </header>

            <div className="wv3-filterbar">
              <label className="wv3-search">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Chercher un meuble ou un bonus…"
                />
              </label>

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value,
                  )
                }
              >
                <option value="all">
                  Toutes les catégories
                </option>
                {categories.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="wv3-card-grid furniture">
              {furniture.map(
                (item) => (
                  <article
                    key={item.id}
                    className={[
                      "wv3-furniture-card",
                      item.installed
                        ? "installed"
                        : "",
                      item.canUse ===
                      false
                        ? "locked"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className="wv3-furniture-icon">
                      {item.emoji ??
                        "🪑"}
                    </span>

                    <div>
                      <small>
                        {item.category ??
                          "Mobilier"}
                      </small>
                      <h3>
                        {item.name}
                      </h3>
                      <p>
                        {
                          item.description
                        }
                      </p>
                      <em>
                        {effectText(
                          item,
                        )}
                      </em>
                    </div>

                    <div className="wv3-furniture-meta">
                      <span>
                        Possédé : x
                        {item.owned ?? 0}
                      </span>
                      <span>
                        {number(
                          item.price ?? 0,
                        )}{" "}
                        🍪
                      </span>
                    </div>

                    <div className="wv3-card-actions">
                      {item.canUse ===
                      false ? (
                        <button
                          disabled
                        >
                          🔒 Résidence trop petite
                        </button>
                      ) : (item.owned ??
                          0) <= 0 ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              () =>
                                worldApi.houseFurniture(
                                  "buy",
                                  item.id,
                                ),
                              "🪑 Mobilier acheté.",
                            )
                          }
                        >
                          Acheter
                        </button>
                      ) : item.installed ? (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              () =>
                                worldApi.houseFurniture(
                                  "store",
                                  item.id,
                                ),
                              "📦 Mobilier rangé.",
                            )
                          }
                        >
                          Ranger
                        </button>
                      ) : (
                        <button
                          className="accent"
                          disabled={busy}
                          onClick={() =>
                            void mutate(
                              () =>
                                worldApi.houseFurniture(
                                  "install",
                                  item.id,
                                ),
                              "✨ Mobilier installé.",
                            )
                          }
                        >
                          Installer
                        </button>
                      )}
                    </div>
                  </article>
                ),
              )}
            </div>
          </section>
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
