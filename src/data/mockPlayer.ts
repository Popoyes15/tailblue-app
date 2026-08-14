import type { Player } from "../types/game";

export const mockPlayer: Player = {
  discordId: "247052020358447104",

  username: "Hime-sama",
  displayName: "Hime-sama",

  level: 42,
  xp: 65,

  gold: 12450,

  rank: null,
  reputation: 3210,

  health: 720,
  maxHealth: 720,

  energy: 85,
  maxEnergy: 100,

  activePetId: "sugus",
  activeHouseId: "castle",

  pets: [
    {
      id: "sugus",
      name: "Sugus",
      species: "Tigre du Serment",

      level: 1,
      affection: 87,
      damage: 28,

      image: "/assets/pets/sugus.png",

      rarity: "unique",
      isActive: true,
    },

    {
      id: "taiga",
      name: "Taiga",
      species: "Tigre",

      level: 1,
      affection: 72,
      damage: 20,

      image: "/assets/pets/taiga.png",
    },
  ],

  houses: [
    {
      id: "castle",

      name: "Château royal",

      level: 5,

      image: "/assets/houses/castle.png",

      description:
        "Résidence royale du royaume de TailBlue.",

      ownerId: "247052020358447104",

      storage: 180,
      comfort: 92,
      decorations: 14,

      isActive: true,
    },
  ],

  quests: [
    {
      id: "mine-iron",

      name: "Les profondeurs de fer",

      description:
        "Extraire 10 minerais de fer dans la mine.",

      source: "mine",

      status: "available",

      progress: 0,
      goal: 10,
    },

    {
      id: "pet-bond",

      name: "Un lien indestructible",

      description:
        "Augmenter l'affection d'un compagnon.",

      source: "pet",

      status: "active",

      progress: 7,
      goal: 10,
    },
  ],

  inventory: [],
};