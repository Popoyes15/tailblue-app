// TAILBLUE_WORLD_APP_V3_20260826
import {
  useState,
} from "react";

import { worldApi } from "../api/worldApi";
import TailBlueImageViewer from "../components/TailBlueImageViewer";
import { useWorldSnapshot } from "../hooks/useWorldSnapshot";
import type {
  LeaderboardEntryDto,
} from "../types/world";

import "./worldV3.css";

function medal(index: number) {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}`;
}

// TAILBLUE_WORLD_READABILITY_V31_20260826
function hasReadableDiscordName(
  entry: LeaderboardEntryDto,
) {
  // Nettoie aussi un ancien snapshot V3 encore présent
  // dans sessionStorage avant le premier refresh V3.1.
  return !/^Aventurier\s+\d+$/i.test(
    entry.displayName.trim(),
  );
}

function Avatar({
  entry,
  onZoom,
}: {
  entry: LeaderboardEntryDto;
  onZoom: () => void;
}) {
  if (!entry.avatarUrl) {
    return (
      <div className="wv3-avatar fallback">
        👤
      </div>
    );
  }

  return (
    <button
      className="wv3-avatar"
      onClick={onZoom}
    >
      <img
        src={entry.avatarUrl}
        alt={entry.displayName}
      />
      <span>⛶</span>
    </button>
  );
}

export default function LeaderboardPage() {
  const {
    snapshot,
    loading,
    refreshing,
    error,
    refresh,
  } = useWorldSnapshot({
    cacheKey: "leaderboard",
    loader:
      worldApi.getLevelLeaderboard,
  });

  const [zoom, setZoom] =
    useState<{
      url: string;
      title: string;
    } | null>(null);

  const readableEntries =
    snapshot?.entries.filter(
      hasReadableDiscordName,
    ) ?? [];

  if (
    loading &&
    !snapshot
  ) {
    return (
      <section className="wv3-state">
        <span>🏆</span>
        <h2>
          Ouverture du classement…
        </h2>
      </section>
    );
  }

  if (
    !snapshot ||
    !readableEntries.length
  ) {
    return (
      <section className="wv3-state">
        <span>⚠️</span>
        <h2>
          Classement indisponible
        </h2>
        <p>
          {error ??
            "Aucun Top 10 réel reçu."}
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

  const entries =
    readableEntries.slice(
      0,
      10,
    );

  const top =
    entries.slice(0, 3);

  const rest =
    entries.slice(3);

  const currentRank =
    snapshot.currentUser
      ? entries.findIndex(
          (entry) =>
            entry.userId ===
            snapshot.currentUser
              ?.userId,
        ) + 1
      : 0;

  return (
    <>
      <section className="wv3-page">
        <header className="wv3-heading">
          <div>
            <span className="wv3-eyebrow">
              MONDE • ROYAUME
            </span>
            <h1>
              🏆 Classement
            </h1>
            <p>
              Le Top 10 canonique de <code>!topniveau</code>, sans score inventé.
            </p>
          </div>

          <div className="wv3-heading-actions">
            <span className="wv3-live">
              ● Topniveau réel
            </span>
            <button
              className="wv3-refresh"
              disabled={refreshing}
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

        {error && (
          <div className="wv3-message">
            ⚠️ {error}
          </div>
        )}

        <article className="wv3-ranking-title">
          <div>
            <span className="wv3-kicker">
              CLASSEMENT ROYAL
            </span>
            <h2>
              Les aventuriers les plus avancés
            </h2>
            <p>
              Niveau calculé depuis l’XP réelle du registre TailBlue.
            </p>
          </div>
          <strong>TOP 10</strong>
        </article>

        <section className="wv3-podium">
          {top.map(
            (entry, index) => (
              <article
                key={entry.userId}
                className={`rank-${index + 1}`}
              >
                <span className="wv3-medal">
                  {medal(index)}
                </span>

                <Avatar
                  entry={entry}
                  onZoom={() => {
                    if (!entry.avatarUrl)
                      return;

                    setZoom({
                      url:
                        entry.avatarUrl,
                      title:
                        entry.displayName,
                    });
                  }}
                />

                {entry.isHime && (
                  <span className="wv3-hime">
                    👑 Hime-sama
                  </span>
                )}

                <h3>
                  {entry.displayName}
                </h3>
                <small>
                  Aventurier TailBlue
                </small>
                <strong>
                  Niveau {entry.level}
                </strong>
              </article>
            ),
          )}
        </section>

        <div className="wv3-ranking-layout">
          <section className="wv3-panel ranking-list">
            <header className="wv3-section-heading">
              <div>
                <span className="wv3-kicker">
                  TOPNIVEAU
                </span>
                <h2>
                  Positions 4 à 10
                </h2>
              </div>
            </header>

            {rest.map(
              (entry, index) => (
                <article
                  className="wv3-rank-row"
                  key={entry.userId}
                >
                  <b>
                    {index + 4}
                  </b>

                  <Avatar
                    entry={entry}
                    onZoom={() => {
                      if (
                        !entry.avatarUrl
                      )
                        return;

                      setZoom({
                        url:
                          entry.avatarUrl,
                        title:
                          entry.displayName,
                      });
                    }}
                  />

                  <div>
                    <strong>
                      {
                        entry.displayName
                      }
                      {entry.isHime
                        ? " 👑"
                        : ""}
                    </strong>
                    <small>
                      Aventurier TailBlue
                    </small>
                  </div>

                  <span>
                    Niveau{" "}
                    {entry.level}
                  </span>
                </article>
              ),
            )}
          </section>

          <aside className="wv3-panel current-rank">
            <span className="wv3-kicker">
              TA POSITION
            </span>

            {snapshot.currentUser ? (
              <>
                <Avatar
                  entry={
                    snapshot.currentUser
                  }
                  onZoom={() => {
                    if (
                      !snapshot
                        .currentUser
                        ?.avatarUrl
                    )
                      return;

                    setZoom({
                      url:
                        snapshot
                          .currentUser
                          .avatarUrl,
                      title:
                        snapshot
                          .currentUser
                          .displayName,
                    });
                  }}
                />

                <h3>
                  {
                    snapshot.currentUser
                      .displayName
                  }
                </h3>
                <strong>
                  Niveau{" "}
                  {
                    snapshot.currentUser
                      .level
                  }
                </strong>
                <p>
                  {currentRank > 0
                    ? `#${currentRank} du Top 10`
                    : "Hors du Top 10 actuel"}
                </p>
              </>
            ) : (
              <p>
                Position personnelle indisponible.
              </p>
            )}
          </aside>
        </div>
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
