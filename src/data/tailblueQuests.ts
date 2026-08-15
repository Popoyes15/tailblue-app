import type {
  QuestDefinitionDto,
  QuestDifficulty,
  QuestEvent,
} from "../types/quest";

export const QUEST_DIFFICULTIES: Record<
  QuestDifficulty,
  {
    emoji: string;
    label: string;
    shortLabel: string;
    description: string;
  }
> = {
  facile: {
    emoji: "🟢",
    label: "Facile",
    shortLabel: "Facile",
    description: "Rapide à accomplir, récompense légère.",
  },
  moyenne: {
    emoji: "🟡",
    label: "Intermédiaire",
    shortLabel: "Intermédiaire",
    description: "Demande un peu plus d’investissement.",
  },
  difficile: {
    emoji: "🔴",
    label: "Difficile",
    shortLabel: "Difficile",
    description: "Objectif plus long, meilleure récompense.",
  },
};

export const QUEST_EVENT_META: Record<
  string,
  {
    icon: string;
    label: string;
    description: string;
  }
> = {
  calin: {
    icon: "🫂",
    label: "Câlins",
    description: "Progresse lorsque le joueur donne un câlin valide.",
  },
  cookie: {
    icon: "🍪",
    label: "Cookies",
    description: "Progresse lorsqu’un cookie est offert dans le Royaume.",
  },
  patpat: {
    icon: "🐰",
    label: "Patpat",
    description: "Progresse avec les patpat valides.",
  },
  daily: {
    icon: "🎁",
    label: "Daily",
    description: "Progresse lorsque le Daily est réellement récupéré.",
  },
  work: {
    icon: "💼",
    label: "Work",
    description: "Progresse lorsqu’un Work valide est terminé.",
  },
  hunt: {
    icon: "🏹",
    label: "Hunt",
    description: "Progresse lorsqu’un Hunt valide est terminé.",
  },
  guildwork: {
    icon: "🏰",
    label: "Mission de guilde",
    description: "Progresse avec un travail de guilde valide.",
  },
  mine_enter: {
    icon: "⛏️",
    label: "Entrée dans la Mine",
    description: "Progresse lorsqu’une entrée dans la Mine est enregistrée.",
  },
  mine_search: {
    icon: "🔎",
    label: "Fouille",
    description: "Progresse à chaque fouille valide dans la Mine.",
  },
  mine_ore: {
    icon: "🪨",
    label: "Minage",
    description: "Progresse à chaque action de minage valide.",
  },
  mine_potion: {
    icon: "🧪",
    label: "Potion",
    description: "Progresse lorsqu’une potion est réellement utilisée dans la Mine.",
  },
  mine_monster: {
    icon: "⚔️",
    label: "Combat de Mine",
    description: "Progresse lorsqu’un monstre de la Mine est vaincu.",
  },
  mine_chest: {
    icon: "🧰",
    label: "Coffre de Mine",
    description: "Progresse lorsqu’un coffre de la Mine est ouvert.",
  },
  mine_rest: {
    icon: "🔥",
    label: "Repos de Mine",
    description: "Progresse lorsqu’un repos de Mine est consommé.",
  },
  mine_descend: {
    icon: "⇩",
    label: "Descente",
    description: "Progresse lorsque le joueur descend réellement d’un étage.",
  },
};

/**
 * Registre miroir du QUESTS V2 actuel.
 *
 * IMPORTANT :
 * - sert à l’aperçu local et à documenter l’UI ;
 * - en production, les offres / récompenses / progressions viennent de l’API ;
 * - le frontend ne doit jamais décider qu’une quête est terminée.
 */
