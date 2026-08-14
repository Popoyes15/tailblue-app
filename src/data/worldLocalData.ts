// Généré depuis les fichiers TailBlue fournis.
// Les chemins correspondent aux assets placés dans /public.

export const KENNELS = [
  {
    "id": "petit",
    "name": "🪵 Petit Chenil",
    "description": "Un premier refuge propre et chaleureux pour accueillir un compagnon supplémentaire.",
    "price": 3000,
    "bonusPlaces": 1,
    "image": "/Chenils/petit_chenil.png"
  },
  {
    "id": "rustique",
    "name": "🌾 Chenil Rustique",
    "description": "Une bâtisse simple entourée de prés, idéale pour une petite famille de compagnons.",
    "price": 7500,
    "bonusPlaces": 2,
    "image": "/Chenils/chenil_rustique.png"
  },
  {
    "id": "forestier",
    "name": "🌿 Chenil Forestier",
    "description": "Un refuge paisible dissimulé sous les arbres anciens du Royaume.",
    "price": 15000,
    "bonusPlaces": 3,
    "image": "/Chenils/chenil_forestier.png"
  },
  {
    "id": "village",
    "name": "🏡 Chenil du Village",
    "description": "Un vaste chenil au cœur du village, avec plusieurs espaces de repos.",
    "price": 30000,
    "bonusPlaces": 4,
    "image": "/Chenils/chenil_village.png"
  },
  {
    "id": "grand_refuge",
    "name": "🌸 Grand Refuge",
    "description": "Un domaine fleuri où les compagnons disposent de jardins et d'abris privés.",
    "price": 60000,
    "bonusPlaces": 5,
    "image": "/Chenils/grand_refuge.png"
  },
  {
    "id": "domaine",
    "name": "🐉 Domaine des Compagnons",
    "description": "Un domaine imposant conçu pour accueillir même les créatures les plus majestueuses.",
    "price": 100000,
    "bonusPlaces": 6,
    "image": "/Chenils/domaine_compagnons.png"
  },
  {
    "id": "prestigieux",
    "name": "💠 Chenil Prestigieux",
    "description": "Le plus remarquable des chenils accessibles aux aventuriers du Royaume.",
    "price": 175000,
    "bonusPlaces": 8,
    "image": "/Chenils/chenil_prestigieux.png"
  },
  {
    "id": "royal_tsundere",
    "name": "👑 Chenil Royal de Tsundere",
    "description": "Un sanctuaire royal réservé à Hime-sama et à Sugus. Ses jardins semblent s'étendre à l'infini sous la protection de la Couronne.",
    "price": 0,
    "bonusPlaces": null,
    "image": "/Chenils/chenil_royal_tsundere.png"
  }
] as const;

export const PROVISION_LEVELS = [
  {
    "level": 1,
    "name": "🪵 Étal des Provisions",
    "price": 0,
    "image": "/Chenils/provisions_niv1.png",
    "description": "Un petit étal rustique avec les provisions essentielles."
  },
  {
    "level": 2,
    "name": "🏪 Boutique des Familiers",
    "price": 1000,
    "image": "/Chenils/provisions_niv2.png",
    "description": "Une vraie petite boutique avec aliments frais et friandises."
  },
  {
    "level": 3,
    "name": "✨ Comptoir des Créatures Magiques",
    "price": 1500,
    "image": "/Chenils/provisions_niv3.png",
    "description": "Des réserves chargées en mana apparaissent sur les étagères."
  },
  {
    "level": 4,
    "name": "🐉 Maison des Dragons",
    "price": 2500,
    "image": "/Chenils/provisions_niv4.png",
    "description": "L'intendance peut désormais nourrir correctement les lignées draconiques."
  },
  {
    "level": 5,
    "name": "👑 Intendance Royale des Compagnons",
    "price": 4000,
    "image": "/Chenils/provisions_niv5.png",
    "description": "Le plus prestigieux comptoir animalier de TailBlue."
  }
] as const;

