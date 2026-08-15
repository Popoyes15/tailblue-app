import type { CommandGroup, CommandGuide } from "../types/information";

function guide(
  id: string,
  icon: string,
  command: string,
  title: string,
  summary: string,
  details?: string,
): CommandGuide {
  return {
    id,
    icon,
    command,
    title,
    summary,
    details: details ?? summary,
    usage: [command],
    source: "helpme",
  };
}

/**
 * Miroir Desktop du HELP_DATA public de TailBlue.
 * Source de référence utilisée pour cette version : main.py du 14.08.2026.
 * Le Wiki n'ajoute volontairement aucune commande admin/Hime à ce catalogue public.
 */
export const COMMAND_GROUPS: CommandGroup[] = [
  {
    id: "depart",
    icon: "🌸",
    title: "Départ",
    description: "Créer son profil et accéder aux outils de départ du Royaume.",
    commands: [
      guide("start", "🚀", "!start", "Créer son profil", "Créer ton profil TailBlue."),
      guide("helpme", "📖", "!helpme", "Guide du Royaume", "Afficher le guide complet du Royaume."),
      guide("idees", "💡", "!idees", "Proposer une idée", "Proposer une idée pour améliorer le Royaume."),
      guide("monid", "🆔", "!monid", "Identifiant Discord", "Afficher ton identifiant Discord."),
    ],
  },
  {
    id: "interactions",
    icon: "💜",
    title: "Interactions",
    description: "Interagir avec les autres habitants et alimenter les systèmes sociaux.",
    commands: [
      guide("calin", "🤗", "!calin @joueur", "Faire un câlin", "Faire un câlin à un joueur."),
      guide("bisou", "😘", "!bisou @joueur", "Faire un bisou", "Faire un bisou à un joueur."),
      guide("patpat", "🐾", "!patpat @joueur", "Patpat", "Caresser un joueur."),
      guide("cookie", "🍪", "!cookie @joueur", "Offrir un cookie", "Offrir un délicieux cookie."),
      guide("slap", "👋", "!slap @joueur", "Slap", "Donner une gifle."),
      guide("megaslap", "💥", "!megaslap @joueur", "Mega Slap", "Infliger une gifle légendaire."),
      guide("sendcookies", "📦", "!sendcookies", "Distribuer des cookies", "Distribuer plusieurs cookies."),
    ],
  },
  {
    id: "economie",
    icon: "🍪",
    title: "Économie",
    description: "Marché entre joueurs, courrier, Daily, quêtes, coffres et cookies.",
    commands: [
      guide("marchejoueur", "🏪", "!marchejoueur", "Marché des joueurs", "Ouvrir le marché commun et filtrer les offres par aventurier."),
      guide("lettre", "💌", "!lettre @joueur", "Envoyer une lettre", "Envoyer une lettre privée conservée par TailBlue."),
      guide("courriers", "📮", "!courriers", "Boîte aux lettres", "Consulter les lettres reçues dans la boîte aux lettres."),
      guide("daily", "🎁", "!daily", "Récompense quotidienne", "Réclamer la récompense quotidienne."),
      guide("quest", "📜", "!quest", "Quêtes", "Afficher les quêtes disponibles."),
      guide("claimquest", "✅", "!claimquest", "Réclamer une quête", "Réclamer la récompense d'une quête terminée."),
      guide("coffre", "🧰", "!coffre", "Coffre", "Ouvrir un coffre."),
      guide("cookiejar", "🍪", "!cookiejar", "Cookie Jar", "Voir ton stock de cookies."),
      guide("cookiesrestants", "📊", "!cookiesrestants", "Cookies restants", "Afficher les cookies restants aujourd'hui."),
    ],
  },
  {
    id: "travail",
    icon: "💼",
    title: "Travail",
    description: "Choisir un métier, travailler et consulter sa progression professionnelle.",
    commands: [
      guide("jobs", "🛠️", "!jobs", "Liste des métiers", "Afficher tous les métiers."),
      guide("job", "👷", "!job mineur", "Choisir un métier", "Choisir un métier."),
      guide("jobinfo", "📖", "!jobinfo mineur", "Informations métier", "Afficher les informations d'un métier."),
      guide("work", "💼", "!work", "Travailler", "Travailler."),
      guide("workstats", "📈", "!workstats", "Statistiques de travail", "Afficher tes statistiques de travail."),
      guide("topwork", "🏆", "!topwork", "Classement du travail", "Classement des meilleurs travailleurs."),
    ],
  },
  {
    id: "aventure",
    icon: "⚔️",
    title: "Aventure",
    description: "Partir en chasse, gérer le loot et compléter son musée.",
    commands: [
      guide("hunt", "🏹", "!hunt", "Partir à l'aventure", "Partir à l'aventure."),
      guide("sellloot", "💰", "!sellloot <objet>", "Vendre un loot", "Vendre un objet trouvé durant tes aventures."),
      guide("musee", "🏛️", "!musee", "Musée", "Afficher ta collection du musée."),
      guide("museeadd", "🖼️", "!museeadd <objet>", "Exposer un objet", "Déposer un objet dans ton musée."),
    ],
  },
  {
    id: "guildes",
    icon: "🏰",
    title: "Guildes",
    description: "Créer une guilde, gérer ses membres et lancer des activités collectives.",
    commands: [
      guide("guildcreate", "🏰", "!guildcreate <nom>", "Créer une guilde", "Créer une nouvelle guilde."),
      guide("guild", "📜", "!guild", "Voir sa guilde", "Afficher les informations de ta guilde."),
      guide("guildinvite", "📨", "!guildinvite @joueur", "Inviter un joueur", "Inviter un joueur."),
      guide("guilddeposit", "💰", "!guilddeposit <montant>", "Déposer au trésor", "Déposer des TailCoins dans la banque de guilde."),
      guide("guildwork", "⚒️", "!guildwork", "Travail de guilde", "Faire travailler la guilde."),
      guide("guildhunt", "🏹", "!guildhunt", "Chasse de guilde", "Envoyer la guilde en chasse."),
      guide("expedition", "⚔️", "!expedition", "Expédition", "Lancer une expédition de guilde."),
      guide("hall", "🏛️", "!hall", "Hall des Reliques", "Visiter le Hall des Reliques."),
      guide("legendes", "📜", "!legendes", "Légendes", "Consulter les légendes de la guilde."),
    ],
  },
  {
    id: "habitations",
    icon: "🏠",
    title: "Habitations",
    description: "Découvrir, prévisualiser, acheter et consulter les résidences.",
    commands: [
      guide("listhouse", "📋", "!listhouse", "Liste des maisons", "Afficher toutes les maisons."),
      guide("housepreview", "👀", "!housepreview <maison>", "Prévisualiser", "Prévisualiser une habitation."),
      guide("housebuy", "🛒", "!housebuy <maison>", "Acheter une maison", "Acheter une habitation."),
      guide("house", "🏡", "!house", "Ma maison", "Afficher ta maison actuelle."),
    ],
  },
  {
    id: "mariage",
    icon: "💞",
    title: "Mariage",
    description: "Couple, bague, demande, mariage et progression du couple.",
    commands: [
      guide("couple", "💕", "!couple @joueur", "Couple", "Afficher les informations d'un couple."),
      guide("buyring", "💍", "!buyring", "Bague de fiançailles", "Acheter une bague de fiançailles."),
      guide("propose", "💖", "!propose @joueur", "Demande en mariage", "Demander un joueur en mariage."),
      guide("marriage", "💒", "!marriage", "Mon mariage", "Afficher les informations de ton mariage."),
      guide("marriage-royal", "👑", "!marriage royal", "Mariages royaux", "Consulter le classement des mariages."),
      guide("couplestats", "📊", "!couplestats", "Statistiques du couple", "Afficher les statistiques de ton couple."),
    ],
  },
  {
    id: "compagnons",
    icon: "🐉",
    title: "Compagnons",
    description: "Adoption, Œuf des Origines, compagnons et dragons.",
    commands: [
      guide("petshop", "🛒", "!petshop", "Boutique des compagnons", "Afficher la boutique des compagnons."),
      guide("adopt", "🐾", "!adopt <compagnon>", "Adopter", "Adopter un compagnon."),
      guide("adopt-dragon", "🥚", "!adopt dragon", "Œuf des Origines", "Acheter un Œuf des Origines."),
      guide("pet", "🐉", "!pet", "Mon compagnon", "Afficher ton compagnon actuel."),
      guide("eclore", "🥚", "!eclore", "Éclosion", "Faire éclore ton Œuf des Origines."),
      guide("sellpet", "💰", "!sellpet <compagnon>", "Vendre un compagnon", "Vendre un compagnon classique."),
      guide("selldragon", "👑", "!selldragon <dragon>", "Vendre un dragon", "Vendre un dragon."),
    ],
  },
  {
    id: "inventaire",
    icon: "🎒",
    title: "Inventaire",
    description: "Consulter, transférer et vendre les objets possédés.",
    commands: [
      guide("inventaire", "🎒", "!inventaire", "Inventaire", "Afficher ton inventaire."),
      guide("giveitem", "🎁", "!giveitem @joueur <objet>", "Donner un objet", "Donner un objet à un joueur."),
      guide("vendre", "💰", "!vendre [objet]", "Comptoir de vente", "Ouvrir le comptoir et vendre objets normaux ou loot de métier."),
    ],
  },
  {
    id: "royaume",
    icon: "🏛️",
    title: "Royaume",
    description: "Fiscalité et réactions du Royaume.",
    commands: [
      guide("taxes", "💰", "!taxes", "Impôts", "Consulter les impôts du Royaume."),
      guide("grogne", "😠", "!grogne", "Mécontentement", "Afficher le niveau de mécontentement de la population."),
      guide("evasionfiscale", "🦹", "!evasionfiscale", "Évasion fiscale", "Tenter une évasion fiscale..."),
    ],
  },
  {
    id: "profil",
    icon: "📊",
    title: "Profil",
    description: "Profil, réputation et classements publics.",
    commands: [
      guide("profil", "👤", "!profil", "Profil", "Afficher ton profil."),
      guide("reputation", "⭐", "!reputation", "Réputation", "Afficher ta réputation."),
      guide("topniveau", "🏆", "!topniveau", "Classement des niveaux", "Classement des niveaux."),
      guide("topcalins", "🤗", "!topcalins", "Classement des câlins", "Classement des câlins."),
      guide("statscalin", "📈", "!statscalin", "Statistiques de câlins", "Afficher tes statistiques de câlins."),
    ],
  },
  {
    id: "fun",
    icon: "🎲",
    title: "Fun",
    description: "Commandes légères pour s'amuser dans le Royaume.",
    commands: [
      guide("8ball", "🎱", "!8ball <question>", "Boule magique", "Poser une question à la boule magique."),
    ],
  },
];

export const COMMAND_COUNT = COMMAND_GROUPS.reduce((total, group) => total + group.commands.length, 0);
export const GROUP_COUNT = COMMAND_GROUPS.length;

export const ALL_COMMANDS = COMMAND_GROUPS.flatMap((group) =>
  group.commands.map((command) => ({ ...command, groupId: group.id, groupTitle: group.title, groupIcon: group.icon })),
);
