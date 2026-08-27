// TAILBLUE_IDEAS_HIME_V1A_20260827
// TAILBLUE_IDEAS_HIME_V1B_20260827
// TAILBLUE_IDEAS_HIME_POLISH_V1C_20260827

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  ReactNode,
} from "react";

import {
  ideasApi,
} from "../../api/ideasApi";

import type {
  HimeIdeaAction,
  HimeIdeasSnapshot,
  IdeaStatus,
  KingdomIdea,
} from "../../types/ideas";

const STATUS: Record<
  IdeaStatus,
  {
    icon: string;
    label: string;
  }
> = {
  proposee: {
    icon: "💡",
    label: "Proposée",
  },
  en_cours: {
    icon: "🔨",
    label: "En cours",
  },
  implementee: {
    icon: "✅",
    label: "Implémentée",
  },
  supprimee: {
    icon: "🗑️",
    label: "Supprimée",
  },
};

function ActionButton({
  disabled,
  className = "",
  title,
  children,
  onClick,
}: {
  disabled?: boolean;
  className?: string;
  title?: string;
  children:
    ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      disabled={
        Boolean(disabled)
      }
      className={
        className
      }
      title={title}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function HimeIdeasCanonicalPanel({
  refreshToken,
}: {
  refreshToken: number;
}) {
  const [
    snapshot,
    setSnapshot,
  ] = useState<
    HimeIdeasSnapshot | null
  >(null);

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState<
    IdeaStatus | "all"
  >("proposee");

  const [
    category,
    setCategory,
  ] = useState("all");

  const [
    busy,
    setBusy,
  ] = useState<
    string | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState("");

  async function load(
    quiet = false,
  ) {
    try {
      setSnapshot(
        await ideasApi.himeSnapshot(),
      );

      if (!quiet) {
        setMessage("");
      }
    } catch (cause) {
      if (!quiet) {
        setMessage(
          cause instanceof
            Error
            ? cause.message
            : "Impossible de charger le registre canonique.",
        );
      }
    }
  }

  useEffect(() => {
    void load();

    // Les !idees Discord apparaissent sans devoir recharger la page.
    const timer =
      window.setInterval(
        () =>
          void load(true),
        20_000,
      );

    const onFocus = () =>
      void load(true);

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
  }, [refreshToken]);

  const categories =
    useMemo(() => {
      const values =
        new Map<
          string,
          {
            id: string;
            label: string;
          }
        >();

      for (
        const idea of
        snapshot?.ideas ??
        []
      ) {
        values.set(
          idea.category.id,
          {
            id:
              idea.category.id,
            label:
              `${idea.category.emoji} ${idea.category.name}`,
          },
        );
      }

      return Array.from(
        values.values(),
      ).sort((a, b) =>
        a.label.localeCompare(
          b.label,
          "fr",
        ),
      );
    }, [snapshot]);

  const filtered =
    useMemo(() => {
      const needle = query
        .trim()
        .toLocaleLowerCase(
          "fr",
        );

      return (
        snapshot?.ideas ??
        []
      ).filter((idea) => {
        if (
          status !== "all" &&
          idea.status !==
            status
        ) {
          return false;
        }

        if (
          category !==
            "all" &&
          idea.category.id !==
            category
        ) {
          return false;
        }

        if (!needle) {
          return true;
        }

        return [
          idea.title,
          idea.description,
          idea.authorName,
          idea.category.name,
        ]
          .join(" ")
          .toLocaleLowerCase(
            "fr",
          )
          .includes(
            needle,
          );
      });
    }, [
      snapshot,
      query,
      status,
      category,
    ]);

  async function publication(
    idea: KingdomIdea,
    patch: {
      public?: boolean;
      pinned?: boolean;
    },
  ) {
    setBusy(
      idea.id,
    );

    setMessage("");

    try {
      setSnapshot(
        await ideasApi.setPublication(
          idea.id,
          patch,
        ),
      );

      setMessage(
        patch.pinned
          ? "👑 Coup de cœur royal mis à jour."
          : "✅ Publication communautaire mise à jour.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Modification impossible.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function action(
    idea: KingdomIdea,
    next:
      HimeIdeaAction,
  ) {
    if (
      next ===
        "delete" &&
      !window.confirm(
        `Supprimer « ${idea.title} » du registre actif ?`,
      )
    ) {
      return;
    }

    if (
      next ===
        "implemented" &&
      !window.confirm(
        `Valider « ${idea.title} » comme implémentée ?\n\nLes récompenses, le trophée et la lettre royale seront attribués immédiatement.`,
      )
    ) {
      return;
    }

    setBusy(
      idea.id,
    );

    setMessage("");

    try {
      setSnapshot(
        await ideasApi.himeAction(
          idea.id,
          next,
        ),
      );

      setMessage(
        next ===
          "in_progress"
          ? "🔨 Idée passée en cours. Le joueur est notifié."
          : next ===
              "implemented"
            ? "🏆 Idée implémentée : récompenses + lettre royale attribuées."
            : "🗑️ Idée supprimée du registre actif.",
      );
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Action impossible.",
      );
    } finally {
      setBusy(null);
    }
  }

  const proposed =
    snapshot?.ideas.filter(
      (idea) =>
        idea.status ===
        "proposee",
    ).length ?? 0;

  const publicCount =
    snapshot?.ideas.filter(
      (idea) =>
        idea.isPublic,
    ).length ?? 0;

  const inProgress =
    snapshot?.ideas.filter(
      (idea) =>
        idea.status ===
        "en_cours",
    ).length ?? 0;

  const implemented =
    snapshot?.ideas.filter(
      (idea) =>
        idea.status ===
        "implementee",
    ).length ?? 0;

  return (
    <>
      <div className="tb-hime-kpi-grid">
        <article className="tb-hime-kpi">
          <span>💡</span>
          <div>
            <small>
              À étudier
            </small>
            <strong>
              {proposed}
            </strong>
            <p>
              propositions
            </p>
          </div>
        </article>

        <article className="tb-hime-kpi">
          <span>🌍</span>
          <div>
            <small>
              Publiques
            </small>
            <strong>
              {publicCount}
            </strong>
            <p>
              Communauté
            </p>
          </div>
        </article>

        <article className="tb-hime-kpi">
          <span>🔨</span>
          <div>
            <small>
              En cours
            </small>
            <strong>
              {inProgress}
            </strong>
            <p>
              développement
            </p>
          </div>
        </article>

        <article className="tb-hime-kpi">
          <span>✅</span>
          <div>
            <small>
              Implémentées
            </small>
            <strong>
              {implemented}
            </strong>
            <p>
              Archives
            </p>
          </div>
        </article>
      </div>

      <div className="tb-hime-toolbar tb-hime-ideas-toolbar tb-hime-ideas-toolbar-v1b">
        <input
          value={query}
          onChange={(
            event,
          ) =>
            setQuery(
              event.target.value,
            )
          }
          placeholder="🔎 Rechercher une idée, un auteur, un mot-clé…"
        />

        <select
          value={category}
          onChange={(
            event,
          ) =>
            setCategory(
              event.target.value,
            )
          }
        >
          <option value="all">
            📚 Toutes les catégories
          </option>

          {categories.map(
            (item) => (
              <option
                key={
                  item.id
                }
                value={
                  item.id
                }
              >
                {
                  item.label
                }
              </option>
            ),
          )}
        </select>

        <select
          value={status}
          onChange={(
            event,
          ) =>
            setStatus(
              event.target.value as
                | IdeaStatus
                | "all",
            )
          }
        >
          <option value="all">
            📌 Tous les statuts
          </option>

          {(
            Object.entries(
              STATUS,
            ) as Array<
              [
                IdeaStatus,
                {
                  icon:
                    string;
                  label:
                    string;
                },
              ]
            >
          ).map(
            ([
              id,
              meta,
            ]) => (
              <option
                key={id}
                value={id}
              >
                {
                  meta.icon
                }{" "}
                {
                  meta.label
                }
              </option>
            ),
          )}
        </select>
      </div>

      {message && (
        <div className="tb-hime-message">
          {message}
        </div>
      )}

      <div className="tb-hime-ideas-grid tb-hime-ideas-grid-v1b">
        {filtered.map(
          (idea) => {
            const isBusy =
              busy ===
              idea.id;

            const deleted =
              idea.status ===
              "supprimee";

            const done =
              idea.status ===
              "implementee";

            const alreadyProgress =
              idea.status ===
              "en_cours";

            return (
              <article
                key={
                  idea.id
                }
                className={
                  `tb-hime-idea-card ` +
                  `${idea.isPublic ? "featured" : ""} ` +
                  `${idea.pinned ? "royal-spotlight" : ""}`
                }
              >
                <header>
                  <div>
                    <strong>
                      {
                        idea.authorName
                      }
                    </strong>

                    <small>
                      {
                        idea
                          .category
                          .emoji
                      }{" "}
                      {
                        idea
                          .category
                          .name
                      }
                    </small>
                  </div>

                  <div className="tb-hime-idea-flags">
                    {idea.pinned
                      ? "👑 "
                      : ""}

                    {idea.isPublic
                      ? "🌍"
                      : "🔒"}
                  </div>
                </header>

                <div className="tb-hime-badges">
                  <span>
                    {
                      STATUS[
                        idea.status
                      ]?.icon
                    }{" "}
                    {
                      STATUS[
                        idea.status
                      ]?.label
                    }
                  </span>

                  <span>
                    👍{" "}
                    {
                      idea.upvotes
                    }{" "}
                    • 👎{" "}
                    {
                      idea.downvotes
                    }{" "}
                    • score{" "}
                    {
                      idea.score
                    }
                  </span>
                </div>

                <h3>
                  {
                    idea.title
                  }
                </h3>

                <p>
                  {
                    idea.description
                  }
                </p>

                {done ? (
                  <footer className="tb-hime-idea-actions-v1b tb-hime-idea-actions-archived">
                    <span className="tb-hime-idea-archived-label">
                      ✅ Implémentée • conservée dans les Archives Royales
                    </span>
                  </footer>
                ) : (
                <footer className="tb-hime-idea-actions-v1b">
                  <ActionButton
                    disabled={
                      isBusy ||
                      deleted
                    }
                    className={
                      idea.isPublic
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      void publication(
                        idea,
                        {
                          public:
                            !idea.isPublic,
                        },
                      )
                    }
                  >
                    {idea.isPublic
                      ? "🌍 Retirer du public"
                      : "🔒 Rendre publique"}
                  </ActionButton>

                  <ActionButton
                    disabled={
                      isBusy ||
                      deleted
                    }
                    className={
                      idea.pinned
                        ? "active royal"
                        : "royal"
                    }
                    title="Le Coup de cœur royal apparaît en grand en haut de la Communauté."
                    onClick={() =>
                      void publication(
                        idea,
                        {
                          pinned:
                            !idea.pinned,
                        },
                      )
                    }
                  >
                    {idea.pinned
                      ? "👑 Retirer le Coup de cœur"
                      : "👑 Mettre en Coup de cœur"}
                  </ActionButton>

                  <ActionButton
                    disabled={
                      isBusy ||
                      deleted ||
                      done ||
                      alreadyProgress
                    }
                    title={
                      alreadyProgress
                        ? "Déjà en cours"
                        : done
                          ? "Déjà implémentée"
                          : "Passe l'idée en développement et notifie le joueur."
                    }
                    onClick={() =>
                      void action(
                        idea,
                        "in_progress",
                      )
                    }
                  >
                    🔨 En cours
                  </ActionButton>

                  <ActionButton
                    disabled={
                      isBusy ||
                      deleted ||
                      done
                    }
                    className="success-action"
                    title="Attribue les cookies, XP, trophée et crée la lettre royale."
                    onClick={() =>
                      void action(
                        idea,
                        "implemented",
                      )
                    }
                  >
                    ✅ Implémentée
                  </ActionButton>

                  <ActionButton
                    disabled={
                      isBusy ||
                      deleted ||
                      done
                    }
                    className="danger-action"
                    title={
                      done
                        ? "Une idée implémentée reste dans les Archives Royales."
                        : "Supprime l'idée du registre actif."
                    }
                    onClick={() =>
                      void action(
                        idea,
                        "delete",
                      )
                    }
                  >
                    🗑️ Supprimer
                  </ActionButton>
                </footer>
                )}
              </article>
            );
          },
        )}
      </div>

      {!filtered.length && (
        <div className="tb-hime-message">
          Aucune idée ne
          correspond à ces
          filtres.
        </div>
      )}
    </>
  );
}
