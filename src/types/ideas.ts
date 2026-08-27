// TAILBLUE_IDEAS_DESKTOP_V1A_20260827
// TAILBLUE_IDEAS_DESKTOP_V1B_20260827

export type IdeaStatus =
  | "proposee"
  | "en_cours"
  | "implementee"
  | "supprimee";

export type IdeaVote = -1 | 0 | 1;

export interface IdeaCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

export interface RoyalLetter {
  number: number;
  createdAt?: string | null;
  closing: string;
  acknowledgement?: string | null;
  adventurerName?: string | null;
  fullText?: string | null;
  domain?: IdeaCategory | null;
}

export interface IdeaRewards {
  cookies: number;
  xp: number;
  item?: string | null;
  implementationNumber?: number | null;
}

export interface KingdomIdea {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  signature: string;
  category: IdeaCategory;
  status: IdeaStatus;
  createdAt?: string | null;
  editedAt?: string | null;
  inProgressAt?: string | null;
  implementedAt?: string | null;
  deletedAt?: string | null;
  isPublic: boolean;
  pinned: boolean;
  publicAt?: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  viewerVote: IdeaVote;
  canEdit: boolean;
  canDelete: boolean;
  rewards: IdeaRewards;
  trophyItemName?: string | null;
  royalLetter?: RoyalLetter | null;
  history?: Array<{
    at?: string | null;
    action?: string | null;
    actor_id?: string | number | null;
  }>;
}

export interface IdeasSnapshot {
  generatedAt: string;
  viewer: {
    id: string;
    isHime: boolean;
  };
  categories: IdeaCategory[];
  community: KingdomIdea[];
  myIdeas: KingdomIdea[];
  archives: KingdomIdea[];
}

export interface HimeIdeasSnapshot {
  generatedAt: string;
  ideas: KingdomIdea[];
}

export interface IdeaDraft {
  title: string;
  description: string;
  category: string;
  signature: string;
}

export type HimeIdeaAction =
  | "in_progress"
  | "implemented"
  | "delete";
