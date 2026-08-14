export type InventoryItem = {
  id: string;
  name: string;
  emoji: string;
  type: "material" | "equipment" | "consumable" | "plan" | "quest" | "relic";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
  rarityLabel: string;
  quantity: number;
  description: string;
  lore?: string;
  element?: string;
  slot?: string;
  levelRequired?: number;
  stats?: Partial<{
    hp: number;
    attack: number;
    defense: number;
    crit: number;
    dodge: number;
    luck: number;
  }>;
  effects?: string[];
};

// Données réelles connues depuis items.py.
// Les quantités sont TEMPORAIRES tant que le profil joueur n'est pas branché à l'API.
export const DEMO_INVENTORY: InventoryItem[] = [
  {
    id: "relic_hikariryu",
    name: "Écaille d'Hikariryū",
    emoji: "🐉",
    type: "relic",
    rarity: "mythic",
    rarityLabel: "👑 Mythique",
    quantity: 1,
    description: "Une relique vivante liée au dragon Hikariryū.",
    lore: "La lumière qu'elle émet réagit à son porteur.",
    stats: {
      hp: 50,
      attack: 12,
      defense: 10,
      crit: 5,
      luck: 5,
    },
    effects: ["Augmente l'XP de chasse de 10 %."],
  },
  {
    id: "frieren_scepter",
    name: "Sceptre de Frieren",
    emoji: "🔮",
    type: "equipment",
    rarity: "mythic",
    rarityLabel: "👑 Mythique",
    quantity: 1,
    description:
      "Le sceptre personnel de Frieren. Il amplifie énormément la magie, la précision et la stabilité des sorts de Hime-sama.",
    lore:
      "Un focaliseur ancien qui ne répond qu'à la signature magique de Frieren.",
    element: "☀️ Lumière",
    slot: "⚔️ Arme",
    levelRequired: 1,
    stats: {
      hp: 45,
      attack: 118,
      defense: 20,
      crit: 22,
      dodge: 10,
      luck: 18,
    },
    effects: [
      "Amplifie la puissance magique de 18 %.",
      "Améliore le contrôle et la précision magiques.",
    ],
  },
];

export const ITEM_TYPE_OPTIONS = [
  { value: "all", label: "Tous les objets" },
  { value: "equipment", label: "⚔️ Équipements" },
  { value: "consumable", label: "🧪 Consommables" },
  { value: "material", label: "🪨 Matériaux" },
  { value: "plan", label: "📜 Plans" },
  { value: "quest", label: "🗝️ Quêtes" },
  { value: "relic", label: "🏺 Reliques" },
];

export const RARITY_OPTIONS = [
  { value: "all", label: "Toutes les raretés" },
  { value: "common", label: "⚪ Commun" },
  { value: "uncommon", label: "🟢 Peu commun" },
  { value: "rare", label: "🔵 Rare" },
  { value: "epic", label: "🟣 Épique" },
  { value: "legendary", label: "🟠 Légendaire" },
  { value: "mythic", label: "👑 Mythique" },
];
