// TAILBLUE_IDEAS_DESKTOP_V1A_20260827
// TAILBLUE_IDEAS_DESKTOP_V1B_20260827
// TAILBLUE_IDEAS_POLISH_V1C_20260827

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getCachedIdeasSnapshot,
  ideasApi,
  ideasApiConfigured,
} from "../api/ideasApi";

import type {
  IdeaDraft,
  IdeaStatus,
  IdeasSnapshot,
  KingdomIdea,
} from "../types/ideas";

import "./IdeasPage.css";

type Tab =
  | "community"
  | "mine"
  | "archives";

type CommunitySort =
  | "popular"
  | "recent"
  | "in_progress"
  | "implemented";

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

function dateText(
  value?: string | null,
) {
  if (!value) return "—";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "fr-CH",
    {
      dateStyle: "medium",
    },
  ).format(date);
}

function fmt(value: number) {
  return new Intl.NumberFormat(
    "fr-CH",
  ).format(value);
}

function IdeaStatusPill({
  idea,
}: {
  idea: KingdomIdea;
}) {
  const meta =
    STATUS[idea.status] ??
    STATUS.proposee;

  return (
    <span
      className={
        `tb-idea-status ` +
        `status-${idea.status}`
      }
    >
      {meta.icon} {meta.label}
    </span>
  );
}

function VoteBox({
  idea,
  busy,
  onVote,
}: {
  idea: KingdomIdea;
  busy: boolean;
  onVote: (
    idea: KingdomIdea,
    vote: -1 | 0 | 1,
  ) => void;
}) {
  return (
    <div className="tb-idea-votes">
      <button
        className={
          idea.viewerVote === 1
            ? "active"
            : ""
        }
        disabled={busy}
        onClick={() =>
          onVote(
            idea,
            idea.viewerVote === 1
              ? 0
              : 1,
          )
        }
        title="J'aime cette idée"
      >
        ▲
      </button>

      <strong>
        {idea.score}
      </strong>

      <button
        className={
          idea.viewerVote === -1
            ? "active down"
            : ""
        }
        disabled={busy}
        onClick={() =>
          onVote(
            idea,
            idea.viewerVote === -1
              ? 0
              : -1,
          )
        }
        title="Cette idée me convainc moins"
      >
        ▼
      </button>
    </div>
  );
}

function CommunityCard({
  idea,
  busy,
  onVote,
}: {
  idea: KingdomIdea;
  busy: boolean;
  onVote: (
    idea: KingdomIdea,
    vote: -1 | 0 | 1,
  ) => void;
}) {
  return (
    <article className="tb-idea-community-card">
      <VoteBox
        idea={idea}
        busy={busy}
        onVote={onVote}
      />

      <div className="tb-idea-card-body">
        <header>
          <div className="tb-idea-card-meta">
            <IdeaStatusPill
              idea={idea}
            />

            <span>
              {idea.category.emoji}{" "}
              {idea.category.name}
            </span>
          </div>

          <small>
            {dateText(
              idea.createdAt,
            )}
          </small>
        </header>

        <h3>
          {idea.title}
        </h3>

        <p>
          {idea.description}
        </p>

        <footer>
          <span>
            💜 {idea.authorName}
          </span>

          <span>
            👍 {idea.upvotes}
          </span>

          <span>
            👎 {idea.downvotes}
          </span>
        </footer>
      </div>
    </article>
  );
}

function RoyalSpotlight({
  idea,
  busy,
  onVote,
}: {
  idea: KingdomIdea;
  busy: boolean;
  onVote: (
    idea: KingdomIdea,
    vote: -1 | 0 | 1,
  ) => void;
}) {
  return (
    <article className="tb-ideas-spotlight">
      <div className="tb-ideas-spotlight-crown">
        👑
      </div>

      <div className="tb-ideas-spotlight-content">
        <p className="tb-ideas-eyebrow">
          COUP DE CŒUR ROYAL
        </p>

        <div className="tb-idea-card-meta">
          <IdeaStatusPill
            idea={idea}
          />
          <span>
            {idea.category.emoji}{" "}
            {idea.category.name}
          </span>
        </div>

        <h2>
          {idea.title}
        </h2>

        <p>
          {idea.description}
        </p>

        <footer>
          <span>
            💜 {idea.authorName}
          </span>
          <span>
            Sélectionnée par Hime
          </span>
        </footer>
      </div>

      <VoteBox
        idea={idea}
        busy={busy}
        onVote={onVote}
      />
    </article>
  );
}

