import { useEffect, useMemo, useState } from "react";
import { worldApi } from "../api/worldApi";
import {
  HOUSE_BY_ID,
  HOUSE_FURNITURE_BONUS_CAPS,
  HOUSE_FURNITURE_CATEGORIES,
  HOUSES,
} from "../data/worldData";
import type { HouseId, HouseSnapshot } from "../types/world";
import "./worldFinal.css";

type Tab = "residence" | "catalogue" | "mobilier";

function signed(value: number, suffix = "") {
  return `${value >= 0 ? "+" : ""}${value}${suffix}`;
}

function formatCookies(value: number | null) {
  if (value === null) return "Réservé à Hime-sama";
  return `${value.toLocaleString("fr-CH")} cookies`;
}

export default function HousePage() {
  const [snapshot, setSnapshot] = useState<HouseSnapshot | null>(null);
  const [tab, setTab] = useState<Tab>("residence");
  const [selectedId, setSelectedId] = useState<HouseId>("sans_abri");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    if (!worldApi.configured) return;
    try {
      const data = await worldApi.getHouse();
      setSnapshot(data);
      setSelectedId(data.currentHouseId);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "API indisponible.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const currentId = snapshot?.currentHouseId ?? selectedId;
  const currentHouse = HOUSE_BY_ID[currentId] ?? HOUSE_BY_ID.sans_abri;
  const selectedHouse = HOUSE_BY_ID[selectedId] ?? currentHouse;

  const slotsUsed =
    snapshot?.furnitureSlotsUsed ??
    snapshot?.installedFurnitureIds?.length ??
    0;
  const slotsTotal =
    snapshot?.furnitureSlotsTotal ?? currentHouse.furnitureSlots;

  const furnitureByCategory = useMemo(() => {
    const result = new Map<string, NonNullable<HouseSnapshot["furniture"]>>();
    for (const item of snapshot?.furniture ?? []) {
      const key = item.category || "autres";
      const list = result.get(key) ?? [];
      list.push(item);
      result.set(key, list);
    }
    return result;
  }, [snapshot]);

  async function buyHouse(houseId: HouseId) {
    if (!worldApi.configured || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await worldApi.buyHouse(houseId);
      setSnapshot(data);
      setSelectedId(data.currentHouseId);
      setMessage("🏠 Résidence achetée. Les données viennent de TailBlue.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Achat impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function furnitureAction(
    action: "buy" | "install" | "store",
    itemId: string,
  ) {
    if (!worldApi.configured || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await worldApi.houseFurniture(action, itemId);
      setSnapshot(data);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Action mobilier impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="world-page">
      <header className="world-heading">
        <div>
          <span className="world-eyebrow">MONDE • RÉSIDENCE</span>
          <h1>🏠 Maison</h1>
          <p>
            Résidence effective, propriété personnelle et mobilier — prêts à
            être branchés au même état que le bot.
          </p>
        </div>
        <div className={`world-api-pill ${snapshot ? "is-live" : ""}`}>
          {snapshot ? "● TailBlue connecté" : "○ Aperçu local"}
        </div>
      </header>

      <div className="world-tabs">
        <button
          className={tab === "residence" ? "active" : ""}
          onClick={() => setTab("residence")}
        >
          Ma résidence
        </button>
        <button
          className={tab === "catalogue" ? "active" : ""}
          onClick={() => setTab("catalogue")}
        >
          Catalogue
        </button>
        <button
          className={tab === "mobilier" ? "active" : ""}
          onClick={() => setTab("mobilier")}
        >
          Mobilier
        </button>
      </div>

      {message && <div className="world-message">{message}</div>}

      {tab === "residence" && (
        <div className="world-two-columns">
          <article className="world-panel">
            <div className="world-image-stage">
              <div
                className="world-image-blur"
                style={{ backgroundImage: `url("${currentHouse.image}")` }}
              />
              <img src={currentHouse.image} alt={currentHouse.name} />
            </div>
          </article>

          <article className="world-panel world-detail-panel">
            <span className="world-kicker">RÉSIDENCE ACTUELLE</span>
            <h2>{snapshot ? currentHouse.name : "Aperçu du catalogue"}</h2>
            <p>{currentHouse.description}</p>

            <div className="world-stat-grid">
              <div>
                <span>Niveau requis</span>
                <strong>
                  {currentHouse.levelRequired === 9999
                    ? "Hime-sama"
                    : currentHouse.levelRequired}
                </strong>
              </div>
              <div>
                <span>Mobilier</span>
                <strong>
                  {slotsUsed}/{slotsTotal}
                </strong>
              </div>
              <div>
                <span>Cookies</span>
                <strong>{signed(currentHouse.effect.cookiesPct, " %")}</strong>
              </div>
              <div>
                <span>XP</span>
                <strong>{signed(currentHouse.effect.xpPct, " %")}</strong>
              </div>
              <div>
                <span>Repos Work / Hunt</span>
                <strong>
                  {signed(currentHouse.effect.cooldownMinutes, " min")}
                </strong>
              </div>
              <div>
                <span>Propriété personnelle</span>
                <strong>
                  {snapshot
                    ? HOUSE_BY_ID[snapshot.ownedHouseId]?.name ?? "—"
                    : "—"}
                </strong>
              </div>
            </div>

            {snapshot?.sharedResidence && (
              <div className="world-note">
                💞 Résidence partagée
                {snapshot.spouseName ? ` avec ${snapshot.spouseName}` : ""}.
                L’achat d’une propriété personnelle ne doit pas déplacer le
                conjoint automatiquement.
              </div>
            )}

            {!snapshot && (
              <div className="world-note">
                Les valeurs ci-dessus viennent du Python. L’identité de ta
                résidence réelle apparaîtra dès que l’endpoint Maison sera
                branché.
              </div>
            )}
          </article>
        </div>
      )}

      {tab === "catalogue" && (
        <>
          <div className="world-card-grid world-house-grid">
            {HOUSES.map((house) => {
              const selected = selectedId === house.id;
              const owned = snapshot?.ownedHouseId === house.id;
              const lockedLevel =
                snapshot != null &&
                snapshot.playerLevel < house.levelRequired &&
                house.levelRequired !== 9999;
              const lockedMoney =
                snapshot != null &&
                house.price != null &&
                snapshot.cookies < house.price;
              const canBuy =
                Boolean(snapshot) &&
                house.purchasable &&
                !owned &&
                !lockedLevel &&
                !lockedMoney;

              return (
                <button
                  key={house.id}
                  className={`world-card-button ${selected ? "selected" : ""}`}
                  onClick={() => setSelectedId(house.id)}
                >
                  <div className="world-card-art">
                    <img src={house.image} alt="" />
                  </div>
                  <div className="world-card-body">
                    <strong>{house.name}</strong>
                    <span>
                      Niveau{" "}
                      {house.levelRequired === 9999
                        ? "Hime-sama"
                        : house.levelRequired}
                    </span>
                    <span>{formatCookies(house.price)}</span>
                    {owned && <em>✓ Propriété personnelle</em>}
                    {canBuy && <em>Disponible</em>}
                    {lockedLevel && <em>🔒 Niveau insuffisant</em>}
                    {lockedMoney && !lockedLevel && <em>🍪 Cookies insuffisants</em>}
                  </div>
                </button>
              );
            })}
          </div>

          <article className="world-panel world-catalog-detail">
            <div className="world-catalog-art">
              <div
                className="world-image-blur"
                style={{ backgroundImage: `url("${selectedHouse.image}")` }}
              />
              <img src={selectedHouse.image} alt={selectedHouse.name} />
            </div>
            <div>
              <span className="world-kicker">CATALOGUE IMMOBILIER ROYAL</span>
              <h2>{selectedHouse.name}</h2>
              <p>{selectedHouse.description}</p>
              <div className="world-inline-tags">
                <span>🍪 {signed(selectedHouse.effect.cookiesPct, " %")}</span>
                <span>✨ {signed(selectedHouse.effect.xpPct, " %")}</span>
                <span>
                  ⏳ {signed(selectedHouse.effect.cooldownMinutes, " min")}
                </span>
                <span>🪑 {selectedHouse.furnitureSlots} emplacements</span>
              </div>
              <button
                className="world-primary-button"
                disabled={
                  busy ||
                  !worldApi.configured ||
                  !selectedHouse.purchasable ||
                  snapshot?.ownedHouseId === selectedHouse.id
                }
                onClick={() => void buyHouse(selectedHouse.id)}
              >
                {!worldApi.configured
                  ? "Connexion TailBlue requise"
                  : !selectedHouse.purchasable
                    ? "Non achetable"
                    : snapshot?.ownedHouseId === selectedHouse.id
                      ? "Déjà possédée"
                      : `Acheter • ${formatCookies(selectedHouse.price)}`}
              </button>
            </div>
          </article>
        </>
      )}

      {tab === "mobilier" && (
        <div className="world-panel">
          <div className="world-section-title">
            <div>
              <span className="world-kicker">AMÉNAGEMENT</span>
              <h2>Mobilier de la résidence</h2>
            </div>
            <strong>
              {slotsUsed}/{slotsTotal} emplacements
            </strong>
          </div>

          <div className="world-inline-tags">
            <span>⛏️ Repos Mine : max −{HOUSE_FURNITURE_BONUS_CAPS.mineRestMinutes} min</span>
            <span>⏳ Activités : max −{HOUSE_FURNITURE_BONUS_CAPS.activityCooldownMinutes} min</span>
            <span>✨ XP : max +{HOUSE_FURNITURE_BONUS_CAPS.xpPct} %</span>
            <span>🍪 Cookies : max +{HOUSE_FURNITURE_BONUS_CAPS.cookiesPct} %</span>
          </div>

          {!snapshot?.furniture?.length ? (
            <div className="world-empty">
              <span>🪑</span>
              <h3>Aucun mobilier réel chargé</h3>
              <p>
                On n’invente pas le stock : l’API renverra les meubles
                réellement possédés/disponibles dans TailBlue.
              </p>
              <small>
                Catégories prévues par le moteur :{" "}
                {HOUSE_FURNITURE_CATEGORIES.join(" • ")}
              </small>
            </div>
          ) : (
            <div className="world-card-grid">
              {[...furnitureByCategory.entries()].flatMap(([category, items]) =>
                items.map((item) => (
                  <article className="world-small-card" key={item.id}>
                    <span className="world-kicker">{category}</span>
                    <h3>
                      {item.emoji ?? "🪑"} {item.name}
                    </h3>
                    <p>{item.description ?? "Mobilier TailBlue"}</p>
                    <small>
                      Possédé : {item.owned ?? 0} •{" "}
                      {item.installed ? "Installé" : "Rangé"}
                    </small>
                    <div className="world-row-actions">
                      {item.installed ? (
                        <button
                          onClick={() =>
                            void furnitureAction("store", item.id)
                          }
                          disabled={busy}
                        >
                          Ranger
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            void furnitureAction("install", item.id)
                          }
                          disabled={busy}
                        >
                          Installer
                        </button>
                      )}
                    </div>
                  </article>
                )),
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
