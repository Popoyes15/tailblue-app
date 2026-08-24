import {
  getDesktopAccessToken,
  refreshDesktopSession,
} from "./homeApi";
import type {
  AdoptionResultDto,
  BreedingSnapshotDto,
  CompanionSnapshotDto,
  FeedResultDto,
  PettingResultDto,
  KennelSnapshotDto,
  ProvisionSnapshotDto,
} from "../types/companions";

const RAW_API_URL = String(
  import.meta.env.VITE_TAILBLUE_API_URL ?? "",
).trim();
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const companionApiConfigured = Boolean(API_URL);

const COMPANION_CACHE_KEY = "tailblue.companions.snapshot.v2";
const KENNEL_CACHE_KEY = "tailblue.kennel.snapshot.v2";
const PROVISION_CACHE_KEY = "tailblue.provisions.snapshot.v2";
const BREEDING_CACHE_KEY = "tailblue.breeding.snapshot.v2";

type CacheEnvelope<T> = {
  cachedAt: number;
  snapshot: T;
};

export type CompanionSaleResultDto = {
  ok: boolean;
  text: string;
  price: number;
  petId: string;
  isDragon: boolean;
  companions: CompanionSnapshotDto;
};

let companionMemory: CacheEnvelope<CompanionSnapshotDto> | null = null;
let kennelMemory: CacheEnvelope<KennelSnapshotDto> | null = null;
let provisionMemory: CacheEnvelope<ProvisionSnapshotDto> | null = null;
let breedingMemory: CacheEnvelope<BreedingSnapshotDto> | null = null;

function readCache<T>(
  key: string,
  memory: CacheEnvelope<T> | null,
): CacheEnvelope<T> | null {
  if (memory) return memory;
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed.cachedAt !== "number" || !parsed.snapshot) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, snapshot: T): CacheEnvelope<T> {
  const envelope = { cachedAt: Date.now(), snapshot };
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(envelope));
    } catch {
      // Le cache mémoire reste suffisant si WebView refuse le stockage.
    }
  }
  return envelope;
}

function resolveAssetPath(path: string | null | undefined): string {
  const value = String(path ?? "").trim();
  if (!value || !API_URL) return value;
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) return value;
  if (value.startsWith("/api/assets/game/")) return `${API_URL}${value}`;
  return `${API_URL}/api/assets/game/${value.replace(/^\/+/, "")}`;
}

function resolveCompanions(snapshot: CompanionSnapshotDto): CompanionSnapshotDto {
  return {
    ...snapshot,
    catalog: snapshot.catalog.map((pet) => ({
      ...pet,
      image: resolveAssetPath(pet.image),
      forms: pet.forms.map((form) => ({
        ...form,
        image: form.image ? resolveAssetPath(form.image) : form.image,
      })),
    })),
    owned: snapshot.owned.map((pet) => ({
      ...pet,
      currentImage: pet.currentImage
        ? resolveAssetPath(pet.currentImage)
        : pet.currentImage,
    })),
  };
}

function resolveKennel(snapshot: KennelSnapshotDto): KennelSnapshotDto {
  const mapOne = (item: KennelSnapshotDto["gallery"][number]) => ({
    ...item,
    image: resolveAssetPath(item.image),
  });
  return {
    ...snapshot,
    currentKennel: snapshot.currentKennel
      ? mapOne(snapshot.currentKennel)
      : null,
    gallery: snapshot.gallery.map(mapOne),
  };
}

function resolveProvisions(snapshot: ProvisionSnapshotDto): ProvisionSnapshotDto {
  const mapLevel = (level: ProvisionSnapshotDto["current"]) => ({
    ...level,
    image: resolveAssetPath(level.image),
  });
  return {
    ...snapshot,
    current: mapLevel(snapshot.current),
    levels: snapshot.levels.map(mapLevel),
    nextLevel: snapshot.nextLevel ? mapLevel(snapshot.nextLevel) : null,
  };
}

