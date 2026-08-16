import { HOME_PREVIEW_SNAPSHOT } from "../data/homePreviewData";
import type { HomeSnapshot } from "../types/home";

type Env = Record<string, string | boolean | undefined>;

const ENV = (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

const ACCESS_TOKEN_KEY =
  "tailblue-desktop-access-token";

export const homeApiConfigured = Boolean(API_BASE);

export type TailBlueAuthUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isHime: boolean;
};

export type TailBlueDesktopSession = {
  authenticated: true;
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: TailBlueAuthUser;
};

export type TailBlueAuthenticatedUser = {
  authenticated: true;
  user: TailBlueAuthUser;
};

export function getDesktopAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(
    ACCESS_TOKEN_KEY,
  );
}

export function saveDesktopAccessToken(
  token: string,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const cleanToken = String(token ?? "").trim();

  if (!cleanToken) {
    return;
  }

  window.sessionStorage.setItem(
    ACCESS_TOKEN_KEY,
    cleanToken,
  );
}

export function clearDesktopAccessToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );
}

export function getDiscordDesktopLoginUrl(): string {
  if (!API_BASE) {
    throw new Error(
      "API TailBlue non configurée.",
    );
  }

  return (
    `${API_BASE}/api/auth/discord/login` +
    "?client=desktop"
  );
}

async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_BASE) {
    throw new Error(
      "API TailBlue non configurée.",
    );
  }

  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set(
      "Accept",
      "application/json",
    );
  }

  if (
    init.body !== undefined &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const accessToken =
    getDesktopAccessToken();

  if (
    accessToken &&
    !headers.has("Authorization")
  ) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`,
    );
  }

  const response = await fetch(
    `${API_BASE}${path}`,
    {
      ...init,

      // L'application Desktop utilise désormais
      // Authorization: Bearer ...
      // et non le cookie du navigateur.
      credentials: "omit",

      headers,
    },
  );

  if (!response.ok) {
    let detail =
      `Erreur TailBlue ${response.status}`;

    try {
      const payload = await response.json();

      if (payload?.detail) {
        detail = String(payload.detail);
      }
    } catch {
      // Réponse non JSON.
    }

    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function exchangeDesktopAuthCode(
  code: string,
): Promise<TailBlueDesktopSession> {
  const cleanCode = String(code ?? "").trim();

  if (!cleanCode) {
    throw new Error(
      "Code de connexion Discord manquant.",
    );
  }

  const session =
    await fetchJson<TailBlueDesktopSession>(
      "/api/auth/desktop/exchange",
      {
        method: "POST",
        body: JSON.stringify({
          code: cleanCode,
        }),
      },
    );

  if (!session.accessToken) {
    throw new Error(
      "L'API n'a renvoyé aucun token de session.",
    );
  }

  saveDesktopAccessToken(
    session.accessToken,
  );

  return session;
}

export async function loadAuthenticatedUser():
  Promise<TailBlueAuthenticatedUser> {
  return fetchJson<TailBlueAuthenticatedUser>(
    "/api/auth/me",
    {
      method: "GET",
    },
  );
}

export async function loadHomeSnapshot(
  signal?: AbortSignal,
): Promise<HomeSnapshot> {
  if (!API_BASE) {
    return {
      ...HOME_PREVIEW_SNAPSHOT,

      generatedAt:
        new Date().toISOString(),

      notifications:
        HOME_PREVIEW_SNAPSHOT.notifications.map(
          (item) => ({ ...item }),
        ),

      recentActivity:
        HOME_PREVIEW_SNAPSHOT.recentActivity.map(
          (item) => ({ ...item }),
        ),
    };
  }

  return fetchJson<HomeSnapshot>(
    "/api/home",
    {
      method: "GET",
      signal,
    },
  );
}

export async function markHomeNotificationRead(
  notificationId: string,
): Promise<void> {
  if (!API_BASE) return;

  await fetchJson<void>(
    `/api/home/notifications/${encodeURIComponent(
      notificationId,
    )}/read`,
    {
      method: "POST",
    },
  );
}

export async function markAllHomeNotificationsRead():
  Promise<void> {
  if (!API_BASE) return;

  await fetchJson<void>(
    "/api/home/notifications/read-all",
    {
      method: "POST",
    },
  );
}

export async function logoutHomeSession():
  Promise<void> {
  if (!API_BASE) {
    throw new Error(
      "Connexion Discord non disponible en aperçu local.",
    );
  }

  try {
    if (getDesktopAccessToken()) {
      await fetchJson<void>(
        "/api/auth/logout",
        {
          method: "POST",
        },
      );
    }
  } finally {
    clearDesktopAccessToken();
  }
}

export function openHomeStream(
  _onChange: () => void,
): () => void {
  /*
   * Le flux temps réel sera reconnecté ensuite
   * avec une authentification compatible Desktop.
   *
   * EventSource natif ne permet pas d'ajouter
   * Authorization: Bearer ...
   *
   * Pour l'instant on évite donc volontairement
   * d'ouvrir un SSE non authentifié.
   */
  return () => undefined;
}