export const TAILBLUE_QUESTS: Record<string, QuestDefinitionDto> = {
  // =========================================================
  // 🟢 FACILES
  // =========================================================
  calin: {
    id: "calin",
    name: "🫂 Un peu de tendresse",
    description: "Donner 3 câlins à d'autres aventuriers.",
    event: "calin",
    objective: 3,
    difficulty: "facile",
    rewardCookies: 35,
    rewardXp: 25,
  },
  cookie: {
    id: "cookie",
    name: "🍪 Partage de cookies",
    description: "Offrir 2 cookies dans le Royaume.",
    event: "cookie",
    objective: 2,
    difficulty: "facile",
    rewardCookies: 40,
    rewardXp: 25,
  },
  patpat: {
    id: "patpat",
    name: "🐰 Patpat thérapeutique",
    description: "Faire 2 patpat.",
    event: "patpat",
    objective: 2,
    difficulty: "facile",
    rewardCookies: 30,
    rewardXp: 25,
  },
  daily: {
    id: "daily",
    name: "🎁 Présent du Royaume",
    description: "Récupérer ton Daily.",
    event: "daily",
    objective: 1,
    difficulty: "facile",
    rewardCookies: 45,
    rewardXp: 25,
  },
  work_1: {
    id: "work_1",
    name: "💼 Une journée honnête",
    description: "Effectuer 1 travail.",
    event: "work",
    objective: 1,
    difficulty: "facile",
    rewardCookies: 45,
    rewardXp: 30,
  },
  hunt_1: {
    id: "hunt_1",
    name: "🏹 Petite sortie",
    description: "Réussir 1 chasse.",
    event: "hunt",
    objective: 1,
    difficulty: "facile",
    rewardCookies: 55,
    rewardXp: 35,
  },
  mine_enter: {
    id: "mine_enter",
    name: "⛏️ Sous la surface",
    description: "Entrer dans la Mine.",
    event: "mine_enter",
    objective: 1,
    difficulty: "facile",
    rewardCookies: 45,
    rewardXp: 30,
  },
  mine_search_2: {
    id: "mine_search_2",
    name: "🔎 Fouille rapide",
    description: "Fouiller 2 fois dans la Mine.",
    event: "mine_search",
    objective: 2,
    difficulty: "facile",
    rewardCookies: 50,
    rewardXp: 35,
  },
  mine_ore_2: {
    id: "mine_ore_2",
    name: "🪨 Premier coup de pioche",
    description: "Miner 2 fois dans la Mine.",
    event: "mine_ore",
    objective: 2,
    difficulty: "facile",
    rewardCookies: 50,
    rewardXp: 35,
  },
  mine_potion_1: {
    id: "mine_potion_1",
    name: "🧪 Santé avant fierté",
    description: "Utiliser 1 potion dans la Mine.",
    event: "mine_potion",
    objective: 1,
    difficulty: "facile",
    rewardCookies: 55,
    rewardXp: 40,
  },

  // =========================================================
  // 🟡 INTERMÉDIAIRES
  // =========================================================
  work_3: {
    id: "work_3",
    name: "⚒️ Journée productive",
    description: "Effectuer 3 travaux.",
    event: "work",
    objective: 3,
    difficulty: "moyenne",
    rewardCookies: 110,
    rewardXp: 70,
  },
  hunt_3: {
    id: "hunt_3",
    name: "🌲 Pisteur du Royaume",
    description: "Réussir 3 chasses.",
    event: "hunt",
    objective: 3,
    difficulty: "moyenne",
    rewardCookies: 125,
    rewardXp: 80,
  },
  mine_monster_2: {
    id: "mine_monster_2",
    name: "⚔️ Nettoyage des galeries",
    description: "Vaincre 2 monstres dans la Mine.",
    event: "mine_monster",
    objective: 2,
    difficulty: "moyenne",
    rewardCookies: 135,
    rewardXp: 90,
  },
  mine_search_5: {
    id: "mine_search_5",
    name: "🕯️ Rien ne m'échappe",
    description: "Fouiller 5 fois dans la Mine.",
    event: "mine_search",
    objective: 5,
    difficulty: "moyenne",
    rewardCookies: 105,
    rewardXp: 75,
  },
  mine_ore_5: {
    id: "mine_ore_5",
    name: "⛏️ Mineur appliqué",
    description: "Miner 5 fois dans la Mine.",
    event: "mine_ore",
    objective: 5,
    difficulty: "moyenne",
    rewardCookies: 115,
    rewardXp: 75,
  },
  mine_chest_2: {
    id: "mine_chest_2",
    name: "🧰 Chasseur de coffres",
    description: "Ouvrir 2 coffres dans la Mine.",
    event: "mine_chest",
    objective: 2,
    difficulty: "moyenne",
    rewardCookies: 130,
    rewardXp: 85,
  },
  mine_rest_2: {
    id: "mine_rest_2",
    name: "🔥 Survivant prévoyant",
    description: "Te reposer 2 fois dans la Mine.",
    event: "mine_rest",
    objective: 2,
    difficulty: "moyenne",
    rewardCookies: 90,
    rewardXp: 70,
  },
  mine_potion_2: {
    id: "mine_potion_2",
    name: "🧪 Alchimiste de terrain",
    description: "Utiliser 2 potions dans la Mine.",
    event: "mine_potion",
    objective: 2,
    difficulty: "moyenne",
    rewardCookies: 120,
    rewardXp: 85,
  },
  mine_descend_1: {
    id: "mine_descend_1",
    name: "⇩ Toujours plus bas",
    description: "Descendre d'un étage dans la Mine.",
    event: "mine_descend",
    objective: 1,
    difficulty: "moyenne",
    rewardCookies: 145,
    rewardXp: 95,
  },
  guildwork: {
    id: "guildwork",
    name: "🏰 Pour la bannière",
    description: "Participer à 1 travail de guilde.",
    event: "guildwork",
    objective: 1,
    difficulty: "moyenne",
    rewardCookies: 120,
    rewardXp: 80,
  },

  // =========================================================
  // 🔴 DIFFICILES
  // =========================================================
  work_5: {
    id: "work_5",
    name: "💼 Infatigable",
    description: "Effectuer 5 travaux.",
    event: "work",
    objective: 5,
    difficulty: "difficile",
    rewardCookies: 220,
    rewardXp: 140,
  },
  hunt_5: {
    id: "hunt_5",
    name: "🏹 Chasseur obstiné",
    description: "Réussir 5 chasses.",
    event: "hunt",
    objective: 5,
    difficulty: "difficile",
    rewardCookies: 250,
    rewardXp: 160,
  },
  mine_monster_5: {
    id: "mine_monster_5",
    name: "👹 Purge des profondeurs",
    description: "Vaincre 5 monstres dans la Mine.",
    event: "mine_monster",
    objective: 5,
    difficulty: "difficile",
    rewardCookies: 300,
    rewardXp: 200,
  },
  mine_ore_10: {
    id: "mine_ore_10",
    name: "💎 Sac plein de minerai",
    description: "Miner 10 fois dans la Mine.",
    event: "mine_ore",
    objective: 10,
    difficulty: "difficile",
    rewardCookies: 240,
    rewardXp: 150,
  },
  mine_search_10: {
    id: "mine_search_10",
    name: "🔍 Rat de galerie",
    description: "Fouiller 10 fois dans la Mine.",
    event: "mine_search",
    objective: 10,
    difficulty: "difficile",
    rewardCookies: 230,
    rewardXp: 150,
  },
  mine_chest_4: {
    id: "mine_chest_4",
    name: "🏆 Pilleur méthodique",
    description: "Ouvrir 4 coffres dans la Mine.",
    event: "mine_chest",
    objective: 4,
    difficulty: "difficile",
    rewardCookies: 280,
    rewardXp: 180,
  },
  mine_potion_3: {
    id: "mine_potion_3",
    name: "🧪 Pas aujourd'hui, la mort",
    description: "Utiliser 3 potions dans la Mine.",
    event: "mine_potion",
    objective: 3,
    difficulty: "difficile",
    rewardCookies: 250,
    rewardXp: 175,
  },
  mine_descend_2: {
    id: "mine_descend_2",
    name: "🌑 Enfonce-toi dans l'Abîme",
    description: "Descendre de 2 étages dans la Mine.",
    event: "mine_descend",
    objective: 2,
    difficulty: "difficile",
    rewardCookies: 320,
    rewardXp: 220,
  },
  mine_rest_5: {
    id: "mine_rest_5",
    name: "🔥 Je reviendrai vivant",
    description: "Utiliser 5 repos dans la Mine.",
    event: "mine_rest",
    objective: 5,
    difficulty: "difficile",
    rewardCookies: 210,
    rewardXp: 145,
  },
  mine_enter_3: {
    id: "mine_enter_3",
    name: "⛏️ La Mine me rappelle",
    description: "Entrer 3 fois dans la Mine pendant la durée de la quête.",
    event: "mine_enter",
    objective: 3,
    difficulty: "difficile",
    rewardCookies: 210,
    rewardXp: 150,
  },
};

export const QUEST_COUNT_BY_DIFFICULTY: Record<QuestDifficulty, number> = {
  facile: Object.values(TAILBLUE_QUESTS).filter(
    (quest) => quest.difficulty === "facile",
  ).length,
  moyenne: Object.values(TAILBLUE_QUESTS).filter(
    (quest) => quest.difficulty === "moyenne",
  ).length,
  difficile: Object.values(TAILBLUE_QUESTS).filter(
    (quest) => quest.difficulty === "difficile",
  ).length,
};

export function questEventMeta(event: QuestEvent) {
  return (
    QUEST_EVENT_META[event] ?? {
      icon: "📜",
      label: event || "Événement TailBlue",
      description:
        "La progression de cet objectif est calculée par le backend TailBlue.",
    }
  );
}

/**
 * Trois VRAIES quêtes uniquement pour montrer l’interface sans API.
 * En production, c’est Python qui tire aléatoirement une quête de chaque difficulté.
 */
export function makeQuestPreviewOffers(): QuestDefinitionDto[] {
  return [
    TAILBLUE_QUESTS.calin,
    TAILBLUE_QUESTS.work_3,
    TAILBLUE_QUESTS.mine_descend_2,
  ];
}
