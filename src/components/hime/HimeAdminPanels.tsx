import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  Dispatch,
  SetStateAction,
} from "react";
import { himeApi, himeApiConfigured } from "../../api/himeApi";
import HimeReportsArchive from "./HimeReportsArchive";
import {
  previewDashboard,
  previewEconomy,
  previewErrors,
  previewLogs,
  previewPlayers,
  previewSecurity,
  previewStats,
  previewSystem,
} from "../../data/himePreviewData";
import type {
  HimeDashboard,
  HimeEconomySnapshot,
  HimeError,
  HimeErrorsSnapshot,
  HimeLogsSnapshot,
  HimePlayerAction,
  HimePlayerDetail,
  HimePlayersSnapshot,
  HimeSecuritySnapshot,
  HimeStatsSnapshot,
  HimeSystemSnapshot,
} from "../../types/hime";
import { Avatar, Card, Empty, Kpi, fmtDate, fmtDecimal, fmtDuration, fmtNumber } from "./HimeShared";

// TAILBLUE_HIME_LAST_REAL_SNAPSHOT_CACHE_V3_20260901
const HIME_LAST_REAL_SNAPSHOTS = new Map<string, unknown>();

function useHimeLastRealSnapshot<T>(
  key: string,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const activeKey = useRef(key);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const [value, setValueInternal] = useState<T>(() => {
    const cached = HIME_LAST_REAL_SNAPSHOTS.get(key);
    return (cached as T | undefined) ?? fallback;
  });

  useEffect(() => {
    if (activeKey.current === key) return;

    activeKey.current = key;
    const cached = HIME_LAST_REAL_SNAPSHOTS.get(key);

    setValueInternal(
      (cached as T | undefined) ?? fallbackRef.current,
    );
  }, [key]);

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      setValueInternal((previous) => {
        const resolved =
          typeof next === "function"
            ? (next as (old: T) => T)(previous)
            : next;

        HIME_LAST_REAL_SNAPSHOTS.set(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, setValue];
}


export function DashboardPanel({ refreshToken }: { refreshToken: number }) {
  const [data, setData] = useHimeLastRealSnapshot<HimeDashboard>("dashboard", previewDashboard);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!himeApiConfigured) return setData(previewDashboard);
      try {
        const next = await himeApi.dashboard();
        if (alive) setData(next);
      } catch {
        // Le bandeau global indique déjà si l'API n'est pas joignable.
      }
    }
    void load();
    return () => { alive = false; };
  }, [refreshToken]);

  return (
    <>
      <div className="tb-hime-kpi-grid">
        <Kpi icon="⌨️" label="Commandes aujourd'hui" value={fmtNumber(data.totalCommandsToday)} detail="serveur officiel" />
        <Kpi icon="👥" label="Joueurs actifs" value={fmtNumber(data.activePlayersToday)} detail="aujourd'hui" />
        <Kpi icon="💡" label="Idées à traiter" value={fmtNumber(data.pendingIdeas)} detail="ShowIdées" tone="purple" />
        <Kpi icon="🚨" label="Erreurs ouvertes" value={fmtNumber(data.unresolvedErrors)} detail="Gardien TailBlue" tone={data.unresolvedErrors ? "danger" : "success"} />
      </div>

      <div className="tb-hime-two-col">
        <Card>
          <div className="tb-hime-card-head"><div><p className="tb-hime-eyebrow">ÉTAT DU ROYAUME</p><h2>Centre de commandement</h2></div><span>{fmtDate(data.generatedAt)}</span></div>
          <div className="tb-hime-services">
            {data.services.map((service) => (
              <div className="tb-hime-service" key={service.id}>
                <i className={`state-${service.state}`} />
                <div><strong>{service.name}</strong><small>{service.detail}</small></div>
                <b>{service.latencyMs != null ? `${service.latencyMs} ms` : service.state.toUpperCase()}</b>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="tb-hime-eyebrow">À SURVEILLER</p>
          <div className="tb-hime-priority-list">
            <div><span>💡</span><div><strong>{data.pendingIdeas} idée(s)</strong><small>attendent une décision.</small></div></div>
            <div><span>🚨</span><div><strong>{data.unresolvedErrors} erreur(s)</strong><small>encore ouvertes.</small></div></div>
            <div><span>💾</span><div><strong>Dernière sauvegarde</strong><small>{fmtDate(data.lastBackupAt)}</small></div></div>
          </div>
        </Card>
      </div>

      <div className="tb-hime-two-col tb-hime-two-col-even">
        <Card>
          <p className="tb-hime-eyebrow">👑 COUP DE CŒUR ROYAL</p>
          {data.spotlightIdea ? <div className="tb-hime-mini-highlight"><strong>{data.spotlightIdea.title}</strong><p>{data.spotlightIdea.description}</p><span>par {data.spotlightIdea.authorName}</span></div> : <p className="tb-hime-muted">Aucune idée mise au premier plan.</p>}
        </Card>
        <Card>
          <p className="tb-hime-eyebrow">🚨 DERNIER INCIDENT</p>
          {data.lastError ? <div className="tb-hime-mini-highlight error"><strong>{data.lastError.message}</strong><span>{data.lastError.source} • {fmtDate(data.lastError.at)}</span></div> : <p className="tb-hime-muted">Aucun incident à signaler.</p>}
        </Card>
      </div>
    </>
  );
}

export function StatsPanel({ refreshToken }: { refreshToken: number }) {
  const [view, setView] = useState<"live" | "archives">("live");
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [data, setData] = useHimeLastRealSnapshot<HimeStatsSnapshot>(`stats:${period}`, { ...previewStats, period });

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!himeApiConfigured) return setData({ ...previewStats, period });
      try {
        const next = await himeApi.stats(period);
        if (alive) setData(next);
      } catch {
        // Garde le dernier snapshot réel en cas de panne transitoire.
      }
    }
    void load();
    return () => { alive = false; };
  }, [period, refreshToken]);

  if (view === "archives") {
    return (
      <HimeReportsArchive
        refreshToken={refreshToken}
        onBack={() => setView("live")}
      />
    );
  }

  const max = Math.max(1, ...data.daily.map((row) => row.total));

  return (
    <>
      <div className="tb-hime-segmented">
        <button className="active">Temps réel</button>
        <button onClick={() => setView("archives")}>Archives</button>
      </div>
      <div className="tb-hime-segmented">
        <button className={period === "today" ? "active" : ""} onClick={() => setPeriod("today")}>Aujourd'hui</button>
        <button className={period === "week" ? "active" : ""} onClick={() => setPeriod("week")}>Semaine</button>
        <button className={period === "month" ? "active" : ""} onClick={() => setPeriod("month")}>Mois</button>
      </div>
      <div className="tb-hime-kpi-grid">
        <Kpi icon="⚙️" label="Commandes" value={fmtNumber(data.totalCommands)} detail={data.periodLabel} />
        <Kpi icon="👥" label="Joueurs uniques" value={fmtNumber(data.uniqueUsers)} detail="sur la période" />
        <Kpi icon="📆" label="Moyenne / jour" value={fmtDecimal(data.avgPerDay)} detail="commandes" />
        <Kpi icon="🎮" label="Moy. joueur actif / jour" value={fmtDecimal(data.avgPerActiveUserDay)} detail="commandes" />
      </div>
      <div className="tb-hime-two-col">
        <Card>
          <div className="tb-hime-card-head"><div><p className="tb-hime-eyebrow">ACTIVITÉ</p><h2>Commandes par jour</h2></div><span>{data.periodLabel}</span></div>
          {data.daily.length ? (
            <div className="tb-hime-chart">
              {data.daily.map((row) => <div key={row.date}><strong>{row.total}</strong><span className="track"><i style={{ height: `${(row.total / max) * 100}%` }} /></span><small>{new Date(row.date).toLocaleDateString("fr-CH", { weekday: "short", day: "2-digit" })}</small></div>)}
            </div>
          ) : <Empty icon="📊" title="Aucune donnée réelle" text="Le graphique se remplira depuis tailblue_server_activity.json." />}
        </Card>
        <div className="tb-hime-stack">
          <Card><p className="tb-hime-eyebrow">🔥 TOP COMMANDES</p><Ranking items={data.topCommands.map((item) => ({ label: `!${item.name}`, count: item.count }))} /></Card>
          <Card><p className="tb-hime-eyebrow">👑 AVENTURIERS ACTIFS</p><Ranking items={data.topUsers.map((item) => ({ label: item.name, count: item.count }))} /></Card>
        </div>
      </div>
    </>
  );
}

