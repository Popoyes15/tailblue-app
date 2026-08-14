import { useState } from "react";
import { DRAGONS } from "../data/worldLocalData";
import "./remainingPages.css";

export default function BreedingPage() {
  const [work, setWork] = useState(8);
  const [hunt, setHunt] = useState(12);
  const [daily, setDaily] = useState(1);
  const [showDragons, setShowDragons] = useState(false);

  const ready = work >= 15 && hunt >= 20 && daily >= 1;

  return (
    <section className="extra-page hatchery-page">
      <div className="extra-heading">
        <div>
          <p className="eyebrow">NURSERIE DRACONIQUE</p>
          <h2>Élevage</h2>
          <p className="extra-muted">
            Le bot possède actuellement un vrai système d'incubation de l'Œuf des Origines. La reproduction entre deux pets n'existe pas encore côté Python, donc l'application n'en invente pas une.
          </p>
        </div>
        <span className="source-badge">🥚 Système réel : incubation</span>
      </div>

      <article className="egg-chamber">
        <div className="egg-aura aura-one" />
        <div className="egg-aura aura-two" />

        <div className="egg-stage">
          <div className="egg-ring ring-one" />
          <div className="egg-ring ring-two" />
          <img src="/Dragons/Oeuf_Origines.png" alt="Œuf des Origines" />
        </div>

        <div className="egg-copy">
          <p className="eyebrow">ŒUF DES ORIGINES</p>
          <h2>Quelque chose sommeille à l'intérieur…</h2>
          <p>
            L'incubation avance réellement grâce au Work, au Hunt et au Daily. Une fois les trois objectifs atteints, l'œuf peut éclore en l'une des huit lignées draconiques.
          </p>

          <div className="incubation-bars">
            <Progress label="💼 Work" value={work} max={15} />
            <Progress label="🏹 Hunt" value={hunt} max={20} />
            <Progress label="🎁 Daily" value={daily} max={1} />
          </div>

          <div className="hatchery-actions">
            <button className="extra-primary" disabled={!ready}>
              {ready ? "🐉 Faire éclore l'œuf" : "🥚 Incubation incomplète"}
            </button>
            <button className="extra-secondary" onClick={() => setShowDragons((v) => !v)}>
              {showDragons ? "Masquer les lignées" : "Découvrir les lignées possibles"}
            </button>
          </div>
        </div>
      </article>

      <div className="incubation-demo">
        <span>Prototype visuel</span>
        <button onClick={() => setWork((v) => Math.min(15, v + 1))}>+1 Work</button>
        <button onClick={() => setHunt((v) => Math.min(20, v + 1))}>+1 Hunt</button>
        <button onClick={() => setDaily(1)}>Daily ✓</button>
      </div>

      {showDragons && (
        <div className="dragon-grid">
          {DRAGONS.map((dragon) => (
            <article className="dragon-card" key={dragon.id}>
              <div className="dragon-image-wrap" style={{ backgroundImage: `url("${dragon.image}")` }}>
                <div />
                <img src={dragon.image} alt={dragon.name} />
              </div>
              <div className="dragon-copy">
                <span>{dragon.rarity}</span>
                <h3>{dragon.name}</h3>
                <p>{dragon.description}</p>
                <div>
                  <small>{dragon.habitat}</small>
                  <small>🎲 {dragon.chance}%</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="future-feature-card">
        <div className="future-icon">🧬</div>
        <div>
          <p className="eyebrow">PLUS TARD</p>
          <h3>Reproduction / lignées</h3>
          <p>
            Quand le bot aura un vrai système de reproduction, cette zone pourra accueillir compatibilité des parents, héritage, rareté, œufs et historique — sans inventer la logique avant qu'elle existe.
          </p>
        </div>
      </div>
    </section>
  );
}

function Progress({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="incubation-row">
      <div><span>{label}</span><strong>{value}/{max}</strong></div>
      <div className="incubation-track"><i style={{ width: `${percent}%` }} /></div>
    </div>
  );
}
