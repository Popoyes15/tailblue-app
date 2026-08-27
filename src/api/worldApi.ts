// TAILBLUE_WORLD_APP_V3_20260826
import { getDesktopAccessToken } from "./homeApi";
import type {
  HouseSnapshot,
  LeaderboardSnapshot,
  MarketSnapshot,
  MuseumSnapshot,
} from "../types/world";

const rawBaseUrl = String(
  import.meta.env.VITE_TAILBLUE_API_URL ?? "",
).trim();

const baseUrl = rawBaseUrl.replace(/\/+$/, "");

export type WorldCacheKey =
  | "house"
  | "museum"
  | "market"
  | "leaderboard";

const CACHE_PREFIX =
  "tailblue.world.snapshot.v3.";

const memoryCache =
  new Map<WorldCacheKey, unknown>();

export function resolveWorldAssetUrl(
  value?: string | null,
): string | null {
  const path = String(value ?? "").trim();

  if (!path) return null;

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  if (
    path.startsWith("/api/") &&
    baseUrl
  ) {
    return `${baseUrl}${path}`;
  }

  return path;
}

export function getCachedWorldSnapshot<T>(
  key: WorldCacheKey,
): T | null {
  if (memoryCache.has(key)) {
    return (
      memoryCache.get(key) ?? null
    ) as T | null;
  }

  try {
    const raw =
      window.sessionStorage.getItem(
        `${CACHE_PREFIX}${key}`,
      );

    if (!raw) return null;

    const value = JSON.parse(raw) as T;
    memoryCache.set(key, value);
    return value;
  } catch {
    return null;
  }
}

export function rememberWorldSnapshot<T>(
  key: WorldCacheKey,
  value: T,
): T {
  memoryCache.set(key, value);

  try {
    window.sessionStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify(value),
    );
  } catch {
    // Le cache mémoire suffit.
  }

  return value;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!baseUrl) {
    throw new Error(
      "API TailBlue non configurée.",
    );
  }

  const token =
    getDesktopAccessToken();

  const headers =
    new Headers(init?.headers ?? {});

  headers.set(
    "Content-Type",
    "application/json",
  );
  headers.set(
    "Accept",
    "application/json",
  );

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(
    `${baseUrl}${path}`,
    {
      ...init,
      credentials: "omit",
      headers,
    },
  );

  if (!response.ok) {
    let detail =
      `Erreur TailBlue ${response.status}`;

    try {
      const body =
        await response.json();

      detail = String(
        body?.detail ??
        body?.message ??
        detail,
      );
    } catch {
      // Réponse non JSON.
    }

    throw new Error(detail);
  }

  return (
    await response.json()
  ) as T;
}

function post<T>(
  path: string,
  body: unknown,
): Promise<T> {
  return request<T>(
    path,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

function cached<T>(
  key: WorldCacheKey,
  promise: Promise<T>,
): Promise<T> {
  return promise.then((value) =>
    rememberWorldSnapshot(key, value),
  );
}

export const worldApi = {
  configured: Boolean(baseUrl),

  getHouse(): Promise<HouseSnapshot> {
    return cached(
      "house",
      request<HouseSnapshot>(
        "/api/world/house",
      ),
    );
  },

  buyHouse(
    houseId: string,
  ): Promise<HouseSnapshot> {
    return cached(
      "house",
      post<HouseSnapshot>(
        "/api/world/house/buy",
        { houseId },
      ),
    );
  },

  houseFurniture(
    action: "buy" | "install" | "store",
    itemId: string,
  ): Promise<HouseSnapshot> {
    return cached(
      "house",
      post<HouseSnapshot>(
        "/api/world/house/furniture",
        { action, itemId },
      ),
    );
  },

  getMuseum(): Promise<MuseumSnapshot> {
    return cached(
      "museum",
      request<MuseumSnapshot>(
        "/api/world/museum",
      ),
    );
  },

  addMuseumPiece(
    itemKey: string,
  ): Promise<MuseumSnapshot> {
    return cached(
      "museum",
      post<MuseumSnapshot>(
        "/api/world/museum/add",
        { itemKey },
      ),
    );
  },

  getMarket(): Promise<MarketSnapshot> {
    return cached(
      "market",
      request<MarketSnapshot>(
        "/api/world/market",
      ),
    );
  },

  buyMarketBuilding(
    buildingId: string,
  ): Promise<MarketSnapshot> {
    return cached(
      "market",
      post<MarketSnapshot>(
        "/api/world/market/building/buy",
        { buildingId },
      ),
    );
  },

  upgradeMarketBuilding(
    buildingId: string,
  ): Promise<MarketSnapshot> {
    return cached(
      "market",
      post<MarketSnapshot>(
        "/api/world/market/building/upgrade",
        { buildingId },
      ),
    );
  },

  marketTransaction(
    buildingId: string,
    itemId: string,
    mode: "buy" | "sell",
    quantity: number,
  ): Promise<MarketSnapshot> {
    return cached(
      "market",
      post<MarketSnapshot>(
        "/api/world/market/transaction",
        {
          buildingId,
          itemId,
          mode,
          quantity,
        },
      ),
    );
  },

  getLevelLeaderboard():
    Promise<LeaderboardSnapshot> {
    return cached(
      "leaderboard",
      request<LeaderboardSnapshot>(
        "/api/world/leaderboard/levels",
      ),
    );
  },
};