function Ranking
({ items }: { items: Array<{ label: string; count: number }> }) {
  return items.length ? <div className="tb-hime-ranking">{items.map((item, index) => <div key={`${item.label}-${index}`}><span>{index + 1}</span><strong>{item.label}</strong><b>{item.count}</b></div>)}</div> : <p className="tb-hime-muted">Aucune donnée.</p>;
}

export function LogsPanel({ refreshToken }: { refreshToken: number }) {
  const [data, setData] = useHimeLastRealSnapshot<HimeLogsSnapshot>("logs", previewLogs);
  const [level, setLevel] = useState("all");
  const [source, setSource] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!himeApiConfigured) return setData(previewLogs);
      try {
        const next = await himeApi.logs();
        if (alive) setData(next);
      } catch {
        // no-op
      }
    }
    void load();
    return () => { alive = false; };
  }, [refreshToken]);

  const filtered = useMemo(() => {
    const needle = query.toLocaleLowerCase("fr");
    return data.logs.filter((log) => {
      if (level !== "all" && log.level !== level) return false;
      if (source !== "all" && log.source !== source) return false;
      return !needle || `${log.message} ${log.source} ${log.command ?? ""}`.toLocaleLowerCase("fr").includes(needle);
    });
  }, [data.logs, level, source, query]);

  return (
    <>
      <div className="tb-hime-toolbar tb-hime-log-toolbar">
        <select value={level} onChange={(e) => setLevel(e.target.value)}><option value="all">Tous les niveaux</option><option value="debug">Debug</option><option value="info">Info</option><option value="success">Succès</option><option value="warning">Avertissement</option><option value="error">Erreur</option><option value="critical">Critique</option></select>
        <select value={source} onChange={(e) => setSource(e.target.value)}><option value="all">Toutes les sources</option>{data.sources.map((item) => <option key={item}>{item}</option>)}</select>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans les logs…" />
        <span className="tb-hime-live">● AUTO 20s</span>
      </div>
      <article className="tb-hime-console">
        <header><div><i /><i /><i /></div><strong>tailblue://guardian/logs</strong><span>{filtered.length} ligne(s)</span></header>
        <div className="tb-hime-console-body">
          {filtered.map((log) => <div className={`tb-hime-log ${log.level}`} key={log.id}><time>{fmtDate(log.at)}</time><b>{log.level.toUpperCase()}</b><span>[{log.source}]</span><p>{log.message}</p>{log.command && <code>!{log.command}</code>}</div>)}
        </div>
      </article>
    </>
  );
}

