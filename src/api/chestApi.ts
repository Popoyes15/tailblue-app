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

  return response.json() as Promise<T>;
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
