export type ActivityKind = "work" | "hunt";

export type ActivityPayer = "guild" | "independent" | "unknown";

export interface ActivityChoiceDto {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
}

export interface ActivityEventDto {
  id: string;
  title: string;
  description: string;
  choices: ActivityChoiceDto[];
}

export interface ActivityLootDto {
  id?: string;
  name: string;
  quantity: number;
  rarity?: string;
  description?: string;
}

export interface ActivityPetDto {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  level?: number;
}

export interface ActivityBonusDto {
  id: string;
  label: string;
  value?: string;
  description?: string;
  icon?: string;
}

export interface ActivityResultDto {
  success: boolean;
  title: string;
  narrative: string;
  cookies: number;
  xp: number;
  reputation: number;
  loot?: ActivityLootDto[];
  bonuses?: ActivityBonusDto[];
  companionLevelUps?: {
    petId: string;
    petName: string;
    level: number;
    rank?: string;
  }[];
  eggProgress?: {
    current: number;
    target: number;
  };
}

export interface ActivitySnapshotDto {
  activity: ActivityKind;

  ready: boolean;
  cooldownMinutes: number;
  cooldownRemainingSeconds: number;

  totalEvents: number;

  job?: {
    id: string;
    name: string;
    emoji: string;
    requiredLevel: number;
    cookiesMin?: number;
    cookiesMax?: number;
    xpMin?: number;
    xpMax?: number;
  };

  guild?: {
    name?: string;
    payer: ActivityPayer;
    cost: number;
    treasury?: number;
  };

  activePets?: ActivityPetDto[];
  bonuses?: ActivityBonusDto[];

  stats?: {
    count?: number;
    cookies?: number;
    xp?: number;
    failures?: number;
  };

  eggProgress?: {
    current: number;
    target: number;
  };

  currentEvent?: ActivityEventDto | null;
  lastResult?: ActivityResultDto | null;
}

export interface ActivityApiError {
  message: string;
  status?: number;
}
