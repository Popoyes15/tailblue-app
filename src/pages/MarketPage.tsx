import { useEffect, useMemo, useState } from "react";
import { worldApi } from "../api/worldApi";
import {
  MARKET_BUILDINGS,
  MARKET_BUILDING_BY_ID,
  MARKET_STAGE_IMAGES,
  MAX_MARKET_WORKSHOP_LEVEL,
} from "../data/worldData";
import type { MarketItemDto, MarketSnapshot } from "../types/world";
import "./worldFinal.css";

type Mode = "buy" | "sell";

function formatCookies(value: number) {
  return value.toLocaleString("fr-CH");
}

export default function MarketPage() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState("commons");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("buy");
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    if (!worldApi.configured) return;
    try {
      const data = await worldApi.getMarket();
      setSnapshot(data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "API indisponible.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const selectedBuilding =
    MARKET_BUILDING_BY_ID[
      selectedBuildingId as keyof typeof MARKET_BUILDING_BY_ID
    ] ?? MARKET_BUILDING_BY_ID.commons;

  const buildingState = snapshot?.buildings.find(
    (entry) => entry.id === selectedBuilding.id,
  );

  const stage = snapshot?.stage ?? 0;
  const heroImage =
    selectedBuilding.id === "commons"
      ? MARKET_STAGE_IMAGES[stage] ?? MARKET_STAGE_IMAGES[0]
      : selectedBuilding.interiorImage ?? MARKET_STAGE_IMAGES[stage] ?? MARKET_STAGE_IMAGES[0];

  const shopItems = snapshot?.shops?.[selectedBuilding.id] ?? [];
  const visibleItems = useMemo(
    () =>
      mode === "buy"
        ? shopItems.filter((item) => item.buyPrice > 0)
        : shopItems.filter(
            (item) => item.sellPrice > 0 && item.ownedQuantity > 0,
          ),
    [mode, shopItems],
  );

  const selectedItem =
    visibleItems.find((item) => item.id === selectedItemId) ??
    visibleItems[0] ??
    null;

  useEffect(() => {
    setSelectedItemId(null);
    setQuantity(1);
  }, [selectedBuildingId, mode]);

  async function apply(
    action:
      | { kind: "buy-building"; buildingId: string }
      | { kind: "upgrade"; buildingId: string }
      | {
          kind: "transaction";
          buildingId: string;
          item: MarketItemDto;
          mode: Mode;
          quantity: number;
        },
  ) {
    if (!worldApi.configured || busy) return;
    setBusy(true);
    setMessage("");
    try {
      let data: MarketSnapshot;
      if (action.kind === "buy-building") {
        data = await worldApi.buyMarketBuilding(action.buildingId);
      } else if (action.kind === "upgrade") {
        data = await worldApi.upgradeMarketBuilding(action.buildingId);
      } else {
        data = await worldApi.marketTransaction(
          action.buildingId,
          action.item.id,
          action.mode,
          action.quantity,
        );
      }
      setSnapshot(data);
      setQuantity(1);
      setMessage("✅ Marché synchronisé avec TailBlue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="world-page">
      <header className="world-heading">
        <div>
          <span className="world-eyebrow">MONDE • ÉCONOMIE</span>
          <h1>🏘️ Marché</h1>
          <p>
            Reconstruction séquentielle, ateliers niveau 1 à 6, achat et vente
            directement reliés à l’inventaire RPG.
          </p>
        </div>
        <div className={`world-api-pill ${snapshot ? "is-live" : ""}`}>
          {snapshot ? `● Étape ${stage}/5` : "○ Marché réel non connecté"}
        </div>
      </header>

      {message && <div className="world-message">{message}</div>}

      <article className="world-panel world-market-hero">
        <div className="world-market-art">
          <div
            className="world-image-blur"
            style={{ backgroundImage: `url("${heroImage}")` }}
          />
          <img src={heroImage} alt={selectedBuilding.name} />
        </div>
        <div className="world-market-intro">
          <span className="world-kicker">
            {selectedBuilding.id === "commons"
              ? "PLACE DU MARCHÉ"
              : `ATELIER • ${buildingState?.level ?? "—"}/${MAX_MARKET_WORKSHOP_LEVEL}`}
          </span>
          <h2>
            {selectedBuilding.emoji} {selectedBuilding.name}
          </h2>
          <p>{selectedBuilding.description}</p>
          <blockquote>
            <strong>
              {selectedBuilding.merchant.name} —{" "}
              {selectedBuilding.merchant.title}
            </strong>
            <span>« {selectedBuilding.merchant.greeting} »</span>
          </blockquote>
          <div className="world-inline-tags">
            <span>
              🍪 Réserve :{" "}
              {snapshot ? formatCookies(snapshot.cookies) : "—"}
            </span>
            <span>
              🎒 Inventaire RPG :{" "}
              {snapshot ? snapshot.rpgInventoryCount : "—"}
            </span>
            <span>🏗️ Reconstruction : {snapshot ? `${stage}/5` : "—"}</span>
          </div>
        </div>
      </article>

      <div className="world-market-building-row">
        {MARKET_BUILDINGS.map((building) => {
          const state = snapshot?.buildings.find((s) => s.id === building.id);
          const isNext =
            snapshot?.nextUnlockableBuildingId === building.id;
          return (
            <button
              key={building.id}
              className={`world-market-building ${
                selectedBuildingId === building.id ? "active" : ""
              }`}
              onClick={() => setSelectedBuildingId(building.id)}
            >
              <span>{building.emoji}</span>
              <b>{building.name}</b>
              <small>
                {building.overviewOnly
                  ? "Toujours ouverte"
                  : state?.owned
                    ? `Niveau ${state.level}/${MAX_MARKET_WORKSHOP_LEVEL}`
                    : isNext
                      ? `${formatCookies(building.unlockCost)} 🍪`
                      : "À reconstruire"}
              </small>
            </button>
          );
        })}
      </div>

      {selectedBuilding.id !== "commons" && (
        <div className="world-market-layout">
          <aside className="world-panel world-market-sidebar">
            <span className="world-kicker">ATELIER</span>
            <h3>
              {selectedBuilding.emoji} {selectedBuilding.name}
            </h3>

            <div className="world-stat-list">
              <span>
                <small>État</small>
                <b>{buildingState?.owned ? "Reconstruit" : "Fermé"}</b>
              </span>
              <span>
                <small>Niveau</small>
                <b>
                  {buildingState?.owned
                    ? `${buildingState.level}/${MAX_MARKET_WORKSHOP_LEVEL}`
                    : "—"}
                </b>
              </span>
              <span>
                <small>Coût initial</small>
                <b>{formatCookies(selectedBuilding.unlockCost)} 🍪</b>
              </span>
              {buildingState?.upgradeCost != null && (
                <span>
                  <small>Amélioration</small>
                  <b>{formatCookies(buildingState.upgradeCost)} 🍪</b>
                </span>
              )}
            </div>

            {!buildingState?.owned ? (
              <button
                className="world-primary-button"
                disabled={
                  busy ||
                  !worldApi.configured ||
                  buildingState?.canPurchase === false
                }
                onClick={() =>
                  void apply({
                    kind: "buy-building",
                    buildingId: selectedBuilding.id,
                  })
                }
              >
                {worldApi.configured
                  ? `Reconstruire • ${formatCookies(selectedBuilding.unlockCost)} 🍪`
                  : "Connexion TailBlue requise"}
              </button>
            ) : (
              <button
                className="world-primary-button"
                disabled={
                  busy ||
                  !worldApi.configured ||
                  buildingState.level >= MAX_MARKET_WORKSHOP_LEVEL ||
                  buildingState.canUpgrade === false
                }
                onClick={() =>
                  void apply({
                    kind: "upgrade",
                    buildingId: selectedBuilding.id,
                  })
                }
              >
                {buildingState.level >= MAX_MARKET_WORKSHOP_LEVEL
                  ? "Atelier au maximum"
                  : `Améliorer au niveau ${buildingState.level + 1}`}
              </button>
            )}

            {buildingState?.lockReason && (
              <div className="world-note">{buildingState.lockReason}</div>
            )}
          </aside>

          <article className="world-panel world-shop-panel">
            <div className="world-shop-toolbar">
              <div>
                <span className="world-kicker">BOUTIQUE</span>
                <h2>Stock réel de {selectedBuilding.merchant.name}</h2>
              </div>
              <div className="world-segmented">
                <button
                  className={mode === "buy" ? "active" : ""}
                  onClick={() => setMode("buy")}
                >
                  🛒 Achat
                </button>
                <button
                  className={mode === "sell" ? "active" : ""}
                  onClick={() => setMode("sell")}
                >
                  💰 Vente
                </button>
              </div>
            </div>

            {!snapshot ? (
              <div className="world-empty">
                <span>📦</span>
                <h3>Stock non connecté</h3>
                <p>
                  Aucun objet fictif : le catalogue sera généré depuis
                  <code> ITEMS </code>
                  selon le bâtiment et le niveau réel de l’atelier.
                </p>
              </div>
            ) : !buildingState?.owned ? (
              <div className="world-empty">
                <span>🔒</span>
                <h3>Atelier fermé</h3>
                <p>Il faut d’abord reconstruire ce bâtiment.</p>
              </div>
            ) : !visibleItems.length ? (
              <div className="world-empty">
                <span>📭</span>
                <h3>Aucun objet dans ce mode</h3>
                <p>
                  {mode === "buy"
                    ? "Aucun article achetable à ce niveau."
                    : "Tu n’as actuellement rien à vendre ici."}
                </p>
              </div>
            ) : (
              <div className="world-shop-body">
                <div className="world-shop-list">
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      className={
                        selectedItem?.id === item.id ? "active" : ""
                      }
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setQuantity(1);
                      }}
                    >
                      <span className="world-item-emoji">
                        {item.emoji ?? "📦"}
                      </span>
                      <span>
                        <b>{item.name}</b>
                        <small>{item.rarity ?? "Rareté inconnue"}</small>
                      </span>
                      <strong>
                        {formatCookies(
                          mode === "buy" ? item.buyPrice : item.sellPrice,
                        )}{" "}
                        🍪
                      </strong>
                    </button>
                  ))}
                </div>

                {selectedItem && (
                  <div className="world-item-detail">
                    <span className="world-item-big-emoji">
                      {selectedItem.emoji ?? "📦"}
                    </span>
                    <span className="world-kicker">
                      {selectedItem.rarity ?? "Rareté inconnue"}
                    </span>
                    <h3>{selectedItem.name}</h3>
                    <p>
                      {selectedItem.description ??
                        "Objet du catalogue TailBlue."}
                    </p>
                    <div className="world-inline-tags">
                      <span>Possédé : x{selectedItem.ownedQuantity}</span>
                      <span>
                        Achat : {formatCookies(selectedItem.buyPrice)} 🍪
                      </span>
                      <span>
                        Vente : {formatCookies(selectedItem.sellPrice)} 🍪
                      </span>
                    </div>

                    <div className="world-quantity">
                      <button
                        onClick={() =>
                          setQuantity((value) => Math.max(1, value - 1))
                        }
                      >
                        −
                      </button>
                      <strong>{quantity}</strong>
                      <button
                        onClick={() =>
                          setQuantity((value) => Math.min(99, value + 1))
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="world-primary-button"
                      disabled={busy}
                      onClick={() =>
                        void apply({
                          kind: "transaction",
                          buildingId: selectedBuilding.id,
                          item: selectedItem,
                          mode,
                          quantity,
                        })
                      }
                    >
                      {mode === "buy" ? "Acheter" : "Vendre"} x{quantity} •{" "}
                      {formatCookies(
                        (mode === "buy"
                          ? selectedItem.buyPrice
                          : selectedItem.sellPrice) * quantity,
                      )}{" "}
                      🍪
                    </button>
                  </div>
                )}
              </div>
            )}
          </article>
        </div>
      )}

      {selectedBuilding.id === "commons" && (
        <div className="world-panel">
          <div className="world-section-title">
            <div>
              <span className="world-kicker">RECONSTRUCTION</span>
              <h2>Ordre du Marché</h2>
            </div>
          </div>
          <div className="world-reconstruction-track">
            {MARKET_BUILDINGS.filter((b) => !b.overviewOnly).map(
              (building, index) => {
                const state = snapshot?.buildings.find(
                  (s) => s.id === building.id,
                );
                return (
                  <div
                    key={building.id}
                    className={state?.owned ? "done" : ""}
                  >
                    <span>{state?.owned ? "✓" : index + 1}</span>
                    <b>
                      {building.emoji} {building.name}
                    </b>
                    <small>{formatCookies(building.unlockCost)} 🍪</small>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}
    </section>
  );
}
