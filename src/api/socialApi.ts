// TAILBLUE_SOCIAL_DESKTOP_V1A_20260827

import {
  getDesktopAccessToken,
  refreshDesktopSession,
} from "./homeApi";

import type {
  SocialConversation,
  SocialSearchResult,
  SocialSnapshot,
} from "../types/social";

const RAW_API_URL = String(
  import.meta.env.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_URL =
  RAW_API_URL.replace(/\/+$/, "");

const CACHE_KEY =
  "tailblue.social.snapshot.v1";

let memorySnapshot:
  SocialSnapshot | null = null;

function remember(
  snapshot: SocialSnapshot,
): SocialSnapshot {
  memorySnapshot = snapshot;

  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // Mémoire suffisante.
  }

  return snapshot;
}

export function getCachedSocialSnapshot():
  SocialSnapshot | null {
  if (memorySnapshot) {
    return memorySnapshot;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        CACHE_KEY,
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw) as SocialSnapshot;

    if (
      !parsed ||
      !Array.isArray(parsed.friends) ||
      !Array.isArray(parsed.conversations)
    ) {
      return null;
    }

    memorySnapshot = parsed;
    return parsed;
  } catch {
    return null;
  }
}

async function responseError(
  response: Response,
): Promise<Error> {
  let detail =
    `Erreur TailBlue ${response.status}`;

  try {
    const body = await response.json();

    if (body?.detail) {
      detail = String(body.detail);
    }
  } catch {
    // Statut HTTP suffisant.
  }

  return new Error(detail);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "API TailBlue non configurée.",
    );
  }

  const headers =
    new Headers(init.headers);

  headers.set(
    "Accept",
    "application/json",
  );

  if (init.body !== undefined) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const token =
    getDesktopAccessToken();

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const controller =
    new AbortController();

  const timeoutId =
    window.setTimeout(
      () => controller.abort(),
      15_000,
    );

  let response: Response;

  try {
    response = await fetch(
      `${API_URL}${path}`,
      {
        ...init,
        headers,
        credentials: "omit",
        signal: controller.signal,
      },
    );
  } catch (cause) {
    window.clearTimeout(timeoutId);

    if (
      cause instanceof DOMException &&
      cause.name === "AbortError"
    ) {
      throw new Error(
        "Le serveur TailBlue ne répond pas pour le moment.",
      );
    }

    throw cause;
  }

  window.clearTimeout(timeoutId);

  if (
    response.status === 401 &&
    allowRefresh
  ) {
    try {
      const refreshed =
        await refreshDesktopSession();

      if (refreshed?.accessToken) {
        return request<T>(
          path,
          init,
          false,
        );
      }
    } catch {
      // L'erreur finale sera affichée.
    }
  }

  if (!response.ok) {
    throw await responseError(response);
  }

  return (
    await response.json()
  ) as T;
}

function snapshotRequest(
  path: string,
  init: RequestInit = {},
): Promise<SocialSnapshot> {
  return request<SocialSnapshot>(
    path,
    init,
  ).then(remember);
}

export const socialApi = {
  snapshot(): Promise<SocialSnapshot> {
    return snapshotRequest(
      "/api/social",
    );
  },

  search(
    query: string,
  ): Promise<SocialSearchResult[]> {
    return request<{
      results: SocialSearchResult[];
    }>(
      `/api/social/search?q=${encodeURIComponent(query)}`,
    ).then(
      (value) => value.results,
    );
  },

  requestFriend(
    userId: string,
  ): Promise<SocialSnapshot> {
    return snapshotRequest(
      `/api/social/friends/request/${encodeURIComponent(userId)}`,
      {
        method: "POST",
      },
    );
  },

  respondFriend(
    requestId: string,
    action: "accept" | "decline",
  ): Promise<SocialSnapshot> {
    return snapshotRequest(
      `/api/social/friends/request/${encodeURIComponent(requestId)}/respond`,
      {
        method: "POST",
        body: JSON.stringify({
          action,
        }),
      },
    );
  },

  removeFriend(
    userId: string,
  ): Promise<SocialSnapshot> {
    return snapshotRequest(
      `/api/social/friends/${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
      },
    );
  },

  pinFriend(
    userId: string,
    pinned: boolean,
  ): Promise<SocialSnapshot> {
    return snapshotRequest(
      `/api/social/friends/${encodeURIComponent(userId)}/pin`,
      {
        method: "PATCH",
        body: JSON.stringify({
          pinned,
        }),
      },
    );
  },

  conversation(
    userId: string,
  ): Promise<SocialConversation> {
    return request<SocialConversation>(
      `/api/social/messages/${encodeURIComponent(userId)}`,
    );
  },

  sendMessage(
    userId: string,
    body: string,
  ): Promise<SocialConversation> {
    return request<SocialConversation>(
      `/api/social/messages/${encodeURIComponent(userId)}`,
      {
        method: "POST",
        body: JSON.stringify({
          body,
        }),
      },
    );
  },

  heartbeat(): Promise<{
    status: "online" | "offline";
    lastSeen?: string | null;
  }> {
    return request(
      "/api/social/presence",
      {
        method: "POST",
      },
    );
  },

  redeemReferral(
    code: string,
  ): Promise<SocialSnapshot> {
    return snapshotRequest(
      "/api/social/referral/redeem",
      {
        method: "POST",
        body: JSON.stringify({
          code,
        }),
      },
    );
  },
};
