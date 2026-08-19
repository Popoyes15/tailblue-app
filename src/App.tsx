import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { openUrl } from "@tauri-apps/plugin-opener";
 
import "./App.css";
import PetsPage from "./pages/PetsPage";
import HousePage from "./pages/HousePage";
import MarketPage from "./pages/MarketPage";
import CharacterPage from "./pages/CharacterPage";
import InventoryPage from "./pages/InventoryPage";
import QuestsPage from "./pages/QuestsPage";
import MinePage from "./pages/MinePage";
import WorkPage from "./pages/WorkPage";
import HimeControlPage from "./pages/HimeControlPage";
import HuntPage from "./pages/HuntPage";
import {
  clearDesktopAccessToken,
  exchangeDesktopAuthCode,
  getDesktopAccessToken,
  getDiscordDesktopLoginUrl,
  homeApiConfigured,
  loadAuthenticatedUser,
  restoreDesktopAccessToken,
  loadHomeSnapshot,
  logoutHomeSession,
  markAllHomeNotificationsRead,
  markHomeNotificationRead,
  openHomeStream,
  type TailBlueAuthUser,
} from "./api/homeApi";
import { HOME_PREVIEW_SNAPSHOT } from "./data/homePreviewData";
import type {
  HomeActivity,
  HomeNotification,
  HomeSnapshot,
} from "./types/home";

import {
  applySettingsToDocument,
  useTailBlueSettings,
} from "./settings/tailblueSettings";
import {
  configureAudio,
  ensureAmbienceStarted,
  playNotificationTone,
  playUiClick,
} from "./services/audioService";
import {
  dismissNotificationLocal,
  dismissNotificationsLocal,
  getVisibleNotifications,
  markNotificationReadLocal,
  markNotificationsReadLocal,
  subscribeNotificationState,
  TEST_NOTIFICATION_EVENT,
} from "./services/notificationCenter";
import {
  useSidebarBadgeState,
} from "./services/sidebarBadgeState";
import TailBlueExtraPages, {
  isTailBlueExtraPage,
} from "./pages/TailBlueExtraPages";

type NotificationLevel = "info" | "new" | "important" | "urgent";

type BadgeData = {
  text: string;
  level: NotificationLevel;
};

type MenuSectionProps = {
  title: string;
  icon: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: BadgeData;
};

function Badge({ badge }: { badge?: BadgeData }) {
  if (!badge) return null;

  return (
    <span className={`menu-badge badge-${badge.level}`}>
      {badge.text}
    </span>
  );
}

function MenuSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: MenuSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="menu-section">
      <button
        className={`menu-section-title ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className="menu-section-name">
          <span>{icon}</span>
          {title}
        </span>

        <span className="menu-section-right">
          <Badge badge={badge} />
          <span className="menu-chevron">{open ? "⌄" : "›"}</span>
        </span>
      </button>

      {open && <div className="menu-section-content">{children}</div>}
    </div>
  );
}


type SearchEntry = {
  icon: string;
  name: string;
  group: string;
  keywords: string[];
  himeOnly?: boolean;
};

const SEARCH_ENTRIES: SearchEntry[] = [
  { icon: "🏠", name: "Accueil", group: "Principal", keywords: ["dashboard", "home", "journal", "profil"] },
  { icon: "👤", name: "Personnage", group: "Principal", keywords: ["profil", "stats", "niveau", "rang", "xp"] },
  { icon: "🎒", name: "Inventaire", group: "Principal", keywords: ["sac", "objets", "loot", "équipement"] },

  { icon: "📜", name: "Quêtes", group: "Aventure", keywords: ["quest", "missions", "récompenses"] },
  { icon: "⛏️", name: "Mine", group: "Aventure", keywords: ["combat", "minerais", "donjon"] },
  { icon: "🏹", name: "Hunt", group: "Aventure", keywords: ["chasse", "aventure", "loot"] },
  { icon: "🛠️", name: "Work", group: "Aventure", keywords: ["travail", "métier", "job"] },
  { icon: "🗺️", name: "Conquêtes", group: "Aventure", keywords: ["conquete", "territoire"] },

  { icon: "🐯", name: "Pets", group: "Compagnons", keywords: ["compagnon", "familier", "histoire"] },
  { icon: "🏡", name: "Chenil", group: "Compagnons", keywords: ["nourrir", "provisions", "équipe"] },
  { icon: "🥚", name: "Élevage", group: "Compagnons", keywords: ["oeuf", "œuf", "dragon", "origines"] },

  { icon: "🏰", name: "Maison", group: "Monde", keywords: ["résidence", "logement", "mobilier"] },
  { icon: "🏛️", name: "Musée", group: "Monde", keywords: ["collection", "trophées", "objets"] },
  { icon: "🛒", name: "Marché", group: "Monde", keywords: ["forge", "alchimiste", "boutique", "achat", "vente"] },
  { icon: "🏆", name: "Classement", group: "Monde", keywords: ["top", "niveau", "ranking"] },
  { icon: "🖼️", name: "Galerie", group: "Monde", keywords: ["images", "illustrations"] },

  { icon: "📖", name: "Wiki", group: "Informations", keywords: ["helpme", "commandes", "aide"] },
  { icon: "✨", name: "Nouveautés", group: "Informations", keywords: ["update", "news", "annonce"] },
  { icon: "🛣️", name: "Roadmap", group: "Informations", keywords: ["avenir", "prévu", "planning"] },

  { icon: "📊", name: "Bilan général", group: "Hime Control", keywords: ["admin", "bilan"], himeOnly: true },
  { icon: "📈", name: "Statistiques", group: "Hime Control", keywords: ["stats", "serveur"], himeOnly: true },
  { icon: "💡", name: "ShowIdées", group: "Hime Control", keywords: ["idées", "suggestions", "trophée"], himeOnly: true },
  { icon: "🧾", name: "Logs", group: "Hime Control", keywords: ["journal", "console"], himeOnly: true },
  { icon: "🚨", name: "Erreurs", group: "Hime Control", keywords: ["bugs", "guardian"], himeOnly: true },
  { icon: "🛡️", name: "Sécurité", group: "Hime Control", keywords: ["serveurs", "discord", "session"], himeOnly: true },
  { icon: "👥", name: "Joueurs", group: "Hime Control", keywords: ["players", "admin joueur"], himeOnly: true },
  { icon: "💰", name: "Économie", group: "Hime Control", keywords: ["cookies", "fortune"], himeOnly: true },
  { icon: "💻", name: "État du système", group: "Hime Control", keywords: ["botcheck", "backup", "serveur"], himeOnly: true },

  { icon: "⚙️", name: "Paramètres", group: "Application", keywords: ["settings", "réglages"] },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CH").format(value);
}

function percent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function relativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return "—";

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - time) / 60_000),
  );

  if (minutes < 1) return "À l'instant";
  if (minutes < 60) return `Il y a ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Hier";
  return `Il y a ${days} j`;
}

