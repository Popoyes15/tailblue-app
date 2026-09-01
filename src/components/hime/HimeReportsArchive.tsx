// TAILBLUE_HIME_REPORTS_SAME_MP_APP_UI_V1_1_20260901
// TAILBLUE_HIME_REPORTS_ARCHIVE_UI_V1_20260901
import { useEffect, useMemo, useState } from "react";
import { himeApi, himeApiConfigured } from "../../api/himeApi";
import type {
  HimeReport,
  HimeReportsSnapshot,
} from "../../types/hime";
import { Card, Empty, fmtDate, fmtDecimal, fmtNumber } from "./HimeShared";

const MONTHS = [
  "", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function groupLabel(report: HimeReport) {
  const anchor = report.kind === "week" ? report.endDate : report.startDate;
  const [year, month] = anchor.split("-");
  const monthNumber = Number(month);
  return {
    year,
    month: `${MONTHS[monthNumber] ?? month} ${year}`,
  };
}

function reportBadge(report: HimeReport) {
  if (report.generationMode === "automatic") {
    return report.discordDmSentAt ? "AUTO · 📨 MP" : "AUTO";
  }
  return `MANUEL${report.manualVersion ? ` V${report.manualVersion}` : ""}`;
}

function ReportDetails({ report }: { report: HimeReport }) {
  const stats = report.stats;
  return (
    <details className="tb-hime-report-card">
      <summary>
        <div>
          <span className={`tb-hime-report-kind ${report.kind}`}>
            {report.kind === "week" ? "📆 SEMAINE" : "🗓️ MOIS"}
          </span>
          <strong>{report.label}</strong>
          <small>
            Généré {fmtDate(report.generatedAt)} • {reportBadge(report)}
            {!report.finalized && report.statsThroughDate
              ? ` • données jusqu'au ${fmtDate(`${report.statsThroughDate}T12:00:00`)}`
              : ""}
          </small>
        </div>
        <div className="tb-hime-report-summary-right">
          {report.coverage === "partial" && <span className="warning">Données partielles</span>}
          {!report.finalized && <span>En cours</span>}
          <b>{fmtNumber(stats.totalCommands)} cmd</b>
        </div>
      </summary>

      <div className="tb-hime-report-body">
        <div className="tb-hime-report-kpis">
          <div><span>⚙️ Commandes</span><strong>{fmtNumber(stats.totalCommands)}</strong></div>
          <div><span>👥 Joueurs</span><strong>{fmtNumber(stats.uniqueUsers)}</strong></div>
          <div><span>📆 Moy./jour</span><strong>{fmtDecimal(stats.avgPerDay)}</strong></div>
          <div><span>🎮 Moy./joueur actif</span><strong>{fmtDecimal(stats.avgPerActiveUserDay)}</strong></div>
        </div>

        <div className="tb-hime-report-columns">
          <Card>
            <p className="tb-hime-eyebrow">ACTIVITÉ QUOTIDIENNE</p>
            <div className="tb-hime-report-days">
              {stats.daily.map((day) => (
                <div key={day.date}>
                  <span>{new Date(`${day.date}T12:00:00`).toLocaleDateString("fr-CH", { weekday: "short", day: "2-digit", month: "2-digit" })}</span>
                  <strong>{fmtNumber(day.total)}</strong>
                  <small>{fmtNumber(day.users)} joueur(s)</small>
                </div>
              ))}
            </div>
          </Card>

          <div className="tb-hime-stack">
            <Card>
              <p className="tb-hime-eyebrow">🔥 TOP COMMANDES</p>
              <div className="tb-hime-report-ranking">
                {stats.topCommands.length ? stats.topCommands.map((item, index) => (
                  <div key={`${item.name}-${index}`}>
                    <span>{index + 1}</span><strong>!{item.name}</strong><b>{fmtNumber(item.count)}</b>
                  </div>
                )) : <p className="tb-hime-muted">Aucune commande.</p>}
              </div>
            </Card>
            <Card>
              <p className="tb-hime-eyebrow">👑 JOUEURS ACTIFS</p>
              <div className="tb-hime-report-ranking">
                {stats.topUsers.length ? stats.topUsers.map((item, index) => (
                  <div key={`${item.id ?? item.name}-${index}`}>
                    <span>{index + 1}</span><strong>{item.name}</strong><b>{fmtNumber(item.count)}</b>
                  </div>
                )) : <p className="tb-hime-muted">Aucun joueur.</p>}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </details>
  );
}

export default function HimeReportsArchive({
  refreshToken,
  onBack,
}: {
  refreshToken: number;
  onBack: () => void;
}) {
  const [data, setData] = useState<HimeReportsSnapshot>({ generatedAt: "", reports: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"week" | "month">("week");
  const [periodKey, setPeriodKey] = useState("");

  async function load() {
    if (!himeApiConfigured) {
      setLoading(false);
      return;
    }
    try {
      const next = await himeApi.reports();
      setData(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Archives indisponibles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [refreshToken]);

  async function generate(
    selectedKind: "week" | "month",
    selectedKey?: string,
  ) {
    if (!himeApiConfigured) return;
    setMessage("Création du bilan…");
    try {
      const result = await himeApi.generateReport({
        kind: selectedKind,
        periodKey: selectedKey?.trim() || undefined,
      });
      setMessage(`✅ ${result.report.label} archivé.`);
      setPeriodKey("");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Création impossible.");
    }
  }

  const grouped = useMemo(() => {
    const years = new Map<string, Map<string, HimeReport[]>>();
    for (const report of data.reports) {
      const group = groupLabel(report);
      if (!years.has(group.year)) years.set(group.year, new Map());
      const months = years.get(group.year)!;
      if (!months.has(group.month)) months.set(group.month, []);
      months.get(group.month)!.push(report);
    }
    return [...years.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [data.reports]);

  return (
    <>
      <div className="tb-hime-segmented">
        <button onClick={onBack}>Temps réel</button>
        <button className="active">Archives</button>
      </div>

      <Card>
        <div className="tb-hime-card-head">
          <div>
            <p className="tb-hime-eyebrow">ARCHIVES ROYALES</p>
            <h2>Générer un bilan</h2>
          </div>
          <span>Les rapports terminés restent figés.</span>
        </div>

        <div className="tb-hime-report-quick-actions">
          <button onClick={() => void generate("week")}>✨ Cette semaine</button>
          <button onClick={() => void generate("month")}>✨ Ce mois</button>
        </div>

        <div className="tb-hime-report-custom">
          <select value={kind} onChange={(event) => setKind(event.target.value as "week" | "month")}>
            <option value="week">Semaine</option>
            <option value="month">Mois</option>
          </select>
          <input
            value={periodKey}
            onChange={(event) => setPeriodKey(event.target.value)}
            placeholder={kind === "week" ? "2026-W36" : "2026-09"}
          />
          <button disabled={!periodKey.trim()} onClick={() => void generate(kind, periodKey)}>
            Générer cette période
          </button>
        </div>
        {message && <div className="tb-hime-message">{message}</div>}
      </Card>

      {loading ? (
        <Card><p className="tb-hime-muted">Chargement des archives…</p></Card>
      ) : !data.reports.length ? (
        <Empty icon="📚" title="Aucun bilan archivé" text="Les semaines et mois terminés apparaîtront ici automatiquement." />
      ) : (
        <div className="tb-hime-report-library">
          {grouped.map(([year, months]) => (
            <section key={year} className="tb-hime-report-year">
              <h2>📚 {year}</h2>
              {[...months.entries()].map(([month, reports]) => (
                <div key={month} className="tb-hime-report-month">
                  <h3>{month}</h3>
                  {reports.map((report) => <ReportDetails key={report.id} report={report} />)}
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </>
  );
}
