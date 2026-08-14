import { useMemo, useState } from "react";
import FilterSelect from "../components/FilterSelect";
import { PETS } from "../data/tailblueLocalData";
import { KENNELS, PET_FOODS, PROVISION_LEVELS } from "../data/worldLocalData";
import "./remainingPages.css";

const OWNED_KENNEL_ID = "royal_tsundere";
const PROVISION_LEVEL = 5;
const OWNED_PET_IDS = new Set(["sugus"]);

export default function KennelPage() {
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [tab, setTab] = useState<"kennel" | "provisions" | "companions">("kennel");
  const [selectedId, setSelectedId] = useState(OWNED_KENNEL_ID);
  const [foodLevel, setFoodLevel] = useState(PROVISION_LEVEL);
  const [basket, setBasket] = useState<Record<string, number>>({});

  const visibleKennels = scope === "mine"
    ? KENNELS.filter((item) => item.id === OWNED_KENNEL_ID)
    : KENNELS;

  const selected = visibleKennels.find((item) => item.id === selectedId) ?? visibleKennels[0] ?? KENNELS[0];

  const provision = PROVISION_LEVELS.find((item) => item.level === foodLevel) ?? PROVISION_LEVELS[0];
  const foods = useMemo(() => PET_FOODS.filter((food) => food.level <= foodLevel), [foodLevel]);

  const ownedPets = PETS.filter((pet) => OWNED_PET_IDS.has(pet.id));

  function changeScope(value: string) {
    const next = value as "mine" | "all";
    setScope(next);
    setSelectedId(next === "mine" ? OWNED_KENNEL_ID : KENNELS[0].id);
  }

  function addFood(id: string, delta: number) {
    setBasket((old) => ({
      ...old,
      [id]: Math.max(0, Math.min(99, (old[id] ?? 0) + delta)),
    }));
  }

  const basketTotal = Object.entries(basket).reduce((sum, [id, qty]) => {
    const food = PET_FOODS.find((item) => item.id === id);
    return sum + (food?.price ?? 0) * qty;
  }, 0);

  return (
    <section className="extra-page">
      <div className="extra-heading">
        <div>
          <p className="eyebrow">SANCTUAIRE DES COMPAGNONS</p>
          <h2>Chenil</h2>
          <p className="extra-muted">
            Résidence des familiers, gestion des compagnons actifs et intendance des provisions.
          </p>
        </div>

        <FilterSelect
          value={scope}
          onChange={changeScope}
          options={[
            { value: "mine", label: "Mon chenil" },
            { value: "all", label: "Tous les chenils" },
          ]}
        />
      </div>

      <div className="extra-tabs">
        <button className={tab === "kennel" ? "selected" : ""} onClick={() => setTab("kennel")}>🏡 Chenil</button>
        <button className={tab === "companions" ? "selected" : ""} onClick={() => setTab("companions")}>🐾 Compagnons</button>
        <button className={tab === "provisions" ? "selected" : ""} onClick={() => setTab("provisions")}>🍖 Provisions</button>
      </div>

      {tab === "kennel" && (
        <>
          <article className="extra-showcase kennel-showcase">
            <div className="extra-showcase-image" style={{ backgroundImage: `url("${selected.image}")` }}>
              <div className="extra-showcase-blur" />
              <img src={selected.image} alt={selected.name} />
            </div>

            <div className="extra-showcase-info">
              <div>
                <p className="eyebrow">{selected.id === OWNED_KENNEL_ID ? "✓ TON CHENIL" : "GALERIE"}</p>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
              </div>

              <div className="extra-stat-list">
                <div><span>Capacité</span><strong>{selected.bonusPlaces === null ? "∞ compagnons" : `${2 + selected.bonusPlaces} compagnons`}</strong></div>
                <div><span>Places bonus</span><strong>{selected.bonusPlaces === null ? "Privilège royal" : `+${selected.bonusPlaces}`}</strong></div>
                <div><span>Prix</span><strong>{selected.price === 0 ? "Royal / non achetable" : `${selected.price.toLocaleString("fr-CH")} cookies`}</strong></div>
                <div><span>Actifs</span><strong>{selected.id === "royal_tsundere" ? "Jusqu'à 6" : "Selon niveau joueur"}</strong></div>
              </div>
            </div>
          </article>

          {scope === "all" && (
            <div className="extra-thumb-grid">
              {visibleKennels.map((kennel) => (
                <button
                  key={kennel.id}
                  className={`extra-thumb ${selected.id === kennel.id ? "selected" : ""}`}
                  onClick={() => setSelectedId(kennel.id)}
                >
                  <div style={{ backgroundImage: `url("${kennel.image}")` }}>
                    <img src={kennel.image} alt={kennel.name} />
                  </div>
                  <span>{kennel.name}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "companions" && (
        <div className="kennel-companion-layout">
          <article className="extra-panel">
            <div className="panel-headline">
              <div><p className="eyebrow">COMPAGNONS ACTIFS</p><h3>Équipe actuelle</h3></div>
              <span>Backend à connecter</span>
            </div>

            <div className="active-companion-slots">
              {Array.from({ length: 6 }).map((_, index) => {
                const pet = ownedPets[index];
                return (
                  <div key={index} className={pet ? "filled" : ""}>
                    {pet ? (
                      <>
                        <img src={pet.image} alt={pet.name} />
                        <strong>{pet.name}</strong>
                        <small>Actif</small>
                      </>
                    ) : (
                      <>
                        <span>＋</span>
                        <strong>Emplacement {index + 1}</strong>
                        <small>Libre</small>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </article>

          <article className="extra-panel">
            <p className="eyebrow">SOINS & RELATION</p>
            <h3>Actions de compagnon</h3>
            <div className="kennel-action-list">
              <button>🍖 Nourrir</button>
              <button>💜 Papouiller</button>
              <button>📖 Histoire</button>
              <button>🏠 Mettre au chenil</button>
            </div>
            <p className="extra-small-note">
              Ces actions seront reliées aux vrais PV, énergie, confiance, nourriture et cooldowns de <code>pets.py</code>.
            </p>
          </article>
        </div>
      )}

      {tab === "provisions" && (
        <>
          <article className="provision-hero">
            <div className="provision-image" style={{ backgroundImage: `url("${provision.image}")` }}>
              <div />
              <img src={provision.image} alt={provision.name} />
            </div>

            <div className="provision-info">
              <p className="eyebrow">INTENDANCE • NIVEAU {foodLevel}/5</p>
              <h2>{provision.name}</h2>
              <p>{provision.description}</p>

              <div className="level-pips">
                {PROVISION_LEVELS.map((entry) => (
                  <button
                    key={entry.level}
                    className={entry.level === foodLevel ? "selected" : ""}
                    onClick={() => setFoodLevel(entry.level)}
                    title={`Aperçu niveau ${entry.level}`}
                  >
                    {entry.level}
                  </button>
                ))}
              </div>

              {foodLevel < 5 ? (
                <button className="extra-primary">
                  🏗️ Amélioration suivante • {PROVISION_LEVELS[foodLevel]?.price.toLocaleString("fr-CH")} cookies
                </button>
              ) : (
                <div className="max-level-badge">👑 Intendance au niveau maximal</div>
              )}
            </div>
          </article>

          <div className="provision-grid">
            {foods.map((food) => {
              const qty = basket[food.id] ?? 0;
              return (
                <article key={food.id} className="food-card">
                  <div className="food-name"><strong>{food.name}</strong><span>Niv. {food.level}</span></div>
                  <div className="food-effects">
                    <span>❤️ +{food.heal} PV</span>
                    <span>⚡ +{food.energy}</span>
                    <span>🍪 {food.price}</span>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => addFood(food.id, -10)}>-10</button>
                    <button onClick={() => addFood(food.id, -1)}>-1</button>
                    <strong>{qty}</strong>
                    <button onClick={() => addFood(food.id, 1)}>+1</button>
                    <button onClick={() => addFood(food.id, 10)}>+10</button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="basket-bar">
            <div><span>🧺 Panier</span><strong>{Object.values(basket).reduce((a, b) => a + b, 0)} provisions</strong></div>
            <div><span>Coût simulé</span><strong>{basketTotal.toLocaleString("fr-CH")} 🍪</strong></div>
            <button disabled={basketTotal === 0}>Acheter avec le backend</button>
          </div>
        </>
      )}
    </section>
  );
}
