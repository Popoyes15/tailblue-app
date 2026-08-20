import { getDesktopAccessToken } from "./homeApi";
import {
  getPreviewRecipe,
  INVENTORY_PREVIEW,
} from "../data/inventoryPreviewData";
import type {
  ClassicInventorySellResultDto,
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


const INVENTORY_CACHE_KEY =
  "tailblue.inventory.snapshot.v1";

type InventoryCacheEnvelope = {
  cachedAt: number;
  snapshot: InventorySnapshotDto;
};

let memoryInventoryCache:
  | InventoryCacheEnvelope
  | null = null;

function isInventorySnapshot(
  value: unknown,
): value is InventorySnapshotDto {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<InventorySnapshotDto>;

  return (
    typeof candidate.generatedAt === "string" &&
    Array.isArray(candidate.items) &&
    Boolean(candidate.equipment) &&
    Boolean(candidate.craft)
  );
}

function readInventoryCache():
  | InventoryCacheEnvelope
  | null {
  if (memoryInventoryCache) {
    return memoryInventoryCache;
  }

  try {
    const raw = window.sessionStorage.getItem(
      INVENTORY_CACHE_KEY,
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<InventoryCacheEnvelope>;

    if (
      typeof parsed.cachedAt !== "number" ||
      !isInventorySnapshot(parsed.snapshot)
    ) {
      window.sessionStorage.removeItem(
        INVENTORY_CACHE_KEY,
      );
      return null;
    }

    memoryInventoryCache = {
      cachedAt: parsed.cachedAt,
      snapshot: parsed.snapshot,
    };

    return memoryInventoryCache;
  } catch {
    return null;
  }
}

export function getCachedInventorySnapshot():
  | InventorySnapshotDto
  | null {
  return readInventoryCache()?.snapshot ?? null;
}

export function isInventoryCacheFresh(
  maxAgeMs = 20_000,
): boolean {
  const cached = readInventoryCache();
  if (!cached) return false;

  return Date.now() - cached.cachedAt <= maxAgeMs;
}

export function cacheInventorySnapshot(
  snapshot: InventorySnapshotDto,
): InventorySnapshotDto {
  const envelope: InventoryCacheEnvelope = {
    cachedAt: Date.now(),
    snapshot,
  };

  memoryInventoryCache = envelope;

  try {
    window.sessionStorage.setItem(
      INVENTORY_CACHE_KEY,
      JSON.stringify(envelope),
    );
  } catch {
    // Le cache mémoire suffit si le stockage WebView est indisponible.
  }

  return snapshot;
}

function mergeClassicInventoryIntoCache(
  classicInventory: ClassicInventorySellResultDto["classicInventory"],
): void {
  const cached = getCachedInventorySnapshot();
  if (!cached) return;

  cacheInventorySnapshot({
    ...cached,
    generatedAt: new Date().toISOString(),
    classicInventory,
  });
}

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

  const snapshot =
    await fetchJson<InventorySnapshotDto>(
      "/api/inventory",
      {
        signal,
      },
    );

  return cacheInventorySnapshot(snapshot);
}

export async function equipInventoryItem(
  itemId: string,
): Promise<EquipResultDto> {
  const result = await fetchJson<EquipResultDto>(
    "/api/inventory/equipment/equip",
    {
      method: "POST",
      body: JSON.stringify({ itemId }),
    },
  );

  cacheInventorySnapshot(result.snapshot);
  return result;
}

export async function unequipInventorySlot(
  slot: EquipmentSlot,
): Promise<EquipResultDto> {
  const result = await fetchJson<EquipResultDto>(
    "/api/inventory/equipment/unequip",
    {
      method: "POST",
      body: JSON.stringify({ slot }),
    },
  );

  cacheInventorySnapshot(result.snapshot);
  return result;
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
  const result =
    await fetchJson<CraftResultDto>(
      "/api/inventory/craft",
      {
        method: "POST",
        body: JSON.stringify({
          itemId,
          quantity,
        }),
      },
    );

  cacheInventorySnapshot(result.snapshot);
  return result;
}

export async function sellClassicInventoryItem(
  key: string,
  quantity: number,
): Promise<ClassicInventorySellResultDto> {
  const result =
    await fetchJson<ClassicInventorySellResultDto>(
      "/api/inventory/classic/sell",
      {
        method: "POST",
        body: JSON.stringify({ key, quantity }),
      },
    );

  mergeClassicInventoryIntoCache(
    result.classicInventory,
  );

  return result;
}

export function openInventoryStream(
  _onChange: () => void,
): () => void {
  // EventSource ne permet pas d'ajouter Authorization: Bearer.
  // Le rafraîchissement périodique de la page reste actif ; le temps réel
  // sera branché plus tard via un transport authentifié.
  return () => undefined;
}
