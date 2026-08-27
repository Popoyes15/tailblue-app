// TAILBLUE_CHESTS_DESKTOP_V4_20260822
import { getDesktopAccessToken } from "./homeApi";
import type {
  ChestBonusCardRevealDto,
  ChestBonusScratchClaimDto,
  ChestMysteryResolveDto,
  ChestOpenResultDto,
  ChestSnapshotDto,
} from "../types/chest";

const RAW_API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").trim();
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const chestApiConfigured = Boolean(API_URL);

// TAILBLUE_POLISH_PACK_V3_20260826
const CHEST_CACHE_KEY = "tailblue.chests.snapshot.v1";
let memoryChestSnapshot: ChestSnapshotDto | null = null;

function isChestSnapshot(value: unknown): value is ChestSnapshotDto {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ChestSnapshotDto>;
  return (
    typeof candidate.totalOpened === "number" &&
    typeof candidate.cookies === "number" &&
    typeof candidate.canOpen === "boolean"
  );
}

export function getCachedChestSnapshot(): ChestSnapshotDto | null {
  if (memoryChestSnapshot) return memoryChestSnapshot;

  try {
    const raw = window.sessionStorage.getItem(CHEST_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isChestSnapshot(parsed)) {
      window.sessionStorage.removeItem(CHEST_CACHE_KEY);
      return null;
    }
    memoryChestSnapshot = parsed;
    return memoryChestSnapshot;
  } catch {
    return null;
  }
}

function cacheChestSnapshot(snapshot: ChestSnapshotDto) {
  memoryChestSnapshot = snapshot;
  try {
    window.sessionStorage.setItem(CHEST_CACHE_KEY, JSON.stringify(snapshot));
  } catch {}
}

function cacheChestPayload<T>(payload: T): T {
  if (isChestSnapshot(payload)) {
    cacheChestSnapshot(payload);
    return payload;
  }

  if (payload && typeof payload === "object") {
    const nested = (payload as { snapshot?: unknown }).snapshot;
    if (isChestSnapshot(nested)) cacheChestSnapshot(nested);
  }

  return payload;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error("TAILBLUE_API_NOT_CONFIGURED");

  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const accessToken = getDesktopAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "omit",
    headers,
  });

  if (!response.ok) {
    let message = `Erreur API ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === "string") message = body.detail;
      else if (typeof body?.message === "string") message = body.message;
    } catch {
      // Le statut HTTP suffit.
    }
    throw new Error(message);
  }

  const payload = (await response.json()) as T;
  return cacheChestPayload(payload);
}

export const chestApi = {
  snapshot(): Promise<ChestSnapshotDto> {
    return request<ChestSnapshotDto>("/api/adventure/chests");
  },

  open(): Promise<ChestOpenResultDto> {
    return request<ChestOpenResultDto>("/api/adventure/chests/open", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  resolveMystery(eventId: string, sequence: string[]): Promise<ChestMysteryResolveDto> {
    return request<ChestMysteryResolveDto>("/api/adventure/chests/mystery/resolve", {
      method: "POST",
      body: JSON.stringify({ eventId, sequence }),
    });
  },

  revealBonusCard(eventId: string, cardId: string): Promise<ChestBonusCardRevealDto> {
    return request<ChestBonusCardRevealDto>("/api/adventure/chests/bonus/card/reveal", {
      method: "POST",
      body: JSON.stringify({ eventId, cardId }),
    });
  },

  claimScratchBonus(eventId: string): Promise<ChestBonusScratchClaimDto> {
    return request<ChestBonusScratchClaimDto>("/api/adventure/chests/bonus/scratch/claim", {
      method: "POST",
      body: JSON.stringify({ eventId }),
    });
  },
};
