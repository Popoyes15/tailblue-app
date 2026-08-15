/**
 * TailBlue — résolution officielle des visuels de monstres.
 *
 * Les images suivent la même logique que bestiaire.py :
 * - 1 image par famille de monstre normal ;
 * - 1 image par famille de boss.
 *
 * Les fichiers doivent être placés dans :
 * public/ImagesBestiaire/
 */

export const MONSTER_FAMILIES = [
  "slime",
  "skeleton",
  "goblin",
  "spider",
  "bat",
  "wolf",
  "fungus",
  "serpent",
  "golem",
  "cultist",
  "ghost",
  "beast",
  "insect",
  "elemental",
  "demon",
  "aberration",
  "dragon",
  "rat",
  "mimic",
  "plant",
] as const;

export type MonsterFamily = (typeof MONSTER_FAMILIES)[number];

export const MONSTER_IMAGE_PATHS: Record<MonsterFamily, string> = {
  slime: "/ImagesBestiaire/slime.png",
  skeleton: "/ImagesBestiaire/skeleton.png",
  goblin: "/ImagesBestiaire/goblin.png",
  spider: "/ImagesBestiaire/spider.png",
  bat: "/ImagesBestiaire/bat.png",
  wolf: "/ImagesBestiaire/wolf.png",
  fungus: "/ImagesBestiaire/fungus.png",
  serpent: "/ImagesBestiaire/serpent.png",
  golem: "/ImagesBestiaire/golem.png",
  cultist: "/ImagesBestiaire/cultist.png",
  ghost: "/ImagesBestiaire/ghost.png",
  beast: "/ImagesBestiaire/beast.png",
  insect: "/ImagesBestiaire/insect.png",
  elemental: "/ImagesBestiaire/elemental.png",
  demon: "/ImagesBestiaire/demon.png",
  aberration: "/ImagesBestiaire/aberration.png",
  dragon: "/ImagesBestiaire/dragon.png",
  rat: "/ImagesBestiaire/rat.png",
  mimic: "/ImagesBestiaire/mimic.png",
  plant: "/ImagesBestiaire/plant.png",
};

export const BOSS_IMAGE_PATHS: Record<MonsterFamily, string> = {
  slime: "/ImagesBestiaire/slime_boss.png",
  skeleton: "/ImagesBestiaire/skeleton_boss.png",
  goblin: "/ImagesBestiaire/goblin_boss.png",
  spider: "/ImagesBestiaire/spider_boss.png",
  bat: "/ImagesBestiaire/bat_boss.png",
  wolf: "/ImagesBestiaire/wolf_boss.png",
  fungus: "/ImagesBestiaire/fungus_boss.png",
  serpent: "/ImagesBestiaire/serpent_boss.png",
  golem: "/ImagesBestiaire/golem_boss.png",
  cultist: "/ImagesBestiaire/cultist_boss.png",
  ghost: "/ImagesBestiaire/ghost_boss.png",
  beast: "/ImagesBestiaire/beast_boss.png",
  insect: "/ImagesBestiaire/insect_boss.png",
  elemental: "/ImagesBestiaire/elemental_boss.png",
  demon: "/ImagesBestiaire/demon_boss.png",
  aberration: "/ImagesBestiaire/aberration_boss.png",
  dragon: "/ImagesBestiaire/dragon_boss.png",
  rat: "/ImagesBestiaire/rat_boss.png",
  mimic: "/ImagesBestiaire/mimic_boss.png",
  plant: "/ImagesBestiaire/plant_boss.png",
};

/**
 * Overrides optionnels si un monstre précis reçoit un jour une illustration
 * différente de sa famille.
 *
 * Exemple :
 * "goblin_king": "/ImagesBestiaire/goblin_king.png"
 */
export const MONSTER_IMAGE_OVERRIDES: Record<string, string> = {};

export type MonsterVisualInput = {
  id?: string;
  monsterId?: string;
  family?: string;
  boss?: boolean;
  image?: string;
};

export function isMonsterFamily(value?: string): value is MonsterFamily {
  return Boolean(value && (MONSTER_FAMILIES as readonly string[]).includes(value));
}

export function resolveMonsterImage(monster: MonsterVisualInput): string | undefined {
  // Si le backend fournit volontairement une image précise, elle est prioritaire.
  if (monster.image) return monster.image;

  const id = monster.monsterId ?? monster.id;
  if (id && MONSTER_IMAGE_OVERRIDES[id]) {
    return MONSTER_IMAGE_OVERRIDES[id];
  }

  if (!isMonsterFamily(monster.family)) {
    return undefined;
  }

  return monster.boss
    ? BOSS_IMAGE_PATHS[monster.family]
    : MONSTER_IMAGE_PATHS[monster.family];
}
