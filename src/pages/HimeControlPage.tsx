import { useEffect, useState } from "react";
import { himeApi, himeApiConfigured } from "../api/himeApi";
import HimeIdeasPanel from "../components/hime/HimeIdeasCanonicalPanel";
import {
  DashboardPanel,
  EconomyPanel,
  ErrorsPanel,
  LogsPanel,
  PlayersPanel,
  SecurityPanel,
  StatsPanel,
  SystemPanel,
} from "../components/hime/HimeAdminPanels";
import type { HimeSection } from "../types/hime";
import "./himeControlFinal.css";

export type { HimeSection } from "../types/hime";

const ICONS: Record<HimeSection, string> = {
  "Bilan général": "📊",
  Statistiques: "📈",
  ShowIdées: "💡",
  Logs: "🧾",
  Erreurs: "🚨",
  Sécurité: "🛡️",
  Joueurs: "👥",
  Économie: "💰",
  "État du système": "💻",
};

export default function HimeControlPage({ section }: { section: HimeSection }) {
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (!himeApiConfigured) return;
    return himeApi.openStream(() => setRefreshToken((value) => value + 1));
  }, []);

  return (
    <section
      className={`tb-hime-page ${
        section === "ShowIdées" ? "tb-hime-page-ideas" : ""
      }`}
    >
      <header className="tb-hime-header">
        <div>
          <p className="tb-hime-eyebrow">👑 HIME CONTROL • ARCHIVES ROYALES</p>
          <h1><span>{ICONS[section]}</span>{section}</h1>
          <p>Console privée de supervision, de gestion et de sécurité de TailBlue.</p>
        </div>
        <div className="tb-hime-header-actions">
          <span className={`tb-hime-connection ${himeApiConfigured ? "online" : "preview"}`}>
            {himeApiConfigured ? "🔐 Backend sécurisé" : "🧪 Aperçu local"}
          </span>
          <button title="Actualiser" onClick={() => setRefreshToken((value) => value + 1)}>↻</button>
        </div>
      </header>

      {!himeApiConfigured && (
        <div className="tb-hime-preview-banner">
          <strong>🧪 MODE APERÇU</strong>
          <span>Les données sensibles sont fictives ou vides. Aucune donnée TailBlue réelle n'est modifiée.</span>
        </div>
      )}

      {section === "Bilan général" && <DashboardPanel refreshToken={refreshToken} />}
      {section === "Statistiques" && <StatsPanel refreshToken={refreshToken} />}
      {section === "ShowIdées" && <HimeIdeasPanel refreshToken={refreshToken} />}
      {section === "Logs" && <LogsPanel refreshToken={refreshToken} />}
      {section === "Erreurs" && <ErrorsPanel refreshToken={refreshToken} />}
      {section === "Sécurité" && <SecurityPanel refreshToken={refreshToken} />}
      {section === "Joueurs" && <PlayersPanel refreshToken={refreshToken} />}
      {section === "Économie" && <EconomyPanel refreshToken={refreshToken} />}
      {section === "État du système" && <SystemPanel refreshToken={refreshToken} />}
    </section>
  );
}
