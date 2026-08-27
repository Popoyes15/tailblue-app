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
  MuseumCandidateDto,
  MuseumPieceDto,
} from "../types/world";

import "./worldV3.css";

type Tab =
  | "collection"
  | "ajouter";

function number(value: number) {
  return value.toLocaleString(
    "fr-CH",
  );
}

function PieceArt({
  piece,
  onZoom,
}: {
  piece:
    | MuseumPieceDto
    | MuseumCandidateDto;
  onZoom: (
    url: string,
    title: string,
  ) => void;
}) {
  const image =
    resolveWorldAssetUrl(
      piece.image,
    );

  if (!image) {
    return (
      <div className="wv3-piece-art fallback">
        {piece.emoji ??
          "🏺"}
      </div>
    );
  }

  return (
    <button
      className="wv3-piece-art"
      onClick={() =>
        onZoom(
          image,
          piece.name,
        )
      }
    >
      <img
        src={image}
        alt={piece.name}
      />
      <span>⛶</span>
    </button>
  );
}

export default function MuseumPage() {
  const {
    snapshot,
    setSnapshot,
    loading,
    refreshing,
    error,
    refresh,
  } = useWorldSnapshot({
    cacheKey: "museum",
    loader: worldApi.getMuseum,
  });

  const [tab, setTab] =
    useState<Tab>("collection");

  const [search, setSearch] =
    useState("");

  const [busy, setBusy] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [zoom, setZoom] =
    useState<{
      url: string;
      title: string;
    } | null>(null);

  const candidates = useMemo(
    () => {
      const query =
        search
          .trim()
          .toLocaleLowerCase(
            "fr-CH",
          );

      if (!query) {
        return (
          snapshot?.candidates ??
          []
        );
      }

      return (
        snapshot?.candidates ??
        []
      ).filter((item) =>
        [
          item.name,
          item.rarity,
          item.description,
          item.source,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase(
            "fr-CH",
          )
          .includes(query)
      );
    },
    [search, snapshot],
  );

  async function expose(
    candidate: MuseumCandidateDto,
  ) {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const value =
        await worldApi.addMuseumPiece(
          candidate.key,
        );

      setSnapshot(value);
      setMessage(
        `🏛️ ${candidate.name} rejoint la collection.`,
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Ajout impossible.",
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
        <span>🏛️</span>
        <h2>
          Ouverture du musée…
        </h2>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="wv3-state">
        <span>⚠️</span>
        <h2>
          Musée indisponible
        </h2>
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

  const heroImage =
    resolveWorldAssetUrl(
      snapshot.museumImage,
    );

  return (
    <>
      <section className="wv3-page">
        <header className="wv3-heading">
          <div>
            <span className="wv3-eyebrow">
              MONDE • COLLECTION
            </span>
            <h1>🏛️ Musée</h1>
            <p>
              Les pièces exposées sont réellement retirées de tes sacs TailBlue.
            </p>
          </div>

          <div className="wv3-heading-actions">
            <span className="wv3-live">
              ● Collection réelle
            </span>
            <button
              className="wv3-refresh"
              disabled={
                refreshing || busy
              }
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

        {(message || error) && (
          <div className="wv3-message">
            {message ||
              `⚠️ ${error}`}
          </div>
        )}

        <article className="wv3-hero museum">
          {heroImage && (
            <button
              className="wv3-hero-art"
              onClick={() =>
                setZoom({
                  url: heroImage,
                  title:
                    snapshot.museumName,
                })
              }
            >
              <div
                className="wv3-blur"
                style={{
                  backgroundImage:
                    `url("${heroImage}")`,
                }}
              />
              <img
                src={heroImage}
                alt={
                  snapshot.museumName
                }
              />
              <span>⛶ Agrandir</span>
            </button>
          )}

          <div className="wv3-hero-copy">
            <span className="wv3-kicker">
              TON MUSÉE
            </span>
            <h2>
              🏛️{" "}
              {snapshot.museumName}
            </h2>
            <p>
              {snapshot.description}
            </p>

            <div className="wv3-stat-grid three compact">
              <article>
                <span>
                  🖼️ Pièces
                </span>
                <strong>
                  {
                    snapshot.pieces
                      .length
                  }
                </strong>
              </article>
              <article>
                <span>
                  💎 Valeur
                </span>
                <strong>
                  {number(
                    snapshot.estimatedValue,
                  )}{" "}
                  🍪
                </strong>
              </article>
              <article>
                <span>
                  🎒 Ajoutables
                </span>
                <strong>
                  {
                    snapshot
                      .candidates
                      .length
                  }
                </strong>
              </article>
            </div>
          </div>
        </article>

        <nav className="wv3-tabs">
          <button
            className={
              tab === "collection"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("collection")
            }
          >
            🖼️ Collection{" "}
            <span>
              {snapshot.pieces.length}
            </span>
          </button>

          <button
            className={
              tab === "ajouter"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("ajouter")
            }
          >
            🎒 Exposer{" "}
            <span>
              {
                snapshot.candidates
                  .length
              }
            </span>
          </button>
        </nav>

        {tab === "collection" && (
          <section className="wv3-panel">
            <header className="wv3-section-heading">
              <div>
                <span className="wv3-kicker">
                  COLLECTION PERMANENTE
                </span>
                <h2>
                  Archives exposées
                </h2>
              </div>
            </header>

            {!snapshot.pieces
              .length ? (
              <div className="wv3-empty">
                <span>🖼️</span>
                <h3>
                  Les salles sont encore vides
                </h3>
                <p>
                  Expose une première pièce depuis tes vrais sacs.
                </p>
              </div>
            ) : (
              <div className="wv3-card-grid museum-grid">
                {snapshot.pieces.map(
                  (
                    piece,
                    index,
                  ) => (
                    <article
                      className="wv3-piece-card"
                      key={
                        piece.id ??
                        `${piece.name}-${index}`
                      }
                    >
                      <PieceArt
                        piece={piece}
                        onZoom={(
                          url,
                          title,
                        ) =>
                          setZoom({
                            url,
                            title,
                          })
                        }
                      />

                      <div>
                        <span className="wv3-kicker">
                          {piece.rarity ??
                            "Rareté inconnue"}
                        </span>
                        <h3>
                          {piece.emoji ??
                            "🏺"}{" "}
                          {piece.name}
                        </h3>
                        <p>
                          {piece.description ||
                            "Pièce conservée dans les archives du Royaume."}
                        </p>
                        <strong>
                          💎{" "}
                          {number(
                            piece.value ??
                              0,
                          )}{" "}
                          🍪
                        </strong>
                      </div>
                    </article>
                  ),
                )}
              </div>
            )}
          </section>
        )}

        {tab === "ajouter" && (
          <section className="wv3-panel">
            <header className="wv3-section-heading">
              <div>
                <span className="wv3-kicker">
                  DEPUIS TES SACS
                </span>
                <h2>
                  Nouvelle exposition
                </h2>
                <p>
                  Le filtre d’exposition est exactement celui du musée Discord.
                </p>
              </div>
            </header>

            <label className="wv3-search wide">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Chercher un objet exposable…"
              />
            </label>

            {!candidates.length ? (
              <div className="wv3-empty">
                <span>🎒</span>
                <h3>
                  Aucun objet exposable
                </h3>
              </div>
            ) : (
              <div className="wv3-candidate-list">
                {candidates.map(
                  (candidate) => (
                    <article
                      key={
                        candidate.key
                      }
                    >
                      <span className="wv3-candidate-icon">
                        {candidate.emoji ??
                          "📦"}
                      </span>
                      <div>
                        <strong>
                          {
                            candidate.name
                          }
                        </strong>
                        <small>
                          x
                          {
                            candidate.quantity
                          }{" "}
                          •{" "}
                          {candidate.rarity ??
                            "Rareté inconnue"}
                        </small>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() =>
                          void expose(
                            candidate,
                          )
                        }
                      >
                        Exposer
                      </button>
                    </article>
                  ),
                )}
              </div>
            )}
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
