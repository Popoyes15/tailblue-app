import type {
  HouseDefinition,
  HouseId,
  MuseumDefinition,
} from "../types/world";

export const HOUSE_FURNITURE_BONUS_CAPS = {
  mineRestMinutes: 15,
  activityCooldownMinutes: 3,
  xpPct: 4,
  cookiesPct: 4,
} as const;

export const HOUSE_FURNITURE_CATEGORIES = [
  "chambre",
  "cuisine",
  "etude",
  "atelier",
  "nature",
  "compagnons",
  "prestige",
] as const;

export const HOUSES: HouseDefinition[] = [
  {
    id: "sans_abri",
    name: "🌧️ Sans-abri",
    levelRequired: 1,
    price: 0,
    image: "/ImagesMaison/Image_Sans_Abris.png",
    description:
      "Chaque aventurier commence quelque part. Le Royaume offre un simple abri de fortune.",
    effect: { cookiesPct: -30, xpPct: -20, cooldownMinutes: 15 },
    furnitureSlots: 1,
    purchasable: false,
  },
  {
    id: "ferme",
    name: "🏚️ Petite Ferme Délabrée",
    levelRequired: 2,
    price: 1000,
    image: "/ImagesMaison/Image_Ferme.png",
    description:
      "Une vieille ferme qui reprend vie. Ton premier véritable foyer.",
    effect: { cookiesPct: -12, xpPct: -8, cooldownMinutes: 5 },
    furnitureSlots: 3,
    purchasable: true,
  },
  {
    id: "cabane",
    name: "🪵 Cabane Confortable",
    levelRequired: 5,
    price: 3000,
    image: "/ImagesMaison/Cabane_Confort.png",
    description: "Une cabane chaleureuse au cœur des bois.",
    effect: { cookiesPct: 2, xpPct: 2, cooldownMinutes: -1 },
    furnitureSlots: 5,
    purchasable: true,
  },
  {
    id: "village",
    name: "🏡 Maison du Village",
    levelRequired: 10,
    price: 7500,
    // Le Python historique contient « Maison_Citée.png ».
    // Le dossier public de l'app utilise la version sans accent.
    image: "/ImagesMaison/Maison_Citee.png",
    description: "Les habitants commencent à reconnaître ton nom.",
    effect: { cookiesPct: 4, xpPct: 4, cooldownMinutes: -2 },
    furnitureSlots: 7,
    purchasable: true,
  },
  {
    id: "manoir",
    name: "🏛️ Manoir Champêtre",
    levelRequired: 15,
    price: 15000,
    image: "/ImagesMaison/Manoir.png",
    description:
      "Une demeure prestigieuse réservée aux aventuriers renommés.",
    effect: { cookiesPct: 7, xpPct: 7, cooldownMinutes: -3 },
    furnitureSlots: 9,
    purchasable: true,
  },
  {
    id: "villa",
    name: "🌸 Villa du Royaume",
    levelRequired: 20,
    price: 22000,
    // HOUSES est la source d'affichage correcte : villa.png.
    image: "/ImagesMaison/villa.png",
    description: "Une résidence luxueuse digne des plus grands héros.",
    effect: { cookiesPct: 10, xpPct: 10, cooldownMinutes: -5 },
    furnitureSlots: 11,
    purchasable: true,
  },
  {
    id: "plateau",
    name: "⛰️ Haut Plateau Royal",
    levelRequired: 25,
    price: 30000,
    image: "/ImagesMaison/HautPlateau.png",
    description:
      "Une résidence perchée au-dessus du Royaume, réservée aux aventuriers accomplis.",
    effect: { cookiesPct: 10, xpPct: 10, cooldownMinutes: -5 },
    furnitureSlots: 13,
    purchasable: true,
  },
  {
    id: "chateau",
    name: "👑 Château de Hime-sama",
    levelRequired: 9999,
    price: null,
    image: "/ImagesMaison/Image_Chateau.png",
    description:
      "La résidence officielle de Hime-sama. Personne ne peut l'acheter.",
    effect: { cookiesPct: 10, xpPct: 10, cooldownMinutes: -5 },
    furnitureSlots: 15,
    purchasable: false,
  },
];

