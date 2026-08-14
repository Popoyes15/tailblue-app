import { useState } from "react";
import { HUNT_EVENT_DEMO, HUNT_MATERIALS } from "../data/activityLocalData";
import "./activityPages.css";

type HuntPhase = "ready" | "event" | "result";

export default function HuntPage() {
  const [phase, setPhase] = useState<HuntPhase>("ready");
  const [result, setResult] = useState("");
  const [loot, setLoot] = useState(HUNT_MATERIALS.slice(0, 3).map((item, index) => ({
    ...item,
    qty: index === 0 ? 2 : 1,
  })));

  function beginHunt() {
    setResult("");
    setPhase("event");
  }

  function resolve(choiceId: string) {
    const text: Record<string, string> = {
      tracks: "🏹 Tu suis la piste sans te précipiter. Une créature laisse derrière elle plusieurs composants.",
      shortcut: "🌲 Tu traverses les bois et découvres une piste inattendue.",
      challenge: "⚔️ Quelque chose de dangereux répond à ton défi. Le vrai moteur décidera de l'issue.",
    };

    const extra = HUNT_MATERIALS[Math.floor(Math.random() * HUNT_MATERIALS.length)];
    setLoot((old) => {
      const found = old.find((item) => item.id === extra.id);
      if (found) {
        return old.map((item) => item.id === extra.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...old, { ...extra, qty: 1 }];
    });

    setResult(text[choiceId] ?? "La chasse se termine.");
    setPhase("result");
  }

  return (
    <section className="activity-page hunt-page">
      <div className="activity-heading">
        <div>
          <p className="eyebrow">TERRES SAUVAGES</p>
          <h2>Hunt</h2>
          <p className="activity-muted">
            Pars à l'aventure, choisis ta réaction et rapporte des composants de créatures.
          </p>
        </div>

        <div className="hunt-status">
          <span>🏹 CHASSE</span>
          <strong>{phase === "ready" ? "Prête" : phase === "event" ? "En cours" : "Terminée"}</strong>
        </div>
      </div>

      <div className="hunt-layout">
        <article className="hunt-scene">
          <div className="hunt-scene-fog" />

          <div className="hunt-landscape">
            <span className="hunt-moon">☾</span>
            <span className="hunt-tree tree-one">♠</span>
            <span className="hunt-tree tree-two">♠</span>
            <span className="hunt-tree tree-three">♠</span>
            <span className="hunt-track track-one">•</span>
            <span className="hunt-track track-two">•</span>
            <span className="hunt-track track-three">•</span>
          </div>

          <div className="hunt-scene-copy">
            <p className="eyebrow">EXPÉDITION</p>
            <h2>Forêts du Royaume</h2>
            <p>
              Le territoire change avec l'événement. Le vrai backend choisira parmi les 60 événements de chasse.
            </p>
          </div>

          {phase === "ready" && (
            <button className="hunt-start-button" onClick={beginHunt}>
              <span>🏹</span>
              Partir en chasse
            </button>
          )}

          {phase === "result" && (
            <button className="hunt-start-button" onClick={beginHunt}>
              <span>↻</span>
              Nouvelle chasse
            </button>
          )}
        </article>

        <div className="hunt-side">
          <article className="activity-panel hunt-companion">
            <p className="eyebrow">COMPAGNON</p>
            <div className="hunt-pet-row">
              <div className="hunt-pet-avatar">🐯</div>
              <div>
                <h3>Sugus</h3>
                <p>Compagnon actif</p>
              </div>
            </div>

            <div className="hunt-pet-bonus">
              <span>🐾 Effets de chasse</span>
              <strong>Synchronisation avec pets.py</strong>
            </div>
          </article>

          <article className="activity-panel">
            <p className="eyebrow">CONDITIONS</p>
            <h3>Avant le départ</h3>

            <div className="bonus-list compact">
              <div><span>⏳ Repos</span><strong>Calcul maison</strong></div>
              <div><span>🏠 Résidence</span><strong>Bonus appliqué</strong></div>
              <div><span>💞 Mariage</span><strong>Bonus si actif</strong></div>
              <div><span>✨ Daily</span><strong>Faveur compatible</strong></div>
            </div>
          </article>
        </div>
      </div>

      {phase === "event" && (
        <article className="hunt-event-inline">
          <div className="hunt-event-head">
            <div>
              <p className="eyebrow">ÉVÉNEMENT DE CHASSE</p>
              <h3>{HUNT_EVENT_DEMO.title}</h3>
            </div>
            <span>Choisis ta réaction</span>
          </div>

          <p>{HUNT_EVENT_DEMO.description}</p>

          <div className="hunt-choice-grid">
            {HUNT_EVENT_DEMO.choices.map((choice) => (
              <button key={choice.id} onClick={() => resolve(choice.id)}>
                <strong>{choice.label}</strong>
                <span>{choice.description}</span>
                <b className={`risk-${choice.risk}`}>{choice.risk}</b>
              </button>
            ))}
          </div>
        </article>
      )}

      {phase === "result" && (
        <article className="hunt-result">
          <div className="hunt-result-icon">✨</div>
          <div>
            <p className="eyebrow">RÉSULTAT</p>
            <h3>Expédition terminée</h3>
            <p>{result}</p>
          </div>

          <div className="hunt-reward-pills">
            <span>🍪 backend</span>
            <span>✨ XP backend</span>
            <span>👑 +2 réputation</span>
          </div>
        </article>
      )}

      <div className="hunt-bottom-grid">
        <article className="activity-panel">
          <div className="activity-panel-title">
            <div>
              <p className="eyebrow">BUTIN DE CHASSE</p>
              <h3>Composants récents</h3>
            </div>
            <span>{loot.reduce((sum, item) => sum + item.qty, 0)} objets</span>
          </div>

          <div className="hunt-loot-grid">
            {loot.map((item) => (
              <div key={item.id}>
                <span>{item.emoji}</span>
                <div><strong>{item.name}</strong><small>inventaire_equipement</small></div>
                <b>×{item.qty}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="activity-panel">
          <p className="eyebrow">PROGRESSION</p>
          <h3>Statistiques de chasse</h3>

          <div className="activity-stats-mini">
            <div><span>🏹 Chasses</span><strong>—</strong></div>
            <div><span>🍪 Cookies</span><strong>—</strong></div>
            <div><span>✨ XP</span><strong>—</strong></div>
            <div><span>🎁 Loot rare</span><strong>—</strong></div>
          </div>
        </article>
      </div>

      <div className="backend-note wide">
        Les matériaux affichés utilisent la famille de loot <code>hunt</code> de <code>items.py</code>.
        Les vrais événements, probabilités, récompenses et choix viendront de <code>hunt_events.py</code> et <code>main.py</code>.
      </div>
    </section>
  );
}
