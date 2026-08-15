import {
  CHARACTER_PREVIEW,
  getPreviewCharacterDetail,
} from "../data/characterPreviewData";
import type {
  CharacterDetail,
  CharacterDetailKind,
  CharacterSnapshot,
} from "../types/character";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const characterApiConfigured = Boolean(API_BASE);

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

export function openCharacterStream(
  onChange: () => void,
): () => void {
  if (!API_BASE || typeof EventSource === "undefined") {
    return () => undefined;
  }

  const source = new EventSource(
    `${API_BASE}/api/character/stream`,
    { withCredentials: true },
  );

  source.addEventListener("character", onChange);
  source.addEventListener("profile", onChange);
  source.addEventListener("equipment", onChange);
  source.addEventListener("guild", onChange);
  source.addEventListener("companion", onChange);

  return () => source.close();
}
