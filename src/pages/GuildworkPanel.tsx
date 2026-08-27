// TAILBLUE_GUILDWORK_DESKTOP_V1_20260826
// TAILBLUE_GUILDWORK_TIMER_V11_20260826
// TAILBLUE_GUILDWORK_SYNC_V12_20260826
// TAILBLUE_GUILDWORK_CANONICAL_TIME_V13_20260826
// TAILBLUE_GUILDWORK_QUIET_POLL_V14_20260826
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCachedGuildworkSnapshot,
  guildworkApiConfigured,
  loadGuildworkSnapshot,
  runGuildwork,
} from "../api/guildworkApi";
import type {
  GuildworkResult,
  GuildworkSnapshot,
} from "../types/guildwork";

import "./GuildworkPanel.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CH").format(
    Math.max(0, Number(value || 0)),
  );
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));

  if (safe <= 0) return "Disponible";

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  if (hours > 0) {
    return `${hours} h ${String(minutes).padStart(2, "0")} min`;
  }

  if (minutes > 0) {
    return `${minutes} min ${String(secs).padStart(2, "0")} s`;
  }

  return `${secs} s`;
}

function range(min: number, max: number) {
  return min === max
    ? formatNumber(min)
    : `${formatNumber(min)}–${formatNumber(max)}`;
}

function remainingFromSnapshot(
  snapshot: GuildworkSnapshot,
  syncedAtMs: number,
  clockMs: number,
) {
  // IMPORTANT : readyAt historique est un ISO sans timezone.
  // Le backend peut tourner en UTC alors que le PC est en Europe/Zurich.
  // On utilise donc remainingSeconds, calculé par le serveur canonique,
  // puis on fait seulement décroître ce nombre localement entre deux GET.
  const serverRemaining = Math.max(
    0,
    Number(snapshot.remainingSeconds || 0),
  );
  const elapsed = Math.max(0, (clockMs - syncedAtMs) / 1000);

  return Math.max(0, Math.ceil(serverRemaining - elapsed));
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0"),
  ].join(":");
}

