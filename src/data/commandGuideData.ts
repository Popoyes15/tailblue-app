export type CommandGuide = {
  id: string;
  command: string;
  title: string;
  icon: string;
  summary: string;
  details: string;
  usage: string[];
  prerequisites?: string[];
  effects?: string[];
  tips?: string[];
  related?: string[];
  adminOnly?: boolean;
};

export type CommandGroup = {
  id: string;
  icon: string;
  title: string;
  description: string;
  commands: CommandGuide[];
};

export const COMMAND_GROUPS: CommandGroup[] = [
  {
    id: "start",
    icon: "🌸",
    title: "Départ",
    description: "Créer son profil, comprendre TailBlue et retrouver les outils de base.",
    commands: [
      {
        id: "start",
        command: "!start",
        title: "Commencer l'aventure",
        icon: "🚀",
        summary: "Crée ton profil TailBlue et initialise ton aventure.",
        details: "C'est la première commande à utiliser. Elle crée les données nécessaires à ton personnage afin que les autres systèmes puissent ensuite reconnaître ton compte.",
        usage: ["!start"],
        effects: ["Crée le profil du joueur.", "Initialise les données indispensables au Royaume."],
        tips: ["À faire une seule fois par compte."],
        related: ["!profil", "!helpme"],
      },
      {
        id: "helpme",
        command: "!helpme",
        title: "Guide rapide Discord",
        icon: "📖",
        summary: "Ouvre le guide par catégories directement sur Discord.",
        details: "Le guide Discord reste la version rapide : catégories, commandes et descriptions courtes. Le Wiki de l'application est sa version développée, avec syntaxe, conditions, effets et conseils.",
        usage: ["!helpme"],
        effects: ["Ouvre le menu de catégories du guide."],
        tips: ["Utilise le Wiki de l'application quand tu veux une explication complète."],
        related: ["!start"],
      },
      {
        id: "idees",
        command: "!idees",
        title: "Proposer une idée",
        icon: "💡",
        summary: "Envoie une suggestion pour faire évoluer TailBlue.",
        details: "Permet de proposer une idée à Hime-sama. Les suggestions sont destinées au système ShowIdées afin d'être lues, classées et suivies.",
        usage: ["!idees"],
        effects: ["Ouvre le système de proposition d'idées."],
        tips: ["Décris surtout ce que tu aimerais pouvoir faire dans le jeu et pourquoi."],
      },
      {
        id: "monid",
        command: "!monid",
        title: "Afficher son ID Discord",
        icon: "🆔",
        summary: "Affiche l'identifiant Discord associé à ton compte.",
        details: "L'ID Discord est l'identifiant numérique stable utilisé par TailBlue pour relier un profil au bon joueur.",
        usage: ["!monid"],
        tips: ["Utile pour le support ou certaines vérifications administratives."],
      },
    ],
  },
  {
    id: "social",
    icon: "💜",
    title: "Interactions",
    description: "Créer des interactions sociales avec les autres habitants du Royaume.",
    commands: [
      { id:"calin", command:"!calin @joueur", title:"Faire un câlin", icon:"🤗", summary:"Envoie un câlin à un autre joueur.", details:"Interaction sociale historique de TailBlue. Elle alimente les statistiques de câlins et certains classements.", usage:["!calin @joueur"], effects:["Ajoute une interaction sociale.","Met à jour les compteurs liés aux câlins."], related:["!statscalin","!topcalins"] },
      { id:"bisou", command:"!bisou @joueur", title:"Faire un bisou", icon:"😘", summary:"Envoie un bisou à un autre joueur.", details:"Une interaction sociale affectueuse avec un autre habitant du Royaume.", usage:["!bisou @joueur"] },
      { id:"patpat", command:"!patpat @joueur", title:"Patpat", icon:"🐾", summary:"Fait un patpat à un joueur.", details:"Une interaction légère et amicale pensée pour les échanges du serveur.", usage:["!patpat @joueur"] },
      { id:"cookie", command:"!cookie @joueur", title:"Offrir un cookie", icon:"🍪", summary:"Offre un cookie à quelqu'un.", details:"Commande sociale autour de la monnaie emblématique de TailBlue. Selon le système concerné, les compteurs et limites quotidiennes peuvent être pris en compte.", usage:["!cookie @joueur"], related:["!cookiejar","!cookiesrestants"] },
      { id:"slap", command:"!slap @joueur", title:"Slap", icon:"👋", summary:"Donne une gifle légère à un joueur.", details:"Commande fun d'interaction. À utiliser pour plaisanter, pas pour déclencher une guerre civile dans le Royaume.", usage:["!slap @joueur"], related:["!megaslap"] },
      { id:"megaslap", command:"!megaslap @joueur", title:"Mega Slap", icon:"💥", summary:"Version beaucoup plus dramatique du slap.", details:"Une variante volontairement exagérée de l'interaction slap, pour les moments où la diplomatie a clairement échoué.", usage:["!megaslap @joueur"], related:["!slap"] },
      { id:"sendcookies", command:"!sendcookies", title:"Distribuer des cookies", icon:"📦", summary:"Permet de distribuer plusieurs cookies.", details:"Outil d'interaction économique/sociale permettant une distribution de cookies selon le système prévu par le bot.", usage:["!sendcookies"], related:["!cookie","!cookiejar"] },
    ],
  },
  {
    id: "economy",
    icon: "🍪",
    title: "Économie & quotidien",
    description: "Récompenses régulières, quêtes, coffres et suivi des cookies.",
    commands: [
      { id:"daily", command:"!daily", title:"Récompense quotidienne", icon:"🎁", summary:"Récupère la récompense du jour.", details:"Le Daily récompense la connexion régulière et peut aussi faire progresser d'autres systèmes, notamment certaines quêtes ou incubations.", usage:["!daily"], effects:["Donne les récompenses quotidiennes.","Peut avancer des progressions liées au Daily."], tips:["Pense à le faire une fois par jour."], related:["!quest"] },
      { id:"quest", command:"!quest", title:"Voir ses quêtes", icon:"📜", summary:"Affiche les quêtes disponibles et leur progression.", details:"Permet de savoir quelles tâches sont actives, leur objectif et si une récompense peut être réclamée.", usage:["!quest"], related:["!claimquest"] },
      { id:"claimquest", command:"!claimquest", title:"Réclamer une quête", icon:"✅", summary:"Récupère la récompense d'une quête terminée.", details:"À utiliser lorsqu'un objectif de quête est validé et que la récompense attend encore d'être récupérée.", usage:["!claimquest"], prerequisites:["Avoir une quête terminée et réclamable."], related:["!quest"] },
      { id:"coffre", command:"!coffre", title:"Ouvrir un coffre", icon:"🧰", summary:"Ouvre un coffre disponible.", details:"Les coffres permettent d'obtenir des récompenses et objets selon les tables de loot du Royaume.", usage:["!coffre"], prerequisites:["Posséder ou avoir accès à un coffre utilisable."] },
      { id:"cookiejar", command:"!cookiejar", title:"Voir ses cookies", icon:"🍪", summary:"Affiche ton stock de cookies.", details:"Consultation rapide de ta réserve de cookies, la monnaie économique principale de nombreux systèmes TailBlue.", usage:["!cookiejar"] },
      { id:"cookiesrestants", command:"!cookiesrestants", title:"Limite quotidienne", icon:"📊", summary:"Affiche les cookies encore disponibles aujourd'hui.", details:"Permet de suivre la quantité restante lorsqu'un mécanisme quotidien impose une limite de distribution ou de gain concernée.", usage:["!cookiesrestants"], related:["!cookie","!sendcookies"] },
    ],
  },
  {
    id: "work",
    icon: "💼",
    title: "Travail & métiers",
    description: "Choisir un métier, travailler et faire progresser son personnage et ses compagnons.",
    commands: [
      { id:"job", command:"!job <métier>", title:"Choisir un métier", icon:"🧑‍🏭", summary:"Choisit ou change ton métier si ton niveau le permet.", details:"Chaque métier possède un niveau requis. La commande vérifie ton niveau, enregistre le métier choisi et déclenche la cérémonie correspondante.", usage:["!job mineur","!job bucheron","!job fermier"], prerequisites:["Avoir un profil TailBlue.","Atteindre le niveau requis du métier."], effects:["Enregistre le métier actif.","Peut débloquer des succès ou contenus liés au métier."], related:["!work"] },
      { id:"work", command:"!work", title:"Travailler", icon:"🛠️", summary:"Effectue une activité liée à ton métier.", details:"Le Work utilise ton métier actuel, peut donner des cookies, de l'XP, de la réputation et du loot. Les compagnons actifs peuvent modifier les gains ou le temps de repos.", usage:["!work"], prerequisites:["Avoir choisi un métier.","Ne pas être encore en cooldown."], effects:["Cookies et XP.","Réputation.","Progression de quêtes et de certains compagnons.","Possibilité de loot ou événement."], tips:["Les bonus de compagnon peuvent changer le résultat."], related:["!job","!quest","!chenil"] },
    ],
  },
  {
    id: "adventure",
    icon: "⚔️",
    title: "Aventure",
    description: "Explorer, chasser et récupérer des ressources ou trophées.",
    commands: [
      { id:"hunt", command:"!hunt", title:"Partir en chasse", icon:"🏹", summary:"Lance une chasse et ses événements.", details:"La chasse met en scène une rencontre, tient compte du joueur et de ses compagnons, puis distribue les récompenses et progressions prévues par le bot.", usage:["!hunt"], effects:["XP et cookies selon le résultat.","Réputation.","Loot potentiel.","Progression de quête et incubation."], related:["!quest","!chenil"] },
      { id:"mine", command:"!mine", title:"Entrer dans la Mine", icon:"⛏️", summary:"Ouvre l'expédition minière interactive.", details:"La Mine est un système d'exploration avec salles, ressources, dangers et combats. Une fois ouverte, l'interface prend le relais pour les déplacements et actions disponibles.", usage:["!mine"], effects:["Exploration et collecte de ressources.","Rencontres et combats selon les salles."], tips:["Les matériaux de la Mine servent notamment au craft."], related:["!craft","!equipement"] },
    ],
  },
  {
    id: "rpg",
    icon: "🗡️",
    title: "RPG, race & équipement",
    description: "Consulter l'inventaire RPG, porter de l'équipement et gérer les capacités du personnage.",
    commands: [
      { id:"equipement", command:"!equipement", title:"Équipement RPG", icon:"⚔️", summary:"Ouvre l'interface de l'équipement et de l'inventaire RPG.", details:"Cette interface utilise l'inventaire RPG canonique de TailBlue. Elle permet de consulter les objets portés et les différentes catégories d'équipement.", usage:["!equipement"], prerequisites:["Avoir un profil TailBlue."], related:["!races","!competences","!craft"] },
      { id:"races", command:"!races", title:"Races", icon:"🧬", summary:"Affiche ta race ou permet le choix initial.", details:"Si aucune race n'est encore choisie, la commande affiche les races auxquelles ton compte a accès. Une fois une race enregistrée, elle devient normalement verrouillée.", usage:["!races","!race"], prerequisites:["Avoir un profil TailBlue."], related:["!competences","!equipement"] },
      { id:"competences", command:"!competences", title:"Compétences", icon:"✨", summary:"Ouvre l'interface des compétences de race.", details:"Permet de consulter les compétences disponibles et les choix liés à la progression de ton personnage.", usage:["!competences"], prerequisites:["Avoir un profil et une race configurée."], related:["!races","!equipement"] },
      { id:"craft", command:"!craft", title:"Atelier de craft", icon:"🛠️", summary:"Ouvre le catalogue des recettes réalisables.", details:"Le craft utilise les matériaux de ton inventaire RPG et les recettes définies par TailBlue. Les alias !artisanat, !fabriquer et !atelier ouvrent le même système.", usage:["!craft","!artisanat","!fabriquer","!atelier"], prerequisites:["Avoir un profil TailBlue.","Posséder les ressources nécessaires pour fabriquer."], effects:["Consomme les matériaux de la recette.","Ajoute l'objet fabriqué à l'inventaire RPG."], related:["!mine","!equipement"] },
      { id:"craftstats", command:"!craftstats", title:"Statistiques de craft", icon:"📈", summary:"Affiche tes statistiques d'artisanat.", details:"Présente notamment les objets que tu as le plus fabriqués et les compteurs enregistrés par le système de craft.", usage:["!craftstats","!artisanatstats"], related:["!craft"] },
    ],
  },
  {
    id: "companions",
    icon: "🐾",
    title: "Compagnons & chenil",
    description: "Adopter, consulter et gérer les compagnons du joueur.",
    commands: [
      { id:"petshop", command:"!petshop", title:"Bestiaire d'adoption", icon:"📚", summary:"Ouvre le catalogue des compagnons adoptables.", details:"Affiche les compagnons avec leur rareté, valeur d'adoption, description, habitat, tempérament et pouvoir avant adoption.", usage:["!petshop"], related:["!adopt","!chenil"] },
      { id:"adopt", command:"!adopt <pet_id>", title:"Adopter un compagnon", icon:"🐾", summary:"Adopte le compagnon correspondant à son identifiant.", details:"La commande vérifie l'existence du compagnon, ta capacité de chenil, tes cookies et évite les doublons avant d'ajouter le compagnon à ton profil.", usage:["!adopt dragon"], prerequisites:["Avoir un profil TailBlue.","Avoir assez de place dans le chenil.","Avoir assez de cookies si l'adoption est payante."], effects:["Ajoute le compagnon au profil.","Initialise ses données personnelles.","Peut l'activer automatiquement si une place est libre."], related:["!petshop","!chenil"] },
      { id:"chenil", command:"!chenil", title:"Ouvrir le chenil", icon:"🏡", summary:"Ouvre l'interface complète des compagnons et provisions.", details:"Le chenil centralise les compagnons possédés, les emplacements actifs, les relations, les soins et l'intendance. !pets est un alias de la même commande.", usage:["!chenil","!pets"], prerequisites:["Avoir un profil TailBlue."], effects:["Initialise et synchronise les données nécessaires aux compagnons."], related:["!petshop","!adopt","!work","!hunt"] },
    ],
  },
  {
    id: "world",
    icon: "🏰",
    title: "Monde, maisons & marché",
    description: "Résidences, collections et économie du Royaume.",
    commands: [
      { id:"house", command:"!house", title:"Voir sa résidence", icon:"🏠", summary:"Affiche la résidence effective du joueur.", details:"Présente ta maison actuelle et son ambiance. Les règles de résidence peuvent tenir compte de situations particulières du Royaume.", usage:["!house"], related:["!listhouse","!housepreview","!housebuy"] },
      { id:"listhouse", command:"!listhouse", title:"Catalogue des maisons", icon:"🏘️", summary:"Affiche les résidences disponibles.", details:"Permet de parcourir les maisons du Royaume avant d'en prévisualiser ou acheter une.", usage:["!listhouse"], related:["!housepreview","!housebuy"] },
      { id:"housepreview", command:"!housepreview <maison_id>", title:"Prévisualiser une maison", icon:"👁️", summary:"Affiche le prix et l'extérieur d'une résidence.", details:"Utile pour voir une maison précise avant l'achat. L'identifiant correspond à la maison du catalogue, par exemple ferme.", usage:["!housepreview ferme"], related:["!listhouse","!housebuy"] },
      { id:"housebuy", command:"!housebuy <maison_id>", title:"Acheter une maison", icon:"🔑", summary:"Achète une résidence accessible au joueur.", details:"La commande vérifie l'existence de la maison, son caractère achetable, le niveau requis et les ressources nécessaires avant de modifier la résidence du profil.", usage:["!housebuy ferme"], prerequisites:["Avoir le niveau demandé.","Avoir assez de cookies.","La résidence doit être achetable."], related:["!listhouse","!housepreview","!house"] },
      { id:"market", command:"!market", title:"Marché du Royaume", icon:"🏘️", summary:"Ouvre le marché et ses bâtiments.", details:"Le Market est une interface évolutive liée à la reconstruction de ses bâtiments. Les alias !marche et !marcheduroyaume ouvrent la même interface.", usage:["!market","!marche","!marcheduroyaume"], prerequisites:["Avoir un profil TailBlue."], effects:["Affiche le marché actuel et les boutiques accessibles.","Permet les transactions et améliorations prévues par l'interface."], related:["!craft","!equipement"] },
      { id:"musee", command:"!musee", title:"Musée personnel", icon:"🏛️", summary:"Ouvre ta collection ou compare plusieurs musées.", details:"Sans mention, ouvre ta collection avec tri et pagination. Avec des mentions, la commande peut comparer ton musée à ceux d'autres joueurs.", usage:["!musee","!musee @joueur","!musee @joueur1 @joueur2"], effects:["Affiche les pièces exposées et leur valeur estimée."], related:["!museeadd"] },
      { id:"museeadd", command:"!museeadd [objet]", title:"Exposer un objet", icon:"🖼️", summary:"Dépose une pièce exposable dans le musée.", details:"L'interface recherche les objets éligibles dans tes sacs, te permet de choisir une pièce et confirme son ajout à la collection.", usage:["!museeadd","!museeadd nom de l'objet"], prerequisites:["Posséder une pièce exposable."], effects:["Retire la pièce du sac concerné.","Ajoute la pièce au musée."], tips:["Une pièce exposée est destinée à devenir une partie de ta collection permanente."], related:["!musee"] },
    ],
  },
  {
    id: "guild",
    icon: "🏰",
    title: "Guildes",
    description: "Vie de guilde, missions, chasses, expéditions et reliques.",
    commands: [
      { id:"guild", command:"!guild", title:"Registre de guilde", icon:"🏰", summary:"Affiche les informations de ta guilde.", details:"Montre le fondateur, le niveau, l'XP, le trésor, les membres, le Hall et les principales activités disponibles.", usage:["!guild"], prerequisites:["Appartenir à une guilde."], related:["!guildwork","!guildhunt","!expedition","!hall"] },
      { id:"guildinvite", command:"!guildinvite @joueur", title:"Inviter dans la guilde", icon:"📨", summary:"Invite un joueur dans ta guilde.", details:"Le fondateur peut inviter un joueur si la guilde a encore une place et si la cible n'appartient pas déjà à une autre guilde.", usage:["!guildinvite @joueur"], prerequisites:["Être le fondateur de la guilde.","Avoir une place disponible."], related:["!guild"] },
      { id:"guildwork", command:"!guildwork", title:"Mission de guilde", icon:"💼", summary:"Effectue une activité de travail pour la guilde.", details:"Contribue à la progression collective et au fonctionnement économique de la guilde selon les règles du bot.", usage:["!guildwork"], prerequisites:["Appartenir à une guilde."], related:["!guild"] },
      { id:"guildhunt", command:"!guildhunt", title:"Chasse de guilde", icon:"⚔️", summary:"Lance le système GuildHunt.", details:"Les GuildHunts sont des missions de groupe avec rangs, histoires, affrontements et chroniques persistantes.", usage:["!guildhunt"], prerequisites:["Appartenir à une guilde."], related:["!chroniqueschasse","!guild"] },
      { id:"expedition", command:"!expedition", title:"Expédition de guilde", icon:"🗺️", summary:"Lance une expédition collective.", details:"Activité de guilde orientée aventure, progression et découvertes selon les contenus disponibles.", usage:["!expedition"], prerequisites:["Appartenir à une guilde."], related:["!guild","!hall"] },
      { id:"hall", command:"!hall", title:"Hall des Reliques", icon:"🏛️", summary:"Ouvre le Hall de la guilde.", details:"Le Hall présente les reliques, collections et progression prestigieuse liées à la guilde.", usage:["!hall"], prerequisites:["Appartenir à une guilde."], related:["!guild","!expedition"] },
      { id:"legendes", command:"!legendes", title:"Légendes de guilde", icon:"📜", summary:"Consulte les légendes et récits débloqués.", details:"Rassemble les récits et contenus narratifs révélés par les activités de la guilde.", usage:["!legendes"], prerequisites:["Appartenir à une guilde."] },
      { id:"chroniqueschasse", command:"!chroniqueschasse", title:"Chroniques GuildHunt", icon:"📚", summary:"Relit les chroniques de chasse terminées par ta guilde.", details:"Affiche les véritables sessions GuildHunt archivées pour la guilde. L'alias !guildchroniques ouvre la même bibliothèque.", usage:["!chroniqueschasse","!guildchroniques"], prerequisites:["Appartenir à une guilde.","Avoir au moins une chronique achevée."], related:["!guildhunt"] },
    ],
  },
  {
    id: "profile",
    icon: "📊",
    title: "Profil & classements",
    description: "Retrouver ses statistiques et se comparer aux autres aventuriers.",
    commands: [
      { id:"profil", command:"!profil", title:"Profil TailBlue", icon:"👤", summary:"Affiche ton profil complet.", details:"Regroupe les principales informations du joueur : progression, identité de jeu, résidence, compagnons, profession et statistiques disponibles.", usage:["!profil"] },
      { id:"reputation", command:"!reputation", title:"Réputation", icon:"⭐", summary:"Affiche ta réputation dans le Royaume.", details:"Permet de consulter la réputation royale accumulée au fil des activités et interactions concernées.", usage:["!reputation"] },
      { id:"topniveau", command:"!topniveau", title:"Classement des niveaux", icon:"🏆", summary:"Classe les joueurs selon leur niveau.", details:"Affiche le classement des aventuriers selon la progression de niveau enregistrée par TailBlue.", usage:["!topniveau"] },
      { id:"topcalins", command:"!topcalins", title:"Classement des câlins", icon:"🤗", summary:"Affiche les aventuriers les plus actifs dans les câlins.", details:"Classement social fondé sur les compteurs de câlins enregistrés par le bot.", usage:["!topcalins"], related:["!calin","!statscalin"] },
      { id:"statscalin", command:"!statscalin", title:"Statistiques de câlins", icon:"📈", summary:"Affiche tes statistiques personnelles de câlins.", details:"Permet de retrouver tes compteurs liés aux câlins donnés et reçus.", usage:["!statscalin"], related:["!calin","!topcalins"] },
    ],
  },
  {
    id: "fun",
    icon: "🎲",
    title: "Fun",
    description: "Petites commandes destinées aux moments plus légers du serveur.",
    commands: [
      { id:"8ball", command:"!8ball <question>", title:"Boule magique", icon:"🎱", summary:"Pose une question à la boule magique.", details:"Commande purement fun qui renvoie une réponse aléatoire à ta question. À ne pas utiliser pour décider de l'avenir politique du Royaume.", usage:["!8ball Est-ce que je vais trouver un dragon ?"] },
    ],
  },
  {
    id: "hime",
    icon: "👑",
    title: "Hime Control",
    description: "Commandes administratives réservées à Hime-sama. Elles devront être masquées aux autres joueurs par le backend.",
    commands: [
      { id:"update", command:"!update", title:"Publier une mise à jour", icon:"📢", summary:"Prépare et publie une annonce officielle TailBlue.", details:"Le centre de mise à jour permet de charger un texte, choisir la mention, prévisualiser puis publier. Avec la V2, les images jointes deviennent aussi les visuels des nouveautés de l'application et l'annonce est enregistrée dans le flux structuré.", usage:["!update","!update here","!update everyone"], effects:["Publie dans le salon officiel Updates.","Enregistre l'article pour la page Nouveautés.","Utilise la première image jointe comme couverture Discord."], tips:["Joins un .txt/.md pour les très gros textes et une ou plusieurs images pour l'article."], adminOnly:true },
      { id:"statsserveur", command:"!statsserveur [période]", title:"Statistiques serveur", icon:"📊", summary:"Envoie le rapport privé d'activité du serveur officiel.", details:"Permet de demander le rapport du jour, de la semaine ou du mois avec commandes, joueurs actifs et moyennes.", usage:["!statsserveur aujourdhui","!statsserveur semaine","!statsserveur mois"], adminOnly:true },
      { id:"serveurs", command:"!serveurs", title:"Serveurs de TailBlue", icon:"🌐", summary:"Liste les serveurs sur lesquels TailBlue est présent.", details:"Envoie en privé la liste des serveurs vus par le bot, avec leur statut officiel/externe et informations principales.", usage:["!serveurs"], adminOnly:true },
      { id:"infoserveur", command:"!infoserveur <ID>", title:"Informations serveur", icon:"🔎", summary:"Affiche les informations connues sur un serveur précis.", details:"Utilise l'ID d'un serveur sur lequel TailBlue est présent afin d'obtenir ses informations visibles par le bot.", usage:["!infoserveur 123456789"], adminOnly:true },
      { id:"quitterserveur", command:"!quitterserveur <ID>", title:"Quitter un serveur externe", icon:"🚪", summary:"Fait quitter à TailBlue un serveur externe précis.", details:"Commande sensible. Le serveur officiel est protégé et ne peut pas être quitté par cette commande.", usage:["!quitterserveur 123456789"], adminOnly:true },
      { id:"setwelcome", command:"!setwelcomechannel #salon", title:"Salon de bienvenue", icon:"👋", summary:"Définit le salon officiel des cartes de bienvenue.", details:"Enregistre le canal du serveur officiel dans lequel TailBlue enverra sa carte de bienvenue aux nouveaux membres.", usage:["!setwelcomechannel #bienvenue"], adminOnly:true },
    ],
  },
];

export const COMMAND_COUNT = COMMAND_GROUPS.reduce((total, group) => total + group.commands.length, 0);
