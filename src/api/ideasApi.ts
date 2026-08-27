// TAILBLUE_IDEAS_DESKTOP_V1A_20260827
// TAILBLUE_IDEAS_DESKTOP_V1B_20260827

import {
  getDesktopAccessToken,
  refreshDesktopSession,
} from "./homeApi";

import type {
  HimeIdeaAction,
  HimeIdeasSnapshot,
  IdeaDraft,
  IdeaVote,
  IdeasSnapshot,
} from "../types/ideas";

const RAW_API_URL = String(
  import.meta.env.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_URL =
  RAW_API_URL.replace(/\/+$/, "");

export const ideasApiConfigured =
  Boolean(API_URL);

const CACHE_KEY =
  "tailblue.ideas.snapshot.v2";

let memorySnapshot:
  IdeasSnapshot | null = null;

function remember(
  snapshot: IdeasSnapshot,
): IdeasSnapshot {
  memorySnapshot = snapshot;

  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // Cache mémoire suffisant.
  }

  return snapshot;
}

export function getCachedIdeasSnapshot():
  IdeasSnapshot | null {
  if (memorySnapshot) {
    return memorySnapshot;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        CACHE_KEY,
      );

    if (!raw) return null;

    const value =
      JSON.parse(raw) as IdeasSnapshot;

    if (
      !value ||
      !Array.isArray(value.community) ||
      !Array.isArray(value.myIdeas) ||
      !Array.isArray(value.archives)
    ) {
      window.sessionStorage.removeItem(
        CACHE_KEY,
      );
      return null;
    }

    memorySnapshot = value;
    return value;
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
    // Le statut HTTP suffit.
  }

  return new Error(detail);
}

async function rawRequest<T>(
  path: string,
  init: RequestInit,
  allowRefresh: boolean,
): Promise<T> {
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

  if (init.signal) {
    init.signal.addEventListener(
      "abort",
      () => controller.abort(),
      { once: true },
    );
  }

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
        credentials: "omit",
        headers,
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
        "Le serveur TailBlue ne répond pas. Il n’y a aucun cooldown sur les idées : réessaie dans quelques secondes.",
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
        headers.set(
          "Authorization",
          `Bearer ${refreshed.accessToken}`,
        );

        response = await fetch(
          `${API_URL}${path}`,
          {
            ...init,
            credentials: "omit",
            headers,
          },
        );
      }
    } catch {
      // L'erreur HTTP finale est affichée au joueur.
    }
  }

  if (!response.ok) {
    throw await responseError(
      response,
    );
  }

  return (
    await response.json()
  ) as T;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error(
      "API TailBlue non configurée.",
    );
  }

  return rawRequest<T>(
    path,
    init,
    true,
  );
}

function snapshotRequest(
  path: string,
  init: RequestInit = {},
): Promise<IdeasSnapshot> {
  return request<IdeasSnapshot>(
    path,
    init,
  ).then(remember);
}

export const ideasApi = {
  snapshot(): Promise<IdeasSnapshot> {
    return snapshotRequest(
      "/api/ideas",
    );
  },

  submit(
    draft: IdeaDraft,
  ): Promise<IdeasSnapshot> {
    return snapshotRequest(
      "/api/ideas",
      {
        method: "POST",
        body: JSON.stringify(draft),
      },
    );
  },

  edit(
    id: string,
    draft: Partial<IdeaDraft>,
  ): Promise<IdeasSnapshot> {
    return snapshotRequest(
      `/api/ideas/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(draft),
      },
    );
  },

  remove(
    id: string,
  ): Promise<IdeasSnapshot> {
    return snapshotRequest(
      `/api/ideas/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  vote(
    id: string,
    vote: IdeaVote,
  ): Promise<IdeasSnapshot> {
    return snapshotRequest(
      `/api/ideas/${encodeURIComponent(id)}/vote`,
      {
        method: "POST",
        body: JSON.stringify({
          vote,
        }),
      },
    );
  },

  himeSnapshot():
    Promise<HimeIdeasSnapshot> {
    return request<HimeIdeasSnapshot>(
      "/api/ideas/hime",
    );
  },

  himeAction(
    id: string,
    action: HimeIdeaAction,
  ): Promise<HimeIdeasSnapshot> {
    return request<HimeIdeasSnapshot>(
      `/api/ideas/hime/${encodeURIComponent(id)}/action`,
      {
        method: "POST",
        body: JSON.stringify({
          action,
        }),
      },
    );
  },

  setPublication(
    id: string,
    patch: {
      public?: boolean;
      pinned?: boolean;
    },
  ): Promise<HimeIdeasSnapshot> {
    return request<HimeIdeasSnapshot>(
      `/api/ideas/hime/${encodeURIComponent(id)}/publication`,
      {
        method: "PATCH",
        body: JSON.stringify(patch),
      },
    );
  },
};
