// TAILBLUE_INFORMATION_CMS_DESKTOP_V1_20260827

import {
  getDesktopAccessToken,
  refreshDesktopSession,
} from "./homeApi";

import {
  PREVIEW_ROADMAP,
  PREVIEW_UPDATES,
} from "../data/informationPreviewData";

import type {
  AdminRoadmap,
  AdminUpdate,
  AdminWiki,
  DiscordInformationChannel,
  InformationAdminSnapshot,
  InformationKind,
  RoadmapItem,
  RoadmapSnapshot,
  RoadmapStatus,
  TailBlueUpdateArticle,
  UpdateFeedSnapshot,
  UpdateImportance,
  WikiArticle,
  WikiSnapshot,
} from "../types/information";

type Env = Record<
  string,
  string | boolean | undefined
>;

const ENV =
  (import.meta as ImportMeta & {
    env?: Env;
  }).env ?? {};

const API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
)
  .trim()
  .replace(/\/+$/, "");

const IS_DEV =
  Boolean(ENV.DEV) ||
  String(ENV.MODE ?? "") ===
    "development";

const CACHE_KEYS = {
  updates:
    "tailblue.information.updates.v2",
  roadmap:
    "tailblue.information.roadmap.v2",
  wiki:
    "tailblue.information.wiki.v2",
};

function readCache<T>(
  key: string,
): T | null {
  try {
    const raw =
      window.sessionStorage.getItem(
        key,
      );

    return raw
      ? (JSON.parse(raw) as T)
      : null;
  } catch {
    return null;
  }
}

function writeCache<T>(
  key: string,
  value: T,
): T {
  try {
    window.sessionStorage.setItem(
      key,
      JSON.stringify(value),
    );
  } catch {
    // Mémoire uniquement.
  }

  return value;
}

export function cachedUpdates():
  UpdateFeedSnapshot | null {
  return readCache<UpdateFeedSnapshot>(
    CACHE_KEYS.updates,
  );
}

export function cachedRoadmap():
  RoadmapSnapshot | null {
  return readCache<RoadmapSnapshot>(
    CACHE_KEYS.roadmap,
  );
}

export function cachedWiki():
  WikiSnapshot | null {
  return readCache<WikiSnapshot>(
    CACHE_KEYS.wiki,
  );
}

