import { ROADMAP } from "../data/worldLocalData";
import "./remainingPages.css";

const labels = {
  done: "Terminé",
  current: "En cours",
  next: "Prochaine étape",
  later: "Plus tard",
} as const;

export default function RoadmapPage() {
  return (
    <section className="extra-page">
      <div className="extra-heading">
        <div>
          <p className="eyebrow">AVENIR DU ROYAUME</p>
          <h2>Roadmap</h2>
          <p className="extra-muted">Ce qui existe, ce qu'on branche ensuite, et ce qu'on garde volontairement pour plus tard.</p>
        </div>
      </div>

      <div className="roadmap-track">
        {ROADMAP.map((item, index) => (
          <article key={item.id} className={`roadmap-card status-${item.status}`}>
            <div className="roadmap-number">{String(index + 1).padStart(2,"0")}</div>
            <section>
              <span>{labels[item.status]}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </section>
          </article>
        ))}
      </div>

      <div className="roadmap-final">
        <span>🌌</span>
        <div><p className="eyebrow">VISION</p><h3>Un seul monde, plusieurs interfaces</h3><p>Discord, application desktop et futurs clients utiliseront le même backend TailBlue et les mêmes données.</p></div>
      </div>
    </section>
  );
}
