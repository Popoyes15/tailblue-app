// TAILBLUE_BESTIARY_DESKTOP_V3_POLISH_20260826
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

import {
  bestiaryApiConfigured,
  getCachedGuildBestiary,
  loadGuildBestiary,
} from "../api/bestiaryApi";
import type { CharacterGuildMember } from "../types/character";
import type {
  BestiaryFamily,
  BestiaryMonsterSlot,
  GuildBestiarySnapshot,
} from "../types/bestiary";
import TailBlueImageViewer from "../components/TailBlueImageViewer";
import { playBestiaryPageTurn } from "./bestiaryPageSound";

import "./GuildBestiary.css";

type BookMode = "family" | "monster";
type BookSection = "overview" | "combat" | "chronicle" | "loot";
type TurnDirection = "next" | "previous";

type Artwork = {
  url: string;
  title: string;
} | null;

function renderBookMarkup(value: string): ReactNode[] {
  const source = String(value ?? "");
  const tokens = source.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens
    .filter(Boolean)
    .map((token, index) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={`bold:${index}`}>
            {token.slice(2, -2)}
          </strong>
        );
      }

      if (
        token.startsWith("*") &&
        token.endsWith("*") &&
        token.length > 2
      ) {
        return (
          <em key={`italic:${index}`}>
            {token.slice(1, -1)}
          </em>
        );
      }

      return token;
    });
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("fr-CH").format(
    Math.max(0, Number(value ?? 0)),
  );
}

function formatDate(value?: string | null) {
  if (!value) return "date inconnue";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-CH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function ratio(value: number, total: number) {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (value / total) * 100));
}

function SectionLock({
  label,
  required,
  remaining,
}: {
  label: string;
  required: number;
  remaining: number;
}) {
  return (
    <div className="tb-book-lock">
      <div className="tb-book-lock-seal">🔒</div>
      <div>
        <span>{label}</span>
        <strong>
          Encore {remaining} victoire{remaining > 1 ? "s" : ""}
        </strong>
        <p>
          Cette partie des archives se déverrouille à{" "}
          {required} victoire{required > 1 ? "s" : ""}.
        </p>
      </div>
    </div>
  );
}