async function responseError(
  response: Response,
): Promise<Error> {
  let detail =
    `Erreur TailBlue ${response.status}`;

  try {
    const body =
      await response.json();

    if (body?.detail) {
      detail = String(
        body.detail,
      );
    }
  } catch {
    // HTTP suffit.
  }

  return new Error(detail);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  if (!API_BASE) {
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

  if (
    init.body !== undefined &&
    !headers.has("Content-Type")
  ) {
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

  let response =
    await fetch(
      `${API_BASE}${path}`,
      {
        ...init,
        headers,
        credentials: "omit",
      },
    );

  if (
    response.status === 401 &&
    allowRefresh
  ) {
    try {
      const session =
        await refreshDesktopSession();

      if (session?.accessToken) {
        return request<T>(
          path,
          init,
          false,
        );
      }
    } catch {
      // L'erreur finale est plus utile.
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

function importance(
  value: unknown,
): UpdateImportance {
  const current =
    String(
      value ?? "standard",
    ).toLowerCase();

  if (
    [
      "info",
      "standard",
      "important",
      "urgent",
      "success",
    ].includes(current)
  ) {
    return current as UpdateImportance;
  }

  return "standard";
}

function normalizeUpdate(
  raw: unknown,
): TailBlueUpdateArticle | null {
  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return null;
  }

  const value =
    raw as Record<
      string,
      unknown
    >;

  const title =
    String(
      value.title ?? "",
    ).trim();

  const body =
    String(
      value.body ??
        value.text ??
        "",
    ).trim();

  if (!title || !body) {
    return null;
  }

  const images =
    Array.isArray(value.images)
      ? value.images
          .map((item) =>
            String(item ?? ""),
          )
          .filter(Boolean)
      : [];

  return {
    id: String(value.id ?? title),
    title,
    body,
    excerpt:
      String(
        value.excerpt ?? "",
      ).trim() ||
      body
        .replace(/\s+/g, " ")
        .slice(0, 260),
    publishedAt: String(
      value.published_at ??
        value.publishedAt ??
        "",
    ),
    images,
    tag:
      String(
        value.tag ??
          "Mise à jour",
      ),
    author: value.author
      ? String(value.author)
      : undefined,
    importance:
      importance(
        value.importance,
      ),
    source: "api",
  };
}

function normalizeRoadmap(
  raw: unknown,
): RoadmapItem | null {
  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return null;
  }

  const value =
    raw as Record<
      string,
      unknown
    >;

  const id =
    String(
      value.id ?? "",
    ).trim();

  const title =
    String(
      value.title ?? "",
    ).trim();

  const description =
    String(
      value.description ?? "",
    ).trim();

  if (
    !id ||
    !title ||
    !description
  ) {
    return null;
  }

  const statuses = [
    "done",
    "current",
    "next",
    "later",
    "paused",
  ] as const;

  const statusRaw =
    String(
      value.status ?? "later",
    ).toLowerCase();

  const status =
    statuses.includes(
      statusRaw as
        (typeof statuses)[number],
    )
      ? (statusRaw as
          (typeof statuses)[number])
      : "later";

  const progress =
    Number(value.progress);

  return {
    id,
    title,
    description,
    status,
    area: value.area
      ? String(value.area)
      : undefined,
    target: value.target
      ? String(value.target)
      : undefined,
    progress:
      Number.isFinite(progress)
        ? Math.max(
            0,
            Math.min(
              100,
              progress,
            ),
          )
        : undefined,
    checklist:
      Array.isArray(
        value.checklist,
      )
        ? (value.checklist as RoadmapItem["checklist"])
        : [],
  };
}

function normalizeWiki(
  raw: unknown,
): WikiArticle | null {
  if (
    !raw ||
    typeof raw !== "object"
  ) {
    return null;
  }

  const value =
    raw as Record<
      string,
      unknown
    >;

  const id =
    String(
      value.id ?? "",
    ).trim();

  const title =
    String(
      value.title ?? "",
    ).trim();

  const body =
    String(
      value.body ?? "",
    ).trim();

  if (
    !id ||
    !title ||
    !body
  ) {
    return null;
  }

  return {
    id,
    title,
    body,
    summary:
      String(
        value.summary ?? "",
      ).trim() ||
      body
        .replace(/\s+/g, " ")
        .slice(0, 260),
    category:
      String(
        value.category ??
          "Guide",
      ),
    tags:
      Array.isArray(value.tags)
        ? value.tags.map(
            (item) =>
              String(item),
          )
        : [],
    author: value.author
      ? String(value.author)
      : undefined,
    publishedAt:
      value.published_at
        ? String(
            value.published_at,
          )
        : null,
  };
}

export function hasInformationApi():
  boolean {
  return Boolean(API_BASE);
}

export async function loadUpdatesSnapshot():
  Promise<UpdateFeedSnapshot> {
  const cache =
    cachedUpdates();

  if (!API_BASE) {
    return (
      cache ??
      (IS_DEV
        ? {
            articles:
              PREVIEW_UPDATES,
            connected: false,
            mode: "preview",
          }
        : {
            articles: [],
            connected: false,
            mode: "offline",
          })
    );
  }

  try {
    const payload =
      await request<{
        updates?: unknown[];
        updated_at?: string;
      }>(
        "/api/updates",
      );

    const articles =
      (payload.updates ?? [])
        .map(normalizeUpdate)
        .filter(
          (
            item,
          ): item is TailBlueUpdateArticle =>
            Boolean(item),
        );

    articles.sort(
      (a, b) =>
        new Date(
          b.publishedAt,
        ).getTime() -
        new Date(
          a.publishedAt,
        ).getTime(),
    );

    return writeCache(
      CACHE_KEYS.updates,
      {
        articles,
        connected: true,
        mode: "api",
        updatedAt:
          payload.updated_at,
      },
    );
  } catch (error) {
    if (cache) {
      return {
        ...cache,
        connected: false,
        error: String(error),
      };
    }

    return IS_DEV
      ? {
          articles:
            PREVIEW_UPDATES,
          connected: false,
          mode: "preview",
          error: String(error),
        }
      : {
          articles: [],
          connected: false,
          mode: "offline",
          error: String(error),
        };
  }
}

export async function loadRoadmapSnapshot():
  Promise<RoadmapSnapshot> {
  const cache =
    cachedRoadmap();

  if (!API_BASE) {
    return (
      cache ??
      (IS_DEV
        ? {
            items:
              PREVIEW_ROADMAP,
            connected: false,
            mode: "preview",
          }
        : {
            items: [],
            connected: false,
            mode: "offline",
          })
    );
  }

  try {
    const payload =
      await request<{
        items?: unknown[];
        global_progress?: number;
        updated_at?: string;
      }>(
        "/api/roadmap",
      );

    const items =
      (payload.items ?? [])
        .map(normalizeRoadmap)
        .filter(
          (
            item,
          ): item is RoadmapItem =>
            Boolean(item),
        );

    return writeCache(
      CACHE_KEYS.roadmap,
      {
        items,
        globalProgress:
          Number(
            payload.global_progress ??
              0,
          ),
        connected: true,
        mode: "api",
        updatedAt:
          payload.updated_at,
      },
    );
  } catch (error) {
    if (cache) {
      return {
        ...cache,
        connected: false,
        error: String(error),
      };
    }

    return IS_DEV
      ? {
          items:
            PREVIEW_ROADMAP,
          connected: false,
          mode: "preview",
          error: String(error),
        }
      : {
          items: [],
          connected: false,
          mode: "offline",
          error: String(error),
        };
  }
}

export async function loadWikiSnapshot():
  Promise<WikiSnapshot> {
  const cache =
    cachedWiki();

  if (!API_BASE) {
    return (
      cache ?? {
        articles: [],
        connected: false,
        mode: IS_DEV
          ? "preview"
          : "offline",
      }
    );
  }

  try {
    const payload =
      await request<{
        articles?: unknown[];
        updated_at?: string;
      }>(
        "/api/wiki",
      );

    const articles =
      (payload.articles ?? [])
        .map(normalizeWiki)
        .filter(
          (
            item,
          ): item is WikiArticle =>
            Boolean(item),
        );

    return writeCache(
      CACHE_KEYS.wiki,
      {
        articles,
        connected: true,
        mode: "api",
        updatedAt:
          payload.updated_at,
      },
    );
  } catch (error) {
    if (cache) {
      return {
        ...cache,
        connected: false,
        error: String(error),
      };
    }

    return {
      articles: [],
      connected: false,
      mode: IS_DEV
        ? "preview"
        : "offline",
      error: String(error),
    };
  }
}

export async function loadInformationAdmin():
  Promise<InformationAdminSnapshot> {
  return request(
    "/api/information/hime",
  );
}

export async function loadDiscordInformationChannels():
  Promise<DiscordInformationChannel[]> {
  const payload =
    await request<{
      channels:
        DiscordInformationChannel[];
    }>(
      "/api/information/hime/discord-channels",
    );

  return payload.channels ?? [];
}

export async function createInformationItem(
  kind: InformationKind,
  payload: Record<
    string,
    unknown
  >,
): Promise<InformationAdminSnapshot> {
  return request(
    `/api/information/hime/${kind}`,
    {
      method: "POST",
      body:
        JSON.stringify(payload),
    },
  );
}

export async function updateInformationItem(
  kind: InformationKind,
  id: string,
  payload: Record<
    string,
    unknown
  >,
): Promise<InformationAdminSnapshot> {
  return request(
    `/api/information/hime/${kind}/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body:
        JSON.stringify(payload),
    },
  );
}

export async function deleteInformationItem(
  kind: InformationKind,
  id: string,
): Promise<InformationAdminSnapshot> {
  return request(
    `/api/information/hime/${kind}/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}

export async function importDiscordUpdates(
  channelId: string,
  limit: number,
  destination: "updates" | "roadmap" | "wiki",
  roadmapStatus: RoadmapStatus = "done",
): Promise<InformationAdminSnapshot> {
  return request(
    "/api/information/hime/import/discord",
    {
      method: "POST",
      body:
        JSON.stringify({
          channelId,
          limit,
          destination,
          roadmapStatus,
        }),
    },
  );
}

export function subscribeInformation(
  _onChange: (
    type:
      | "updates"
      | "roadmap"
      | "wiki"
      | "all",
  ) => void,
): () => void {
  // EventSource n'envoie pas Authorization: Bearer.
  // Le polling silencieux des pages reste la source sûre.
  return () => undefined;
}

export type {
  AdminRoadmap,
  AdminUpdate,
  AdminWiki,
};