function resolveBreeding(snapshot: BreedingSnapshotDto): BreedingSnapshotDto {
  return {
    ...snapshot,
    eggImage: snapshot.eggImage
      ? resolveAssetPath(snapshot.eggImage)
      : snapshot.eggImage,
    lineages: snapshot.lineages.map((dragon) => ({
      ...dragon,
      image: resolveAssetPath(dragon.image),
    })),
    obtainedDragon: snapshot.obtainedDragon
      ? {
          ...snapshot.obtainedDragon,
          image: resolveAssetPath(snapshot.obtainedDragon.image),
        }
      : snapshot.obtainedDragon,
  };
}

export function getCachedCompanionSnapshot(): CompanionSnapshotDto | null {
  const cached = readCache(COMPANION_CACHE_KEY, companionMemory);
  if (!cached) return null;
  companionMemory = cached;
  return cached.snapshot;
}

export function getCachedKennelSnapshot(): KennelSnapshotDto | null {
  const cached = readCache(KENNEL_CACHE_KEY, kennelMemory);
  if (!cached) return null;
  kennelMemory = cached;
  return cached.snapshot;
}

export function getCachedProvisionSnapshot(): ProvisionSnapshotDto | null {
  const cached = readCache(PROVISION_CACHE_KEY, provisionMemory);
  if (!cached) return null;
  provisionMemory = cached;
  return cached.snapshot;
}

export function getCachedBreedingSnapshot(): BreedingSnapshotDto | null {
  const cached = readCache(BREEDING_CACHE_KEY, breedingMemory);
  if (!cached) return null;
  breedingMemory = cached;
  return cached.snapshot;
}

export function cacheCompanionSnapshot(snapshot: CompanionSnapshotDto): CompanionSnapshotDto {
  const resolved = resolveCompanions(snapshot);
  companionMemory = writeCache(COMPANION_CACHE_KEY, resolved);
  return resolved;
}

export function cacheKennelSnapshot(snapshot: KennelSnapshotDto): KennelSnapshotDto {
  const resolved = resolveKennel(snapshot);
  kennelMemory = writeCache(KENNEL_CACHE_KEY, resolved);
  return resolved;
}

export function cacheProvisionSnapshot(snapshot: ProvisionSnapshotDto): ProvisionSnapshotDto {
  const resolved = resolveProvisions(snapshot);
  provisionMemory = writeCache(PROVISION_CACHE_KEY, resolved);
  return resolved;
}

export function cacheBreedingSnapshot(snapshot: BreedingSnapshotDto): BreedingSnapshotDto {
  const resolved = resolveBreeding(snapshot);
  breedingMemory = writeCache(BREEDING_CACHE_KEY, resolved);
  return resolved;
}

