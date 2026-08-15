import { useEffect, useMemo, useState } from "react";
import { worldApi } from "../api/worldApi";
import { MUSEUMS, museumForHouse } from "../data/worldData";
import type { MuseumCandidateDto, MuseumSnapshot } from "../types/world";
import "./worldFinal.css";

function formatCookies(value: number) {
  return value.toLocaleString("fr-CH");
}

export default function MuseumPage() {
  const [snapshot, setSnapshot] = useState<MuseumSnapshot | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    if (!worldApi.configured) return;
    try {
      const data = await worldApi.getMuseum();
      setSnapshot(data);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "API indisponible.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const activeMuseum = useMemo(() => {
    if (snapshot) {
      return {
        name: snapshot.museumName,
        image:
          snapshot.museumImage ||
          museumForHouse(snapshot.houseId).image,
        description:
          snapshot.description ||
          museumForHouse(snapshot.houseId).description,
      };
    }
    return MUSEUMS[previewIndex] ?? MUSEUMS[0];
  }, [previewIndex, snapshot]);

  async function addPiece(candidate: MuseumCandidateDto) {
    if (!worldApi.configured || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await worldApi.addMuseumPiece(candidate.name);
      setSnapshot(data);
      setMessage(`🏛️ ${candidate.name} rejoint la collection.`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ajout au musée impossible.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="world-page">
      <header className="world-heading">
        <div>
          <span className="world-eyebrow">MONDE • COLLECTION</span>
          <h1>🏛️ Musée</h1>
          <p>
            Le musée suit la résidence et expose les objets réellement retirés
            de l’inventaire TailBlue.
          </p>
        </div>
        <div className={`world-api-pill ${snapshot ? "is-live" : ""}`}>
          {snapshot ? "● Collection réelle" : "○ Aperçu local"}
        </div>
      </header>

      {message && <div className="world-message">{message}</div>}

      <div className="world-two-columns">
        <article className="world-panel">
          <div className="world-image-stage world-museum-stage">
            <div
              className="world-image-blur"
              style={{ backgroundImage: `url("${activeMuseum.image}")` }}
            />
            <img src={activeMuseum.image} alt={activeMuseum.name} />
          </div>

          {!snapshot && (
            <div className="world-preview-strip">
              {MUSEUMS.map((museum, index) => (
                <button
                  key={museum.houseId}
                  className={previewIndex === index ? "active" : ""}
                  onClick={() => setPreviewIndex(index)}
                  title={museum.name}
                >
                  <img src={museum.image} alt="" />
                </button>
              ))}
            </div>
          )}
        </article>

        <article className="world-panel world-detail-panel">
          <span className="world-kicker">
            {snapshot ? "TON MUSÉE" : "PRÉVISUALISATION DES MUSÉES"}
          </span>
          <h2>🏛️ {activeMuseum.name}</h2>
          <p>{activeMuseum.description}</p>

          <div className="world-stat-grid">
            <div>
              <span>Pièces exposées</span>
              <strong>{snapshot ? snapshot.pieces.length : "—"}</strong>
            </div>
            <div>
              <span>Valeur estimée</span>
              <strong>
                {snapshot
                  ? `${formatCookies(snapshot.estimatedValue)} 🍪`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Objets ajoutables</span>
              <strong>{snapshot ? snapshot.candidates.length : "—"}</strong>
            </div>
          </div>

          <div className="world-note">
            Le moteur Python classe les comparaisons de musées d’abord par
            nombre de pièces, puis par valeur totale. Le Haut Plateau n’a pas
            encore de musée dédié dans le Python et retombe actuellement sur le
            Musée de Fortune.
          </div>
        </article>
      </div>

      <div className="world-panel">
        <div className="world-section-title">
          <div>
            <span className="world-kicker">COLLECTION PERMANENTE</span>
            <h2>Pièces exposées</h2>
          </div>
          <strong>{snapshot ? snapshot.pieces.length : "—"}</strong>
        </div>

        {!snapshot?.pieces.length ? (
          <div className="world-empty">
            <span>🖼️</span>
            <h3>{snapshot ? "Les salles sont encore vides" : "Collection non connectée"}</h3>
            <p>
              {snapshot
                ? "Ajoute une pièce depuis les objets réellement présents dans tes sacs."
                : "Aucune fausse collection n’est affichée. Les pièces arriveront depuis TailBlue."}
            </p>
          </div>
        ) : (
          <div className="world-card-grid">
            {snapshot.pieces.map((piece, index) => (
              <article className="world-small-card" key={piece.id ?? `${piece.name}-${index}`}>
                <span className="world-kicker">{piece.rarity ?? "Rareté inconnue"}</span>
                <h3>
                  {piece.emoji ?? "🖼️"} {piece.name}
                </h3>
                <p>{piece.description ?? "Pièce exposée dans le musée."}</p>
                <small>
                  💎 {formatCookies(piece.value ?? 0)} cookies
                </small>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="world-panel">
        <div className="world-section-title">
          <div>
            <span className="world-kicker">DEPUIS TES SACS</span>
            <h2>Ajouter une pièce</h2>
          </div>
        </div>

        {!snapshot?.candidates.length ? (
          <div className="world-empty compact">
            <span>🎒</span>
            <p>
              {snapshot
                ? "Aucun objet disponible à exposer."
                : "Les objets ajoutables seront fournis par l’inventaire réel."}
            </p>
          </div>
        ) : (
          <div className="world-candidate-list">
            {snapshot.candidates.map((candidate) => (
              <button
                key={candidate.id ?? candidate.name}
                disabled={busy}
                onClick={() => void addPiece(candidate)}
              >
                <span>
                  <b>
                    {candidate.emoji ?? "📦"} {candidate.name}
                  </b>
                  <small>
                    x{candidate.quantity} • {candidate.rarity ?? "Rareté inconnue"}
                  </small>
                </span>
                <strong>Exposer</strong>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
