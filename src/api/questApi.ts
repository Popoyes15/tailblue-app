import type {
  QuestAcceptRequest,
  QuestBoardSnapshotDto,
  QuestClaimResultDto,
} from "../types/quest";

const RAW_API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").trim();
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const questApiConfigured = Boolean(API_URL);

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    throw new Error("TAILBLUE_API_NOT_CONFIGURED");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    /**
     * Si l’hébergement choisit une session/cookie HttpOnly,
     * cette ligne permet au navigateur d’envoyer l’authentification.
     * Avec un Bearer token, le header Authorization pourra être injecté ici.
     */
    credentials: "include",
  });

  if (!response.ok) {
    let message = `Erreur API ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body?.detail === "string") message = body.detail;
      else if (typeof body?.message === "string") message = body.message;
    } catch {
      // Le statut HTTP suffit si le backend ne renvoie pas de JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

/**
 * Contrat frontend prêt pour l’hébergement TailBlue.
 *
 * GET  /api/quests
 * POST /api/quests/accept   { questId }
 * POST /api/quests/claim
 *
 * Le backend :
 * - identifie le joueur via l’auth réelle ;
 * - génère/rafraîchit les 3 offres ;
 * - vérifie que questId fait partie des offres du joueur ;
 * - calcule progression / expiration / récompense ;
 * - applique le bonus Chat Royal ;
 * - sauvegarde stats_tailblue.json ou la future DB.
 */
export const questApi = {
  getSnapshot(): Promise<QuestBoardSnapshotDto> {
    return request<QuestBoardSnapshotDto>("/api/quests");
  },

  accept(questId: string): Promise<QuestBoardSnapshotDto> {
    const body: QuestAcceptRequest = { questId };

    return request<QuestBoardSnapshotDto>("/api/quests/accept", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  claim(): Promise<QuestClaimResultDto> {
    return request<QuestClaimResultDto>("/api/quests/claim", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
