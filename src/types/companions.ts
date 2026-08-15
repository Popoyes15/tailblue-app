export type CompanionFamily =
  | "compagnons"
  | "economie"
  | "travail"
  | "combat"
  | "mythiques"
  | string;

export type CompanionFormDto = {
  id: string;
  name: string;
  image?: string;
  description?: string;
  title?: string;
};

export type CompanionDefinitionDto = {
  id: string;
  name: string;
  image: string;
  description: string;
  bonus: string;
  rarity: string;
  habitat: string;
  temperament: string;
  family: CompanionFamily;
  story?: string;
  stats: Record<string, number>;
  abilities: Array<{
    name: string;
    description: string;
  }>;
  forms: CompanionFormDto[];
  adoptable?: boolean;
  unique?: boolean;
  giftOnly?: boolean;
};

export type OwnedCompanionDto = {
  id: string;
  displayName: string;
  nickname?: string | null;
  level: number;
  xp: number;
  xpForNextLevel?: number;
  affection: number;
  trustLabel: string;
  trustMultiplier?: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  active: boolean;
  canRename: boolean;
  stage?: string | null;
  currentImage?: string | null;
  discoveredFoodIds?: string[];
  stats?: {
    cookiesEarned?: number;
    works?: number;
    hunts?: number;
    combats?: number;
    guildMissions?: number;
    taigaEvents?: number;
  };
};

export type KennelDefinitionDto = {
  id: string;
  name: string;
  description: string;
  price: number;
  bonusPlaces: number | null;
  image: string;
  royal?: boolean;
};

export type KennelSnapshotDto = {
  currentKennel: KennelDefinitionDto | null;
  gallery: KennelDefinitionDto[];
  activeIds: string[];
  activeLimit: number;
  totalCapacity: number | null;
  canUpgrade: boolean;
  nextKennelId?: string | null;
  upgradeBlockReason?: string | null;
  playerLevel?: number;
  guildName?: string | null;
  royalPrivilege?: boolean;
};

export type FoodDefinitionDto = {
  id: string;
  name: string;
  price: number;
  level: number;
  heal: number;
  energy: number;
};

export type FoodInventoryEntryDto = {
  foodId: string;
  quantity: number;
};

export type ProvisionLevelDto = {
  level: number;
  name: string;
  price: number;
  image: string;
  description: string;
};

export type ProvisionSnapshotDto = {
  level: number;
  current: ProvisionLevelDto;
  levels: ProvisionLevelDto[];
  stock: FoodDefinitionDto[];
  inventory: FoodInventoryEntryDto[];
  canUpgrade: boolean;
  nextLevel?: ProvisionLevelDto | null;
  upgradeBlockReason?: string | null;
  cookies?: number;
};

export type DragonLineageDto = {
  id: string;
  name: string;
  rarity: string;
  element: string;
  chance: number;
  habitat: string;
  temperament: string;
  description: string;
  image: string;
};

export type BreedingSnapshotDto = {
  hasOriginsEgg: boolean;
  hatched: boolean;
  work: number;
  hunt: number;
  daily: number;
  workTarget: number;
  huntTarget: number;
  dailyTarget: number;
  readyToHatch: boolean;
  lineages: DragonLineageDto[];
  obtainedDragon?: {
    id: string;
    name: string;
    rarity: string;
    image: string;
  } | null;
};

export type CompanionSnapshotDto = {
  catalog: CompanionDefinitionDto[];
  owned: OwnedCompanionDto[];
};

export type FeedResultDto = {
  ok: boolean;
  text: string;
  preference?: "adore" | "aime" | "neutre" | "deteste";
  hpGain?: number;
  energyGain?: number;
  affectionGain?: number;
  companions: CompanionSnapshotDto;
  provisions?: ProvisionSnapshotDto;
};
