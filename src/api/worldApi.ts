import { getDesktopAccessToken } from "./homeApi";
import type {
  HouseSnapshot,
  LeaderboardSnapshot,
  MarketSnapshot,
  MuseumSnapshot,
} from "../types/world";

const rawBaseUrl = String(import.meta.env.VITE_TAILBLUE_API_URL ?? "").trim();
const baseUrl = rawBaseUrl.replace(/\/+$/, "");

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!baseUrl) {
    throw new Error("TAILBLUE_API_NOT_CONFIGURED");
  }

  const token = getDesktopAccessToken();
  const headers = new Headers(init?.headers ?? {});
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: "omit",
    headers,
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      detail = String(body?.detail ?? body?.message ?? detail);
    } catch {
      // Réponse non JSON : le code HTTP suffit.
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const worldApi = {
  configured: Boolean(baseUrl),

  getHouse(): Promise<HouseSnapshot> {
    return request<HouseSnapshot>("/api/world/house");
  },

  buyHouse(houseId: string): Promise<HouseSnapshot> {
    return post<HouseSnapshot>("/api/world/house/buy", { houseId });
  },

  houseFurniture(
    action: "buy" | "install" | "store",
    itemId: string,
  ): Promise<HouseSnapshot> {
    return post<HouseSnapshot>("/api/world/house/furniture", {
      action,
      itemId,
    });
  },

  getMuseum(): Promise<MuseumSnapshot> {
    return request<MuseumSnapshot>("/api/world/museum");
  },

  addMuseumPiece(itemName: string): Promise<MuseumSnapshot> {
    return post<MuseumSnapshot>("/api/world/museum/add", { itemName });
  },

  getMarket(): Promise<MarketSnapshot> {
    return request<MarketSnapshot>("/api/world/market");
  },

  buyMarketBuilding(buildingId: string): Promise<MarketSnapshot> {
    return post<MarketSnapshot>("/api/world/market/building/buy", {
      buildingId,
    });
  },

  upgradeMarketBuilding(buildingId: string): Promise<MarketSnapshot> {
    return post<MarketSnapshot>("/api/world/market/building/upgrade", {
      buildingId,
    });
  },

  marketTransaction(
    buildingId: string,
    itemId: string,
    mode: "buy" | "sell",
    quantity: number,
  ): Promise<MarketSnapshot> {
    return post<MarketSnapshot>("/api/world/market/transaction", {
      buildingId,
      itemId,
      mode,
      quantity,
    });
  },

  getLevelLeaderboard(): Promise<LeaderboardSnapshot> {
    return request<LeaderboardSnapshot>("/api/world/leaderboard/levels");
  },
};
