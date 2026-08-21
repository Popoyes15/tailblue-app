import { useEffect, useMemo, useState } from "react";
import {
  companionApi,
  companionApiConfigured,
  getCachedBreedingSnapshot,
} from "../api/companionApi";
import CompanionNotice, {
  type CompanionNoticeData,
} from "../components/companions/CompanionNotice";
import { ImageStage } from "../components/companions/CompanionUi";
import { COMPANION_RULES } from "../data/companionsLocalData";
import type {
  BreedingSnapshotDto,
  IncubationState,
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
    incubationState: "dormant",
    eggImage: "/Dragons/Oeuf_Origines.png",
    lineages: [],
    obtainedDragon: null,
  };
}

function deriveState(snapshot: BreedingSnapshotDto): IncubationState {
  if (snapshot.hatched || snapshot.obtainedDragon) return "hatched";
  if (snapshot.readyToHatch) return "ready";
  if (snapshot.incubationState) return snapshot.incubationState;

  const max = Math.max(
    snapshot.work / Math.max(1, snapshot.workTarget),
    snapshot.hunt / Math.max(1, snapshot.huntTarget),
    snapshot.daily / Math.max(1, snapshot.dailyTarget),
  );

  if (max >= 0.75) return "stirring";
  if (max > 0) return "incubating";
  return "dormant";
}

const STATE_COPY: Record<
  IncubationState,
  { eyebrow: string; title: string; text: string; icon: string }
> = {
  dormant: {
    eyebrow: "SOMMEIL ANCIEN",
    title: "Quelque chose dort sous la coquille.",
    text: "L'œuf est encore paisible. Les aventures du Royaume réveilleront peu à peu la magie qu'il renferme.",
    icon: "🌙",
  },
  incubating: {
    eyebrow: "INCUBATION EN COURS",
    title: "L'œuf commence à réagir.",
    text: "De petits mouvements trahissent une présence. La coquille répond désormais à tes aventures.",
    icon: "✨",
  },
  stirring: {
    eyebrow: "ÉVEIL PROCHE",
    title: "Quelque chose cherche la sortie…",
    text: "Les mouvements deviennent plus nets et l'énergie draconique s'accumule autour de la coquille.",
    icon: "⚡",
  },
  ready: {
    eyebrow: "ÉCLOSION PRÊTE",
    title: "La coquille répond enfin.",
    text: "Une aura bleu clair pulse autour de l'œuf. Le dragon qui s'y cache peut maintenant se révéler.",
    icon: "💠",
  },
  hatched: {
    eyebrow: "HÉRITAGE RÉVÉLÉ",
    title: "Une nouvelle lignée est née.",
    text: "L'œuf a laissé place à son dragon. Il a rejoint tes compagnons et son histoire ne fait que commencer.",
    icon: "🐉",
  },
};

