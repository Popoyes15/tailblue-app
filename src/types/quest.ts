export type QuestDifficulty = "facile" | "moyenne" | "difficile";

export type QuestEvent =
  | "calin"
  | "cookie"
  | "patpat"
  | "daily"
  | "work"
  | "hunt"
  | "guildwork"
  | "mine_enter"
  | "mine_search"
  | "mine_ore"
  | "mine_potion"
  | "mine_monster"
  | "mine_chest"
  | "mine_rest"
  | "mine_descend"
  | string;

export interface QuestDefinitionDto {
  id: string;
  name: string;
  description: string;
  event: QuestEvent;
  objective: number;
  difficulty: QuestDifficulty;
  rewardCookies: number;
  rewardXp: number;
}

export interface ActiveQuestDto {
  quest: QuestDefinitionDto;
  progress: number;
  claimed: boolean;
  selectedAt: string;
  expiresAt: string;
  completedAt?: string | null;
  completionNotifiedAt?: string | null;
}

export interface QuestBoardSnapshotDto {
  serverNow?: string | null;

  offers: QuestDefinitionDto[];
  offersCreatedAt?: string | null;
  offersExpiresAt?: string | null;

  activeQuest: ActiveQuestDto | null;

  /**
   * Le backend est la seule autorité sur ce bonus.
   * Le front l'affiche uniquement si l'API le renvoie.
   */
  royalCatBonusXp?: number;
}

export interface QuestClaimResultDto {
  cookies: number;
  xp: number;
  royalCatBonusXp?: number;
  snapshot: QuestBoardSnapshotDto;
}

export interface QuestAcceptRequest {
  questId: string;
}
