import { useEffect, useMemo, useState, type MouseEvent } from "react";
import {
  companionApi,
  companionApiConfigured,
} from "../api/companionApi";
import { ImageStage } from "../components/companions/CompanionUi";
import {
  COMPANION_RULES,
  DRAGONS,
} from "../data/companionsLocalData";
import type {
  BreedingSnapshotDto,
  DragonLineageDto,
} from "../types/companions";
import "../components/companions/companionsFinal.css";

function localBreeding(): BreedingSnapshotDto {
  return {
    hasOriginsEgg: true,
    hatched: false,
    work: 0,
    hunt: 0,
    daily: 0,
    workTarget: COMPANION_RULES.incubation.work,
    huntTarget: COMPANION_RULES.incubation.hunt,
    dailyTarget: COMPANION_RULES.incubation.daily,
    readyToHatch: false,
    lineages: DRAGONS.map((dragon) => ({ ...dragon })),
    obtainedDragon: null,
  };
}

export default function BreedingPage() {
  const [snapshot, setSnapshot] =
    useState<BreedingSnapshotDto>(localBreeding());
  const [selectedDragon, setSelectedDragon] =
    useState<DragonLineageDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!companionApiConfigured) return;

    companionApi
      .getBreeding()
      .then(setSnapshot)
      .catch(() => {
        // Aperçu local conservé.
      });
  }, []);

  const overall = useMemo(() => {
    const current =
      Math.min(snapshot.work, snapshot.workTarget) +
      Math.min(snapshot.hunt, snapshot.huntTarget) +
      Math.min(snapshot.daily, snapshot.dailyTarget);
    const target =
      snapshot.workTarget +
      snapshot.huntTarget +
      snapshot.dailyTarget;

    return {
      current,
      target,
      pct: Math.max(
        0,
        Math.min(
          100,
          (current / Math.max(1, target)) * 100,
        ),
      ),
    };
  }, [snapshot]);

  async function hatch() {
    if (
      !companionApiConfigured ||
      !snapshot.readyToHatch ||
      busy
    ) {
      return;
    }

    try {
      setBusy(true);
      setMessage("");
      const next = await companionApi.hatchOriginsEgg();
      setSnapshot(next);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "L'éclosion n'a pas pu être déclenchée.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="tb-comp-page tb-breeding-page">
      <header className="tb-comp-heading">
        <div>
          <p className="tb-comp-eyebrow">🥚 HÉRITAGE DRACONIQUE</p>
          <h1>Élevage</h1>
          <p>
            Le système actuel est centré sur l'Œuf des Origines :
            15 Work, 20 Hunt et 1 Daily réveillent l'une des huit
            lignées draconiques.
          </p>
        </div>

        <div className="tb-comp-source">
          <i />
          {companionApiConfigured
            ? "Backend TailBlue"
            : "Aperçu local"}
        </div>
      </header>

      {!snapshot.hasOriginsEgg && !snapshot.hatched ? (
        <div className="tb-comp-empty">
          <span>🥚</span>
          <h2>Tu ne possèdes pas l'Œuf des Origines.</h2>
          <p>
            Cette page s'activera automatiquement lorsque le backend
            indiquera que l'œuf appartient au joueur.
          </p>
        </div>
      ) : snapshot.obtainedDragon ? (
        <article className="tb-hatched-dragon">
          <ImageStage
            image={snapshot.obtainedDragon.image}
            alt={snapshot.obtainedDragon.name}
            className="tb-hatched-image"
          />
          <div>
            <p className="tb-comp-eyebrow">🐉 ÉCLOSION ACCOMPLIE</p>
            <h2>{snapshot.obtainedDragon.name}</h2>
            <span>{snapshot.obtainedDragon.rarity}</span>
            <p>
              L'Œuf des Origines a disparu de l'inventaire et ce dragon
              fait désormais partie des compagnons du joueur.
            </p>
          </div>
        </article>
      ) : (
        <>
          <div className="tb-incubation-layout">
            <main className="tb-incubation-main">
              <article className="tb-egg-chamber">
                <div className="tb-egg-aura one" />
                <div className="tb-egg-aura two" />

                <div className="tb-egg-image-wrap">
                  <img
                    src="/Dragons/Oeuf_Origines.png"
                    alt="Œuf des Origines"
                  />
                </div>

                <div className="tb-egg-copy">
                  <p className="tb-comp-eyebrow">
                    🥚 ŒUF DES ORIGINES
                  </p>
                  <h2>
                    {snapshot.readyToHatch
                      ? "La coquille répond enfin."
                      : "Une ancienne lignée sommeille encore."}
                  </h2>
                  <p>
                    Chaque activité valide est enregistrée côté Python.
                    L'application ne peut ni accélérer l'incubation ni
                    choisir le dragon obtenu.
                  </p>
                </div>

                <div className="tb-overall-progress">
                  <div>
                    <span>Éveil global</span>
                    <strong>
                      {overall.current}/{overall.target}
                    </strong>
                  </div>
                  <div className="tb-overall-track">
                    <div
                      style={{ width: `${overall.pct}%` }}
                    />
                  </div>
                </div>
              </article>

              <div className="tb-incubation-objectives">
                <IncubationCard
                  icon="💼"
                  label="Work"
                  current={snapshot.work}
                  target={snapshot.workTarget}
                />
                <IncubationCard
                  icon="🏹"
                  label="Hunt"
                  current={snapshot.hunt}
                  target={snapshot.huntTarget}
                />
                <IncubationCard
                  icon="🎁"
                  label="Daily"
                  current={snapshot.daily}
                  target={snapshot.dailyTarget}
                />
              </div>

              <button
                className="tb-hatch-button"
                onClick={hatch}
                disabled={
                  !companionApiConfigured ||
                  !snapshot.readyToHatch ||
                  busy
                }
              >
                <span>🐉</span>
                {snapshot.readyToHatch
                  ? busy
                    ? "La coquille se fissure…"
                    : "Faire éclore l'Œuf"
                  : "Incubation incomplète"}
              </button>

              {!companionApiConfigured && (
                <p className="tb-comp-preview-note centered">
                  Mode local : l'œuf est affiché uniquement pour tester
                  l'interface. Les vraies progressions viendront du joueur.
                </p>
              )}

              {message && (
                <p className="tb-comp-action-message centered">
                  {message}
                </p>
              )}
            </main>

            <aside className="tb-incubation-rules">
              <div className="tb-comp-side-title">
                <span>📜</span>
                <div>
                  <p className="tb-comp-eyebrow">RÈGLE D'ÉCLOSION</p>
                  <h3>Le tirage reste côté Python</h3>
                </div>
              </div>

              <div className="tb-rule-lines">
                <p>✓ Work valide → progression Work</p>
                <p>✓ Hunt valide → progression Hunt</p>
                <p>✓ Daily valide → progression Daily</p>
                <p>✓ Tirage pondéré au moment de l'éclosion</p>
                <p>✓ L'œuf est remplacé par le dragon obtenu</p>
              </div>

              <div className="tb-egg-note">
                <strong>Pas de reproduction inventée.</strong>
                <p>
                  Les lignées/reproductions futures resteront désactivées
                  tant que le bot n'a pas de vrai système pour elles.
                </p>
              </div>
            </aside>
          </div>

          <section className="tb-lineages-section">
            <div className="tb-lineages-heading">
              <div>
                <p className="tb-comp-eyebrow">🐉 LIGNÉES POSSIBLES</p>
                <h2>Les huit héritages de l'Œuf</h2>
              </div>
              <p>
                Les pourcentages correspondent aux poids de tirage actuels
                de TailBlue.
              </p>
            </div>

            <div className="tb-lineage-grid">
              {snapshot.lineages.map((dragon) => (
                <button
                  key={dragon.id}
                  onClick={() => setSelectedDragon(dragon)}
                >
                  <ImageStage
                    image={dragon.image}
                    alt={dragon.name}
                    className="tb-lineage-image"
                  />
                  <div>
                    <span>{dragon.rarity}</span>
                    <h3>{dragon.name}</h3>
                    <p>{dragon.element}</p>
                    <strong>{dragon.chance}%</strong>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {selectedDragon && (
        <div
          className="tb-comp-modal-backdrop"
          onClick={() => setSelectedDragon(null)}
        >
          <article
            className="tb-dragon-modal"
            onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}
          >
            <button
              className="tb-comp-modal-close"
              onClick={() => setSelectedDragon(null)}
            >
              ×
            </button>

            <ImageStage
              image={selectedDragon.image}
              alt={selectedDragon.name}
              className="tb-dragon-modal-image"
            />

            <div>
              <p className="tb-comp-eyebrow">
                {selectedDragon.rarity}
              </p>
              <h2>{selectedDragon.name}</h2>
              <p>{selectedDragon.description}</p>

              <div className="tb-comp-meta-grid">
                <Meta
                  label="Élément"
                  value={selectedDragon.element}
                />
                <Meta
                  label="Chance"
                  value={`${selectedDragon.chance}%`}
                />
                <Meta
                  label="Habitat"
                  value={selectedDragon.habitat}
                />
                <Meta
                  label="Tempérament"
                  value={selectedDragon.temperament}
                />
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function IncubationCard({
  icon,
  label,
  current,
  target,
}: {
  icon: string;
  label: string;
  current: number;
  target: number;
}) {
  const value = Math.min(current, target);
  const pct = Math.max(
    0,
    Math.min(100, (value / Math.max(1, target)) * 100),
  );

  return (
    <article>
      <div className="tb-incubation-card-top">
        <span>{icon}</span>
        <div>
          <small>{label}</small>
          <strong>{value}/{target}</strong>
        </div>
      </div>

      <div className="tb-incubation-track">
        <div style={{ width: `${pct}%` }} />
      </div>
    </article>
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
      <strong>{value}</strong>
    </div>
  );
}