function SealProgress({
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
  const pct = Math.max(
    0,
    Math.min(100, (Math.min(current, target) / Math.max(1, target)) * 100),
  );

  return (
    <div className={current >= target ? "tb-seal-v3 is-complete" : "tb-seal-v3"}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{Math.min(current, target)}/{target}</strong>
        <div><i style={{ width: `${pct}%` }} /></div>
      </div>
      <b>{current >= target ? "✓" : ""}</b>
    </div>
  );
}

export default function BreedingPage() {
  const cached = companionApiConfigured ? getCachedBreedingSnapshot() : null;
  const [snapshot, setSnapshot] = useState<BreedingSnapshotDto | null>(
    companionApiConfigured ? cached : localBreeding(),
  );
  const [loading, setLoading] = useState(companionApiConfigured && !cached);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<CompanionNoticeData | null>(null);

  useEffect(() => {
    if (!companionApiConfigured) return;
    let cancelled = false;

    void companionApi
      .getBreeding()
      .then((next) => {
        if (!cancelled) setSnapshot(next);
      })
      .catch((error) => {
        if (!cancelled && !getCachedBreedingSnapshot()) {
          setNotice({
            icon: "⚠️",
            title: "Incubation indisponible",
            message:
              error instanceof Error
                ? error.message
                : "Impossible de lire l'incubation.",
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

  const overall = useMemo(() => {
    if (!snapshot) return { current: 0, target: 1, pct: 0 };

    const current =
      Math.min(snapshot.work, snapshot.workTarget) +
      Math.min(snapshot.hunt, snapshot.huntTarget) +
      Math.min(snapshot.daily, snapshot.dailyTarget);
    const target =
      snapshot.workTarget + snapshot.huntTarget + snapshot.dailyTarget;

    return {
      current,
      target,
      pct: Math.max(0, Math.min(100, (current / Math.max(1, target)) * 100)),
    };
  }, [snapshot]);

  async function hatch() {
    if (!companionApiConfigured || !snapshot?.readyToHatch || busy) return;

    try {
      setBusy(true);
      const next = await companionApi.hatchOriginsEgg();
      setSnapshot(next);
      setNotice({
        icon: "🐉",
        title: next.obtainedDragon?.name ?? "Éclosion accomplie",
        message:
          "La coquille s'est ouverte. Le dragon a rejoint tes compagnons TailBlue.",
        tone: "success",
      });
    } catch (error) {
      setNotice({
        icon: "⚠️",
        title: "Éclosion impossible",
        message:
          error instanceof Error
            ? error.message
            : "Le rituel n'a pas pu être déclenché.",
        tone: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading && !snapshot) {
    return (
      <section className="tb-comp-page tb-comp-loading-page">
        <div className="tb-comp-loading-orb">🥚</div>
        <p className="tb-comp-eyebrow">HÉRITAGE DRACONIQUE</p>
        <h1>La chambre d'incubation s'éveille…</h1>
        <p>TailBlue écoute la magie de l'Œuf des Origines.</p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="tb-comp-page tb-comp-loading-page">
        <div className="tb-comp-loading-orb">⚠️</div>
        <h1>La chambre ne répond pas.</h1>
        <p>Aucun état réel d'incubation n'est encore disponible.</p>
        <CompanionNotice notice={notice} onClose={() => setNotice(null)} />
      </section>
    );
  }

  const state = deriveState(snapshot);
  const copy = STATE_COPY[state];

  return (
    <section className="tb-comp-page tb-breeding-v3-page">
      <header className="tb-breeding-v3-heading">
        <div>
          <p className="tb-comp-eyebrow">🥚 HÉRITAGE DRACONIQUE</p>
          <h1>Élevage</h1>
          <p>
            Ici, pas de catalogue des résultats possibles : la lignée reste
            secrète jusqu'à l'éclosion. Seule la progression réelle de ton œuf
            est révélée.
          </p>
        </div>
        <div className={`tb-incubation-status is-${state}`}>
          <span>{copy.icon}</span>
          <div>
            <small>État actuel</small>
            <strong>{copy.eyebrow}</strong>
          </div>
        </div>
      </header>

      {!snapshot.hasOriginsEgg && !snapshot.hatched && !snapshot.obtainedDragon ? (
        <div className="tb-comp-empty tb-breeding-empty">
          <span>🥚</span>
          <h2>Aucun Œuf des Origines.</h2>
          <p>
            La chambre restera silencieuse jusqu'à ce qu'un œuf existe
            réellement dans tes données TailBlue.
          </p>
        </div>
      ) : snapshot.obtainedDragon ? (
        <article className="tb-hatched-v3-card">
          <div className="tb-hatched-v3-glow" />
          <ImageStage
            image={snapshot.obtainedDragon.image}
            alt={snapshot.obtainedDragon.name}
            className="tb-hatched-v3-image"
          />
          <div>
            <p className="tb-comp-eyebrow">🐉 ÉCLOSION ACCOMPLIE</p>
            <h2>{snapshot.obtainedDragon.name}</h2>
            <span>{snapshot.obtainedDragon.rarity}</span>
            <p>
              Le secret est levé : ce dragon appartient maintenant à tes
              compagnons. Sa fiche complète et son histoire sont disponibles
              dans Pets.
            </p>
          </div>
        </article>
      ) : (
        <div className="tb-incubator-v3-layout">
          <main className={`tb-incubator-v3-chamber is-${state}`}>
            <div className="tb-incubator-stars" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </div>
            <div className="tb-incubator-runes" aria-hidden="true" />
            <div className="tb-egg-ready-aura" aria-hidden="true" />
            <div className="tb-egg-ready-ring ring-one" aria-hidden="true" />
            <div className="tb-egg-ready-ring ring-two" aria-hidden="true" />

            <div className="tb-incubator-v3-core">
              <div className="tb-egg-v3-stage">
                <img
                  src={snapshot.eggImage || "/Dragons/Oeuf_Origines.png"}
                  alt="Œuf des Origines"
                />
                <span aria-hidden="true" />
              </div>

              <div className="tb-egg-v3-copy">
                <p className="tb-comp-eyebrow">{copy.eyebrow}</p>
                <h2>{copy.title}</h2>
                <p>{copy.text}</p>

                <div className="tb-awakening-v3">
                  <div>
                    <span>Éveil global</span>
                    <strong>{Math.round(overall.pct)}%</strong>
                  </div>
                  <div className="tb-awakening-v3-track">
                    <i style={{ width: `${overall.pct}%` }} />
                  </div>
                  <small>
                    {overall.current}/{overall.target} sceaux d'incubation accomplis
                  </small>
                </div>

                <button
                  className={`tb-hatch-v3-button ${snapshot.readyToHatch ? "is-ready" : ""}`}
                  onClick={() => void hatch()}
                  disabled={
                    !companionApiConfigured ||
                    !snapshot.readyToHatch ||
                    busy
                  }
                >
                  <span>{snapshot.readyToHatch ? "✦" : "🐉"}</span>
                  <div>
                    <strong>
                      {busy
                        ? "La coquille se fissure…"
                        : snapshot.readyToHatch
                          ? "Faire éclore l'Œuf"
                          : "L'éveil continue"}
                    </strong>
                    <small>
                      {snapshot.readyToHatch
                        ? "Révéler enfin la lignée"
                        : "Les trois sceaux doivent être accomplis"}
                    </small>
                  </div>
                </button>
              </div>
            </div>
          </main>

          <aside className="tb-incubator-v3-journal">
            <div className="tb-comp-side-title">
              <span>📜</span>
              <div>
                <p className="tb-comp-eyebrow">JOURNAL D'INCUBATION</p>
                <h3>Les trois sceaux</h3>
              </div>
            </div>

            <SealProgress
              icon="💼"
              label="Work"
              current={snapshot.work}
              target={snapshot.workTarget}
            />
            <SealProgress
              icon="🏹"
              label="Hunt"
              current={snapshot.hunt}
              target={snapshot.huntTarget}
            />
            <SealProgress
              icon="🎁"
              label="Daily"
              current={snapshot.daily}
              target={snapshot.dailyTarget}
            />

            <div className="tb-incubator-v3-secret">
              <span>🎲</span>
              <div>
                <strong>La lignée reste secrète.</strong>
                <p>
                  Le tirage est effectué côté Python au moment de l'éclosion.
                  Aucune liste de dragons n'est affichée ici.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      <CompanionNotice notice={notice} onClose={() => setNotice(null)} />
    </section>
  );
}
