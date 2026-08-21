import { useEffect } from "react";
import { plainTailBlueText } from "./CompanionStory";

export type CompanionNoticeData = {
  icon: string;
  title: string;
  message: string;
  tone?: "success" | "info" | "error";
  stats?: Array<{ icon: string; label: string }>;
};

export default function CompanionNotice({
  notice,
  onClose,
}: {
  notice: CompanionNoticeData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(onClose, notice.tone === "error" ? 6500 : 4700);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!notice) return null;

  return (
    <aside className={`tb-comp-notice is-${notice.tone ?? "info"}`} role="status" aria-live="polite">
      <div className="tb-comp-notice-icon">{notice.icon}</div>
      <div className="tb-comp-notice-copy">
        <small>TAILBLUE · SANCTUAIRE</small>
        <strong>{plainTailBlueText(notice.title)}</strong>
        <p>{plainTailBlueText(notice.message)}</p>
        {notice.stats && notice.stats.length > 0 && (
          <div className="tb-comp-notice-stats">
            {notice.stats.map((stat, index) => (
              <span key={`${stat.label}-${index}`}>{stat.icon} {plainTailBlueText(stat.label)}</span>
            ))}
          </div>
        )}
      </div>
      <button onClick={onClose} aria-label="Fermer la notification">×</button>
    </aside>
  );
}
