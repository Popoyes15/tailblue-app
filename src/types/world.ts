export type HouseId =
  | "sans_abri"
  | "ferme"
  | "cabane"
  | "village"
  | "manoir"
  | "villa"
  | "plateau"
  | "chateau";

export interface HouseEffect {
  cookiesPct: number;
  xpPct: number;
  cooldownMinutes: number;
}

export interface HouseDefinition {
  id: HouseId;
  name: string;
  levelRequired: number;
  price: number | null;
  image: string;
  description: string;
  effect: HouseEffect;
  furnitureSlots: number;
  purchasable: boolean;
}

export interface HouseFurnitureDto {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  category?: string;
  owned?: number;
  installed?: boolean;
  price?: number | null;
  effects?: Record<string, number>;
}

export interface HouseSnapshot {
  currentHouseId: HouseId;
  ownedHouseId: HouseId;
  playerLevel: number;
  cookies: number;
  sharedResidence?: boolean;
  residenceOwnerId?: string | null;
  spouseName?: string | null;
  furniture?: HouseFurnitureDto[];
  installedFurnitureIds?: string[];
  furnitureSlotsUsed?: number;
  furnitureSlotsTotal?: number;
}

export interface MuseumDefinition {
  houseId: Exclude<HouseId, "plateau">;
  name: string;
  image: string;
  description: string;
}

export interface MuseumPieceDto {
  id?: string;
  name: string;
  emoji?: string;
  rarity?: string;
  value?: number;
  description?: string;
  image?: string | null;
}

export interface MuseumCandidateDto extends MuseumPieceDto {
  quantity: number;
}

export interface MuseumSnapshot {
  houseId: HouseId;
  museumHouseId: MuseumDefinition["houseId"];
  museumName: string;
  museumImage?: string;
  description?: string;
  pieces: MuseumPieceDto[];
  candidates: MuseumCandidateDto[];
  estimatedValue: number;
}

export interface MarketBuildingStateDto {
  id: string;
  owned: boolean;
  level: number;
  maxLevel: number;
  upgradeCost?: number | null;
  canPurchase?: boolean;
  canUpgrade?: boolean;
  lockReason?: string | null;
}

export interface MarketItemDto {
  id: string;
  name: string;
  emoji?: string;
  rarity?: string;
  rarityId?: string;
  description?: string;
  buyPrice: number;
  sellPrice: number;
  ownedQuantity: number;
  category?: string;
  levelRequired?: number | null;
  slot?: string | null;
  slotLabel?: string | null;
  stats?: Partial<{
    hp: number;
    attack: number;
    defense: number;
    crit: number;
    dodge: number;
    luck: number;
  }> | null;
  effects?: string[];
  element?: string | null;
  family?: string | null;
  marketLevelRequired?: number;
  workshop?: string | null;
  workshopLabel?: string | null;
}

export interface MarketSnapshot {
  stage: number;
  cookies: number;
  rpgInventoryCount: number;
  nextUnlockableBuildingId?: string | null;
  buildings: MarketBuildingStateDto[];
  shops: Record<string, MarketItemDto[]>;
}

export interface LeaderboardEntryDto {
  userId: string;
  displayName: string;
  level: number;
  avatarUrl?: string | null;
  isHime?: boolean;
}

export interface LeaderboardSnapshot {
  entries: LeaderboardEntryDto[];
  currentUser?: LeaderboardEntryDto | null;
}
