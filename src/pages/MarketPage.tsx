import "./realPages.css";

// TEMPORAIRE : sera remplacé par le vrai niveau de marché du joueur.
// On n'affiche qu'UN marché : son état actuel.
const CURRENT_MARKET = {
  stage: 0,
  name: "Market",
  image: "/ImagesMarket/marketruins.png",
  description:
    "Le marché de TailBlue évolue au fil de sa reconstruction. Les bâtiments, ateliers et services disponibles dépendront de la progression réelle du joueur.",
};

export default function MarketPage() {
  return (
    <section className="real-page">
      <div className="real-page-heading">
        <div>
          <p className="eyebrow">COMMERCE DU ROYAUME</p>
          <h2>Market</h2>
          <p className="real-muted">
            Ton marché actuel et son niveau de reconstruction.
          </p>
        </div>
      </div>

      <article className="showcase-card">
        <div
          className="showcase-visual"
          style={{
            backgroundImage: `url("${CURRENT_MARKET.image}")`,
          }}
        >
          <div className="showcase-blur" />
          <img
            className="showcase-main-image"
            src={CURRENT_MARKET.image}
            alt={CURRENT_MARKET.name}
          />
        </div>

        <div className="showcase-info">
          <div>
            <p className="eyebrow">
              ÉTAPE {CURRENT_MARKET.stage}
            </p>

            <h2>{CURRENT_MARKET.name}</h2>

            <p className="showcase-description">
              {CURRENT_MARKET.description}
            </p>
          </div>

          <div className="showcase-stats">
            <div>
              <span>Reconstruction</span>
              <strong>Étape {CURRENT_MARKET.stage} / 5</strong>
            </div>

            <div>
              <span>État</span>
              <strong>
                {CURRENT_MARKET.stage === 0
                  ? "En ruines"
                  : "En développement"}
              </strong>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
