import type {
  ActivityKind,
  ActivityResultDto,
  ActivitySnapshotDto,
} from "../types/activity";

const RAW_API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").trim();
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const activityApiConfigured = Boolean(API_URL);

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
 * Contrat prévu pour le backend TailBlue.
 *
 * GET  /api/activity/work
 * POST /api/activity/work/start
 * POST /api/activity/work/choice
 *
 * GET  /api/activity/hunt
 * POST /api/activity/hunt/start
 * POST /api/activity/hunt/choice
 *
 * Le backend devra identifier le joueur via la vraie authentification.
 */
export const activityApi = {
  getSnapshot(activity: ActivityKind): Promise<ActivitySnapshotDto> {
    return request<ActivitySnapshotDto>(`/api/activity/${activity}`);
  },

  start(activity: ActivityKind): Promise<ActivitySnapshotDto> {
    return request<ActivitySnapshotDto>(`/api/activity/${activity}/start`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  resolveChoice(
    activity: ActivityKind,
    eventId: string,
    choiceId: string,
  ): Promise<{
    snapshot: ActivitySnapshotDto;
    result: ActivityResultDto;
  }> {
    return request<{
      snapshot: ActivitySnapshotDto;
      result: ActivityResultDto;
    }>(`/api/activity/${activity}/choice`, {
      method: "POST",
      body: JSON.stringify({
        eventId,
        choiceId,
      }),
    });
  },
};
