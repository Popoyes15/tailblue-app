import { getDesktopAccessToken } from "./homeApi";
import type { MineSnapshot } from "../types/mine";

const API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "")
  .replace(/\/$/, "");

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("L'URL de l'API TailBlue n'est pas configurée.");
  }

  const token = getDesktopAccessToken();
  if (!token) {
    throw new Error("Connecte-toi à Discord avant d'ouvrir la Mine.");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "omit",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = `Erreur TailBlue (${response.status})`;
    try {
      const body = await response.json() as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // réponse non JSON
    }
    throw new Error(detail);
  }

  return await response.json() as T;
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export const mineApi = {
  configured: Boolean(API_URL),

  snapshot: () => request<MineSnapshot>("/api/mine"),

  enter: (companionId?: string | null) =>
    post<MineSnapshot>("/api/mine/enter", {
      companionId: companionId || null,
    }),

  leave: () => post<MineSnapshot>("/api/mine/leave"),

  action: (
    action: string,
    options: { direction?: string; targetId?: string } = {},
  ) => post<MineSnapshot>("/api/mine/action", {
    action,
    direction: options.direction ?? null,
    targetId: options.targetId ?? null,
  }),

  usePotion: (itemId: string) =>
    post<MineSnapshot>("/api/mine/potion", { itemId }),

  feedCompanion: (foodId: string) =>
    post<MineSnapshot>("/api/mine/companion/feed", { foodId }),

  cuddleCompanion: () =>
    post<MineSnapshot>("/api/mine/companion/cuddle"),

  combat: (
    action: "attack" | "defend" | "flee" | "skill" | "item",
    options: { skillId?: string; itemId?: string } = {},
  ) => post<MineSnapshot>("/api/mine/combat/action", {
    action,
    skillId: options.skillId ?? null,
    itemId: options.itemId ?? null,
  }),
};
