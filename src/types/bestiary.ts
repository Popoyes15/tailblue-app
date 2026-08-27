// TAILBLUE_BESTIARY_DESKTOP_V1_20260826
export type BestiaryLockedSection<T> = {
  unlocked: boolean;
  required: number;
  remaining: number;
  data?: T | null;
};

export type BestiaryStatistics = {
  rarity: string;
  level: number;
  floor: string;
  element: string;
  hp?: number | null;
  attack?: number | null;
  defense?: number | null;
  crit: string;
  dodge: string;
  speed?: number | null;
  xpReward: number;
  cookiesMin: number;
  cookiesMax: number;
};

export type BestiaryBehavior = {
  profile: string;
  description: string;
  appearance: string;
  defeatText: string;
};

export type BestiaryWeaknesses = {
  weaknesses: string[];
  resistances: string[];
  immunities: string[];
};

export type BestiaryLore = {
  story: string;
  familyOrigin: string;
  familyHabitat: string;
  familyLegend: string;
  classification: Record<string, string>;
};

export type BestiaryLootItem = {
  itemId: string;
  chance: number;
  minQty: number;
  maxQty: number;
  rare: boolean;
};

export type BestiaryVariant = {
  id: string;
  name: string;
  description: string;
  seen: boolean;
  defeated: boolean;
};

export type BestiaryMonsterSlot = {
  slotId: string;
  discovered: boolean;
  id?: string;
  name?: string;
  emoji?: string;
  familyId?: string;
  isBoss?: boolean;
  level?: number;
  floor?: string;
  rarity?: string;
  imageUrl?: string | null;
  study?: {
    value: number;
    target: number;
    percent: number;
    complete: boolean;
  };
  record?: {
    encounters: number;
    victories: number;
    defeats: number;
    escapes: number;
  };
  nextUnlock?: {
    section: string;
    label: string;
    required: number;
    remaining: number;
  } | null;
  statistics?: BestiaryLockedSection<BestiaryStatistics>;
  behavior?: BestiaryLockedSection<BestiaryBehavior>;
  weaknesses?: BestiaryLockedSection<BestiaryWeaknesses>;
  lore?: BestiaryLockedSection<BestiaryLore>;
  loot?: BestiaryLockedSection<{ items: BestiaryLootItem[] }>;
  variants?: BestiaryVariant[];
  contributorCount?: number;
  firstDefeat?: {
    userId: string;
    at?: string | null;
  } | null;
};

export type BestiaryFamily = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  imageUrl?: string | null;
  bossImageUrl?: string | null;
  chronicle: {
    origin: string;
    habitat: string;
    legend: string;
  };
  total: number;
  discovered: number;
  completed: number;
  bossTotal: number;
  bossCompleted: number;
  monsters: BestiaryMonsterSlot[];
};

export type GuildBestiarySnapshot = {
  generatedAt: string;
  guildName: string;
  homeImageUrl?: string | null;
  summary: {
    total: number;
    discovered: number;
    completed: number;
    families: number;
    contributors: number;
  };
  thresholds: {
    normal: Record<string, number>;
    boss: Record<string, number>;
  };
  families: BestiaryFamily[];
};
