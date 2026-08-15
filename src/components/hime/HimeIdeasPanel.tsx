import { useEffect, useMemo, useState } from "react";
import { himeApi, himeApiConfigured } from "../../api/himeApi";
import { previewIdeas } from "../../data/himePreviewData";
import type {
  HimeIdea,
  HimeIdeaPatch,
  HimeIdeasSnapshot,
  IdeaPriority,
  IdeaStatus,
} from "../../types/hime";
import { Avatar, Empty, Kpi, fmtDate, fmtNumber } from "./HimeShared";

const STATUS: Record<IdeaStatus, { emoji: string; label: string }> = {
  submitted: { emoji: "📥", label: "Nouvelle" },
  review: { emoji: "🔎", label: "À étudier" },
  accepted: { emoji: "✅", label: "Retenue" },
  in_progress: { emoji: "🛠️", label: "En cours" },
  implemented: { emoji: "✨", label: "Implémentée" },
  declined: { emoji: "⛔", label: "Refusée" },
  archived: { emoji: "🗃️", label: "Archivée" },
};

const PRIORITY: Record<IdeaPriority, { emoji: string; label: string }> = {
  low: { emoji: "🌿", label: "Basse" },
  normal: { emoji: "🔹", label: "Normale" },
  high: { emoji: "🔥", label: "Haute" },
  royal: { emoji: "👑", label: "Royale" },
};