function PillList({
  values,
  empty = "Aucune connue",
}: {
  values: string[];
  empty?: string;
}) {
  if (!values.length) {
    return <span className="tb-book-empty-inline">{empty}</span>;
  }

  return (
    <div className="tb-book-pills">
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}

function BookProgress({
  value,
  total,
}: {
  value: number;
  total: number;
}) {
  return (
    <div className="tb-book-progress">
      <i style={{ width: `${ratio(value, total)}%` }} />
    </div>
  );
}

function MonsterThumb({
  monster,
  onZoom,
}: {
  monster: BestiaryMonsterSlot;
  onZoom: () => void;
}) {
  if (!monster.imageUrl) {
    return (
      <div className="tb-book-monster-thumb fallback">
        {monster.emoji ?? "👾"}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="tb-book-monster-thumb"
      onClick={(event) => {
        event.stopPropagation();
        onZoom();
      }}
      title="Agrandir l'illustration"
      aria-label={`Agrandir ${monster.name ?? "la créature"}`}
    >
      <img src={monster.imageUrl} alt={monster.name ?? "Créature"} />
      <span>⛶</span>
    </button>
  );
}

function OverviewPage({
  monster,
  firstDefeaterName,
}: {
  monster: BestiaryMonsterSlot;
  firstDefeaterName?: string | null;
}) {
  const study = monster.study;
  const record = monster.record;
  const variants = monster.variants ?? [];

  if (!study || !record) return null;

  return (
    <section className="tb-book-section">
      <div className="tb-book-overview-stats">
        <article>
          <span>👁️ Rencontres</span>
          <strong>{formatNumber(record.encounters)}</strong>
        </article>
        <article>
          <span>🏆 Victoires</span>
          <strong>{formatNumber(record.victories)}</strong>
        </article>
        <article>
          <span>💀 Défaites</span>
          <strong>{formatNumber(record.defeats)}</strong>
        </article>
        <article>
          <span>🏃 Fuites</span>
          <strong>{formatNumber(record.escapes)}</strong>
        </article>
      </div>

      <article className="tb-book-study">
        <header>
          <div>
            <span>ÉTUDE COLLECTIVE</span>
            <strong>
              {study.value}/{study.target}
            </strong>
          </div>
          <small>{study.percent}%</small>
        </header>

        <BookProgress value={study.value} total={study.target} />

        {study.complete ? (
          <p className="complete">
            ✦ Les archives de cette créature sont entièrement complétées.
          </p>
        ) : monster.nextUnlock ? (
          <p>
            Prochaine découverte :{" "}
            <strong>{monster.nextUnlock.label}</strong> à{" "}
            {monster.nextUnlock.required} victoire
            {monster.nextUnlock.required > 1 ? "s" : ""}.
          </p>
        ) : null}
      </article>

      {monster.isBoss && monster.firstDefeat && (
        <article className="tb-book-boss-memory">
          <span>👑</span>
          <div>
            <small>PREMIÈRE VICTOIRE DE LA GUILDE</small>
            <strong>
              {firstDefeaterName ?? "Un membre de la guilde"}
            </strong>
            <p>{formatDate(monster.firstDefeat.at)}</p>
          </div>
        </article>
      )}

      <article className="tb-book-variants">
        <header>
          <div>
            <span className="tb-book-kicker">VARIANTES OBSERVÉES</span>
            <h4>Formes rencontrées</h4>
          </div>
          <small>
            {variants.filter((variant) => variant.seen).length}/
            {variants.length}
          </small>
        </header>

        {variants.length ? (
          <div className="tb-book-variant-grid">
            {variants.map((variant) => (
              <article
                key={variant.id}
                className={
                  variant.defeated
                    ? "defeated"
                    : variant.seen
                      ? "seen"
                      : "unknown"
                }
              >
                <span>
                  {variant.defeated
                    ? "✓"
                    : variant.seen
                      ? "👁"
                      : "?"}
                </span>
                <div>
                  <strong>{variant.name}</strong>
                  <small>
                    {variant.defeated
                      ? "Vaincue"
                      : variant.seen
                        ? "Rencontrée"
                        : "Inconnue"}
                  </small>
                  {variant.seen && <p>{variant.description}</p>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="tb-book-empty-note">
            Aucune variante spéciale enregistrée.
          </div>
        )}
      </article>

      {(monster.contributorCount ?? 0) > 0 && (
        <p className="tb-book-contributors">
          🤝 {monster.contributorCount} membre
          {(monster.contributorCount ?? 0) > 1 ? "s" : ""} de la guilde
          ont contribué aux victoires sur cette créature.
        </p>
      )}
    </section>
  );
}

function CombatPage({ monster }: { monster: BestiaryMonsterSlot }) {
  const stats = monster.statistics;
  const behavior = monster.behavior;
  const weaknesses = monster.weaknesses;

  return (
    <section className="tb-book-section tb-book-combat">
      <article className="tb-book-combat-block">
        <header>
          <span>📊</span>
          <div>
            <small>ANATOMIE & PUISSANCE</small>
            <h4>Statistiques</h4>
          </div>
        </header>

        {!stats?.unlocked || !stats.data ? (
          <SectionLock
            label="Statistiques"
            required={stats?.required ?? 0}
            remaining={stats?.remaining ?? 0}
          />
        ) : (
          <>
            <div className="tb-book-stat-grid">
              <div><span>❤️ PV</span><strong>{stats.data.hp ?? "?"}</strong></div>
              <div><span>🗡️ Attaque</span><strong>{stats.data.attack ?? "?"}</strong></div>
              <div><span>🛡️ Défense</span><strong>{stats.data.defense ?? "?"}</strong></div>
              <div><span>💥 Critique</span><strong>{stats.data.crit}</strong></div>
              <div><span>🌪️ Esquive</span><strong>{stats.data.dodge}</strong></div>
              <div><span>💨 Vitesse</span><strong>{stats.data.speed ?? "?"}</strong></div>
            </div>

            <div className="tb-book-combat-meta">
              <span>✨ {stats.data.element}</span>
              <span>📚 {stats.data.rarity}</span>
              <span>🎁 {formatNumber(stats.data.xpReward)} XP</span>
              <span>
                🍪 {formatNumber(stats.data.cookiesMin)}–
                {formatNumber(stats.data.cookiesMax)}
              </span>
            </div>
          </>
        )}
      </article>

      <article className="tb-book-combat-block">
        <header>
          <span>🧠</span>
          <div>
            <small>OBSERVATIONS DE TERRAIN</small>
            <h4>Comportement</h4>
          </div>
        </header>

        {!behavior?.unlocked || !behavior.data ? (
          <SectionLock
            label="Comportement"
            required={behavior?.required ?? 0}
            remaining={behavior?.remaining ?? 0}
          />
        ) : (
          <div className="tb-book-prose-columns">
            <article>
              <span>Profil</span>
              <strong>{behavior.data.profile}</strong>
              <p>{behavior.data.description}</p>
            </article>
            <article>
              <span>Apparition</span>
              <p>{behavior.data.appearance}</p>
            </article>
            <article>
              <span>À sa défaite</span>
              <p>{behavior.data.defeatText}</p>
            </article>
          </div>
        )}
      </article>

      <article className="tb-book-combat-block">
        <header>
          <span>⚡</span>
          <div>
            <small>AFFINITÉS ÉLÉMENTAIRES</small>
            <h4>Faiblesses & résistances</h4>
          </div>
        </header>

        {!weaknesses?.unlocked || !weaknesses.data ? (
          <SectionLock
            label="Affinités"
            required={weaknesses?.required ?? 0}
            remaining={weaknesses?.remaining ?? 0}
          />
        ) : (
          <div className="tb-book-affinity-grid">
            <div>
              <span>⚡ Faiblesses</span>
              <PillList values={weaknesses.data.weaknesses} />
            </div>
            <div>
              <span>🛡️ Résistances</span>
              <PillList values={weaknesses.data.resistances} />
            </div>
            <div>
              <span>✦ Immunités</span>
              <PillList values={weaknesses.data.immunities} />
            </div>
          </div>
        )}
      </article>
    </section>
  );
}

function ChroniclePage({ monster }: { monster: BestiaryMonsterSlot }) {
  const lore = monster.lore;

  if (!lore?.unlocked || !lore.data) {
    return (
      <section className="tb-book-section">
        <SectionLock
          label="Chronique"
          required={lore?.required ?? 0}
          remaining={lore?.remaining ?? 0}
        />
      </section>
    );
  }

  const paragraphs = lore.data.story
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section className="tb-book-section tb-book-chronicle">
      <header className="tb-book-chronicle-heading">
        <span>📜</span>
        <div>
          <small>EXTRAIT DES ARCHIVES DU BESTIAIRE</small>
          <h4>Chronique de {monster.name}</h4>
        </div>
      </header>

      <article className="tb-book-story">
        {paragraphs.map((paragraph, index) => (
          <p key={`${monster.slotId}:story:${index}`}>
            {renderBookMarkup(paragraph)}
          </p>
        ))}
      </article>

      <div className="tb-book-classification">
        {Object.entries(lore.data.classification).map(([key, value]) => (
          <div key={key}>
            <span>{key}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="tb-book-family-lore">
        <article>
          <span>🏛️ Origines</span>
          <p>{renderBookMarkup(lore.data.familyOrigin)}</p>
        </article>
        <article>
          <span>🗺️ Habitat</span>
          <p>{renderBookMarkup(lore.data.familyHabitat)}</p>
        </article>
        <article>
          <span>🕯️ Légende</span>
          <p>{renderBookMarkup(lore.data.familyLegend)}</p>
        </article>
      </div>
    </section>
  );
}

function LootPage({ monster }: { monster: BestiaryMonsterSlot }) {
  const loot = monster.loot;

  if (!loot?.unlocked || !loot.data) {
    return (
      <section className="tb-book-section">
        <SectionLock
          label="Butin"
          required={loot?.required ?? 0}
          remaining={loot?.remaining ?? 0}
        />
      </section>
    );
  }

  return (
    <section className="tb-book-section">
      <header className="tb-book-simple-heading">
        <span>🎁</span>
        <div>
          <small>BUTINS OBSERVÉS</small>
          <h4>Récompenses de chasse</h4>
        </div>
      </header>

      {loot.data.items.length ? (
        <div className="tb-book-loot-grid">
          {loot.data.items.map((item, index) => (
            <article
              key={`${item.itemId}:${index}`}
              className={item.rare ? "rare" : ""}
            >
              <span>{item.rare ? "⭐" : "🎁"}</span>
              <div>
                <strong>{item.itemId}</strong>
                <small>
                  {item.chance}% • ×
                  {item.minQty === item.maxQty
                    ? item.minQty
                    : `${item.minQty}–${item.maxQty}`}
                </small>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tb-book-empty-note">
          Aucun butin connu pour cette créature.
        </div>
      )}
    </section>
  );
}

export default function GuildBestiary({
  members,
}: {
  members: CharacterGuildMember[];
}) {
  const cached = getCachedGuildBestiary();

  const [snapshot, setSnapshot] = useState<GuildBestiarySnapshot | null>(
    () => cached,
  );
  const [loading, setLoading] = useState(
    () => bestiaryApiConfigured && cached === null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [familyId, setFamilyId] = useState<string | null>(
    () => cached?.families[0]?.id ?? null,
  );
  const [monsterSlotId, setMonsterSlotId] = useState<string | null>(null);
  const [bookMode, setBookMode] = useState<BookMode>("family");
  const [bookSection, setBookSection] = useState<BookSection>("overview");
  const [search, setSearch] = useState("");

  const [turnDirection, setTurnDirection] =
    useState<TurnDirection | null>(null);
  const turnBusyRef = useRef(false);
  const turnTimersRef = useRef<number[]>([]);

  const [artwork, setArtwork] = useState<Artwork>(null);

  const clearTurnTimers = useCallback(() => {
    for (const timer of turnTimersRef.current) {
      window.clearTimeout(timer);
    }
    turnTimersRef.current = [];
  }, []);

  useEffect(() => clearTurnTimers, [clearTurnTimers]);

  const turnPage = useCallback(
    (
      action: () => void,
      direction: TurnDirection = "next",
    ) => {
      if (turnBusyRef.current) return;

      clearTurnTimers();
      turnBusyRef.current = true;
      setTurnDirection(direction);
      playBestiaryPageTurn();

      const swap = window.setTimeout(() => {
        action();
      }, 175);

      const finish = window.setTimeout(() => {
        setTurnDirection(null);
        turnBusyRef.current = false;
      }, 520);

      turnTimersRef.current = [swap, finish];
    },
    [clearTurnTimers],
  );

  const refresh = useCallback(async (quiet = false) => {
    if (!bestiaryApiConfigured) {
      setLoading(false);
      return;
    }

    const hasCache = getCachedGuildBestiary() !== null;

    if (quiet || hasCache) setRefreshing(true);
    else setLoading(true);

    try {
      const value = await loadGuildBestiary();
      setSnapshot(value);
      setError(null);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Impossible de charger le Bestiaire.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(getCachedGuildBestiary() !== null);

    const timer = window.setInterval(() => {
      void refresh(true);
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (!snapshot?.families.length) {
      setFamilyId(null);
      setMonsterSlotId(null);
      return;
    }

    setFamilyId((current) =>
      current &&
      snapshot.families.some((family) => family.id === current)
        ? current
        : snapshot.families[0].id,
    );
  }, [snapshot]);

  const family = useMemo<BestiaryFamily | null>(
    () =>
      snapshot?.families.find((item) => item.id === familyId) ??
      snapshot?.families[0] ??
      null,
    [snapshot, familyId],
  );

  const monster = useMemo<BestiaryMonsterSlot | null>(
    () =>
      family?.monsters.find(
        (item) =>
          item.slotId === monsterSlotId &&
          item.discovered,
      ) ?? null,
    [family, monsterSlotId],
  );

  useEffect(() => {
    if (
      monsterSlotId &&
      !family?.monsters.some(
        (item) =>
          item.slotId === monsterSlotId &&
          item.discovered,
      )
    ) {
      setMonsterSlotId(null);
      setBookMode("family");
    }
  }, [family, monsterSlotId]);

  const normalizedSearch = search.trim().toLocaleLowerCase("fr");

  const visibleFamilies = useMemo(() => {
    if (!snapshot) return [];

    if (!normalizedSearch) return snapshot.families;

    return snapshot.families.filter((item) => {
      const familyMatch = `${item.name} ${item.description}`
        .toLocaleLowerCase("fr")
        .includes(normalizedSearch);

      const monsterMatch = item.monsters.some(
        (candidate) =>
          candidate.discovered &&
          `${candidate.name ?? ""} ${candidate.floor ?? ""}`
            .toLocaleLowerCase("fr")
            .includes(normalizedSearch),
      );

      return familyMatch || monsterMatch;
    });
  }, [snapshot, normalizedSearch]);

  const monsterSearchResults = useMemo(() => {
    if (!snapshot || !normalizedSearch) return [];

    return snapshot.families.flatMap((searchFamily) =>
      searchFamily.monsters
        .filter(
          (candidate) =>
            candidate.discovered &&
            `${candidate.name ?? ""} ${candidate.floor ?? ""} ${
              candidate.rarity ?? ""
            }`
              .toLocaleLowerCase("fr")
              .includes(normalizedSearch),
        )
        .map((candidate) => ({
          family: searchFamily,
          monster: candidate,
        })),
    );
  }, [snapshot, normalizedSearch]);

  const firstDefeaterName = useMemo(() => {
    const id = monster?.firstDefeat?.userId;
    if (!id) return null;

    return (
      members.find(
        (member) => String(member.id) === String(id),
      )?.displayName ?? null
    );
  }, [members, monster]);

  const selectFamily = (nextFamilyId: string) => {
    if (nextFamilyId === family?.id && bookMode === "family") return;

    turnPage(() => {
      setFamilyId(nextFamilyId);
      setMonsterSlotId(null);
      setBookMode("family");
      setBookSection("overview");
    });
  };

  const openMonster = (slotId: string) => {
    turnPage(() => {
      setMonsterSlotId(slotId);
      setBookMode("monster");
      setBookSection("overview");
    });
  };

  const openSearchMonster = (
    nextFamilyId: string,
    slotId: string,
  ) => {
    turnPage(() => {
      setFamilyId(nextFamilyId);
      setMonsterSlotId(slotId);
      setBookMode("monster");
      setBookSection("overview");
    });
  };

  const backToFamily = () => {
    turnPage(
      () => {
        setBookMode("family");
        setBookSection("overview");
      },
      "previous",
    );
  };

  const selectSection = (section: BookSection) => {
    if (section === bookSection) return;

    const order: BookSection[] = [
      "overview",
      "combat",
      "chronicle",
      "loot",
    ];

    const currentIndex = order.indexOf(bookSection);
    const nextIndex = order.indexOf(section);

    turnPage(
      () => setBookSection(section),
      nextIndex >= currentIndex ? "next" : "previous",
    );
  };

  if (!bestiaryApiConfigured) {
    return (
      <section className="tb-best-state">
        <span>🔌</span>
        <h2>Connexion TailBlue requise</h2>
        <p>
          Le Bestiaire ne possède aucun mode fictif :
          il lit uniquement les archives réelles de la guilde.
        </p>
      </section>
    );
  }

  if (loading && !snapshot) {
    return (
      <section className="tb-best-state">
        <span className="tb-best-loading-icon">📖</span>
        <h2>Ouverture du Bestiaire…</h2>
        <p>Premier chargement du registre partagé.</p>
      </section>
    );
  }

  if (error && !snapshot) {
    return (
      <section className="tb-best-state error">
        <span>⚠️</span>
        <h2>Bestiaire indisponible</h2>
        <p>{error}</p>
        <button onClick={() => void refresh(false)}>
          Réessayer
        </button>
      </section>
    );
  }

  if (!snapshot || !family) {
    return (
      <section className="tb-best-state">
        <span>📕</span>
        <h2>Registre vide</h2>
        <p>Aucune famille de créatures n’est disponible.</p>
      </section>
    );
  }

  return (
    <>
      <section className="tb-best-page tb-best-book-v2">
        {error && (
          <div className="tb-best-soft-error">
            ⚠️ Actualisation impossible : {error}
          </div>
        )}

        <header className="tb-book-topbar">
          <div>
            <span className="tb-book-kicker">ARCHIVES DE LA MINE</span>
            <h2>Bestiaire de {snapshot.guildName}</h2>
            <p>
              Un livre vivant, enrichi par toutes les rencontres de la guilde.
            </p>
          </div>

          <div className="tb-book-topbar-actions">
            <div className="tb-book-global-progress">
              <strong>
                {snapshot.summary.completed}/{snapshot.summary.total}
              </strong>
              <span>fiches complètes</span>
              <BookProgress
                value={snapshot.summary.completed}
                total={snapshot.summary.total}
              />
            </div>

            <button
              type="button"
              className="tb-book-refresh"
              onClick={() => void refresh(true)}
              disabled={refreshing}
            >
              <span className={refreshing ? "spin" : ""}>↻</span>
              {refreshing ? "Synchro…" : "Actualiser"}
            </button>
          </div>
        </header>

        <div className="tb-book-shell">
          <aside className="tb-book-index-page">
            <div className="tb-book-binding-shadow" />

            <header>
              <span className="tb-book-kicker">SOMMAIRE</span>
              <h3>Familles</h3>
              <p>
                Choisis un chapitre ou cherche une créature déjà répertoriée.
              </p>
            </header>

            <label className="tb-book-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Famille ou créature…"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Effacer la recherche"
                >
                  ×
                </button>
              )}
            </label>

            <div className="tb-book-index-list">
              {normalizedSearch && monsterSearchResults.length > 0 && (
                <section className="tb-book-search-section">
                  <span className="tb-book-search-heading">
                    CRÉATURES TROUVÉES
                  </span>

                  {monsterSearchResults.map(
                    ({ family: resultFamily, monster: resultMonster }) => (
                      <button
                        type="button"
                        className="tb-book-monster-search-result"
                        key={`${resultFamily.id}:${resultMonster.slotId}`}
                        onClick={() =>
                          openSearchMonster(
                            resultFamily.id,
                            resultMonster.slotId,
                          )
                        }
                      >
                        <span className="search-monster-icon">
                          {resultMonster.emoji ?? "👾"}
                        </span>
                        <span className="chapter-copy">
                          <strong>
                            {resultMonster.name}
                            {resultMonster.isBoss ? " 👑" : ""}
                          </strong>
                          <small>
                            {resultFamily.name} • {resultMonster.floor}
                          </small>
                        </span>
                        <span className="chapter-arrow">›</span>
                      </button>
                    ),
                  )}
                </section>
              )}

              {(!normalizedSearch || visibleFamilies.length > 0) && (
                <section className="tb-book-search-section">
                  {normalizedSearch && (
                    <span className="tb-book-search-heading">
                      CHAPITRES CORRESPONDANTS
                    </span>
                  )}

                  {visibleFamilies.map((item, index) => (
                    <button
                      type="button"
                      className="tb-book-family-result"
                      key={item.id}
                      data-active={item.id === family.id ? "true" : "false"}
                      onClick={() => selectFamily(item.id)}
                    >
                      <span className="chapter-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="chapter-icon">{item.emoji}</span>
                      <span className="chapter-copy">
                        <strong>{item.name}</strong>
                        <small>
                          {item.discovered}/{item.total} découverts •{" "}
                          {item.completed}/{item.total} complétés
                        </small>
                      </span>
                      <span className="chapter-arrow">›</span>
                    </button>
                  ))}
                </section>
              )}

              {normalizedSearch &&
                !monsterSearchResults.length &&
                !visibleFamilies.length && (
                  <div className="tb-book-no-results">
                    Aucun chapitre ni créature découverte ne correspond à “{search}”.
                  </div>
                )}
            </div>

            <footer className="tb-book-index-footer">
              <div>
                <span>👁️</span>
                <strong>{snapshot.summary.discovered}</strong>
                <small>découvertes</small>
              </div>
              <div>
                <span>🏆</span>
                <strong>{snapshot.summary.completed}</strong>
                <small>complétées</small>
              </div>
              <div>
                <span>🤝</span>
                <strong>{snapshot.summary.contributors}</strong>
                <small>contributeurs</small>
              </div>
            </footer>
          </aside>

          <main
            className={[
              "tb-book-content-page",
              turnDirection === "next" ? "turning-next" : "",
              turnDirection === "previous" ? "turning-previous" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="tb-book-paper-noise" />
            <div className="tb-book-page-number">
              {bookMode === "monster" ? "FICHE" : "CHAPITRE"}
            </div>

            {bookMode === "family" ? (
              <div className="tb-book-family-page">
                <header className="tb-book-family-heading">
                  <div className="tb-book-family-illustration">
                    {family.imageUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setArtwork({
                            url: family.imageUrl!,
                            title: family.name,
                          })
                        }
                        title="Agrandir l'illustration"
                      >
                        <img src={family.imageUrl} alt={family.name} />
                        <span>⛶ Agrandir</span>
                      </button>
                    ) : (
                      <div>{family.emoji}</div>
                    )}
                  </div>

                  <div className="tb-book-family-intro">
                    <span className="tb-book-kicker">
                      CHAPITRE • {family.discovered}/{family.total} DÉCOUVERTS
                    </span>
                    <h3>
                      {family.emoji} {family.name}
                    </h3>
                    <p>{family.description}</p>

                    <div className="tb-book-family-metrics">
                      <span>👁 {family.discovered}/{family.total}</span>
                      <span>✓ {family.completed}/{family.total}</span>
                      <span>👑 {family.bossCompleted}/{family.bossTotal}</span>
                    </div>
                  </div>
                </header>

                <section className="tb-book-family-notes">
                  <article>
                    <span>🏛️ Origine</span>
                    <p>{renderBookMarkup(family.chronicle.origin)}</p>
                  </article>
                  <article>
                    <span>🗺️ Habitat</span>
                    <p>{renderBookMarkup(family.chronicle.habitat)}</p>
                  </article>
                  <article>
                    <span>🕯️ Légende</span>
                    <p>{renderBookMarkup(family.chronicle.legend)}</p>
                  </article>
                </section>

                <section className="tb-book-creature-index">
                  <header>
                    <div>
                      <span className="tb-book-kicker">ENTRÉES DU CHAPITRE</span>
                      <h4>Créatures répertoriées</h4>
                    </div>
                    <span>
                      {family.discovered}/{family.total} identifiées
                    </span>
                  </header>

                  <div className="tb-book-creature-grid">
                    {family.monsters.map((item, index) => {
                      if (!item.discovered) {
                        return (
                          <article
                            className="tb-book-creature-card locked"
                            key={item.slotId}
                          >
                            <div className="tb-book-unknown-creature">?</div>
                            <div>
                              <small>
                                ENTRÉE {String(index + 1).padStart(2, "0")}
                              </small>
                              <h5>Créature inconnue</h5>
                              <p>Première rencontre requise.</p>
                            </div>
                          </article>
                        );
                      }

                      return (
                        <button
                          type="button"
                          className="tb-book-creature-card"
                          key={item.slotId}
                          onClick={() => openMonster(item.slotId)}
                        >
                          <MonsterThumb
                            monster={item}
                            onZoom={() => {
                              if (!item.imageUrl) return;
                              setArtwork({
                                url: item.imageUrl,
                                title: item.name ?? "Créature",
                              });
                            }}
                          />

                          <div className="tb-book-creature-card-copy">
                            <div>
                              {item.isBoss && <b>👑 BOSS</b>}
                              <small>Niv. {item.level}</small>
                            </div>

                            <h5>
                              {item.emoji} {item.name}
                            </h5>
                            <p>{item.floor}</p>

                            <div className="tb-book-card-study">
                              <BookProgress
                                value={item.study?.value ?? 0}
                                total={item.study?.target ?? 1}
                              />
                              <span>
                                {item.study?.complete
                                  ? "Complète"
                                  : `${item.study?.value ?? 0}/${item.study?.target ?? 1}`}
                              </span>
                            </div>
                          </div>

                          <span className="tb-book-open-entry">›</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : monster ? (
              <div className="tb-book-monster-page">
                <button
                  type="button"
                  className="tb-book-back"
                  onClick={backToFamily}
                >
                  ← Retour au chapitre {family.name}
                </button>

                <header className="tb-book-monster-heading">
                  <div className="tb-book-monster-hero">
                    <MonsterThumb
                      monster={monster}
                      onZoom={() => {
                        if (!monster.imageUrl) return;
                        setArtwork({
                          url: monster.imageUrl,
                          title: monster.name ?? "Créature",
                        });
                      }}
                    />
                  </div>

                  <div>
                    <div className="tb-book-monster-badges">
                      {monster.isBoss && <span className="boss">👑 BOSS</span>}
                      <span>{monster.rarity}</span>
                    </div>

                    <span className="tb-book-kicker">FICHE DE CRÉATURE</span>
                    <h3>
                      {monster.emoji} {monster.name}
                    </h3>
                    <p>
                      {monster.floor} • Niveau {monster.level}
                    </p>

                    <div className="tb-book-monster-study">
                      <div>
                        <span>Étude</span>
                        <strong>
                          {monster.study?.value}/{monster.study?.target}
                        </strong>
                      </div>
                      <BookProgress
                        value={monster.study?.value ?? 0}
                        total={monster.study?.target ?? 1}
                      />
                    </div>
                  </div>
                </header>

                <nav className="tb-book-tabs">
                  {([
                    ["overview", "📖 Aperçu"],
                    ["combat", "⚔️ Combat"],
                    ["chronicle", "📜 Chronique"],
                    ["loot", "🎁 Butin"],
                  ] as const).map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      className={bookSection === key ? "active" : ""}
                      onClick={() => selectSection(key)}
                    >
                      {label}
                    </button>
                  ))}
                </nav>

                <div className="tb-book-section-content">
                  {bookSection === "overview" && (
                    <OverviewPage
                      monster={monster}
                      firstDefeaterName={firstDefeaterName}
                    />
                  )}

                  {bookSection === "combat" && (
                    <CombatPage monster={monster} />
                  )}

                  {bookSection === "chronicle" && (
                    <ChroniclePage monster={monster} />
                  )}

                  {bookSection === "loot" && (
                    <LootPage monster={monster} />
                  )}
                </div>
              </div>
            ) : null}
          </main>
        </div>

        <footer className="tb-book-security-note">
          <span>🔐</span>
          <p>
            Les archives verrouillées restent protégées côté serveur :
            TailBlue Desktop ne reçoit pas les données avant leur vrai déblocage.
          </p>
        </footer>
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