const EMPTY_DRAFT:
  IdeaDraft = {
    title: "",
    description: "",
    category: "autre",
    signature: "",
  };

function IdeaEditor({
  open,
  draft,
  categories,
  busy,
  editing,
  error,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  draft: IdeaDraft;
  categories:
    IdeasSnapshot["categories"];
  busy: boolean;
  editing:
    KingdomIdea | null;
  error: string | null;
  onChange: (
    next: IdeaDraft,
  ) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="tb-idea-modal-backdrop"
      onMouseDown={(
        event,
      ) => {
        if (
          event.currentTarget ===
          event.target
        ) {
          onClose();
        }
      }}
    >
      <section className="tb-idea-modal">
        <header>
          <div>
            <span className="tb-ideas-eyebrow">
              BUREAU DES IDÉES
            </span>

            <h2>
              {editing
                ? "Modifier ton idée"
                : "Proposer une idée"}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <label>
          <span>
            Titre
          </span>

          <input
            value={draft.title}
            maxLength={120}
            onChange={(
              event,
            ) =>
              onChange({
                ...draft,
                title:
                  event.target.value,
              })
            }
            placeholder="Ex. Ajouter un tournoi de guildes…"
          />
        </label>

        <label>
          <span>
            Catégorie
          </span>

          <select
            value={
              draft.category
            }
            onChange={(
              event,
            ) =>
              onChange({
                ...draft,
                category:
                  event.target.value,
              })
            }
          >
            {categories.map(
              (category) => (
                <option
                  key={
                    category.id
                  }
                  value={
                    category.id
                  }
                >
                  {
                    category.emoji
                  }{" "}
                  {
                    category.name
                  }
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          <span>
            Description
          </span>

          <textarea
            value={
              draft.description
            }
            maxLength={4000}
            rows={8}
            onChange={(
              event,
            ) =>
              onChange({
                ...draft,
                description:
                  event.target.value,
              })
            }
            placeholder="Explique ce que tu imagines et pourquoi ça serait cool dans TailBlue…"
          />
        </label>

        <label>
          <span>
            Signature facultative
          </span>

          <input
            value={
              draft.signature
            }
            maxLength={180}
            onChange={(
              event,
            ) =>
              onChange({
                ...draft,
                signature:
                  event.target.value,
              })
            }
            placeholder="Ex. Signé le bonbon 🍬"
          />
        </label>

        {error && (
          <div className="tb-idea-modal-error">
            ⚠️ {error}
          </div>
        )}

        <footer>
          <button
            className="tb-ideas-secondary"
            onClick={onClose}
            disabled={busy}
          >
            Annuler
          </button>

          <button
            className="tb-ideas-primary"
            onClick={onSubmit}
            disabled={
              busy ||
              draft.title
                .trim()
                .length < 3 ||
              draft.description
                .trim()
                .length < 10
            }
          >
            {busy
              ? "Envoi en cours…"
              : editing
                ? "Enregistrer"
                : "Envoyer au Royaume"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function ProgressLetterModal({
  idea,
  onClose,
}: {
  idea: KingdomIdea | null;
  onClose: () => void;
}) {
  if (!idea) {
    return null;
  }

  return (
    <div
      className="tb-idea-modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <article className="tb-progress-letter-modal">
        <header>
          <div>
            <p className="tb-ideas-eyebrow">
              COURRIER DU ROYAUME
            </p>
            <h2>🔨 Lettre de suivi royal</h2>
          </div>

          <button onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </header>

        <div className="tb-progress-letter-paper">
          <p>Cher aventurier {idea.authorName},</p>

          <p>
            J’ai une bonne nouvelle concernant ta proposition :
          </p>

          <h3>« {idea.title} »</h3>

          <p>
            Ton idée a retenu mon attention et elle est désormais
            <strong> en cours de développement</strong> dans TailBlue.
          </p>

          <p>
            Rien n’est encore gravé dans les Archives Royales.
            Cette lettre est créée uniquement lorsque tu l’ouvres :
            elle n’est ni sauvegardée ni archivée. La véritable Lettre
            Royale sera créée seulement si ton idée est officiellement
            implémentée.
          </p>

          <p className="tb-progress-letter-signature">
            Continue de rêver. 💜
            <br />
            — Hime-sama
          </p>
        </div>

        <div className="tb-progress-letter-meta">
          <span>🔨 En cours</span>
          <span>
            {idea.category.emoji} {idea.category.name}
          </span>
          <span>
            Depuis {dateText(idea.inProgressAt)}
          </span>
        </div>

        <footer>
          <button className="tb-ideas-primary" onClick={onClose}>
            Fermer la lettre
          </button>
        </footer>
      </article>
    </div>
  );
}


function RoyalLetterModal({
  idea,
  onClose,
}: {
  idea:
    KingdomIdea | null;
  onClose: () => void;
}) {
  if (
    !idea ||
    !idea.royalLetter
  ) {
    return null;
  }

  const letter =
    idea.royalLetter;

  return (
    <div
      className="tb-idea-modal-backdrop"
      onMouseDown={(
        event,
      ) => {
        if (
          event.currentTarget ===
          event.target
        ) {
          onClose();
        }
      }}
    >
      <article className="tb-royal-letter-modal">
        <header>
          <div>
            <p className="tb-ideas-eyebrow">
              ARCHIVES ROYALES
            </p>
            <h2>
              👑 Lettre Royale n°
              {letter.number}
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        <div className="tb-royal-letter-paper">
          <p className="tb-royal-letter-full-text">
            {letter.fullText ??
              `Cher aventurier ${idea.authorName},\n\n« ${idea.title} » fait désormais officiellement partie du Royaume de TailBlue.\n\n${letter.closing}\n\n— Hime-sama 💜`}
          </p>
        </div>

        <div className="tb-royal-letter-details">
          <span>
            📅{" "}
            {dateText(
              idea.implementedAt ??
                letter.createdAt,
            )}
          </span>

          <span>
            {(
              letter.domain ??
              idea.category
            ).emoji}{" "}
            {(
              letter.domain ??
              idea.category
            ).name}
          </span>

          <span>
            🍪 +
            {fmt(
              idea.rewards.cookies,
            )}
          </span>

          <span>
            ✨ +
            {fmt(
              idea.rewards.xp,
            )}{" "}
            XP
          </span>
        </div>

        {idea.trophyItemName && (
          <div className="tb-royal-trophy-line">
            🏆{" "}
            {idea.trophyItemName}
          </div>
        )}

        <footer>
          <button
            className="tb-ideas-primary"
            onClick={onClose}
          >
            Fermer la lettre
          </button>
        </footer>
      </article>
    </div>
  );
}

export default function IdeasPage() {
  const initialCacheRef =
    useRef<
      IdeasSnapshot | null
    >(
      getCachedIdeasSnapshot(),
    );

  const [snapshot, setSnapshot] =
    useState<
      IdeasSnapshot | null
    >(
      () =>
        initialCacheRef.current,
    );

  const snapshotRef =
    useRef<
      IdeasSnapshot | null
    >(
      initialCacheRef.current,
    );

  const [
    loading,
    setLoading,
  ] = useState(
    () =>
      ideasApiConfigured &&
      initialCacheRef.current ===
        null,
  );

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    busyId,
    setBusyId,
  ] = useState<
    string | null
  >(null);

  const [
    error,
    setError,
  ] = useState<
    string | null
  >(null);

  const [
    message,
    setMessage,
  ] = useState<
    string | null
  >(null);

  const [
    editorError,
    setEditorError,
  ] = useState<
    string | null
  >(null);

  const [
    tab,
    setTab,
  ] = useState<Tab>(
    "community",
  );

  const [
    sort,
    setSort,
  ] =
    useState<CommunitySort>(
      "popular",
    );

  const [
    query,
    setQuery,
  ] = useState("");

  const [
    editorOpen,
    setEditorOpen,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<
    KingdomIdea | null
  >(null);

  const [
    draft,
    setDraft,
  ] = useState<IdeaDraft>(
    EMPTY_DRAFT,
  );

  const [
    letterIdea,
    setLetterIdea,
  ] = useState<
    KingdomIdea | null
  >(null);

  const [
    progressLetterIdea,
    setProgressLetterIdea,
  ] = useState<
    KingdomIdea | null
  >(null);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const ideaId =
      window.sessionStorage.getItem(
        "tailblue.ideas.open-progress-letter",
      );

    if (!ideaId) {
      return;
    }

    const idea =
      snapshot.myIdeas.find(
        (item) =>
          item.id === ideaId &&
          item.status === "en_cours",
      );

    if (!idea) {
      return;
    }

    window.sessionStorage.removeItem(
      "tailblue.ideas.open-progress-letter",
    );

    setTab("mine");
    setProgressLetterIdea(idea);
  }, [snapshot]);


  const adoptSnapshot =
    useCallback(
      (
        next:
          IdeasSnapshot,
      ) => {
        snapshotRef.current =
          next;
        setSnapshot(next);
      },
      [],
    );

  const refresh =
    useCallback(
      async (
        quiet = false,
      ) => {
        if (
          !ideasApiConfigured
        ) {
          setLoading(false);
          return;
        }

        const hasReal =
          snapshotRef.current !==
          null;

        if (
          !quiet &&
          hasReal
        ) {
          setRefreshing(true);
        } else if (!hasReal) {
          setLoading(true);
        }

        try {
          const next =
            await ideasApi.snapshot();

          adoptSnapshot(next);
          setError(null);
        } catch (cause) {
          if (
            !quiet ||
            !hasReal
          ) {
            setError(
              cause instanceof
                Error
                ? cause.message
                : "Impossible de charger le Bureau des Idées.",
            );
          }
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [adoptSnapshot],
    );

  useEffect(() => {
    void refresh(
      initialCacheRef.current !==
        null,
    );

    // Synchronise aussi les idées proposées depuis Discord.
    const timer =
      window.setInterval(
        () =>
          void refresh(
            true,
          ),
        20_000,
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

  const spotlight =
    useMemo(
      () =>
        snapshot?.community.find(
          (idea) =>
            idea.pinned,
        ) ?? null,
      [snapshot],
    );

  const filteredCommunity =
    useMemo(() => {
      if (!snapshot) {
        return [];
      }

      const needle = query
        .trim()
        .toLocaleLowerCase(
          "fr",
        );

      let result =
        snapshot.community.filter(
          (idea) => {
            if (
              idea.pinned
            ) {
              return false;
            }

            if (
              sort ===
                "in_progress" &&
              idea.status !==
                "en_cours"
            ) {
              return false;
            }

            if (
              sort ===
                "implemented" &&
              idea.status !==
                "implementee"
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
          },
        );

      result =
        [...result].sort(
          (a, b) => {
            if (
              sort ===
              "recent"
            ) {
              return String(
                b.createdAt ??
                  "",
              ).localeCompare(
                String(
                  a.createdAt ??
                    "",
                ),
              );
            }

            return (
              b.score -
                a.score ||
              String(
                b.createdAt ??
                  "",
              ).localeCompare(
                String(
                  a.createdAt ??
                    "",
                ),
              )
            );
          },
        );

      return result;
    }, [
      snapshot,
      query,
      sort,
    ]);

  const openCreate = () => {
    setEditing(null);
    setEditorError(null);

    setDraft({
      ...EMPTY_DRAFT,
      category:
        snapshot
          ?.categories[0]
          ?.id ??
        "autre",
    });

    setEditorOpen(true);
  };

  const openEdit = (
    idea: KingdomIdea,
  ) => {
    setEditing(idea);
    setEditorError(null);

    setDraft({
      title: idea.title,
      description:
        idea.description,
      category:
        idea.category.id,
      signature:
        idea.signature,
    });

    setEditorOpen(true);
  };

  const saveEditor =
    async () => {
      setMessage(null);
      setError(null);
      setEditorError(null);

      setBusyId(
        editing?.id ??
          "create",
      );

      try {
        const next =
          editing
            ? await ideasApi.edit(
                editing.id,
                draft,
              )
            : await ideasApi.submit(
                draft,
              );

        adoptSnapshot(
          next,
        );

        setEditorOpen(
          false,
        );

        setEditing(null);

        setMessage(
          editing
            ? "✅ Idée mise à jour."
            : "💡 Idée envoyée ! Aucun cooldown : elle est maintenant visible dans ShowIdées.",
        );

        if (!editing) {
          setTab("mine");
        }
      } catch (cause) {
        const text =
          cause instanceof
            Error
            ? cause.message
            : "Enregistrement impossible.";

        // Important : l'erreur est DANS la fenêtre, pas cachée derrière.
        setEditorError(
          text,
        );
      } finally {
        setBusyId(null);
      }
    };

  const vote =
    async (
      idea: KingdomIdea,
      value:
        -1 | 0 | 1,
    ) => {
      setBusyId(
        idea.id,
      );
      setError(null);

      try {
        adoptSnapshot(
          await ideasApi.vote(
            idea.id,
            value,
          ),
        );
      } catch (cause) {
        setError(
          cause instanceof
            Error
            ? cause.message
            : "Vote impossible.",
        );
      } finally {
        setBusyId(null);
      }
    };

  const remove =
    async (
      idea: KingdomIdea,
    ) => {
      if (
        !window.confirm(
          `Supprimer « ${idea.title} » ?`,
        )
      ) {
        return;
      }

      setBusyId(
        idea.id,
      );

      setError(null);

      try {
        adoptSnapshot(
          await ideasApi.remove(
            idea.id,
          ),
        );

        setMessage(
          "🗑️ Idée supprimée.",
        );
      } catch (cause) {
        setError(
          cause instanceof
            Error
            ? cause.message
            : "Suppression impossible.",
        );
      } finally {
        setBusyId(null);
      }
    };

  if (
    !ideasApiConfigured
  ) {
    return (
      <section className="tb-ideas-state">
        <span>🔌</span>

        <h2>
          Connexion TailBlue
          requise
        </h2>

        <p>
          Le Bureau des
          Idées n’utilise
          aucune donnée
          fictive.
        </p>
      </section>
    );
  }

  if (
    loading &&
    !snapshot
  ) {
    return (
      <section className="tb-ideas-state">
        <span>
          💡
        </span>

        <h2>
          Ouverture des
          registres…
        </h2>

        <p>
          Lecture des vraies
          idées du Royaume.
        </p>
      </section>
    );
  }

  if (!snapshot) {
    return (
      <section className="tb-ideas-state error">
        <span>⚠️</span>

        <h2>
          Bureau
          indisponible
        </h2>

        <p>
          {error ??
            "Aucune donnée réelle disponible."}
        </p>

        <button
          onClick={() =>
            void refresh(
              false,
            )
          }
        >
          Réessayer
        </button>
      </section>
    );
  }

  return (
    <>
      <section className="tb-ideas-page">
        <header className="tb-ideas-header">
          <div>
            <p className="tb-ideas-eyebrow">
              INFORMATIONS •
              COMMUNAUTÉ
            </p>

            <h1>
              💡 Idées du
              Royaume
            </h1>

            <p>
              Propose, suis
              et découvre les
              idées qui font
              évoluer
              TailBlue.
              Seules les idées
              rendues
              publiques par
              Hime
              apparaissent
              dans la
              Communauté.
            </p>
          </div>

          <div className="tb-ideas-header-actions">
            <button
              className="tb-ideas-refresh"
              onClick={() =>
                void refresh(
                  false,
                )
              }
              disabled={
                refreshing
              }
            >
              {refreshing
                ? "↻ Synchro…"
                : "↻ Actualiser"}
            </button>

            <button
              className="tb-ideas-primary"
              onClick={
                openCreate
              }
            >
              + Proposer une
              idée
            </button>
          </div>
        </header>

        {error && (
          <div className="tb-ideas-soft-error">
            ⚠️ {error}
          </div>
        )}

        {message && (
          <div className="tb-ideas-message">
            {message}
          </div>
        )}

        <nav className="tb-ideas-tabs">
          <button
            className={
              tab ===
              "community"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab(
                "community",
              )
            }
          >
            🌍 Communauté

            <small>
              {
                snapshot
                  .community
                  .length
              }
            </small>
          </button>

          <button
            className={
              tab === "mine"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab("mine")
            }
          >
            📝 Mes idées

            <small>
              {
                snapshot
                  .myIdeas
                  .length
              }
            </small>
          </button>

          <button
            className={
              tab ===
              "archives"
                ? "active"
                : ""
            }
            onClick={() =>
              setTab(
                "archives",
              )
            }
          >
            🏆 Archives
            Royales

            <small>
              {
                snapshot
                  .archives
                  .length
              }
            </small>
          </button>
        </nav>

        {tab ===
          "community" && (
          <div className="tb-ideas-community">
            {spotlight && (
              <RoyalSpotlight
                idea={
                  spotlight
                }
                busy={
                  busyId ===
                  spotlight.id
                }
                onVote={
                  vote
                }
              />
            )}

            <div className="tb-ideas-toolbar">
              <input
                value={query}
                onChange={(
                  event,
                ) =>
                  setQuery(
                    event
                      .target
                      .value,
                  )
                }
                placeholder="Rechercher une idée…"
              />

              <select
                value={sort}
                onChange={(
                  event,
                ) =>
                  setSort(
                    event
                      .target
                      .value as CommunitySort,
                  )
                }
              >
                <option value="popular">
                  🔥 Populaires
                </option>

                <option value="recent">
                  🕒 Récentes
                </option>

                <option value="in_progress">
                  🔨 En cours
                </option>

                <option value="implemented">
                  ✅ Implémentées
                </option>
              </select>
            </div>

            <div className="tb-ideas-community-list">
              {filteredCommunity.map(
                (idea) => (
                  <CommunityCard
                    key={
                      idea.id
                    }
                    idea={
                      idea
                    }
                    busy={
                      busyId ===
                      idea.id
                    }
                    onVote={
                      vote
                    }
                  />
                ),
              )}

              {!filteredCommunity.length &&
                !spotlight && (
                  <div className="tb-ideas-empty">
                    <span>
                      🌱
                    </span>

                    <h3>
                      Aucune
                      idée
                      publique
                      ici
                    </h3>

                    <p>
                      Hime
                      publiera
                      les
                      propositions
                      qu’elle
                      souhaite
                      partager
                      avec le
                      Royaume.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {tab ===
          "mine" && (
          <div className="tb-ideas-own-grid">
            {snapshot.myIdeas.map(
              (idea) => (
                <article
                  className="tb-ideas-own-card"
                  key={
                    idea.id
                  }
                >
                  <header>
                    <IdeaStatusPill
                      idea={
                        idea
                      }
                    />

                    <span>
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
                    </span>
                  </header>

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

                  {idea.signature && (
                    <blockquote>
                      {
                        idea.signature
                      }
                    </blockquote>
                  )}

                  <div className="tb-ideas-own-dates">
                    <span>
                      Proposée{" "}
                      {dateText(
                        idea.createdAt,
                      )}
                    </span>

                    {idea.isPublic && (
                      <span>
                        🌍
                        Publique
                      </span>
                    )}
                  </div>

                  {(idea.canEdit ||
                    idea.canDelete) && (
                    <footer>
                      {idea.canEdit && (
                        <button
                          onClick={() =>
                            openEdit(
                              idea,
                            )
                          }
                          disabled={
                            busyId ===
                            idea.id
                          }
                        >
                          ✏️
                          Modifier
                        </button>
                      )}

                      {idea.canDelete && (
                        <button
                          className="danger"
                          onClick={() =>
                            void remove(
                              idea,
                            )
                          }
                          disabled={
                            busyId ===
                            idea.id
                          }
                        >
                          🗑️
                          Supprimer
                        </button>
                      )}
                    </footer>
                  )}
                </article>
              ),
            )}

            {!snapshot
              .myIdeas
              .length && (
              <div className="tb-ideas-empty span-all">
                <span>
                  💭
                </span>

                <h3>
                  Ton registre
                  est vide
                </h3>

                <p>
                  La prochaine
                  grande idée
                  du Royaume
                  est peut-être
                  la tienne.
                </p>

                <button
                  className="tb-ideas-primary"
                  onClick={
                    openCreate
                  }
                >
                  Proposer une
                  idée
                </button>
              </div>
            )}
          </div>
        )}

        {tab ===
          "archives" && (
          <div className="tb-ideas-archives">
            {snapshot.archives.map(
              (idea) => (
                <article
                  className="tb-royal-letter"
                  key={
                    idea.id
                  }
                >
                  <div className="tb-royal-seal">
                    👑
                  </div>

                  <p className="tb-ideas-eyebrow">
                    ARCHIVES
                    ROYALES •
                    CONTRIBUTION
                    #
                    {idea
                      .royalLetter
                      ?.number ??
                      idea
                        .rewards
                        .implementationNumber ??
                      1}
                  </p>

                  <h2>
                    {
                      idea.title
                    }
                  </h2>

                  <p className="tb-royal-copy">
                    Cette idée
                    a quitté le
                    registre
                    des rêves
                    pour
                    devenir une
                    partie
                    réelle de
                    TailBlue.
                  </p>

                  <div className="tb-royal-rewards">
                    <span>
                      🍪 +
                      {fmt(
                        idea
                          .rewards
                          .cookies,
                      )}
                    </span>

                    <span>
                      ✨ +
                      {fmt(
                        idea
                          .rewards
                          .xp,
                      )}{" "}
                      XP
                    </span>

                    {idea.trophyItemName && (
                      <span>
                        🏆{" "}
                        {
                          idea
                            .trophyItemName
                        }
                      </span>
                    )}
                  </div>

                  {idea
                    .royalLetter
                    ?.closing && (
                    <blockquote>
                      {
                        idea
                          .royalLetter
                          .closing
                      }
                    </blockquote>
                  )}

                  <div className="tb-royal-letter-actions">
                    {idea.royalLetter && (
                      <button
                        className="tb-royal-open-letter"
                        onClick={() =>
                          setLetterIdea(
                            idea,
                          )
                        }
                      >
                        📜 Lire la
                        lettre
                        royale
                        complète
                      </button>
                    )}
                  </div>

                  <footer>
                    Implémentée
                    le{" "}
                    {dateText(
                      idea.implementedAt ??
                        idea
                          .royalLetter
                          ?.createdAt,
                    )}
                  </footer>
                </article>
              ),
            )}

            {!snapshot
              .archives
              .length && (
              <div className="tb-ideas-empty">
                <span>
                  🏛️
                </span>

                <h3>
                  Les Archives
                  attendent
                </h3>

                <p>
                  Les idées
                  implémentées
                  apparaîtront
                  ici avec
                  leur trophée
                  et leur
                  lettre
                  royale.
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      <IdeaEditor
        open={
          editorOpen
        }
        draft={
          draft
        }
        categories={
          snapshot.categories
        }
        busy={
          busyId !== null
        }
        editing={
          editing
        }
        error={
          editorError
        }
        onChange={
          setDraft
        }
        onClose={() => {
          if (busyId) {
            return;
          }

          setEditorOpen(
            false,
          );

          setEditing(
            null,
          );

          setEditorError(
            null,
          );
        }}
        onSubmit={() =>
          void saveEditor()
        }
      />

      <ProgressLetterModal
        idea={
          progressLetterIdea
        }
        onClose={() =>
          setProgressLetterIdea(
            null,
          )
        }
      />

      <RoyalLetterModal
        idea={
          letterIdea
        }
        onClose={() =>
          setLetterIdea(
            null,
          )
        }
      />
    </>
  );
}
