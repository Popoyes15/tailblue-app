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


const QUEST_CACHE_KEY =
  "tailblue.quests.snapshot.v1";

type QuestCacheEnvelope = {
  cachedAt: number;
  snapshot: QuestBoardSnapshotDto;
};

let memoryQuestCache:
  | QuestCacheEnvelope
  | null = null;

function isQuestSnapshot(
  value: unknown,
): value is QuestBoardSnapshotDto {
  if (!value || typeof value !== "object") return false;

  const candidate =
    value as Partial<QuestBoardSnapshotDto>;

  return (
    Array.isArray(candidate.offers) &&
    "activeQuest" in candidate
  );
}

function readQuestCache():
  | QuestCacheEnvelope
  | null {
  if (memoryQuestCache) {
    return memoryQuestCache;
  }

  try {
    const raw = window.sessionStorage.getItem(
      QUEST_CACHE_KEY,
    );

    if (!raw) return null;

    const parsed = JSON.parse(
      raw,
    ) as Partial<QuestCacheEnvelope>;

    if (
      typeof parsed.cachedAt !== "number" ||
      !isQuestSnapshot(parsed.snapshot)
    ) {
      window.sessionStorage.removeItem(
        QUEST_CACHE_KEY,
      );
      return null;
    }

    memoryQuestCache = {
      cachedAt: parsed.cachedAt,
      snapshot: parsed.snapshot,
    };

    return memoryQuestCache;
  } catch {
    return null;
  }
}

export function getCachedQuestSnapshot():
  | QuestBoardSnapshotDto
  | null {
  return readQuestCache()?.snapshot ?? null;
}

export function cacheQuestSnapshot(
  snapshot: QuestBoardSnapshotDto,
): QuestBoardSnapshotDto {
  const envelope: QuestCacheEnvelope = {
    cachedAt: Date.now(),
    snapshot,
  };

  memoryQuestCache = envelope;

  try {
    window.sessionStorage.setItem(
      QUEST_CACHE_KEY,
      JSON.stringify(envelope),
    );
  } catch {
    // Le cache mémoire suffit si le stockage WebView est indisponible.
  }

  return snapshot;
}

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
  async getSnapshot(): Promise<QuestBoardSnapshotDto> {
    const snapshot =
      await request<QuestBoardSnapshotDto>(
        "/api/quests",
      );

    return cacheQuestSnapshot(snapshot);
  },

  async accept(
    questId: string,
  ): Promise<QuestBoardSnapshotDto> {
    const body: QuestAcceptRequest = { questId };

    const snapshot =
      await request<QuestBoardSnapshotDto>(
        "/api/quests/accept",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );

    return cacheQuestSnapshot(snapshot);
  },

  async claim(): Promise<QuestClaimResultDto> {
    const result =
      await request<QuestClaimResultDto>(
        "/api/quests/claim",
        {
          method: "POST",
          body: JSON.stringify({}),
        },
      );

    cacheQuestSnapshot(result.snapshot);
    return result;
  },
};
