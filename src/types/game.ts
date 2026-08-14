export type Rarity =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "unique";

export type House = {
  id: string;
  name: string;
  level: number;
  image: string;
  description?: string;

  ownerId?: string;

  storage?: number;
  comfort?: number;
  decorations?: number;

  isActive?: boolean;
};

export type Pet = {
  id: string;
  name: string;
  species: string;

  level: number;
  affection: number;

  damage?: number;

  image: string;

  rarity?: Rarity;

  isActive?: boolean;
};

export type Quest = {
  id: string;

  name: string;
  description: string;

  source:
    | "world"
    | "mine"
    | "hunt"
    | "work"
    | "pet"
    | "house"
    | "event";

  status:
    | "available"
    | "active"
    | "completed";

  progress?: number;
  goal?: number;
};

export type InventoryItem = {
  id: string;

  name: string;
  image: string;

  quantity: number;

  rarity?: Rarity;

  category:
    | "weapon"
    | "armor"
    | "mineral"
    | "fish"
    | "resource"
    | "food"
    | "quest"
    | "other";
};

export type Player = {
  discordId: string;

  username: string;
  displayName: string;

  level: number;
  xp: number;

  gold: number;

  rank: string | null;
  reputation: number;

  health: number;
  maxHealth: number;

  energy: number;
  maxEnergy: number;

  pets: Pet[];

  houses: House[];

  quests: Quest[];

  inventory: InventoryItem[];

  activePetId?: string;
  activeHouseId?: string;
};