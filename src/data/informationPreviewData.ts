import type { RoadmapItem, TailBlueUpdateArticle } from "../types/information";

/** Démonstration visuelle uniquement. Jamais utilisée en build production. */
export const PREVIEW_UPDATES: TailBlueUpdateArticle[] = [
  {
    id: "preview-large-update",
    title: "Aperçu d'une grande mise à jour TailBlue",
    excerpt: "Exemple développeur pour vérifier le rendu d'une annonce longue avant connexion au flux officiel.",
    body: "Ceci est un aperçu local de développement.\n\nUne fois l'API branchée, cette carte sera remplacée par les véritables annonces publiées depuis TailBlue. Le texte long, les paragraphes, les images et les catégories pourront être affichés ici sans reconstruire l'application.",
    publishedAt: "2026-08-15T00:00:00+02:00",
    images: [],
    tag: "Aperçu",
    author: "Mode développeur",
    importance: "info",
    source: "preview",
  },
  {
    id: "preview-image-update",
    title: "Aperçu d'un article illustré",
    excerpt: "Le lecteur accepte une image de couverture et plusieurs images secondaires.",
    body: "Cette deuxième entrée est également fictive et n'existe que pour tester la mise en page.\n\nEn production, aucune fausse nouveauté n'est affichée lorsque l'API est absente.",
    publishedAt: "2026-08-14T23:00:00+02:00",
    images: ["/icone-appli.png"],
    tag: "Aperçu",
    author: "Mode développeur",
    importance: "standard",
    source: "preview",
  },
];

/** Roadmap de préparation locale. Le backend devient source de vérité en production. */
export const PREVIEW_ROADMAP: RoadmapItem[] = [
  {
    id: "desktop-foundation",
    status: "done",
    title: "Fondations Desktop",
    area: "Application",
    progress: 100,
    description: "Navigation Tauri, identité visuelle et structure générale de l'application.",
  },
  {
    id: "game-interfaces",
    status: "done",
    title: "Interfaces principales TailBlue",
    area: "Application",
    progress: 100,
    description: "Personnage, inventaire, quêtes, Mine, Hunt, Work, compagnons, chenil, élevage et pages du Monde préparés côté interface.",
  },
  {
    id: "information-center",
    status: "current",
    title: "Centre Informations complet",
    area: "Application",
    progress: 90,
    description: "Wiki complet, Nouveautés dynamiques et Roadmap prête à être alimentée par l'API.",
  },
  {
    id: "shared-api",
    status: "next",
    title: "API TailBlue partagée",
    area: "Backend",
    description: "Brancher l'application aux profils, moteurs Python et données réelles utilisés par le bot.",
  },
  {
    id: "discord-auth",
    status: "next",
    title: "Connexion Discord sécurisée",
    area: "Identité",
    description: "OAuth2 Discord, avatar, identité et permissions validées côté serveur.",
  },
  {
    id: "live-sync",
    status: "next",
    title: "Synchronisation en direct",
    area: "Backend",
    description: "Propager les changements du bot vers l'application ouverte sans redémarrage grâce au flux temps réel.",
  },
  {
    id: "hime-backend",
    status: "next",
    title: "Hime Control réel",
    area: "Administration",
    description: "Relier les écrans administratifs à des routes protégées et contrôlées exclusivement par le backend.",
  },
  {
    id: "distribution",
    status: "later",
    title: "Distribution et mises à jour de l'application",
    area: "Desktop",
    description: "Préparer les builds publics et un mécanisme propre de livraison des nouvelles versions.",
  },
  {
    id: "conquests",
    status: "paused",
    title: "Conquêtes",
    area: "Gameplay",
    description: "En attente : le gameplay doit d'abord exister dans TailBlue avant qu'une interface Desktop soit créée.",
  },
];
