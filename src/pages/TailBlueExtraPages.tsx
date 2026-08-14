import BreedingPage from "./BreedingPage";
import GalleryPage from "./GalleryPage";
import HimeControlPage, { type HimeSection } from "./HimeControlPage";
import KennelPage from "./KennelPage";
import LeaderboardPage from "./LeaderboardPage";
import MuseumPage from "./MuseumPage";
import NewsPage from "./NewsPage";
import RoadmapPage from "./RoadmapPage";
import SettingsPage from "./SettingsPage";
import WikiPage from "./WikiPage";

const EXTRA_PAGES = new Set([
  "Chenil",
  "Élevage",
  "Musée",
  "Classement",
  "Galerie",
  "Wiki",
  "Nouveautés",
  "Roadmap",
  "Bilan général",
  "Statistiques",
  "Logs",
  "Erreurs",
  "Sécurité",
  "Joueurs",
  "Économie",
  "État du système",
  "Paramètres",
]);

const HIME_PAGES = new Set<HimeSection>([
  "Bilan général",
  "Statistiques",
  "Logs",
  "Erreurs",
  "Sécurité",
  "Joueurs",
  "Économie",
  "État du système",
]);

export function isTailBlueExtraPage(page: string) {
  return EXTRA_PAGES.has(page);
}

export default function TailBlueExtraPages({ activePage }: { activePage: string }) {
  if (activePage === "Chenil") return <KennelPage />;
  if (activePage === "Élevage") return <BreedingPage />;
  if (activePage === "Musée") return <MuseumPage />;
  if (activePage === "Classement") return <LeaderboardPage />;
  if (activePage === "Galerie") return <GalleryPage />;
  if (activePage === "Wiki") return <WikiPage />;
  if (activePage === "Nouveautés") return <NewsPage />;
  if (activePage === "Roadmap") return <RoadmapPage />;
  if (activePage === "Paramètres") return <SettingsPage />;

  if (HIME_PAGES.has(activePage as HimeSection)) {
    return <HimeControlPage section={activePage as HimeSection} />;
  }

  return null;
}
