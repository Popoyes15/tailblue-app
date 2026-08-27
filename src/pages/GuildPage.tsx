// TAILBLUE_GUILD_DESKTOP_V2_20260824
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  characterApiConfigured,
  loadCharacterDetail,
} from "../api/characterApi";
import type {
  CharacterGuildDetail,
  CharacterGuildHallCollection,
} from "../types/character";
import TailBlueImageViewer from "../components/TailBlueImageViewer";
import {
  getGuildAudioSettings,
  installGuildAudioUnlock,
  setGuildAudioActive,
  setGuildAudioSettings,
  type GuildAudioSettings,
} from "../services/guildAudioService"; // TAILBLUE_POLISH_PACK_V3_20260826
import GuildBestiary from "./GuildBestiary"; // TAILBLUE_BESTIARY_DESKTOP_V1_20260826
import GuildworkPanel from "./GuildworkPanel"; // TAILBLUE_GUILDWORK_DESKTOP_V1_20260826

import "./GuildPage.css";

type GuildSection =
  | "guild"
  | "hall"
  | "guildwork"
  | "guildhunt"
  | "expedition"
  | "bestiary";

type Artwork = {
  url: string;
  title: string;
} | null;

/*
 * Important anti-flash rule:
 * when GuildPage is unmounted because the user visits another TailBlue page,
 * the last REAL API guild payload stays in module memory. On return the page
 * paints instantly, then refreshes silently in the background.
 */
let guildMemoryCache: CharacterGuildDetail | null = null;

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-CH").format(
    Math.max(0, Number(value ?? 0)),
  );
}

function progress(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, (value / max) * 100),
  );
}

