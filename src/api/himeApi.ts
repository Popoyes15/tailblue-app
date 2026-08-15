import type {
  HimeDashboard,
  HimeEconomySnapshot,
  HimeErrorsSnapshot,
  HimeIdeaPatch,
  HimeIdeasSnapshot,
  HimeLogsSnapshot,
  HimePlayerAction,
  HimePlayerDetail,
  HimePlayersSnapshot,
  HimeSecuritySnapshot,
  HimeSidebarBadges,
  HimeStatsSnapshot,
  HimeSystemSnapshot,
} from "../types/hime";

const API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").replace(/\/+$/, "");
export const himeApiConfigured = Boolean(API_URL);

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new Error("API TailBlue non configurée.");

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `Erreur TailBlue ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: unknown };
      if (payload.detail) detail = String(payload.detail);
    } catch {
      // réponse non JSON
    }
    throw new Error(detail);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const himeApi = {
  dashboard: () => request<HimeDashboard>("/api/hime/dashboard"),
  badges: () => request<HimeSidebarBadges>("/api/hime/badges"),
  stats: (period: "today" | "week" | "month") =>
    request<HimeStatsSnapshot>(`/api/hime/stats?period=${period}`),
  ideas: () => request<HimeIdeasSnapshot>("/api/hime/ideas"),
  patchIdea: (id: string, patch: HimeIdeaPatch) =>
    request<HimeIdeasSnapshot>(`/api/hime/ideas/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteIdea: (id: string) =>
    request<HimeIdeasSnapshot>(`/api/hime/ideas/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  awardIdeaTrophy: (id: string) =>
    request<HimeIdeasSnapshot>(
      `/api/hime/ideas/${encodeURIComponent(id)}/award-trophy`,
      { method: "POST" },
    ),
  createIdeaAnnouncement: (id: string) =>
    request<HimeIdeasSnapshot>(
      `/api/hime/ideas/${encodeURIComponent(id)}/announcement`,
      { method: "POST" },
    ),
  logs: () => request<HimeLogsSnapshot>("/api/hime/logs"),
  errors: () => request<HimeErrorsSnapshot>("/api/hime/errors"),
  patchError: (id: string, state: "open" | "resolved" | "ignored") =>
    request<HimeErrorsSnapshot>(`/api/hime/errors/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ state }),
    }),
  security: () => request<HimeSecuritySnapshot>("/api/hime/security"),
  leaveGuild: (id: string) =>
    request<HimeSecuritySnapshot>(
      `/api/hime/security/guilds/${encodeURIComponent(id)}/leave`,
      { method: "POST" },
    ),
  players: () => request<HimePlayersSnapshot>("/api/hime/players"),
  player: (id: string) =>
    request<HimePlayerDetail>(`/api/hime/players/${encodeURIComponent(id)}`),
  playerAction: (id: string, action: HimePlayerAction) =>
    request<HimePlayerDetail>(
      `/api/hime/players/${encodeURIComponent(id)}/action`,
      { method: "POST", body: JSON.stringify(action) },
    ),
  economy: () => request<HimeEconomySnapshot>("/api/hime/economy"),
  system: () => request<HimeSystemSnapshot>("/api/hime/system"),
  backupNow: () =>
    request<HimeSystemSnapshot>("/api/hime/system/backup", { method: "POST" }),
  openStream(onChange: () => void): () => void {
    if (!API_URL || typeof EventSource === "undefined") return () => undefined;
    const source = new EventSource(`${API_URL}/api/hime/stream`, {
      withCredentials: true,
    });
    [
      "dashboard",
      "stats",
      "ideas",
      "logs",
      "errors",
      "security",
      "players",
      "economy",
      "system",
    ].forEach((name) => source.addEventListener(name, onChange));
    return () => source.close();
  },
};
