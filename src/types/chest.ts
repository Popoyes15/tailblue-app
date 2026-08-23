// TAILBLUE_CHESTS_DESKTOP_V4_20260822

export type ChestBonusesDto = {
  costReduced: boolean;
  cookieBonusPercent: number;
  refundChancePercent: number;
  mimicProtectionPercent: number;
};

export type ChestSnapshotDto = {
  isHime: boolean;
  cookies: number;
  cost: number;
  openedToday: number;
  dailyLimit: number | null;
  remainingToday: number | null;
  totalOpened: number;
  canOpen: boolean;
  blockedReason: string | null;
  ko: boolean;
  koText: string;
  bonuses: ChestBonusesDto;
};

export type ChestRewardDto = {
  type: "cookies" | "xp" | "item";
  raw: string;
  display: string;
  cookies: number;
  xp: number;
  itemName: string | null;
  rarity: string | null;
  value: number | null;
  description: string | null;
  gif: string | null;
  rarityLine: string | null;
};

export type ChestMimicDto = {
  gif: string | null;
  lines: string[];
  koMinutes: number;
  compensationCookies: number;
  swallowedCount: number | null;
};

export type ChestCompanionLevelUpDto = {
  petId: string;
  name: string;
  level: number;
  title: string;
};

export type ChestOmenTier =
  | "common"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic"
  | "royal";

export type ChestOmenDto = {
  tier: ChestOmenTier;
  intensity: number;
  line: string;
};

export type ChestPresentationDto = {
  origin: "royal" | "kingdom" | string;
  omen: ChestOmenDto;
  revealForm: "sigil" | "orb" | string;
};

export type ChestMysteryEventDto = {
  eventId: string;
  kind: "rune_sequence";
  sequence: string[];
  options: string[];
  expiresIn: number;
  intro: string;
  hint: string;
};

export type ChestMysteryResolveDto = {
  success: boolean;
  bonusCookies: number;
  message: string;
  snapshot: ChestSnapshotDto;
};

export type ChestBonusRarity = "normal" | "rare" | "legendary";

export type ChestBonusRewardDto = {
  kind: "material" | "cookies";
  itemId: string | null;
  display: string;
  amount: number;
  rarity: ChestBonusRarity;
};

export type ChestBonusCardStubDto = {
  cardId: string;
};

export type ChestBonusCardEventDto = {
  eventId: string;
  kind: "card_draft";
  cards: ChestBonusCardStubDto[];
  picks: number;
  expiresIn: number;
  intro: string;
  hint: string;
};

export type ChestBonusScratchEventDto = {
  eventId: string;
  kind: "scratch";
  expiresIn: number;
  intro: string;
  hint: string;
};

export type ChestBonusEventDto = ChestBonusCardEventDto | ChestBonusScratchEventDto;

export type ChestBonusCardRevealDto = {
  cardId: string;
  reward: ChestBonusRewardDto;
  picksRemaining: number;
  complete: boolean;
  snapshot: ChestSnapshotDto;
};

export type ChestBonusScratchClaimDto = {
  reward: ChestBonusRewardDto;
  message: string;
  snapshot: ChestSnapshotDto;
};

export type ChestOpenResultDto = {
  kind: "reward" | "mimic";
  presentation?: ChestPresentationDto;
  mysteryEvent?: ChestMysteryEventDto | null;
  bonusEvent?: ChestBonusEventDto | null;
  isHime: boolean;
  introLines: string[];
  mimicProtected: boolean;
  protectionLines: string[];
  mimic: ChestMimicDto | null;
  reward: ChestRewardDto | null;
  bonusLines: string[];
  companionLevelUps: ChestCompanionLevelUpDto[];
  achievementMessages: string[];
  royalFlavor?: string | null;
  snapshot: ChestSnapshotDto;
};
