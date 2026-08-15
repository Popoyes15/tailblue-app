export type InventoryMode = "api" | "preview";

export type ItemType =
  | "material"
  | "equipment"
  | "consumable"
  | "plan"
  | "quest"
  | "relic";

export type ItemRarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export type EquipmentSlot =
  | "weapon"
  | "helmet"
  | "chest"
  | "gloves"
  | "leggings"
  | "boots"
  | "ring"
  | "amulet";

export type ItemStats = Partial<{
  hp: number;
  attack: number;
  defense: number;
  crit: number;
  dodge: number;
  luck: number;
}>;

export type InventoryItemDto = {
  id: string;
  name: string;
  emoji: string;
  type: ItemType;
  rarity: ItemRarity;
  rarityLabel: string;
  quantity: number;
  description: string;
  lore?: string | null;
  imageUrl?: string | null;
  element?: string | null;
  slot?: EquipmentSlot | null;
  slotLabel?: string | null;
  levelRequired?: number | null;
  stats?: ItemStats | null;
  effects?: string[];
  family?: string | null;
  tags?: string[];
  stackable?: boolean;
};

export type EquipmentSlotDto = {
  slot: EquipmentSlot;
  label: string;
  emoji: string;
  equippedItemId?: string | null;
  equippedItem?: InventoryItemDto | null;
  ownedChoices: InventoryItemDto[];
};

export type EquipmentSnapshotDto = {
  slots: EquipmentSlotDto[];
  activeStats: Required<ItemStats>;
  baseStats: Required<ItemStats>;
  affinityText?: string | null;
  playerLevel: number;
};

export type CraftMaterialDto = {
  id: string;
  name: string;
  emoji: string;
  required: number;
  owned: number;
  enough: boolean;
  sourceText?: string | null;
};

export type CraftRecipeSummaryDto = {
  id: string;
  known: boolean;
  hidden: boolean;
  name: string;
  emoji: string;
  rarity: ItemRarity;
  rarityLabel: string;
  categoryId: string;
  subcategoryId: string;
  workshop: string;
  workshopLabel: string;
  workshopLevel: number;
  activeWorkshopLevel: number;
  craftable: boolean;
  maxQuantity: number;
  missingCount: number;
  outputQuantity: number;
  raceFitText?: string | null;
  imageUrl?: string | null;
};

export type CraftRecipeDetailDto = CraftRecipeSummaryDto & {
  description?: string | null;
  lore?: string | null;
  materials: CraftMaterialDto[];
  goldCost: number;
  ownedCookies: number;
  requiredPlan?: string | null;
  requiredPlanName?: string | null;
  itemType: ItemType;
  slot?: EquipmentSlot | null;
  stats?: ItemStats | null;
  effects?: string[];
};

export type CraftCategoryDto = {
  id: string;
  name: string;
  emoji: string;
  description: string;
};

export type CraftSubcategoryDto = {
  id: string;
  name: string;
  emoji: string;
  description: string;
};

export type CraftFilterDto = {
  id: string;
  name: string;
  emoji: string;
};

export type CraftFavoriteDto = {
  itemId: string;
  name: string;
  emoji: string;
  quantity: number;
};

export type CraftSnapshotDto = {
  cookies: number;
  knownRecipes: number;
  totalRecipes: number;
  craftableRecipes: number;
  totalCrafted: number;
  categories: CraftCategoryDto[];
  subcategoriesByCategory: Record<string, CraftSubcategoryDto[]>;
  filters: CraftFilterDto[];
  recipes: CraftRecipeSummaryDto[];
  favorites: CraftFavoriteDto[];
  newDiscoveries: string[];
};

export type InventorySnapshotDto = {
  generatedAt: string;
  mode: InventoryMode;
  items: InventoryItemDto[];
  equipment: EquipmentSnapshotDto;
  craft: CraftSnapshotDto;
};

export type EquipResultDto = {
  snapshot: InventorySnapshotDto;
  message: string;
};

export type CraftResultDto = {
  snapshot: InventorySnapshotDto;
  produced: number;
  producedItemId: string;
  producedItemName: string;
  newDiscoveries: string[];
  message: string;
};
