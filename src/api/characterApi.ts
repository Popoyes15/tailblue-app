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

  return fetchJson<CharacterSnapshot>("/api/character", {
    signal,
  });
}

export async function loadCharacterDetail(
  kind: CharacterDetailKind,
  signal?: AbortSignal,
): Promise<CharacterDetail | null> {
  if (!API_BASE) {
    return getPreviewCharacterDetail(kind);
  }

  return fetchJson<CharacterDetail | null>(
    `/api/character/details/${encodeURIComponent(kind)}`,
    { signal },
  );
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
