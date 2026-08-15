import { useCallback, useEffect, useMemo, useState } from "react";
import { loadRoadmapSnapshot, subscribeInformation } from "../api/informationApi";
import type { RoadmapSnapshot, RoadmapStatus } from "../types/information";
import "./informationFinal.css";

const EMPTY: RoadmapSnapshot = { items: [], connected: false, mode: "offline" };
const ORDER: RoadmapStatus[] = ["current", "next", "done", "later", "paused"];
const LABELS: Record<RoadmapStatus, string> = {
  done: "Terminé",
  current: "En cours",
  next: "Prochaine étape",
  later: "Plus tard",
  paused: "En attente",
};

export default function RoadmapPage() {
  const [snapshot, setSnapshot] = useState<RoadmapSnapshot>(EMPTY);
  const [filter, setFilter] = useState<"all" | RoadmapStatus>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      setSnapshot(await loadRoadmapSnapshot());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
    const timer = window.setInterval(() => void refresh(true), 60_000);
    const unsubscribe = subscribeInformation((type) => {
      if (type === "roadmap" || type === "all") void refresh(true);
    });
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [refresh]);

  const counts = useMemo(() => Object.fromEntries(ORDER.map((status) => [status, snapshot.items.filter((item) => item.status === status).length])), [snapshot.items]);
  const visible = filter === "all" ? snapshot.items : snapshot.items.filter((item) => item.status === filter);
  const doneCount = snapshot.items.filter((item) => item.status === "done").length;
  const totalCount = snapshot.items.length;
  const globalProgress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <section className="info-page roadmap-final-page">
      <header className="info-heading">
        <div>
          <p className="info-eyebrow">🗺️ AVENIR DU ROYAUME</p>
          <h1>Roadmap</h1>
          <p>Une vue claire des fondations terminées, du chantier actuel et des prochaines connexions de TailBlue.</p>
        </div>
        <div className="news-actions-final">
          <RoadmapConnection snapshot={snapshot} />
          <button onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "Actualisation…" : "↻ Actualiser"}</button>
        </div>
      </header>

      {snapshot.mode === "preview" && (
        <div className="info-preview-banner">🧪 Aperçu développeur : cette roadmap locale sert à préparer l'interface. Une fois hébergée, l'API pourra la modifier sans reconstruire l'application.</div>
      )}

      <div className="roadmap-overview-final">
        <div>
          <span>PROGRESSION GLOBALE</span>
          <strong>{globalProgress}%</strong>
          <small>{doneCount} étape(s) terminée(s) sur {totalCount}</small>
        </div>
        <div className="roadmap-global-bar"><i style={{ width: `${globalProgress}%` }} /></div>
        <div className="roadmap-kpis-final">
          <span><b>{counts.current ?? 0}</b> en cours</span>
          <span><b>{counts.next ?? 0}</b> prochaines</span>
          <span><b>{counts.later ?? 0}</b> plus tard</span>
          <span><b>{counts.paused ?? 0}</b> en attente</span>
        </div>
      </div>

      <div className="roadmap-filter-final">
        <button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>Tout · {totalCount}</button>
        {ORDER.map((status) => (
          <button key={status} className={filter === status ? "selected" : ""} onClick={() => setFilter(status)}>{LABELS[status]} · {counts[status] ?? 0}</button>
        ))}
      </div>

      {loading ? (
        <div className="info-empty-state"><span>🗺️</span><h2>Chargement de la roadmap…</h2></div>
      ) : visible.length ? (
        <div className="roadmap-list-final">
          {visible.map((item, index) => (
            <article key={item.id} className={`roadmap-item-final status-${item.status}`}>
              <div className="roadmap-step-final">{String(index + 1).padStart(2, "0")}</div>
              <section>
                <div className="roadmap-item-meta-final">
                  <span className="roadmap-status-final">{LABELS[item.status]}</span>
                  {item.area && <span>{item.area}</span>}
                  {item.target && <span>🎯 {item.target}</span>}
                </div>
                <h2>{item.title}</h2>
                <p>{item.description}</p>
                {typeof item.progress === "number" && (
                  <div className="roadmap-progress-final"><i style={{ width: `${item.progress}%` }} /><span>{item.progress}%</span></div>
                )}
              </section>
            </article>
          ))}
        </div>
      ) : (
        <div className="info-empty-state">
          <span>📭</span><h2>{snapshot.connected ? "Aucune étape dans ce filtre" : "Roadmap non connectée"}</h2>
          <p>{snapshot.connected ? "Choisis un autre statut." : "Le backend deviendra la source de vérité de cette page en production."}</p>
        </div>
      )}

      <div className="roadmap-vision-final">
        <span>🌌</span>
        <div><p className="info-eyebrow">VISION</p><h2>Un seul Royaume, plusieurs interfaces</h2><p>Discord et l'application Desktop doivent lire le même backend TailBlue afin qu'une action effectuée d'un côté soit visible de l'autre.</p></div>
      </div>
    </section>
  );
}

function RoadmapConnection({ snapshot }: { snapshot: RoadmapSnapshot }) {
  if (snapshot.connected) return <span className="info-connection connected">● Roadmap connectée</span>;
  if (snapshot.mode === "preview") return <span className="info-connection preview">○ Aperçu local</span>;
  return <span className="info-connection offline">● Hors ligne</span>;
}
