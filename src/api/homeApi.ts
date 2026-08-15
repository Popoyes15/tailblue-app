import { HOME_PREVIEW_SNAPSHOT } from "../data/homePreviewData";
import type { HomeSnapshot } from "../types/home";

type Env = Record<string, string | boolean | undefined>;
const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

export const homeApiConfigured = Boolean(API_BASE);

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

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function loadHomeSnapshot(
  signal?: AbortSignal,
): Promise<HomeSnapshot> {
  if (!API_BASE) {
    return {
      ...HOME_PREVIEW_SNAPSHOT,
      generatedAt: new Date().toISOString(),
      notifications: HOME_PREVIEW_SNAPSHOT.notifications.map(
        (item) => ({ ...item }),
      ),
      recentActivity: HOME_PREVIEW_SNAPSHOT.recentActivity.map(
        (item) => ({ ...item }),
      ),
    };
  }

  return fetchJson<HomeSnapshot>("/api/home", {
    method: "GET",
    signal,
  });
}

export async function markHomeNotificationRead(
  notificationId: string,
): Promise<void> {
  if (!API_BASE) return;

  await fetchJson<void>(
    `/api/home/notifications/${encodeURIComponent(
      notificationId,
    )}/read`,
    { method: "POST" },
  );
}

export async function markAllHomeNotificationsRead(): Promise<void> {
  if (!API_BASE) return;

  await fetchJson<void>("/api/home/notifications/read-all", {
    method: "POST",
  });
}


export async function logoutHomeSession(): Promise<void> {
  if (!API_BASE) {
    throw new Error(
      "Connexion Discord non disponible en aperçu local.",
    );
  }

  await fetchJson<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function openHomeStream(
  onChange: () => void,
): () => void {
  if (!API_BASE || typeof EventSource === "undefined") {
    return () => undefined;
  }

  const source = new EventSource(
    `${API_BASE}/api/home/stream`,
    { withCredentials: true },
  );

  source.addEventListener("home", onChange);
  source.addEventListener("notification", onChange);
  source.addEventListener("profile", onChange);

  return () => source.close();
}
