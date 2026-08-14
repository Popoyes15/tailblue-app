import { useMemo, useState } from "react";
import { QUESTS, type QuestState, type TailBlueQuest } from "../data/questLocalData";
import "./adventurePages.css";

const stateLabels: Record<QuestState, string> = {
  available: "Disponibles",
  active: "Actives",
  completed: "Terminées",
};

export default function QuestsPage() {
  const [tab, setTab] = useState<QuestState>("active");
  const [ownership, setOwnership] = useState<"mine" | "all">("all");
  const [selected, setSelected] = useState<TailBlueQuest | null>(null);

  const visible = useMemo(
    () =>
      QUESTS.filter(
        (quest) =>
          quest.state === tab &&
          (ownership === "all" || quest.source === ownership)
      ),
    [tab, ownership]
  );

  return (
    <section className="adventure-page">
      <div className="adventure-heading">
        <div>
          <p className="eyebrow">JOURNAL D'AVENTURE</p>
          <h2>Quêtes</h2>
          <p className="adventure-muted">
            Missions du Royaume et objectifs déclenchés par tes activités.
          </p>
        </div>

        <label className="quest-filter">
          <span>Filtre</span>
          <select
            value={ownership}
            onChange={(e) => setOwnership(e.target.value as "mine" | "all")}
          >
            <option value="all">Toutes les quêtes</option>
            <option value="mine">Quêtes de la Mine</option>
          </select>
        </label>
      </div>

      <div className="quest-tabs">
        {(["available", "active", "completed"] as QuestState[]).map((state) => (
          <button
            key={state}
            className={tab === state ? "selected" : ""}
            onClick={() => setTab(state)}
          >
            {stateLabels[state]}
            <span>{QUESTS.filter((q) => q.state === state).length}</span>
          </button>
        ))}
      </div>

      <div className="quest-grid">
        {visible.map((quest) => {
          const percent = Math.min(
            100,
            Math.round((quest.progress / Math.max(1, quest.objective)) * 100)
          );

          return (
            <button
              key={quest.id}
              className={`quest-card quest-${quest.state}`}
              onClick={() => setSelected(quest)}
            >
              <div className="quest-card-top">
                <span className="quest-source">
                  {quest.source === "mine" ? "⛏️ Mine" : "👑 Royaume"}
                </span>
                <span className={`quest-difficulty ${quest.difficulty}`}>
                  {quest.difficulty}
                </span>
              </div>

              <h3>{quest.name}</h3>
              <p>{quest.description}</p>

              <div className="quest-progress-copy">
                <span>Progression</span>
                <strong>
                  {quest.progress}/{quest.objective}
                </strong>
              </div>

              <div className="quest-progress-track">
                <div style={{ width: `${percent}%` }} />
              </div>

              <div className="quest-rewards">
                <span>🍪 {quest.rewardCookies}</span>
                <span>✨ {quest.rewardXp} XP</span>
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="quest-modal-backdrop" onClick={() => setSelected(null)}>
          <article className="quest-modal" onClick={(e) => e.stopPropagation()}>
            <button className="quest-modal-close" onClick={() => setSelected(null)}>
              ×
            </button>

            <p className="eyebrow">
              {selected.source === "mine" ? "⛏️ QUÊTE DE LA MINE" : "QUÊTE DU ROYAUME"}
            </p>

            <h2>{selected.name}</h2>
            <p className="quest-modal-description">{selected.description}</p>

            <div className="quest-modal-grid">
              <div><span>Difficulté</span><strong>{selected.difficulty}</strong></div>
              <div><span>Événement suivi</span><strong>{selected.event}</strong></div>
              <div><span>Progression</span><strong>{selected.progress}/{selected.objective}</strong></div>
              <div><span>État</span><strong>{stateLabels[selected.state]}</strong></div>
            </div>

            <h3>Récompenses</h3>
            <div className="quest-modal-rewards">
              <div>🍪 <strong>{selected.rewardCookies}</strong> cookies</div>
              <div>✨ <strong>{selected.rewardXp}</strong> XP</div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}
