import "./playerPages.css";

const player = {
  name: "Hime-sama",
  subtitle: "Administratrice • TailBlue",
  avatarText: "H",
  level: 42,
  rank: "—",
  rankScore: null as number | null,
  race: "Synchronisation future",
  job: "👑 Princesse",
  guild: "—",
  residence: "👑 Château de Hime-sama",
  reputation: 0,
  royalRank: "—",
  xp: 0,
  xpNeeded: 1,
  cookies: 0,
  hugsGiven: 0,
  hugsReceived: 0,
  chests: 0,
  achievements: 0,
  achievementsTotal: 0,
  grimoirePercent: 0,
  companions: ["Sugus"],
  stats: {
    hp: 100,
    attack: 5,
    defense: 5,
    crit: 5,
    dodge: 5,
    luck: 0,
  },
};

const statRows = [
  ["❤️", "PV", player.stats.hp],
  ["⚔️", "Attaque", player.stats.attack],
  ["🛡️", "Défense", player.stats.defense],
  ["🎯", "Critique", player.stats.crit],
  ["💨", "Esquive", player.stats.dodge],
  ["🍀", "Chance", player.stats.luck],
];

export default function CharacterPage() {
  const xpPercent = Math.max(
    0,
    Math.min(100, (player.xp / Math.max(1, player.xpNeeded)) * 100)
  );

  return (
    <section className="player-page">
      <div className="player-page-heading">
        <div>
          <p className="eyebrow">PROFIL DE L'AVENTURIER</p>
          <h2>Personnage</h2>
          <p className="player-muted">
            Ton identité, ta progression et tes statistiques TailBlue au même endroit.
          </p>
        </div>

        <span className="sync-badge">Synchronisation API à venir</span>
      </div>

      <article className="profile-hero">
        <div className="profile-avatar-large">{player.avatarText}</div>

        <div className="profile-main-copy">
          <span className="profile-kicker">AVENTURIÈRE</span>
          <h2>{player.name}</h2>
          <p>{player.subtitle}</p>

          <div className="profile-tags">
            <span>Niveau {player.level}</span>
            <span>
              Rang aventurier {player.rank}
              {player.rankScore !== null ? ` • ${player.rankScore} pts` : ""}
            </span>
            <span>{player.job}</span>
          </div>
        </div>

        <div className="profile-rank-orb">
          <span>RANG</span>
          <strong>{player.rank}</strong>
          <small>Valeur réelle via backend</small>
        </div>
      </article>

      <div className="player-columns">
        <div className="player-column">
          <article className="player-panel">
            <div className="panel-title">
              <div>
                <p className="eyebrow">COMBAT</p>
                <h3>Statistiques</h3>
              </div>
            </div>

            <div className="combat-stat-grid">
              {statRows.map(([emoji, label, value]) => (
                <div className="combat-stat-card" key={String(label)}>
                  <span>{emoji}</span>
                  <div>
                    <small>{label}</small>
                    <strong>{value}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="player-panel">
            <p className="eyebrow">PROGRESSION</p>
            <h3>Expérience</h3>

            <div className="xp-line">
              <span>Niveau {player.level}</span>
              <strong>
                {player.xp.toLocaleString("fr-CH")} /{" "}
                {player.xpNeeded.toLocaleString("fr-CH")} XP
              </strong>
            </div>

            <div className="xp-track">
              <div className="xp-fill" style={{ width: `${xpPercent}%` }} />
            </div>

            <div className="progress-mini-grid">
              <div>
                <span>👑 Réputation</span>
                <strong>{player.reputation}</strong>
              </div>
              <div>
                <span>🏅 Rang royal</span>
                <strong>{player.royalRank}</strong>
              </div>
              <div>
                <span>🏆 Succès</span>
                <strong>
                  {player.achievements}/{player.achievementsTotal || "—"}
                </strong>
              </div>
              <div>
                <span>📚 Grimoire</span>
                <strong>{player.grimoirePercent}%</strong>
              </div>
            </div>
          </article>
        </div>

        <div className="player-column">
          <article className="player-panel">
            <p className="eyebrow">IDENTITÉ</p>
            <h3>Vie dans le Royaume</h3>

            <div className="profile-info-list">
              <div>
                <span>🧬 Race</span>
                <strong>{player.race}</strong>
              </div>
              <div>
                <span>💼 Métier</span>
                <strong>{player.job}</strong>
              </div>
              <div>
                <span>🏰 Guilde</span>
                <strong>{player.guild}</strong>
              </div>
              <div>
                <span>🏠 Résidence</span>
                <strong>{player.residence}</strong>
              </div>
              <div>
                <span>🐾 Compagnon</span>
                <strong>{player.companions.join(", ") || "Aucun"}</strong>
              </div>
            </div>
          </article>

          <article className="player-panel">
            <p className="eyebrow">ROYAUME</p>
            <h3>Activité</h3>

            <div className="activity-number-grid">
              <div><span>🍪</span><small>Cookies</small><strong>{player.cookies}</strong></div>
              <div><span>🫂</span><small>Câlins donnés</small><strong>{player.hugsGiven}</strong></div>
              <div><span>💜</span><small>Câlins reçus</small><strong>{player.hugsReceived}</strong></div>
              <div><span>📦</span><small>Coffres ouverts</small><strong>{player.chests}</strong></div>
            </div>
          </article>
        </div>
      </div>

      <div className="sync-note">
        <strong>ℹ️ Prototype connecté à la structure réelle de TailBlue.</strong>
        <span>
          Les valeurs de profil affichées ici seront remplacées automatiquement par
          le profil Discord réel : rang_aventurier, score, race, inventaire, maison,
          pets, réputation, XP et statistiques de combat.
        </span>
      </div>
    </section>
  );
}
