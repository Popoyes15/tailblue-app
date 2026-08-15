export type HimeSection =
  | "Bilan général"
  | "Statistiques"
  | "ShowIdées"
  | "Logs"
  | "Erreurs"
  | "Sécurité"
  | "Joueurs"
  | "Économie"
  | "État du système";

export type IdeaStatus =
  | "submitted"
  | "review"
  | "accepted"
  | "in_progress"
  | "implemented"
  | "declined"
  | "archived";

export type IdeaPriority = "low" | "normal" | "high" | "royal";
export type IdeaRewardState = "none" | "pending" | "awarded";

export interface IdeaHistoryEntry {
  id: string;
  at: string;
  text: string;
  kind?: string;
}

export interface HimeIdea {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string | null;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string | null;
  status: IdeaStatus;
  priority: IdeaPriority;
  featured: boolean;
  royalSpotlight: boolean;
  adminNote?: string;
  targetVersion?: string;
  tags: string[];
  rewardState: IdeaRewardState;
  trophyName?: string | null;
  trophyAwardedAt?: string | null;
  announcementState?: "none" | "draft" | "published";
  history?: IdeaHistoryEntry[];
}

export type HimeIdeaPatch = Partial<
  Pick<
    HimeIdea,
    | "status"
    | "priority"
    | "featured"
    | "royalSpotlight"
    | "adminNote"
    | "targetVersion"
    | "tags"
  >
>;

export interface HimeIdeasSnapshot {
  generatedAt: string;
  ideas: HimeIdea[];
}

export interface HimeNamedCount {
  id?: string;
  name: string;
  count: number;
  avatar?: string | null;
}

export interface HimeStatsSnapshot {
  period: "today" | "week" | "month";
  periodLabel: string;
  totalCommands: number;
  uniqueUsers: number;
  avgPerDay: number;
  avgPerUser: number;
  avgPerActiveUserDay: number;
  daily: Array<{ date: string; total: number; users: number }>;
  topCommands: HimeNamedCount[];
  topUsers: HimeNamedCount[];
}

export type ServiceState = "online" | "warning" | "offline" | "unknown";

export interface HimeService {
  id: string;
  name: string;
  state: ServiceState;
  detail: string;
  latencyMs?: number | null;
}

export interface HimeError {
  id: string;
  at: string;
  severity: "warning" | "error" | "critical";
  state: "open" | "resolved" | "ignored";
  source: string;
  message: string;
  traceback?: string;
  occurrences: number;
  lastOccurrenceAt?: string | null;
  command?: string | null;
  userId?: string | null;
}

export interface HimeDashboard {
  generatedAt: string;
  totalCommandsToday: number | null;
  activePlayersToday: number | null;
  pendingIdeas: number;
  unresolvedErrors: number;
  services: HimeService[];
  spotlightIdea?: HimeIdea | null;
  lastError?: HimeError | null;
  lastBackupAt?: string | null;
}

export interface HimeLog {
  id: string;
  at: string;
  level: "debug" | "info" | "success" | "warning" | "error" | "critical";
  source: string;
  message: string;
  command?: string | null;
  userId?: string | null;
}

export interface HimeLogsSnapshot {
  generatedAt: string;
  logs: HimeLog[];
  sources: string[];
}

export interface HimeErrorsSnapshot {
  generatedAt: string;
  errors: HimeError[];
}

export interface HimeSecuritySnapshot {
  generatedAt: string;
  authenticated: boolean;
  authorizedAsHime: boolean;
  identityName?: string | null;
  identityAvatar?: string | null;
  sessionExpiresAt?: string | null;
  officialGuildId?: string | null;
  auditEnabled: boolean;
  guilds: Array<{
    id: string;
    name: string;
    official: boolean;
    memberCount?: number | null;
    ownerId?: string | null;
    ownerName?: string | null;
  }>;
}

export interface HimePlayerSummary {
  id: string;
  name: string;
  avatar?: string | null;
  level?: number | null;
  rank?: string | null;
  cookies?: number | null;
  xp?: number | null;
  reputation?: number | null;
  guild?: string | null;
  house?: string | null;
  job?: string | null;
}

export interface HimePlayerDetail extends HimePlayerSummary {
  inventoryCount?: number | null;
  museumCount?: number | null;
  petsCount?: number | null;
  successesCount?: number | null;
  lastDaily?: string | null;
  lastWork?: string | null;
  lastHunt?: string | null;
}

export interface HimePlayersSnapshot {
  generatedAt: string;
  players: HimePlayerSummary[];
}

export type HimePlayerAction =
  | { action: "give_cookies"; amount: number }
  | { action: "give_xp"; amount: number }
  | { action: "give_reputation"; amount: number }
  | { action: "royal_gift" }
  | { action: "reset_daily" }
  | { action: "reset_work" }
  | { action: "reset_hunt" }
  | { action: "reset_coffer" };

export interface HimeEconomySnapshot {
  generatedAt: string;
  totalCookies: number | null;
  averageCookies: number | null;
  medianCookies: number | null;
  richest: Array<{
    id: string;
    name: string;
    avatar?: string | null;
    cookies: number;
  }>;
  guildTreasuryTotal?: number | null;
  marketStage?: number | null;
  taxes?: number | null;
  grogne?: number | null;
  sourceTotals?: Record<string, number> | null;
  sinkTotals?: Record<string, number> | null;
}

export interface HimeSystemSnapshot {
  generatedAt: string;
  services: HimeService[];
  uptimeSeconds?: number | null;
  botLatencyMs?: number | null;
  ramMb?: number | null;
  diskFreeMb?: number | null;
  pythonVersion?: string | null;
  discordPyVersion?: string | null;
  botVersion?: string | null;
  apiVersion?: string | null;
  guildCount?: number | null;
  playerCount?: number | null;
  lastBackupAt?: string | null;
  backups: Array<{
    id: string;
    createdAt: string;
    label?: string | null;
    sizeBytes?: number | null;
    files?: number | null;
  }>;
}

export interface HimeSidebarBadges {
  ideas: number;
  errors: number;
  total: number;
}
