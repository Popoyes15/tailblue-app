// TAILBLUE_SOCIAL_DESKTOP_V1A_20260827

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  getCachedSocialSnapshot,
  socialApi,
} from "../api/socialApi";

import type {
  SocialConversation,
  SocialFriend,
  SocialSearchResult,
  SocialSnapshot,
} from "../types/social";

import "./social.css";

// TAILBLUE_REFERRAL_SHARE_V1_20260827
const TAILBLUE_WEBSITE_URL = String(
  import.meta.env.VITE_TAILBLUE_WEBSITE_URL ?? "",
)
  .trim()
  .replace(/\/+$/, "");

function buildReferralLink(
  code: string,
): string {
  if (!TAILBLUE_WEBSITE_URL) {
    return "";
  }

  return (
    `${TAILBLUE_WEBSITE_URL}` +
    `?ref=${encodeURIComponent(code)}`
  );
}

function buildReferralMessage(
  code: string,
): string {
  const link =
    buildReferralLink(code);

  const lines = [
    "💜 Rejoins-moi dans le Royaume de TailBlue !",
    "",
    `🎟️ Mon code de parrainage : ${code}`,
  ];

  if (link) {
    lines.push(
      "",
      `🌐 Découvre TailBlue ici : ${link}`,
      "",
      "Entre mon code en créant ton aventure pour rejoindre mon réseau de parrainage. :3",
    );
  } else {
    lines.push(
      "",
      "🌐 Le site TailBlue arrive bientôt !",
      "",
      "Garde mon code pour rejoindre mon réseau de parrainage. :3",
    );
  }

  return lines.join("\n");
}

export type SocialTab =
  | "friends"
  | "messages"
  | "referral";

function tabFromPage(
  page: string,
): SocialTab {
  if (page === "Messages") {
    return "messages";
  }

  if (page === "Parrainage") {
    return "referral";
  }

  return "friends";
}