function readyTime(remaining: number) {
  if (remaining <= 0) return null;

  const date = new Date(Date.now() + remaining * 1000);

  return date.toLocaleTimeString("fr-CH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function GuildworkCompletedView({
  snapshot,
  result,
  remaining,
  refreshing,
  error,
  onRefresh,
}: {
  snapshot: GuildworkSnapshot;
  result: GuildworkResult | null;
  remaining: number;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const nextAt = readyTime(remaining);

  return (
    <section className="tb-gw-completed-page">
      {error && (
        <div className="tb-gw-soft-error">
          ⚠️ {error}
        </div>
      )}

      <article className="tb-gw-completed-hero">
        <button
          type="button"
          className="tb-gw-refresh tb-gw-completed-refresh"
          onClick={onRefresh}
          disabled={refreshing}
          title="Resynchroniser avec le Royaume"
        >
          <span className={refreshing ? "spin" : ""}>↻</span>
          {refreshing ? "Synchro…" : "Actualiser"}
        </button>

        <div className="tb-gw-completed-seal">
          <span>✓</span>
        </div>

        <span className="tb-gw-eyebrow">
          MISSION DE GUILDE
        </span>

        <h2>Guildwork effectué</h2>

        <p>
          La mission a été enregistrée dans le Royaume.
          La guilde doit maintenant récupérer avant de pouvoir
          repartir.
        </p>

        <div className="tb-gw-countdown-wrap">
          <span className="tb-gw-countdown-label">
            Temps restant avant de pouvoir relancer
          </span>

          <strong className="tb-gw-countdown">
            {formatClock(remaining)}
          </strong>

          {nextAt && (
            <small>
              Prochain Guildwork disponible vers{" "}
              <b>{nextAt}</b>
            </small>
          )}
        </div>

        <div className="tb-gw-completed-sync">
          <i />
          Discord synchronisé
          <span>
            • le timer vient du dernier Guildwork enregistré
            par le serveur
          </span>
        </div>
      </article>

      {result && (
        <article className="tb-gw-last-result">
          <header>
            <div>
              <span className="tb-gw-eyebrow">
                DERNIÈRE MISSION
              </span>
              <h3>Récompenses distribuées</h3>
            </div>

            {result.levelUp && (
              <span className="tb-gw-last-levelup">
                ✦ Niveau {result.levelAfter}
              </span>
            )}
          </header>

          <div className="tb-gw-last-result-grid">
            <div>
              <span>👥 Chaque membre</span>
              <strong>
                +{formatNumber(result.rewardPerMember)} 🍪
              </strong>
            </div>

            <div>
              <span>🏦 Trésor</span>
              <strong>
                +{formatNumber(result.treasuryGain)} 🍪
              </strong>
            </div>

            <div>
              <span>✨ Guilde</span>
              <strong>
                +{formatNumber(result.guildXpGain)} XP
              </strong>
            </div>

            <div>
              <span>⚒️ Membres mobilisés</span>
              <strong>{result.memberCount}</strong>
            </div>
          </div>

          {result.taigaNote && (
            <div className="tb-gw-taiga">
              🐯 {result.taigaNote}
            </div>
          )}
        </article>
      )}

      <div className="tb-gw-completed-info">
        <article>
          <span>🏰</span>
          <div>
            <small>Guilde</small>
            <strong>{snapshot.guildName}</strong>
          </div>
        </article>

        <article>
          <span>🏦</span>
          <div>
            <small>Trésor actuel</small>
            <strong>
              {formatNumber(snapshot.treasury)} 🍪
            </strong>
          </div>
        </article>

        <article>
          <span>✨</span>
          <div>
            <small>Niveau de guilde</small>
            <strong>{snapshot.guildLevel}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}

export default function GuildworkPanel() {
  const cached = getCachedGuildworkSnapshot();

  const [snapshot, setSnapshot] =
    useState<GuildworkSnapshot | null>(() => cached);

  const [loading, setLoading] = useState(
    () => guildworkApiConfigured && cached === null,
  );

  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [serverVerified, setServerVerified] = useState(
    () => cached === null,
  );
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GuildworkResult | null>(null);
  const [snapshotSyncedAt, setSnapshotSyncedAt] = useState(
    () => Date.now(),
  );
  const [clock, setClock] = useState(() => Date.now());

  const refresh = useCallback(async (quiet = false) => {
    if (!guildworkApiConfigured) {
      setLoading(false);
      return;
    }

    const hasCache =
      getCachedGuildworkSnapshot() !== null;

    // Un refresh automatique reste invisible :
    // pas de spinner toutes les minutes.
    // Seul un refresh manuel affiche "Synchro…".
    if (!quiet && hasCache) {
      setRefreshing(true);
    } else if (!hasCache) {
      setLoading(true);
    }

    try {
      const value = await loadGuildworkSnapshot();
      setSnapshot(value);
      setSnapshotSyncedAt(Date.now());
      setServerVerified(true);
      setError(null);
    } catch (cause) {
      const typed = cause as Error & {
        snapshot?: GuildworkSnapshot;
      };

      if (typed.snapshot) {
        // Si le serveur a quand même fourni un snapshot canonique,
        // on peut continuer à lui faire confiance.
        setSnapshot(typed.snapshot);
        setSnapshotSyncedAt(Date.now());
        setServerVerified(true);
      } else if (!hasCache) {
        // Aucun état réel connu : seulement dans ce cas on bloque
        // l'interface jusqu'à une vraie connexion serveur.
        setServerVerified(false);
      }

      // Polling/focus : une micro-coupure réseau ne doit jamais
      // afficher "Failed to fetch" ni effacer le dernier état réel.
      // Premier chargement ou clic manuel : l'erreur reste visible.
      if (!quiet || !hasCache) {
        setError(
          typed.message || "Impossible de charger Guildwork.",
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(cached !== null);

    // Une minute suffit largement pour la synchro de fond.
    // Le compte à rebours, lui, continue localement chaque seconde
    // sans envoyer de requête réseau.
    const polling = window.setInterval(() => {
      void refresh(true);
    }, 60_000);

    // Quand l'utilisateur revient réellement dans TailBlue,
    // on resynchronise tout de suite au lieu d'attendre la minute.
    const syncOnFocus = () => {
      void refresh(true);
    };

    window.addEventListener("focus", syncOnFocus);

    return () => {
      window.clearInterval(polling);
      window.removeEventListener("focus", syncOnFocus);
    };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const remaining = useMemo(
    () =>
      snapshot
        ? remainingFromSnapshot(
            snapshot,
            snapshotSyncedAt,
            clock,
          )
        : 0,
    [snapshot, snapshotSyncedAt, clock],
  );

  // blockedCode + available viennent du même snapshot que le POST.
  // Ils sont la vérité canonique, même si un ancien readyAt naïf
  // est ambigu à cause du fuseau horaire du serveur.
  const cooldownActive =
    snapshot?.blockedCode === "cooldown" ||
    (Boolean(snapshot?.readyAt) && remaining > 0);

  const treasuryBlocked =
    snapshot?.blockedCode === "treasury" ||
    (Boolean(snapshot) &&
      snapshot!.treasury < snapshot!.cost);

  const available =
    Boolean(snapshot) &&
    serverVerified &&
    snapshot!.available &&
    !cooldownActive &&
    !treasuryBlocked;

  const execute = async () => {
    if (!available || running) return;

    setRunning(true);
    setError(null);
    setResult(null);

    try {
      const value = await runGuildwork();
      setResult(value);
      setSnapshot(value.snapshot);
      setSnapshotSyncedAt(Date.now());
      setServerVerified(true);
    } catch (cause) {
      const typed = cause as Error & {
        snapshot?: GuildworkSnapshot;
        code?: string;
      };

      if (typed.snapshot) {
        // Le 409 contient précisément l'état qui a refusé le POST.
        // On l'affiche au lieu de l'effacer silencieusement.
        setSnapshot(typed.snapshot);
        setSnapshotSyncedAt(Date.now());
        setServerVerified(true);
        setError(
          typed.message ||
            typed.snapshot.blockedReason ||
            "Guildwork refusé par le Royaume.",
        );
        setResult(null);
      } else {
        setServerVerified(false);
        setError(
          typed.message || "Guildwork impossible.",
        );
      }
    } finally {
      setRunning(false);
    }
  };

  if (!guildworkApiConfigured) {
    return (
      <section className="tb-gw-state">
        <span>🔌</span>
        <h2>Connexion TailBlue requise</h2>
        <p>
          Guildwork utilise uniquement le moteur canonique du
          Royaume. Aucun mode fictif n’est disponible.
        </p>
      </section>
    );
  }

  if (loading && !snapshot) {
    return (
      <section className="tb-gw-state">
        <span className="tb-gw-float">⚒️</span>
        <h2>Ouverture du registre Guildwork…</h2>
        <p>
          Premier chargement de l’état réel de la guilde.
        </p>
      </section>
    );
  }

  if (error && !snapshot) {
    return (
      <section className="tb-gw-state error">
        <span>⚠️</span>
        <h2>Guildwork indisponible</h2>
        <p>{error}</p>
        <button onClick={() => void refresh(false)}>
          Réessayer
        </button>
      </section>
    );
  }

  if (!snapshot) return null;

  if (cooldownActive) {
    return (
      <GuildworkCompletedView
        snapshot={snapshot}
        result={result}
        remaining={remaining}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void refresh(false)}
      />
    );
  }

  const xpPercent = Math.max(
    0,
    Math.min(
      100,
      (snapshot.guildXp / snapshot.guildXpNeeded) * 100,
    ),
  );

  const statusLabel = treasuryBlocked
    ? "Trésor insuffisant"
    : cooldownActive
      ? "Récupération"
      : "Mission disponible";

  return (
    <section className="tb-gw-page">
      {error && (
        <div className="tb-gw-soft-error">
          ⚠️ {error}
        </div>
      )}

      <article
        className={`tb-gw-hero ${
          available ? "ready" : "waiting"
        }`}
      >
        <div className="tb-gw-hero-mark">
          <span>⚒️</span>
        </div>

        <div className="tb-gw-hero-copy">
          <span className="tb-gw-eyebrow">
            ACTIVITÉ DE GUILDE
          </span>
          <h2>Guildwork</h2>
          <p>
            Toute la guilde se mobilise pour une mission du
            Royaume. Une seule action, un seul état partagé
            avec Discord.
          </p>

          <div className="tb-gw-status-line">
            <i className={available ? "ready" : ""} />
            <strong>{statusLabel}</strong>

            {cooldownActive && (
              <span>
                • retour dans {formatDuration(remaining)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="tb-gw-refresh"
          onClick={() => void refresh(false)}
          disabled={refreshing || running}
          title="Actualiser depuis le Royaume"
        >
          <span className={refreshing ? "spin" : ""}>
            ↻
          </span>
          {refreshing ? "Synchro…" : "Actualiser"}
        </button>
      </article>

      <div className="tb-gw-layout">
        <div className="tb-gw-main">
          <article className="tb-gw-action-card">
            <header>
              <div>
                <span className="tb-gw-eyebrow">
                  MISSION COLLECTIVE
                </span>
                <h3>Mobiliser la guilde</h3>
              </div>

              <div
                className={`tb-gw-availability ${
                  available ? "ready" : ""
                }`}
              >
                {available
                  ? "● Disponible"
                  : cooldownActive
                    ? formatDuration(remaining)
                    : "Bloqué"}
              </div>
            </header>

            <p className="tb-gw-action-description">
              Le trésor finance la mission. Les cookies gagnés
              sont répartis entre tous les membres, tandis que
              le trésor et l’XP de guilde progressent ensemble.
            </p>

            <div className="tb-gw-rewards">
              <article>
                <span>👥 Chaque membre</span>
                <strong>
                  +{range(
                    snapshot.rewardRanges.perMember.min,
                    snapshot.rewardRanges.perMember.max,
                  )} 🍪
                </strong>
                <small>
                  selon le tirage de la mission
                </small>
              </article>

              <article>
                <span>🏦 Trésor</span>
                <strong>
                  +{range(
                    snapshot.rewardRanges.treasury.min,
                    snapshot.rewardRanges.treasury.max,
                  )} 🍪
                </strong>
                <small>
                  avant prise en compte du coût
                </small>
              </article>

              <article>
                <span>✨ Guilde</span>
                <strong>
                  +{range(
                    snapshot.rewardRanges.guildXp.min,
                    snapshot.rewardRanges.guildXp.max,
                  )} XP
                </strong>
                <small>
                  progression du niveau de guilde
                </small>
              </article>
            </div>

            <div className="tb-gw-cost-row">
              <div>
                <span>Coût de mobilisation</span>
                <strong>
                  {formatNumber(snapshot.cost)} 🍪
                </strong>
              </div>

              <div>
                <span>Trésor actuel</span>
                <strong
                  className={
                    treasuryBlocked ? "danger" : ""
                  }
                >
                  {formatNumber(snapshot.treasury)} 🍪
                </strong>
              </div>

              <div>
                <span>Cooldown partagé</span>
                <strong>2 heures</strong>
              </div>
            </div>

            {treasuryBlocked && (
              <div className="tb-gw-blocked-message">
                🏦 Il manque{" "}
                <strong>
                  {formatNumber(
                    snapshot.cost - snapshot.treasury,
                  )} cookies
                </strong>{" "}
                dans le trésor pour lancer la mission.
              </div>
            )}

            {cooldownActive && (
              <div className="tb-gw-blocked-message">
                ⏳ Un Guildwork a déjà été accompli. Le même
                cooldown est utilisé sur Discord et dans l’app.
              </div>
            )}

            <button
              type="button"
              className="tb-gw-run"
              disabled={!available || running}
              onClick={() => void execute()}
            >
              {running ? (
                <>
                  <span className="tb-gw-run-spinner" />
                  Mission en cours…
                </>
              ) : !serverVerified ? (
                <>
                  <span className="tb-gw-run-spinner" />
                  Vérification du Royaume…
                </>
              ) : available ? (
                <>
                  <span>⚒️</span>
                  Lancer le Guildwork
                </>
              ) : cooldownActive ? (
                <>
                  <span>⏳</span>
                  Disponible dans {formatDuration(remaining)}
                </>
              ) : (
                <>
                  <span>🏦</span>
                  Trésor insuffisant
                </>
              )}
            </button>
          </article>
        </div>

        <aside className="tb-gw-sidebar">
          <article className="tb-gw-guild-card">
            <span className="tb-gw-eyebrow">
              {snapshot.guildName}
            </span>
            <div className="tb-gw-level">
              <span>Niveau</span>
              <strong>{snapshot.guildLevel}</strong>
            </div>

            <div className="tb-gw-xp-line">
              <span>
                {formatNumber(snapshot.guildXp)} /{" "}
                {formatNumber(snapshot.guildXpNeeded)} XP
              </span>
              <strong>
                {Math.floor(xpPercent)}%
              </strong>
            </div>

            <div className="tb-gw-xp-track">
              <i
                style={{
                  width: `${xpPercent}%`,
                }}
              />
            </div>
          </article>

          <article className="tb-gw-rule-card">
            <span>👥</span>
            <div>
              <strong>
                {snapshot.memberCount} membre
                {snapshot.memberCount > 1 ? "s" : ""}
              </strong>
              <p>
                La récompense de cookies est partagée entre
                toute la compagnie.
              </p>
            </div>
          </article>

          <article className="tb-gw-rule-card">
            <span>🔗</span>
            <div>
              <strong>Discord ↔ Desktop</strong>
              <p>
                Le tirage, le coût, le cooldown et les
                sauvegardes viennent du même moteur Python.
              </p>
            </div>
          </article>

          <article className="tb-gw-rule-card">
            <span>🐾</span>
            <div>
              <strong>Progression connectée</strong>
              <p>
                Quêtes de guilde, compagnon actif et
                interactions Taiga restent dans le moteur
                canonique.
              </p>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
