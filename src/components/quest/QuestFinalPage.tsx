import { useEffect, useMemo, useState } from "react";
import {
  getCachedQuestSnapshot,
  questApi,
  questApiConfigured,
} from "../../api/questApi";
import {
  makeQuestPreviewOffers,
  QUEST_COUNT_BY_DIFFICULTY,
  QUEST_DIFFICULTIES,
  questEventMeta,
} from "../../data/tailblueQuests";
import type {
  ActiveQuestDto,
  QuestBoardSnapshotDto,
  QuestClaimResultDto,
  QuestDefinitionDto,
  QuestDifficulty,
} from "../../types/quest";
import "./questFinal.css";

type QuestLoadState = "loading" | "ready" | "working" | "error";

function makeLocalSnapshot(): QuestBoardSnapshotDto {
  return {
    offers: makeQuestPreviewOffers(),
    activeQuest: null,
    royalCatBonusXp: 0,
  };
}

export default function QuestFinalPage() {
  const [snapshot, setSnapshot] =
    useState<QuestBoardSnapshotDto>(() => {
      if (!questApiConfigured) {
        return makeLocalSnapshot();
      }

      return (
        getCachedQuestSnapshot() ??
        makeLocalSnapshot()
      );
    });

  const [loadState, setLoadState] =
    useState<QuestLoadState>(() => {
      if (!questApiConfigured) return "ready";

      return getCachedQuestSnapshot()
        ? "ready"
        : "loading";
    });
  const [error, setError] = useState("");
  const [claimResult, setClaimResult] =
    useState<QuestClaimResultDto | null>(null);
  const [localSelectedQuestId, setLocalSelectedQuestId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!questApiConfigured) {
      setSnapshot(makeLocalSnapshot());
      setLoadState("ready");
      return () => {
        cancelled = true;
      };
    }

    const hasCachedSnapshot =
      getCachedQuestSnapshot() !== null;

    /*
     * Avec cache : le dernier vrai tableau reste visible
     * pendant la resynchronisation.
     *
     * Sans cache : on garde l'écran de chargement existant,
     * sans afficher les offres locales comme si elles étaient réelles.
     */
    if (!hasCachedSnapshot) {
      setLoadState("loading");
    }

    questApi
      .getSnapshot()
      .then((data) => {
        if (cancelled) return;
        setSnapshot(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger le tableau des quêtes.",
        );
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeQuest = useMemo<ActiveQuestDto | null>(() => {
    if (snapshot.activeQuest) return snapshot.activeQuest;

    if (!questApiConfigured && localSelectedQuestId) {
      const quest = snapshot.offers.find(
        (offer) => offer.id === localSelectedQuestId,
      );

      if (!quest) return null;

      const selectedAt = new Date();
      const expiresAt = new Date(
        selectedAt.getTime() + 24 * 60 * 60 * 1000,
      );

      return {
        quest,
        progress: 0,
        claimed: false,
        selectedAt: selectedAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        completedAt: null,
        completionNotifiedAt: null,
      };
    }

    return null;
  }, [localSelectedQuestId, snapshot.activeQuest, snapshot.offers]);

  async function acceptQuest(quest: QuestDefinitionDto) {
    setError("");
    setClaimResult(null);

    if (!questApiConfigured) {
      setLocalSelectedQuestId(quest.id);
      return;
    }

    try {
      setLoadState("working");
      const next = await questApi.accept(quest.id);
      setSnapshot(next);
      setLoadState("ready");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d’accepter cette quête.",
      );
      setLoadState("error");
    }
  }

  async function claimQuest() {
    if (!questApiConfigured) return;

    setError("");

    try {
      setLoadState("working");
      const result = await questApi.claim();
      setClaimResult(result);
      setSnapshot(result.snapshot);
      setLoadState("ready");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de réclamer cette récompense.",
      );
      setLoadState("error");
    }
  }

  function resetLocalPreview() {
    setLocalSelectedQuestId(null);
    setClaimResult(null);
    setError("");
  }

  if (loadState === "loading") {
    return (
      <section className="tb-quest-page">
        <QuestHeader />
        <div className="tb-quest-loading">
          <div className="tb-quest-loader">📜</div>
          <h2>Le tableau royal se met à jour…</h2>
          <p>TailBlue récupère tes offres et ta progression.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="tb-quest-page">
      <QuestHeader />

      {error && (
        <div className="tb-quest-alert">
          <span>⚠️</span>
          <div>
            <strong>Impossible de synchroniser les quêtes.</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {claimResult && (
        <div className="tb-quest-claim-success">
          <span>🎉</span>
          <div>
            <p className="tb-quest-mini-label">RÉCOMPENSE REMISE</p>
            <h3>Le contrat est officiellement validé.</h3>
            <p>
              🍪 +{claimResult.cookies} cookies • ✨ +{claimResult.xp} XP
              {(claimResult.royalCatBonusXp ?? 0) > 0
                ? ` • 🐱 Chat Royal +${claimResult.royalCatBonusXp} XP`
                : ""}
            </p>
          </div>
        </div>
      )}

      {activeQuest ? (
        <ActiveQuestPanel
          active={activeQuest}
          backendMode={questApiConfigured}
          working={loadState === "working"}
          royalCatBonusXp={snapshot.royalCatBonusXp ?? 0}
          onClaim={claimQuest}
          onResetLocal={resetLocalPreview}
        />
      ) : (
        <QuestBoard
          snapshot={snapshot}
          backendMode={questApiConfigured}
          working={loadState === "working"}
          onAccept={acceptQuest}
        />
      )}
    </section>
  );
}

function QuestHeader() {
  return (
    <header className="tb-quest-header">
      <div>
        <p className="tb-quest-eyebrow">📜 TABLEAU ROYAL</p>
        <h1>Quêtes</h1>
        <p className="tb-quest-subtitle">
          Trois contrats sont proposés : un facile, un intermédiaire et un
          difficile. Tu n’en acceptes qu’un, puis tu disposes de 24 heures
          réelles pour l’accomplir.
        </p>
      </div>

      <div className="tb-quest-header-badges">
        <span className="tb-quest-source-badge">
          <i />
          {questApiConfigured ? "Backend TailBlue" : "Aperçu local"}
        </span>
        <span className="tb-quest-24h-badge">⏳ Contrat 24 h</span>
      </div>
    </header>
  );
}

function QuestBoard({
  snapshot,
  backendMode,
  working,
  onAccept,
}: {
  snapshot: QuestBoardSnapshotDto;
  backendMode: boolean;
  working: boolean;
  onAccept: (quest: QuestDefinitionDto) => void;
}) {
  const offers = snapshot.offers.slice(0, 3);

  return (
    <>
      <div className="tb-quest-rule-banner">
        <div className="tb-rule-main">
          <div className="tb-rule-icon">⚖️</div>
          <div>
            <p className="tb-quest-mini-label">RÈGLE DU TABLEAU</p>
            <h2>Un seul contrat. Un vrai choix.</h2>
            <p>
              Les deux autres offres disparaissent lorsque la quête est
              acceptée. Le délai de 24 heures commence seulement à ce moment.
            </p>
          </div>
        </div>

        <div className="tb-rule-stats">
          <div>
            <small>Offres</small>
            <strong>3</strong>
          </div>
          <div>
            <small>À choisir</small>
            <strong>1</strong>
          </div>
          <div>
            <small>Délai</small>
            <strong>24 h</strong>
          </div>
        </div>
      </div>

      <div className="tb-quest-board-grid">
        {offers.map((quest, index) => (
          <QuestOfferCard
            key={quest.id}
            quest={quest}
            index={index}
            backendMode={backendMode}
            working={working}
            onAccept={onAccept}
          />
        ))}
      </div>

      <div className="tb-quest-bottom-grid">
        <article className="tb-quest-info-card">
          <div className="tb-info-title">
            <span>🗃️</span>
            <div>
              <p className="tb-quest-mini-label">REGISTRE V2</p>
              <h3>30 quêtes actuellement préparées</h3>
            </div>
          </div>

          <div className="tb-registry-counts">
            <RegistryCount
              difficulty="facile"
              count={QUEST_COUNT_BY_DIFFICULTY.facile}
            />
            <RegistryCount
              difficulty="moyenne"
              count={QUEST_COUNT_BY_DIFFICULTY.moyenne}
            />
            <RegistryCount
              difficulty="difficile"
              count={QUEST_COUNT_BY_DIFFICULTY.difficile}
            />
          </div>
        </article>

        <article className="tb-quest-info-card">
          <div className="tb-info-title">
            <span>🔄</span>
            <div>
              <p className="tb-quest-mini-label">PROGRESSION</p>
              <h3>Les autres systèmes nourrissent ta quête</h3>
            </div>
          </div>

          <p className="tb-info-copy">
            Work, Hunt, Daily, interactions sociales et actions de la Mine
            envoient leurs événements au moteur de quête. L’application ne
            fabrique jamais la progression elle-même.
          </p>

          {!backendMode && (
            <p className="tb-preview-warning">
              Mode local : les trois cartes ci-dessus sont de vraies quêtes du
              registre, mais leur sélection sert uniquement à prévisualiser
              l’interface.
            </p>
          )}
        </article>
      </div>
    </>
  );
}

function QuestOfferCard({
  quest,
  index,
  backendMode,
  working,
  onAccept,
}: {
  quest: QuestDefinitionDto;
  index: number;
  backendMode: boolean;
  working: boolean;
  onAccept: (quest: QuestDefinitionDto) => void;
}) {
  const difficulty = QUEST_DIFFICULTIES[quest.difficulty];
  const event = questEventMeta(quest.event);

  return (
    <article
      className={`tb-quest-offer is-${quest.difficulty}`}
    >
      <div className="tb-offer-glow" />

      <div className="tb-offer-top">
        <span className="tb-offer-number">
          {["I", "II", "III"][index] ?? index + 1}
        </span>
        <span className="tb-difficulty-badge">
          {difficulty.emoji} {difficulty.label}
        </span>
      </div>

      <div className="tb-offer-event-icon">{event.icon}</div>

      <h2>{quest.name}</h2>
      <p className="tb-offer-description">{quest.description}</p>

      <div className="tb-offer-objective">
        <span>🎯</span>
        <div>
          <small>Objectif</small>
          <strong>
            {quest.objective} progression
            {quest.objective > 1 ? "s" : ""}
          </strong>
        </div>
      </div>

      <div className="tb-offer-event">
        <span>{event.icon}</span>
        <div>
          <small>Événement suivi</small>
          <strong>{event.label}</strong>
        </div>
      </div>

      <div className="tb-offer-rewards">
        <RewardBox
          icon="🍪"
          label="Cookies"
          value={quest.rewardCookies}
        />
        <RewardBox icon="✨" label="XP" value={quest.rewardXp} />
      </div>

      <button
        className="tb-quest-accept"
        onClick={() => onAccept(quest)}
        disabled={working}
      >
        <span>📜</span>
        {working
          ? "TailBlue valide…"
          : backendMode
            ? "Accepter cette quête"
            : "Prévisualiser cette quête"}
      </button>

      <p className="tb-offer-footnote">
        ⏳ Le compte à rebours démarre à l’acceptation.
      </p>
    </article>
  );
}

function ActiveQuestPanel({
  active,
  backendMode,
  working,
  royalCatBonusXp,
  onClaim,
  onResetLocal,
}: {
  active: ActiveQuestDto;
  backendMode: boolean;
  working: boolean;
  royalCatBonusXp: number;
  onClaim: () => void;
  onResetLocal: () => void;
}) {
  const difficulty = QUEST_DIFFICULTIES[active.quest.difficulty];
  const event = questEventMeta(active.quest.event);

  const objective = Math.max(1, active.quest.objective);
  const progress = Math.max(0, Math.min(active.progress, objective));
  const done = progress >= objective;
  const progressPct = Math.min(100, (progress / objective) * 100);

  const remaining = useCountdown(active.expiresAt);
  const expired = remaining.totalSeconds <= 0;

  const state = active.claimed
    ? "Récompense récupérée"
    : done
      ? "Récompense disponible"
      : expired
        ? "Expirée"
        : "En cours";

  return (
    <div className="tb-active-layout">
      <main className="tb-active-main">
        <article
          className={`tb-active-quest is-${active.quest.difficulty}`}
        >
          <div className="tb-active-top">
            <div>
              <p className="tb-quest-mini-label">QUÊTE ACTIVE</p>
              <div className="tb-active-badges">
                <span className="tb-difficulty-badge">
                  {difficulty.emoji} {difficulty.label}
                </span>
                <span className={`tb-state-badge ${done ? "is-done" : ""}`}>
                  {active.claimed ? "✅" : done ? "🎁" : "⏳"} {state}
                </span>
              </div>
            </div>

            <div className={`tb-countdown ${expired ? "is-expired" : ""}`}>
              <small>Temps restant</small>
              <strong>
                {expired
                  ? "00:00:00"
                  : `${remaining.hours}:${remaining.minutes}:${remaining.seconds}`}
              </strong>
            </div>
          </div>

          <div className="tb-active-hero">
            <div className="tb-active-icon">{event.icon}</div>
            <div>
              <h1>{active.quest.name}</h1>
              <p>{active.quest.description}</p>
            </div>
          </div>

          <div className="tb-progress-section">
            <div className="tb-progress-heading">
              <div>
                <p className="tb-quest-mini-label">PROGRESSION</p>
                <h3>
                  {progress} / {objective}
                </h3>
              </div>
              <strong>{Math.round(progressPct)}%</strong>
            </div>

            <div className="tb-progress-track">
              <div
                className="tb-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <p>
              {done
                ? "Objectif accompli. La récompense peut être réclamée."
                : event.description}
            </p>
          </div>

          <div className="tb-active-rewards">
            <div className="tb-active-reward-copy">
              <p className="tb-quest-mini-label">RÉCOMPENSE DU CONTRAT</p>
              <h3>La récompense est versée une seule fois.</h3>
              {royalCatBonusXp > 0 && (
                <p className="tb-cat-bonus">
                  🐱 Chat Royal : +{royalCatBonusXp} XP appliqués par TailBlue.
                </p>
              )}
            </div>

            <div className="tb-active-reward-pills">
              <RewardBox
                icon="🍪"
                label="Cookies"
                value={active.quest.rewardCookies}
              />
              <RewardBox
                icon="✨"
                label="XP"
                value={active.quest.rewardXp}
              />
            </div>
          </div>

          <div className="tb-active-actions">
            <button
              className="tb-quest-claim"
              disabled={
                !backendMode ||
                working ||
                !done ||
                active.claimed ||
                expired
              }
              onClick={onClaim}
            >
              <span>🎁</span>
              {active.claimed
                ? "Récompense déjà récupérée"
                : done
                  ? "Réclamer la récompense"
                  : "Objectif non terminé"}
            </button>

            {!backendMode && (
              <button
                className="tb-local-back"
                onClick={onResetLocal}
              >
                ↺ Retour au tableau
              </button>
            )}
          </div>

          {!backendMode && (
            <p className="tb-local-active-note">
              Aperçu local : la progression reste volontairement à 0. Une fois
              hébergée, TailBlue recevra les événements réels et cette barre se
              mettra à jour avec les vraies données du joueur.
            </p>
          )}
        </article>
      </main>

      <aside className="tb-active-side">
        <article className="tb-quest-side-card">
          <div className="tb-side-title">
            <span>{event.icon}</span>
            <div>
              <p className="tb-quest-mini-label">OBJECTIF SUIVI</p>
              <h3>{event.label}</h3>
            </div>
          </div>

          <p className="tb-side-copy">{event.description}</p>

          <div className="tb-side-event-code">
            <small>Événement backend</small>
            <code>{active.quest.event}</code>
          </div>
        </article>

        <article className="tb-quest-side-card">
          <div className="tb-side-title">
            <span>⏳</span>
            <div>
              <p className="tb-quest-mini-label">FENÊTRE DE QUÊTE</p>
              <h3>24 heures réelles</h3>
            </div>
          </div>

          <TimelineLine
            label="Acceptée"
            value={formatDateTime(active.selectedAt)}
          />
          <TimelineLine
            label="Échéance"
            value={formatDateTime(active.expiresAt)}
          />
          <TimelineLine
            label="Terminée"
            value={
              active.completedAt
                ? formatDateTime(active.completedAt)
                : "—"
            }
          />
        </article>

        <article className="tb-quest-side-card">
          <div className="tb-side-title">
            <span>🛡️</span>
            <div>
              <p className="tb-quest-mini-label">AUTORITÉ</p>
              <h3>Le backend tranche</h3>
            </div>
          </div>

          <div className="tb-authority-list">
            <p>✓ Valide l’offre acceptée</p>
            <p>✓ Compte les événements réels</p>
            <p>✓ Bloque une quête expirée</p>
            <p>✓ Vérifie la récompense déjà prise</p>
            <p>✓ Applique le bonus Chat Royal</p>
          </div>
        </article>
      </aside>
    </div>
  );
}

function RewardBox({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div className="tb-reward-box">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function RegistryCount({
  difficulty,
  count,
}: {
  difficulty: QuestDifficulty;
  count: number;
}) {
  const meta = QUEST_DIFFICULTIES[difficulty];

  return (
    <div className={`tb-registry-count is-${difficulty}`}>
      <span>{meta.emoji}</span>
      <div>
        <strong>{count}</strong>
        <small>{meta.label}</small>
      </div>
    </div>
  );
}

function TimelineLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="tb-timeline-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function useCountdown(expiresAt: string) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const target = new Date(expiresAt).getTime();
  const validTarget = Number.isFinite(target) ? target : now;
  const totalSeconds = Math.max(
    0,
    Math.floor((validTarget - now) / 1000),
  );

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    totalSeconds,
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-CH", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
