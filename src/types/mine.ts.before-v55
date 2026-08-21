export type MineResult = {
  success: boolean;
  title: string;
  message: string;
  emoji: string;
  items: Record<string, number>;
  cookies: number;
  miningXp: number;
  playerXp: number;
  damage: number;
  healing: number;
  metadata?: Record<string, unknown>;
};

export type MinePlayer = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  pickaxeTier: number;
  miningLevel: number;
  miningXp: number;
  statusEffects: string[];
};

export type MineRoom = {
  id: string;
  name: string;
  description: string;
  type: string;
  state: string;
  x: number;
  y: number;
  hostile: boolean;
  monsters: Array<{ encounterId: string; name: string; boss: boolean }>;
  hasOre: boolean;
  hasChests: boolean;
  hasEvent: boolean;
  secret: boolean;
  defeatedMonsters: Array<{
    encounterId: string;
    monsterId: string;
    name: string;
    family: string;
    boss: boolean;
    level: number;
    combatSummary?: MineCombatSummary | null;
  }>;
};

export type MineExit = {
  direction: string;
  label: string;
  arrow: string;
  roomId: string;
  known: boolean;
  roomName?: string | null;
  roomType?: string | null;
  cleared: boolean;
};


export type MineMapNode = {
  id: string;
  x: number;
  y: number;
  current: boolean;
  known: boolean;
  cleared: boolean;
  name?: string | null;
  roomType?: string | null;
};

export type MineMapLink = {
  from: string;
  to: string;
  direction: string;
  currentExit: boolean;
};

export type MineMap = {
  nodes: MineMapNode[];
  links: MineMapLink[];
};


export type MineCombatSummary = {
  outcome: string;
  turns: number;
  damageDealt: number;
  damageTaken: number;
  companionDamageDealt: number;
  companionDamageTaken: number;
  criticalHits: number;
  basicAttacks: number;
  defends: number;
  skillsUsed: string[];
  itemsUsed: string[];
  finalHp: number;
  finalMaxHp: number;
  finalCompanionHp?: number | null;
  finalCompanionMaxHp?: number | null;
  highlights: string[];
};

export type MineJournalEntry = {
  id: string;
  kind: string;
  icon: string;
  title: string;
  message: string;
  at: string;
  metadata?: Record<string, unknown>;
};

export type MinePotion = {
  id: string;
  name: string;
  emoji?: string;
  quantity: number;
  description: string;
  heal: number;
  mineEnergy: number;
  combatEnergy: number;
  removeStatuses: string[];
  usable: boolean;
};

export type MinePetAbility = {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  unlockLevel: number;
};

export type MinePetFood = {
  id: string;
  name: string;
  emoji?: string;
  quantity: number;
  heal: number;
  energy: number;
  preference?: string | null;
};

export type MineCompanion = {
  id: string;
  name: string;
  emoji?: string;
  image?: string | null;
  role?: string | null;
  level: number;
  trust: number;
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  attack: number;
  defense: number;
  speed: number;
  crit: number;
  dodge: number;
  abilities: MinePetAbility[];
  availableFoods?: MinePetFood[];
  canPet?: boolean;
};

export type CombatEvent = {
  type: string;
  text: string;
  actorId?: string | null;
  targetId?: string | null;
  amount: number;
  critical: boolean;
  intensity: string;
  animation?: string | null;
  visualTarget?: "player" | "enemy" | "companion" | null;
};

export type Combatant = {
  id: string;
  name: string;
  image?: string | null;
  emoji?: string;
  race?: string;
  monsterId?: string;
  family?: string;
  boss?: boolean;
  level?: number;
  hp: number;
  maxHp: number;
  energy?: number;
  maxEnergy?: number;
  statuses: string[];
};

export type CombatSkill = {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  cooldown: number;
  disabledReason?: string | null;
  element?: string;
};

export type CombatItem = {
  id: string;
  name: string;
  quantity: number;
  description: string;
  usable: boolean;
};

export type MineCombat = {
  active: boolean;
  locked: boolean;
  turn: number;
  outcome: string;
  canFlee: boolean;
  player: Combatant;
  enemy: Combatant;
  companion?: MineCompanion | null;
  skills: CombatSkill[];
  items: CombatItem[];
  events: CombatEvent[];
  log: string[];
  rewards?: { xp: number; combatXp: number; cookies: number } | null;
};

export type MineSnapshot = {
  version: number;
  active: boolean;
  floor: number;
  highestFloor: number;
  maxFloor: number;
  player: MinePlayer;
  room?: MineRoom | null;
  exits: MineExit[];
  map: MineMap;
  allowedActions: string[];
  potions: MinePotion[];
  companionChoices: MineCompanion[];
  companion?: MineCompanion | null;
  combat?: MineCombat | null;
  combatResolution?: MineCombat | null;
  journal: MineJournalEntry[];
  result?: MineResult | null;
};
