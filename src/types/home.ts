export type HomeNotificationLevel =
  | "info"
  | "standard"
  | "success"
  | "important"
  | "urgent";

export type HomeNotification = {
  id: string;
  icon: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  level: HomeNotificationLevel;
  targetPage?: string | null;
};

export type HomeActivity = {
  id: string;
  icon: string;
  title: string;
  detail: string;
  createdAt: string;
  targetPage?: string | null;
};

export type HomeCompanion = {
  id: string;
  displayName: string;
  speciesName?: string | null;
  imageUrl?: string | null;
  emoji?: string | null;
  level: number;
  affection: number;
  damage?: number | null;
};

export type HomeProfile = {
  id?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  isHime: boolean;

  xpTotal: number;
  level: number;
  xpCurrent: number;
  xpNeeded: number;

  cookies: number;

  adventurerRank?: string | null;
  adventurerScore?: number | null;
};

export type HomeQuestSummary = {
  available: number;
  activeId?: string | null;
  activeName?: string | null;
  completed?: boolean;
};

export type HomeHimeSummary = {
  ideas: number;
  errors: number;
};

export type HomeSnapshot = {
  generatedAt: string;
  mode: "api" | "preview";

  profile: HomeProfile;

  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;

  quests: HomeQuestSummary;
  companion?: HomeCompanion | null;

  recentActivity: HomeActivity[];
  notifications: HomeNotification[];

  hime?: HomeHimeSummary | null;
};
