import { getDesktopAccessToken, refreshDesktopSession } from "./homeApi";
import type { MineSnapshot } from "../types/mine";

const API_URL = String(import.meta.env.VITE_TAILBLUE_API_URL ?? "").replace(/\/+$/, "");
const MINE_CACHE_KEY = "tailblue.mine.snapshot.v1";

type CacheEnvelope = { cachedAt: number; snapshot: MineSnapshot };
let mineMemory: CacheEnvelope | null = null;

function readCache(): CacheEnvelope | null {
  if (mineMemory) return mineMemory;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(MINE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope;
    if (!parsed?.snapshot || typeof parsed.cachedAt !== "number") return null;
    mineMemory = parsed;
    return parsed;
  } catch { return null; }
}

export function getCachedMineSnapshot(): MineSnapshot | null {
  return readCache()?.snapshot ?? null;
}

export function cacheMineSnapshot(snapshot: MineSnapshot): MineSnapshot {
  const envelope = { cachedAt: Date.now(), snapshot };
  mineMemory = envelope;
  if (typeof window !== "undefined") {
    try { window.sessionStorage.setItem(MINE_CACHE_KEY, JSON.stringify(envelope)); } catch { /* mémoire seulement */ }
  }
  return snapshot;
}

export function clearMineSnapshotCache() {
  mineMemory = null;
  if (typeof window !== "undefined") window.sessionStorage.removeItem(MINE_CACHE_KEY);
}

async function responseError(response: Response) {
  let detail = `Erreur TailBlue (${response.status})`;
  try {
    const body = await response.json() as { detail?: string; message?: string };
    detail = body.detail || body.message || detail;
  } catch { /* réponse non JSON */ }
  return new Error(detail);
}

async function request<T>(path: string, init: RequestInit = {}, allowRefresh = true): Promise<T> {
  if (!API_URL) throw new Error("L'URL de l'API TailBlue n'est pas configurée.");
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getDesktopAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(`${API_URL}${path}`, { ...init, credentials: "omit", headers });
  if (response.status === 401 && allowRefresh) {
    const refreshed = await refreshDesktopSession();
    if (refreshed?.accessToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);
      response = await fetch(`${API_URL}${path}`, { ...init, credentials: "omit", headers: retryHeaders });
    }
  }
  if (!response.ok) throw await responseError(response);
  return await response.json() as T;
}

async function snapshotRequest(path: string, init: RequestInit = {}): Promise<MineSnapshot> {
  return cacheMineSnapshot(await request<MineSnapshot>(path, init));
}
function post(path: string, body?: unknown) {
  return snapshotRequest(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
}

export const mineApi = {
  configured: Boolean(API_URL),
  snapshot: () => snapshotRequest("/api/mine"),
  enter: (companionId?: string | null) => post("/api/mine/enter", { companionId: companionId || null }),
  leave: () => post("/api/mine/leave"),
  action: (action: string, options: { direction?: string; targetId?: string } = {}) => post("/api/mine/action", { action, direction: options.direction ?? null, targetId: options.targetId ?? null }),
  usePotion: (itemId: string) => post("/api/mine/potion", { itemId }),
  feedCompanion: (foodId: string) => post("/api/mine/companion/feed", { foodId }),
  cuddleCompanion: () => post("/api/mine/companion/cuddle"),
  combat: (action: "attack" | "defend" | "flee" | "skill" | "item", options: { skillId?: string; itemId?: string } = {}) => post("/api/mine/combat/action", { action, skillId: options.skillId ?? null, itemId: options.itemId ?? null }),
};