async function responseError(response: Response): Promise<Error> {
  let message = `Erreur TailBlue ${response.status}`;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") message = body.detail;
    else if (typeof body?.message === "string") message = body.message;
  } catch {
    // Le statut HTTP reste exploitable.
  }
  return new Error(message);
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  if (!API_URL) throw new Error("TAILBLUE_API_NOT_CONFIGURED");

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getDesktopAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "omit",
    headers,
  });

  if (response.status === 401 && allowRefresh) {
    const refreshed = await refreshDesktopSession();
    if (refreshed?.accessToken) {
      const retryHeaders = new Headers(init.headers);
      retryHeaders.set("Accept", "application/json");
      if (init.body !== undefined && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        credentials: "omit",
        headers: retryHeaders,
      });
    }
  }

  if (!response.ok) throw await responseError(response);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const companionApi = {
  async getCompanions(): Promise<CompanionSnapshotDto> {
    return cacheCompanionSnapshot(
      await request<CompanionSnapshotDto>("/api/companions"),
    );
  },

  async adopt(petId: string): Promise<AdoptionResultDto> {
    const result = await request<AdoptionResultDto>(
      `/api/companions/${encodeURIComponent(petId)}/adopt`,
      { method: "POST", body: JSON.stringify({}) },
    );
    result.companions = cacheCompanionSnapshot(result.companions);
    if (result.kennel) result.kennel = cacheKennelSnapshot(result.kennel);
    return result;
  },

  async sell(petId: string): Promise<CompanionSaleResultDto> {
    const result = await request<CompanionSaleResultDto>(
      `/api/companions/${encodeURIComponent(petId)}/sell`,
      { method: "POST", body: JSON.stringify({}) },
    );
    result.companions = cacheCompanionSnapshot(result.companions);
    return result;
  },

  async setActive(petId: string, active: boolean): Promise<CompanionSnapshotDto> {
    return cacheCompanionSnapshot(
      await request<CompanionSnapshotDto>(
        `/api/companions/${encodeURIComponent(petId)}/active`,
        { method: "POST", body: JSON.stringify({ active }) },
      ),
    );
  },

  async pet(petId: string): Promise<PettingResultDto> {
    const result = await request<PettingResultDto>(
      `/api/companions/${encodeURIComponent(petId)}/pet`,
      { method: "POST", body: JSON.stringify({}) },
    );
    result.companions = cacheCompanionSnapshot(result.companions);
    return result;
  },

  async rename(petId: string, nickname: string): Promise<CompanionSnapshotDto> {
    return cacheCompanionSnapshot(
      await request<CompanionSnapshotDto>(
        `/api/companions/${encodeURIComponent(petId)}/nickname`,
        { method: "PATCH", body: JSON.stringify({ nickname }) },
      ),
    );
  },

  async feed(petId: string, foodId: string): Promise<FeedResultDto> {
    const result = await request<FeedResultDto>(
      `/api/companions/${encodeURIComponent(petId)}/feed`,
      { method: "POST", body: JSON.stringify({ foodId }) },
    );
    result.companions = cacheCompanionSnapshot(result.companions);
    if (result.provisions) {
      result.provisions = cacheProvisionSnapshot(result.provisions);
    }
    return result;
  },

  async getKennel(): Promise<KennelSnapshotDto> {
    return cacheKennelSnapshot(await request<KennelSnapshotDto>("/api/kennel"));
  },

  async upgradeKennel(kennelId: string): Promise<KennelSnapshotDto> {
    return cacheKennelSnapshot(
      await request<KennelSnapshotDto>("/api/kennel/upgrade", {
        method: "POST",
        body: JSON.stringify({ kennelId }),
      }),
    );
  },

  async getProvisions(): Promise<ProvisionSnapshotDto> {
    return cacheProvisionSnapshot(
      await request<ProvisionSnapshotDto>("/api/provisions"),
    );
  },

  async buyFood(foodId: string, quantity: number): Promise<ProvisionSnapshotDto> {
    return cacheProvisionSnapshot(
      await request<ProvisionSnapshotDto>("/api/provisions/buy", {
        method: "POST",
        body: JSON.stringify({ foodId, quantity }),
      }),
    );
  },

  async upgradeProvisions(): Promise<ProvisionSnapshotDto> {
    return cacheProvisionSnapshot(
      await request<ProvisionSnapshotDto>("/api/provisions/upgrade", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
  },

  async getBreeding(): Promise<BreedingSnapshotDto> {
    return cacheBreedingSnapshot(
      await request<BreedingSnapshotDto>("/api/breeding"),
    );
  },

  async hatchOriginsEgg(): Promise<BreedingSnapshotDto> {
    const result = cacheBreedingSnapshot(
      await request<BreedingSnapshotDto>("/api/breeding/hatch", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
    // L'éclosion modifie aussi la liste des compagnons : on la revalide
    // silencieusement au prochain accès au catalogue.
    companionMemory = null;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(COMPANION_CACHE_KEY);
    }
    return result;
  },
};