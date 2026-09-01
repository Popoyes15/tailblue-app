// TAILBLUE_HIME_CONTROL_APP_FINAL_V2_20260901
// TAILBLUE_HIME_API_SECURE_SESSION_V1_20260901
import type {
  HimeDashboard,
  HimeEconomySnapshot,
  HimeErrorsSnapshot,
  HimeIdeaPatch,
  HimeIdeasSnapshot,
  HimeLogsSnapshot,
  HimeReportGenerateRequest,
  HimeReportGenerateResponse,
  HimeReportsSnapshot,
  HimePlayerAction,
  HimePlayerDetail,
  HimePlayersSnapshot,
  HimeSecuritySnapshot,
  HimeSidebarBadges,
  HimeStatsSnapshot,
  HimeSystemSnapshot,
} from "../types/hime";

import {
  getDesktopAccessToken,
  refreshDesktopSession,
} from "./homeApi";

const API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").replace(/\/+$/, "");
export const himeApiConfigured = Boolean(API_URL);

async function request<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  if (!API_URL) {
    throw new Error("API TailBlue non configurée.");
  }

  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (
    init.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getDesktopAccessToken();

  if (
    accessToken &&
    !headers.has("Authorization")
  ) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "omit",
    headers,
  });

  if (
    response.status === 401 &&
    allowRefresh
  ) {
    try {
      const refreshed =
        await refreshDesktopSession();

      if (refreshed?.accessToken) {
        const retryHeaders =
          new Headers(init.headers);

        if (!retryHeaders.has("Accept")) {
          retryHeaders.set(
            "Accept",
            "application/json",
          );
        }

        if (
          init.body !== undefined &&
          !retryHeaders.has("Content-Type")
        ) {
          retryHeaders.set(
            "Content-Type",
            "application/json",
          );
        }

        retryHeaders.set(
          "Authorization",
          `Bearer ${refreshed.accessToken}`,
        );

        response = await fetch(
          `${API_URL}${path}`,
          {
            ...init,
            credentials: "omit",
            headers: retryHeaders,
          },
        );
      }
    } catch (error) {
      console.warn(
        "Renouvellement session Hime impossible :",
        error,
      );
    }
  }

  if (!response.ok) {
    let detail = `Erreur TailBlue ${response.status}`;

    try {
      const payload =
        (await response.json()) as {
          detail?: unknown;
        };

      if (payload.detail) {
        detail = String(payload.detail);
      }
    } catch {
      // réponse non JSON
    }

    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const himeApi = {
  dashboard: () => request<HimeDashboard>("/api/hime/dashboard"),
  badges: () => request<HimeSidebarBadges>("/api/hime/badges"),
  stats: (period: "today" | "week" | "month") =>
    request<HimeStatsSnapshot>(`/api/hime/stats?period=${period}`),
  reports: () => request<HimeReportsSnapshot>("/api/hime/reports"),
  generateReport: (payload: HimeReportGenerateRequest) =>
    request<HimeReportGenerateResponse>("/api/hime/reports/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
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
    if (!API_URL || typeof window === "undefined") {
      return () => undefined;
    }

    const timer = window.setInterval(
      () => onChange(),
      20_000,
    );

    const onFocus = () => onChange();
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  },
};