export const PET_FOODS = [
  {
    "id": "ration_simple",
    "name": "🌾 Ration simple",
    "price": 45,
    "level": 1,
    "heal": 8,
    "energy": 12
  },
  {
    "id": "viande_sechee",
    "name": "🥩 Viande séchée",
    "price": 70,
    "level": 1,
    "heal": 12,
    "energy": 13
  },
  {
    "id": "petit_poisson",
    "name": "🐟 Petit poisson",
    "price": 65,
    "level": 1,
    "heal": 10,
    "energy": 14
  },
  {
    "id": "legumes_croquants",
    "name": "🥕 Légumes croquants",
    "price": 50,
    "level": 1,
    "heal": 7,
    "energy": 13
  },
  {
    "id": "volaille_rotie",
    "name": "🍗 Volaille rôtie",
    "price": 130,
    "level": 2,
    "heal": 20,
    "energy": 18
  },
  {
    "id": "poisson_frais",
    "name": "🐟 Poisson frais",
    "price": 125,
    "level": 2,
    "heal": 18,
    "energy": 21
  },
  {
    "id": "fruits_royaux",
    "name": "🍎 Fruits royaux",
    "price": 115,
    "level": 2,
    "heal": 14,
    "energy": 20
  },
  {
    "id": "friandise_compagnon",
    "name": "🍪 Friandise",
    "price": 150,
    "level": 2,
    "heal": 5,
    "energy": 17
  },
  {
    "id": "biscuit_mana",
    "name": "✨ Biscuit au mana",
    "price": 260,
    "level": 3,
    "heal": 18,
    "energy": 30
  },
  {
    "id": "baies_lunaires",
    "name": "🌙 Baies lunaires",
    "price": 280,
    "level": 3,
    "heal": 23,
    "energy": 27
  },
  {
    "id": "viande_braisee",
    "name": "🔥 Viande braisée",
    "price": 300,
    "level": 3,
    "heal": 30,
    "energy": 23
  },
  {
    "id": "poisson_glaces",
    "name": "❄️ Poisson des glaces",
    "price": 300,
    "level": 3,
    "heal": 28,
    "energy": 25
  },
  {
    "id": "ration_draconique",
    "name": "🐉 Ration draconique",
    "price": 480,
    "level": 4,
    "heal": 38,
    "energy": 38
  },
  {
    "id": "coeur_braise",
    "name": "🔥 Cœur de braise",
    "price": 520,
    "level": 4,
    "heal": 34,
    "energy": 45
  },
  {
    "id": "fruit_orage",
    "name": "⚡ Fruit d'orage",
    "price": 540,
    "level": 4,
    "heal": 30,
    "energy": 48
  },
  {
    "id": "racines_anciennes",
    "name": "🌿 Racines anciennes",
    "price": 500,
    "level": 4,
    "heal": 40,
    "energy": 36
  },
  {
    "id": "festin_royal",
    "name": "👑 Festin royal",
    "price": 900,
    "level": 5,
    "heal": 60,
    "energy": 55
  },
  {
    "id": "essence_arcanombre",
    "name": "🌌 Essence d'Arcanombre",
    "price": 1000,
    "level": 5,
    "heal": 45,
    "energy": 65
  },
  {
    "id": "banquet_draconique",
    "name": "🐉 Banquet draconique",
    "price": 1100,
    "level": 5,
    "heal": 70,
    "energy": 65
  }
] as const;

