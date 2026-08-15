import type {
  CharacterDetail,
  CharacterDetailKind,
  CharacterSnapshot,
} from "../types/character";

/*
 * Aperçu purement visuel.
 *
 * Les éléments "Frieren", "Princesse" et "Château" reprennent des définitions
 * existantes du bot pour montrer le rendu, mais ce fichier ne prétend PAS
 * représenter la sauvegarde actuelle de Hime-sama.
 */
export const CHARACTER_PREVIEW: CharacterSnapshot = {
  generatedAt: new Date().toISOString(),
  mode: "preview",

  profile: {
    displayName: "Hime-sama",
    avatarUrl: null,
    title: "👑 Hime-sama • Créatrice de TailBlue",
    isHime: true,
    level: 42,
    xpTotal: 0,
    xpCurrent: 0,
    xpNeeded: 1,
    adventurerRank: null,
    adventurerScore: null,
  },

  combat: {
    hp: 100,
    attack: 5,
    defense: 5,
    crit: 5,
    dodge: 5,
    luck: 0,
    combatLevel: null,
    combatEnergy: null,
    combatEnergyMax: null,
  },

  activity: {
    cookies: 0,
    hugsGiven: 0,
    hugsReceived: 0,
    chestsOpened: 0,
    works: 0,
    hunts: 0,
    reputation: 0,
    successes: 0,
    museumPieces: 0,
  },

  identity: [
    {
      kind: "race",
      icon: "🧬",
      label: "Race",
      value: "Frieren",
      subtitle: "Aperçu catalogue • pas la sauvegarde du joueur",
      imageUrl: "/ImagesRaces/frieren.png",
      available: true,
      previewOnly: true,
    },
    {
      kind: "job",
      icon: "💼",
      label: "Métier",
      value: "👑 Princesse du Royaume de TailBlue",
      subtitle: "Aperçu du métier spécial Hime",
      available: true,
      previewOnly: true,
    },
    {
      kind: "guild",
      icon: "🏰",
      label: "Guilde",
      value: "Aperçu de guilde royale",
      subtitle: "La vraie appartenance viendra du backend",
      imageUrl: "/ImagesGuildes/guilde_Hime.png",
      available: true,
      previewOnly: true,
    },
    {
      kind: "residence",
      icon: "🏠",
      label: "Résidence",
      value: "👑 Château de Hime-sama",
      imageUrl: "/ImagesMaison/Image_Chateau.png",
      available: true,
      previewOnly: true,
    },
    {
      kind: "companion",
      icon: "🐾",
      label: "Compagnon",
      value: "Synchronisation future",
      subtitle: "Le compagnon actif réel viendra de pets.py",
      available: false,
      previewOnly: true,
    },
    {
      kind: "rank",
      icon: "⚔️",
      label: "Rang d'aventurier",
      value: "—",
      subtitle: "Jamais simulé côté frontend",
      available: true,
      previewOnly: true,
    },
    {
      kind: "equipment",
      icon: "🧰",
      label: "Équipement",
      value: "Synchronisation future",
      subtitle: "8 emplacements pris en charge",
      available: true,
      previewOnly: true,
    },
  ],
};

const PREVIEW_DETAILS: Record<
  CharacterDetailKind,
  CharacterDetail | null
