import type {
  HimeDashboard,
  HimeEconomySnapshot,
  HimeErrorsSnapshot,
  HimeIdeasSnapshot,
  HimeLogsSnapshot,
  HimePlayersSnapshot,
  HimeSecuritySnapshot,
  HimeStatsSnapshot,
  HimeSystemSnapshot,
} from "../types/hime";

const now = new Date().toISOString();

export const previewIdeas: HimeIdeasSnapshot = {
  generatedAt: now,
  ideas: [
    {
      id: "preview-001",
      authorId: "preview-user-1",
      authorName: "Aventurier démo",
      title: "APERÇU — Idée Coup de cœur royal",
      description:
        "Cette entrée sert uniquement à montrer la future gestion ShowIdées avant la connexion au vrai module idee.py.",
      createdAt: now,
      status: "review",
      priority: "high",
      featured: true,
      royalSpotlight: true,
      adminNote: "Exemple de note privée Hime.",
      targetVersion: "vNext",
      tags: ["communauté", "interface"],
      rewardState: "none",
      announcementState: "none",
      history: [
        { id: "h1", at: now, text: "Idée reçue dans le registre royal." },
        { id: "h2", at: now, text: "Nomination comme Coup de cœur royal." },
      ],
    },
    {
      id: "preview-002",
      authorId: "preview-user-2",
      authorName: "Joueuse démo",
      title: "APERÇU — Idée en cours",
      description:
        "Permet de visualiser le statut En cours, la priorité royale et la version cible.",
      createdAt: now,
      status: "in_progress",
      priority: "royal",
      featured: true,
      royalSpotlight: false,
      adminNote: "",
      targetVersion: "1.2.0",
      tags: ["rpg"],
      rewardState: "pending",
      announcementState: "none",
    },
    {
      id: "preview-003",
      authorId: "preview-user-3",
      authorName: "Aventurier démo",
      title: "APERÇU — Idée implémentée",
      description:
        "Exemple d'une idée devenue réelle avec trophée royal et brouillon Nouveautés.",
      createdAt: now,
      status: "implemented",
      priority: "normal",
      featured: false,
      royalSpotlight: false,
      adminNote: "",
      targetVersion: "1.1.0",
      tags: ["qualité-de-vie"],
      rewardState: "awarded",
      trophyName: "🏆 Trophée royal — Idée devenue réelle",
      trophyAwardedAt: now,
      announcementState: "draft",
    },
    {
      id: "preview-004",
      authorId: "preview-user-4",
      authorName: "Joueuse démo",
      title: "APERÇU — Idée archivée",
      description:
        "Montre la différence entre archiver une idée et la supprimer définitivement.",
      createdAt: now,
      status: "archived",
      priority: "low",
      featured: false,
      royalSpotlight: false,
      tags: [],
      rewardState: "none",
      announcementState: "none",
    },
  ],
};

export const previewDashboard: HimeDashboard = {
  generatedAt: now,
  totalCommandsToday: null,
  activePlayersToday: null,
  pendingIdeas: 0,
  unresolvedErrors: 0,
  services: [],
  spotlightIdea: null,
  lastError: null,
  lastBackupAt: null,
};

export const previewStats: HimeStatsSnapshot = {
  period: "week",
  periodLabel: "APERÇU LOCAL",
  totalCommands: 0,
  uniqueUsers: 0,
  avgPerDay: 0,
  avgPerUser: 0,
  avgPerActiveUserDay: 0,
  daily: [],
  topCommands: [],
  topUsers: [],
};

export const previewLogs: HimeLogsSnapshot = {
  generatedAt: now,
  sources: [],
  logs: [],
};

export const previewErrors: HimeErrorsSnapshot = {
  generatedAt: now,
  errors: [],
};

export const previewSecurity: HimeSecuritySnapshot = {
  generatedAt: now,
  authenticated: false,
  authorizedAsHime: false,
  identityName: null,
  identityAvatar: null,
  sessionExpiresAt: null,
  officialGuildId: null,
  auditEnabled: false,
  guilds: [],
};

export const previewPlayers: HimePlayersSnapshot = {
  generatedAt: now,
  players: [],
};

export const previewEconomy: HimeEconomySnapshot = {
  generatedAt: now,
  totalCookies: null,
  averageCookies: null,
  medianCookies: null,
  richest: [],
  guildTreasuryTotal: null,
  marketStage: null,
  taxes: null,
  grogne: null,
  sourceTotals: null,
  sinkTotals: null,
};

export const previewSystem: HimeSystemSnapshot = {
  generatedAt: now,
  services: previewDashboard.services,
  uptimeSeconds: null,
  botLatencyMs: null,
  ramMb: null,
  diskFreeMb: null,
  pythonVersion: null,
  discordPyVersion: null,
  botVersion: null,
  apiVersion: null,
  guildCount: null,
  playerCount: null,
  lastBackupAt: null,
  backups: [],
};
