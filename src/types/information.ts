// TAILBLUE_INFORMATION_CMS_DESKTOP_V1_20260827

export type CommandGuide = {
  id: string;
  command: string;
  title: string;
  icon: string;
  summary: string;
  details: string;
  usage: string[];
  source: "helpme";
};

export type CommandGroup = {
  id: string;
  icon: string;
  title: string;
  description: string;
  commands: CommandGuide[];
};

export type UpdateImportance =
  | "info"
  | "standard"
  | "important"
  | "urgent"
  | "success";

export type PublicationChannels = {
  app: boolean;
  discord: boolean;
};

export type TailBlueUpdateArticle = {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  publishedAt: string;
  images: string[];
  tag: string;
  author?: string;
  importance?: UpdateImportance;
  source: "api" | "preview";
};

export type UpdateFeedSnapshot = {
  articles: TailBlueUpdateArticle[];
  connected: boolean;
  mode: "api" | "preview" | "offline";
  updatedAt?: string;
  error?: string;
};

export type RoadmapStatus =
  | "done"
  | "current"
  | "next"
  | "later"
  | "paused";

export type RoadmapChecklistItem = {
  id: string;
  text: string;
  done: boolean;
};

export type RoadmapItem = {
  id: string;
  status: RoadmapStatus;
  title: string;
  description: string;
  area?: string;
  progress?: number;
  target?: string;
  checklist?: RoadmapChecklistItem[];
};

export type RoadmapSnapshot = {
  items: RoadmapItem[];
  connected: boolean;
  mode: "api" | "preview" | "offline";
  globalProgress?: number;
  updatedAt?: string;
  error?: string;
};

export type WikiArticle = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  author?: string;
  publishedAt?: string | null;
};

export type WikiSnapshot = {
  articles: WikiArticle[];
  connected: boolean;
  mode: "api" | "preview" | "offline";
  updatedAt?: string;
  error?: string;
};

export type AdminUpdate = {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  published_at?: string | null;
  images: string[];
  tag: string;
  author?: string;
  importance: UpdateImportance;
  status: "draft" | "published" | "archived";
  channels: PublicationChannels;
  created_at?: string | null;
  updated_at?: string | null;
  discord?: {
    channel_id?: string;
    message_id?: string;
    owned_by_bot?: boolean;
  };
  imported_from_discord?: boolean;
};

export type AdminRoadmap = {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  area?: string;
  target?: string;
  progress: number;
  checklist: RoadmapChecklistItem[];
  manual_progress?: number | null;
  channels: PublicationChannels;
  created_at?: string | null;
  updated_at?: string | null;
  completed_at?: string | null;
  discord?: {
    channel_id?: string;
    message_id?: string;
    owned_by_bot?: boolean;
  };
};

export type AdminWiki = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string[];
  author?: string;
  published_at?: string | null;
  status: "draft" | "published" | "archived";
  channels: PublicationChannels;
  created_at?: string | null;
  updated_at?: string | null;
  discord?: {
    channel_id?: string;
    message_id?: string;
    owned_by_bot?: boolean;
  };
};

export type InformationAdminSnapshot = {
  updatedAt?: string | null;
  settings: {
    discordChannelId?: string | null;
  };
  updates: AdminUpdate[];
  roadmap: AdminRoadmap[];
  wiki: AdminWiki[];
  stats: {
    publishedUpdates: number;
    roadmapProgress: number;
    wikiPublished: number;
  };
  importResult?: {
    imported: number;
    moved?: number;
    skipped: number;
    destination?: "updates" | "roadmap" | "wiki";
    roadmapStatus?: RoadmapStatus | null;
    sourceType?: "text" | "forum";
    channelId: string;
    channelName: string;
  };
};

export type DiscordInformationChannel = {
  id: string;
  name: string;
  mention: string;
  canReadHistory: boolean;
  canSend: boolean;
  kind?: "text" | "forum";
  suggested: boolean;
};

export type InformationKind =
  | "updates"
  | "roadmap"
  | "wiki";
