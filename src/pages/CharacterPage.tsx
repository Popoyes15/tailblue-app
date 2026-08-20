import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  characterApiConfigured,
  getCachedCharacterSnapshot,
  loadCharacterDetail,
  loadCharacterSnapshot,
  openCharacterStream,
} from "../api/characterApi";
import { CHARACTER_PREVIEW } from "../data/characterPreviewData";
import type {
  CharacterDetail,
  CharacterDetailKind,
  CharacterIdentitySummary,
  CharacterRaceSkill,
  CharacterSnapshot,
} from "../types/character";
import "./characterFinal.css";

const STAT_CARDS = [
  { key: "hp", icon: "❤️", label: "PV", percent: false },
  { key: "attack", icon: "⚔️", label: "Attaque", percent: false },
  { key: "defense", icon: "🛡️", label: "Défense", percent: false },
  { key: "crit", icon: "🎯", label: "Critique", percent: true },
  { key: "dodge", icon: "💨", label: "Esquive", percent: true },
  { key: "luck", icon: "🍀", label: "Chance", percent: false },
] as const;

const ACTIVITY_CARDS = [
  { key: "cookies", icon: "🍪", label: "Cookies" },
  { key: "hugsGiven", icon: "💜", label: "Câlins donnés" },
  { key: "hugsReceived", icon: "🤝", label: "Câlins reçus" },
  { key: "chestsOpened", icon: "📦", label: "Coffres ouverts" },
  { key: "works", icon: "💼", label: "Travaux" },
  { key: "hunts", icon: "🏹", label: "Chasses" },
  { key: "reputation", icon: "👑", label: "Réputation" },
  { key: "successes", icon: "🏆", label: "Succès" },
  { key: "museumPieces", icon: "🏛️", label: "Pièces au musée" },
] as const;

const STAT_NAMES: Record<string, string> = {
  hp: "PV",
  attack: "Attaque",
  defense: "Défense",
  crit: "Critique",
  dodge: "Esquive",
  luck: "Chance",
  accuracy: "Précision",
  pv: "PV",
  attaque: "Attaque",
  vitesse: "Vitesse",
  critique: "Critique",
  esquive: "Esquive",
  precision: "Précision",
};

const ELEMENT_LABELS: Record<string, string> = {
  light: "Lumière",
  fire: "Feu",
  ice: "Glace",
  lightning: "Foudre",
  nature: "Nature",
  darkness: "Ténèbres",
  earth: "Terre",
  neutral: "Neutre",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CH").format(value);
}

function percent(value: number, max: number) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, (value / max) * 100),
  );
}

function statValue(
  value: number,
  isPercent: boolean,
) {
  return isPercent ? `${value}%` : formatNumber(value);
}

function cleanEmojiPrefix(value: string) {
  return value.replace(
    /^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u,
    "",
  );
}

void cleanEmojiPrefix;

