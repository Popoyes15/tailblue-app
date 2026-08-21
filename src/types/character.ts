export type CharacterMode = "api" | "preview";

export type CharacterDetailKind =
  | "race"
  | "job"
  | "guild"
  | "residence"
  | "companion"
  | "rank"
  | "equipment";

export type CharacterStatBlock = {
  hp: number;
  attack: number;
  defense: number;
  crit: number;
  dodge: number;
  luck: number;
  combatLevel?: number | null;
  combatXpTotal?: number | null;
  combatXpCurrent?: number | null;
  combatXpNeeded?: number | null;
  combatXpToNext?: number | null;
  miningLevel?: number | null;
  miningXpTotal?: number | null;
  miningXpCurrent?: number | null;
  miningXpNeeded?: number | null;
  miningXpToNext?: number | null;
  pickaxeTier?: number | null;
  pickaxeNextTier?: number | null;
  pickaxeNextTierLevel?: number | null;
  combatEnergy?: number | null;
  combatEnergyMax?: number | null;
};

export type CharacterProfile = {
  discordId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  title: string;
  isHime: boolean;

  level: number;
  xpTotal: number;
  xpCurrent: number;
  xpNeeded: number;

  adventurerRank?: string | null;
  adventurerScore?: number | null;
};

export type CharacterIdentitySummary = {
  kind: CharacterDetailKind;
  icon: string;
  label: string;
  value: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  available: boolean;
  previewOnly?: boolean;
};

export type CharacterActivity = {
  cookies: number;
  hugsGiven: number;
  hugsReceived: number;
  chestsOpened: number;
  works: number;
  hunts: number;
  reputation: number;
  successes: number;
  museumPieces: number;
};

export type CharacterLife = {
  kingdomRank: string;
  reputationRank: string;
  relationship: string;
  marriage: string;
  petsOwned: number;
  petsActive: number;
  petCapacity: string;
  successesTotal: number;
};

export type CharacterSnapshot = {
  generatedAt: string;
  mode: CharacterMode;
  profile: CharacterProfile;
  combat: CharacterStatBlock;
  activity: CharacterActivity;
  life?: CharacterLife;
  identity: CharacterIdentitySummary[];
};

export type CharacterRaceSkill = {
  id: string;
  name: string;
  description: string;
  unlockLevel: number;
  summary?: string | null;
  element?: string | null;
  learned: boolean;
};

export type CharacterRaceDetail = {
  kind: "race";
  id: string;
  name: string;
  emoji: string;
  imageUrl?: string | null;
  description: string;
  archetype: string;
  elements: string[];
  preferredWeapons: string[];
  statBonuses: Record<string, number>;

  combatLevel?: number | null;
  combatXpTotal?: number | null;
  combatXpCurrent?: number | null;
  combatXpNeeded?: number | null;
  combatXpToNext?: number | null;
  unlockedSkills: CharacterRaceSkill[];
  nextSkillLevel?: number | null;

  /* Lore canonique sérialisé par le backend TailBlue. */
  origin?: string | null;
  territory?: string | null;
  society?: string | null;
  reputation?: string | null;
  relations?: string | null;
  history?: string | null;

  exclusive?: boolean;
  previewOnly?: boolean;
};

export type CharacterJobDetail = {
  kind: "job";
  id: string;
  name: string;
  emoji?: string | null;
  imageUrl?: string | null;
  requiredLevel: number;
  description?: string | null;
  specialty?: string | null;
  quote?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryLabel?: string | null;
  previewOnly?: boolean;
};

export type CharacterGuildMember = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  founder?: boolean;
};

export type CharacterGuildHall = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  level?: number | null;
  xp?: number | null;
};

export type CharacterGuildDetail = {
  kind: "guild";
  id?: string | null;
  name: string;
  imageUrl?: string | null;
  founderId?: string | null;
  founderName?: string | null;
  level: number;
  xp: number;
  xpNeeded: number;
  treasure: number;
  maxMembers: number;
  members: CharacterGuildMember[];
  hall?: CharacterGuildHall | null;
  activities: string[];
  previewOnly?: boolean;
};

export type CharacterResidenceEffect = {
  label: string;
  value: string;
};

export type CharacterResidenceDetail = {
  kind: "residence";
  id: string;
  name: string;
  imageUrl?: string | null;
  description?: string | null;
  price?: number | null;
  effects: CharacterResidenceEffect[];
  previewOnly?: boolean;
};

export type CharacterCompanionDetail = {
  kind: "companion";
  id: string;
  displayName: string;
  speciesName?: string | null;
  imageUrl?: string | null;
  emoji?: string | null;
  level: number;
  affection: number;
  relation?: string | null;
  story?: string | null;
  stats?: Record<string, number>;
  abilities?: string[];
  previewOnly?: boolean;
};

export type CharacterRankFactor = {
  label: string;
  value: string;
};

export type CharacterRankDetail = {
  kind: "rank";
  rank?: string | null;
  score?: number | null;
  ladder: string[];
  explanation: string;
  factors?: CharacterRankFactor[];
  previewOnly?: boolean;
};

export type CharacterEquipmentSlot = {
  slot: string;
  icon: string;
  label: string;
  itemId?: string | null;
  itemName?: string | null;
  imageUrl?: string | null;
};

export type CharacterEquipmentDetail = {
  kind: "equipment";
  equipped: CharacterEquipmentSlot[];
  ownedEquipmentCount: number;
  affinityText?: string | null;
  activeStats: CharacterStatBlock;
  previewOnly?: boolean;
};

export type CharacterDetail =
  | CharacterRaceDetail
  | CharacterJobDetail
  | CharacterGuildDetail
  | CharacterResidenceDetail
  | CharacterCompanionDetail
  | CharacterRankDetail
  | CharacterEquipmentDetail;
