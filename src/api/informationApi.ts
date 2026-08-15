import { PREVIEW_ROADMAP, PREVIEW_UPDATES } from "../data/informationPreviewData";
import type {
  RoadmapItem,
  RoadmapSnapshot,
  TailBlueUpdateArticle,
  UpdateFeedSnapshot,
  UpdateImportance,
} from "../types/information";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};
const RAW_API_BASE = String(ENV.VITE_TAILBLUE_API_URL ?? "").trim();
const API_BASE = RAW_API_BASE.replace(/\/$/, "");
const IS_DEV = Boolean(ENV.DEV) || String(ENV.MODE ?? "") === "development";
const LIVE_ENABLED = String(ENV.VITE_TAILBLUE_ENABLE_LIVE_INFO ?? "false").toLowerCase() === "true";

function absoluteAsset(value: string): string {
  const item = String(value ?? "").trim();
  if (!item || !API_BASE || !item.startsWith("/")) return item;
  return `${API_BASE}${item}`;
}

function importance(value: unknown): UpdateImportance {
  const current = String(value ?? "standard").toLowerCase();
  if (["info", "standard", "important", "urgent", "success"].includes(current)) {
    return current as UpdateImportance;
  }
  return "standard";
}

function normalizeUpdate(raw: unknown): TailBlueUpdateArticle | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const title = String(value.title ?? "").trim();
  const body = String(value.body ?? value.text ?? "").trim();
  if (!title || !body) return null;

  const imagesRaw = Array.isArray(value.images)
    ? value.images
    : Array.isArray(value.image_urls)
      ? value.image_urls
      : value.cover_image
        ? [value.cover_image]
        : [];

  const images = imagesRaw.map((item) => absoluteAsset(String(item ?? ""))).filter(Boolean);
  const excerpt = String(value.excerpt ?? "").trim() || body.replace(/\s+/g, " ").slice(0, 220);

  return {
    id: String(value.id ?? `${title}-${String(value.published_at ?? value.publishedAt ?? "")}`),
    title,
    body,
    excerpt,
    publishedAt: String(value.published_at ?? value.publishedAt ?? ""),
    images,
    tag: String(value.tag ?? "Mise à jour"),
    author: value.author ? String(value.author) : undefined,
    importance: importance(value.importance),
    source: "api",
  };
}

function normalizeRoadmap(raw: unknown): RoadmapItem | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const id = String(value.id ?? "").trim();
  const title = String(value.title ?? "").trim();
  const description = String(value.description ?? "").trim();
  const statusRaw = String(value.status ?? "later").toLowerCase();
  const status = ["done", "current", "next", "later", "paused"].includes(statusRaw)
    ? (statusRaw as RoadmapItem["status"])
    : "later";
  if (!id || !title || !description) return null;

  const rawProgress = Number(value.progress);
  return {
    id,
    title,
    description,
    status,
    area: value.area ? String(value.area) : undefined,
    target: value.target ? String(value.target) : undefined,
    progress: Number.isFinite(rawProgress) ? Math.max(0, Math.min(100, rawProgress)) : undefined,
  };
}

export function hasInformationApi(): boolean {
  return Boolean(API_BASE);
}

export async function loadUpdatesSnapshot(signal?: AbortSignal): Promise<UpdateFeedSnapshot> {
  if (!API_BASE) {
    return IS_DEV
      ? { articles: PREVIEW_UPDATES, connected: false, mode: "preview" }
      : { articles: [], connected: false, mode: "offline", error: "API TailBlue non configurée." };
  }

  try {
    const response = await fetch(`${API_BASE}/api/updates`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const rows: unknown[] = Array.isArray(payload) ? payload : Array.isArray(payload?.updates) ? payload.updates : [];
    const articles = rows.map(normalizeUpdate).filter((item): item is TailBlueUpdateArticle => Boolean(item));
    return { articles, connected: true, mode: "api" };
  } catch (error) {
    if (signal?.aborted) throw error;
    return IS_DEV
      ? { articles: PREVIEW_UPDATES, connected: false, mode: "preview", error: String(error) }
      : { articles: [], connected: false, mode: "offline", error: String(error) };
  }
}

export async function loadRoadmapSnapshot(signal?: AbortSignal): Promise<RoadmapSnapshot> {
  if (!API_BASE) {
    return IS_DEV
      ? { items: PREVIEW_ROADMAP, connected: false, mode: "preview" }
      : { items: [], connected: false, mode: "offline", error: "API TailBlue non configurée." };
  }

  try {
    const response = await fetch(`${API_BASE}/api/roadmap`, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "include",
      signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const rows: unknown[] = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    const items = rows.map(normalizeRoadmap).filter((item): item is RoadmapItem => Boolean(item));
    return {
      items,
      connected: true,
      mode: "api",
      updatedAt: payload?.updated_at ? String(payload.updated_at) : undefined,
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return IS_DEV
      ? { items: PREVIEW_ROADMAP, connected: false, mode: "preview", error: String(error) }
      : { items: [], connected: false, mode: "offline", error: String(error) };
  }
}

/**
 * Flux optionnel pour le futur backend hébergé.
 * Active-le avec VITE_TAILBLUE_ENABLE_LIVE_INFO=true.
 * Le serveur doit envoyer du SSE sur /api/information/stream avec :
 * data: {"type":"updates"} ou {"type":"roadmap"} ou {"type":"all"}
 */
export function subscribeInformation(onChange: (type: "updates" | "roadmap" | "all") => void): () => void {
  if (!API_BASE || !LIVE_ENABLED || typeof EventSource === "undefined") return () => undefined;
  const source = new EventSource(`${API_BASE}/api/information/stream`, { withCredentials: true });
  source.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as { type?: string };
      const type = payload.type;
      if (type === "updates" || type === "roadmap" || type === "all") onChange(type);
    } catch {
      // Un keepalive ou un message inconnu ne doit jamais casser la page.
    }
  };
  return () => source.close();
}
