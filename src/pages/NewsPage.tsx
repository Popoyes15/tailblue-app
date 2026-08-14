import { useEffect, useMemo, useState } from "react";
import {
  loadTailBlueUpdates,
  type TailBlueUpdateArticle,
} from "../data/updateFeedData";
import "./remainingPages.css";

export default function NewsPage() {
  const [articles, setArticles] = useState<TailBlueUpdateArticle[]>([]);
  const [selected, setSelected] = useState<TailBlueUpdateArticle | null>(null);
  const [tag, setTag] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    loadTailBlueUpdates().then((items) => {
      if (cancelled) return;
      const sorted = [...items].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      setArticles(sorted);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tags = useMemo(
    () => ["all", ...Array.from(new Set(articles.map((article) => article.tag)))],
    [articles]
  );

  const visible = tag === "all" ? articles : articles.filter((article) => article.tag === tag);
  const featured = visible[0] ?? null;
  const rest = visible.slice(1);

  return (
    <section className="extra-page updates-page">
      <div className="extra-heading updates-heading">
        <div>
          <p className="eyebrow">📢 CHRONIQUES DE TAILBLUE</p>
          <h2>Nouveautés</h2>
          <p className="extra-muted">
            Chaque publication devient un véritable article : clique sur son image pour lire tout le texte.
            Le futur backend alimentera cette page avec les annonces publiées via <strong>!update</strong>.
          </p>
        </div>
        <div className="updates-source-pill">
          {articles.some((article) => article.source === "api") ? "● Flux TailBlue connecté" : "○ Aperçu local"}
        </div>
      </div>

      <div className="updates-filter-row">
        {tags.map((item) => (
          <button key={item} className={tag === item ? "selected" : ""} onClick={() => setTag(item)}>
            {item === "all" ? "Toutes" : item}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="updates-loading">Chargement des chroniques…</div>
      ) : featured ? (
        <>
          <button className="update-featured-card" onClick={() => setSelected(featured)}>
            <Cover article={featured} featured />
            <section>
              <div className="update-card-meta">
                <span>{featured.tag}</span>
                <time>{formatDate(featured.publishedAt)}</time>
              </div>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <strong>Lire la mise à jour <i>→</i></strong>
            </section>
          </button>

          <div className="updates-card-grid">
            {rest.map((article) => (
              <button key={article.id} className="update-article-card" onClick={() => setSelected(article)}>
                <Cover article={article} />
                <section>
                  <div className="update-card-meta">
                    <span>{article.tag}</span>
                    <time>{formatDate(article.publishedAt)}</time>
                  </div>
                  <h3>{article.title}</h3>
                  <p>{article.excerpt}</p>
                  <strong>Ouvrir <i>→</i></strong>
                </section>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="updates-loading">Aucune mise à jour dans cette catégorie.</div>
      )}

      {selected && (
        <UpdateReader article={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}

function Cover({ article, featured = false }: { article: TailBlueUpdateArticle; featured?: boolean }) {
  const image = article.images[0];

  if (!image) {
    return (
      <div className={`update-cover update-cover-empty ${featured ? "featured" : ""}`}>
        <span>✦</span>
      </div>
    );
  }

  return (
    <div
      className={`update-cover ${featured ? "featured" : ""}`}
      style={{ backgroundImage: `url("${image}")` }}
    >
      <span className="update-cover-blur" />
      <img src={image} alt={article.title} />
      {article.images.length > 1 && <em>+{article.images.length - 1} image(s)</em>}
    </div>
  );
}

function UpdateReader({ article, onClose }: { article: TailBlueUpdateArticle; onClose: () => void }) {
  const [imageIndex, setImageIndex] = useState(0);
  const image = article.images[imageIndex];

  return (
    <div className="update-reader-backdrop" onClick={onClose}>
      <article className="update-reader" onClick={(event) => event.stopPropagation()}>
        <button className="update-reader-close" onClick={onClose}>×</button>

        {image && (
          <div className="update-reader-hero" style={{ backgroundImage: `url("${image}")` }}>
            <span />
            <img src={image} alt={article.title} />
          </div>
        )}

        {article.images.length > 1 && (
          <div className="update-reader-thumbs">
            {article.images.map((item, index) => (
              <button
                key={`${item}-${index}`}
                className={index === imageIndex ? "selected" : ""}
                onClick={() => setImageIndex(index)}
              >
                <img src={item} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="update-reader-copy">
          <div className="update-reader-meta">
            <span>{article.tag}</span>
            <time>{formatDate(article.publishedAt)}</time>
            {article.author && <small>par {article.author}</small>}
          </div>
          <h2>{article.title}</h2>
          <div className="update-reader-body">
            {article.body.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("fr-CH", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}
