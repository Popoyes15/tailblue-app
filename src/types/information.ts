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

export type UpdateImportance = "info" | "standard" | "important" | "urgent" | "success";

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
  error?: string;
};

export type RoadmapStatus = "done" | "current" | "next" | "later" | "paused";

export type RoadmapItem = {
  id: string;
  status: RoadmapStatus;
  title: string;
  description: string;
  area?: string;
  progress?: number;
  target?: string;
};

export type RoadmapSnapshot = {
  items: RoadmapItem[];
  connected: boolean;
  mode: "api" | "preview" | "offline";
  updatedAt?: string;
  error?: string;
};
