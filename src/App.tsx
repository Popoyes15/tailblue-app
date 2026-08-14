import { useState } from "react";
import "./App.css";
import PetsPage from "./pages/PetsPage";
import HousePage from "./pages/HousePage";
import MarketPage from "./pages/MarketPage";
import CharacterPage from "./pages/CharacterPage";
import InventoryPage from "./pages/InventoryPage";
import QuestsPage from "./pages/QuestsPage";
import MinePage from "./pages/MinePage";
import WorkPage from "./pages/WorkPage";
import HuntPage from "./pages/HuntPage";
import TailBlueExtraPages, {
  isTailBlueExtraPage,
} from "./pages/TailBlueExtraPages";

type NotificationLevel = "info" | "new" | "important" | "urgent";

type BadgeData = {
  text: string;
  level: NotificationLevel;
};

type MenuSectionProps = {
  title: string;
  icon: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: BadgeData;
};

function Badge({ badge }: { badge?: BadgeData }) {
  if (!badge) return null;

  return (
    <span className={`menu-badge badge-${badge.level}`}>
      {badge.text}
    </span>
  );
}

function MenuSection({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
}: MenuSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="menu-section">
      <button
        className={`menu-section-title ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className="menu-section-name">
          <span>{icon}</span>
          {title}
        </span>

        <span className="menu-section-right">
          <Badge badge={badge} />
          <span className="menu-chevron">{open ? "⌄" : "›"}</span>
        </span>
      </button>

      {open && <div className="menu-section-content">{children}</div>}
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Accueil");

  /*
    Pour l'instant :
    true = on simule Hime-sama pour construire l'interface.

    PLUS TARD :
    cette valeur viendra du backend après connexion Discord.
  */
  const isHime = true;

  const navButton = (
    icon: string,
    name: string,
    badge?: BadgeData
  ) => (
    <button
      className={`nav-item ${activePage === name ? "active" : ""}`}
      onClick={() => setActivePage(name)}
    >
      <span className="nav-left">
        <span className="nav-icon">{icon}</span>
        <span>{name}</span>
      </span>

      <Badge badge={badge} />
    </button>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand brand-button"
          onClick={() => {
            if (activePage === "Accueil") {
              const logo = document.querySelector(".brand");
              logo?.classList.remove("brand-celebrate");

              // Force le redémarrage de l'animation
              void (logo as HTMLElement)?.offsetWidth;

              logo?.classList.add("brand-celebrate");

              setTimeout(() => {
                logo?.classList.remove("brand-celebrate");
              }, 900);
            } else {
              setActivePage("Accueil");
            }
          }}
          title="Retour à l'accueil"
        >
          <span className="brand-confetti confetti-1">✦</span>
          <span className="brand-confetti confetti-2">✦</span>
          <span className="brand-confetti confetti-3">✧</span>
          <span className="brand-confetti confetti-4">✦</span>
          <span className="brand-confetti confetti-5">✧</span>
          <span className="brand-confetti confetti-6">✦</span>

          <img
            src="/fond-appli.png"
            alt="TailBlue"
            className="brand-image"
          />
        </button>
        <nav className="sidebar-nav">
          <div className="main-navigation">
            {navButton("🏠", "Accueil", {
              text: "2",
              level: "new",
            })}

            {navButton("👤", "Personnage")}
            {navButton("🎒", "Inventaire")}
          </div>

          <div className="navigation-separator" />

          <MenuSection
            title="Aventure"
            icon="⚔️"
            defaultOpen
            badge={{
              text: "3",
              level: "info",
            }}
          >
            {navButton("📜", "Quêtes", {
              text: "3",
              level: "info",
            })}

            {navButton("⛏️", "Mine", {
              text: "!",
              level: "important",
            })}

            {navButton("🏹", "Hunt")}
            {navButton("🛠️", "Work")}
            {navButton("🗺️", "Conquêtes")}
          </MenuSection>

          <MenuSection title="Compagnons" icon="🐾">
            {navButton("🐯", "Pets")}
            {navButton("🏡", "Chenil")}
            {navButton("🥚", "Élevage")}
          </MenuSection>

          <MenuSection title="Monde" icon="🌍">
            {navButton("🏰", "Maison")}
            {navButton("🏛️", "Musée")}
            {navButton("🛒", "Marché")}
            {navButton("🏆", "Classement")}
            {navButton("🖼️", "Galerie")}
          </MenuSection>

          <MenuSection
            title="Informations"
            icon="📚"
            badge={{
              text: "NEW",
              level: "new",
            }}
          >
            {navButton("📖", "Wiki", {
              text: "NEW",
              level: "new",
            })}

            {navButton("✨", "Nouveautés", {
              text: "4",
              level: "new",
            })}

            {navButton("🛣️", "Roadmap")}
          </MenuSection>

          {isHime && (
            <>
              <div className="navigation-separator" />

              <MenuSection
                title="Hime Control"
                icon="👑"
                badge={{
                  text: "9",
                  level: "urgent",
                }}
              >
                {navButton("📊", "Bilan général")}

                {navButton("📈", "Statistiques")}

                {navButton("💡", "ShowIdées", {
                  text: "8",
                  level: "new",
                })}

                {navButton("🧾", "Logs")}

                {navButton("🚨", "Erreurs", {
                  text: "1",
                  level: "urgent",
                })}

                {navButton("🛡️", "Sécurité")}

                {navButton("👥", "Joueurs")}

                {navButton("💰", "Économie")}

                {navButton("💻", "État du système")}
              </MenuSection>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {navButton("⚙️", "Paramètres")}

          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {isHime ? "H" : "A"}
            </div>

            <div className="sidebar-user-info">
              <strong>
                {isHime ? "Hime-sama" : "Aventurier"}
              </strong>

              <span>
                {isHime
                  ? "Administratrice TailBlue"
                  : "Non connecté"}
              </span>
            </div>

            <button className="sidebar-more">•••</button>
          </div>
        </div>
      </aside>

      <main className="dashboard">
        <header className="topbar">
          

          <div className="topbar-actions">
            <button
              className="topbar-icon-button"
              title="Recherche"
            >
              🔎
            </button>

            <button
              className="topbar-icon-button notification-button"
              title="Notifications"
            >
              🔔
              <span className="notification-dot urgent-dot" />
            </button>

            <div className="profile-card">
              <div className="profile-avatar">
                {isHime ? "H" : "A"}
              </div>

              <div>
                <strong>
                  {isHime ? "Hime-sama" : "Aventurier"}
                </strong>

                <span>Niveau 42</span>
              </div>
            </div>
          </div>
        </header>

        {activePage === "Accueil" ? (
          <>
            <section className="stats-grid">
              <article className="stat-card">
                <span className="stat-label">Niveau</span>
                <strong className="stat-value">42</strong>
                <span className="stat-detail">
                  Progression actuelle
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">Or</span>
                <strong className="stat-value">
                  12 450
                </strong>
                <span className="stat-detail">
                  🪙 Pièces disponibles
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">Rang</span>
                <strong className="stat-value">—</strong>
                <span className="stat-detail">
                  Synchronisation future
                </span>
              </article>

              <article className="stat-card">
                <span className="stat-label">
                  Quêtes disponibles
                </span>

                <strong className="stat-value">7</strong>

                <span className="stat-detail">
                  Monde • Mine • Activités
                </span>
              </article>
            </section>

            <section className="main-grid">
              <article className="panel activity-panel">
                <div className="panel-heading">
                  <div>
                    <p className="eyebrow">JOURNAL</p>
                    <h2>Activité récente</h2>
                  </div>

                  <button className="small-button">
                    Voir tout
                  </button>
                </div>

                <div className="activity-list">
                  <div className="activity-item">
                    <div className="activity-icon">⛏️</div>

                    <div>
                      <strong>
                        Expédition minière terminée
                      </strong>

                      <span>
                        +3 minerais de fer • +120 XP
                      </span>
                    </div>

                    <em>Il y a 4 min</em>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon">🐯</div>

                    <div>
                      <strong>
                        Sugus a gagné de l'affection
                      </strong>

                      <span>
                        Votre lien se renforce.
                      </span>
                    </div>

                    <em>Il y a 18 min</em>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon">📜</div>

                    <div>
                      <strong>Quête terminée</strong>
                      <span>La Pierre Ancienne</span>
                    </div>

                    <em>Aujourd'hui</em>
                  </div>

                  <div className="activity-item">
                    <div className="activity-icon">⚔️</div>

                    <div>
                      <strong>Victoire en combat</strong>
                      <span>
                        Dragon des Glaces vaincu
                      </span>
                    </div>

                    <em>Aujourd'hui</em>
                  </div>
                </div>
              </article>

              <article className="panel companion-panel">
                <p className="eyebrow">
                  COMPAGNON ACTUEL
                </p>

                <h2>Sugus</h2>

                <div className="companion-portrait">
                  🐯
                </div>

                <div className="companion-info">
                  <div>
                    <span>Niveau</span>
                    <strong>1</strong>
                  </div>

                  <div>
                    <span>Affection</span>
                    <strong>87%</strong>
                  </div>

                  <div>
                    <span>Dégâts</span>
                    <strong>28</strong>
                  </div>
                </div>
              </article>
            </section>

            <section className="bottom-grid">
              <article className="panel progress-panel">
                <div className="progress-block">
                  <div className="progress-title">
                    <span>❤️ Points de vie</span>
                    <strong>720 / 720</strong>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill health" />
                  </div>
                </div>

                <div className="progress-block">
                  <div className="progress-title">
                    <span>⚡ Énergie</span>
                    <strong>85%</strong>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill energy" />
                  </div>
                </div>

                <div className="progress-block">
                  <div className="progress-title">
                    <span>✨ Expérience</span>
                    <strong>65%</strong>
                  </div>

                  <div className="progress-track">
                    <div className="progress-fill xp" />
                  </div>
                </div>
              </article>

              <article className="panel quick-panel">
                <p className="eyebrow">
                  ACCÈS RAPIDE
                </p>

                <h2>Continuer l'aventure</h2>

                <div className="quick-actions">
                  <button
                    onClick={() =>
                      setActivePage("Mine")
                    }
                  >
                    ⛏️ Aller à la mine
                  </button>

                  <button
                    onClick={() =>
                      setActivePage("Quêtes")
                    }
                  >
                    📜 Voir les quêtes
                  </button>

                  <button
                    onClick={() =>
                      setActivePage("Pets")
                    }
                  >
                    🐾 Mes compagnons
                  </button>

                  <button
                    onClick={() =>
                      setActivePage("Maison")
                    }
                  >
                    🏰 Ma résidence
                  </button>
                </div>
              </article>
            </section>

            <section className="suggestion-card">
              <div className="suggestion-icon">
                💡
              </div>

              <div className="suggestion-content">
                <p className="eyebrow">
                  COMMUNAUTÉ
                </p>

                <h2>Une idée pour TailBlue ?</h2>

                <p>
                  Une fonctionnalité, une amélioration ou
                  simplement une idée folle ? Partage-la
                  directement avec l'équipe TailBlue.
                </p>
              </div>

              <button
                className="suggestion-button"
                onClick={() =>
                  setActivePage("Faire une suggestion")
                }
              >
                💡 Faire part d'une suggestion
              </button>
            </section>

            {isHime && (
              <section className="hime-overview">
                <div className="hime-overview-header">
                  <div>
                    <p className="eyebrow">
                      👑 HIME CONTROL
                    </p>

                    <h2>À surveiller</h2>
                  </div>

                  <span className="admin-label">
                    Administratrice
                  </span>
                </div>

                <div className="hime-alert-grid">
                  <button
                    className="hime-alert-card idea-alert"
                    onClick={() =>
                      setActivePage("ShowIdées")
                    }
                  >
                    <span className="hime-alert-icon">
                      💡
                    </span>

                    <div>
                      <strong>8</strong>
                      <span>idées à traiter</span>
                    </div>
                  </button>

                  <button
                    className="hime-alert-card urgent-alert"
                    onClick={() =>
                      setActivePage("Erreurs")
                    }
                  >
                    <span className="hime-alert-icon">
                      🚨
                    </span>

                    <div>
                      <strong>1</strong>
                      <span>erreur urgente</span>
                    </div>
                  </button>

                  <button
                    className="hime-alert-card"
                    onClick={() =>
                      setActivePage("Bilan général")
                    }
                  >
                    <span className="hime-alert-icon">
                      📊
                    </span>

                    <div>
                      <strong>Voir</strong>
                      <span>bilan TailBlue</span>
                    </div>
                  </button>
                </div>
              </section>
            )}
          </>
        ) : activePage === "ShowIdées" ? (
          <section className="ideas-page">
            <div className="ideas-page-header">
              <div>
                <p className="eyebrow">
                  👑 HIME CONTROL
                </p>

                <h2>ShowIdées</h2>

                <p>
                  Toutes les suggestions envoyées depuis
                  Discord et l'application arriveront ici.
                </p>
              </div>

              <div className="ideas-count">
                8 nouvelles
              </div>
            </div>

            <div className="idea-filters">
              <button className="filter-active">
                Toutes
              </button>

              <button>Nouvelles</button>
              <button>À étudier</button>
              <button>Prévues</button>
              <button>En cours</button>
              <button>Terminées</button>
            </div>

            <div className="idea-list">
              <article className="idea-card">
                <div className="idea-card-top">
                  <span className="idea-status status-new">
                    Nouvelle
                  </span>

                  <span className="idea-source">
                    Discord
                  </span>
                </div>

                <h3>
                  Ajouter des trophées dans la maison
                </h3>

                <p>
                  Ce serait cool de pouvoir exposer les
                  trophées obtenus pendant les quêtes.
                </p>

                <div className="idea-meta">
                  <span>Par @JoueurTest</span>
                  <span>#128</span>
                </div>
              </article>

              <article className="idea-card">
                <div className="idea-card-top">
                  <span className="idea-status status-progress">
                    En cours
                  </span>

                  <span className="idea-source">
                    Application
                  </span>
                </div>

                <h3>
                  Ajouter plus d'informations au Wiki
                </h3>

                <p>
                  Montrer directement où trouver les
                  ressources et dans quelles recettes elles
                  sont utilisées.
                </p>

                <div className="idea-meta">
                  <span>Par @BlueFox</span>
                  <span>#127</span>
                </div>
              </article>
            </div>
          </section>
        ) : activePage === "Faire une suggestion" ? (
          <section className="suggestion-page">
            <div className="suggestion-form-card">
              <div className="big-suggestion-icon">
                💡
              </div>

              <p className="eyebrow">
                TAILBLUE COMMUNITY
              </p>

              <h2>Faire part d'une suggestion</h2>

              <p className="suggestion-description">
                Cette interface sera reliée plus tard au
                même système que la commande Discord
                <strong> !idee</strong>.
              </p>

              <label>
                Titre de l'idée
                <input
                  type="text"
                  placeholder="Ex. Ajouter des trophées..."
                />
              </label>

              <label>
                Votre suggestion
                <textarea
                  placeholder="Décrivez votre idée..."
                  rows={7}
                />
              </label>

              <div className="suggestion-form-actions">
                <button
                  className="secondary-button"
                  onClick={() =>
                    setActivePage("Accueil")
                  }
                >
                  Annuler
                </button>

                <button className="primary-button">
                  Envoyer la suggestion
                </button>
              </div>
            </div>
          </section>
              
        ) : activePage === "Pets" ? (
            <PetsPage />

      ) : activePage === "Maison" ? (
           <HousePage />

      ) : activePage === "Marché" ? (
          <MarketPage />
      ) : activePage === "Personnage" ? (
          <CharacterPage />

        ) : activePage === "Inventaire" ? (
          <InventoryPage />
        ) : activePage === "Quêtes" ? (
          <QuestsPage />

        ) : activePage === "Mine" ? (
          <MinePage />
        ) : activePage === "Hunt" ? (
          <HuntPage />

        ) : activePage === "Work" ? (
          <WorkPage />
        ) : isTailBlueExtraPage(activePage) ? (
          <TailBlueExtraPages activePage={activePage} />


  ) : (
          
          <section className="page-placeholder">
            <div className="placeholder-icon">
              
              {activePage === "Wiki"
                ? "📖"
                : "✨"}
            </div>

            <p className="eyebrow">TAILBLUE</p>

            <h2>{activePage}</h2>

            <p>
              Cette section est maintenant reliée à la
              navigation. Son contenu TailBlue sera ajouté
              progressivement.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setActivePage("Accueil")
              }
            >
              Retour au Dashboard
            </button>
          </section>
          
        )}
      </main>
    </div>
  );
}

export default App;