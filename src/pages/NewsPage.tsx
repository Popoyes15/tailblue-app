import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { loadUpdatesSnapshot, subscribeInformation } from "../api/informationApi";
import type { TailBlueUpdateArticle, UpdateFeedSnapshot } from "../types/information";
import "./informationFinal.css";

const EMPTY: UpdateFeedSnapshot = { articles: [], connected: false, mode: "offline" };

export default function NewsPage() {
  const [snapshot, setSnapshot] = useState<UpdateFeedSnapshot>(EMPTY);
  const [selected, setSelected] = useState<TailBlueUpdateArticle | null>(null);
  const [tag, setTag] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const next = await loadUpdatesSnapshot();
      next.articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setSnapshot(next);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
    const timer = window.setInterval(() => void refresh(true), 30_000);
    const unsubscribe = subscribeInformation((type) => {
      if (type === "updates" || type === "all") void refresh(true);
    });
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [refresh]);

  const tags = useMemo(
    () => ["all", ...Array.from(new Set(snapshot.articles.map((article) => article.tag)))],
    [snapshot.articles],
  );
  const visible = tag === "all" ? snapshot.articles : snapshot.articles.filter((article) => article.tag === tag);
  const featured = visible[0] ?? null;
  const rest = visible.slice(1);

  return (
    <section className="info-page news-final-page">
      <header className="info-heading">
        <div>
          <p className="info-eyebrow">✨ CHRONIQUES DU ROYAUME</p>
          <h1>Nouveautés</h1>
          <p>
            Les annonces officielles de TailBlue pourront apparaître ici directement après leur publication,
            sans reconstruire l'application.
          </p>
        </div>
        <div className="news-actions-final">
          <ConnectionPill snapshot={snapshot} />
          <button onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "Actualisation…" : "↻ Actualiser"}</button>
        </div>
      </header>

      {snapshot.mode === "preview" && (
        <div className="info-preview-banner">🧪 Aperçu développeur : ces articles servent uniquement à tester la mise en page. Ils ne seront jamais utilisés comme fausses nouveautés en production.</div>
      )}

      <div className="news-filter-final">
        {tags.map((item) => (
          <button key={item} className={tag === item ? "selected" : ""} onClick={() => setTag(item)}>
            {item === "all" ? `Toutes · ${snapshot.articles.length}` : item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="info-empty-state"><span>✨</span><h2>Chargement des chroniques…</h2></div>
      ) : featured ? (
        <>
          <button className={`news-featured-final importance-${featured.importance ?? "standard"}`} onClick={() => setSelected(featured)}>
            <NewsCover article={featured} large />
            <section>
              <Meta article={featured} />
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <strong>Lire l'article <i>→</i></strong>
            </section>
          </button>
          <div className="news-grid-final">
            {rest.map((article) => (
              <button key={article.id} className={`news-card-final importance-${article.importance ?? "standard"}`} onClick={() => setSelected(article)}>
                <NewsCover article={article} />
                <section>
                  <Meta article={article} />
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <strong>Ouvrir <i>→</i></strong>
                </section>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="info-empty-state">
          <span>📭</span>
          <h2>{snapshot.connected ? "Aucune nouveauté publiée" : "Flux TailBlue non connecté"}</h2>
          <p>
            {snapshot.connected
              ? "La première annonce apparaîtra ici dès qu'elle sera publiée."
              : "En production, la page reste volontairement vide tant que l'API officielle n'est pas disponible."}
          </p>
        </div>
      )}

      {selected && <NewsReader article={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function ConnectionPill({ snapshot }: { snapshot: UpdateFeedSnapshot }) {
  if (snapshot.connected) return <span className="info-connection connected">● Flux TailBlue connecté</span>;
  if (snapshot.mode === "preview") return <span className="info-connection preview">○ Aperçu local</span>;
  return <span className="info-connection offline">● Hors ligne</span>;
}

function Meta({ article }: { article: TailBlueUpdateArticle }) {
  return (
    <div className="news-meta-final">
      <span>{article.tag}</span>
      <time>{formatDate(article.publishedAt)}</time>
      {article.source === "preview" && <em>DÉMO</em>}
    </div>
  );
}

function NewsCover({ article, large = false }: { article: TailBlueUpdateArticle; large?: boolean }) {
  const image = article.images[0];
  if (!image) return <div className={`news-cover-final empty ${large ? "large" : ""}`}><span>✦</span></div>;
  return (
    <div className={`news-cover-final ${large ? "large" : ""}`} style={{ backgroundImage: `url("${image}")` }}>
      <i />
      <img src={image} alt={article.title} />
      {article.images.length > 1 && <em>+{article.images.length - 1}</em>}
    </div>
  );
}

function NewsReader({ article, onClose }: { article: TailBlueUpdateArticle; onClose: () => void }) {
  const [imageIndex, setImageIndex] = useState(0);
  const image = article.images[imageIndex];
  useEffect(() => setImageIndex(0), [article.id]);

  return (
    <div className="news-reader-backdrop-final" onMouseDown={onClose}>
      <article className="news-reader-final" onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
        <button className="news-reader-close-final" onClick={onClose}>×</button>
        {image && (
          <div className="news-reader-hero-final" style={{ backgroundImage: `url("${image}")` }}>
            <i />
            <img src={image} alt={article.title} />
          </div>
        )}
        {article.images.length > 1 && (
          <div className="news-reader-thumbs-final">
            {article.images.map((item, index) => (
              <button key={`${item}-${index}`} className={index === imageIndex ? "selected" : ""} onClick={() => setImageIndex(index)}>
                <img src={item} alt="" />
              </button>
            ))}
          </div>
        )}
        <div className="news-reader-copy-final">
          <Meta article={article} />
          <h1>{article.title}</h1>
          <div className="news-author-final">{article.author ? `Publié par ${article.author} · ` : ""}{formatDateTime(article.publishedAt)}</div>
          <UpdateBody body={article.body} />
        </div>
      </article>
    </div>
  );
}

function UpdateBody({ body }: { body: string }) {
  const blocks = body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  return <div className="news-body-final">{blocks.map((block, index) => <p key={index}>{block}</p>)}</div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Date inconnue";
  return new Intl.DateTimeFormat("fr-CH", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Date inconnue";
  return new Intl.DateTimeFormat("fr-CH", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}
