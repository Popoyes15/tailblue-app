import { useMemo, useState } from "react";
import "./remainingPages.css";

export type HimeSection =
  | "Bilan général"
  | "Statistiques"
  | "Logs"
  | "Erreurs"
  | "Sécurité"
  | "Joueurs"
  | "Économie"
  | "État du système";

const demoLogs = [
  { level:"info", time:"17:20:14", source:"Desktop", text:"Interface TailBlue ouverte." },
  { level:"success", time:"17:20:15", source:"Tauri", text:"Frontend React opérationnel." },
  { level:"warning", time:"17:20:16", source:"API", text:"Backend TailBlue non connecté : mode prototype." },
  { level:"info", time:"17:20:17", source:"Discord", text:"OAuth2 non configuré." },
];

export default function HimeControlPage({ section }: { section: HimeSection }) {
  const [logFilter, setLogFilter] = useState("all");
  const [playerQuery, setPlayerQuery] = useState("");

  const logs = useMemo(
    () => demoLogs.filter((log) => logFilter === "all" || log.level === logFilter),
    [logFilter]
  );

  return (
    <section className="extra-page hime-page">
      <div className="extra-heading hime-heading">
        <div>
          <p className="eyebrow">👑 HIME CONTROL</p>
          <h2>{section}</h2>
          <p className="extra-muted">Console privée d'administration du Royaume.</p>
        </div>
        <div className="hime-lock">🔐 Hime-sama uniquement</div>
      </div>

      {section === "Bilan général" && <Overview />}
      {section === "Statistiques" && <Stats />}
      {section === "Logs" && (
        <Logs logs={logs} filter={logFilter} setFilter={setLogFilter} />
      )}
      {section === "Erreurs" && <Errors />}
      {section === "Sécurité" && <Security />}
      {section === "Joueurs" && <Players query={playerQuery} setQuery={setPlayerQuery} />}
      {section === "Économie" && <Economy />}
      {section === "État du système" && <SystemStatus />}
    </section>
  );
}

function Overview() {
  return (
    <>
      <div className="hime-kpi-grid">
        <Kpi icon="⚙️" label="Commandes aujourd'hui" value="—" sub="tailblue_server_activity.json" />
        <Kpi icon="👥" label="Joueurs actifs" value="—" sub="Serveur officiel uniquement" />
        <Kpi icon="💡" label="Idées ouvertes" value="—" sub="ShowIdées" />
        <Kpi icon="⚠️" label="Alertes" value="1" sub="Backend non connecté" tone="warning" />
      </div>

      <div className="hime-dashboard-grid">
        <article className="hime-card large">
          <p className="eyebrow">SITUATION DU ROYAUME</p>
          <h3>Centre de contrôle</h3>
          <div className="status-orbit">
            <div><span>Desktop</span><strong className="ok">ONLINE</strong></div>
            <div><span>Bot Discord</span><strong>À connecter</strong></div>
            <div><span>API TailBlue</span><strong className="warning">OFFLINE</strong></div>
            <div><span>Base joueurs</span><strong>À connecter</strong></div>
          </div>
        </article>

        <article className="hime-card">
          <p className="eyebrow">À TRAITER</p>
          <h3>Priorités</h3>
          <div className="hime-task-list">
            <div><span>1</span><p>Créer le backend partagé</p></div>
            <div><span>2</span><p>Discord OAuth2 + permissions</p></div>
            <div><span>3</span><p>Brancher les profils réels</p></div>
            <div><span>4</span><p>Connecter la Mine au moteur Python</p></div>
          </div>
        </article>
      </div>
    </>
  );
}

function Stats() {
  const bars = [42, 70, 55, 83, 64, 91, 76];
  return (
    <>
      <div className="hime-kpi-grid">
        <Kpi icon="⌨️" label="Commandes" value="—" sub="Jour / semaine / mois" />
        <Kpi icon="🧍" label="Moy. / joueur" value="—" sub="Période sélectionnée" />
        <Kpi icon="📆" label="Moy. / jour" value="—" sub="Serveur officiel" />
        <Kpi icon="🔥" label="Commande n°1" value="—" sub="Top commandes" />
      </div>
      <article className="hime-card stats-chart-card">
        <div className="panel-headline"><div><p className="eyebrow">ACTIVITÉ</p><h3>7 derniers jours</h3></div><span>Données réelles après connexion</span></div>
        <div className="fake-chart">
          {bars.map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><span>J{index+1}</span></div>)}
        </div>
      </article>
    </>
  );
}

function Logs({ logs, filter, setFilter }: { logs: typeof demoLogs; filter: string; setFilter: (v:string)=>void }) {
  return (
    <>
      <div className="log-toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Tous les niveaux</option>
          <option value="info">Info</option>
          <option value="success">Succès</option>
          <option value="warning">Avertissement</option>
        </select>
        <input placeholder="Rechercher dans les logs…" />
        <button>Exporter</button>
      </div>
      <article className="log-console">
        <div className="console-top"><span>●</span><span>●</span><span>●</span><strong>tailblue://logs/live</strong></div>
        {logs.map((log, index) => (
          <div className={`console-line ${log.level}`} key={index}>
            <time>{log.time}</time><b>{log.level.toUpperCase()}</b><span>[{log.source}]</span><p>{log.text}</p>
          </div>
        ))}
      </article>
    </>
  );
}

