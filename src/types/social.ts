// TAILBLUE_SOCIAL_DESKTOP_V1A_20260827

export type SocialPresence = {
  status: "online" | "offline";
  lastSeen?: string | null;
};

export type SocialIdentity = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  onOfficialServer: boolean;
};

export type SocialFriend = SocialIdentity & {
  relationshipId: string;
  pinned: boolean;
  friendsSince?: string | null;
  presence: SocialPresence;
};

export type IncomingFriendRequest = {
  id: string;
  from: SocialIdentity;
  createdAt?: string | null;
};

export type OutgoingFriendRequest = {
  id: string;
  to: SocialIdentity;
  createdAt?: string | null;
};

export type SocialConversationSummary = {
  friend: SocialFriend;
  unread: number;
  lastMessage?: {
    body: string;
    createdAt?: string | null;
    mine: boolean;
  } | null;
};

export type SocialMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt?: string | null;
  readAt?: string | null;
  mine: boolean;
};

export type SocialConversation = {
  friend: SocialFriend;
  messages: SocialMessage[];
};

export type SocialSearchResult =
  SocialIdentity & {
    relationshipState:
      | "friend"
      | "incoming"
      | "outgoing"
      | null;
    presence: SocialPresence;
  };

export type ReferralMilestone = {
  count: number;
  cookies: number;
  xp: number;
  claimed: boolean;
  unlocked: boolean;
};

export type ReferralInvitee = {
  user: SocialIdentity;
  redeemedAt?: string | null;
  activityCount: number;
  requiredActivityCount: number;
  active: boolean;
};

export type ReferralSnapshot = {
  code: string;
  myInviter?: {
    user: SocialIdentity;
    redeemedAt?: string | null;
  } | null;
  activeCount: number;
  totalInvitees: number;
  invitees: ReferralInvitee[];
  milestones: ReferralMilestone[];
  newlyClaimed: number[];
  activityRequired: number;
};

export type SocialSnapshot = {
  generatedAt: string;
  friends: SocialFriend[];
  incomingRequests: IncomingFriendRequest[];
  outgoingRequests: OutgoingFriendRequest[];
  conversations: SocialConversationSummary[];
  referral: ReferralSnapshot;
};
