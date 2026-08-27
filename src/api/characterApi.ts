import {
  CHARACTER_PREVIEW,
  getPreviewCharacterDetail,
} from "../data/characterPreviewData";
import type {
  CharacterDetail,
  CharacterDetailKind,
  CharacterSnapshot,
} from "../types/character";
import { getDesktopAccessToken } from "./homeApi";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const characterApiConfigured = Boolean(API_BASE);


const CHARACTER_CACHE_KEY =
  "tailblue.character.snapshot.v1";

type CharacterCacheEnvelope = {
  cachedAt: number;
  snapshot: CharacterSnapshot;
};

let memoryCharacterCache:
  | CharacterCacheEnvelope
  | null = null;

// TAILBLUE_POLISH_PACK_V3_20260826
const memoryCharacterDetailCache =
  new Map<CharacterDetailKind, CharacterDetail | null>();

const inflightCharacterDetails =
  new Map<CharacterDetailKind, Promise<CharacterDetail | null>>();

export function getCachedCharacterDetail(
  kind: CharacterDetailKind,
): CharacterDetail | null | undefined {
  return memoryCharacterDetailCache.get(kind);
}

export function prefetchCharacterDetails(
  kinds: CharacterDetailKind[],
): void {
  if (!characterApiConfigured) return;

  for (const kind of [...new Set(kinds)]) {
    if (
      memoryCharacterDetailCache.has(kind) ||
      inflightCharacterDetails.has(kind)
    ) {
      continue;
    }

    void loadCharacterDetail(kind).catch(() => {});
  }
}

function isCharacterSnapshot(
  value: unknown,
): value is CharacterSnapshot {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<CharacterSnapshot>;

  return (
    typeof candidate.generatedAt === "string" &&
    (candidate.mode === "api" ||
      candidate.mode === "preview") &&
    Boolean(candidate.profile) &&
    Boolean(candidate.combat) &&
    Boolean(candidate.activity) &&
    Array.isArray(candidate.identity)
  );
}

function readCharacterCache():
  | CharacterCacheEnvelope
  | null {
  if (memoryCharacterCache) {
    return memoryCharacterCache;
  }

  try {
    const raw = window.sessionStorage.getItem(
      CHARACTER_CACHE_KEY,
    );

    if (!raw) return null;

    const parsed = JSON.parse(
      raw,
    ) as Partial<CharacterCacheEnvelope>;

    /*
     * On ne restaure JAMAIS un ancien aperçu local comme
     * s'il s'agissait d'une vraie fiche mise en cache.
     */
    if (
      typeof parsed.cachedAt !== "number" ||
      !isCharacterSnapshot(parsed.snapshot) ||
      parsed.snapshot.mode !== "api"
    ) {
      window.sessionStorage.removeItem(
        CHARACTER_CACHE_KEY,
      );
      return null;
    }

    memoryCharacterCache = {
      cachedAt: parsed.cachedAt,
      snapshot: parsed.snapshot,
    };

    return memoryCharacterCache;
  } catch {
    return null;
  }
}

export function getCachedCharacterSnapshot():
  | CharacterSnapshot
  | null {
  return readCharacterCache()?.snapshot ?? null;
}

export function isCharacterCacheFresh(
  maxAgeMs = 20_000,
): boolean {
  const cached = readCharacterCache();
  if (!cached) return false;

  return Date.now() - cached.cachedAt <= maxAgeMs;
}

export function cacheCharacterSnapshot(
  snapshot: CharacterSnapshot,
): CharacterSnapshot {
  /*
   * Le mock/aperçu ne doit jamais devenir la donnée affichée
   * au prochain retour sur la page.
   */
  if (snapshot.mode !== "api") {
    return snapshot;
  }

  const envelope: CharacterCacheEnvelope = {
    cachedAt: Date.now(),
    snapshot,
  };

  memoryCharacterCache = envelope;

  try {
    window.sessionStorage.setItem(
      CHARACTER_CACHE_KEY,
      JSON.stringify(envelope),
    );
  } catch {
    // Le cache mémoire suffit si le stockage WebView est indisponible.
  }

  return snapshot;
}

function resolveApiAssets<T>(value: T): T {
  if (!API_BASE) return value;

  if (
    typeof value === "string" &&
    value.startsWith("/api/assets/game/")
  ) {
    return `${API_BASE}${value}` as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveApiAssets(item)) as T;
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(source)) {
      result[key] = resolveApiAssets(item);
    }

    return result as T;
  }

  return value;
}

async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_BASE) {
    throw new Error("API TailBlue non configurée.");
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const accessToken = getDesktopAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

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

  const payload = (await response.json()) as T;
  return resolveApiAssets(payload);
}

export async function loadCharacterSnapshot(
  signal?: AbortSignal,
): Promise<CharacterSnapshot> {
  if (!API_BASE) {
    return {
      ...CHARACTER_PREVIEW,
      generatedAt: new Date().toISOString(),
      identity: CHARACTER_PREVIEW.identity.map((item) => ({
        ...item,
      })),
    };
  }

  const snapshot =
    await fetchJson<CharacterSnapshot>(
      "/api/character",
      {
        signal,
      },
    );

  return cacheCharacterSnapshot(snapshot);
}

export async function loadCharacterDetail(
  kind: CharacterDetailKind,
  signal?: AbortSignal,
): Promise<CharacterDetail | null> {
  if (!API_BASE) {
    const preview = getPreviewCharacterDetail(kind);
    memoryCharacterDetailCache.set(kind, preview);
    return preview;
  }

  if (!signal) {
    const inflight = inflightCharacterDetails.get(kind);
    if (inflight) return inflight;
  }

  const request = fetchJson<CharacterDetail | null>(
    `/api/character/details/${encodeURIComponent(kind)}`,
    { signal },
  ).then((detail) => {
    memoryCharacterDetailCache.set(kind, detail);
    return detail;
  });

  if (signal) return request;

  inflightCharacterDetails.set(kind, request);
  try {
    return await request;
  } finally {
    inflightCharacterDetails.delete(kind);
  }
}

/*
 * EventSource natif ne permet pas d'envoyer Authorization: Bearer.
 * On garde donc le polling sécurisé tant que le flux temps réel authentifié
 * (WebSocket / fetch-SSE / ticket court) n'est pas branché.
 */
export function openCharacterStream(
  _onChange: () => void,
): () => void {
  return () => undefined;
}
