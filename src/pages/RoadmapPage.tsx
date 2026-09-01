// TAILBLUE_INFORMATION_CMS_ROADMAP_V1_20260827

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  cachedRoadmap,
  loadRoadmapSnapshot,
} from "../api/informationApi";

import type {
  RoadmapSnapshot,
  RoadmapStatus,
} from "../types/information";

import InformationStudio from "../components/InformationStudio";
import TailBlueMarkdown, { TailBlueInline } from "../components/TailBlueMarkdown";

import "./informationFinal.css";

const EMPTY: RoadmapSnapshot = {
  items: [],
  connected: false,
  mode: "offline",
};

const ORDER: RoadmapStatus[] = [
  "current",
  "next",
  "done",
  "later",
  "paused",
];

const LABELS: Record<
  RoadmapStatus,
  string
> = {
  done: "Terminé",
  current: "En cours",
  next: "Prochaine étape",
  later: "Plus tard",
  paused: "En attente",
};

export default function RoadmapPage({
  isHime = false,
}: {
  isHime?: boolean;
}) {
  const [snapshot, setSnapshot] =
    useState<RoadmapSnapshot>(
      () =>
        cachedRoadmap() ??
        EMPTY,
    );

  const [filter, setFilter] =
    useState<
      "all" | RoadmapStatus
    >("all");

  const [loading, setLoading] =
    useState(
      !cachedRoadmap(),
    );

  const [refreshing, setRefreshing] =
    useState(false);

  const [studioOpen, setStudioOpen] =
    useState(false);

  const refresh =
    useCallback(
      async (
        quiet = false,
      ) => {
        if (!quiet) {
          setRefreshing(true);
        }

        try {
          setSnapshot(
            await loadRoadmapSnapshot(),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    void refresh(true);

    const timer =
      window.setInterval(
        () =>
          void refresh(true),
        45_000,
      );

    const onFocus = () =>
      void refresh(true);

    window.addEventListener(
      "focus",
      onFocus,
    );

    return () => {
      window.clearInterval(
        timer,
      );
      window.removeEventListener(
        "focus",
        onFocus,
      );
    };
  }, [refresh]);

  const counts =
    useMemo(
      () =>
        Object.fromEntries(
          ORDER.map(
            (status) => [
              status,
              snapshot.items.filter(
                (item) =>
                  item.status ===
                  status,
              ).length,
            ],
          ),
        ),
      [snapshot.items],
    );

  const visible =
    filter === "all"
      ? snapshot.items
      : snapshot.items.filter(
          (item) =>
            item.status ===
            filter,
        );

  const doneCount =
    snapshot.items.filter(
      (item) =>
        item.status ===
        "done",
    ).length;

  const totalCount =
    snapshot.items.length;

  const globalProgress =
    Number.isFinite(
      snapshot.globalProgress,
    )
      ? Math.round(
          snapshot.globalProgress ??
            0,
        )
      : totalCount
        ? Math.round(
            snapshot.items.reduce(
              (
                total,
                item,
              ) =>
                total +
                (item.progress ??
                  0),
              0,
            ) /
              totalCount,
          )
        : 0;

  return (
    <section className="info-page roadmap-final-page">
      <header className="info-heading">
        <div>
          <p className="info-eyebrow">
            🗺️ AVENIR DU ROYAUME
          </p>

          <h1>Roadmap</h1>

          <p>
            Le chantier réel de
            TailBlue : statut,
            étapes et progression
            calculée automatiquement
            depuis le registre de
            Hime-sama.
          </p>
        </div>

        <div className="news-actions-final">
          {isHime && (
            <button
              className="info-hime-manage"
              onClick={() =>
                setStudioOpen(
                  true,
                )
              }
            >
              👑 Gérer
            </button>
          )}

          <span
            className={`info-connection ${
              snapshot.connected
                ? "connected"
                : snapshot.items
                    .length
                  ? "preview"
                  : "offline"
            }`}
          >
            {snapshot.connected
              ? "● Roadmap connectée"
              : snapshot.items.length
                ? "○ Dernière copie réelle"
                : "● Hors ligne"}
          </span>

          <button
            onClick={() =>
              void refresh()
            }
            disabled={
              refreshing
            }
          >
            {refreshing
              ? "Actualisation…"
              : "↻ Actualiser"}
          </button>
        </div>
      </header>

      <div className="roadmap-overview-final">
        <div>
          <span>
            PROGRESSION GLOBALE
          </span>
          <strong>
            {globalProgress}%
          </strong>
          <small>
            {doneCount} terminée(s)
            sur {totalCount}
          </small>
        </div>

        <div className="roadmap-global-bar">
          <i
            style={{
              width:
                `${globalProgress}%`,
            }}
          />
        </div>

        <div className="roadmap-kpis-final">
          <span>
            <b>
              {counts.current ??
                0}
            </b>
            {" "}en cours
          </span>

          <span>
            <b>
              {counts.next ??
                0}
            </b>
            {" "}prochaines
          </span>

          <span>
            <b>
              {counts.later ??
                0}
            </b>
            {" "}plus tard
          </span>

          <span>
            <b>
              {counts.paused ??
                0}
            </b>
            {" "}en attente
          </span>
        </div>
      </div>

      <div className="roadmap-filter-final">
        <button
          className={
            filter === "all"
              ? "selected"
              : ""
          }
          onClick={() =>
            setFilter("all")
          }
        >
          Tout · {totalCount}
        </button>

        {ORDER.map(
          (status) => (
            <button
              key={status}
              className={
                filter === status
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setFilter(
                  status,
                )
              }
            >
              {LABELS[status]} ·{" "}
              {counts[status] ??
                0}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="info-empty-state">
          <span>🗺️</span>
          <h2>
            Chargement de la
            roadmap…
          </h2>
        </div>
      ) : visible.length ? (
        <div className="roadmap-list-final">
          {visible.map(
            (
              item,
              index,
            ) => (
              <article
                key={
                  item.id
                }
                className={`roadmap-item-final status-${item.status}`}
              >
                <div className="roadmap-step-final">
                  {String(
                    index + 1,
                  ).padStart(
                    2,
                    "0",
                  )}
                </div>

                <section>
                  <div className="roadmap-item-meta-final">
                    <span className="roadmap-status-final">
                      {
                        LABELS[
                          item
                            .status
                        ]
                      }
                    </span>

                    {item.area && (
                      <span>
                        {
                          item.area
                        }
                      </span>
                    )}

                    {item.target && (
                      <span>
                        🎯{" "}
                        {
                          item.target
                        }
                      </span>
                    )}
                  </div>

                  <h2>
                    <TailBlueInline value={item.title} />
                  </h2>

                  <TailBlueMarkdown
                    value={item.description}
                    className="roadmap-description-markdown"
                    compact
                  />

                  <div className="roadmap-progress-final">
                    <i
                      style={{
                        width:
                          `${item.progress ?? 0}%`,
                      }}
                    />
                    <span>
                      {item.progress ??
                        0}
                      %
                    </span>
                  </div>

                  {!!item.checklist
                    ?.length && (
                    <div className="roadmap-checklist-live">
                      {item.checklist.map(
                        (
                          step,
                        ) => (
                          <span
                            key={
                              step.id
                            }
                            className={
                              step.done
                                ? "done"
                                : ""
                            }
                          >
                            {step.done
                              ? "✅"
                              : "⬜"}{" "}
                            {
                              step.text
                            }
                          </span>
                        ),
                      )}
                    </div>
                  )}
                </section>
              </article>
            ),
          )}
        </div>
      ) : (
        <div className="info-empty-state">
          <span>📭</span>
          <h2>
            Aucune étape dans
            ce filtre
          </h2>
        </div>
      )}

      {isHime && (
        <InformationStudio
          open={
            studioOpen
          }
          initialTab="roadmap"
          onClose={() =>
            setStudioOpen(
              false,
            )
          }
          onChanged={() =>
            void refresh(true)
          }
        />
      )}
    </section>
  );
}