export const DRAGONS = [
  {
    "id": "kagutsuchi",
    "name": "🔥 Kagutsuchi",
    "rarity": "⚪ Commun",
    "element": "feu",
    "chance": 32,
    "habitat": "🌋 Volcan d'Akayama",
    "temperament": "🔥 Fougueux et protecteur",
    "description": "Un dragon dont les flammes semblent posséder une volonté propre. Sa simple présence réchauffe l'air et fait danser les braises.",
    "image": "/Dragons/Kagutsuchi_Bebe.jpg"
  },
  {
    "id": "hyorin",
    "name": "❄️ Hyōrin",
    "rarity": "🟢 Peu commun",
    "element": "glace",
    "chance": 24,
    "habitat": "🏔️ Pics du Givre Éternel",
    "temperament": "❄️ Calme et réfléchi",
    "description": "Dragon millénaire des glaces éternelles, Hyōrin règne dans un silence absolu. Son souffle apaise les tempêtes autant qu'il peut figer le monde.",
    "image": "/Dragons/Hyorin_Bebe.jpg"
  },
  {
    "id": "raijin",
    "name": "⚡ Raijin",
    "rarity": "🟢 Peu commun",
    "element": "foudre",
    "chance": 18,
    "habitat": "⛈️ Falaises des Tempêtes",
    "temperament": "⚡ Impulsif et infatigable",
    "description": "Dragon souverain des tempêtes, Raijin règne sur les éclairs qui sillonnent le ciel. Son rugissement résonne comme le tonnerre et annonce toujours un grand changement.",
    "image": "/Dragons/Raijin_Bebe.jpg"
  },
  {
    "id": "kodama",
    "name": "🌿 Kodama",
    "rarity": "🔵 Rare",
    "element": "nature",
    "chance": 12,
    "habitat": "🌳 Forêt Millénaire",
    "temperament": "🌿 Curieux et collectionneur",
    "description": "Dragon ancien des forêts sacrées, Kodama incarne l'équilibre entre la vie, la nature et les esprits.",
    "image": "/Dragons/Kodama_Bebe.jpg"
  },
  {
    "id": "suijin",
    "name": "🌊 Suijin",
    "rarity": "🔵 Rare",
    "element": "eau",
    "chance": 7,
    "habitat": "🌊 Palais des Marées",
    "temperament": "🌊 Protecteur et bienveillant",
    "description": "Dragon souverain des océans, Suijin protège les mers depuis les profondeurs les plus inaccessibles.",
    "image": "/Dragons/Suijin_Bebe.jpg"
  },
  {
    "id": "dokuryu",
    "name": "☠️ Dokuryū",
    "rarity": "🟣 Épique",
    "element": "poison",
    "chance": 4,
    "habitat": "☣️ Marais du Crépuscule",
    "temperament": "☠️ Rusé et imprévisible",
    "description": "Dragon des marais empoisonnés, Dokuryū règne sur les terres où toute vie semble condamnée.",
    "image": "/Dragons/Dokuryu_Bebe.png"
  },
  {
    "id": "yamikage",
    "name": "🌑 Yamikage",
    "rarity": "🟠 Légendaire",
    "element": "ombre",
    "chance": 2,
    "habitat": "🌑 Vallée des Ombres",
    "temperament": "🌑 Solitaire et silencieux",
    "description": "Dragon des ombres éternelles, Yamikage apparaît uniquement lorsque la lumière disparaît totalement.",
    "image": "/Dragons/Yamikage_Bebe.png"
  },
  {
    "id": "hikariryu",
    "name": "✨ Hikariryū",
    "rarity": "🟠 Légendaire",
    "element": "lumiere",
    "chance": 1,
    "habitat": "☀️ Sanctuaire de l'Aube",
    "temperament": "✨ Bienveillant et majestueux",
    "description": "Dragon céleste d'une rareté inégalée, Hikariryū incarne l'espoir, la sagesse et l'équilibre du monde.",
    "image": "/Dragons/Hikariryu_Bebe.png"
  }
] as const;

export const MUSEUMS = [
  {
    "id": "sans_abri",
    "name": "Musée de Fortune",
    "image": "/ImagesMaison/musee_sans_abri.png",
    "description": "Quelques objets posés sur une couverture, mais avec beaucoup de dignité."
  },
  {
    "id": "ferme",
    "name": "Grange des Souvenirs",
    "image": "/ImagesMaison/musee_ferme.png",
    "description": "Une vieille grange transformée en galerie rustique."
  },
  {
    "id": "cabane",
    "name": "Petite Galerie en Bois",
    "image": "/ImagesMaison/musee_cabane.png",
    "description": "Une galerie chaleureuse, éclairée par des lanternes."
  },
  {
    "id": "village",
    "name": "Galerie du Village",
    "image": "/ImagesMaison/musee_village.png",
    "description": "Une salle d'exposition accueillante au cœur du village."
  },
  {
    "id": "manoir",
    "name": "Salon des Reliques",
    "image": "/ImagesMaison/musee_manoir.png",
    "description": "Un salon élégant réservé aux objets précieux."
  },
  {
    "id": "villa",
    "name": "Galerie Noble",
    "image": "/ImagesMaison/musee_villa.png",
    "description": "Une galerie raffinée aux vitrines lumineuses."
  },
  {
    "id": "chateau",
    "name": "Musée Royal",
    "image": "/ImagesMaison/musee_royal.png",
    "description": "Une galerie royale éclairée par les cristaux de TailBlue."
  }
] as const;

export const ROADMAP = [
  {
    id: "desktop",
    status: "done",
    title: "Fondation Desktop",
    description: "Navigation Tauri, identité visuelle, dashboard et premières pages de jeu."
  },
  {
    id: "game-pages",
    status: "current",
    title: "Interfaces TailBlue",
    description: "Personnage, inventaire, pets, maison, market, quêtes, mine, hunt, work, chenil, musée et outils."
  },
  {
    id: "backend",
    status: "next",
    title: "Backend TailBlue partagé",
    description: "Remplacer toutes les valeurs temporaires par les profils et moteurs Python réels."
  },
  {
    id: "discord",
    status: "next",
    title: "Connexion Discord",
    description: "OAuth2, avatar, identité et permissions vérifiées côté serveur."
  },
  {
    id: "combat",
    status: "next",
    title: "Combat dans la Mine",
    description: "Compétences, potions, objets, compagnon et animations reliés au moteur de combat."
  },
  {
    id: "conquest",
    status: "later",
    title: "Conquêtes",
    description: "Réservé pour plus tard : le gameplay du bot doit être créé avant l'interface."
  }
] as const;