> = {
  race: {
    kind: "race",
    id: "frieren",
    name: "Frieren",
    emoji: "🪄",
    imageUrl: "/ImagesRaces/frieren.png",
    description:
      "Race unique de Hime-sama : une archimage immortelle maîtrisant une immense bibliothèque de sorts. Très puissante, mais ses grands sorts consomment beaucoup d'énergie de combat.",
    archetype: "Archimage millénaire",
    elements: ["light", "fire", "ice", "lightning"],
    preferredWeapons: [
      "Grimoires anciens",
      "Sceptres",
      "Bâtons légendaires",
    ],
    statBonuses: {
      attack: 2,
      crit: 3,
      luck: 4,
      dodge: 2,
    },
    combatLevel: null,
    unlockedSkills: [
      {
        id: "frieren_zoltraak",
        name: "Zoltraak mineur",
        description:
          "Une version contenue du sort perforant.",
        unlockLevel: 1,
        element: "light",
        learned: true,
      },
      {
        id: "frieren_barriere",
        name: "Barrière hexagonale",
        description:
          "Une barrière magique très stable.",
        unlockLevel: 1,
        learned: true,
      },
    ],
    nextSkillLevel: null,

    /*
     * equipment.py ne possède actuellement pas ces champs séparés.
     * On les laisse volontairement vides.
     */
    origin: null,
    kingdom: null,
    history: null,

    exclusive: true,
    previewOnly: true,
  },

  job: {
    kind: "job",
    id: "princesse",
    name: "Princesse du Royaume de TailBlue",
    emoji: "👑",
    requiredLevel: 9999,
    description:
      "Métier spécial utilisé par Hime-sama dans le système Work.",
    specialty:
      "La fiche finale reprendra les textes de CODEX_METIERS côté serveur.",
    quote: null,
    salaryMin: null,
    salaryMax: null,
    previewOnly: true,
  },

  guild: {
    kind: "guild",
    id: null,
    name: "Aperçu de guilde royale",
    imageUrl: "/ImagesGuildes/guilde_Hime.png",
    founderId: null,
    founderName: "Synchronisation future",
    level: 0,
    xp: 0,
    xpNeeded: 0,
    treasure: 0,
    maxMembers: 0,
    members: [],
    hall: {
      name: "👑 Hall Impérial des Reliques",
      description:
        "Résidence officielle de la Guilde Hime-sama. Les plus grandes reliques du Royaume de TailBlue reposent ici sous la protection de la Couronne.",
      imageUrl: "/hall/imperial.png",
      level: null,
      xp: null,
    },
    activities: [
      "Missions de guilde",
      "Chasses de guilde",
      "Expéditions",
      "Hall des Reliques",
      "Chroniques",
    ],
    previewOnly: true,
  },

  residence: {
    kind: "residence",
    id: "chateau",
    name: "👑 Château de Hime-sama",
    imageUrl: "/ImagesMaison/Image_Chateau.png",
    description:
      "Résidence royale affichée ici uniquement pour prévisualiser la fiche détaillée.",
    price: null,
    effects: [
      { label: "Cookies", value: "+10 %" },
      { label: "XP", value: "+10 %" },
      { label: "Temps de repos", value: "-5 min" },
    ],
    previewOnly: true,
  },

  companion: null,

  rank: {
    kind: "rank",
    rank: null,
    score: null,
    ladder: ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"],
    explanation:
      "Le Rang d'Aventurier mesure la puissance réelle du personnage. Il tient notamment compte des statistiques, de l'équipement, des compétences, de la race et de l'expérience. Le frontend ne le calcule jamais.",
    factors: [],
    previewOnly: true,
  },

  equipment: {
    kind: "equipment",
    equipped: [
      { slot: "weapon", icon: "⚔️", label: "Arme" },
      { slot: "helmet", icon: "🪖", label: "Casque" },
      { slot: "chest", icon: "🥋", label: "Plastron" },
      { slot: "gloves", icon: "🧤", label: "Gants" },
      { slot: "leggings", icon: "👖", label: "Jambières" },
      { slot: "boots", icon: "👢", label: "Bottes" },
      { slot: "ring", icon: "💍", label: "Anneau" },
      { slot: "amulet", icon: "📿", label: "Amulette" },
    ],
    ownedEquipmentCount: 0,
    affinityText: "Synchronisation future",
    activeStats: CHARACTER_PREVIEW.combat,
    previewOnly: true,
  },
};

export function getPreviewCharacterDetail(
  kind: CharacterDetailKind,
): CharacterDetail | null {
  return PREVIEW_DETAILS[kind];
}
