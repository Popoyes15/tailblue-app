import type {
  BreedingSnapshotDto,
  CompanionSnapshotDto,
  FeedResultDto,
  KennelSnapshotDto,
  ProvisionSnapshotDto,
} from "../types/companions";

const RAW_API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").trim();
const API_URL = RAW_API_URL.replace(/\/+$/, "");

export const companionApiConfigured = Boolean(API_URL);

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    throw new Error("TAILBLUE_API_NOT_CONFIGURED");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
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
      // Le statut HTTP reste exploitable.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const companionApi = {
  getCompanions(): Promise<CompanionSnapshotDto> {
    return request<CompanionSnapshotDto>("/api/companions");
  },

  setActive(petId: string, active: boolean): Promise<CompanionSnapshotDto> {
    return request<CompanionSnapshotDto>(
      `/api/companions/${encodeURIComponent(petId)}/active`,
      {
        method: "POST",
        body: JSON.stringify({ active }),
      },
    );
  },

  pet(petId: string): Promise<CompanionSnapshotDto> {
    return request<CompanionSnapshotDto>(
      `/api/companions/${encodeURIComponent(petId)}/pet`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
    );
  },

  rename(petId: string, nickname: string): Promise<CompanionSnapshotDto> {
    return request<CompanionSnapshotDto>(
      `/api/companions/${encodeURIComponent(petId)}/nickname`,
      {
        method: "PATCH",
        body: JSON.stringify({ nickname }),
      },
    );
  },

  feed(petId: string, foodId: string): Promise<FeedResultDto> {
    return request<FeedResultDto>(
      `/api/companions/${encodeURIComponent(petId)}/feed`,
      {
        method: "POST",
        body: JSON.stringify({ foodId }),
      },
    );
  },

  getKennel(): Promise<KennelSnapshotDto> {
    return request<KennelSnapshotDto>("/api/kennel");
  },

  upgradeKennel(kennelId: string): Promise<KennelSnapshotDto> {
    return request<KennelSnapshotDto>("/api/kennel/upgrade", {
      method: "POST",
      body: JSON.stringify({ kennelId }),
    });
  },

  getProvisions(): Promise<ProvisionSnapshotDto> {
    return request<ProvisionSnapshotDto>("/api/provisions");
  },

  buyFood(
    foodId: string,
    quantity: number,
  ): Promise<ProvisionSnapshotDto> {
    return request<ProvisionSnapshotDto>("/api/provisions/buy", {
      method: "POST",
      body: JSON.stringify({ foodId, quantity }),
    });
  },

  upgradeProvisions(): Promise<ProvisionSnapshotDto> {
    return request<ProvisionSnapshotDto>("/api/provisions/upgrade", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },

  getBreeding(): Promise<BreedingSnapshotDto> {
    return request<BreedingSnapshotDto>("/api/breeding");
  },

  hatchOriginsEgg(): Promise<BreedingSnapshotDto> {
    return request<BreedingSnapshotDto>("/api/breeding/hatch", {
      method: "POST",
      body: JSON.stringify({}),
    });
  },
};
