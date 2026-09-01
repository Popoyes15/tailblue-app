import BreedingPage from "./BreedingPage";
import HimeControlPage, { type HimeSection } from "./HimeControlPage";
import KennelPage from "./KennelPage";
import LeaderboardPage from "./LeaderboardPage";
import MuseumPage from "./MuseumPage";
import NewsPage from "./NewsPage";
import RoadmapPage from "./RoadmapPage";
import SettingsPage from "./SettingsPage";
import WikiPage from "./WikiPage";
import IdeasPage from "./IdeasPage";
import SocialPage from "./SocialPage"; // TAILBLUE_SOCIAL_DESKTOP_V1A_20260827

const EXTRA_PAGES = new Set([
  "Chenil",
  "Élevage",
  "Musée",
  "Classement",
  "Wiki",
  "Nouveautés",
  "Roadmap",
  "Idées du Royaume",
  "Amis",
  "Messages",
  "Parrainage",
  "ShowIdées",
  "Bilan général",
  "Statistiques",
  "ShowIdées",
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
  "ShowIdées",
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

export default function TailBlueExtraPages({ activePage, isHime = false }: { activePage: string; isHime?: boolean }) {
  if (activePage === "Chenil") return <KennelPage />;
  if (activePage === "Élevage") return <BreedingPage />;
  if (activePage === "Musée") return <MuseumPage />;
  if (activePage === "Classement") return <LeaderboardPage />;
  if (activePage === "Wiki") return <WikiPage isHime={isHime} />;
  if (activePage === "Nouveautés") return <NewsPage isHime={isHime} />;
  if (activePage === "Roadmap") return <RoadmapPage isHime={isHime} />;
  if (activePage === "Idées du Royaume") return <IdeasPage />;
  if (
    activePage === "Amis" ||
    activePage === "Messages" ||
    activePage === "Parrainage"
  ) {
    return <SocialPage activePage={activePage} />;
  }
  if (activePage === "Paramètres") return <SettingsPage />;

  if (HIME_PAGES.has(activePage as HimeSection)) {
    return <HimeControlPage section={activePage as HimeSection} />;
  }

  return null;
}