function relativeTime(
  value?: string | null,
) {
  if (!value) return "—";

  const timestamp =
    new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return "—";
  }

  const minutes =
    Math.max(
      0,
      Math.floor(
        (Date.now() - timestamp) /
          60_000,
      ),
    );

  if (minutes < 1) {
    return "À l'instant";
  }

  if (minutes < 60) {
    return `Il y a ${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `Il y a ${hours} h`;
  }

  return `Il y a ${Math.floor(hours / 24)} j`;
}

function Avatar({
  person,
  size = "normal",
}: {
  person: {
    name: string;
    avatarUrl?: string | null;
  };
  size?: "normal" | "small" | "large";
}) {
  return person.avatarUrl ? (
    <img
      className={`tb-social-avatar size-${size}`}
      src={person.avatarUrl}
      alt={person.name}
    />
  ) : (
    <span
      className={`tb-social-avatar tb-social-avatar-fallback size-${size}`}
    >
      {person.name
        .slice(0, 1)
        .toUpperCase()}
    </span>
  );
}

function PresenceDot({
  status,
}: {
  status: "online" | "offline";
}) {
  return (
    <span
      className={`tb-social-presence ${status}`}
      title={
        status === "online"
          ? "En ligne sur TailBlue"
          : "Hors ligne"
      }
    />
  );
}

export default function SocialPage({
  activePage,
}: {
  activePage: string;
}) {
  const [tab, setTab] =
    useState<SocialTab>(
      tabFromPage(activePage),
    );

  const [snapshot, setSnapshot] =
    useState<SocialSnapshot | null>(
      () =>
        getCachedSocialSnapshot(),
    );

  const [loading, setLoading] =
    useState(!snapshot);

  const [error, setError] =
    useState<string | null>(null);

  const [busy, setBusy] =
    useState<string | null>(null);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [
    searchResults,
    setSearchResults,
  ] = useState<SocialSearchResult[]>(
    [],
  );

  const [
    searching,
    setSearching,
  ] = useState(false);

  const [
    selectedFriendId,
    setSelectedFriendId,
  ] = useState<string | null>(
    null,
  );

  const [
    conversation,
    setConversation,
  ] = useState<SocialConversation | null>(
    null,
  );

  const [messageBody, setMessageBody] =
    useState("");

  const [referralCode, setReferralCode] =
    useState("");

  const [
    referralCopied,
    setReferralCopied,
  ] = useState(false);

  const referralCopyTimerRef =
    useRef<number | null>(
      null,
    );

  const chatEndRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  useEffect(() => {
    setTab(
      tabFromPage(activePage),
    );
  }, [activePage]);

  const refresh =
    useCallback(
      async (
        quiet = false,
      ) => {
        if (!quiet) {
          setLoading(true);
        }

        try {
          const value =
            await socialApi.snapshot();

          setSnapshot(value);
          setError(null);

          if (
            !selectedFriendId &&
            value.conversations.length
          ) {
            setSelectedFriendId(
              value.conversations[0]
                .friend.id,
            );
          }
        } catch (cause) {
          if (!snapshot) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Impossible de charger le Social TailBlue.",
            );
          }
        } finally {
          if (!quiet) {
            setLoading(false);
          }
        }
      },
      [
        selectedFriendId,
        snapshot,
      ],
    );

  useEffect(() => {
    void refresh();

    const interval =
      window.setInterval(
        () => void refresh(true),
        15_000,
      );

    const onFocus = () =>
      void refresh(true);

    window.addEventListener(
      "focus",
      onFocus,
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        "focus",
        onFocus,
      );
    };
  }, [refresh]);

  useEffect(() => {
    const beat = () => {
      void socialApi
        .heartbeat()
        .catch(() => undefined);
    };

    beat();

    const interval =
      window.setInterval(
        beat,
        60_000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, []);

  useEffect(() => {
    if (
      tab !== "messages" ||
      !selectedFriendId
    ) {
      return;
    }

    let cancelled = false;

    const loadConversation =
      async () => {
        try {
          const value =
            await socialApi.conversation(
              selectedFriendId,
            );

          if (!cancelled) {
            setConversation(value);
            setError(null);
          }
        } catch (cause) {
          if (!cancelled) {
            setError(
              cause instanceof Error
                ? cause.message
                : "Impossible d'ouvrir cette conversation.",
            );
          }
        }
      };

    void loadConversation();

    const interval =
      window.setInterval(
        () =>
          void loadConversation(),
        10_000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    selectedFriendId,
    tab,
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      },
    );
  }, [conversation?.messages.length]);

  useEffect(
    () => () => {
      if (
        referralCopyTimerRef.current !==
        null
      ) {
        window.clearTimeout(
          referralCopyTimerRef.current,
        );
      }
    },
    [],
  );

  const friends =
    snapshot?.friends ?? [];

  const pinnedFriends =
    useMemo(
      () =>
        friends.filter(
          (friend) =>
            friend.pinned,
        ),
      [friends],
    );

  async function mutate(
    key: string,
    task: () => Promise<SocialSnapshot>,
  ) {
    setBusy(key);
    setError(null);

    try {
      const value =
        await task();

      setSnapshot(value);
      return value;
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Action Social impossible.",
      );
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function runSearch() {
    const query =
      searchQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      setError(
        "Écris au moins 2 caractères.",
      );
      return;
    }

    setSearching(true);
    setError(null);

    try {
      setSearchResults(
        await socialApi.search(
          query,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Recherche impossible.",
      );
    } finally {
      setSearching(false);
    }
  }

  async function sendMessage() {
    if (
      !selectedFriendId ||
      !messageBody.trim()
    ) {
      return;
    }

    setBusy("message");
    setError(null);

    try {
      const value =
        await socialApi.sendMessage(
          selectedFriendId,
          messageBody,
        );

      setConversation(value);
      setMessageBody("");
      await refresh(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Message impossible à envoyer.",
      );
    } finally {
      setBusy(null);
    }
  }

  function openMessages(
    friend: SocialFriend,
  ) {
    setSelectedFriendId(
      friend.id,
    );
    setTab("messages");
  }

  if (
    loading &&
    !snapshot
  ) {
    return (
      <main className="tb-social-page">
        <div className="tb-social-loading">
          <span>💜</span>
          <h2>
            Ouverture du cercle social…
          </h2>
        </div>
      </main>
    );
  }

  return (
    <main className="tb-social-page">
      <header className="tb-social-hero">
        <div>
          <p className="tb-social-eyebrow">
            ROYAUME SOCIAL
          </p>

          <h1>
            💜 Social TailBlue
          </h1>

          <p>
            Tes amis, tes messages et ton
            réseau de parrainage réunis dans
            TailBlue.
          </p>
        </div>

        <div className="tb-social-hero-stats">
          <span>
            <b>
              {friends.length}
            </b>
            amis
          </span>

          <span>
            <b>
              {
                snapshot?.conversations.reduce(
                  (
                    total,
                    item,
                  ) =>
                    total +
                    item.unread,
                  0,
                ) ?? 0
              }
            </b>
            non lus
          </span>

          <span>
            <b>
              {
                snapshot?.referral
                  .activeCount ?? 0
              }
            </b>
            filleuls actifs
          </span>
        </div>
      </header>

      <nav className="tb-social-tabs">
        <button
          className={
            tab === "friends"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("friends")
          }
        >
          👥 Amis
          {!!snapshot?.incomingRequests
            .length && (
            <b>
              {
                snapshot
                  .incomingRequests
                  .length
              }
            </b>
          )}
        </button>

        <button
          className={
            tab === "messages"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("messages")
          }
        >
          💬 Messages
        </button>

        <button
          className={
            tab === "referral"
              ? "active"
              : ""
          }
          onClick={() =>
            setTab("referral")
          }
        >
          🎟️ Parrainage
        </button>
      </nav>

      {error && (
        <div className="tb-social-error">
          ⚠️ {error}
        </div>
      )}

      {tab === "friends" && (
        <section className="tb-social-section">
          <div className="tb-social-section-heading">
            <div>
              <p className="tb-social-eyebrow">
                TON CERCLE
              </p>
              <h2>Mes amis</h2>
              <p>
                Seules les relations acceptées
                apparaissent ici.
              </p>
            </div>

            <button
              className="tb-social-primary"
              onClick={() =>
                setSearchOpen(
                  (value) =>
                    !value,
                )
              }
            >
              ➕ Ajouter un ami
            </button>
          </div>

          {searchOpen && (
            <div className="tb-social-add-panel">
              <div>
                <strong>
                  Ajouter un aventurier
                </strong>
                <p>
                  La recherche affiche uniquement
                  les personnes ayant déjà un
                  profil TailBlue et présentes sur
                  le serveur officiel.
                </p>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  void runSearch();
                }}
              >
                <input
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Nom ou pseudo Discord…"
                />

                <button
                  type="submit"
                  disabled={searching}
                >
                  {searching
                    ? "Recherche…"
                    : "🔎 Rechercher"}
                </button>
              </form>

              {!!searchResults.length && (
                <div className="tb-social-search-results">
                  {searchResults.map(
                    (person) => (
                      <article
                        key={person.id}
                      >
                        <div className="tb-social-person">
                          <div className="tb-social-avatar-wrap">
                            <Avatar
                              person={
                                person
                              }
                            />
                            <PresenceDot
                              status={
                                person
                                  .presence
                                  .status
                              }
                            />
                          </div>

                          <div>
                            <strong>
                              {
                                person.name
                              }
                            </strong>
                            <small>
                              Profil TailBlue •
                              serveur officiel
                            </small>
                          </div>
                        </div>

                        {person.relationshipState ===
                        "friend" ? (
                          <span className="tb-social-state good">
                            ✓ Déjà ami
                          </span>
                        ) : person.relationshipState ===
                          "outgoing" ? (
                          <span className="tb-social-state">
                            ⏳ Demande envoyée
                          </span>
                        ) : person.relationshipState ===
                          "incoming" ? (
                          <span className="tb-social-state">
                            💌 Demande reçue
                          </span>
                        ) : (
                          <button
                            disabled={
                              busy ===
                              `add-${person.id}`
                            }
                            onClick={() =>
                              void mutate(
                                `add-${person.id}`,
                                () =>
                                  socialApi.requestFriend(
                                    person.id,
                                  ),
                              ).then(
                                (value) => {
                                  if (
                                    value
                                  ) {
                                    void runSearch();
                                  }
                                },
                              )
                            }
                          >
                            Ajouter
                          </button>
                        )}
                      </article>
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          {!!snapshot?.incomingRequests
            .length && (
            <div className="tb-social-request-block">
              <h3>
                💌 Demandes reçues
              </h3>

              {snapshot.incomingRequests.map(
                (request) => (
                  <article
                    key={request.id}
                  >
                    <div className="tb-social-person">
                      <Avatar
                        person={
                          request.from
                        }
                      />

                      <div>
                        <strong>
                          {
                            request.from
                              .name
                          }
                        </strong>
                        <small>
                          {
                            relativeTime(
                              request.createdAt,
                            )
                          }
                        </small>
                      </div>
                    </div>

                    <div className="tb-social-request-actions">
                      <button
                        className="accept"
                        onClick={() =>
                          void mutate(
                            `accept-${request.id}`,
                            () =>
                              socialApi.respondFriend(
                                request.id,
                                "accept",
                              ),
                          )
                        }
                      >
                        ✓ Accepter
                      </button>

                      <button
                        onClick={() =>
                          void mutate(
                            `decline-${request.id}`,
                            () =>
                              socialApi.respondFriend(
                                request.id,
                                "decline",
                              ),
                          )
                        }
                      >
                        Refuser
                      </button>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}

          {!!pinnedFriends.length && (
            <div className="tb-social-subsection">
              <h3>📌 Épinglés</h3>

              <div className="tb-social-friend-grid">
                {pinnedFriends.map(
                  (friend) => (
                    <FriendCard
                      key={
                        friend.id
                      }
                      friend={
                        friend
                      }
                      busy={busy}
                      onMessage={
                        openMessages
                      }
                      onPin={() =>
                        void mutate(
                          `pin-${friend.id}`,
                          () =>
                            socialApi.pinFriend(
                              friend.id,
                              false,
                            ),
                        )
                      }
                      onRemove={() => {
                        if (
                          window.confirm(
                            `Retirer ${friend.name} de tes amis TailBlue ?`,
                          )
                        ) {
                          void mutate(
                            `remove-${friend.id}`,
                            () =>
                              socialApi.removeFriend(
                                friend.id,
                              ),
                          );
                        }
                      }}
                    />
                  ),
                )}
              </div>
            </div>
          )}

          <div className="tb-social-subsection">
            <h3>
              👥 Tous mes amis
            </h3>

            {friends.length ? (
              <div className="tb-social-friend-grid">
                {friends.map(
                  (friend) => (
                    <FriendCard
                      key={
                        friend.id
                      }
                      friend={
                        friend
                      }
                      busy={busy}
                      onMessage={
                        openMessages
                      }
                      onPin={() =>
                        void mutate(
                          `pin-${friend.id}`,
                          () =>
                            socialApi.pinFriend(
                              friend.id,
                              !friend.pinned,
                            ),
                        )
                      }
                      onRemove={() => {
                        if (
                          window.confirm(
                            `Retirer ${friend.name} de tes amis TailBlue ?`,
                          )
                        ) {
                          void mutate(
                            `remove-${friend.id}`,
                            () =>
                              socialApi.removeFriend(
                                friend.id,
                              ),
                          );
                        }
                      }}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="tb-social-empty">
                <span>🌙</span>
                <h3>
                  Ton cercle est encore vide
                </h3>
                <p>
                  Utilise « Ajouter un ami »
                  pour retrouver un aventurier
                  du serveur officiel ayant déjà
                  un profil TailBlue.
                </p>
              </div>
            )}
          </div>

          {!!snapshot?.outgoingRequests
            .length && (
            <div className="tb-social-outgoing">
              <strong>
                ⏳ Demandes en attente
              </strong>

              <div>
                {snapshot.outgoingRequests.map(
                  (request) => (
                    <span
                      key={request.id}
                    >
                      {request.to.name}
                    </span>
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {tab === "messages" && (
        <section className="tb-social-messages">
          <aside className="tb-social-conversations">
            <header>
              <p className="tb-social-eyebrow">
                MESSAGERIE TAILBLUE
              </p>
              <h2>Messages</h2>
            </header>

            {snapshot?.conversations
              .length ? (
              snapshot.conversations.map(
                (item) => (
                  <button
                    key={
                      item.friend.id
                    }
                    className={
                      selectedFriendId ===
                      item.friend.id
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setSelectedFriendId(
                        item.friend.id,
                      )
                    }
                  >
                    <div className="tb-social-avatar-wrap">
                      <Avatar
                        person={
                          item.friend
                        }
                        size="small"
                      />
                      <PresenceDot
                        status={
                          item.friend
                            .presence
                            .status
                        }
                      />
                    </div>

                    <span>
                      <strong>
                        {
                          item.friend
                            .name
                        }
                      </strong>
                      <small>
                        {item.lastMessage
                          ? `${
                              item
                                .lastMessage
                                .mine
                                ? "Toi : "
                                : ""
                            }${
                              item
                                .lastMessage
                                .body
                            }`
                          : "Commencer la conversation"}
                      </small>
                    </span>

                    {!!item.unread && (
                      <b className="tb-social-unread">
                        {
                          item.unread
                        }
                      </b>
                    )}
                  </button>
                ),
              )
            ) : (
              <div className="tb-social-empty compact">
                <span>💌</span>
                <p>
                  Ajoute un ami pour
                  commencer à discuter.
                </p>
              </div>
            )}
          </aside>

          <div className="tb-social-chat">
            {conversation &&
            selectedFriendId ? (
              <>
                <header>
                  <div className="tb-social-person">
                    <div className="tb-social-avatar-wrap">
                      <Avatar
                        person={
                          conversation.friend
                        }
                      />
                      <PresenceDot
                        status={
                          conversation
                            .friend
                            .presence
                            .status
                        }
                      />
                    </div>

                    <div>
                      <strong>
                        {
                          conversation
                            .friend.name
                        }
                      </strong>
                      <small>
                        {conversation
                          .friend
                          .presence
                          .status ===
                        "online"
                          ? "En ligne sur TailBlue"
                          : "Hors ligne"}
                      </small>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setTab(
                        "friends",
                      )
                    }
                  >
                    Voir l'ami
                  </button>
                </header>

                <div className="tb-social-chat-log">
                  {conversation.messages
                    .length ? (
                    conversation.messages.map(
                      (message) => (
                        <div
                          key={
                            message.id
                          }
                          className={`tb-social-bubble ${
                            message.mine
                              ? "mine"
                              : "theirs"
                          }`}
                        >
                          <p>
                            {
                              message.body
                            }
                          </p>
                          <small>
                            {
                              relativeTime(
                                message.createdAt,
                              )
                            }
                          </small>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="tb-social-empty compact">
                      <span>✨</span>
                      <p>
                        Première page
                        blanche. Écris
                        quelque chose :3
                      </p>
                    </div>
                  )}

                  <div
                    ref={chatEndRef}
                  />
                </div>

                <form
                  className="tb-social-composer"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void sendMessage();
                  }}
                >
                  <textarea
                    value={messageBody}
                    onChange={(event) =>
                      setMessageBody(
                        event.target.value,
                      )
                    }
                    placeholder={`Écrire à ${conversation.friend.name}…`}
                    maxLength={2000}
                    onKeyDown={(
                      event,
                    ) => {
                      if (
                        event.key ===
                          "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />

                  <button
                    type="submit"
                    disabled={
                      busy ===
                        "message" ||
                      !messageBody.trim()
                    }
                  >
                    ➤ Envoyer
                  </button>
                </form>
              </>
            ) : (
              <div className="tb-social-chat-placeholder">
                <span>💬</span>
                <h2>
                  Choisis une conversation
                </h2>
                <p>
                  Les messages restent dans
                  TailBlue. Aucun DM Discord
                  n'est envoyé.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {tab === "referral" && (
        <section className="tb-social-section">
          <div className="tb-social-section-heading">
            <div>
              <p className="tb-social-eyebrow">
                PARRAINAGE
              </p>
              <h2>
                Fais grandir le Royaume
              </h2>
              <p>
                Ton code est permanent et peut
                parrainer plusieurs aventuriers.
              </p>
            </div>
          </div>

          <div className="tb-referral-grid">
            <article className="tb-referral-code-card">
              <p>TON CODE</p>

              <div className="tb-referral-code">
                <strong>
                  {
                    snapshot?.referral
                      .code
                  }
                </strong>

                <button
                  className={
                    referralCopied
                      ? "copied"
                      : ""
                  }
                  onClick={async () => {
                    const code =
                      snapshot?.referral
                        .code;

                    if (!code) {
                      return;
                    }

                    try {
                      await navigator.clipboard.writeText(
                        buildReferralMessage(
                          code,
                        ),
                      );

                      setError(null);
                      setReferralCopied(true);

                      if (
                        referralCopyTimerRef.current !==
                        null
                      ) {
                        window.clearTimeout(
                          referralCopyTimerRef.current,
                        );
                      }

                      referralCopyTimerRef.current =
                        window.setTimeout(
                          () => {
                            setReferralCopied(
                              false,
                            );
                            referralCopyTimerRef.current =
                              null;
                          },
                          2200,
                        );
                    } catch {
                      setReferralCopied(
                        false,
                      );

                      setError(
                        "Impossible de copier automatiquement le message de parrainage.",
                      );
                    }
                  }}
                >
                  {referralCopied
                    ? "✅ Copié !"
                    : "📋 Copier l’invitation"}
                </button>
              </div>

              {!!snapshot?.referral.code && (
                <div className="tb-referral-share-preview">
                  <span>
                    🔗 Lien d’invitation
                  </span>

                  {buildReferralLink(
                    snapshot.referral.code,
                  ) ? (
                    <code>
                      {buildReferralLink(
                        snapshot.referral.code,
                      )}
                    </code>
                  ) : (
                    <code className="not-configured">
                      Configure VITE_TAILBLUE_WEBSITE_URL
                      quand le site sera en ligne.
                    </code>
                  )}
                </div>
              )}

              <small>
                Un filleul doit effectuer
                {
                  " "
                }
                <b>
                  {
                    snapshot?.referral
                      .activityRequired
                  }
                </b>
                {
                  " "
                }
                activités réelles après avoir
                entré le code avant de compter
                comme actif.
              </small>
            </article>

            <article className="tb-referral-summary">
              <span>
                <b>
                  {
                    snapshot?.referral
                      .activeCount
                  }
                </b>
                filleuls actifs
              </span>

              <span>
                <b>
                  {
                    snapshot?.referral
                      .totalInvitees
                  }
                </b>
                codes utilisés
              </span>
            </article>
          </div>

          {!snapshot?.referral
            .myInviter ? (
            <article className="tb-referral-redeem">
              <div>
                <strong>
                  Tu as été invitée ?
                </strong>
                <p>
                  Un compte ne peut utiliser
                  qu'un seul code de parrainage,
                  pour toute sa vie TailBlue.
                </p>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault();

                  if (
                    !referralCode.trim()
                  ) {
                    return;
                  }

                  void mutate(
                    "redeem",
                    () =>
                      socialApi.redeemReferral(
                        referralCode,
                      ),
                  );
                }}
              >
                <input
                  value={
                    referralCode
                  }
                  onChange={(event) =>
                    setReferralCode(
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="TB-XXXXXXXX"
                />

                <button
                  type="submit"
                  disabled={
                    busy === "redeem"
                  }
                >
                  Utiliser le code
                </button>
              </form>
            </article>
          ) : (
            <article className="tb-referral-inviter">
              <span>💜</span>
              <div>
                <small>
                  Ton parrain / ta marraine
                </small>
                <strong>
                  {
                    snapshot.referral
                      .myInviter.user
                      .name
                  }
                </strong>
              </div>
            </article>
          )}

          <div className="tb-social-subsection">
            <h3>
              🏆 Paliers de parrainage
            </h3>

            <div className="tb-referral-milestones">
              {snapshot?.referral
                .milestones.map(
                  (milestone) => (
                    <article
                      key={
                        milestone.count
                      }
                      className={
                        milestone.claimed
                          ? "claimed"
                          : milestone.unlocked
                            ? "unlocked"
                            : ""
                      }
                    >
                      <span>
                        {milestone.claimed
                          ? "✅"
                          : milestone.unlocked
                            ? "✨"
                            : "🔒"}
                      </span>

                      <strong>
                        {
                          milestone.count
                        }
                        {
                          " "
                        }
                        filleul
                        {milestone.count >
                        1
                          ? "s"
                          : ""}
                      </strong>

                      <small>
                        🍪{" "}
                        {
                          milestone.cookies
                        }
                        {
                          " "
                        }
                        • ✨{" "}
                        {milestone.xp} XP
                      </small>
                    </article>
                  ),
                )}
            </div>
          </div>

          {!!snapshot?.referral
            .invitees.length && (
            <div className="tb-social-subsection">
              <h3>
                🌱 Mes filleuls
              </h3>

              <div className="tb-referral-invitees">
                {snapshot.referral.invitees.map(
                  (invitee) => (
                    <article
                      key={
                        invitee.user.id
                      }
                    >
                      <Avatar
                        person={
                          invitee.user
                        }
                      />

                      <div>
                        <strong>
                          {
                            invitee.user
                              .name
                          }
                        </strong>
                        <small>
                          {
                            invitee.active
                              ? "✅ Filleul actif"
                              : `${invitee.activityCount}/${invitee.requiredActivityCount} activités`
                          }
                        </small>
                      </div>

                      <span
                        className={
                          invitee.active
                            ? "active"
                            : ""
                        }
                      >
                        {invitee.active
                          ? "Actif"
                          : "En progression"}
                      </span>
                    </article>
                  ),
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function FriendCard({
  friend,
  busy,
  onMessage,
  onPin,
  onRemove,
}: {
  friend: SocialFriend;
  busy: string | null;
  onMessage: (
    friend: SocialFriend,
  ) => void;
  onPin: () => void;
  onRemove: () => void;
}) {
  return (
    <article className="tb-social-friend-card">
      <header>
        <div className="tb-social-avatar-wrap">
          <Avatar
            person={friend}
            size="large"
          />
          <PresenceDot
            status={
              friend.presence.status
            }
          />
        </div>

        <button
          className={`tb-social-pin ${
            friend.pinned
              ? "active"
              : ""
          }`}
          title={
            friend.pinned
              ? "Retirer des épinglés"
              : "Épingler cet ami"
          }
          disabled={
            busy ===
            `pin-${friend.id}`
          }
          onClick={onPin}
        >
          {friend.pinned
            ? "📌"
            : "☆"}
        </button>
      </header>

      <div>
        <h3>{friend.name}</h3>

        <p>
          <PresenceDot
            status={
              friend.presence.status
            }
          />
          {friend.presence.status ===
          "online"
            ? "En ligne sur TailBlue"
            : friend.presence.lastSeen
              ? `Vu ${relativeTime(
                  friend.presence
                    .lastSeen,
                ).toLowerCase()}`
              : "Hors ligne"}
        </p>

        <small>
          Profil TailBlue
          {friend.onOfficialServer
            ? " • serveur officiel"
            : ""}
        </small>
      </div>

      <footer>
        <button
          className="message"
          onClick={() =>
            onMessage(friend)
          }
        >
          💬 Message
        </button>

        <button
          className="danger"
          disabled={
            busy ===
            `remove-${friend.id}`
          }
          onClick={onRemove}
        >
          Retirer
        </button>
      </footer>
    </article>
  );
}