function initials(name: string) {
  const clean = String(name || "?").trim();
  if (!clean) return "?";

  return clean
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function MemberAvatar({
  name,
  url,
}: {
  name: string;
  url?: string | null;
}) {
  if (url) {
    return (
      <img
        className="tb-guild-member-avatar"
        src={url}
        alt={name}
      />
    );
  }

  return (
    <div className="tb-guild-member-avatar tb-guild-member-fallback">
      {initials(name)}
    </div>
  );
}

function ConstructionView({
  icon,
  eyebrow,
  title,
  description,
  actionLabel,
}: {
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <section className="tb-guild-construction">
      <div className="tb-guild-construction-orb">
        <span>{icon}</span>
      </div>

      <div className="tb-guild-construction-copy">
        <p className="tb-guild-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>

        <span className="tb-guild-construction-pill">
          🚧 En travaux
        </span>

        <p>{description}</p>

        {actionLabel && (
          <button
            className="tb-guild-history-button"
            disabled
            title="Cette vue sera branchée à une mise à jour ultérieure."
          >
            {actionLabel}
            <span>→</span>
          </button>
        )}
      </div>
    </section>
  );
}

function ArtworkButton({
  imageUrl,
  alt,
  onOpen,
  className = "",
}: {
  imageUrl?: string | null;
  alt: string;
  onOpen: () => void;
  className?: string;
}) {
  if (!imageUrl) return null;

  return (
    <button
      type="button"
      className={`tb-guild-artwork-button ${className}`.trim()}
      onClick={onOpen}
      aria-label={`Agrandir ${alt}`}
      title="Cliquer pour agrandir"
    >
      <img src={imageUrl} alt={alt} />
      <span className="tb-guild-artwork-badge">
        ⛶ Agrandir
      </span>
    </button>
  );
}

export default function GuildPage() {
  const [section, setSection] =
    useState<GuildSection>("guild");

  const [guild, setGuild] =
    useState<CharacterGuildDetail | null>(
      () => guildMemoryCache,
    );

  const [loading, setLoading] = useState(
    () =>
      characterApiConfigured &&
      guildMemoryCache === null,
  );

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [selectedCollectionId, setSelectedCollectionId] =
    useState<string | null>(null);

  const [artwork, setArtwork] =
    useState<Artwork>(null);

  const [guildAudioSettings, setGuildAudioSettingsState] =
    useState<GuildAudioSettings>(() => getGuildAudioSettings());

  const [audioMenuOpen, setAudioMenuOpen] =
    useState(false);

  useEffect(() => {
    setGuildAudioActive(true);
    const removeUnlock = installGuildAudioUnlock();

    return () => {
      removeUnlock();
      setGuildAudioActive(false);
    };
  }, []);

  const updateGuildAudio = (
    patch: Partial<GuildAudioSettings>,
  ) => {
    const next = setGuildAudioSettings(patch);
    setGuildAudioSettingsState(next);
  };

  const refresh = useCallback(
    async (quiet = false) => {
      if (!characterApiConfigured) {
        setLoading(false);
        return;
      }

      const hasRealCache = guildMemoryCache !== null;

      if (quiet || hasRealCache) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const detail =
          await loadCharacterDetail("guild");

        if (detail?.kind === "guild") {
          guildMemoryCache = detail;
          setGuild(detail);
          setError(null);
        } else {
          guildMemoryCache = null;
          setGuild(null);
          setError(null);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Impossible de charger la guilde.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    /*
     * Cached real data is painted immediately. This fetch never replaces it
     * with a loader: it is only a silent canonical refresh.
     */
    void refresh(guildMemoryCache !== null);

    const timer = window.setInterval(() => {
      void refresh(true);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [refresh]);

  const collections =
    guild?.hall?.collections ?? [];

  useEffect(() => {
    if (!collections.length) {
      setSelectedCollectionId(null);
      return;
    }

    setSelectedCollectionId((current) =>
      current &&
      collections.some(
        (collection) => collection.id === current,
      )
        ? current
        : collections[0].id,
    );
  }, [collections]);

  const selectedCollection =
    useMemo<CharacterGuildHallCollection | null>(
      () =>
        collections.find(
          (collection) =>
            collection.id === selectedCollectionId,
        ) ??
        collections[0] ??
        null,
      [collections, selectedCollectionId],
    );

  const openArtwork = (
    url: string | null | undefined,
    title: string,
  ) => {
    if (!url) return;
    setArtwork({ url, title });
  };

  if (!characterApiConfigured) {
    return (
      <section className="tb-guild-state">
        <div>🔌</div>
        <h2>Connexion TailBlue requise</h2>
        <p>
          La Guilde n’utilise aucune donnée fictive.
          Configure l’API officielle pour afficher
          l’état réel partagé avec Discord.
        </p>
      </section>
    );
  }

  if (loading && !guild) {
    return (
      <section className="tb-guild-state">
        <div className="tb-guild-loader">🏰</div>
        <h2>Ouverture des registres…</h2>
        <p>
          Premier chargement des données réelles de ta guilde.
        </p>
      </section>
    );
  }

  if (error && !guild) {
    return (
      <section className="tb-guild-state tb-guild-state-error">
        <div>⚠️</div>
        <h2>La Guilde ne répond pas</h2>
        <p>{error}</p>
        <button onClick={() => void refresh(false)}>
          Réessayer
        </button>
      </section>
    );
  }

  if (!guild) {
    return (
      <section className="tb-guild-state">
        <div>🏕️</div>
        <p className="tb-guild-eyebrow">
          MONDE • GUILDE
        </p>
        <h2>Aucune guilde</h2>
        <p>
          Ton profil TailBlue n’appartient encore
          à aucune guilde.
        </p>
      </section>
    );
  }

  const guildProgress = progress(
    guild.xp,
    guild.xpNeeded,
  );

  const hall = guild.hall;

  return (
    <>
      <section className="tb-guild-page">
        <header className="tb-guild-page-header">
          <div>
            <p className="tb-guild-eyebrow">
              MONDE • GUILDE
            </p>
            <div className="tb-guild-title-line">
              <h1>{guild.name}</h1>
              <span className="tb-guild-live-pill">
                <i />
                Discord synchronisé
              </span>
            </div>
            <p>
              Registre vivant du Royaume, relié aux mêmes données
              que le bot.
            </p>
          </div>

          <div className="tb-guild-header-actions">
            <div className="tb-guild-sound-control">
              <button
                type="button"
                className="tb-guild-sound-trigger"
                onClick={() => setAudioMenuOpen((value) => !value)}
                aria-expanded={audioMenuOpen}
              >
                {guildAudioSettings.musicEnabled ||
                guildAudioSettings.pageTurnsEnabled
                  ? "🔊"
                  : "🔇"}{" "}
                Sons
              </button>

              {audioMenuOpen && (
                <div className="tb-guild-sound-popover">
                  <button
                    type="button"
                    className={guildAudioSettings.musicEnabled ? "" : "off"}
                    onClick={() =>
                      updateGuildAudio({
                        musicEnabled: !guildAudioSettings.musicEnabled,
                      })
                    }
                  >
                    <span>🎵 Musique de la Mine</span>
                    <b>{guildAudioSettings.musicEnabled ? "ON" : "OFF"}</b>
                  </button>

                  <button
                    type="button"
                    className={guildAudioSettings.pageTurnsEnabled ? "" : "off"}
                    onClick={() =>
                      updateGuildAudio({
                        pageTurnsEnabled: !guildAudioSettings.pageTurnsEnabled,
                      })
                    }
                  >
                    <span>📄 Pages du Bestiaire</span>
                    <b>{guildAudioSettings.pageTurnsEnabled ? "ON" : "OFF"}</b>
                  </button>

                  <small>
                    Réglages indépendants • mémorisés par TailBlue.
                  </small>
                </div>
              )}
            </div>

            <button
              className="tb-guild-refresh"
              onClick={() => void refresh(true)}
              disabled={refreshing}
            >
              <span className={refreshing ? "spin" : ""}>
                ↻
              </span>
              {refreshing ? "Synchronisation…" : "Actualiser"}
            </button>
          </div>
        </header>

        {error && (
          <div className="tb-guild-soft-error">
            ⚠️ Dernière actualisation impossible : {error}
          </div>
        )}

        <div className="tb-guild-layout">
          <aside className="tb-guild-nav">
            <div className="tb-guild-nav-heading">
              <span>REGISTRE</span>
              <small>{guild.name}</small>
            </div>

            <div className="tb-guild-nav-duo">
              <button
                className={section === "guild" ? "active" : ""}
                onClick={() => setSection("guild")}
              >
                <span>🏰</span>
                <strong>Guilde</strong>
              </button>

              <button
                className={section === "hall" ? "active" : ""}
                onClick={() => setSection("hall")}
              >
                <span>🏛️</span>
                <strong>Hall</strong>
              </button>
            </div>

            <div className="tb-guild-nav-separator" />

            <button
              className={section === "guildwork" ? "active" : ""}
              onClick={() => setSection("guildwork")}
            >
              <span>⚒️</span>
              <strong>Guildwork</strong>
            </button>

            <button
              className={section === "guildhunt" ? "active" : ""}
              onClick={() => setSection("guildhunt")}
            >
              <span>⚔️</span>
              <strong>Guildhunt</strong>
              <em>En travaux</em>
            </button>

            <button
              className={section === "expedition" ? "active" : ""}
              onClick={() => setSection("expedition")}
            >
              <span>🗺️</span>
              <strong>Expédition</strong>
              <em>En travaux</em>
            </button>

            <button
              className={section === "bestiary" ? "active" : ""}
              onClick={() => setSection("bestiary")}
            >
              <span>📖</span>
              <strong>Bestiaire</strong>
            </button>
          </aside>

          <main className="tb-guild-content">
            {section === "guild" && (
              <>
                <article className="tb-guild-hero">
                  {guild.imageUrl ? (
                    <ArtworkButton
                      imageUrl={guild.imageUrl}
                      alt={`Aperçu de ${guild.name}`}
                      onOpen={() =>
                        openArtwork(
                          guild.imageUrl,
                          `Guilde ${guild.name}`,
                        )
                      }
                      className="fill"
                    />
                  ) : (
                    <div className="tb-guild-hero-fallback">
                      🏰
                    </div>
                  )}

                  <div className="tb-guild-hero-shade" />

                  <div className="tb-guild-hero-copy">
                    <span className="tb-guild-kicker">
                      GUILDE • NIVEAU {guild.level}
                    </span>
                    <h2>{guild.name}</h2>
                    <p>
                      Fondée par{" "}
                      <strong>
                        {guild.founderName ?? "un aventurier"}
                      </strong>
                    </p>
                  </div>
                </article>

                <section className="tb-guild-overview-strip">
                  <div>
                    <span>🏆 Niveau</span>
                    <strong>{guild.level}</strong>
                    <small>
                      {formatNumber(guild.xp)} /{" "}
                      {formatNumber(guild.xpNeeded)} XP
                    </small>
                  </div>

                  <div>
                    <span>💰 Trésor</span>
                    <strong>{formatNumber(guild.treasure)}</strong>
                    <small>cookies de guilde</small>
                  </div>

                  <div>
                    <span>👥 Membres</span>
                    <strong>
                      {guild.members.length}/{guild.maxMembers}
                    </strong>
                    <small>aventuriers</small>
                  </div>

                  <div>
                    <span>🏛️ Hall</span>
                    <strong>{hall?.level ?? 1}</strong>
                    <small>
                      {hall?.name ?? "Hall des Reliques"}
                    </small>
                  </div>
                </section>

                <article className="tb-guild-progress-card">
                  <div>
                    <div>
                      <p className="tb-guild-eyebrow">
                        ASCENSION DE LA GUILDE
                      </p>
                      <strong>
                        Niveau {guild.level}
                      </strong>
                    </div>
                    <span>
                      {formatNumber(guild.xp)} /{" "}
                      {formatNumber(guild.xpNeeded)} XP
                    </span>
                  </div>

                  <div className="tb-guild-progress-track">
                    <span
                      style={{
                        width: `${guildProgress}%`,
                      }}
                    />
                  </div>
                </article>

                <article className="tb-guild-hall-preview">
                  <div className="tb-guild-hall-preview-image">
                    {hall?.imageUrl ? (
                      <ArtworkButton
                        imageUrl={hall.imageUrl}
                        alt={hall.name}
                        onOpen={() =>
                          openArtwork(
                            hall.imageUrl,
                            hall.name,
                          )
                        }
                        className="fill"
                      />
                    ) : (
                      <span>🏛️</span>
                    )}
                  </div>

                  <div className="tb-guild-hall-preview-copy">
                    <p className="tb-guild-eyebrow">
                      HALL DES RELIQUES
                    </p>
                    <h3>
                      {hall?.name ?? "Hall des Reliques"}
                    </h3>
                    <p>
                      {hall?.description ??
                        "Le Hall conserve les découvertes et les victoires de la guilde."}
                    </p>

                    <div className="tb-guild-hall-mini-stats">
                      <span>
                        🏆 {formatNumber(hall?.prestige ?? hall?.xp)} prestige
                      </span>
                      <span>
                        🏺 {formatNumber(hall?.relicsOwned)}/
                        {formatNumber(hall?.relicsTotal)} reliques
                      </span>
                    </div>

                    <button
                      className="tb-guild-primary-action"
                      onClick={() => setSection("hall")}
                    >
                      Entrer dans le Hall
                      <span>→</span>
                    </button>
                  </div>
                </article>

                <article className="tb-guild-members-card">
                  <header>
                    <div>
                      <p className="tb-guild-eyebrow">
                        COMPAGNIE
                      </p>
                      <h3>Membres de la guilde</h3>
                    </div>
                    <span>
                      {guild.members.length}/{guild.maxMembers}
                    </span>
                  </header>

                  <div className="tb-guild-members-grid">
                    {guild.members.map((member) => (
                      <div
                        className="tb-guild-member"
                        key={member.id}
                      >
                        <MemberAvatar
                          name={member.displayName}
                          url={member.avatarUrl}
                        />

                        <div>
                          <strong>
                            {member.displayName}
                          </strong>
                          <span>
                            {member.founder
                              ? "👑 Fondateur"
                              : "Membre"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              </>
            )}

            {section === "hall" && (
              <>
                <article className="tb-hall-hero">
                  {hall?.imageUrl ? (
                    <ArtworkButton
                      imageUrl={hall.imageUrl}
                      alt={hall.name}
                      onOpen={() =>
                        openArtwork(
                          hall.imageUrl,
                          hall.name,
                        )
                      }
                      className="fill"
                    />
                  ) : (
                    <div className="tb-guild-hero-fallback">
                      🏛️
                    </div>
                  )}

                  <div className="tb-guild-hero-shade hall" />

                  <div className="tb-hall-hero-copy">
                    <span className="tb-guild-kicker gold">
                      HALL DES RELIQUES
                    </span>
                    <h2>
                      {hall?.name ?? "Hall des Reliques"}
                    </h2>
                    <p>
                      {hall?.description ??
                        "Les vitrines attendent les découvertes de la guilde."}
                    </p>
                  </div>
                </article>

                <section className="tb-hall-ledger">
                  <div>
                    <span>Prestige</span>
                    <strong>
                      {formatNumber(hall?.prestige ?? hall?.xp)}
                    </strong>
                    <small>🏆 rayonnement du Hall</small>
                  </div>
                  <div>
                    <span>Reliques</span>
                    <strong>
                      {formatNumber(hall?.relicsOwned)}/
                      {formatNumber(hall?.relicsTotal)}
                    </strong>
                    <small>🏺 découvertes</small>
                  </div>
                  <div>
                    <span>Collections</span>
                    <strong>
                      {formatNumber(hall?.collectionsCompleted)}/
                      {formatNumber(hall?.collectionsTotal)}
                    </strong>
                    <small>📚 complétées</small>
                  </div>
                  <div>
                    <span>Niveau</span>
                    <strong>{hall?.level ?? 1}</strong>
                    <small>🏛️ Hall actuel</small>
                  </div>
                </section>

                {!collections.length ? (
                  <article className="tb-hall-empty">
                    <span>🏺</span>
                    <h3>Aucune collection disponible</h3>
                    <p>
                      Le registre du Hall ne contient encore
                      aucune collection sérialisée.
                    </p>
                  </article>
                ) : (
                  <article className="tb-hall-library">
                    <header className="tb-hall-library-header">
                      <div>
                        <p className="tb-guild-eyebrow">
                          ARCHIVES DU HALL
                        </p>
                        <h3>Collections de reliques</h3>
                        <p>
                          Choisis une collection pour examiner ses vitrines.
                          Les reliques inconnues restent scellées.
                        </p>
                      </div>

                      <span className="tb-hall-library-count">
                        {formatNumber(hall?.relicsOwned)}/
                        {formatNumber(hall?.relicsTotal)}
                      </span>
                    </header>

                    <nav className="tb-hall-collection-tabs">
                      {collections.map((collection) => (
                        <button
                          key={collection.id}
                          className={
                            selectedCollection?.id === collection.id
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setSelectedCollectionId(
                              collection.id,
                            )
                          }
                        >
                          <span className="tb-hall-collection-dot">
                            {collection.complete ? "✦" : "•"}
                          </span>
                          <span className="tb-hall-collection-copy">
                            <strong>{collection.name}</strong>
                            <small>
                              {collection.owned}/{collection.total}
                              {collection.complete
                                ? " • Complète"
                                : ""}
                            </small>
                          </span>
                        </button>
                      ))}
                    </nav>

                    {selectedCollection && (
                      <section className="tb-hall-selected-collection">
                        <header>
                          <div>
                            <p className="tb-guild-eyebrow">
                              COLLECTION
                            </p>
                            <h3>
                              {selectedCollection.name}
                            </h3>
                            <p>
                              {selectedCollection.description}
                            </p>
                          </div>

                          <div className="tb-hall-progress-badge">
                            <strong>
                              {selectedCollection.owned}/
                              {selectedCollection.total}
                            </strong>
                            <span>découvertes</span>
                          </div>
                        </header>

                        <div className="tb-hall-progress">
                          <span
                            style={{
                              width: `${progress(
                                selectedCollection.owned,
                                selectedCollection.total,
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="tb-hall-relic-grid">
                          {selectedCollection.relics.map(
                            (relic, index) => (
                              <article
                                key={relic.slotId}
                                className={`tb-hall-relic ${
                                  relic.owned
                                    ? "owned"
                                    : "locked"
                                }`}
                              >
                                <div className="tb-hall-relic-top">
                                  <span className="tb-hall-relic-index">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <div className="tb-hall-relic-icon">
                                    {relic.owned
                                      ? relic.emoji
                                      : "❓"}
                                  </div>
                                </div>

                                {relic.owned ? (
                                  <>
                                    <span className="tb-hall-rarity">
                                      {relic.rarityName ??
                                        "Rareté inconnue"}
                                    </span>
                                    <h4>
                                      {relic.name ?? "Relique"}
                                    </h4>

                                    <p>
                                      {relic.description ||
                                        "Aucune description."}
                                    </p>

                                    <footer>
                                      <span>
                                        🏆 +
                                        {formatNumber(relic.prestige)}
                                      </span>
                                      <span>Découverte</span>
                                    </footer>
                                  </>
                                ) : (
                                  <>
                                    <span className="tb-hall-rarity locked">
                                      🔒 NON DÉCOUVERTE
                                    </span>
                                    <h4>???</h4>

                                    <p>
                                      Son histoire reste encore
                                      inconnue.
                                    </p>

                                    <footer>
                                      <span>Archives scellées</span>
                                    </footer>
                                  </>
                                )}
                              </article>
                            ),
                          )}
                        </div>

                        <p className="tb-hall-spoiler-rule">
                          🔐 Le backend ne révèle aucune donnée
                          cachée d’une relique non découverte.
                        </p>
                      </section>
                    )}
                  </article>
                )}
              </>
            )}
          {section === "guildwork" && (
            <GuildworkPanel />
          )}


            {section === "guildhunt" && (
              <ConstructionView
                icon="⚔️"
                eyebrow="GUILDHUNT"
                title="Les chasses de guilde arrivent plus tard"
                description="Le gameplay GuildHunt reste réservé à une future mise à jour. Aucune fausse chasse n’est générée avant sa vraie connexion au moteur TailBlue."
                actionLabel="📖 Chronique de chasses"
              />
            )}

            {section === "expedition" && (
              <ConstructionView
                icon="🗺️"
                eyebrow="EXPÉDITION"
                title="Le Hall prépare déjà la suite"
                description="Les Expéditions utiliseront plus tard ce même Hall et ses reliques. Le gameplay reste volontairement en construction pour la première sortie."
                actionLabel="📜 Légendes d’expédition"
              />
            )}
            {section === "bestiary" && (
              <GuildBestiary members={guild.members} />
            )}
          </main>
        </div>
      </section>

      <TailBlueImageViewer
        open={Boolean(artwork)}
        imageUrl={artwork?.url ?? null}
        title={artwork?.title ?? ""}
        onClose={() => setArtwork(null)}
      />
    </>
  );
}
