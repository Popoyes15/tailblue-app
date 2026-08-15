import { useEffect, useState } from "react";
import { worldApi } from "../api/worldApi";
import type {
  LeaderboardEntryDto,
  LeaderboardSnapshot,
} from "../types/world";
import "./worldFinal.css";

function medal(index: number, entry: LeaderboardEntryDto) {
  if (entry.isHime) return "👑";
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}.`;
}

export default function LeaderboardPage() {
  const [snapshot, setSnapshot] = useState<LeaderboardSnapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!worldApi.configured) return;
    worldApi
      .getLevelLeaderboard()
      .then((data) => {
        setSnapshot(data);
        setError("");
      })
      .catch((reason) => {
        setError(reason instanceof Error ? reason.message : "API indisponible.");
      });
  }, []);

  return (
    <section className="world-page">
      <header className="world-heading">
        <div>
          <span className="world-eyebrow">MONDE • ROYAUME</span>
          <h1>🏆 Classement</h1>
          <p>
            Le classement réellement existant dans le bot : les 10 meilleurs
            niveaux, calculés depuis l’XP.
          </p>
        </div>
        <div className={`world-api-pill ${snapshot ? "is-live" : ""}`}>
          {snapshot ? "● Classement réel" : "○ En attente de TailBlue"}
        </div>
      </header>

      {error && <div className="world-message">{error}</div>}

      <article className="world-panel world-leaderboard">
        <div className="world-section-title">
          <div>
            <span className="world-kicker">TOPNIVEAU</span>
            <h2>Classement Royal des Niveaux</h2>
          </div>
          <strong>Top 10</strong>
        </div>

        {!snapshot?.entries.length ? (
          <div className="world-empty">
            <span>🏆</span>
            <h3>Aucun faux classement</h3>
            <p>
              Dès que l’API est branchée, cette page affichera les joueurs
              réels triés exactement comme <code>!topniveau</code>.
            </p>
          </div>
        ) : (
          <div className="world-ranking-list">
            {snapshot.entries.slice(0, 10).map((entry, index) => (
              <article
                key={entry.userId}
                className={index < 3 ? `podium p${index + 1}` : ""}
              >
                <span className="world-rank">{medal(index, entry)}</span>
                <div className="world-avatar">
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" />
                  ) : (
                    <span>👤</span>
                  )}
                </div>
                <div>
                  <b>{entry.displayName}</b>
                  <small>
                    {entry.isHime ? "Hime-sama • " : ""}Aventurier TailBlue
                  </small>
                </div>
                <strong>Niveau {entry.level}</strong>
              </article>
            ))}
          </div>
        )}

        {snapshot?.currentUser && (
          <div className="world-current-rank">
            <span>TON NIVEAU</span>
            <b>{snapshot.currentUser.displayName}</b>
            <strong>Niveau {snapshot.currentUser.level}</strong>
          </div>
        )}

        <div className="world-note">
          Les autres classements ne sont pas inventés ici. Quand un classement
          global officiel existera dans le Python (rang aventurier, réputation,
          etc.), on pourra l’ajouter proprement.
        </div>
      </article>
    </section>
  );
}
