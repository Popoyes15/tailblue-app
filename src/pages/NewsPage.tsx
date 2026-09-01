// TAILBLUE_INFORMATION_CMS_NEWS_V1_20260827

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";

import {
  cachedUpdates,
  loadUpdatesSnapshot,
} from "../api/informationApi";

import type {
  TailBlueUpdateArticle,
  UpdateFeedSnapshot,
} from "../types/information";

import InformationStudio from "../components/InformationStudio";
import TailBlueMarkdown, { TailBlueInline } from "../components/TailBlueMarkdown";

import "./informationFinal.css";

const EMPTY: UpdateFeedSnapshot = {
  articles: [],
  connected: false,
  mode: "offline",
};

export default function NewsPage({
  isHime = false,
}: {
  isHime?: boolean;
}) {
  const [snapshot, setSnapshot] =
    useState<UpdateFeedSnapshot>(
      () =>
        cachedUpdates() ??
        EMPTY,
    );

  const [selected, setSelected] =
    useState<TailBlueUpdateArticle | null>(
      null,
    );

  const [tag, setTag] =
    useState("all");

  const [loading, setLoading] =
    useState(
      !cachedUpdates(),
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
            await loadUpdatesSnapshot(),
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
        30_000,
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

  const tags =
    useMemo(
      () => [
        "all",
        ...Array.from(
          new Set(
            snapshot.articles.map(
              (article) =>
                article.tag,
            ),
          ),
        ),
      ],
      [snapshot.articles],
    );

  const visible =
    tag === "all"
      ? snapshot.articles
      : snapshot.articles.filter(
          (article) =>
            article.tag === tag,
        );

  const featured =
    visible[0] ?? null;

  const rest =
    visible.slice(1);

  return (
    <section className="info-page news-final-page">
      <header className="info-heading">
        <div>
          <p className="info-eyebrow">
            ✨ CHRONIQUES DU ROYAUME
          </p>
          <h1>Nouveautés</h1>
          <p>
            Toutes les annonces
            officielles de TailBlue,
            synchronisées depuis le
            même registre que Hime-sama.
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

          <ConnectionPill
            snapshot={
              snapshot
            }
          />

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

      <div className="news-filter-final">
        {tags.map(
          (item) => (
            <button
              key={item}
              className={
                tag === item
                  ? "selected"
                  : ""
              }
              onClick={() =>
                setTag(item)
              }
            >
              {item === "all"
                ? `Toutes · ${snapshot.articles.length}`
                : item}
            </button>
          ),
        )}
      </div>

      {loading ? (
        <div className="info-empty-state">
          <span>✨</span>
          <h2>
            Chargement des
            chroniques…
          </h2>
        </div>
      ) : featured ? (
        <>
          <button
            className={`news-featured-final importance-${featured.importance ?? "standard"}`}
            onClick={() =>
              setSelected(
                featured,
              )
            }
          >
            <NewsCover
              article={
                featured
              }
              large
            />

            <section>
              <Meta
                article={
                  featured
                }
              />
              <h2>
                <TailBlueInline value={featured.title} />
              </h2>
              <p>
                <TailBlueInline value={featured.excerpt} />
              </p>
              <strong>
                Lire l'article{" "}
                <i>→</i>
              </strong>
            </section>
          </button>

          <div className="news-grid-final">
            {rest.map(
              (article) => (
                <button
                  key={
                    article.id
                  }
                  className={`news-card-final importance-${article.importance ?? "standard"}`}
                  onClick={() =>
                    setSelected(
                      article,
                    )
                  }
                >
                  <NewsCover
                    article={
                      article
                    }
                  />

                  <section>
                    <Meta
                      article={
                        article
                      }
                    />
                    <h3>
                      <TailBlueInline value={article.title} />
                    </h3>
                    <p>
                      <TailBlueInline value={article.excerpt} />
                    </p>
                    <strong>
                      Ouvrir{" "}
                      <i>→</i>
                    </strong>
                  </section>
                </button>
              ),
            )}
          </div>
        </>
      ) : (
        <div className="info-empty-state">
          <span>📭</span>
          <h2>
            Aucune chronique
            publiée
          </h2>
          <p>
            Hime-sama publiera ici
            les prochaines nouveautés
            du Royaume.
          </p>
        </div>
      )}

      {selected && (
        <NewsReader
          article={
            selected
          }
          onClose={() =>
            setSelected(null)
          }
        />
      )}

      {isHime && (
        <InformationStudio
          open={studioOpen}
          initialTab="updates"
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

function ConnectionPill({
  snapshot,
}: {
  snapshot: UpdateFeedSnapshot;
}) {
  if (
    snapshot.connected
  ) {
    return (
      <span className="info-connection connected">
        ● Flux TailBlue
        connecté
      </span>
    );
  }

  if (
    snapshot.articles.length
  ) {
    return (
      <span className="info-connection preview">
        ○ Dernière copie réelle
      </span>
    );
  }

  return (
    <span className="info-connection offline">
      ● Hors ligne
    </span>
  );
}

function Meta({
  article,
}: {
  article: TailBlueUpdateArticle;
}) {
  return (
    <div className="news-meta-final">
      <span>
        {article.tag}
      </span>
      <time>
        {formatDate(
          article.publishedAt,
        )}
      </time>
    </div>
  );
}

function NewsCover({
  article,
  large = false,
}: {
  article: TailBlueUpdateArticle;
  large?: boolean;
}) {
  const image =
    article.images[0];

  if (!image) {
    return (
      <div
        className={`news-cover-final empty ${
          large
            ? "large"
            : ""
        }`}
      >
        <span>✦</span>
      </div>
    );
  }

  return (
    <div
      className={`news-cover-final ${
        large
          ? "large"
          : ""
      }`}
      style={{
        backgroundImage:
          `url("${image}")`,
      }}
    >
      <i />
      <img
        src={image}
        alt={article.title}
      />

      {article.images.length >
        1 && (
        <em>
          +
          {article.images.length -
            1}
        </em>
      )}
    </div>
  );
}

function NewsReader({
  article,
  onClose,
}: {
  article: TailBlueUpdateArticle;
  onClose: () => void;
}) {
  const [
    imageIndex,
    setImageIndex,
  ] = useState(0);

  const image =
    article.images[
      imageIndex
    ];

  useEffect(
    () =>
      setImageIndex(0),
    [article.id],
  );

  return (
    <div
      className="news-reader-backdrop-final"
      onMouseDown={
        onClose
      }
    >
      <article
        className="news-reader-final"
        onMouseDown={(
          event: MouseEvent<HTMLElement>,
        ) =>
          event.stopPropagation()
        }
      >
        <button
          className="news-reader-close-final"
          onClick={
            onClose
          }
        >
          ×
        </button>

        {image && (
          <div
            className="news-reader-hero-final"
            style={{
              backgroundImage:
                `url("${image}")`,
            }}
          >
            <i />
            <img
              src={image}
              alt={
                article.title
              }
            />
          </div>
        )}

        {article.images.length >
          1 && (
          <div className="news-reader-thumbs-final">
            {article.images.map(
              (
                item,
                index,
              ) => (
                <button
                  key={`${item}-${index}`}
                  className={
                    index ===
                    imageIndex
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setImageIndex(
                      index,
                    )
                  }
                >
                  <img
                    src={item}
                    alt=""
                  />
                </button>
              ),
            )}
          </div>
        )}

        <div className="news-reader-copy-final">
          <Meta
            article={
              article
            }
          />
          <h1>
            <TailBlueInline value={article.title} />
          </h1>

          <div className="news-author-final">
            {article.author
              ? `Publié par ${article.author} · `
              : ""}
            {formatDateTime(
              article.publishedAt,
            )}
          </div>

          <UpdateBody
            body={
              article.body
            }
          />
        </div>
      </article>
    </div>
  );
}

function UpdateBody({
  body,
}: {
  body: string;
}) {
  return (
    <TailBlueMarkdown
      value={body}
      className="news-body-final"
    />
  );
}

function formatDate(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return (
      value ||
      "Date inconnue"
    );
  }

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function formatDateTime(
  value: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return (
      value ||
      "Date inconnue"
    );
  }

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}
