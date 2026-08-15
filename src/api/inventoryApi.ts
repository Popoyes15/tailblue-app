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

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
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
  onChange: () => void,
): () => void {
  if (!API_BASE || typeof EventSource === "undefined") {
    return () => undefined;
  }

  const source = new EventSource(
    `${API_BASE}/api/inventory/stream`,
    { withCredentials: true },
  );

  source.addEventListener("inventory", onChange);
  source.addEventListener("equipment", onChange);
  source.addEventListener("craft", onChange);

  return () => source.close();
}