export function ErrorsPanel({ refreshToken }: { refreshToken: number }) {
  const [data, setData] = useHimeLastRealSnapshot<HimeErrorsSnapshot>("errors", previewErrors);
  const [filter, setFilter] = useState<"open" | "resolved" | "ignored" | "all">("open");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!himeApiConfigured) return setData(previewErrors);
      try {
        const next = await himeApi.errors();
        if (alive) setData(next);
      } catch {
        // no-op
      }
    }
    void load();
    return () => { alive = false; };
  }, [refreshToken]);

  async function setErrorState(error: HimeError, state: "open" | "resolved" | "ignored") {
    if (!himeApiConfigured) {
      setData((old) => ({ ...old, errors: old.errors.map((item) => item.id === error.id ? { ...item, state } : item) }));
      setMessage("🧪 État modifié dans l'aperçu local.");
      return;
    }
    try {
      setData(await himeApi.patchError(error.id, state));
      setMessage("✅ Incident mis à jour.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action impossible.");
    }
  }

  const visible = data.errors.filter((error) => filter === "all" || error.state === filter);
  const open = data.errors.filter((error) => error.state === "open").length;
  const critical = data.errors.filter((error) => error.state === "open" && error.severity === "critical").length;

  return (
    <>
      <div className="tb-hime-kpi-grid">
        <Kpi icon="🚨" label="Ouvertes" value={fmtNumber(open)} detail="à examiner" tone={open ? "danger" : "success"} />
        <Kpi icon="💀" label="Critiques" value={fmtNumber(critical)} detail="priorité absolue" tone={critical ? "danger" : ""} />
        <Kpi icon="✅" label="Résolues" value={fmtNumber(data.errors.filter((e) => e.state === "resolved").length)} detail="historique" />
        <Kpi icon="🙈" label="Ignorées" value={fmtNumber(data.errors.filter((e) => e.state === "ignored").length)} detail="bruit accepté" />
      </div>
      <div className="tb-hime-segmented">
        {(["open", "resolved", "ignored", "all"] as const).map((id) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{id === "open" ? "Ouvertes" : id === "resolved" ? "Résolues" : id === "ignored" ? "Ignorées" : "Toutes"}</button>)}
      </div>
      {message && <div className="tb-hime-message">{message}</div>}
      <div className="tb-hime-errors">
        {visible.map((error) => <article key={error.id} className={`tb-hime-error severity-${error.severity}`}>
          <header><div><span>{error.severity.toUpperCase()}</span><strong>{error.source}</strong><time>{fmtDate(error.at)}</time></div><b>×{error.occurrences}</b></header>
          <h3>{error.message}</h3>
          <div className="tb-hime-badges">{error.command && <span>⌨️ !{error.command}</span>}{error.userId && <span>👤 {error.userId}</span>}</div>
          {expanded === error.id && error.traceback && <pre>{error.traceback}</pre>}
          <footer>{error.traceback && <button onClick={() => setExpanded((old) => old === error.id ? null : error.id)}>{expanded === error.id ? "Masquer la trace" : "Voir la trace"}</button>}{error.state === "open" ? <><button className="success" onClick={() => void setErrorState(error, "resolved")}>✓ Résolue</button><button onClick={() => void setErrorState(error, "ignored")}>Ignorer</button></> : <button onClick={() => void setErrorState(error, "open")}>Rouvrir</button>}</footer>
        </article>)}
      </div>
      {!visible.length && <Empty icon="🛡️" title="Aucun incident" text="Le Gardien n'a rien à afficher dans cette catégorie." />}
    </>
  );
}

