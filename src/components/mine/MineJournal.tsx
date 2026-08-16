import type { MineJournalEntry } from "../../types/mine";
import { cleanMineText } from "../../data/mineText";

type Props = {
  entries: MineJournalEntry[];
};

function timeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MineJournal({ entries }: Props) {
  const recent = entries.slice(-10).reverse();

  return (
    <section className="tm-mine-journal">
      <div className="tm-journal-head">
        <div>
          <p className="tm-kicker">JOURNAL D'EXPÉDITION</p>
          <h3>Derniers événements</h3>
        </div>
        <span>{entries.length}</span>
      </div>

      <div className="tm-journal-list">
        {recent.length === 0 ? (
          <div className="tm-journal-empty">📜 Le journal est encore vierge.</div>
        ) : recent.map((entry) => (
          <article key={entry.id} className={`tm-journal-entry is-${entry.kind}`}>
            <span className="tm-journal-icon">{entry.icon || "•"}</span>
            <div>
              <div className="tm-journal-entry-title">
                <strong>{cleanMineText(entry.title, "Mine")}</strong>
                <small>{timeLabel(entry.at)}</small>
              </div>
              {entry.message && <p>{cleanMineText(entry.message)}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
