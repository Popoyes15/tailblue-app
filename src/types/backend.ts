export type ApiStatus = {
  connected: boolean;
  version?: string;
  playerId?: string;
};

export type MineRoomType =
  | "entrance"
  | "empty"
  | "ore"
  | "monster"
  | "treasure"
  | "rest"
  | "event"
  | "secret"
  | "boss"
  | "exit"
  | "safe";

export type MineRoomDto = {
  id: string;
  x: number;
  y: number;
  type: MineRoomType;
  revealed: boolean;
  cleared: boolean;
  neighbors: string[];
};

export type MineInventoryItem = {
  id: string;
  name: string;
  emoji?: string;
  quantity: number;
};

export type PotionDto = {
  id: string;
  name: string;
  emoji?: string;
  quantity: number;
  description: string;
  heal?: number;
  energy?: number;
};

export type CombatSkillDto = {
  id: string;
  name: string;
  emoji?: string;
  description: string;
  energyCost: number;
  damage?: number;
  disabledReason?: string;
};

export type CombatantDto = {
  id: string;
  name: string;

  /**
   * Pour un joueur/compagnon : URL ou chemin de PP/illustration.
   * Pour un monstre : peut être absent car l'app sait résoudre
   * automatiquement l'image depuis family + boss.
   */
  image?: string;

  emoji?: string;

  /**
   * Champs de monstre provenant directement de monsters.py.
   */
  monsterId?: string;
  family?: string;
  boss?: boolean;
  level?: number;

  hp: number;
  maxHp: number;
  energy?: number;
  maxEnergy?: number;
};

export type CombatStateDto = {
  active: boolean;
  canFlee: boolean;
  player: CombatantDto;
  enemy: CombatantDto;
  companion?: CombatantDto | null;
  skills: CombatSkillDto[];
  log: string[];
};

export type MineCompanionFoodDto = {
  id: string;
  name: string;
  quantity: number;
  heal: number;
  energy: number;
  preference?: "adore" | "aime" | "neutre" | "deteste" | string;
};

export type MineSnapshotDto = {
  floor: number;
  maxFloor: number;
  depthMeters?: number;
  currentRoomId: string;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  torch: number;
  companion?: {
    id: string;
    name: string;
    emoji?: string;
    image?: string;
    hp?: number;
    maxHp?: number;
    energy?: number;
    maxEnergy?: number;
    trustLabel?: string;
    availableFoods?: MineCompanionFoodDto[];
    canPet?: boolean;
  } | null;
  rooms: MineRoomDto[];
  recentLoot: MineInventoryItem[];
  log: string[];
  potions: PotionDto[];
  combat?: CombatStateDto | null;
  allowedActions: {
    mine: boolean;
    search: boolean;
    fight: boolean;
    rest: boolean;
    potion: boolean;
    descend: boolean;
  };
};

export type MineAction =
  | { action: "move"; roomId: string }
  | { action: "mine" }
  | { action: "search" }
  | { action: "rest" }
  | { action: "descend" }
  | { action: "use_potion"; potionId: string }
  | { action: "combat_attack" }
  | { action: "combat_skill"; skillId: string }
  | { action: "combat_defend" }
  | { action: "combat_flee" }
  | { action: "pet_feed"; foodId: string }
  | { action: "pet_cuddle" };