export function SecurityPanel({ refreshToken }: { refreshToken: number }) {
  const [data, setData] = useHimeLastRealSnapshot<HimeSecuritySnapshot>("security", previewSecurity);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!himeApiConfigured) return setData(previewSecurity);
      try { const next = await himeApi.security(); if (alive) setData(next); } catch { /* no-op */ }
    }
    void load();
    return () => { alive = false; };
  }, [refreshToken]);

  async function leave(id: string, name: string, official: boolean) {
    if (official || !himeApiConfigured) return;
    if (!window.confirm(`Faire quitter TailBlue du serveur « ${name} » ?`)) return;
    try { setData(await himeApi.leaveGuild(id)); setMessage("🚪 TailBlue a quitté le serveur."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Action impossible."); }
  }

  return (
    <>
      <div className="tb-hime-two-col">
        <Card className="tb-hime-security-hero">
          <div className="tb-hime-shield-bg">🛡️</div>
          <p className="tb-hime-eyebrow">AUTORISATION ROYALE</p>
          <h2>{data.authorizedAsHime ? "Accès Hime vérifié côté serveur" : "Protection backend requise"}</h2>
          <p className="tb-hime-muted">Le menu React n'est jamais une protection. Chaque route privée doit vérifier la session Discord et l'autorisation Hime côté serveur.</p>
          <div className="tb-hime-security-checks"><div className={data.authenticated ? "ok" : ""}>{data.authenticated ? "✓" : "○"} Session Discord</div><div className={data.authorizedAsHime ? "ok" : ""}>{data.authorizedAsHime ? "✓" : "○"} Autorisation Hime</div><div className={data.auditEnabled ? "ok" : ""}>{data.auditEnabled ? "✓" : "○"} Audit admin</div></div>
        </Card>
        <Card><p className="tb-hime-eyebrow">IDENTITÉ</p><div className="tb-hime-identity"><Avatar name={data.identityName ?? "Hime"} src={data.identityAvatar} /><div><strong>{data.identityName ?? "Non connectée"}</strong><small>Session : {fmtDate(data.sessionExpiresAt)}</small></div></div></Card>
      </div>
      {message && <div className="tb-hime-message">{message}</div>}
      <Card>
        <div className="tb-hime-card-head"><div><p className="tb-hime-eyebrow">🏰 SERVEURS DE TAILBLUE</p><h2>Présence Discord</h2></div><span>{data.guilds.length} serveur(s)</span></div>
        <div className="tb-hime-guilds">{data.guilds.map((guild) => <div key={guild.id} className={guild.official ? "official" : ""}><span>{guild.official ? "👑" : "🏰"}</span><div><strong>{guild.name}</strong><small>{guild.official ? "Serveur officiel" : "Serveur externe"} • {guild.memberCount ?? "?"} membre(s)</small></div><code>{guild.id}</code><div><small>{guild.ownerName ?? "Propriétaire inconnu"}</small><small>{guild.ownerId ?? "—"}</small></div><button disabled={guild.official || !himeApiConfigured} onClick={() => void leave(guild.id, guild.name, guild.official)}>{guild.official ? "🛡️ Protégé" : "🚪 Quitter"}</button></div>)}</div>
        {!data.guilds.length && <Empty icon="🏰" title="Serveurs non chargés" text="La liste viendra de bot.guilds après connexion." />}
      </Card>
    </>
  );
}

export function PlayersPanel({ refreshToken }: { refreshToken: number }) {
  const [data, setData] = useHimeLastRealSnapshot<HimePlayersSnapshot>("players", previewPlayers);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<HimePlayerDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!himeApiConfigured) return setData(previewPlayers);
      try { const next = await himeApi.players(); if (alive) setData(next); } catch { /* no-op */ }
    }
    void load();
    return () => { alive = false; };
  }, [refreshToken]);

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    return data.players.filter((player) => !needle || `${player.name} ${player.id} ${player.guild ?? ""} ${player.rank ?? ""}`.toLocaleLowerCase("fr").includes(needle));
  }, [data.players, query]);

  async function open(id: string) {
    if (!himeApiConfigured) return;
    try { setBusy(true); setSelected(await himeApi.player(id)); } finally { setBusy(false); }
  }

  async function run(action: HimePlayerAction) {
    if (!selected || !himeApiConfigured) return setMessage("🔐 Action réelle disponible uniquement après connexion sécurisée.");
    if (!window.confirm(`Confirmer l'action royale sur ${selected.name} ?`)) return;
    try { setBusy(true); setSelected(await himeApi.playerAction(selected.id, action)); setMessage("✅ Profil mis à jour."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Action impossible."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <div className="tb-hime-toolbar tb-hime-player-toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom, ID Discord, guilde, rang…" /><span>{visible.length} joueur(s)</span></div>
      {message && <div className="tb-hime-message">{message}</div>}
      <div className="tb-hime-players">{visible.map((player) => <button key={player.id} onClick={() => void open(player.id)}><Avatar name={player.name} src={player.avatar} /><div><strong>{player.name}</strong><small>{player.id}</small></div><span>Niv. {player.level ?? "—"} • {player.rank ?? "Rang —"}</span><b>🍪 {fmtNumber(player.cookies)}</b><i>→</i></button>)}</div>
      {!visible.length && <Empty icon="👥" title="Registre joueurs non chargé" text="Les vrais profils viendront de stats_tailblue.json via l'API sécurisée." />}
      {selected && <PlayerDrawer player={selected} busy={busy} onClose={() => setSelected(null)} onRun={(action) => void run(action)} />}
    </>
  );
}

function PlayerDrawer({ player, busy, onClose, onRun }: { player: HimePlayerDetail; busy: boolean; onClose: () => void; onRun: (action: HimePlayerAction) => void }) {
  const [cookies, setCookies] = useState("100");
  const [xp, setXp] = useState("100");
  const [rep, setRep] = useState("10");
  const amountButton = (label: string, icon: string, value: string, setter: (v: string) => void, kind: "give_cookies" | "give_xp" | "give_reputation") => (
    <div className="tb-hime-amount-action"><span>{icon}</span><strong>{label}</strong><input type="number" value={value} onChange={(e) => setter(e.target.value)} /><button disabled={busy || !Number.isFinite(Number(value)) || Number(value) === 0} onClick={() => onRun({ action: kind, amount: Number(value) })}>Appliquer</button></div>
  );
  return <div className="tb-hime-drawer-backdrop" onMouseDown={(e) => e.currentTarget === e.target && onClose()}><aside className="tb-hime-drawer"><header className="tb-hime-drawer-head"><div className="tb-hime-author"><Avatar name={player.name} src={player.avatar} /><div><p className="tb-hime-eyebrow">👥 DOSSIER JOUEUR</p><h2>{player.name}</h2><small>{player.id}</small></div></div><button onClick={onClose}>×</button></header>
    <div className="tb-hime-player-kpis"><div><small>Niveau</small><strong>{player.level ?? "—"}</strong></div><div><small>Cookies</small><strong>{fmtNumber(player.cookies)}</strong></div><div><small>XP</small><strong>{fmtNumber(player.xp)}</strong></div><div><small>Réputation</small><strong>{fmtNumber(player.reputation)}</strong></div></div>
    <section className="tb-hime-drawer-section"><p className="tb-hime-eyebrow">PROFIL TAILBLUE</p><div className="tb-hime-detail-grid"><div><span>Rang aventurier</span><strong>{player.rank ?? "—"}</strong></div><div><span>Guilde</span><strong>{player.guild ?? "—"}</strong></div><div><span>Maison</span><strong>{player.house ?? "—"}</strong></div><div><span>Métier</span><strong>{player.job ?? "—"}</strong></div><div><span>Objets</span><strong>{fmtNumber(player.inventoryCount)}</strong></div><div><span>Musée</span><strong>{fmtNumber(player.museumCount)}</strong></div><div><span>Compagnons</span><strong>{fmtNumber(player.petsCount)}</strong></div><div><span>Succès</span><strong>{fmtNumber(player.successesCount)}</strong></div></div></section>
    <section className="tb-hime-drawer-section"><p className="tb-hime-eyebrow">🎁 RÉCOMPENSES & PROGRESSION</p>{amountButton("Ajouter des cookies", "🍪", cookies, setCookies, "give_cookies")}{amountButton("Ajouter de l'XP", "✨", xp, setXp, "give_xp")}{amountButton("Ajouter de la réputation", "👑", rep, setRep, "give_reputation")}<p className="tb-hime-muted tb-hime-note">🎀 Cadeaux royaux : passe par le système Courriers/Cadeaux pour choisir le vrai contenu. Aucun cadeau fictif n'est créé ici.</p></section>
    <section className="tb-hime-drawer-section"><p className="tb-hime-eyebrow">♻️ RÉINITIALISATIONS</p><div className="tb-hime-reset-grid"><button onClick={() => onRun({ action: "reset_daily" })}>🎁 Daily</button><button onClick={() => onRun({ action: "reset_work" })}>💼 Work</button><button onClick={() => onRun({ action: "reset_hunt" })}>🏹 Hunt</button><button onClick={() => onRun({ action: "reset_coffer" })}>🧰 Coffre</button></div></section>
  </aside></div>;
}

export function EconomyPanel({ refreshToken }: { refreshToken: number }) {
  const [data, setData] = useHimeLastRealSnapshot<HimeEconomySnapshot>("economy", previewEconomy);
  useEffect(() => { let alive = true; async function load() { if (!himeApiConfigured) return setData(previewEconomy); try { const next = await himeApi.economy(); if (alive) setData(next); } catch { /* no-op */ } } void load(); return () => { alive = false; }; }, [refreshToken]);
  const max = Math.max(1, ...data.richest.map((player) => player.cookies));
  return <>
    <div className="tb-hime-kpi-grid"><Kpi icon="🍪" label="Cookies en circulation" value={fmtNumber(data.totalCookies)} detail="somme des profils" tone="gold" /><Kpi icon="📊" label="Moyenne joueur" value={fmtNumber(data.averageCookies)} detail="cookies" /><Kpi icon="⚖️" label="Médiane joueur" value={fmtNumber(data.medianCookies)} detail="cookies" /><Kpi icon="🏰" label="Trésors de guildes" value={fmtNumber(data.guildTreasuryTotal)} detail="total connu" /></div>
    <div className="tb-hime-two-col"><Card><p className="tb-hime-eyebrow">👑 PLUS GRANDES FORTUNES</p><div className="tb-hime-wealth">{data.richest.map((player, index) => <div key={player.id}><span>{index + 1}</span><Avatar name={player.name} src={player.avatar} /><strong>{player.name}</strong><div><i style={{ width: `${(player.cookies / max) * 100}%` }} /></div><b>🍪 {fmtNumber(player.cookies)}</b></div>)}</div>{!data.richest.length && <p className="tb-hime-muted">Les fortunes apparaîtront après lecture des profils réels.</p>}</Card><Card><p className="tb-hime-eyebrow">🏛️ ROYAUME & MARCHÉ</p><div className="tb-hime-detail-grid"><div><span>Étape du Marché</span><strong>{data.marketStage ?? "—"}</strong></div><div><span>Taxes</span><strong>{fmtNumber(data.taxes)}</strong></div><div><span>Grogne</span><strong>{fmtNumber(data.grogne)}</strong></div></div><p className="tb-hime-muted tb-hime-note">Les flux historiques Sources / Sorties restent volontairement absents tant qu'un vrai registre de transactions n'existe pas. Pas de faux chiffres.</p></Card></div>
  </>;
}

export function SystemPanel({ refreshToken }: { refreshToken: number }) {
  const [data, setData] = useHimeLastRealSnapshot<HimeSystemSnapshot>("system", previewSystem);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { let alive = true; async function load() { if (!himeApiConfigured) return setData(previewSystem); try { const next = await himeApi.system(); if (alive) setData(next); } catch { /* no-op */ } } void load(); return () => { alive = false; }; }, [refreshToken]);
  async function backup() { if (!himeApiConfigured) return setMessage("🧪 Sauvegarde réelle disponible après connexion du Gardien."); if (!window.confirm("Créer une sauvegarde manuelle TailBlue maintenant ?")) return; try { setBusy(true); setData(await himeApi.backupNow()); setMessage("💾 Sauvegarde créée."); } catch (e) { setMessage(e instanceof Error ? e.message : "Sauvegarde impossible."); } finally { setBusy(false); } }
  return <>
    <div className="tb-hime-system-kpis"><div><span>⏱️</span><small>Uptime</small><strong>{fmtDuration(data.uptimeSeconds)}</strong></div><div><span>📡</span><small>Ping Discord</small><strong>{data.botLatencyMs == null ? "—" : `${Math.round(data.botLatencyMs)} ms`}</strong></div><div><span>🧠</span><small>RAM</small><strong>{data.ramMb == null ? "—" : `${Math.round(data.ramMb)} MB`}</strong></div><div><span>💽</span><small>Disque libre</small><strong>{data.diskFreeMb == null ? "—" : `${Math.round(data.diskFreeMb)} MB`}</strong></div></div>
    <div className="tb-hime-two-col"><Card><div className="tb-hime-card-head"><div><p className="tb-hime-eyebrow">🩺 BOTCHECK</p><h2>Services</h2></div></div><div className="tb-hime-services">{data.services.map((service) => <div className="tb-hime-service" key={service.id}><i className={`state-${service.state}`} /><div><strong>{service.name}</strong><small>{service.detail}</small></div><b>{service.latencyMs != null ? `${service.latencyMs} ms` : service.state.toUpperCase()}</b></div>)}</div></Card><Card><p className="tb-hime-eyebrow">🧩 VERSIONS</p><div className="tb-hime-detail-grid"><div><span>Bot</span><strong>{data.botVersion ?? "—"}</strong></div><div><span>API</span><strong>{data.apiVersion ?? "—"}</strong></div><div><span>Python</span><strong>{data.pythonVersion ?? "—"}</strong></div><div><span>discord.py</span><strong>{data.discordPyVersion ?? "—"}</strong></div><div><span>Serveurs</span><strong>{fmtNumber(data.guildCount)}</strong></div><div><span>Joueurs</span><strong>{fmtNumber(data.playerCount)}</strong></div></div></Card></div>
    {message && <div className="tb-hime-message">{message}</div>}
    <Card className="tb-hime-backup-card"><div className="tb-hime-card-head"><div><p className="tb-hime-eyebrow">💾 SAUVEGARDES MANUELLES</p><h2>Archives de sécurité</h2><p className="tb-hime-muted">Dernière : {fmtDate(data.lastBackupAt)}</p></div><button disabled={busy || !himeApiConfigured} onClick={() => void backup()}>💾 Créer une sauvegarde</button></div><div className="tb-hime-backups">{data.backups.map((item) => <div key={item.id}><span>🗃️</span><div><strong>{item.label ?? item.id}</strong><small>{fmtDate(item.createdAt)}</small></div><b>{item.files != null ? `${item.files} fichier(s)` : ""}</b></div>)}</div>{!data.backups.length && <p className="tb-hime-muted">Aucun historique chargé.</p>}</Card>
  </>;
}