function Avatar({
  url,
  name,
  className,
}: {
  url?: string | null;
  name: string;
  className: string;
}) {
  if (url) {
    return (
      <img
        className={`${className} avatar-image`}
        src={url}
        alt={name}
      />
    );
  }

  return (
    <div className={className}>
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function SearchPalette({
  open,
  isHime,
  onClose,
  onNavigate,
}: {
  open: boolean;
  isHime: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");

    const allowed = SEARCH_ENTRIES.filter(
      (entry) => !entry.himeOnly || isHime,
    );

    if (!needle) return allowed.slice(0, 12);

    return allowed
      .filter((entry) =>
        [
          entry.name,
          entry.group,
          ...entry.keywords,
        ]
          .join(" ")
          .toLocaleLowerCase("fr")
          .includes(needle),
      )
      .slice(0, 18);
  }, [query, isHime]);

  if (!open) return null;

  return (
    <div
      className="search-overlay"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="search-palette">
        <header className="search-palette-header">
          <span>🔎</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Rechercher une page, une activité, un système…"
          />
          <kbd>Esc</kbd>
        </header>

        <div className="search-palette-caption">
          {query
            ? `${results.length} résultat(s)`
            : "Accès rapide TailBlue"}
        </div>

        <div className="search-results">
          {results.map((entry) => (
            <button
              key={`${entry.group}-${entry.name}`}
              onClick={() => {
                onNavigate(entry.name);
                onClose();
              }}
            >
              <span className="search-result-icon">
                {entry.icon}
              </span>
              <span>
                <strong>{entry.name}</strong>
                <small>{entry.group}</small>
              </span>
              <b>→</b>
            </button>
          ))}

          {!results.length && (
            <div className="search-empty">
              <span>🌙</span>
              <strong>Aucun résultat</strong>
              <p>Essaie un autre mot-clé.</p>
            </div>
          )}
        </div>

        <footer className="search-palette-footer">
          <span>
            <kbd>Ctrl</kbd> + <kbd>K</kbd> pour ouvrir
          </span>
          <span>Entrées Hime visibles uniquement à Hime.</span>
        </footer>
      </section>
    </div>
  );
}

function NotificationPanel({
  open,
  enabled,
  notifications,
  onClose,
  onOpen,
  onMarkAll,
  onDismiss,
  onClearRead,
  onOpenSettings,
}: {
  open: boolean;
  enabled: boolean;
  notifications: HomeNotification[];
  onClose: () => void;
  onOpen: (notification: HomeNotification) => void;
  onMarkAll: () => void;
  onDismiss: (notification: HomeNotification) => void;
  onClearRead: () => void;
  onOpenSettings: () => void;
}) {
  const [filter, setFilter] =
    useState<"all" | "unread">("all");

  useEffect(() => {
    if (!open) setFilter("all");
  }, [open]);

  if (!open) return null;

  const unread = notifications.filter(
    (item) => !item.read,
  ).length;

  const filtered =
    filter === "unread"
      ? notifications.filter((item) => !item.read)
      : notifications;

  return (
    <div
      className="notification-overlay"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <aside className="notification-panel notification-panel-v2">
        <header>
          <div>
            <p className="eyebrow">CENTRE TAILBLUE</p>
            <h2>Notifications</h2>
            <span className="notification-panel-subtitle">
              {enabled
                ? unread
                  ? `${unread} notification(s) non lue(s)`
                  : "Tout est à jour ✨"
                : "Notifications désactivées"}
            </span>
          </div>

          <button
            className="notification-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </header>

        {!enabled ? (
          <div className="notification-disabled-state">
            <span>🔕</span>
            <h3>Notifications désactivées</h3>
            <p>
              Aucun compteur, son ou pop-up TailBlue
              n'apparaîtra tant que cette option reste
              coupée.
            </p>

            <button
              onClick={() => {
                onClose();
                onOpenSettings();
              }}
            >
              ⚙️ Ouvrir les paramètres
            </button>
          </div>
        ) : (
          <>
            <div className="notification-tabs">
              <button
                className={
                  filter === "all" ? "active" : ""
                }
                onClick={() => setFilter("all")}
              >
                Toutes
                <span>{notifications.length}</span>
              </button>

              <button
                className={
                  filter === "unread" ? "active" : ""
                }
                onClick={() => setFilter("unread")}
              >
                Non lues
                <span>{unread}</span>
              </button>
            </div>

            <div className="notification-panel-actions notification-panel-actions-v2">
              <button
                onClick={onMarkAll}
                disabled={unread === 0}
              >
                ✓ Tout marquer comme lu
              </button>

              <button
                onClick={onClearRead}
                disabled={
                  !notifications.some(
                    (item) => item.read,
                  )
                }
              >
                🧹 Masquer les lues
              </button>
            </div>

            <div className="notification-list">
              {filtered.map((notification) => (
                <article
                  key={notification.id}
                  className={`notification-entry notification-entry-v2 level-${notification.level} ${
                    notification.read
                      ? "read"
                      : "unread"
                  }`}
                >
                  <button
                    className="notification-entry-main"
                    onClick={() =>
                      onOpen(notification)
                    }
                  >
                    <span className="notification-entry-icon">
                      {notification.icon}
                    </span>

                    <span className="notification-entry-copy">
                      <strong>
                        {notification.title}
                      </strong>
                      <p>{notification.message}</p>

                      <span className="notification-entry-meta">
                        <small>
                          {relativeTime(
                            notification.createdAt,
                          )}
                        </small>

                        <small>
                          {notification.level === "urgent"
                            ? "URGENT"
                            : notification.level ===
                                "important"
                              ? "IMPORTANT"
                              : notification.level ===
                                  "success"
                                ? "RÉUSSITE"
                                : notification.level ===
                                    "info"
                                  ? "INFO"
                                  : "TAILBLUE"}
                        </small>
                      </span>
                    </span>

                    {!notification.read && (
                      <i className="notification-unread-dot" />
                    )}
                  </button>

                  <button
                    className="notification-dismiss"
                    onClick={() =>
                      onDismiss(notification)
                    }
                    title="Masquer cette notification"
                    aria-label="Masquer"
                  >
                    ×
                  </button>
                </article>
              ))}

              {!filtered.length && (
                <div className="notification-empty">
                  <span>
                    {filter === "unread"
                      ? "✨"
                      : "🔔"}
                  </span>
                  <strong>
                    {filter === "unread"
                      ? "Aucune notification non lue"
                      : "Aucune notification"}
                  </strong>
                  <p>
                    {filter === "unread"
                      ? "Tu as tout consulté."
                      : "Le Royaume est calme pour le moment."}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function NotificationToast({
  notification,
  onOpen,
  onClose,
}: {
  notification: HomeNotification | null;
  onOpen: (notification: HomeNotification) => void;
  onClose: () => void;
}) {
  if (!notification) return null;

  return (
    <div
      className={`notification-toast level-${notification.level}`}
    >
      <button
        className="notification-toast-main"
        onClick={() => onOpen(notification)}
      >
        <span>{notification.icon}</span>

        <div>
          <small>
            {notification.level === "urgent"
              ? "ALERTE TAILBLUE"
              : "NOUVELLE NOTIFICATION"}
          </small>
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
        </div>
      </button>

      <button
        className="notification-toast-close"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}

function ActivityModal({
  open,
  activities,
  onClose,
  onNavigate,
}: {
  open: boolean;
  activities: HomeActivity[];
  onClose: () => void;
  onNavigate: (page: string) => void;
}) {
  if (!open) return null;

  return (
    <div
      className="activity-overlay"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section className="activity-modal">
        <header>
          <div>
            <p className="eyebrow">JOURNAL TAILBLUE</p>
            <h2>Activité récente</h2>
          </div>
          <button onClick={onClose}>×</button>
        </header>

        <div className="activity-modal-list">
          {activities.map((activity) => (
            <button
              key={activity.id}
              disabled={!activity.targetPage}
              onClick={() => {
                if (!activity.targetPage) return;
                onNavigate(activity.targetPage);
                onClose();
              }}
            >
              <span>{activity.icon}</span>
              <div>
                <strong>{activity.title}</strong>
                <p>{activity.detail}</p>
                <small>{relativeTime(activity.createdAt)}</small>
              </div>
              {activity.targetPage && <b>→</b>}
            </button>
          ))}

          {!activities.length && (
            <div className="activity-modal-empty">
              Aucun événement enregistré.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


function CompanionImageViewer({
  open,
  imageUrl,
  emoji,
  name,
  speciesName,
  onClose,
}: {
  open: boolean;
  imageUrl?: string | null;
  emoji?: string | null;
  name: string;
  speciesName?: string | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="companion-lightbox-overlay"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section className="companion-lightbox">
        <button
          className="companion-lightbox-close"
          onClick={onClose}
          aria-label="Fermer"
          title="Fermer"
        >
          ×
        </button>

        <div className="companion-lightbox-stage">
          {imageUrl && (
            <div
              className="companion-lightbox-blur"
              style={{
                backgroundImage: `url("${imageUrl}")`,
              }}
            />
          )}

          {imageUrl ? (
            <img src={imageUrl} alt={name} />
          ) : (
            <div className="companion-lightbox-emoji">
              {emoji ?? "🐾"}
            </div>
          )}
        </div>

        <footer className="companion-lightbox-caption">
          <div>
            <p className="eyebrow">COMPAGNON ACTUEL</p>
            <h2>{name}</h2>
            {speciesName && <span>{speciesName}</span>}
          </div>

          <span className="companion-lightbox-hint">
            🔎 Image agrandie
          </span>
        </footer>
      </section>
    </div>
  );
}

function AccountModal({
  open,
  authUser,
  apiEnabled,
  authenticating,
  loggingOut,
  message,
  onClose,
  onLogin,
  onLogout,
}: {
  open: boolean;
  authUser: TailBlueAuthUser | null;
  apiEnabled: boolean;
  authenticating: boolean;
  loggingOut: boolean;
  message: string | null;
  onClose: () => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  if (!open) return null;

  const authenticated = Boolean(authUser);
  const displayName =
    authUser?.displayName?.trim() || "Connexion Discord requise";
  const discordId =
    authUser?.id?.trim() || "Non connecté";

  async function copyDiscordId() {
    if (!authUser?.id) return;

    try {
      await navigator.clipboard.writeText(authUser.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div
      className="account-modal-overlay"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <section className="account-modal">
        <button
          className="account-modal-close"
          onClick={onClose}
          aria-label="Fermer"
          title="Fermer"
        >
          ×
        </button>

        <div className="account-modal-hero">
          <div className="account-avatar-wrap">
            <Avatar
              url={authUser?.avatarUrl}
              name={displayName}
              className="account-avatar"
            />
          </div>

          <div className="account-modal-title">
            <p className="eyebrow">COMPTE DISCORD</p>
            <h2>{displayName}</h2>

            <div className="account-badges">
              {authenticated ? (
                <span>🔐 Discord vérifié</span>
              ) : (
                <span>🔒 Non connecté</span>
              )}

              {authUser?.isHime && (
                <span className="royal">
                  👑 Hime Control
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="account-info-grid">
          <div className="account-info-card wide">
            <span>ID DISCORD</span>

            <div className="account-discord-id-row">
              <strong>{discordId}</strong>

              <button
                onClick={() => void copyDiscordId()}
                disabled={!authUser?.id}
                title={
                  authUser?.id
                    ? "Copier l'ID Discord"
                    : "Disponible après connexion Discord"
                }
              >
                {copied ? "✓ Copié" : "📋 Copier"}
              </button>
            </div>
          </div>

          <div className="account-info-card">
            <span>PSEUDO DISCORD</span>
            <strong>{authUser?.username || "—"}</strong>
          </div>

          <div className="account-info-card">
            <span>STATUT</span>
            <strong>
              {authUser
                ? authUser.isHime
                  ? "👑 Hime-sama"
                  : "✅ Aventurier vérifié"
                : "—"}
            </strong>
          </div>
        </div>

        {!apiEnabled && (
          <div className="account-preview-note">
            🧪 L'API TailBlue n'est pas configurée sur cette
            installation.
          </div>
        )}

        {apiEnabled && !authenticated && (
          <div className="account-preview-note">
            🔐 Connecte ton compte Discord pour que TailBlue
            récupère ton identité réelle. Le niveau, le rang et
            les données RPG seront reliés ensuite par
            <strong> /api/home</strong>.
          </div>
        )}

        {message && (
          <div className="account-action-message">
            {message}
          </div>
        )}

        <div className="account-modal-actions">
          <button
            className="account-secondary-button"
            onClick={onClose}
          >
            Fermer
          </button>

          {authenticated ? (
            <button
              className="account-logout-button"
              onClick={onLogout}
              disabled={loggingOut}
              title="Se déconnecter de TailBlue"
            >
              {loggingOut
                ? "Déconnexion…"
                : "↪ Se déconnecter"}
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={onLogin}
              disabled={!apiEnabled || authenticating}
              title={
                apiEnabled
                  ? "Se connecter avec Discord"
                  : "API TailBlue non configurée"
              }
            >
              {authenticating
                ? "Ouverture de Discord…"
                : "🔵 Se connecter avec Discord"}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function App() {
  const handledDeepLinksRef = useRef<Set<string>>(new Set());
  const [authUser, setAuthUser] =
    useState<TailBlueAuthUser | null>(null);
  const [authenticating, setAuthenticating] =
    useState(false);

  const [authResolved, setAuthResolved] =
    useState(!homeApiConfigured);

  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;

    const handleDeepLinks = async (urls: string[] | null) => {
      if (!urls) return;

      for (const url of urls) {
        if (!url.startsWith("tailblue://")) continue;

        if (handledDeepLinksRef.current.has(url)) {
          console.log("↪️ Deep link déjà traité :", url);
          continue;
        }

        handledDeepLinksRef.current.add(url);

        console.log("✅ Deep link reçu dans TailBlue :", url);

        const parsedUrl = new URL(url);

        if (
          parsedUrl.hostname !== "auth" ||
          parsedUrl.pathname !== "/callback"
        ) {
          continue;
        }

        const code = parsedUrl.searchParams.get("code");

        if (!code) {
          console.error("❌ Code de connexion TailBlue manquant.");
          continue;
        }

        try {
          setAuthenticating(true);

          const auth = await exchangeDesktopAuthCode(code);
          const me = await loadAuthenticatedUser();

          setAuthUser(me.user);
          setAuthResolved(true);
          setAccountMessage(
            `✅ Connectée avec Discord en tant que ${me.user.displayName}.`,
          );
          setAccountOpen(true);
          setAuthenticating(false);

          console.log(
            "🔐 Connexion TailBlue Desktop réussie :",
            auth.user,
          );

          console.log(
            "👑 Session TailBlue vérifiée par l'API :",
            me,
          );
        } catch (error) {
          setAuthenticating(false);
          setAccountMessage(
            error instanceof Error
              ? `❌ ${error.message}`
              : "❌ Connexion TailBlue Desktop impossible.",
          );
          setAccountOpen(true);

          console.error(
            "❌ Connexion TailBlue Desktop impossible :",
            error,
          );
        }
      }
    };

    void getCurrent()
      .then((urls) => {
        if (active) {
          void handleDeepLinks(urls);
        }
      })
      .catch((error) => {
        console.error(
          "❌ Lecture du deep link impossible :",
          error,
        );
      });

    void onOpenUrl((urls) => {
      void handleDeepLinks(urls);
    }).then((stopListening) => {
      if (active) {
        unlisten = stopListening;
      } else {
        stopListening();
      }
    });

    return () => {
      active = false;
      unlisten?.();
    };
  }, []);
  const [activePage, setActivePage] = useState("Accueil");

  const [home, setHome] = useState<HomeSnapshot>(
    HOME_PREVIEW_SNAPSHOT,
  );
  const [homeLoading, setHomeLoading] = useState(
    homeApiConfigured,
  );

  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [companionImageOpen, setCompanionImageOpen] =
    useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [accountMessage, setAccountMessage] =
    useState<string | null>(null);

  useEffect(() => {

    if (!homeApiConfigured) {
      return;
    }

    let cancelled = false;

    void restoreDesktopAccessToken()
      .then(async (token) => {

        if (cancelled) {
          return;
        }

        if (!token) {
          setAuthResolved(true);
          return;
        }

        try {

          const session =
            await loadAuthenticatedUser();

          if (!cancelled) {

            setAuthUser(
              session.user,
            );

            setAuthResolved(true);

            console.log(
              "🔐 Session Discord restaurée depuis le coffre sécurisé.",
            );
          }

        } catch (error) {

          clearDesktopAccessToken();

          if (!cancelled) {

            setAuthUser(null);
            setAuthResolved(true);

            console.warn(
              "Session Discord persistante expirée :",
              error,
            );
          }
        }
      })
      .catch((error) => {

        if (!cancelled) {

          console.error(
            "Impossible de lire le coffre sécurisé TailBlue :",
            error,
          );

          setAuthResolved(true);
        }
      });

    return () => {
      cancelled = true;
    };

  }, []);

  const { settings } = useTailBlueSettings();

  const {
    isAcknowledged: isSidebarBadgeAcknowledged,
    acknowledge: acknowledgeSidebarBadge,
  } = useSidebarBadgeState();

  const [notificationRevision, setNotificationRevision] =
    useState(0);

  const [notificationToast, setNotificationToast] =
    useState<HomeNotification | null>(null);

  const seenNotificationIds = useRef<Set<string>>(
    new Set(
      HOME_PREVIEW_SNAPSHOT.notifications.map(
        (item) => item.id,
      ),
    ),
  );

  const isHime = authUser?.isHime === true;

  const shellDisplayName =
    authUser?.displayName ??
    (homeApiConfigured
      ? "Connexion Discord"
      : home.profile.displayName);

  const shellAvatarUrl =
    authUser?.avatarUrl ??
    (homeApiConfigured
      ? null
      : home.profile.avatarUrl);

  const refreshHome = useCallback(
    async (signal?: AbortSignal) => {
      if (
        homeApiConfigured &&
        !getDesktopAccessToken()
      ) {
        if (!signal?.aborted) {
          setHomeLoading(false);
        }
        return;
      }

      try {
        const snapshot = await loadHomeSnapshot(signal);
        setHome(snapshot);
      } catch (error) {
        if (signal?.aborted) return;
        console.error("Accueil TailBlue :", error);
      } finally {
        if (!signal?.aborted) setHomeLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    if (homeApiConfigured && authUser) {
      setHomeLoading(true);
    }
    void refreshHome(controller.signal);

    if (!homeApiConfigured) {
      return () => controller.abort();
    }

    const interval = window.setInterval(
      () => void refreshHome(),
      12_000,
    );

    const closeStream = openHomeStream(
      () => void refreshHome(),
    );

    return () => {
      controller.abort();
      window.clearInterval(interval);
      closeStream();
    };
  }, [refreshHome, authUser?.id]);

  useEffect(() => {
    applySettingsToDocument(settings);
    configureAudio(settings);

    if (!settings.notifications) {
      setNotificationsOpen(false);
      setNotificationToast(null);
    }
  }, [settings]);

  useEffect(() => {
    return subscribeNotificationState(() => {
      setNotificationRevision((value) => value + 1);
    });
  }, []);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;

      if (
        target?.closest(
          "button, a, [role='button']",
        )
      ) {
        void playUiClick();
      }

      void ensureAmbienceStarted();
    };

    document.addEventListener(
      "pointerdown",
      onPointerDown,
      true,
    );

    return () =>
      document.removeEventListener(
        "pointerdown",
        onPointerDown,
        true,
      );
  }, []);

  useEffect(() => {
    const onOpenAccount = () => {
      setAccountMessage(null);
      setAccountOpen(true);
    };

    window.addEventListener(
      "tailblue:open-account",
      onOpenAccount,
    );

    return () =>
      window.removeEventListener(
        "tailblue:open-account",
        onOpenAccount,
      );
  }, []);

  useEffect(() => {
    const onTestNotification = (event: Event) => {
      const custom =
        event as CustomEvent<HomeNotification>;

      const notification = custom.detail;
      if (!notification) return;

      setHome((current) => ({
        ...current,
        notifications: [
          notification,
          ...current.notifications,
        ],
      }));

      if (
        settings.notifications &&
        settings.notificationLevels[
          notification.level
        ]
      ) {
        setNotificationToast(notification);
        void playNotificationTone(
          notification.level,
        );
      }
    };

    window.addEventListener(
      TEST_NOTIFICATION_EVENT,
      onTestNotification,
    );

    return () =>
      window.removeEventListener(
        TEST_NOTIFICATION_EVENT,
        onTestNotification,
      );
  }, [settings]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const commandKey = event.ctrlKey || event.metaKey;

      if (
        commandKey &&
        event.key.toLocaleLowerCase() === "k"
      ) {
        event.preventDefault();
        setSearchOpen(true);
        setNotificationsOpen(false);
      }

      if (event.key === "Escape") {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setActivityOpen(false);
        setCompanionImageOpen(false);
        setAccountOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleNotifications = useMemo(
    () =>
      getVisibleNotifications(
        home.notifications,
        settings,
      ),
    [
      home.notifications,
      settings,
      notificationRevision,
    ],
  );

  const unreadNotifications =
    visibleNotifications.filter(
      (item) => !item.read,
    ).length;

  useEffect(() => {
    if (!settings.notifications) return;

    const unseen = visibleNotifications.filter(
      (notification) =>
        !notification.read &&
        !seenNotificationIds.current.has(
          notification.id,
        ),
    );

    for (const notification of visibleNotifications) {
      seenNotificationIds.current.add(
        notification.id,
      );
    }

    const newest = unseen[0];

    if (newest) {
      setNotificationToast(newest);
      void playNotificationTone(newest.level);
    }
  }, [settings.notifications, visibleNotifications]);

  const himeIdeas = home.hime?.ideas ?? 0;
  const himeErrors = home.hime?.errors ?? 0;

  /*
   * Badges de navigation :
   * - cliquer sur la page = badge consulté ;
   * - la signature est mémorisée localement ;
   * - si la donnée change plus tard, le badge revient.
   */
  const sidebarBadge = (
    key: string,
    signature: string,
    badge?: BadgeData,
  ) =>
    badge &&
    !isSidebarBadgeAcknowledged(key, signature)
      ? badge
      : undefined;

  const homeBadgeSignature =
    `home-unread:${unreadNotifications}`;

  const homeSidebarBadge = sidebarBadge(
    "home-notifications",
    homeBadgeSignature,
    unreadNotifications > 0
      ? {
          text: String(unreadNotifications),
          level: "new",
        }
      : undefined,
  );

  const questsBadgeSignature =
    `quests-available:${home.quests.available}`;

  const questsSidebarBadge = sidebarBadge(
    "quests",
    questsBadgeSignature,
    home.quests.available > 0
      ? {
          text: String(home.quests.available),
          level: "info",
        }
      : undefined,
  );

  const mineBadgeSignature =
    "mine-important-preview-v1";

  const mineSidebarBadge = sidebarBadge(
    "mine",
    mineBadgeSignature,
    {
      text: "!",
      level: "important",
    },
  );

  /*
   * Ces deux signatures sont actuellement liées aux
   * aperçus locaux. Quand le backend fournira ses vraies
   * versions/IDs, il suffira d'utiliser ces valeurs ici.
   */
  const wikiBadgeSignature =
    "wiki-complete-preview-v1";

  const updatesBadgeSignature =
    "updates-preview:4";

  const wikiSidebarBadge = sidebarBadge(
    "wiki",
    wikiBadgeSignature,
    {
      text: "NEW",
      level: "new",
    },
  );

  const updatesSidebarBadge = sidebarBadge(
    "updates",
    updatesBadgeSignature,
    {
      text: "4",
      level: "new",
    },
  );

  const informationSidebarBadge =
    wikiSidebarBadge || updatesSidebarBadge
      ? {
          text: "NEW",
          level: "new" as NotificationLevel,
        }
      : undefined;

  const ideasBadgeSignature =
    `hime-ideas:${himeIdeas}`;

  const errorsBadgeSignature =
    `hime-errors:${himeErrors}`;

  const himeIdeasSidebarBadge = sidebarBadge(
    "hime-ideas",
    ideasBadgeSignature,
    himeIdeas > 0
      ? {
          text: String(himeIdeas),
          level: "new",
        }
      : undefined,
  );

  const himeErrorsSidebarBadge = sidebarBadge(
    "hime-errors",
    errorsBadgeSignature,
    himeErrors > 0
      ? {
          text: String(himeErrors),
          level: "urgent",
        }
      : undefined,
  );

  const himeSidebarTotal =
    (himeIdeasSidebarBadge ? himeIdeas : 0) +
    (himeErrorsSidebarBadge ? himeErrors : 0);

  const himeSidebarBadge =
    himeSidebarTotal > 0
      ? {
          text: String(himeSidebarTotal),
          level: "urgent" as NotificationLevel,
        }
      : undefined;

  const hpPercent = percent(home.hp, home.maxHp);
  const energyPercent = percent(
    home.energy,
    home.maxEnergy,
  );
  const xpPercent = percent(
    home.profile.xpCurrent,
    home.profile.xpNeeded,
  );

  const rankText =
    home.profile.adventurerRank?.trim() || "—";

  const rankDetail = home.profile.adventurerRank
    ? `${home.profile.adventurerScore?.toFixed(1) ?? "0.0"} pts`
    : homeApiConfigured
      ? "Synchronisation du rang"
      : "Connexion backend requise";

  const navigate = (page: string) => {
    setActivePage(page);
    setSearchOpen(false);
    setNotificationsOpen(false);
  };

  async function openNotification(
    notification: HomeNotification,
  ) {
    markNotificationReadLocal(notification.id);

    setHome((current) => ({
      ...current,
      notifications: current.notifications.map((item) =>
        item.id === notification.id
          ? { ...item, read: true }
          : item,
      ),
    }));

    setNotificationToast(null);

    try {
      await markHomeNotificationRead(notification.id);
    } catch (error) {
      console.error("Notification TailBlue :", error);
    }

    if (notification.targetPage) {
      navigate(notification.targetPage);
    }
  }

  async function markAllNotifications() {
    const ids = visibleNotifications.map(
      (item) => item.id,
    );

    markNotificationsReadLocal(ids);

    setHome((current) => ({
      ...current,
      notifications: current.notifications.map((item) => ({
        ...item,
        read: true,
      })),
    }));

    try {
      await markAllHomeNotificationsRead();
    } catch (error) {
      console.error("Notifications TailBlue :", error);
    }
  }

  function dismissNotification(
    notification: HomeNotification,
  ) {
    dismissNotificationLocal(notification.id);

    if (
      notificationToast?.id === notification.id
    ) {
      setNotificationToast(null);
    }
  }

  function clearReadNotifications() {
    dismissNotificationsLocal(
      visibleNotifications
        .filter((item) => item.read)
        .map((item) => item.id),
    );
  }

  async function loginWithDiscord() {
    if (!homeApiConfigured || authenticating) return;

    setAuthenticating(true);
    setAccountMessage(
      "🌐 Ouverture de Discord dans ton navigateur…",
    );

    try {
      await openUrl(getDiscordDesktopLoginUrl());

      setAccountMessage(
        "🔐 Termine la connexion dans Discord. TailBlue se rouvrira automatiquement ensuite.",
      );
    } catch (error) {
      setAccountMessage(
        error instanceof Error
          ? error.message
          : "Impossible d'ouvrir Discord.",
      );
    } finally {
      setAuthenticating(false);
    }
  }

  async function logout() {
  if (!homeApiConfigured || loggingOut || !authUser) return;

  setLoggingOut(true);
  setAccountMessage(null);

  let logoutError: unknown = null;

  try {
    await logoutHomeSession();
  } catch (error) {
    logoutError = error;
    console.warn(
      "Déconnexion serveur TailBlue incomplète :",
      error,
    );
  } finally {
    /*
     * Pour l'utilisateur, la déconnexion locale
     * doit TOUJOURS être immédiate.
     */
    setAuthUser(null);
    setHome(HOME_PREVIEW_SNAPSHOT);
    setHomeLoading(false);
    setAccountOpen(false);
    setLoggingOut(false);
  }

  if (logoutError) {
    console.warn(
      "La session locale a tout de même été supprimée.",
    );
  }
}

  const navButton = (
    icon: string,
    name: string,
    badge?: BadgeData,
    badgeKey?: string,
    badgeSignature?: string,
  ) => (
    <button
      className={`nav-item ${activePage === name ? "active" : ""}`}
      onClick={() => {
        if (
          badge &&
          badgeKey &&
          badgeSignature
        ) {
          acknowledgeSidebarBadge(
            badgeKey,
            badgeSignature,
          );
        }

        setActivePage(name);
      }}
    >
      <span className="nav-left">
        <span className="nav-icon">{icon}</span>
        <span>{name}</span>
      </span>

      <Badge badge={badge} />
    </button>
  );


  /* TAILBLUE_LOGIN_GATE_V1 */
  if (homeApiConfigured && !authResolved) {
    return (
      <div className="tb-login-gate tb-login-gate-loading">
        <div className="tb-login-ambient tb-login-ambient-a" />
        <div className="tb-login-ambient tb-login-ambient-b" />

        <section className="tb-login-card" aria-live="polite">
          <div className="tb-login-logo-wrap">
            <img src="/icone-appli.png" alt="TailBlue" />
          </div>

          <p className="tb-login-kicker">TAILBLUE DESKTOP</p>
          <h1>Connexion au royaume…</h1>
          <p className="tb-login-copy">
            Vérification de votre session et chargement de votre identité.
          </p>

          <div className="tb-login-loader" aria-hidden="true">
            <span />
          </div>

          <p className="tb-login-foot">✦ Quelques instants</p>
        </section>
      </div>
    );
  }

  if (homeApiConfigured && authResolved && !authUser) {
    return (
      <div className="tb-login-gate">
        <div className="tb-login-ambient tb-login-ambient-a" />
        <div className="tb-login-ambient tb-login-ambient-b" />

        <section className="tb-login-card">
          <div className="tb-login-logo-wrap">
            <img src="/icone-appli.png" alt="TailBlue" />
          </div>

          <p className="tb-login-kicker">TAILBLUE DESKTOP</p>
          <h1>Bienvenue dans TailBlue</h1>

          <p className="tb-login-copy">
            Connectez-vous à votre compte Discord pour retrouver votre personnage,
            vos compagnons et votre progression dans le royaume.
          </p>

          <button
            className="tb-login-discord"
            type="button"
            onClick={() => void loginWithDiscord()}
            disabled={authenticating}
          >
            <span className="tb-login-discord-icon">◉</span>
            <span>
              <strong>
                {authenticating
                  ? "Ouverture de Discord…"
                  : "Continuer avec Discord"}
              </strong>
              <small>Connexion sécurisée via votre compte Discord</small>
            </span>
            <b>›</b>
          </button>

          {accountMessage && (
            <p className="tb-login-message">{accountMessage}</p>
          )}

          <div className="tb-login-security">
            <span>🔐</span>
            <p>
              Votre identité est vérifiée par TailBlue. Les droits spéciaux ne
              sont jamais décidés uniquement par l'interface.
            </p>
          </div>

          <p className="tb-login-foot">✦ Un royaume à découvrir</p>
        </section>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand brand-button"
          onClick={() => {
            if (activePage === "Accueil") {
              const logo = document.querySelector(".brand");
              logo?.classList.remove("brand-celebrate");

              // Force le redémarrage de l'animation
              void (logo as HTMLElement)?.offsetWidth;

              logo?.classList.add("brand-celebrate");

              setTimeout(() => {
                logo?.classList.remove("brand-celebrate");
              }, 900);
            } else {
              setActivePage("Accueil");
            }
          }}
          title="Retour à l'accueil"
        >
          <span className="brand-confetti confetti-1">✦</span>
          <span className="brand-confetti confetti-2">✦</span>
          <span className="brand-confetti confetti-3">✧</span>
          <span className="brand-confetti confetti-4">✦</span>
          <span className="brand-confetti confetti-5">✧</span>
          <span className="brand-confetti confetti-6">✦</span>

          <div className="brand-wordmark">
            <div className="brand-mark">
              <img
                src="/tailbluepdp.png"
                alt="TailBlue"
                className="brand-mark-image"
              />
            </div>

            <div className="brand-title-wrap">
              <div className="brand-title">TAILBLUE</div>
              <div className="brand-subtitle">VOTRE AVENTURE</div>
            </div>
          </div>
        </button>
        <nav className="sidebar-nav">
          <div className="main-navigation">
            {navButton(
              "🏠",
              "Accueil",
              homeSidebarBadge,
              "home-notifications",
              homeBadgeSignature,
            )}

            {navButton("👤", "Personnage")}
            {navButton("🎒", "Inventaire")}
          </div>

          <div className="navigation-separator" />

          <MenuSection
            title="Aventure"
            icon="⚔️"
            defaultOpen
            badge={questsSidebarBadge}
          >
            {navButton(
              "📜",
              "Quêtes",
              questsSidebarBadge,
              "quests",
              questsBadgeSignature,
            )}

            {navButton(
              "⛏️",
              "Mine",
              mineSidebarBadge,
              "mine",
              mineBadgeSignature,
            )}

            {navButton("🏹", "Hunt")}
            {navButton("🛠️", "Work")}
            {navButton("🗺️", "Conquêtes")}
          </MenuSection>

          <MenuSection title="Compagnons" icon="🐾">
            {navButton("🐯", "Pets")}
            {navButton("🏡", "Chenil")}
            {navButton("🥚", "Élevage")}
          </MenuSection>

          <MenuSection title="Monde" icon="🌍">
            {navButton("🏰", "Maison")}
            {navButton("🏛️", "Musée")}
            {navButton("🛒", "Marché")}
            {navButton("🏆", "Classement")}
            {navButton("🖼️", "Galerie")}
          </MenuSection>

          <MenuSection
            title="Informations"
            icon="📚"
            badge={informationSidebarBadge}
          >
            {navButton(
              "📖",
              "Wiki",
              wikiSidebarBadge,
              "wiki",
              wikiBadgeSignature,
            )}

            {navButton(
              "✨",
              "Nouveautés",
              updatesSidebarBadge,
              "updates",
              updatesBadgeSignature,
            )}

            {navButton("🛣️", "Roadmap")}
          </MenuSection>

          {isHime && (
            <>
              <div className="navigation-separator" />

              <MenuSection
                title="Hime Control"
                icon="👑"
                badge={himeSidebarBadge}
              >
                {navButton("📊", "Bilan général")}

                {navButton("📈", "Statistiques")}

                {navButton(
                  "💡",
                  "ShowIdées",
                  himeIdeasSidebarBadge,
                  "hime-ideas",
                  ideasBadgeSignature,
                )}

                {navButton("🧾", "Logs")}

                {navButton(
                  "🚨",
                  "Erreurs",
                  himeErrorsSidebarBadge,
                  "hime-errors",
                  errorsBadgeSignature,
                )}

                {navButton("🛡️", "Sécurité")}

                {navButton("👥", "Joueurs")}

                {navButton("💰", "Économie")}

                {navButton("💻", "État du système")}
              </MenuSection>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {navButton("⚙️", "Paramètres")}

          <div className="sidebar-user">
            <Avatar
              url={shellAvatarUrl}
              name={shellDisplayName}
              className="sidebar-avatar"
            />

            <div className="sidebar-user-info">
              <strong>{shellDisplayName}</strong>

              <span>
                {isHime
                  ? "Administratrice TailBlue"
                  : authUser
                    ? "Compte Discord connecté"
                    : homeApiConfigured
                      ? "Connexion requise"
                      : "Aperçu local"}
              </span>
            </div>

            <button
              className="sidebar-more"
              onClick={() => setActivePage("Paramètres")}
              title="Paramètres"
            >
              •••
            </button>
          </div>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          <div className="topbar-actions">
            <button
              className={`topbar-icon-button ${
                searchOpen ? "active" : ""
              }`}
              title="Recherche (Ctrl+K)"
              onClick={() => {
                setSearchOpen(true);
                setNotificationsOpen(false);
              }}
            >
              🔎
            </button>

            <button
              className={`topbar-icon-button notification-button ${
                notificationsOpen ? "active" : ""
              } ${
                !settings.notifications
                  ? "notifications-muted"
                  : ""
              }`}
              title={
                settings.notifications
                  ? "Notifications"
                  : "Notifications désactivées"
              }
              onClick={() => {
                setNotificationsOpen((open) => !open);
                setSearchOpen(false);
              }}
            >
              {settings.notifications ? "🔔" : "🔕"}

              {settings.notifications &&
                unreadNotifications > 0 && (
                  <span className="notification-count">
                    {unreadNotifications > 99
                      ? "99+"
                      : unreadNotifications}
                  </span>
                )}
            </button>

            <button
              className="profile-card profile-card-button"
              title="Ouvrir mon compte Discord"
              onClick={() => {
                setAccountMessage(null);
                setAccountOpen(true);
                setSearchOpen(false);
                setNotificationsOpen(false);
              }}
            >
              <Avatar
                url={shellAvatarUrl}
                name={shellDisplayName}
                className="profile-avatar"
              />

              <div>
                <strong>{shellDisplayName}</strong>
                <span>
                  {authUser
                    ? "Discord connecté"
                    : homeApiConfigured
                      ? "Se connecter"
                      : `Niveau ${home.profile.level}`}
                  {homeLoading ? " • synchronisation…" : ""}
                </span>
              </div>

              <span className="profile-card-chevron">›</span>
            </button>
          </div>
        </header>

        <SearchPalette
          open={searchOpen}
          isHime={isHime}
          onClose={() => setSearchOpen(false)}
          onNavigate={navigate}
        />

        <NotificationPanel
          open={notificationsOpen}
          enabled={settings.notifications}
          notifications={visibleNotifications}
          onClose={() => setNotificationsOpen(false)}
          onOpen={(notification) =>
            void openNotification(notification)
          }
          onMarkAll={() => void markAllNotifications()}
          onDismiss={dismissNotification}
          onClearRead={clearReadNotifications}
          onOpenSettings={() =>
            setActivePage("Paramètres")
          }
        />

        <NotificationToast
          notification={notificationToast}
          onOpen={(notification) =>
            void openNotification(notification)
          }
          onClose={() => setNotificationToast(null)}
        />

        <ActivityModal
          open={activityOpen}
          activities={home.recentActivity}
          onClose={() => setActivityOpen(false)}
          onNavigate={navigate}
        />

        <AccountModal
          open={accountOpen}
          authUser={authUser}
          apiEnabled={homeApiConfigured}
          authenticating={authenticating}
          loggingOut={loggingOut}
          message={accountMessage}
          onClose={() => setAccountOpen(false)}
          onLogin={() => void loginWithDiscord()}
          onLogout={() => void logout()}
        />

        <CompanionImageViewer
          open={companionImageOpen}
          imageUrl={home.companion?.imageUrl}
          emoji={home.companion?.emoji}
          name={home.companion?.displayName ?? "Compagnon"}
          speciesName={home.companion?.speciesName}
          onClose={() => setCompanionImageOpen(false)}
        />

        {activePage === "Accueil" ? (
          <>
            <section className="stats-grid">
              <article className="stat-card">
                <span className="stat-label">Niveau</span>
                <strong className="stat-value">
                  {home.profile.level}
                </strong>
                <span className="stat-detail">
                  ✨ {formatNumber(home.profile.xpCurrent)} /{" "}
                  {formatNumber(home.profile.xpNeeded)} XP
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">Cookies</span>
                <strong className="stat-value">
                  {formatNumber(home.profile.cookies)}
                </strong>
                <span className="stat-detail">
                  🍪 Cookies TailBlue
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">
                  Rang d'aventurier
                </span>
                <strong className="stat-value">
                  {rankText}
                </strong>
                <span className="stat-detail">
                  ⚔️ {rankDetail}
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">
                  Quêtes disponibles
                </span>

                <strong className="stat-value">
                  {home.quests.available}
                </strong>

                <span className="stat-detail">
                  {home.quests.activeName
                    ? `📜 Active : ${home.quests.activeName}`
                    : "📜 Tableau des quêtes"}
                </span>
              </article>
            </section>

            <section className="main-grid">
              <article className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">JOURNAL</p>
                    <h2>Activité récente</h2>
                  </div>

                  <button
                    className="small-button"
                    onClick={() => setActivityOpen(true)}
                  >
                    Voir tout
                  </button>
                </div>

                <div className="activity-list">
                  {home.recentActivity
                    .slice(0, 4)
                    .map((activity) => (
                      <button
                        key={activity.id}
                        className="activity-item activity-item-button"
                        disabled={!activity.targetPage}
                        onClick={() => {
                          if (activity.targetPage) {
                            navigate(activity.targetPage);
                          }
                        }}
                      >
                        <div className="activity-icon">
                          {activity.icon}
                        </div>

                        <div>
                          <strong>{activity.title}</strong>
                          <span>{activity.detail}</span>
                        </div>

                        <em>
                          {relativeTime(activity.createdAt)}
                        </em>
                      </button>
                    ))}

                  {!home.recentActivity.length && (
                    <div className="home-empty-line">
                      Aucun événement récent.
                    </div>
                  )}
                </div>
              </article>

              <article className="panel companion-panel">
                <p className="eyebrow">
                  COMPAGNON ACTUEL
                </p>

                {home.companion ? (
                  <>
                    <h2>{home.companion.displayName}</h2>

                    <button
                      className="companion-portrait companion-portrait-button"
                      onClick={() => setCompanionImageOpen(true)}
                      title={`Agrandir l'image de ${home.companion.displayName}`}
                      aria-label={`Agrandir l'image de ${home.companion.displayName}`}
                    >
                      {home.companion.imageUrl ? (
                        <img
                          src={home.companion.imageUrl}
                          alt={home.companion.displayName}
                        />
                      ) : (
                        <span>
                          {home.companion.emoji ?? "🐾"}
                        </span>
                      )}

                      <span className="companion-portrait-zoom">
                        🔎
                      </span>
                    </button>

                    <div className="companion-info">
                      <div>
                        <span>Niveau</span>
                        <strong>
                          {home.companion.level}
                        </strong>
                      </div>

                      <div>
                        <span>Affection</span>
                        <strong>
                          {home.companion.affection}%
                        </strong>
                      </div>

                      <div>
                        <span>Dégâts</span>
                        <strong>
                          {home.companion.damage ?? "—"}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="companion-empty">
                    <span>🐾</span>
                    <strong>Aucun compagnon actif</strong>
                    <button onClick={() => navigate("Pets")}>
                      Choisir mes compagnons
                    </button>
                  </div>
                )}
              </article>
            </section>

            <section className="bottom-grid">
              <article className="panel progress-panel">
                <div className="progress-block">
                  <div className="progress-title">
                    <span>❤️ Points de vie</span>
                    <strong>
                      {formatNumber(home.hp)} /{" "}
                      {formatNumber(home.maxHp)}
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                <div className="progress-block">
                  <div className="progress-title">
                    <span>⚡ Énergie</span>
                    <strong>
                      {Math.round(energyPercent)}%
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${energyPercent}%` }}
                    />
                  </div>
                </div>

                <div className="progress-block">
                  <div className="progress-title">
                    <span>✨ Expérience</span>
                    <strong>
                      {Math.round(xpPercent)}%
                    </strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${xpPercent}%` }}
                    />
                  </div>
                </div>
              </article>

              <article className="panel quick-panel">
                <p className="eyebrow">
                  ACCÈS RAPIDE
                </p>

                <h2>Continuer l'aventure</h2>

                <div className="quick-actions">
                  <button
                    onClick={() =>
                      setActivePage("Mine")
                    }
                  >
                    ⛏️ Aller à la mine
                  </button>

                  <button
                    onClick={() =>
                      setActivePage("Quêtes")
                    }
                  >
                    📜 Voir les quêtes
                  </button>

                  <button
                    onClick={() =>
                      setActivePage("Pets")
                    }
                  >
                    🐾 Mes compagnons
                  </button>

                  <button
                    onClick={() =>
                      setActivePage("Maison")
                    }
                  >
                    🏰 Ma résidence
                  </button>
                </div>
              </article>
            </section>

            <section className="suggestion-card">
              <div className="suggestion-icon">
                💡
              </div>

              <div className="suggestion-content">
                <p className="eyebrow">
                  COMMUNAUTÉ
                </p>

                <h2>Une idée pour TailBlue ?</h2>

                <p>
                  Une fonctionnalité, une amélioration ou
                  simplement une idée folle ? Partage-la
                  directement avec l'équipe TailBlue.
                </p>
              </div>

              <button
                className="suggestion-button"
                onClick={() =>
                  setActivePage("Faire une suggestion")
                }
              >
                💡 Faire part d'une suggestion
              </button>
            </section>

            {isHime && (
              <section className="hime-overview">
                <div className="hime-overview-header">
                  <div>
                    <p className="eyebrow">
                      👑 HIME CONTROL
                    </p>

                    <h2>À surveiller</h2>
                  </div>

                  <span className="admin-label">
                    Administratrice
                  </span>
                </div>

                <div className="hime-alert-grid">
                  <button
                    className="hime-alert-card idea-alert"
                    onClick={() =>
                      setActivePage("ShowIdées")
                    }
                  >
                    <span className="hime-alert-icon">
                      💡
                    </span>

                    <div>
                      <strong>{himeIdeas}</strong>
                      <span>idées à traiter</span>
                    </div>
                  </button>

                  <button
                    className="hime-alert-card urgent-alert"
                    onClick={() =>
                      setActivePage("Erreurs")
                    }
                  >
                    <span className="hime-alert-icon">
                      🚨
                    </span>

                    <div>
                      <strong>{himeErrors}</strong>
                      <span>erreur(s) à surveiller</span>
                    </div>
                  </button>

                  <button
                    className="hime-alert-card"
                    onClick={() =>
                      setActivePage("Bilan général")
                    }
                  >
                    <span className="hime-alert-icon">
                      📊
                    </span>

                    <div>
                      <strong>Voir</strong>
                      <span>bilan TailBlue</span>
                    </div>
                  </button>
                </div>
              </section>
            )}
          </>
        ) : activePage === "ShowIdées" ? (
          <HimeControlPage section="ShowIdées" />
        ) : activePage === "Faire une suggestion" ? (
          <section className="suggestion-page">
            <div className="suggestion-form-card">
              <div className="big-suggestion-icon">
                💡
              </div>

              <p className="eyebrow">
                TAILBLUE COMMUNITY
              </p>

              <h2>Faire part d'une suggestion</h2>

              <p className="suggestion-description">
                Cette interface sera reliée plus tard au
                même système que la commande Discord
                <strong> !idee</strong>.
              </p>

              <label>
                Titre de l'idée
                <input
                  type="text"
                  placeholder="Ex. Ajouter des trophées..."
                />
              </label>

              <label>
                Votre suggestion
                <textarea
                  placeholder="Décrivez votre idée..."
                  rows={7}
                />
              </label>

              <div className="suggestion-form-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setActivePage("Accueil")
                  }
                >
                  Annuler
                </button>

                <button className="primary-button">
                  Envoyer la suggestion
                </button>
              </div>
            </div>
          </section>

        ) : activePage === "Pets" ? (
            <PetsPage />

      ) : activePage === "Maison" ? (
           <HousePage />

      ) : activePage === "Marché" ? (
          <MarketPage />
      ) : activePage === "Personnage" ? (
          <CharacterPage />

        ) : activePage === "Inventaire" ? (
          <InventoryPage />
        ) : activePage === "Quêtes" ? (
          <QuestsPage />

        ) : activePage === "Mine" ? (
          <MinePage />
        ) : activePage === "Hunt" ? (
          <HuntPage />

        ) : activePage === "Work" ? (
          <WorkPage />
        ) : isTailBlueExtraPage(activePage) ? (
          <TailBlueExtraPages activePage={activePage} />


  ) : (

          <section className="page-placeholder">
            <div className="placeholder-icon">

              {activePage === "Wiki"
                ? "📖"
                : "✨"}
            </div>

            <p className="eyebrow">TAILBLUE</p>

            <h2>{activePage}</h2>

            <p>
              Cette section est maintenant reliée à la
              navigation. Son contenu TailBlue sera ajouté
              progressivement.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setActivePage("Accueil")
              }
            >
              Retour au Dashboard
            </button>
          </section>

        )}
      </main>
    </div>
  );
}

export default App;