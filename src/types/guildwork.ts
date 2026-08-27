// TAILBLUE_GUILDWORK_DESKTOP_V1_20260826

export type GuildworkRewardRange = {
  min: number;
  max: number;
};

export type GuildworkSnapshot = {
  guildName: string;
  guildLevel: number;
  guildXp: number;
  guildXpNeeded: number;
  treasury: number;
  memberCount: number;

  cost: number;
  cooldownSeconds: number;

  lastAt?: string | null;
  readyAt?: string | null;
  remainingSeconds: number;

  available: boolean;
  blockedCode?: string | null;
  blockedReason?: string | null;

  rewardRanges: {
    playerPool: GuildworkRewardRange;
    perMember: GuildworkRewardRange;
    treasury: GuildworkRewardRange;
    guildXp: GuildworkRewardRange;
  };
};

export type GuildworkResult = {
  guildName: string;
  cost: number;
  rewardPool: number;
  rewardPerMember: number;
  memberCount: number;
  treasuryGain: number;
  guildXpGain: number;
  levelBefore: number;
  levelAfter: number;
  levelUp: boolean;
  questUpdates: number;
  companionEvents: Array<Record<string, unknown>>;
  taigaNote?: string | null;
  snapshot: GuildworkSnapshot;
};

export type GuildworkRunResponse = {
  ok: true;
  result: GuildworkResult;
};
