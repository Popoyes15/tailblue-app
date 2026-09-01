// TAILBLUE_INFORMATION_CMS_WIKI_V1_20260827

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";

import {
  ALL_COMMANDS,
  COMMAND_COUNT,
  COMMAND_GROUPS,
  GROUP_COUNT,
} from "../data/commandGuideData";

import {
  cachedWiki,
  loadWikiSnapshot,
} from "../api/informationApi";

import type {
  CommandGuide,
  WikiArticle,
  WikiSnapshot,
} from "../types/information";

import InformationStudio from "../components/InformationStudio";
import TailBlueMarkdown, { TailBlueInline } from "../components/TailBlueMarkdown";

import "./informationFinal.css";

const EMPTY: WikiSnapshot = {
  articles: [],
  connected: false,
  mode: "offline",
};

// TAILBLUE_WIKI_SEARCH_NORMALIZE_V1_20260827
function normalizeWikiSearchText(
  value: string,
): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[`*_~>#|]/g, " ")
    .replace(/[’‘´`]/g, "'")
    .replace(/[‐‑‒–—−]/g, "-")
    .toLocaleLowerCase("fr")
    .replace(/\s+/g, " ")
    .trim();
}

// TAILBLUE_WIKI_OVERFLOW_FIX_V1_20260827
export default function WikiPage({
  isHime = false,
}: {
  isHime?: boolean;
}) {
  const [mode, setMode] =
    useState<
      "articles" | "commands"
    >("articles");

  const [snapshot, setSnapshot] =
    useState<WikiSnapshot>(
      () =>
        cachedWiki() ??
        EMPTY,
    );

  const [query, setQuery] =
    useState("");

  const [
    selectedArticle,
    setSelectedArticle,
  ] =
    useState<WikiArticle | null>(
      null,
    );

  const [studioOpen, setStudioOpen] =
    useState(false);

  const refresh =
    useCallback(
      async () => {
        setSnapshot(
          await loadWikiSnapshot(),
        );
      },
      [],
    );

  useEffect(() => {
    void refresh();

    const timer =
      window.setInterval(
        () =>
          void refresh(),
        60_000,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [refresh]);

  const articleCategories =
    useMemo(
      () =>
        Array.from(
          new Set(
            snapshot.articles.map(
              (item) =>
                item.category,
            ),
          ),
        ),
      [snapshot.articles],
    );

  const normalized =
    normalizeWikiSearchText(
      query,
    );

  const articles =
    useMemo(
      () =>
        snapshot.articles.filter(
          (article) =>
            !normalized ||
            normalizeWikiSearchText(
              [
                article.title,
                article.summary,
                article.category,
                ...article.tags,
              ].join(" "),
            ).includes(
              normalized,
            ),
        ),
      [
        snapshot.articles,
        normalized,
      ],
    );

  return (
    <section className="info-page wiki-final-page">
      <header className="info-heading">
        <div>
          <p className="info-eyebrow">
            📖 GUIDE OFFICIEL DU
            ROYAUME
          </p>
          <h1>Wiki TailBlue</h1>
          <p>
            Guides éditoriaux de
            Hime-sama + miroir
            complet des commandes
            publiques{" "}
            <code>!helpme</code>.
          </p>
        </div>

        <div className="info-heading-pills">
          <span>
            📚{" "}
            {
              snapshot.articles
                .length
            }{" "}
            articles
          </span>
          <span>
            ✅ {COMMAND_COUNT}{" "}
            commandes
          </span>
          <span>
            🗂️{" "}
            {
              articleCategories
                .length
            }{" "}
            catégories Wiki
          </span>

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
        </div>
      </header>

      <div className="wiki-mode-switch">
        <button
          className={
            mode === "articles"
              ? "selected"
              : ""
          }
          onClick={() =>
            setMode(
              "articles",
            )
          }
        >
          📖 Articles du Wiki
        </button>

        <button
          className={
            mode === "commands"
              ? "selected"
              : ""
          }
          onClick={() =>
            setMode(
              "commands",
            )
          }
        >
          🐰 Commandes Discord
        </button>
      </div>

      {mode === "articles" ? (
        <WikiArticles
          snapshot={
            snapshot
          }
          articles={
            articles
          }
          query={query}
          setQuery={
            setQuery
          }
          onOpen={
            setSelectedArticle
          }
        />
      ) : (
        <CommandWiki />
      )}

      {selectedArticle && (
        <div
          className="wiki-article-reader-backdrop"
          onMouseDown={() =>
            setSelectedArticle(
              null,
            )
          }
        >
          <article
            className="wiki-article-reader"
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <button
              onClick={() =>
                setSelectedArticle(
                  null,
                )
              }
            >
              ×
            </button>

            <p className="info-eyebrow">
              {
                selectedArticle.category
              }
            </p>

            <h1>
              <TailBlueInline value={selectedArticle.title} />
            </h1>

            <small>
              {selectedArticle.author
                ? `Par ${selectedArticle.author}`
                : "Wiki TailBlue"}
            </small>

            <TailBlueMarkdown
              value={selectedArticle.body}
              className="wiki-article-body"
            />
          </article>
        </div>
      )}

      {isHime && (
        <InformationStudio
          open={
            studioOpen
          }
          initialTab="wiki"
          onClose={() =>
            setStudioOpen(
              false,
            )
          }
          onChanged={() =>
            void refresh()
          }
        />
      )}
    </section>
  );
}

function WikiArticles({
  snapshot,
  articles,
  query,
  setQuery,
  onOpen,
}: {
  snapshot: WikiSnapshot;
  articles: WikiArticle[];
  query: string;
  setQuery: (
    value: string,
  ) => void;
  onOpen: (
    article: WikiArticle,
  ) => void;
}) {
  return (
    <>
      <div className="wiki-search-final">
        <span>⌕</span>
        <input
          value={query}
          onChange={(
            event: ChangeEvent<HTMLInputElement>,
          ) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="Rechercher un guide, une catégorie, un tag…"
        />

        {query && (
          <button
            onClick={() =>
              setQuery("")
            }
          >
            Effacer
          </button>
        )}
      </div>

      {articles.length ? (
        <div className="wiki-article-grid">
          {articles.map(
            (article) => (
              <button
                key={
                  article.id
                }
                onClick={() =>
                  onOpen(
                    article,
                  )
                }
              >
                <div>
                  <p className="info-eyebrow">
                    {
                      article.category
                    }
                  </p>

                  <h2>
                    <TailBlueInline value={article.title} />
                  </h2>

                  <p>
                    <TailBlueInline
                      value={article.summary}
                    />
                  </p>
                </div>

                <footer>
                  <span>
                    {article.tags
                      .slice(
                        0,
                        3,
                      )
                      .map(
                        (tag) =>
                          `#${tag}`,
                      )
                      .join(
                        " ",
                      )}
                  </span>
                  <b>Lire →</b>
                </footer>
              </button>
            ),
          )}
        </div>
      ) : (
        <div className="info-empty-state">
          <span>📖</span>
          <h2>
            {snapshot.articles
              .length
              ? "Aucun résultat"
              : "Le Wiki éditorial arrive"}
          </h2>
          <p>
            Le guide des commandes
            reste disponible dans
            l'onglet Discord.
          </p>
        </div>
      )}
    </>
  );
}

function CommandWiki() {
  const [groupId, setGroupId] =
    useState(
      COMMAND_GROUPS[0]
        ?.id ?? "depart",
    );

  const [query, setQuery] =
    useState("");

  const [
    selectedId,
    setSelectedId,
  ] =
    useState(
      COMMAND_GROUPS[0]
        ?.commands[0]?.id ??
        "start",
    );

  const normalized =
    normalizeWikiSearchText(
      query,
    );

  const currentGroup =
    COMMAND_GROUPS.find(
      (group) =>
        group.id === groupId,
    ) ??
    COMMAND_GROUPS[0];

  const visible =
    useMemo(() => {
      if (!normalized) {
        return currentGroup.commands.map(
          (command) => ({
            ...command,
            groupTitle:
              currentGroup.title,
            groupIcon:
              currentGroup.icon,
          }),
        );
      }

      return ALL_COMMANDS.filter(
        (command) =>
          normalizeWikiSearchText(
            [
              command.command,
              command.title,
              command.summary,
              command.groupTitle,
            ].join(" "),
          ).includes(
            normalized,
          ),
      );
    }, [
      currentGroup,
      normalized,
    ]);

  const selected =
    visible.find(
      (command) =>
        command.id ===
        selectedId,
    ) ??
    visible[0] ??
    currentGroup.commands[0] ??
    null;

  function chooseGroup(
    nextId: string,
  ) {
    const group =
      COMMAND_GROUPS.find(
        (item) =>
          item.id === nextId,
      );

    if (!group) return;

    setGroupId(nextId);
    setQuery("");
    setSelectedId(
      group.commands[0]
        ?.id ?? "",
    );
  }

  return (
    <>
      <div className="wiki-search-final">
        <span>⌕</span>
        <input
          value={query}
          onChange={(event) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder={`Rechercher dans les ${COMMAND_COUNT} commandes…`}
        />
      </div>

      <div className="wiki-final-layout">
        <nav className="wiki-category-rail">
          <p>
            CATÉGORIES ·{" "}
            {GROUP_COUNT}
          </p>

          {COMMAND_GROUPS.map(
            (group) => (
              <button
                key={
                  group.id
                }
                className={
                  !normalized &&
                  group.id ===
                    currentGroup.id
                    ? "selected"
                    : ""
                }
                onClick={() =>
                  chooseGroup(
                    group.id,
                  )
                }
              >
                <span>
                  {
                    group.icon
                  }
                </span>
                <strong>
                  {
                    group.title
                  }
                </strong>
                <em>
                  {
                    group.commands
                      .length
                  }
                </em>
              </button>
            ),
          )}
        </nav>

        <main className="wiki-command-browser">
          <div className="wiki-command-list">
            {visible.map(
              (command) => (
                <button
                  key={`${command.groupTitle}-${command.id}`}
                  className={
                    selected?.id ===
                    command.id
                      ? "selected"
                      : ""
                  }
                  onClick={() =>
                    setSelectedId(
                      command.id,
                    )
                  }
                >
                  <span className="wiki-command-icon">
                    {
                      command.icon
                    }
                  </span>

                  <span className="wiki-command-copy">
                    <code>
                      {
                        command.command
                      }
                    </code>
                    <strong>
                      {
                        command.title
                      }
                    </strong>
                    <small>
                      {
                        command.summary
                      }
                    </small>
                  </span>

                  <span className="wiki-command-arrow">
                    ›
                  </span>
                </button>
              ),
            )}
          </div>
        </main>

        <aside className="wiki-detail-final">
          {selected ? (
            <CommandDetail
              command={
                selected
              }
            />
          ) : (
            <div className="wiki-empty-final">
              Sélectionne une
              commande.
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function CommandDetail({
  command,
}: {
  command: CommandGuide & {
    groupTitle?: string;
    groupIcon?: string;
  };
}) {
  return (
    <article className="wiki-detail-card-final">
      <header>
        <span>
          {command.icon}
        </span>

        <div>
          <p className="info-eyebrow">
            {command.groupIcon}{" "}
            {command.groupTitle ??
              "TAILBLUE"}
          </p>
          <h2>
            {command.title}
          </h2>
          <code>
            {command.command}
          </code>
        </div>
      </header>

      <section>
        <h3>
          À quoi ça sert ?
        </h3>
        <p>
          {command.details}
        </p>
      </section>

      <section>
        <h3>
          Syntaxe officielle
        </h3>
        {command.usage.map(
          (usage) => (
            <code key={usage}>
              {usage}
            </code>
          ),
        )}
      </section>

      <footer>
        ✅ Commande présente
        dans !helpme
      </footer>
    </article>
  );
}
