import { useMemo, useState } from "react";
import { JOBS, WORK_EVENT_DEMO } from "../data/activityLocalData";
import "./activityPages.css";

const PLAYER_LEVEL = 42;
const CURRENT_JOB_ID = "princesse";

export default function WorkPage() {
  const [view, setView] = useState<"work" | "jobs" | "stats">("work");
  const [jobId, setJobId] = useState(CURRENT_JOB_ID);
  const [eventOpen, setEventOpen] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const currentJob = useMemo(
    () => JOBS.find((job) => job.id === jobId) ?? JOBS[0],
    [jobId]
  );

  function chooseJob(nextId: string) {
    const job = JOBS.find((item) => item.id === nextId);
    if (!job) return;
    if (job.level !== 9999 && PLAYER_LEVEL < job.level) return;
    if (job.level === 9999 && nextId !== CURRENT_JOB_ID) return;
    setJobId(nextId);
  }

  function startWork() {
    setResult(null);
    setEventOpen(true);
  }

  function resolveChoice(choiceId: string) {
    const messages: Record<string, string> = {
      careful: "💼 Travail terminé proprement. Récompenses calculées par le backend plus tard.",
      bold: "✨ Ton initiative attire l'attention. Le résultat réel viendra de work_events.py.",
      heroic: "👑 Décision audacieuse ! Le backend déterminera bonus, malus et loot.",
    };
    setResult(messages[choiceId] ?? "Travail terminé.");
    setEventOpen(false);
  }

  return (
    <section className="activity-page work-page">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">VIE DU ROYAUME</p>
          <h2>Work</h2>
          <p className="activity-muted">
            Exerce ton métier, rencontre des événements et développe ta réputation.
          </p>
        </div>

        <div className="activity-nav">
          <button className={view === "work" ? "selected" : ""} onClick={() => setView("work")}>Travailler</button>
          <button className={view === "jobs" ? "selected" : ""} onClick={() => setView("jobs")}>Métiers</button>
          <button className={view === "stats" ? "selected" : ""} onClick={() => setView("stats")}>Statistiques</button>
        </div>
      </div>

      {view === "work" && (
        <>
          <article className="work-hero">
            <div className="work-hero-glow" />

            <div className="work-job-icon">{currentJob.name.split(" ")[0]}</div>

            <div className="work-job-copy">
              <p className="eyebrow">MÉTIER ACTUEL</p>
              <h2>{currentJob.name}</h2>
              <p>{currentJob.description}</p>

              <div className="activity-tags">
                <span>⭐ Niveau {PLAYER_LEVEL}</span>
                <span>⏳ Repos : backend</span>
                <span>🐯 Sugus</span>
                <span>🏠 Bonus résidence</span>
              </div>
            </div>

            <button className="activity-primary-action" onClick={startWork}>
              <span>💼</span>
              Commencer à travailler
            </button>
          </article>

          <div className="activity-dashboard-grid">
            <article className="activity-panel">
              <p className="eyebrow">BONUS ACTIFS</p>
              <h3>Conditions du jour</h3>

              <div className="bonus-list">
                <div>
                  <span>🐾 Compagnon</span>
                  <strong>Les effets du pet actif seront appliqués</strong>
                </div>
                <div>
                  <span>🏠 Résidence</span>
                  <strong>Cookies, XP et cooldown selon la maison</strong>
                </div>
                <div>
                  <span>💞 Mariage</span>
                  <strong>Bonus de couple si actif</strong>
                </div>
                <div>
                  <span>✨ Faveur quotidienne</span>
                  <strong>Boost compatible automatiquement</strong>
                </div>
              </div>
            </article>

            <article className="activity-panel">
              <p className="eyebrow">DERNIER TRAVAIL</p>
              <h3>Résultat</h3>

              <div className="activity-result-box">
                {result ?? "Aucun travail effectué depuis l'ouverture de l'application."}
              </div>

              <div className="reward-preview">
                <span>🍪 Cookies</span>
                <span>✨ XP</span>
                <span>👑 Réputation</span>
                <span>🎁 Loot métier</span>
              </div>
            </article>
          </div>
        </>
      )}

      {view === "jobs" && (
        <div className="jobs-grid">
          {JOBS.map((job) => {
            const locked =
              (job.level === 9999 && job.id !== CURRENT_JOB_ID) ||
              (job.level !== 9999 && PLAYER_LEVEL < job.level);
            const current = job.id === jobId;

            return (
              <button
                key={job.id}
                className={`job-card ${current ? "current" : ""} ${locked ? "locked" : ""}`}
                disabled={locked}
                onClick={() => chooseJob(job.id)}
              >
                <div className="job-card-top">
                  <span>{job.name.split(" ")[0]}</span>
                  {current ? <b>✓ Actuel</b> : locked ? <b>🔒</b> : <b>Niv. {job.level}</b>}
                </div>

                <h3>{job.name}</h3>
                <p>{job.description}</p>

                <small>
                  {job.level === 9999 ? "Réservé à Hime-sama" : `Niveau ${job.level} requis`}
                </small>
              </button>
            );
          })}
        </div>
      )}

      {view === "stats" && (
        <div className="activity-stats-grid">
          <div><span>💼</span><small>Travaux effectués</small><strong>—</strong></div>
          <div><span>🍪</span><small>Cookies gagnés</small><strong>—</strong></div>
          <div><span>✨</span><small>XP gagnée</small><strong>—</strong></div>
          <div><span>👑</span><small>Réputation gagnée</small><strong>—</strong></div>
          <div><span>🎁</span><small>Objets de métier</small><strong>—</strong></div>
          <div><span>🏆</span><small>Classement travail</small><strong>—</strong></div>
        </div>
      )}

      {eventOpen && (
        <div className="activity-modal-backdrop" onClick={() => setEventOpen(false)}>
          <article className="activity-event-modal" onClick={(e) => e.stopPropagation()}>
            <button className="activity-modal-close" onClick={() => setEventOpen(false)}>×</button>

            <p className="eyebrow">ÉVÉNEMENT DE TRAVAIL</p>
            <h2>{WORK_EVENT_DEMO.title}</h2>
            <p className="activity-event-description">{WORK_EVENT_DEMO.description}</p>

            <div className="event-choice-list">
              {WORK_EVENT_DEMO.choices.map((choice) => (
                <button key={choice.id} onClick={() => resolveChoice(choice.id)}>
                  <div>
                    <strong>{choice.label}</strong>
                    <span>{choice.description}</span>
                  </div>
                  <b className={`risk-${choice.risk}`}>{choice.risk}</b>
                </button>
              ))}
            </div>

            <div className="backend-note">
              Les vrais textes, choix et résultats seront fournis par <code>work_events.py</code>.
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
