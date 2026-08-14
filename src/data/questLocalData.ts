export type QuestState = "available" | "active" | "completed";

export type TailBlueQuest = {
  id: string;
  name: string;
  description: string;
  source: "mine" | "royal" | "adventure";
  difficulty: "facile" | "moyenne" | "difficile";
  event: string;
  objective: number;
  progress: number;
  rewardCookies: number;
  rewardXp: number;
  state: QuestState;
};

export const QUESTS: TailBlueQuest[] = [
  {
    id: "mine_monster_5",
    name: "👹 Nettoyage des galeries",
    description: "Vaincre 5 monstres dans la Mine.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_monster",
    objective: 5,
    progress: 2,
    rewardCookies: 300,
    rewardXp: 200,
    state: "active",
  },
  {
    id: "mine_ore_10",
    name: "💎 Sac plein de minerai",
    description: "Miner 10 fois dans la Mine.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_ore",
    objective: 10,
    progress: 6,
    rewardCookies: 240,
    rewardXp: 150,
    state: "active",
  },
  {
    id: "mine_search_10",
    name: "🔍 Rat de galerie",
    description: "Fouiller 10 fois dans la Mine.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_search",
    objective: 10,
    progress: 0,
    rewardCookies: 230,
    rewardXp: 150,
    state: "available",
  },
  {
    id: "mine_chest_4",
    name: "🏆 Pilleur méthodique",
    description: "Ouvrir 4 coffres dans la Mine.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_chest",
    objective: 4,
    progress: 4,
    rewardCookies: 280,
    rewardXp: 180,
    state: "completed",
  },
  {
    id: "mine_potion_3",
    name: "🧪 Pas aujourd'hui, la mort",
    description: "Utiliser 3 potions dans la Mine.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_potion",
    objective: 3,
    progress: 1,
    rewardCookies: 250,
    rewardXp: 175,
    state: "active",
  },
  {
    id: "mine_descend_2",
    name: "🌑 Enfonce-toi dans l'Abîme",
    description: "Descendre de 2 étages dans la Mine.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_descend",
    objective: 2,
    progress: 0,
    rewardCookies: 320,
    rewardXp: 220,
    state: "available",
  },
  {
    id: "mine_rest_5",
    name: "🔥 Je reviendrai vivant",
    description: "Utiliser 5 repos dans la Mine.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_rest",
    objective: 5,
    progress: 3,
    rewardCookies: 210,
    rewardXp: 145,
    state: "active",
  },
  {
    id: "mine_enter_3",
    name: "⛏️ La Mine me rappelle",
    description: "Entrer 3 fois dans la Mine pendant la durée de la quête.",
    source: "mine",
    difficulty: "difficile",
    event: "mine_enter",
    objective: 3,
    progress: 1,
    rewardCookies: 210,
    rewardXp: 150,
    state: "active",
  },
];
