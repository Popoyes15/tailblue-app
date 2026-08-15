import type {
  ApiStatus,
  MineAction,
  MineSnapshotDto,
} from "../types/backend";

const API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").replace(/\/$/, "");

export const tailBlueApi = {
  isConfigured() {
    return Boolean(API_URL);
  },

  async status(): Promise<ApiStatus> {
    if (!API_URL) return { connected: false };

    try {
      const response = await fetch(`${API_URL}/api/status`);
      if (!response.ok) return { connected: false };
      return await response.json();
    } catch {
      return { connected: false };
    }
  },

  async getMine(): Promise<MineSnapshotDto> {
    if (!API_URL) {
      throw new Error("TAILBLUE_API_NOT_CONFIGURED");
    }

    const response = await fetch(`${API_URL}/api/mine`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`GET /api/mine -> ${response.status}`);
    }

    return await response.json();
  },

  async mineAction(action: MineAction): Promise<MineSnapshotDto> {
    if (!API_URL) {
      throw new Error("TAILBLUE_API_NOT_CONFIGURED");
    }

    const response = await fetch(`${API_URL}/api/mine/action`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(action),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`POST /api/mine/action -> ${response.status} ${detail}`);
    }

    return await response.json();
  },
};
