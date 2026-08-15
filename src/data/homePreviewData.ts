import type { HomeSnapshot } from "../types/home";

const now = Date.now();
const isoAgo = (minutes: number) =>
  new Date(now - minutes * 60_000).toISOString();

export const HOME_PREVIEW_SNAPSHOT: HomeSnapshot = {
  generatedAt: new Date(now).toISOString(),
  mode: "preview",

  profile: {
    displayName: "Hime-sama",
    avatarUrl: null,
    isHime: true,

    xpTotal: 88_700,
    level: 42,
    xpCurrent: 2_600,
    xpNeeded: 4_200,

    cookies: 12_450,

    /*
     * IMPORTANT : pas de faux rang en mode local.
     */
    adventurerRank: null,
    adventurerScore: null,
  },

  hp: 720,
  maxHp: 720,
  energy: 85,
  maxEnergy: 100,

  quests: {
    available: 3,
    activeId: null,
    activeName: null,
    completed: false,
  },

  companion: {
    id: "sugus_tigre",
    displayName: "Sugus",
    speciesName: "Tigre du Serment",
    imageUrl: "/Animaux/Sugus_Bebe.png",
    emoji: "🐯",
    level: 1,
    affection: 87,
    damage: 28,
  },

  recentActivity: [
    {
      id: "preview-mine",
      icon: "⛏️",
      title: "APERÇU — Expédition minière terminée",
      detail: "Le journal réel sera alimenté par les événements TailBlue.",
      createdAt: isoAgo(4),
      targetPage: "Mine",
    },
    {
      id: "preview-pet",
      icon: "🐯",
      title: "APERÇU — Compagnon",
      detail: "Les événements de compagnon pourront apparaître ici.",
      createdAt: isoAgo(18),
      targetPage: "Pets",
    },
    {
      id: "preview-quest",
      icon: "📜",
      title: "APERÇU — Quête terminée",
      detail: "La cloche pourra reprendre les notifications de quête.",
      createdAt: isoAgo(62),
      targetPage: "Quêtes",
    },
  ],

  notifications: [
    {
      id: "preview-quest-ready",
      icon: "📜",
      title: "Quête terminée",
      message:
        "APERÇU — Une quête terminée pourra t'envoyer ici réclamer sa récompense.",
      createdAt: isoAgo(3),
      read: false,
      level: "success",
      targetPage: "Quêtes",
    },
    {
      id: "preview-update",
      icon: "✨",
      title: "Nouvelle publication",
      message:
        "APERÇU — Les futures publications TailBlue pourront apparaître dans la cloche.",
      createdAt: isoAgo(25),
      read: false,
      level: "standard",
      targetPage: "Nouveautés",
    },
    {
      id: "preview-idea",
      icon: "💡",
      title: "Nouvelle idée à examiner",
      message:
        "APERÇU Hime — Une proposition vient d'arriver dans le registre royal.",
      createdAt: isoAgo(55),
      read: true,
      level: "important",
      targetPage: "ShowIdées",
    },
  ],

  hime: {
    ideas: 8,
    errors: 1,
  },
};