export const HOUSE_BY_ID = Object.fromEntries(
  HOUSES.map((house) => [house.id, house]),
) as Record<HouseId, HouseDefinition>;

export const MUSEUMS: MuseumDefinition[] = [
  {
    houseId: "sans_abri",
    name: "Musée de Fortune",
    image: "/ImagesMaison/musee_sans_abri.png",
    description:
      "Quelques objets posés sur une couverture, mais avec beaucoup de dignité.",
  },
  {
    houseId: "ferme",
    name: "Grange des Souvenirs",
    image: "/ImagesMaison/musee_ferme.png",
    description: "Une vieille grange transformée en galerie rustique.",
  },
  {
    houseId: "cabane",
    name: "Petite Galerie en Bois",
    image: "/ImagesMaison/musee_cabane.png",
    description: "Une galerie chaleureuse, éclairée par des lanternes.",
  },
  {
    houseId: "village",
    name: "Galerie du Village",
    image: "/ImagesMaison/musee_village.png",
    description:
      "Une salle d'exposition accueillante au cœur du village.",
  },
  {
    houseId: "manoir",
    name: "Salon des Reliques",
    image: "/ImagesMaison/musee_manoir.png",
    description: "Un salon élégant réservé aux objets précieux.",
  },
  {
    houseId: "villa",
    name: "Galerie Noble",
    image: "/ImagesMaison/musee_villa.png",
    description: "Une galerie raffinée aux vitrines lumineuses.",
  },
  {
    houseId: "chateau",
    name: "Musée Royal",
    image: "/ImagesMaison/musee_royal.png",
    description:
      "Une galerie royale éclairée par les cristaux de TailBlue.",
  },
];

export const MUSEUM_BY_HOUSE = Object.fromEntries(
  MUSEUMS.map((museum) => [museum.houseId, museum]),
) as Record<MuseumDefinition["houseId"], MuseumDefinition>;

export function museumForHouse(houseId: HouseId): MuseumDefinition {
  // Le Python n'a actuellement pas d'entrée « plateau » :
  // MUSEES_MAISONS.get(..., MUSEES_MAISONS["sans_abri"]).
  if (houseId === "plateau") return MUSEUM_BY_HOUSE.sans_abri;
  return MUSEUM_BY_HOUSE[houseId] ?? MUSEUM_BY_HOUSE.sans_abri;
}

export interface MarketMerchantDefinition {
  name: string;
  title: string;
  greeting: string;
}

export interface MarketBuildingDefinition {
  id: "commons" | "forge" | "alchemist" | "tailor" | "jeweler" | "sanctuary";
  name: string;
  emoji: string;
  description: string;
  unlockCost: number;
  stageAfterPurchase: number;
  order: number;
  workshop: string | null;
  overviewOnly: boolean;
  interiorImage?: string;
  merchant: MarketMerchantDefinition;
}

export const MARKET_STAGE_IMAGES: Record<number, string> = {
  0: "/ImagesMarket/marketruins.png",
  1: "/ImagesMarket/marketforge.png",
  2: "/ImagesMarket/marketalchemist.png",
  3: "/ImagesMarket/markettailor.png",
  4: "/ImagesMarket/marketjeweler.png",
  5: "/ImagesMarket/marketsanctuary.png",
};

