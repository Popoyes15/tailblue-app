// TAILBLUE_BESTIARY_DESKTOP_V1_20260826
import type { GuildBestiarySnapshot } from "../types/bestiary";
import { getDesktopAccessToken } from "./homeApi";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};
const RAW_API_BASE = String(ENV.VITE_TAILBLUE_API_URL ?? "").trim();
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const bestiaryApiConfigured = Boolean(API_BASE);

const CACHE_KEY = "tailblue.guild.bestiary.v1";
type CacheEnvelope = { cachedAt: number; snapshot: GuildBestiarySnapshot };
let memoryCache: CacheEnvelope | null = null;

function isSnapshot(value: unknown): value is GuildBestiarySnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<GuildBestiarySnapshot>;
  return (
    typeof candidate.generatedAt === "string" &&
    typeof candidate.guildName === "string" &&
    Boolean(candidate.summary) &&
    Array.isArray(candidate.families)
  );
}

function readCache(): CacheEnvelope | null {
  if (memoryCache) return memoryCache;
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CacheEnvelope>;
    if (typeof parsed.cachedAt !== "number" || !isSnapshot(parsed.snapshot)) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    memoryCache = { cachedAt: parsed.cachedAt, snapshot: parsed.snapshot };
    return memoryCache;
  } catch {
    return null;
  }
}

export function getCachedGuildBestiary(): GuildBestiarySnapshot | null {
  return readCache()?.snapshot ?? null;
}

function cacheSnapshot(snapshot: GuildBestiarySnapshot): GuildBestiarySnapshot {
  const envelope = { cachedAt: Date.now(), snapshot };
  memoryCache = envelope;
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    // Le cache mémoire suffit si sessionStorage est indisponible.
  }
  return snapshot;
}

function resolveAssets<T>(value: T): T {
  if (!API_BASE) return value;
  if (typeof value === "string" && value.startsWith("/api/assets/game/")) {
    return `${API_BASE}${value}` as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveAssets(item)) as T;
  }
  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      result[key] = resolveAssets(item);
    }
    return result as T;
  }
  return value;
}

export async function loadGuildBestiary(signal?: AbortSignal): Promise<GuildBestiarySnapshot> {
  if (!API_BASE) throw new Error("API TailBlue non configurée.");
  const headers = new Headers({ Accept: "application/json" });
  const accessToken = getDesktopAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE}/api/guild/bestiary`, {
    method: "GET",
    credentials: "omit",
    headers,
    signal,
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

  const payload = resolveAssets((await response.json()) as GuildBestiarySnapshot);
  return cacheSnapshot(payload);
}