function CharacterAvatar({
  url,
  name,
}: {
  url?: string | null;
  name: string;
}) {
  if (url) {
    return (
      <img
        className="tb-character-avatar"
        src={url}
        alt={name}
      />
    );
  }

  return (
    <div className="tb-character-avatar tb-character-avatar-fallback">
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function DetailArtwork({
  imageUrl,
  emoji,
  alt,
  variant,
}: {
  imageUrl?: string | null;
  emoji?: string | null;
  alt: string;
  variant?: "race" | "job" | "guild" | "residence" | "companion";
}) {
  if (!imageUrl && !emoji) return null;

  return (
    <div
      className={`tb-character-detail-art${variant ? ` tb-character-detail-art--${variant}` : ""}`}
    >
      {imageUrl && (
        <div
          className="tb-character-detail-art-blur"
          style={{
            backgroundImage: `url("${imageUrl}")`,
          }}
        />
      )}

      {imageUrl ? (
        <img src={imageUrl} alt={alt} />
      ) : (
        <div className="tb-character-detail-art-emoji">
          {emoji}
        </div>
      )}
    </div>
  );
}

function PreviewNotice() {
  return (
    <div className="tb-character-preview-notice">
      <span>🧪</span>
      <div>
        <strong>Aperçu local</strong>
        <p>
          Cette fiche sert uniquement quand l'API n'est pas configurée.
          En mode connecté, les valeurs viennent directement
          du backend TailBlue.
        </p>
      </div>
    </div>
  );
}

function InfoChips({
  values,
}: {
  values: string[];
}) {
  if (!values.length) return <span className="tb-muted">—</span>;

  return (
    <div className="tb-character-chip-row">
      {values.map((value) => (
        <span key={value} className="tb-character-chip">
          {value}
        </span>
      ))}
    </div>
  );
}

function RaceSkillCard({
  skill,
}: {
  skill: CharacterRaceSkill;
}) {
  return (
    <article className="tb-character-skill-card">
      <div className="tb-character-skill-top">
        <span
          className={
            skill.learned
              ? "tb-character-skill-state learned"
              : "tb-character-skill-state locked"
          }
        >
          {skill.learned ? "✓ Apprise" : "🔒 À débloquer"}
        </span>

        <span>Niv. {skill.unlockLevel}</span>
      </div>

      <h4>{skill.name}</h4>
      <p>{skill.description}</p>

      <div className="tb-character-skill-meta">
        {skill.element && (
          <span>
            ✨{" "}
            {ELEMENT_LABELS[skill.element] ??
              skill.element}
          </span>
        )}

        {skill.summary && <span>{skill.summary}</span>}
      </div>
    </article>
  );
}

function RaceDetail({
  detail,
}: {
  detail: Extract<CharacterDetail, { kind: "race" }>;
}) {
  const bonuses = Object.entries(detail.statBonuses);
  const hasLore = Boolean(
    detail.origin ||
      detail.territory ||
      detail.society ||
      detail.reputation ||
      detail.relations ||
      detail.history,
  );

  return (
    <>
      <DetailArtwork
        imageUrl={detail.imageUrl}
        emoji={detail.emoji}
        alt={detail.name}
        variant="race"
      />

      <div className="tb-character-detail-title">
        <span>{detail.emoji}</span>
        <div>
          <p className="eyebrow">RACE ACTUELLE</p>
          <h2>{detail.name}</h2>
          <span>{detail.archetype}</span>
        </div>
      </div>

      <p className="tb-character-detail-lead">
        {detail.description}
      </p>

      <div className="tb-character-detail-grid two">
        <section>
          <span className="tb-character-detail-label">
            ✨ Affinités
          </span>
          <InfoChips
            values={detail.elements.map(
              (element) =>
                ELEMENT_LABELS[element] ?? element,
            )}
          />
        </section>

        <section>
          <span className="tb-character-detail-label">
            ⚔️ Armes privilégiées
          </span>
          <InfoChips values={detail.preferredWeapons} />
        </section>
      </div>

      <section className="tb-character-detail-section">
        <div className="tb-character-section-heading">
          <div>
            <p className="eyebrow">HÉRITAGE RACIAL</p>
            <h3>Bonus de caractéristiques</h3>
          </div>

          {detail.combatLevel != null && (
            <span className="tb-character-mini-pill">
              Niveau de combat {detail.combatLevel}
            </span>
          )}
        </div>

        <div className="tb-character-bonus-grid">
          {bonuses.length ? (
            bonuses.map(([key, value]) => (
              <div key={key}>
                <span>{STAT_NAMES[key] ?? key}</span>
                <strong className={value >= 0 ? "positive" : "negative"}>
                  {value >= 0 ? "+" : ""}
                  {value}
                </strong>
              </div>
            ))
          ) : (
            <p className="tb-muted">
              Aucun bonus racial déclaré.
            </p>
          )}
        </div>
      </section>

      <section className="tb-character-detail-section">
        <div className="tb-character-section-heading">
          <div>
            <p className="eyebrow">GRIMOIRE</p>
            <h3>Compétences raciales</h3>
          </div>

          <span className="tb-character-mini-pill">
            {detail.unlockedSkills.filter((skill) => skill.learned).length}
            {" "}apprise(s)
          </span>
        </div>

        {detail.nextSkillLevel != null && (
          <div className="tb-character-next-skill">
            ✨ Prochain palier racial au niveau de combat{" "}
            <strong>{detail.nextSkillLevel}</strong>.
          </div>
        )}

        <div className="tb-character-skills-grid">
          {detail.unlockedSkills.length ? (
            detail.unlockedSkills.map((skill) => (
              <RaceSkillCard key={skill.id} skill={skill} />
            ))
          ) : (
            <p className="tb-muted">
              Aucune compétence raciale active.
            </p>
          )}
        </div>
      </section>

      <section className="tb-character-detail-section">
        <p className="eyebrow">ARCHIVES DU ROYAUME</p>
        <h3>Origines, peuple & histoire</h3>

        {hasLore ? (
          <div className="tb-character-lore-grid rich">
            {detail.origin && (
              <div>
                <span>🌱 Origine</span>
                <p>{detail.origin}</p>
              </div>
            )}

            {detail.territory && (
              <div>
                <span>🗺️ Territoire</span>
                <p>{detail.territory}</p>
              </div>
            )}

            {detail.society && (
              <div>
                <span>🏛️ Société</span>
                <p>{detail.society}</p>
              </div>
            )}

            {detail.reputation && (
              <div>
                <span>👁️ Réputation</span>
                <p>{detail.reputation}</p>
              </div>
            )}

            {detail.relations && (
              <div className="wide">
                <span>🤝 Relations avec les peuples</span>
                <p>{detail.relations}</p>
              </div>
            )}

            {detail.history && (
              <div className="wide history">
                <span>📖 Grande histoire</span>
                <p>{detail.history}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="tb-muted">
            Aucune archive raciale n'est enregistrée pour cette race.
          </p>
        )}
      </section>
    </>
  );
}

function JobDetail({
  detail,
}: {
  detail: Extract<CharacterDetail, { kind: "job" }>;
}) {
  return (
    <>
      <DetailArtwork
        imageUrl={detail.imageUrl}
        emoji={detail.emoji ?? "💼"}
        alt={detail.name}
        variant="job"
      />

      <div className="tb-character-detail-title">
        <span>{detail.emoji ?? "💼"}</span>
        <div>
          <p className="eyebrow">MÉTIER ACTUEL</p>
          <h2>{detail.name}</h2>
          <span>
            {detail.requiredLevel >= 9999
              ? "Métier spécial"
              : `Niveau requis ${detail.requiredLevel}`}
          </span>
        </div>
      </div>

      <p className="tb-character-detail-lead">
        {detail.description ||
          "Aucune description de métier disponible."}
      </p>

      <div className="tb-character-detail-grid two">
        <section>
          <span className="tb-character-detail-label">
            🛠️ Spécialité
          </span>
          <p>
            {detail.specialty ||
              "Aucune spécialité enregistrée."}
          </p>
        </section>

        <section>
          <span className="tb-character-detail-label">
            🍪 Salaire de référence
          </span>
          <p>
            {detail.salaryLabel ||
            (detail.salaryMin != null && detail.salaryMax != null
              ? `${formatNumber(detail.salaryMin)} à ${formatNumber(
                  detail.salaryMax,
                )} cookies`
              : "Non renseigné")}
          </p>
        </section>
      </div>

      {detail.quote && (
        <blockquote className="tb-character-quote">
          {detail.quote}
        </blockquote>
      )}

      <div className="tb-character-source-note">
        📖 Description, spécialité, citation et salaire sont lus
        dans les données métier du backend TailBlue.
      </div>
    </>
  );
}

function GuildDetail({
  detail,
}: {
  detail: Extract<CharacterDetail, { kind: "guild" }>;
}) {
  const xpPct = percent(detail.xp, detail.xpNeeded);

  return (
    <>
      <DetailArtwork
        imageUrl={detail.imageUrl}
        emoji="🏰"
        alt={detail.name}
        variant="guild"
      />

      <div className="tb-character-detail-title">
        <span>🏰</span>
        <div>
          <p className="eyebrow">GUILDE</p>
          <h2>{detail.name}</h2>
          <span>
            {detail.founderName
              ? `Fondée par ${detail.founderName}`
              : "Fondateur synchronisé via le backend"}
          </span>
        </div>
      </div>

      <div className="tb-character-guild-kpis">
        <div>
          <span>🏆 Niveau</span>
          <strong>
            {detail.previewOnly && detail.level === 0
              ? "—"
              : detail.level}
          </strong>
        </div>
        <div>
          <span>💰 Trésor</span>
          <strong>
            {detail.previewOnly && detail.treasure === 0
              ? "—"
              : formatNumber(detail.treasure)}
          </strong>
        </div>
        <div>
          <span>👥 Membres</span>
          <strong>
            {detail.previewOnly && detail.maxMembers === 0
              ? "—"
              : `${detail.members.length}/${detail.maxMembers}`}
          </strong>
        </div>
      </div>

      {!detail.previewOnly && detail.xpNeeded > 0 && (
        <section className="tb-character-detail-section">
          <div className="tb-character-progress-title">
            <span>✨ Progression de la guilde</span>
            <strong>
              {formatNumber(detail.xp)} /{" "}
              {formatNumber(detail.xpNeeded)} XP
            </strong>
          </div>
          <div className="tb-character-progress-track">
            <div style={{ width: `${xpPct}%` }} />
          </div>
        </section>
      )}

      {detail.hall && (
        <section className="tb-character-detail-section">
          <p className="eyebrow">HALL DES RELIQUES</p>
          <h3>{detail.hall.name}</h3>

          {detail.hall.description && (
            <p className="tb-character-detail-lead small">
              {detail.hall.description}
            </p>
          )}

          {detail.hall.imageUrl && (
            <div className="tb-character-inline-art">
              <img
                src={detail.hall.imageUrl}
                alt={detail.hall.name}
              />
            </div>
          )}
        </section>
      )}

      <div className="tb-character-detail-grid two">
        <section>
          <span className="tb-character-detail-label">
            👥 Membres
          </span>

          {detail.members.length ? (
            <div className="tb-character-member-list">
              {detail.members.map((member) => (
                <div key={member.id}>
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.displayName}
                    />
                  ) : (
                    <span>
                      {member.displayName
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>
                  )}
                  <strong>
                    {member.founder ? "👑 " : ""}
                    {member.displayName}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="tb-muted">
              Membres non chargés dans cet aperçu.
            </p>
          )}
        </section>

        <section>
          <span className="tb-character-detail-label">
            ⚔️ Activités
          </span>
          <InfoChips values={detail.activities} />
        </section>
      </div>
    </>
  );
}

function ResidenceDetail({
  detail,
}: {
  detail: Extract<
    CharacterDetail,
    { kind: "residence" }
  >;
}) {
  return (
    <>
      <DetailArtwork
        imageUrl={detail.imageUrl}
        emoji="🏠"
        alt={detail.name}
        variant="residence"
      />

      <div className="tb-character-detail-title">
        <span>🏠</span>
        <div>
          <p className="eyebrow">RÉSIDENCE</p>
          <h2>{detail.name}</h2>
          <span>Foyer actuel de l'aventurier</span>
        </div>
      </div>

      {detail.description && (
        <p className="tb-character-detail-lead">
          {detail.description}
        </p>
      )}

      <section className="tb-character-detail-section">
        <p className="eyebrow">EFFETS ACTIFS</p>
        <h3>Influence de la résidence</h3>

        <div className="tb-character-bonus-grid">
          {detail.effects.map((effect) => (
            <div key={effect.label}>
              <span>{effect.label}</span>
              <strong>{effect.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <div className="tb-character-source-note">
        🏠 Nom, image et effets sont lus depuis la résidence
        effective enregistrée par le backend TailBlue.
      </div>
    </>
  );
}

function CompanionDetail({
  detail,
}: {
  detail: Extract<
    CharacterDetail,
    { kind: "companion" }
  >;
}) {
  return (
    <>
      <DetailArtwork
        imageUrl={detail.imageUrl}
        emoji={detail.emoji ?? "🐾"}
        alt={detail.displayName}
        variant="companion"
      />

      <div className="tb-character-detail-title">
        <span>{detail.emoji ?? "🐾"}</span>
        <div>
          <p className="eyebrow">COMPAGNON ACTUEL</p>
          <h2>{detail.displayName}</h2>
          <span>
            {detail.speciesName || "Compagnon TailBlue"}
          </span>
        </div>
      </div>

      <div className="tb-character-guild-kpis">
        <div>
          <span>⭐ Niveau</span>
          <strong>{detail.level}</strong>
        </div>
        <div>
          <span>💜 Affection</span>
          <strong>{detail.affection}%</strong>
        </div>
        <div>
          <span>🤝 Relation</span>
          <strong>{detail.relation || "—"}</strong>
        </div>
      </div>

      {detail.story && (
        <section className="tb-character-detail-section">
          <p className="eyebrow">CHRONIQUES</p>
          <h3>Son histoire</h3>
          <p className="tb-character-detail-lead small">
            {detail.story}
          </p>
        </section>
      )}

      {!!detail.stats &&
        Object.keys(detail.stats).length > 0 && (
          <section className="tb-character-detail-section">
            <p className="eyebrow">STATISTIQUES</p>
            <div className="tb-character-bonus-grid">
              {Object.entries(detail.stats).map(
                ([key, value]) => (
                  <div key={key}>
                    <span>{STAT_NAMES[key] ?? key}</span>
                    <strong>{formatNumber(value)}</strong>
                  </div>
                ),
              )}
            </div>
          </section>
        )}

      {!!detail.abilities?.length && (
        <section className="tb-character-detail-section">
          <p className="eyebrow">CAPACITÉS</p>
          <InfoChips values={detail.abilities} />
        </section>
      )}
    </>
  );
}

function RankDetail({
  detail,
}: {
  detail: Extract<CharacterDetail, { kind: "rank" }>;
}) {
  return (
    <>
      <div className="tb-character-rank-hero">
        <span>RANG D'AVENTURIER</span>
        <strong>{detail.rank || "—"}</strong>
        <small>
          {detail.score != null
            ? `${detail.score.toFixed(1)} points`
            : "Valeur réelle via le backend"}
        </small>
      </div>

      <p className="tb-character-detail-lead">
        {detail.explanation}
      </p>

      <section className="tb-character-detail-section">
        <p className="eyebrow">PROGRESSION</p>
        <h3>Échelle des rangs</h3>

        <div className="tb-character-rank-ladder">
          {detail.ladder.map((rank) => (
            <span
              key={rank}
              className={
                rank === detail.rank ? "active" : ""
              }
            >
              {rank}
            </span>
          ))}
        </div>
      </section>

      {!!detail.factors?.length && (
        <section className="tb-character-detail-section">
          <p className="eyebrow">CALCUL SERVEUR</p>
          <h3>Facteurs pris en compte</h3>

          <div className="tb-character-bonus-grid">
            {detail.factors.map((factor) => (
              <div key={factor.label}>
                <span>{factor.label}</span>
                <strong>{factor.value}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="tb-character-source-note">
        ⚔️ React ne calcule jamais ce rang. L'API affiche uniquement
        une valeur déjà synchronisée par le moteur TailBlue ; sinon elle affiche —.
      </div>
    </>
  );
}

function EquipmentDetail({
  detail,
}: {
  detail: Extract<
    CharacterDetail,
    { kind: "equipment" }
  >;
}) {
  return (
    <>
      <div className="tb-character-detail-title">
        <span>🧰</span>
        <div>
          <p className="eyebrow">ÉQUIPEMENT ACTIF</p>
          <h2>Tenue de l'aventurier</h2>
          <span>
            {detail.ownedEquipmentCount} équipement(s)
            possédé(s)
          </span>
        </div>
      </div>

      <div className="tb-character-equipment-grid">
        {detail.equipped.map((slot) => (
          <article key={slot.slot}>
            <div className="tb-character-equipment-icon">
              {slot.imageUrl ? (
                <img
                  src={slot.imageUrl}
                  alt={slot.itemName || slot.label}
                />
              ) : (
                slot.icon
              )}
            </div>

            <div>
              <span>{slot.label}</span>
              <strong>{slot.itemName || "Aucun"}</strong>
            </div>
          </article>
        ))}
      </div>

      {detail.affinityText && (
        <section className="tb-character-detail-section">
          <p className="eyebrow">AFFINITÉ RACIALE</p>
          <p className="tb-character-detail-lead small">
            {detail.affinityText}
          </p>
        </section>
      )}

      <section className="tb-character-detail-section">
        <p className="eyebrow">STATISTIQUES ACTIVES</p>

        <div className="tb-character-bonus-grid">
          {STAT_CARDS.map((stat) => (
            <div key={stat.key}>
              <span>
                {stat.icon} {stat.label}
              </span>
              <strong>
                {statValue(
                  detail.activeStats[stat.key],
                  stat.percent,
                )}
              </strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function DetailContent({
  detail,
}: {
  detail: CharacterDetail;
}) {
  switch (detail.kind) {
    case "race":
      return <RaceDetail detail={detail} />;

    case "job":
      return <JobDetail detail={detail} />;

    case "guild":
      return <GuildDetail detail={detail} />;

    case "residence":
      return <ResidenceDetail detail={detail} />;

    case "companion":
      return <CompanionDetail detail={detail} />;

    case "rank":
      return <RankDetail detail={detail} />;

    case "equipment":
      return <EquipmentDetail detail={detail} />;
  }
}

function CharacterDetailDrawer({
  open,
  loading,
  detail,
  error,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  detail: CharacterDetail | null;
  error: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="tb-character-drawer-overlay"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <aside className="tb-character-drawer">
        <header className="tb-character-drawer-header">
          <div>
            <span>📖 Archives personnelles</span>
            <strong>Détail du personnage</strong>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
          >
            ×
          </button>
        </header>

        <div className="tb-character-drawer-content">
          {loading && (
            <div className="tb-character-detail-loading">
              <div className="tb-character-spinner" />
              <strong>Ouverture des archives…</strong>
              <span>
                TailBlue prépare la fiche.
              </span>
            </div>
          )}

          {!loading && error && (
            <div className="tb-character-detail-error">
              <span>⚠️</span>
              <strong>Impossible d'ouvrir cette fiche</strong>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && !detail && (
            <div className="tb-character-detail-error">
              <span>🌙</span>
              <strong>Aucune donnée disponible</strong>
              <p>
                Cette information n'est pas encore
                disponible pour ce personnage.
              </p>
            </div>
          )}

          {!loading && !error && detail && (
            <>
              {detail.previewOnly && <PreviewNotice />}
              <DetailContent detail={detail} />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function IdentityCard({
  item,
  onOpen,
}: {
  item: CharacterIdentitySummary;
  onOpen: (kind: CharacterDetailKind) => void;
}) {
  return (
    <button
      className={`tb-character-identity-card ${
        item.available ? "clickable" : "disabled"
      }`}
      onClick={() => item.available && onOpen(item.kind)}
      disabled={!item.available}
    >
      <span className="tb-character-identity-icon">
        {item.icon}
      </span>

      <span className="tb-character-identity-copy">
        <small>{item.label}</small>
        <strong>{item.value}</strong>
        {item.subtitle && <em>{item.subtitle}</em>}
      </span>

      {item.previewOnly && (
        <span className="tb-character-preview-chip">
          aperçu
        </span>
      )}

      {item.available && (
        <span className="tb-character-identity-arrow">
          →
        </span>
      )}
    </button>
  );
}

export default function CharacterPage() {
  const [snapshot, setSnapshot] =
    useState<CharacterSnapshot | null>(() => {
      if (!characterApiConfigured) {
        return CHARACTER_PREVIEW;
      }

      return getCachedCharacterSnapshot();
    });

  const [loading, setLoading] = useState(
    () =>
      characterApiConfigured &&
      getCachedCharacterSnapshot() === null,
  );
  const [error, setError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [detail, setDetail] =
    useState<CharacterDetail | null>(null);
  const [detailError, setDetailError] =
    useState<string | null>(null);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setError(null);
        const next = await loadCharacterSnapshot(signal);
        setSnapshot(next);
      } catch (reason) {
        if (signal?.aborted) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de synchroniser le personnage.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    if (!characterApiConfigured) {
      void refresh(controller.signal);
      return () => controller.abort();
    }

    /*
     * S'il existe déjà un vrai snapshot, il reste affiché
     * immédiatement. La requête ci-dessous ne remet jamais
     * l'ancien aperçu à l'écran : elle actualise silencieusement
     * la fiche en arrière-plan.
     */
    if (getCachedCharacterSnapshot()) {
      setLoading(false);
    }

    void refresh(controller.signal);

    const interval = window.setInterval(
      () => void refresh(),
      30_000,
    );

    const closeStream = openCharacterStream(
      () => void refresh(),
    );

    return () => {
      controller.abort();
      window.clearInterval(interval);
      closeStream();
    };
  }, [refresh]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () =>
      window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function openDetail(
    kind: CharacterDetailKind,
  ) {
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetail(null);

    try {
      const result = await loadCharacterDetail(kind);
      setDetail(result);
    } catch (reason) {
      setDetailError(
        reason instanceof Error
          ? reason.message
          : "Impossible de charger cette fiche.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  /*
   * Première ouverture connectée sans cache :
   * on n'affiche surtout PAS CHARACTER_PREVIEW pendant
   * que le vrai personnage arrive.
   */
  if (!snapshot) {
    return (
      <div className="tb-character">
        <header className="tb-character-page-header">
          <div>
            <p className="eyebrow">PROFIL DE L'AVENTURIER</p>
            <h1>Personnage</h1>
            <p>
              Ton identité, ta progression et toutes les
              facettes de ta vie dans le Royaume.
            </p>
          </div>

          <div className="tb-character-sync-state online">
            <i />
            <span>Connexion à TailBlue…</span>
          </div>
        </header>

        <section className="tb-character-panel">
          <div className="tb-character-detail-loading">
            <div className="tb-character-spinner" />
            <strong>Chargement du personnage…</strong>
            <span>
              TailBlue récupère ta vraie fiche.
            </span>
          </div>
        </section>
      </div>
    );
  }

  const xpPct = percent(
    snapshot.profile.xpCurrent,
    snapshot.profile.xpNeeded,
  );

  const rank =
    snapshot.profile.adventurerRank?.trim() || "—";

  return (
    <div className="tb-character">
      <header className="tb-character-page-header">
        <div>
          <p className="eyebrow">PROFIL DE L'AVENTURIER</p>
          <h1>Personnage</h1>
          <p>
            Ton identité, ta progression et toutes les
            facettes de ta vie dans le Royaume.
          </p>
        </div>

        <div
          className={`tb-character-sync-state ${
            snapshot.mode === "api" ? "online" : "preview"
          }`}
        >
          <i />
          <span>
            {loading
              ? "Synchronisation…"
              : snapshot.mode === "api"
                ? "Synchronisé avec TailBlue"
                : "Aperçu local • API non configurée"}
          </span>
        </div>
      </header>

      {error && (
        <div className="tb-character-api-error">
          ⚠️ {error}
        </div>
      )}

      {!characterApiConfigured &&
        snapshot.mode === "preview" && (
        <div className="tb-character-page-preview">
          <span>🧪</span>
          <p>
            <strong>Mode aperçu :</strong> les fiches
            cliquables montrent déjà le rendu final, mais
            aucune valeur locale n'est considérée comme une
            donnée RPG réelle.
          </p>
        </div>
      )}

      <section className="tb-character-hero">
        <div className="tb-character-hero-main">
          <CharacterAvatar
            url={snapshot.profile.avatarUrl}
            name={snapshot.profile.displayName}
          />

          <div className="tb-character-hero-copy">
            <p className="eyebrow">AVENTURIER·ÈRE</p>
            <h2>{snapshot.profile.displayName}</h2>
            <p>{snapshot.profile.title}</p>

            <div className="tb-character-hero-pills">
              <span>Niveau {snapshot.profile.level}</span>
              <button
                onClick={() => void openDetail("rank")}
              >
                Rang aventurier {rank}
              </button>

              {snapshot.profile.isHime && (
                <span className="royal">
                  👑 Couronne
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          className="tb-character-rank-orb"
          onClick={() => void openDetail("rank")}
          title="Ouvrir le détail du rang"
        >
          <span>RANG</span>
          <strong>{rank}</strong>
          <small>Voir le calcul</small>
        </button>
      </section>

      <div className="tb-character-main-grid">
        <div className="tb-character-left-column">
          <section className="tb-character-panel">
            <div className="tb-character-panel-heading">
              <div>
                <p className="eyebrow">COMBAT</p>
                <h3>Statistiques actives</h3>
              </div>

              <button
                className="tb-character-link-button"
                onClick={() => void openDetail("equipment")}
              >
                🧰 Voir l'équipement →
              </button>
            </div>

            <div className="tb-character-stat-grid">
              {STAT_CARDS.map((stat) => (
                <article key={stat.key}>
                  <span className="tb-character-stat-icon">
                    {stat.icon}
                  </span>
                  <div>
                    <small>{stat.label}</small>
                    <strong>
                      {statValue(
                        snapshot.combat[stat.key],
                        stat.percent,
                      )}
                    </strong>
                  </div>
                </article>
              ))}
            </div>

            {(snapshot.combat.combatLevel != null ||
              snapshot.combat.combatEnergy != null) && (
              <div className="tb-character-combat-extra">
                {snapshot.combat.combatLevel != null && (
                  <span>
                    ⚔️ Niveau de combat{" "}
                    <strong>
                      {snapshot.combat.combatLevel}
                    </strong>
                  </span>
                )}

                {snapshot.combat.combatEnergy != null &&
                  snapshot.combat.combatEnergyMax != null && (
                    <span>
                      ✨ Énergie de combat{" "}
                      <strong>
                        {snapshot.combat.combatEnergy}/
                        {snapshot.combat.combatEnergyMax}
                      </strong>
                    </span>
                  )}
              </div>
            )}
          </section>

          <section className="tb-character-panel">
            <div className="tb-character-panel-heading">
              <div>
                <p className="eyebrow">PROGRESSION</p>
                <h3>Expérience</h3>
              </div>

              <span className="tb-character-level-pill">
                Niveau {snapshot.profile.level}
              </span>
            </div>

            <div className="tb-character-progress-title">
              <span>Progression du niveau</span>
              <strong>
                {snapshot.mode === "preview"
                  ? "Aperçu local"
                  : `${formatNumber(
                      snapshot.profile.xpCurrent,
                    )} / ${formatNumber(
                      snapshot.profile.xpNeeded,
                    )} XP`}
              </strong>
            </div>

            <div className="tb-character-progress-track">
              <div
                style={{
                  width:
                    snapshot.mode === "preview"
                      ? "0%"
                      : `${xpPct}%`,
                }}
              />
            </div>

            <div className="tb-character-progression-kpis">
              <div>
                <span>👑 Réputation</span>
                <strong>
                  {formatNumber(
                    snapshot.activity.reputation,
                  )}
                </strong>
              </div>

              <button
                onClick={() => void openDetail("rank")}
              >
                <span>⚔️ Rang d'aventurier</span>
                <strong>{rank}</strong>
              </button>

              <div>
                <span>🏆 Succès</span>
                <strong>
                  {formatNumber(snapshot.activity.successes)}
                </strong>
              </div>

              <div>
                <span>🏛️ Musée</span>
                <strong>
                  {formatNumber(
                    snapshot.activity.museumPieces,
                  )}
                </strong>
              </div>
            </div>
          </section>
        </div>

        <div className="tb-character-right-column">
          <section className="tb-character-panel">
            <div className="tb-character-panel-heading">
              <div>
                <p className="eyebrow">IDENTITÉ</p>
                <h3>Vie dans le Royaume</h3>
              </div>

              <span className="tb-character-hint">
                Cliquer pour ouvrir
              </span>
            </div>

            <div className="tb-character-identity-list">
              {snapshot.identity.map((item) => (
                <IdentityCard
                  key={item.kind}
                  item={item}
                  onOpen={(kind) => void openDetail(kind)}
                />
              ))}
            </div>
          </section>

          {snapshot.life && (
            <section className="tb-character-panel">
              <div className="tb-character-panel-heading">
                <div>
                  <p className="eyebrow">STATUT</p>
                  <h3>Vie personnelle</h3>
                </div>
              </div>

              <div className="tb-character-life-grid">
                <article>
                  <span>🏅 Rang du Royaume</span>
                  <strong>{snapshot.life.kingdomRank}</strong>
                </article>
                <article>
                  <span>👑 Réputation</span>
                  <strong>{snapshot.life.reputationRank}</strong>
                </article>
                <article>
                  <span>💞 Couple</span>
                  <strong>{snapshot.life.relationship}</strong>
                </article>
                <article>
                  <span>💍 Mariage</span>
                  <strong>{snapshot.life.marriage}</strong>
                </article>
                <article>
                  <span>🐾 Compagnons</span>
                  <strong>
                    {snapshot.life.petsActive} actif(s) • {snapshot.life.petsOwned} possédé(s)
                  </strong>
                </article>
                <article>
                  <span>🏠 Capacité du chenil</span>
                  <strong>{snapshot.life.petCapacity}</strong>
                </article>
              </div>
            </section>
          )}

          <section className="tb-character-panel">
            <div className="tb-character-panel-heading">
              <div>
                <p className="eyebrow">ROYAUME</p>
                <h3>Activité</h3>
              </div>
            </div>

            <div className="tb-character-activity-grid">
              {ACTIVITY_CARDS.map((item) => (
                <article key={item.key}>
                  <span>{item.icon}</span>
                  <small>{item.label}</small>
                  <strong>
                    {formatNumber(
                      snapshot.activity[item.key],
                    )}
                  </strong>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <footer className="tb-character-footer-note">
        <span>🔗</span>
        <div>
          <strong>
            Fiche reliée au personnage réel de TailBlue.
          </strong>
          <p>
            Discord, race, histoire, métier, guilde, résidence,
            compagnon, équipement, statistiques et activité sont lus
            côté serveur. La page se resynchronise automatiquement
            pendant que l'application reste ouverte.
          </p>
        </div>
      </footer>

      <CharacterDetailDrawer
        open={drawerOpen}
        loading={detailLoading}
        detail={detail}
        error={detailError}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}