function Errors() {
  return (
    <div className="error-center">
      <div className="error-shield">✓</div>
      <h3>Aucune erreur applicative critique enregistrée</h3>
      <p>Le seul état incomplet connu est la connexion au backend, volontairement absente pendant le prototype.</p>
      <div className="error-counters">
        <div><strong>0</strong><span>Critique</span></div>
        <div><strong>0</strong><span>Erreur</span></div>
        <div><strong>1</strong><span>Avertissement</span></div>
      </div>
    </div>
  );
}

function Security() {
  return (
    <div className="security-grid">
      <article className="hime-card security-main">
        <div className="security-icon">🛡️</div>
        <p className="eyebrow">AUTORISATION</p>
        <h3>Hime Control doit être protégé côté serveur</h3>
        <p>Masquer les boutons dans React ne suffit pas. L'API devra vérifier l'identité Discord et l'autorisation Hime avant toute lecture ou modification sensible.</p>
        <div className="security-checks">
          <div className="ok">✓ UI Hime séparée</div>
          <div>○ OAuth2 Discord</div>
          <div>○ Validation backend Hime</div>
          <div>○ Journal des actions admin</div>
          <div>○ Sessions / expiration</div>
        </div>
      </article>
      <article className="hime-card">
        <p className="eyebrow">ACTIONS SENSIBLES</p>
        <h3>Protection prévue</h3>
        <div className="security-action-list">
          <div>💰 Modifier l'économie <span>Backend requis</span></div>
          <div>👤 Modifier un joueur <span>Backend requis</span></div>
          <div>🗑️ Suppression <span>Double confirmation</span></div>
          <div>🔐 Permissions <span>Hime uniquement</span></div>
        </div>
      </article>
    </div>
  );
}

function Players({ query, setQuery }: { query:string; setQuery:(v:string)=>void }) {
  return (
    <>
      <div className="player-admin-toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom ou ID Discord…" />
        <select><option>Tous les joueurs</option><option>Actifs</option><option>À surveiller</option></select>
      </div>
      <article className="admin-player-card">
        <div className="admin-avatar">H</div>
        <div><small>COMPTE ADMIN</small><h3>Hime-sama</h3><p>Le vrai avatar et les données Discord seront synchronisés avec OAuth2.</p></div>
        <div className="admin-player-tags"><span>👑 Hime</span><span>Niv. 42</span><span>Desktop</span></div>
        <button disabled>Ouvrir le profil serveur</button>
      </article>
      <div className="admin-empty-list">Les autres joueurs apparaîtront ici dès que l'API exposera le registre TailBlue.</div>
    </>
  );
}

function Economy() {
  return (
    <>
      <div className="hime-kpi-grid">
        <Kpi icon="🍪" label="Cookies en circulation" value="—" sub="Somme des profils" />
        <Kpi icon="🏘️" label="Volume Market" value="—" sub="Achats / ventes" />
        <Kpi icon="🏠" label="Dépenses maisons" value="—" sub="Sinks économiques" />
        <Kpi icon="💼" label="Revenus Work" value="—" sub="Sources économiques" />
      </div>
      <div className="economy-flow">
        <article><span>＋</span><h3>Sources</h3><p>Daily • Work • Hunt • Quêtes • Coffres</p></article>
        <div className="economy-core">🍪<strong>ÉCONOMIE</strong></div>
        <article><span>−</span><h3>Sorties</h3><p>Market • Maisons • Chenil • Provisions • Craft</p></article>
      </div>
    </>
  );
}

function SystemStatus() {
  const services = [
    ["Desktop Tauri","online","Application locale active"],
    ["Frontend React","online","Interface opérationnelle"],
    ["API TailBlue","offline","À créer / connecter"],
    ["Bot Discord","pending","Sera relié à l'API"],
    ["Profils joueurs","pending","stats_tailblue.json via backend"],
    ["Activité serveur","pending","tailblue_server_activity.json via backend"],
  ];
  return (
    <div className="system-grid">
      {services.map(([name,status,text]) => (
        <article className="system-service" key={name}>
          <span className={`service-dot ${status}`} />
          <div><h3>{name}</h3><p>{text}</p></div>
          <strong>{status === "online" ? "ONLINE" : status === "offline" ? "OFFLINE" : "PENDING"}</strong>
        </article>
      ))}
    </div>
  );
}

function Kpi({ icon, label, value, sub, tone="" }: { icon:string; label:string; value:string; sub:string; tone?:string }) {
  return <article className={`hime-kpi ${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong><p>{sub}</p></div></article>;
}