export const MARKET_BUILDINGS: MarketBuildingDefinition[] = [
  {
    id: "commons",
    name: "Place du Marché",
    emoji: "🏘️",
    description:
      "Le cœur du Royaume de TailBlue. On y respire à nouveau l’odeur des étals, du bois humide et des pierres encore abîmées après l’incident.",
    unlockCost: 0,
    stageAfterPurchase: 0,
    order: 0,
    workshop: null,
    overviewOnly: true,
    merchant: {
      name: "Mira",
      title: "Intendante du Marché",
      greeting:
        "Bienvenue au Marché du Royaume de TailBlue. Chaque reconstruction rend la place un peu plus vivante.",
    },
  },
  {
    id: "forge",
    name: "Forge du Royaume",
    emoji: "🔥",
    description:
      "Une forge artisanale pour les métaux, minerais, armes et outils de base. Premier pilier solide de la reconstruction du marché.",
    unlockCost: 2500,
    stageAfterPurchase: 1,
    order: 1,
    workshop: "forge",
    overviewOnly: false,
    interiorImage: "/ImagesMarket/forge_interior.png",
    merchant: {
      name: "Brom",
      title: "Maître forgeron",
      greeting:
        "Tant qu’il y aura du feu et du minerai, je pourrai remettre ce royaume sur pied.",
    },
  },
  {
    id: "alchemist",
    name: "Atelier de l’Alchimiste",
    emoji: "🧪",
    description:
      "Un laboratoire discret où s’alignent fioles, poudres et remèdes. Parfait pour renforcer l’exploration et la survie.",
    unlockCost: 4200,
    stageAfterPurchase: 2,
    order: 2,
    workshop: "alchemist",
    overviewOnly: false,
    interiorImage: "/ImagesMarket/alchemist_interior.png",
    merchant: {
      name: "Selene",
      title: "Alchimiste du Royaume",
      greeting:
        "Chaque fiole a sa volonté propre. Les meilleures sont celles qui sauvent la peau des aventuriers.",
    },
  },
  {
    id: "tailor",
    name: "Atelier du Tailleur",
    emoji: "🪡",
    description:
      "Tissus, cuir, coutures et armures légères. Un lieu raffiné qui stabilise l’équipement défensif du royaume.",
    unlockCost: 6200,
    stageAfterPurchase: 3,
    order: 3,
    workshop: "tailor",
    overviewOnly: false,
    interiorImage: "/ImagesMarket/tailor_interior.png",
    merchant: {
      name: "Aelis",
      title: "Maîtresse tailleur",
      greeting:
        "Le bon fil placé au bon endroit peut sauver autant qu’une armure complète.",
    },
  },
  {
    id: "jeweler",
    name: "Joaillier Royal",
    emoji: "💍",
    description:
      "Un atelier lumineux où brillent gemmes, anneaux et amulettes. Les finitions précieuses du Royaume passent par ici.",
    unlockCost: 8600,
    stageAfterPurchase: 4,
    order: 4,
    workshop: "jeweler",
    overviewOnly: false,
    interiorImage: "/ImagesMarket/jeweler_interior.png",
    merchant: {
      name: "Orinel",
      title: "Joaillier royal",
      greeting:
        "Les petites choses brillantes paraissent frivoles… jusqu’au moment où elles changent un destin.",
    },
  },
  {
    id: "sanctuary",
    name: "Sanctuaire Marchand",
    emoji: "⛩️",
    description:
      "Un lieu rare mêlant spiritualité, reliques et art sacré. Dernier grand chantier symbolique du marché.",
    unlockCost: 12000,
    stageAfterPurchase: 5,
    order: 5,
    workshop: "sanctuary",
    overviewOnly: false,
    interiorImage: "/ImagesMarket/sanctuary_interior.png",
    merchant: {
      name: "Iria",
      title: "Gardienne du Sanctuaire",
      greeting:
        "Ici, tout objet porte une mémoire. Les reliques ne se vendent jamais à la légère.",
    },
  },
];

export const MARKET_BUILDING_BY_ID = Object.fromEntries(
  MARKET_BUILDINGS.map((building) => [building.id, building]),
) as Record<MarketBuildingDefinition["id"], MarketBuildingDefinition>;

export const MAX_MARKET_WORKSHOP_LEVEL = 6;
