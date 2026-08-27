// TAILBLUE_GUILDWORK_DESKTOP_V1_20260826
import { getDesktopAccessToken } from "./homeApi";
import type {
  GuildworkResult,
  GuildworkRunResponse,
  GuildworkSnapshot,
} from "../types/guildwork";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const guildworkApiConfigured = Boolean(API_BASE);

const CACHE_KEY = "tailblue.guildwork.snapshot.v1";

let memorySnapshot: GuildworkSnapshot | null = null;

function isSnapshot(value: unknown): value is GuildworkSnapshot {
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<GuildworkSnapshot>;

  return (
    typeof candidate.guildName === "string" &&
    typeof candidate.guildLevel === "number" &&
    typeof candidate.treasury === "number" &&
    typeof candidate.available === "boolean" &&
    Boolean(candidate.rewardRanges)
  );
}

function cacheSnapshot(
  snapshot: GuildworkSnapshot,
): GuildworkSnapshot {
  memorySnapshot = snapshot;

  try {
    window.sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify(snapshot),
    );
  } catch {
    // Le cache mémoire suffit si sessionStorage n'est pas disponible.
  }

  return snapshot;
}

export function getCachedGuildworkSnapshot():
  | GuildworkSnapshot
  | null {
  if (memorySnapshot) return memorySnapshot;

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isSnapshot(parsed)) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    memorySnapshot = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function headers() {
  const result = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  const accessToken = getDesktopAccessToken();
  if (accessToken) {
    result.set("Authorization", `Bearer ${accessToken}`);
  }

  return result;
}

async function apiError(response: Response): Promise<Error & {
  snapshot?: GuildworkSnapshot;
  code?: string;
}> {
  let message = `Erreur TailBlue ${response.status}`;
  let snapshot: GuildworkSnapshot | undefined;
  let code: string | undefined;

  try {
    const payload = await response.json();
    const detail = payload?.detail;

    if (typeof detail === "string") {
      message = detail;
    } else if (detail && typeof detail === "object") {
      if (detail.message) message = String(detail.message);
      if (detail.code) code = String(detail.code);
      if (isSnapshot(detail.snapshot)) {
        snapshot = cacheSnapshot(detail.snapshot);
      }
    }
  } catch {
    // Réponse non JSON.
  }

  const error = new Error(message) as Error & {
    snapshot?: GuildworkSnapshot;
    code?: string;
  };

  error.snapshot = snapshot;
  error.code = code;

  return error;
}

export async function loadGuildworkSnapshot(
  signal?: AbortSignal,
): Promise<GuildworkSnapshot> {
  if (!API_BASE) {
    throw new Error("API TailBlue non configurée.");
  }

  const response = await fetch(
    `${API_BASE}/api/guild/guildwork`,
    {
      method: "GET",
      credentials: "omit",
      headers: headers(),
      signal,
    },
  );

  if (!response.ok) {
    throw await apiError(response);
  }

  return cacheSnapshot(
    (await response.json()) as GuildworkSnapshot,
  );
}

export async function runGuildwork(): Promise<GuildworkResult> {
  if (!API_BASE) {
    throw new Error("API TailBlue non configurée.");
  }

  const response = await fetch(
    `${API_BASE}/api/guild/guildwork`,
    {
      method: "POST",
      credentials: "omit",
      headers: headers(),
      body: "{}",
    },
  );

  if (!response.ok) {
    throw await apiError(response);
  }

  const payload =
    (await response.json()) as GuildworkRunResponse;

  cacheSnapshot(payload.result.snapshot);

  return payload.result;
}
