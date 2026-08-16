import { getDesktopAccessToken } from "./homeApi";
import type {
  QuestAcceptRequest,
  QuestBoardSnapshotDto,
  QuestClaimResultDto,
} from "../types/quest";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_URL = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const questApiConfigured = Boolean(API_URL);

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("TAILBLUE_API_NOT_CONFIGURED");
  }

  const token = getDesktopAccessToken();
  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "omit",
  });

  if (!response.ok) {
    let message = `Erreur API ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body?.detail === "string") message = body.detail;
      else if (typeof body?.message === "string") message = body.message;
    } catch {
      // Le statut HTTP suffit si le backend ne renvoie pas de JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/**
 * Tableau des quêtes TailBlue réellement connecté.
 *
 * Le backend est la seule autorité sur :
 * - l'identité Discord ;
 * - les trois offres ;
 * - la progression ;
 * - les 24 heures ;
 * - les récompenses ;
 * - le bonus Chat Royal.
 */
export const questApi = {
  getSnapshot(): Promise<QuestBoardSnapshotDto> {
    return request<QuestBoardSnapshotDto>("/api/quests");
  },

  accept(questId: string): Promise<QuestBoardSnapshotDto> {
    const body: QuestAcceptRequest = { questId };

    return request<QuestBoardSnapshotDto>("/api/quests/accept", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  claim(): Promise<QuestClaimResultDto> {
    return request<QuestClaimResultDto>("/api/quests/claim", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
