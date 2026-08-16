import { getDesktopAccessToken } from "./homeApi";
import {
  getPreviewRecipe,
  INVENTORY_PREVIEW,
} from "../data/inventoryPreviewData";
import type {
  CraftRecipeDetailDto,
  CraftResultDto,
  EquipmentSlot,
  EquipResultDto,
  InventorySnapshotDto,
} from "../types/inventory";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const inventoryApiConfigured = Boolean(API_BASE);

async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_BASE) {
    throw new Error("API TailBlue non configurée.");
  }

  const token = getDesktopAccessToken();
  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "omit",
    headers,
  });

  if (!response.ok) {
    let detail = `Erreur TailBlue ${response.status}`;

    try {
      const payload = await response.json();
      if (payload?.detail) detail = String(payload.detail);
    } catch {
      // réponse non JSON
    }

    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export async function loadInventorySnapshot(
  signal?: AbortSignal,
): Promise<InventorySnapshotDto> {
  if (!API_BASE) {
    return {
      ...INVENTORY_PREVIEW,
      generatedAt: new Date().toISOString(),
      items: INVENTORY_PREVIEW.items.map((item) => ({
        ...item,
      })),
    };
  }

  return fetchJson<InventorySnapshotDto>("/api/inventory", {
    signal,
  });
}

export async function equipInventoryItem(
  itemId: string,
): Promise<EquipResultDto> {
  return fetchJson<EquipResultDto>(
    "/api/inventory/equipment/equip",
    {
      method: "POST",
      body: JSON.stringify({ itemId }),
    },
  );
}

export async function unequipInventorySlot(
  slot: EquipmentSlot,
): Promise<EquipResultDto> {
  return fetchJson<EquipResultDto>(
    "/api/inventory/equipment/unequip",
    {
      method: "POST",
      body: JSON.stringify({ slot }),
    },
  );
}

export async function loadCraftRecipe(
  itemId: string,
  signal?: AbortSignal,
): Promise<CraftRecipeDetailDto | null> {
  if (!API_BASE) {
    return getPreviewRecipe(itemId);
  }

  return fetchJson<CraftRecipeDetailDto | null>(
    `/api/inventory/craft/recipe/${encodeURIComponent(itemId)}`,
    { signal },
  );
}

export async function craftInventoryItem(
  itemId: string,
  quantity: number,
): Promise<CraftResultDto> {
  return fetchJson<CraftResultDto>("/api/inventory/craft", {
    method: "POST",
    body: JSON.stringify({
      itemId,
      quantity,
    }),
  });
}

export function openInventoryStream(
  _onChange: () => void,
): () => void {
  // EventSource ne permet pas d'ajouter Authorization: Bearer.
  // Le rafraîchissement périodique de la page reste actif ; le temps réel
  // sera branché plus tard via un transport authentifié.
  return () => undefined;
}