export default function HimeIdeasPanel({ refreshToken }: { refreshToken: number }) {
  const [snapshot, setSnapshot] = useState<HimeIdeasSnapshot>(previewIdeas);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<IdeaStatus | "all">("all");
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!himeApiConfigured) {
        setSnapshot(previewIdeas);
        return;
      }
      try {
        const next = await himeApi.ideas();
        if (alive) setSnapshot(next);
      } catch (error) {
        if (alive) setMessage(error instanceof Error ? error.message : "Impossible de charger les idées.");
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [refreshToken]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("fr");
    return snapshot.ideas.filter((idea) => {
      if (status !== "all" && idea.status !== status) return false;
      if (featuredOnly && !idea.featured && !idea.royalSpotlight) return false;
      if (!needle) return true;
      return [idea.title, idea.description, idea.authorName, idea.id, idea.tags.join(" ")]
        .join(" ")
        .toLocaleLowerCase("fr")
        .includes(needle);
    });
  }, [snapshot.ideas, query, status, featuredOnly]);

  const selected = snapshot.ideas.find((idea) => idea.id === selectedId) ?? null;
  const spotlight = snapshot.ideas.find((idea) => idea.royalSpotlight) ?? null;
  const active = snapshot.ideas.filter(
    (idea) => !["implemented", "declined", "archived"].includes(idea.status),
  ).length;

  async function patch(idea: HimeIdea, changes: HimeIdeaPatch) {
    setMessage("");
    if (!himeApiConfigured) {
      setSnapshot((old) => {
        let ideas = old.ideas.map((entry) =>
          entry.id === idea.id ? { ...entry, ...changes } : entry,
        );
        if (changes.royalSpotlight === true) {
          ideas = ideas.map((entry) =>
            entry.id === idea.id ? entry : { ...entry, royalSpotlight: false },
          );
        }
        return { generatedAt: new Date().toISOString(), ideas };
      });
      setMessage("🧪 Aperçu local mis à jour.");
      return;
    }
    try {
      setBusy(true);
      setSnapshot(await himeApi.patchIdea(idea.id, changes));
      setMessage("✅ Registre royal mis à jour.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Modification impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(idea: HimeIdea) {
    if (!window.confirm(`Supprimer définitivement « ${idea.title} » ?\n\nPour conserver la trace, utilise plutôt le statut Archivée.`)) return;
    if (!himeApiConfigured) {
      setSnapshot((old) => ({ ...old, ideas: old.ideas.filter((entry) => entry.id !== idea.id) }));
      setSelectedId(null);
      setMessage("🧪 Idée d'aperçu supprimée.");
      return;
    }
    try {
      setBusy(true);
      setSnapshot(await himeApi.deleteIdea(idea.id));
      setSelectedId(null);
      setMessage("🗑️ Idée supprimée.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  }

  async function trophy(idea: HimeIdea) {
    if (idea.status !== "implemented") {
      setMessage("🏆 Le trophée royal n'est disponible qu'après implémentation.");
      return;
    }
    if (!window.confirm(`Remettre le trophée royal à ${idea.authorName} ?`)) return;
    if (!himeApiConfigured) {
      setSnapshot((old) => ({
        ...old,
        ideas: old.ideas.map((entry) =>
          entry.id === idea.id
            ? {
                ...entry,
                rewardState: "awarded",
                trophyName: "🏆 Trophée royal — Idée devenue réelle",
                trophyAwardedAt: new Date().toISOString(),
              }
            : entry,
        ),
      }));
      setMessage("🧪 Trophée simulé dans l'aperçu local.");
      return;
    }
    try {
      setBusy(true);
      setSnapshot(await himeApi.awardIdeaTrophy(idea.id));
      setMessage("🏆 Trophée royal remis.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Trophée impossible à remettre.");
    } finally {
      setBusy(false);
    }
  }

  async function announcement(idea: HimeIdea) {
    if (idea.status !== "implemented") {
      setMessage("✨ L'annonce se prépare seulement quand l'idée est implémentée.");
      return;
    }
    if (!himeApiConfigured) {
      setSnapshot((old) => ({
        ...old,
        ideas: old.ideas.map((entry) =>
          entry.id === idea.id ? { ...entry, announcementState: "draft" } : entry,
        ),
      }));
      setMessage("🧪 Brouillon Nouveautés simulé.");
      return;
    }
    try {
      setBusy(true);
      setSnapshot(await himeApi.createIdeaAnnouncement(idea.id));
      setMessage("✨ Brouillon Nouveautés préparé.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Impossible de préparer l'annonce.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="tb-hime-kpi-grid">
        <Kpi icon="💡" label="À traiter" value={fmtNumber(active)} detail="registre actif" tone="purple" />
        <Kpi
          icon="🛠️"
          label="En cours"
          value={fmtNumber(snapshot.ideas.filter((idea) => idea.status === "in_progress").length)}
          detail="développement"
        />
        <Kpi
          icon="✨"
          label="Implémentées"
          value={fmtNumber(snapshot.ideas.filter((idea) => idea.status === "implemented").length)}
          detail="devenues réelles"
          tone="success"
        />
        <Kpi
          icon="🏆"
          label="Trophées remis"
          value={fmtNumber(snapshot.ideas.filter((idea) => idea.rewardState === "awarded").length)}
          detail="récompenses royales"
          tone="gold"
        />
      </div>

      {spotlight && (
        <article className="tb-hime-spotlight">
          <div className="tb-hime-spotlight-icon">👑</div>
          <div>
            <p className="tb-hime-eyebrow">COUP DE CŒUR ROYAL</p>
            <h2>{spotlight.title}</h2>
            <p>{spotlight.description}</p>
            <div className="tb-hime-tags">
              <span>💡 {spotlight.authorName}</span>
              <span>{PRIORITY[spotlight.priority].emoji} {PRIORITY[spotlight.priority].label}</span>
              {spotlight.targetVersion && <span>🎯 {spotlight.targetVersion}</span>}
            </div>
          </div>
          <button onClick={() => setSelectedId(spotlight.id)}>Ouvrir →</button>
        </article>
      )}

      <div className="tb-hime-toolbar tb-hime-ideas-toolbar">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une idée, un joueur, un tag…" />
        <select value={status} onChange={(e) => setStatus(e.target.value as IdeaStatus | "all")}>
          <option value="all">Tous les statuts</option>
          {(Object.entries(STATUS) as [IdeaStatus, { emoji: string; label: string }][]).map(([id, meta]) => (
            <option key={id} value={id}>{meta.emoji} {meta.label}</option>
          ))}
        </select>
        <label className="tb-hime-check">
          <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
          ⭐ Mises en avant
        </label>
      </div>

      {message && <div className="tb-hime-message">{message}</div>}

      <div className="tb-hime-ideas-grid">
        {filtered.map((idea) => (
          <article key={idea.id} className={`tb-hime-idea-card ${idea.featured ? "featured" : ""} priority-${idea.priority}`}>
            <header>
              <div className="tb-hime-author">
                <Avatar name={idea.authorName} src={idea.authorAvatar} />
                <div><strong>{idea.authorName}</strong><small>{fmtDate(idea.createdAt)}</small></div>
              </div>
              <div className="tb-hime-idea-flags">{idea.royalSpotlight && "👑"}{idea.featured && " ⭐"}</div>
            </header>
            <div className="tb-hime-badges">
              <span className={`status-${idea.status}`}>{STATUS[idea.status].emoji} {STATUS[idea.status].label}</span>
              <span className={`priority-${idea.priority}`}>{PRIORITY[idea.priority].emoji} {PRIORITY[idea.priority].label}</span>
            </div>
            <h3>{idea.title}</h3>
            <p>{idea.description}</p>
            <div className="tb-hime-tags">
              {idea.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              {idea.targetVersion && <span>🎯 {idea.targetVersion}</span>}
            </div>
            <footer>
              <button onClick={() => setSelectedId(idea.id)}>Gérer</button>
              <button className={idea.featured ? "active" : ""} disabled={busy} onClick={() => void patch(idea, { featured: !idea.featured })}>
                {idea.featured ? "★ En avant" : "☆ Mettre en avant"}
              </button>
            </footer>
          </article>
        ))}
      </div>

      {!filtered.length && <Empty icon="💡" title="Aucune idée" text="Aucune proposition ne correspond aux filtres actuels." />}

      {selected && (
        <IdeaDrawer
          idea={selected}
          busy={busy}
          onClose={() => setSelectedId(null)}
          onPatch={(changes) => void patch(selected, changes)}
          onDelete={() => void remove(selected)}
          onTrophy={() => void trophy(selected)}
          onAnnouncement={() => void announcement(selected)}
        />
      )}
    </>
  );
}

function IdeaDrawer({
  idea,
  busy,
  onClose,
  onPatch,
  onDelete,
  onTrophy,
  onAnnouncement,
}: {
  idea: HimeIdea;
  busy: boolean;
  onClose: () => void;
  onPatch: (patch: HimeIdeaPatch) => void;
  onDelete: () => void;
  onTrophy: () => void;
  onAnnouncement: () => void;
}) {
  const [note, setNote] = useState(idea.adminNote ?? "");
  const [version, setVersion] = useState(idea.targetVersion ?? "");

  useEffect(() => {
    setNote(idea.adminNote ?? "");
    setVersion(idea.targetVersion ?? "");
  }, [idea.id, idea.adminNote, idea.targetVersion]);

  return (
    <div className="tb-hime-drawer-backdrop" onMouseDown={(e) => e.currentTarget === e.target && onClose()}>
      <aside className="tb-hime-drawer">
        <header className="tb-hime-drawer-head">
          <div><p className="tb-hime-eyebrow">💡 REGISTRE ROYAL • {idea.id}</p><h2>{idea.title}</h2></div>
          <button onClick={onClose}>×</button>
        </header>

        <div className="tb-hime-author tb-hime-author-block">
          <Avatar name={idea.authorName} src={idea.authorAvatar} />
          <div><strong>{idea.authorName}</strong><small>Proposée le {fmtDate(idea.createdAt)}</small></div>
        </div>
        <p className="tb-hime-drawer-description">{idea.description}</p>

        <div className="tb-hime-form-grid">
          <label><span>Statut</span><select value={idea.status} disabled={busy} onChange={(e) => onPatch({ status: e.target.value as IdeaStatus })}>
            {(Object.entries(STATUS) as [IdeaStatus, { emoji: string; label: string }][]).map(([id, meta]) => <option key={id} value={id}>{meta.emoji} {meta.label}</option>)}
          </select></label>
          <label><span>Priorité</span><select value={idea.priority} disabled={busy} onChange={(e) => onPatch({ priority: e.target.value as IdeaPriority })}>
            {(Object.entries(PRIORITY) as [IdeaPriority, { emoji: string; label: string }][]).map(([id, meta]) => <option key={id} value={id}>{meta.emoji} {meta.label}</option>)}
          </select></label>
        </div>

        <div className="tb-hime-feature-actions">
          <button className={idea.featured ? "active" : ""} onClick={() => onPatch({ featured: !idea.featured })}>⭐ {idea.featured ? "Retirer de la mise en avant" : "Mettre en avant"}</button>
          <button className={idea.royalSpotlight ? "active royal" : "royal"} onClick={() => onPatch({ royalSpotlight: !idea.royalSpotlight })}>👑 {idea.royalSpotlight ? "Coup de cœur actuel" : "Nommer Coup de cœur royal"}</button>
        </div>

        <section className="tb-hime-drawer-section">
          <p className="tb-hime-eyebrow">📝 NOTE PRIVÉE HIME</p>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Réflexion, dépendances, raison du choix…" />
          <div className="tb-hime-inline-form">
            <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="Version cible, ex. 1.4.0" />
            <button onClick={() => onPatch({ adminNote: note, targetVersion: version })}>Enregistrer</button>
          </div>
        </section>

        <section className="tb-hime-drawer-section">
          <p className="tb-hime-eyebrow">🏆 RÉCOMPENSE ROYALE</p>
          <div className={`tb-hime-trophy ${idea.rewardState}`}>
            <span>🏆</span>
            <div>
              <strong>{idea.rewardState === "awarded" ? "Trophée remis" : idea.status === "implemented" ? "Prêt à être remis" : "En attente d'implémentation"}</strong>
              <p>{idea.trophyName ?? "Trophée royal personnel d'idée implémentée"}</p>
              {idea.trophyAwardedAt && <small>Remis le {fmtDate(idea.trophyAwardedAt)}</small>}
            </div>
          </div>
          <button className="tb-hime-gold-action" disabled={busy || idea.status !== "implemented" || idea.rewardState === "awarded"} onClick={onTrophy}>🏆 Remettre le trophée au joueur</button>
        </section>

        <section className="tb-hime-drawer-section">
          <p className="tb-hime-eyebrow">✨ PASSERELLE NOUVEAUTÉS</p>
          <p className="tb-hime-muted">Quand l'idée devient réelle, Hime peut préparer un brouillon d'annonce. Rien n'est publié automatiquement.</p>
          <button className="tb-hime-blue-action" disabled={busy || idea.status !== "implemented" || idea.announcementState === "draft" || idea.announcementState === "published"} onClick={onAnnouncement}>
            {idea.announcementState === "published" ? "✅ Annonce publiée" : idea.announcementState === "draft" ? "📝 Brouillon déjà préparé" : "✨ Préparer l'annonce Nouveautés"}
          </button>
        </section>

        {!!idea.history?.length && (
          <section className="tb-hime-drawer-section">
            <p className="tb-hime-eyebrow">📜 HISTORIQUE</p>
            <div className="tb-hime-history">
              {idea.history.map((entry) => <div key={entry.id}><i /><div><strong>{entry.text}</strong><small>{fmtDate(entry.at)}</small></div></div>)}
            </div>
          </section>
        )}

        <footer className="tb-hime-danger-zone">
          <div><strong>Zone sensible</strong><small>Préfère Archivée pour conserver l'historique.</small></div>
          <button disabled={busy} onClick={onDelete}>🗑️ Supprimer définitivement</button>
        </footer>
      </aside>
    </div>
  );
}
