import { HOME_PREVIEW_SNAPSHOT } from "../data/homePreviewData";
import type { HomeSnapshot } from "../types/home";

import {
  clearPersistedDesktopRefreshToken,
  persistDesktopRefreshToken,
  readPersistedDesktopRefreshToken,
} from "./desktopSecureSession";

type Env = Record<string, string | boolean | undefined>;

const ENV =
  (import.meta as ImportMeta & { env?: Env }).env ?? {};

const RAW_API_BASE = String(
  ENV.VITE_TAILBLUE_API_URL ?? "",
).trim();

const API_BASE =
  RAW_API_BASE.replace(/\/+$/, "");

const ACCESS_TOKEN_KEY =
  "tailblue-desktop-access-token";

export const homeApiConfigured =
  Boolean(API_BASE);

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
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresIn: number;
  user: TailBlueAuthUser;
};

export type TailBlueAuthenticatedUser = {
  authenticated: true;
  user: TailBlueAuthUser;
};

let refreshPromise:
  Promise<TailBlueDesktopSession | null> | null =
    null;


export function getDesktopAccessToken():
  string | null {

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

  const cleanToken =
    String(token ?? "").trim();

  if (!cleanToken) {
    return;
  }

  window.sessionStorage.setItem(
    ACCESS_TOKEN_KEY,
    cleanToken,
  );
}


export function clearDesktopAccessToken():
  void {

  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(
    ACCESS_TOKEN_KEY,
  );
}


export function getDiscordDesktopLoginUrl():
  string {

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


async function responseError(
  response: Response,
): Promise<Error> {

  let detail =
    `Erreur TailBlue ${response.status}`;

  try {
    const payload =
      await response.json();

    if (payload?.detail) {
      detail =
        String(payload.detail);
    }
  } catch {
    // Réponse non JSON.
  }

  return new Error(detail);
}


async function performDesktopSessionRefresh():
  Promise<TailBlueDesktopSession | null> {

  if (!API_BASE) {
    return null;
  }

  const refreshToken =
    await readPersistedDesktopRefreshToken();

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(
    `${API_BASE}/api/auth/desktop/refresh`,
    {
      method: "POST",

      credentials: "omit",

      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        refreshToken,
      }),
    },
  );

  if (!response.ok) {
    if (
      response.status === 400 ||
      response.status === 401
    ) {
      clearDesktopAccessToken();

      await clearPersistedDesktopRefreshToken();
    }

    throw await responseError(
      response,
    );
  }

  const session =
    (await response.json()) as TailBlueDesktopSession;

  if (
    !session.accessToken ||
    !session.refreshToken
  ) {
    clearDesktopAccessToken();

    await clearPersistedDesktopRefreshToken();

    throw new Error(
      "Session TailBlue renouvelée invalide.",
    );
  }

  saveDesktopAccessToken(
    session.accessToken,
  );

  await persistDesktopRefreshToken(
    session.refreshToken,
  );

  console.log(
    "🔄 Session TailBlue renouvelée automatiquement.",
  );

  return session;
}


export async function refreshDesktopSession():
  Promise<TailBlueDesktopSession | null> {

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    performDesktopSessionRefresh();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}


export async function restoreDesktopAccessToken():
  Promise<string | null> {

  const current =
    getDesktopAccessToken();

  if (current) {
    return current;
  }

  const session =
    await refreshDesktopSession();

  return (
    session?.accessToken ??
    null
  );
}


async function fetchJson<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {

  if (!API_BASE) {
    throw new Error(
      "API TailBlue non configurée.",
    );
  }

  const headers =
    new Headers(init.headers);

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

  let response = await fetch(
    `${API_BASE}${path}`,
    {
      ...init,
      credentials: "omit",
      headers,
    },
  );

  /*
   * Si l'access token de 30 minutes
   * vient d'expirer, on utilise UNE FOIS
   * le refresh token du Trousseau.
   */
  if (
    response.status === 401 &&
    allowRefresh
  ) {
    try {
      const refreshed =
        await refreshDesktopSession();

      if (refreshed?.accessToken) {
        const retryHeaders =
          new Headers(init.headers);

        if (!retryHeaders.has("Accept")) {
          retryHeaders.set(
            "Accept",
            "application/json",
          );
        }

        if (
          init.body !== undefined &&
          !retryHeaders.has("Content-Type")
        ) {
          retryHeaders.set(
            "Content-Type",
            "application/json",
          );
        }

        retryHeaders.set(
          "Authorization",
          `Bearer ${refreshed.accessToken}`,
        );

        response = await fetch(
          `${API_BASE}${path}`,
          {
            ...init,
            credentials: "omit",
            headers: retryHeaders,
          },
        );
      }
    } catch (error) {
      console.warn(
        "Renouvellement automatique impossible :",
        error,
      );
    }
  }

  if (!response.ok) {
    throw await responseError(
      response,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}


export async function exchangeDesktopAuthCode(
  code: string,
): Promise<TailBlueDesktopSession> {

  const cleanCode =
    String(code ?? "").trim();

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

      false,
    );

  if (
    !session.accessToken ||
    !session.refreshToken
  ) {
    throw new Error(
      "L'API n'a pas renvoyé une session Desktop complète.",
    );
  }

  /*
   * Access token :
   * uniquement dans la session WebView.
   */
  saveDesktopAccessToken(
    session.accessToken,
  );

  /*
   * Refresh token :
   * uniquement dans le coffre système.
   */
  await persistDesktopRefreshToken(
    session.refreshToken,
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

  if (!API_BASE) {
    return;
  }

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

  if (!API_BASE) {
    return;
  }

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

  const accessToken =
    getDesktopAccessToken();

  const refreshToken =
    await readPersistedDesktopRefreshToken();

  let logoutError: Error | null =
    null;

  try {
    const headers =
      new Headers();

    headers.set(
      "Accept",
      "application/json",
    );

    headers.set(
      "Content-Type",
      "application/json",
    );

    if (accessToken) {
      headers.set(
        "Authorization",
        `Bearer ${accessToken}`,
      );
    }

    const response = await fetch(
      `${API_BASE}/api/auth/logout`,
      {
        method: "POST",
        credentials: "omit",
        headers,

        body: JSON.stringify({
          refreshToken,
        }),
      },
    );

    if (!response.ok) {
      logoutError =
        await responseError(
          response,
        );
    }
  } finally {
    clearDesktopAccessToken();

    await clearPersistedDesktopRefreshToken();
  }

  if (logoutError) {
    throw logoutError;
  }
}


export function openHomeStream(
  _onChange: () => void,
): () => void {

  /*
   * EventSource natif ne permet toujours
   * pas d'envoyer Authorization: Bearer.
   *
   * Le temps réel authentifié sera
   * reconnecté séparément.
   */
  return () => undefined;
}
