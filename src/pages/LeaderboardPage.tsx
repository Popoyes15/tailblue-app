import { useState } from "react";
import "./remainingPages.css";

const categories = [
  { id: "level", label: "⭐ Niveau", description: "Classement Royal des Niveaux" },
  { id: "rank", label: "⚔️ Aventurier", description: "Rang calculé par GuildHunt V2" },
  { id: "museum", label: "🏛️ Musée", description: "Nombre de pièces puis valeur estimée" },
  { id: "work", label: "💼 Work", description: "Statistiques de travail" },
];

export default function LeaderboardPage() {
  const [category, setCategory] = useState("level");

  const current = categories.find((item) => item.id === category) ?? categories[0];

  return (
    <section className="extra-page leaderboard-page">
      <div className="extra-heading">
        <div>
          <p className="eyebrow">REGISTRES ROYAUX</p>
          <h2>Classement</h2>
          <p className="extra-muted">
            Une seule interface pour les différents classements du Royaume.
          </p>
        </div>
      </div>

      <div className="leaderboard-tabs">
        {categories.map((item) => (
          <button key={item.id} className={category === item.id ? "selected" : ""} onClick={() => setCategory(item.id)}>
            {item.label}
          </button>
        ))}
      </div>

      <article className="leaderboard-banner">
        <div>
          <p className="eyebrow">CLASSEMENT SÉLECTIONNÉ</p>
          <h2>{current.label}</h2>
          <p>{current.description}</p>
        </div>
        <span className="leaderboard-crown">👑</span>
      </article>

      <div className="podium">
        <div className="podium-slot second"><span>🥈</span><strong>Connexion</strong><small>backend</small></div>
        <div className="podium-slot first"><span>🥇</span><strong>Connexion</strong><small>backend</small></div>
        <div className="podium-slot third"><span>🥉</span><strong>Connexion</strong><small>backend</small></div>
      </div>

      <div className="ranking-table">
        <div className="ranking-head"><span>#</span><span>Aventurier</span><span>Valeur</span><span>Évolution</span></div>
        {Array.from({ length: 7 }).map((_, index) => (
          <div className="ranking-row" key={index}>
            <span>{index + 4}</span>
            <span><i className="avatar-skeleton" /> En attente du serveur</span>
            <strong>—</strong>
            <em>—</em>
          </div>
        ))}
      </div>

      <div className="extra-note">
        Aucun faux joueur n'est injecté : dès que l'API est branchée, cette page pourra reprendre directement <code>topniveau</code>, le rang aventurier, le classement des musées et les statistiques Work.
      </div>
    </section>
  );
}
