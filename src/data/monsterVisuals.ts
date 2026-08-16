const API_URL = (import.meta.env.VITE_TAILBLUE_API_URL ?? "").replace(/\/$/, "");

export type MonsterVisualInput = {
  id?: string;
  monsterId?: string;
  family?: string;
  boss?: boolean;
  image?: string | null;
};

const FAMILY_ALIASES: Record<string, string> = {
  slimes: "slime",
  skeletons: "skeleton",
  goblins: "goblin",
  spiders: "spider",
  bats: "bat",
  wolves: "wolf",
  dragons: "dragon",
  demons: "demon",
  ghosts: "ghost",
  golems: "golem",
  mimics: "mimic",
  plants: "plant",
  rats: "rat",
};

function gameAsset(path: string) {
  const cleaned = path.replace(/^\/+/, "");
  return API_URL
    ? `${API_URL}/api/assets/game/${cleaned}`
    : `/${cleaned}`;
}

export function resolveMonsterImage(monster: MonsterVisualInput) {
  if (monster.image) {
    if (/^https?:\/\//i.test(monster.image)) return monster.image;
    if (monster.image.startsWith("/api/assets/game/") && API_URL) {
      return `${API_URL}${monster.image}`;
    }
    return monster.image;
  }

  const rawFamily = (monster.family ?? "").toLowerCase().trim();
  const family = FAMILY_ALIASES[rawFamily] ?? rawFamily;
  if (!family || family === "default") return undefined;

  return gameAsset(
    `ImagesBestiaire/${family}${monster.boss ? "_boss" : ""}.png`,
  );
}
