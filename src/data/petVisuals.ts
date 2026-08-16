const API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").replace(/\/$/, "");

export type MinePetVisualInput = {
  image?: string | null;
};

export function resolveMinePetImage(pet?: MinePetVisualInput | null): string | undefined {
  const raw = String(pet?.image ?? "").trim();
  if (!raw) return undefined;

  if (/^(https?:|data:|blob:)/i.test(raw)) return raw;

  if (raw.startsWith("/api/assets/game/")) {
    return API_URL ? `${API_URL}${raw}` : raw;
  }

  const cleaned = raw.replace(/^\.?\//, "");
  if (!cleaned) return undefined;

  return API_URL
    ? `${API_URL}/api/assets/game/${cleaned}`
    : `/${cleaned}`;
}
