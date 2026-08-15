export type PetFrontend = {
  id: string;
  name: string;
  image: string;
  description: string;
  bonus: string;
  rarity: string;
  habitat: string;
  temperament: string;
  family: string;
  stats: Record<string, number>;
  abilities: Array<{ nom?: string; description?: string }>;
  forms: Record<string, {
    name: string;
    image: string;
    description: string;
    title: string;
  }>;
};

export const PETS: PetFrontend[] = [
  {
    "id": "mouche",
    "name": "🪰 Mouche Fromagère",
    "image": "/Animaux/Mouche.jpg",
    "description": "Une petite mouche qui adore les vieux fromages du Royaume. Personne ne sait pourquoi elle suit toujours les aventuriers.",
    "bonus": "Aucun bonus",
    "rarity": "⚪ Commun",
    "habitat": "🧀 Caves à fromage",
    "temperament": "😵 Envahissant",
    "family": "compagnons",
    "stats": {
      "pv": 20,
      "attaque": 3,
      "defense": 2,
      "vitesse": 18,
      "critique": 2,
      "esquive": 18
    },
    "abilities": [
      {
        "nom": "Bourdonnement infernal",
        "description": "Déconcentre légèrement un adversaire."
      },
      {
        "nom": "Instinct du fromage",
        "description": "Repère toute nourriture oubliée à proximité."
      }
    ],
    "forms": {}
  },
  {
    "id": "lapin",
    "name": "🐰 Lapin TailBlue",
    "image": "/Animaux/lapin.jpg",
    "description": "Compagnon emblématique du Royaume. Il déborde d'énergie et adore récolter des cookies.",
    "bonus": "+5 cookies sur le daily",
    "rarity": "🟢 Peu commun",
    "habitat": "🌼 Prairies Royales",
    "temperament": "😊 Joueur",
    "family": "economie",
    "stats": {
      "pv": 55,
      "attaque": 8,
      "defense": 10,
      "vitesse": 25,
      "critique": 6,
      "esquive": 16
    },
    "abilities": [
      {
        "nom": "Bond joyeux",
        "description": "Augmente brièvement sa vitesse."
      },
      {
        "nom": "Récolte chanceuse",
        "description": "Découvre parfois quelques provisions supplémentaires."
      }
    ],
    "forms": {}
  },
  {
    "id": "chat",
    "name": "🐱 Chat Royal",
    "image": "/Animaux/chat.webp",
    "description": "Il dort près du trône toute la journée... mais personne n'oserait le réveiller.",
    "bonus": "+10 XP sur les quêtes",
    "rarity": "🔵 Rare",
    "habitat": "🏰 Château Royal",
    "temperament": "😼 Paresseux",
    "family": "compagnons",
    "stats": {
      "pv": 70,
      "attaque": 10,
      "defense": 14,
      "vitesse": 20,
      "critique": 8,
      "esquive": 14
    },
    "abilities": [
      {
        "nom": "Sieste tactique",
        "description": "Récupère progressivement de l'énergie."
      },
      {
        "nom": "Regard supérieur",
        "description": "Réduit le courage de l'adversaire."
      }
    ],
    "forms": {}
  },
  {
    "id": "renard",
    "name": "🦊 Renard Mystique",
    "image": "/Animaux/Renard_Mystique.jpg",
    "description": "Les voyageurs racontent qu'il connaît chaque secret de la forêt enchantée.",
    "bonus": "+10% de cookies dans les coffres",
    "rarity": "🟣 Épique",
    "habitat": "🌲 Forêt Enchantée",
    "temperament": "🦝 Rusé",
    "family": "economie",
    "stats": {
      "pv": 85,
      "attaque": 13,
      "defense": 16,
      "vitesse": 30,
      "critique": 12,
      "esquive": 20
    },
    "abilities": [
      {
        "nom": "Ruse sylvestre",
        "description": "Esquive plus facilement les attaques prévisibles."
      },
      {
        "nom": "Piste aux trésors",
        "description": "Augmente les chances de trouver une récompense."
      }
    ],
    "forms": {}
  },
  {
    "id": "hibou",
    "name": "🦉 Hibou Sage",
    "image": "/Animaux/Hibou.jpg",
    "description": "Gardien des bibliothèques royales et protecteur des anciens grimoires.",
    "bonus": "+15 XP sur le !work",
    "rarity": "🟣 Épique",
    "habitat": "📚 Bibliothèque Royale",
    "temperament": "🧐 Sage",
    "family": "travail",
    "stats": {
      "pv": 80,
      "attaque": 9,
      "defense": 18,
      "vitesse": 24,
      "critique": 10,
      "esquive": 14
    },
    "abilities": [
      {
        "nom": "Vision nocturne",
        "description": "Révèle les pièges et passages cachés."
      },
      {
        "nom": "Conseil ancien",
        "description": "Améliore temporairement la précision d'un allié."
      }
    ],
    "forms": {}
  },
  {
    "id": "phoenix",
    "name": "🔥 Phénix Sacré",
    "image": "/Animaux/Phoenix.jpeg",
    "description": "Messager céleste de Hime-sama. Il renaît éternellement de ses cendres.",
    "bonus": "+1 résurrection quotidienne du daily",
    "rarity": "🌌 Mythique",
    "habitat": "☀️ Sanctuaire Céleste",
    "temperament": "✨ Noble",
    "family": "mythiques",
    "stats": {
      "pv": 210,
      "attaque": 20,
      "defense": 32,
      "vitesse": 35,
      "critique": 18,
      "esquive": 16
    },
    "abilities": [
      {
        "nom": "Renaissance",
        "description": "Revient une fois au combat après avoir été vaincu."
      },
      {
        "nom": "Flamme sacrée",
        "description": "Inflige des dégâts et purifie les effets négatifs."
      }
    ],
    "forms": {}
  },
  {
    "id": "chien",
    "name": "🐶 Chien de Chasse Royal",
    "image": "/Animaux/Chien.jpg",
    "description": "Compagnon fidèle des meilleurs pisteurs du Royaume.",
    "bonus": "+15% de réussite sur les chasses de guilde",
    "rarity": "🔵 Rare",
    "habitat": "🌲 Forêts Royales",
    "temperament": "🐾 Loyal",
    "family": "combat",
    "stats": {
      "pv": 110,
      "attaque": 14,
      "defense": 24,
      "vitesse": 28,
      "critique": 10,
      "esquive": 12
    },
    "abilities": [
      {
        "nom": "Pistage royal",
        "description": "Révèle la prochaine action d'un ennemi."
      },
      {
        "nom": "Morsure fidèle",
        "description": "Inflige davantage de dégâts si son maître est blessé."
      }
    ],
    "forms": {}
  },
  {
    "id": "papillon",
    "name": "🦋 Papillon Lunaire",
    "image": "/Animaux/Papillon.jpg",
    "description": "Ses ailes brillent sous la lumière de la lune et portent bonheur aux aventuriers.",
    "bonus": "+10 XP sur le daily",
    "rarity": "🟣 Épique",
    "habitat": "🌸 Jardins Royaux",
    "temperament": "✨ Paisible",
    "family": "travail",
    "stats": {
      "pv": 60,
      "attaque": 7,
      "defense": 12,
      "vitesse": 34,
      "critique": 8,
      "esquive": 24
    },
    "abilities": [
      {
        "nom": "Poussière lunaire",
        "description": "Apaise un allié et améliore sa concentration."
      },
      {
        "nom": "Éclat nocturne",
        "description": "Aveugle brièvement l'adversaire."
      }
    ],
    "forms": {}
  },
  {
    "id": "corbeau",
    "name": "🐦‍⬛ Corbeau Voleur",
    "image": "/Animaux/Corbeau.jpg",
    "description": "Personne ne sait où il cache tous les objets qu'il dérobe...",
    "bonus": "Les coffres coûtent 40 cookies au lieu de 50",
    "rarity": "🟣 Épique",
    "habitat": "🪦 Vieilles Ruines",
    "temperament": "😏 Malicieux",
    "family": "economie",
    "stats": {
      "pv": 75,
      "attaque": 10,
      "defense": 14,
      "vitesse": 36,
      "critique": 14,
      "esquive": 25
    },
    "abilities": [
      {
        "nom": "Larcin",
        "description": "Peut subtiliser une petite ressource à l'adversaire."
      },
      {
        "nom": "Vol obscur",
        "description": "Augmente son esquive pendant un tour."
      }
    ],
    "forms": {}
  },
  {
    "id": "oeuf_origines",
    "name": "🥚 Œuf des Origines",
    "image": "/Dragons/Oeuf_Origines.png",
    "description": "Un œuf ancien dont nul ne connaît la créature qui sommeille à l'intérieur.",
    "bonus": "???",
    "rarity": "🟠 Légendaire",
    "habitat": "❓ Inconnu",
    "temperament": "💤 Endormi",
    "family": "combat",
    "stats": {
      "pv": 0,
      "attaque": 0,
      "defense": 0,
      "vitesse": 0,
      "critique": 0,
      "esquive": 0
    },
    "abilities": [
      {
        "nom": "❓ Inconnue",
        "description": "Son pouvoir demeure encore scellé."
      }
    ],
    "forms": {}
  },
  {
    "id": "panda",
    "name": "🐼 Panda Gourmand",
    "image": "/Animaux/Panda.jpg",
    "description": "Il adore les bambous... et les cookies de Hime-sama.",
    "bonus": "+50 cookies sur le daily",
    "rarity": "🟣 Épique",
    "habitat": "🎋 Bambouseraie",
    "temperament": "😴 Calme",
    "family": "economie",
    "stats": {
      "pv": 160,
      "attaque": 12,
      "defense": 35,
      "vitesse": 12,
      "critique": 6,
      "esquive": 5
    },
    "abilities": [
      {
        "nom": "Roulade de bambou",
        "description": "Percute l'adversaire avec tout son poids."
      },
      {
        "nom": "Pause gourmande",
        "description": "Récupère une partie de ses PV."
      }
    ],
    "forms": {}
  },
  {
    "id": "grenouille",
    "name": "🐸 Grenouille d'Or",
    "image": "/Animaux/Grenouille.jpg",
    "description": "Les habitants racontent qu'elle attire la faveur du Royaume.",
    "bonus": "+1 réputation supplémentaire sur le !work",
    "rarity": "🟣 Épique",
    "habitat": "🌿 Marais Royaux",
    "temperament": "😄 Joyeux",
    "family": "travail",
    "stats": {
      "pv": 90,
      "attaque": 9,
      "defense": 20,
      "vitesse": 30,
      "critique": 9,
      "esquive": 20
    },
    "abilities": [
      {
        "nom": "Bond doré",
        "description": "Esquive une attaque avec une grande agilité."
      },
      {
        "nom": "Chant favorable",
        "description": "Augmente légèrement la chance de l'équipe."
      }
    ],
    "forms": {}
  },
  {
    "id": "ecureuil",
    "name": "🐿️ Écureuil Collectionneur",
    "image": "/Animaux/Ecureuil.jpg",
    "description": "Impossible de savoir où il cache toutes ses trouvailles.",
    "bonus": "Double les loots obtenus grâce aux métiers",
    "rarity": "🟡 Légendaire",
    "habitat": "🌳 Chêne Ancien",
    "temperament": "🤎 Curieux",
    "family": "economie",
    "stats": {
      "pv": 70,
      "attaque": 8,
      "defense": 13,
      "vitesse": 40,
      "critique": 8,
      "esquive": 30
    },
    "abilities": [
      {
        "nom": "Réserve cachée",
        "description": "Produit parfois une ressource supplémentaire."
      },
      {
        "nom": "Fuite acrobatique",
        "description": "Augmente fortement son esquive."
      }
    ],
    "forms": {}
  },
  {
    "id": "cerf",
    "name": "🦌 Cerf Blanc",
    "image": "/Animaux/Cerf.jpg",
    "description": "Protecteur silencieux des anciennes forêts sacrées.",
    "bonus": "Le cooldown du !work passe à 25 minutes",
    "rarity": "🟡 Légendaire",
    "habitat": "🌲 Forêt Sacrée",
    "temperament": "🕊️ Noble",
    "family": "travail",
    "stats": {
      "pv": 150,
      "attaque": 15,
      "defense": 30,
      "vitesse": 32,
      "critique": 11,
      "esquive": 14
    },
    "abilities": [
      {
        "nom": "Charge sacrée",
        "description": "Inflige des dégâts et repousse l'adversaire."
      },
      {
        "nom": "Grâce de la forêt",
        "description": "Accélère temporairement toute l'équipe."
      }
    ],
    "forms": {}
  },
  {
    "id": "loup",
    "name": "🐺 Loup Alpha",
    "image": "/Animaux/Loup.jpg",
    "description": "Chef incontesté de sa meute, il inspire tous les chasseurs.",
    "bonus": "+20% de cookies gagnés pendant les chasses de guilde",
    "rarity": "🟡 Légendaire",
    "habitat": "🏔️ Montagnes du Nord",
    "temperament": "⚔️ Courageux",
    "family": "combat",
    "stats": {
      "pv": 175,
      "attaque": 18,
      "defense": 28,
      "vitesse": 34,
      "critique": 16,
      "esquive": 15
    },
    "abilities": [
      {
        "nom": "Hurlement Alpha",
        "description": "Augmente la puissance de tous les alliés."
      },
      {
        "nom": "Crocs d'Argent",
        "description": "Ignore une partie de la défense ennemie."
      }
    ],
    "forms": {}
  },
  {
    "id": "raton",
    "name": "🦝 Raton Voleur",
    "image": "/Animaux/Raton.jpg",
    "description": "Il récupère discrètement tout ce qui traîne dans les coffres.",
    "bonus": "10% de récupérer le coût d'ouverture d'un coffre",
    "rarity": "🌌 Mythique",
    "habitat": "🌙 Villages abandonnés",
    "temperament": "🦹 Espiègle",
    "family": "economie",
    "stats": {
      "pv": 105,
      "attaque": 12,
      "defense": 21,
      "vitesse": 39,
      "critique": 15,
      "esquive": 28
    },
    "abilities": [
      {
        "nom": "Main légère",
        "description": "Récupère parfois une ressource consommée."
      },
      {
        "nom": "Disparition nocturne",
        "description": "Évite automatiquement une attaque."
      }
    ],
    "forms": {}
  },
  {
    "id": "mimic",
    "name": "👻 Mimic Apprivoisé",
    "image": "/Animaux/Mimic.jpg",
    "description": "Autrefois redouté, il protège désormais son maître contre les siens.",
    "bonus": "35% de transformer un Coffre Maudit en coffre normal",
    "rarity": "🌌 Mythique",
    "habitat": "🏰 Donjons oubliés",
    "temperament": "😈 Fourbe",
    "family": "combat",
    "stats": {
      "pv": 200,
      "attaque": 18,
      "defense": 42,
      "vitesse": 10,
      "critique": 18,
      "esquive": 4
    },
    "abilities": [
      {
        "nom": "Mâchoire surprise",
        "description": "Inflige de lourds dégâts à un adversaire imprudent."
      },
      {
        "nom": "Coffre protecteur",
        "description": "Peut absorber une attaque destinée à son maître."
      }
    ],
    "forms": {}
  },
  {
    "id": "tortue",
    "name": "🐢 Tortue Ancienne",
    "image": "/Animaux/Tortue.jpg",
    "description": "Sa sagesse traverse les siècles et accompagne les aventuriers patients.",
    "bonus": "+25 XP sur le daily",
    "rarity": "🌌 Mythique",
    "habitat": "🏝️ Îles Anciennes",
    "temperament": "🧘 Sage",
    "family": "travail",
    "stats": {
      "pv": 240,
      "attaque": 8,
      "defense": 55,
      "vitesse": 5,
      "critique": 4,
      "esquive": 2
    },
    "abilities": [
      {
        "nom": "Carapace millénaire",
        "description": "Réduit fortement les dégâts reçus."
      },
      {
        "nom": "Sagesse patiente",
        "description": "Régénère progressivement les alliés."
      }
    ],
    "forms": {}
  },
  {
    "id": "ryujin",
    "name": "👑 Ryūjin Originel",
    "image": "/Dragons/Ryujin_Bebe.jpg",
    "description": "Le Dragon dont naquirent toutes les lignées.\n\nPremier dragon à avoir prêté serment à Hime-sama, Ryūjin veille silencieusement sur le Royaume de TailBlue.\nBien que son apparence actuelle soit modeste, une puissance ancestrale sommeille encore en lui.",
    "bonus": "+25 XP sur le !work",
    "rarity": "👑 Unique",
    "habitat": "🌸 Jardins Célestes de Hime-sama",
    "temperament": "👑 Fidèle uniquement à Hime-sama",
    "family": "combat",
    "stats": {
      "pv": 180,
      "attaque": 22,
      "defense": 38,
      "vitesse": 20,
      "critique": 14,
      "esquive": 8
    },
    "abilities": [
      {
        "nom": "Souffle de givre",
        "description": "Inflige des dégâts et ralentit l'adversaire."
      },
      {
        "nom": "Écailles royales",
        "description": "Augmente sa défense lorsqu'il est blessé."
      }
    ],
    "forms": {
      "bebe": {
        "name": "🐣 Jeune Dragon Sacré",
        "image": "/Dragons/Ryujin_Bebe.jpg",
        "description": "Encore jeune, Ryūjin observe le Royaume depuis les Jardins Célestes de Hime-sama.\n\nSon pouvoir sommeille encore, mais le sang des dragons coule déjà dans chacune de ses écailles.",
        "title": "Le Dragon dont naquirent toutes les lignées."
      },
      "juvenile": {
        "name": "🐲 Dragon Juvénile",
        "image": "/Dragons/Ryujin_Juvenile.png",
        "description": "Ryūjin retrouve peu à peu la puissance de ses ancêtres.\n\nLes dragons dispersés à travers le Royaume commencent à ressentir l'appel de leur origine.",
        "title": "Le Dragon dont naquirent toutes les lignées."
      },
      "adulte": {
        "name": "🐉 Dragon Originel",
        "image": "/Dragons/Ryujin_Adulte.png",
        "description": "Le Dieu Dragon s'est enfin éveillé.\n\nLes anciennes légendes racontent que toutes les lignées draconiques portent une infime parcelle du sang de Ryūjin Originel.",
        "title": "Le Dragon dont naquirent toutes les lignées."
      }
    }
  },
  {
    "id": "sugus_tigre",
    "name": "🐯💜 Sugus, Tigre du Serment",
    "image": "/Animaux/Sugus_Bebe.png",
    "description": "Un tigre magique au regard doux lorsqu'il se tourne vers Hime-sama. Il ne demande rien au reste du monde : seulement rester suffisamment près d'elle.",
    "bonus": "+5% de résistance en combat accompagné • protection renforcée de Hime • événements uniques de Sugus",
    "rarity": "👑 Unique",
    "habitat": "💜 Là où se trouve Hime-sama",
    "temperament": "🐯 Extrêmement protecteur, loyal, serviable et doux avec Hime • possessif • indifférent aux autres • méfiant si quelqu’un approche trop • devient immédiatement docile lorsque Hime le rassure",
    "family": "mythiques",
    "stats": {
      "pv": 205,
      "attaque": 28,
      "defense": 42,
      "vitesse": 30,
      "critique": 12,
      "esquive": 17
    },
    "abilities": [
      {
        "nom": "🐾 Présence du Gardien",
        "description": "Sugus se place instinctivement entre Hime et le danger. Plus elle est blessée, plus ses choix deviennent défensifs."
      },
      {
        "nom": "💜 Griffe du Serment",
        "description": "Une frappe lourde contre ce qui menace Hime. Après l'attaque, Sugus reste prêt à s'interposer."
      },
      {
        "nom": "🛡️ Personne ne te touche",
        "description": "Sugus détourne une part importante des dégâts destinés à Hime et les encaisse lui-même."
      },
      {
        "nom": "👑 Le monde entier s’il le faut",
        "description": "À son éveil final, Sugus abandonne toute prudence pour protéger Hime. Il devient un rempart vivant et prépare une riposte féroce."
      }
    ],
    "forms": {
      "bebe": {
        "name": "🐯 Sugus — Tigreau du Serment",
        "image": "/Animaux/Sugus_Bebe.png",
        "description": "Encore petit, Sugus possède de grosses pattes, des oreilles expressives et une tendance comique à vouloir protéger Hime de choses qui ne sont absolument pas dangereuses. Il dort volontiers contre elle.",
        "title": "Le petit gardien qui refuse déjà de s’éloigner."
      },
      "juvenile": {
        "name": "🛡️🐯 Sugus — Gardien du Serment",
        "image": "/Animaux/Sugus_Juvenile.png",
        "description": "Sa carrure devient impressionnante. Il est plus calme et plus réfléchi, mais devient très difficile à déplacer lorsqu'il juge quelqu'un trop proche d'Hime. Un mot d'elle suffit pourtant à le rendre parfaitement docile.",
        "title": "Celui qui marche toujours entre elle et le danger."
      },
      "adulte": {
        "name": "👑🐯 Sugus — Tigre Royal du Serment Absolu",
        "image": "/Animaux/Sugus_Adulte.png",
        "description": "Un immense tigre magique à la présence royale. Sa fourrure semble traversée de lueurs chaudes lorsqu'il protège Hime. Il peut être terrifiant face à une menace et, une seconde plus tard, poser paisiblement sa tête contre elle.",
        "title": "Le monde entier peut attendre. Elle, jamais."
      }
    }
  },
  {
    "id": "taiga_arcane",
    "name": "🌑🦊 Taiga, Renarde de l’Arcanombre",
    "image": "/Animaux/Taiga_Bebe.png",
    "description": "Une petite renarde noire aux reflets violet nuit. Sa magie ressemble à une ombre douce qui s'enroule autour de Sugus lorsqu'elle veut le protéger… ou simplement réclamer de l'attention.",
    "bonus": "+8% de réussite aux chasses de guilde • +3% de chance de butin rare • événements uniques de Taiga",
    "rarity": "👑 Unique",
    "habitat": "🌒 Partout où se trouve Sugus",
    "temperament": "🖤 Affectueuse, malicieuse, un peu possessive et beaucoup trop fière quand Sugus la félicite",
    "family": "mythiques",
    "stats": {
      "pv": 185,
      "attaque": 20,
      "defense": 31,
      "vitesse": 39,
      "critique": 18,
      "esquive": 24
    },
    "abilities": [
      {
        "nom": "🌑 Pas entre les Ombres",
        "description": "Taiga disparaît dans une ombre pour réapparaître près de Sugus. Très utile pour esquiver… beaucoup moins lorsqu'elle s'en sert simplement pour lui voler une place confortable."
      },
      {
        "nom": "💜 Marque du Lien",
        "description": "Une petite rune violette apparaît lorsque Sugus est en danger. Taiga devient alors beaucoup plus attentive et agressive envers ce qui menace son humain."
      },
      {
        "nom": "🖤 Pacte du Crépuscule",
        "description": "À haut niveau, Taiga enveloppe brièvement Sugus d'Arcanombre et détourne une partie du danger."
      },
      {
        "nom": "🦊 Chaos absolument intentionnel",
        "description": "Capacité mystérieuse consistant à déplacer des objets, voler des cookies, dormir sur des documents importants et prétendre ensuite que tout faisait partie du plan."
      }
    ],
    "forms": {
      "bebe": {
        "name": "🦊 Taiga — Renardeau d’Arcanombre",
        "image": "/Animaux/Taiga_Bebe.png",
        "description": "Encore petite, Taiga possède déjà beaucoup trop de caractère. Elle se cache dans les vêtements, mordille les manches et vient se coucher contre Sugus dès qu'elle pense que personne ne regarde.",
        "title": "La petite ombre qui refuse de quitter Sugus."
      },
      "juvenile": {
        "name": "🌑🦊 Taiga — Gardienne du Crépuscule",
        "image": "/Animaux/Taiga_Juvenile.png",
        "description": "Sa silhouette s'allonge et sa magie devient visible autour de ses pattes. Taiga reste joueuse, mais commence à surveiller Sugus avec le sérieux d'une véritable gardienne.",
        "title": "L’ombre fidèle aux yeux violets."
      },
      "adulte": {
        "name": "👑🌑 Taiga — Reine Renarde de l’Arcanombre",
        "image": "/Animaux/Taiga_Adulte.png",
        "description": "Devenue adulte, Taiga ressemble à une magnifique renarde sombre entourée de volutes violet nuit. Sa présence est élégante et impressionnante… jusqu'au moment où elle décide de réclamer des gratouilles comme lorsqu'elle était bébé.",
        "title": "Celle qui traverse la nuit pour revenir auprès de lui."
      }
    }
  }
];

export const KENNELS = [
  {
    id: "petit",
    name: "🪵 Petit Chenil",
    description:
      "Un premier refuge propre et chaleureux pour accueillir un compagnon supplémentaire.",
    price: 3000,
    bonusPlaces: 1,
    image: "/Chenils/petit_chenil.png",
  },
  {
    id: "rustique",
    name: "🌾 Chenil Rustique",
    description:
      "Une bâtisse simple entourée de prés, idéale pour une petite famille de compagnons.",
    price: 7500,
    bonusPlaces: 2,
    image: "/Chenils/chenil_rustique.png",
  },
  {
    id: "forestier",
    name: "🌿 Chenil Forestier",
    description:
      "Un refuge paisible dissimulé sous les arbres anciens du Royaume.",
    price: 15000,
    bonusPlaces: 3,
    image: "/Chenils/chenil_forestier.png",
  },
  {
    id: "village",
    name: "🏡 Chenil du Village",
    description:
      "Un vaste chenil au cœur du village, avec plusieurs espaces de repos.",
    price: 30000,
    bonusPlaces: 4,
    image: "/Chenils/chenil_village.png",
  },
  {
    id: "grand_refuge",
    name: "🌸 Grand Refuge",
    description:
      "Un domaine fleuri où les compagnons disposent de jardins et d'abris privés.",
    price: 60000,
    bonusPlaces: 5,
    image: "/Chenils/grand_refuge.png",
  },
  {
    id: "domaine",
    name: "🐉 Domaine des Compagnons",
    description:
      "Un domaine imposant conçu pour accueillir même les créatures les plus majestueuses.",
    price: 100000,
    bonusPlaces: 6,
    image: "/Chenils/domaine_compagnons.png",
  },
  {
    id: "prestigieux",
    name: "💠 Chenil Prestigieux",
    description:
      "Le plus remarquable des chenils accessibles aux aventuriers du Royaume.",
    price: 175000,
    bonusPlaces: 8,
    image: "/Chenils/chenil_prestigieux.png",
  },
  {
    id: "royal_tsundere",
    name: "👑 Chenil Royal de Tsundere",
    description:
      "Un sanctuaire royal réservé à Hime-sama et à Sugus. Ses jardins semblent s'étendre à l'infini sous la protection de la Couronne.",
    price: 0,
    bonusPlaces: null,
    image: "/Chenils/chenil_royal_tsundere.png",
    royal: true,
  },
] as const;

export const PROVISION_LEVELS = [
  {
    level: 1,
    name: "🪵 Étal des Provisions",
    price: 0,
    image: "/Chenils/provisions_niv1.png",
    description:
      "Un petit étal rustique avec les provisions essentielles.",
  },
  {
    level: 2,
    name: "🏪 Boutique des Familiers",
    price: 1000,
    image: "/Chenils/provisions_niv2.png",
    description:
      "Une vraie petite boutique avec aliments frais et friandises.",
  },
  {
    level: 3,
    name: "✨ Comptoir des Créatures Magiques",
    price: 1500,
    image: "/Chenils/provisions_niv3.png",
    description:
      "Des réserves chargées en mana apparaissent sur les étagères.",
  },
  {
    level: 4,
    name: "🐉 Maison des Dragons",
    price: 2500,
    image: "/Chenils/provisions_niv4.png",
    description:
      "L'intendance peut désormais nourrir correctement les lignées draconiques.",
  },
  {
    level: 5,
    name: "👑 Intendance Royale des Compagnons",
    price: 4000,
    image: "/Chenils/provisions_niv5.png",
    description:
      "Le plus prestigieux comptoir animalier de TailBlue.",
  },
] as const;

export const PET_FOODS = [
  { id: "ration_simple", name: "🌾 Ration simple", price: 45, level: 1, heal: 8, energy: 12 },
  { id: "viande_sechee", name: "🥩 Viande séchée", price: 70, level: 1, heal: 12, energy: 13 },
  { id: "petit_poisson", name: "🐟 Petit poisson", price: 65, level: 1, heal: 10, energy: 14 },
  { id: "legumes_croquants", name: "🥕 Légumes croquants", price: 50, level: 1, heal: 7, energy: 13 },

  { id: "volaille_rotie", name: "🍗 Volaille rôtie", price: 130, level: 2, heal: 20, energy: 18 },
  { id: "poisson_frais", name: "🐟 Poisson frais", price: 125, level: 2, heal: 18, energy: 21 },
  { id: "fruits_royaux", name: "🍎 Fruits royaux", price: 115, level: 2, heal: 14, energy: 20 },
  { id: "friandise_compagnon", name: "🍪 Friandise", price: 150, level: 2, heal: 5, energy: 17 },

  { id: "biscuit_mana", name: "✨ Biscuit au mana", price: 260, level: 3, heal: 18, energy: 30 },
  { id: "baies_lunaires", name: "🌙 Baies lunaires", price: 280, level: 3, heal: 23, energy: 27 },
  { id: "viande_braisee", name: "🔥 Viande braisée", price: 300, level: 3, heal: 30, energy: 23 },
  { id: "poisson_glaces", name: "❄️ Poisson des glaces", price: 300, level: 3, heal: 28, energy: 25 },

  { id: "ration_draconique", name: "🐉 Ration draconique", price: 480, level: 4, heal: 38, energy: 38 },
  { id: "coeur_braise", name: "🔥 Cœur de braise", price: 520, level: 4, heal: 34, energy: 45 },
  { id: "fruit_orage", name: "⚡ Fruit d'orage", price: 540, level: 4, heal: 30, energy: 48 },
  { id: "racines_anciennes", name: "🌿 Racines anciennes", price: 500, level: 4, heal: 40, energy: 36 },

  { id: "festin_royal", name: "👑 Festin royal", price: 900, level: 5, heal: 60, energy: 55 },
  { id: "essence_arcanombre", name: "🌌 Essence d'Arcanombre", price: 1000, level: 5, heal: 45, energy: 65 },
  { id: "banquet_draconique", name: "🐉 Banquet draconique", price: 1100, level: 5, heal: 70, energy: 65 },
] as const;

export const DRAGONS = [
  {
    id: "kagutsuchi",
    name: "🔥 Kagutsuchi",
    rarity: "⚪ Commun",
    element: "feu",
    chance: 32,
    habitat: "🌋 Volcan d'Akayama",
    temperament: "🔥 Fougueux et protecteur",
    description:
      "Un dragon dont les flammes semblent posséder une volonté propre. Sa simple présence réchauffe l'air et fait danser les braises.",
    image: "/Dragons/Kagutsuchi_Bebe.jpg",
  },
  {
    id: "hyorin",
    name: "❄️ Hyōrin",
    rarity: "🟢 Peu commun",
    element: "glace",
    chance: 24,
    habitat: "🏔️ Pics du Givre Éternel",
    temperament: "❄️ Calme et réfléchi",
    description:
      "Dragon millénaire des glaces éternelles, Hyōrin règne dans un silence absolu. Son souffle apaise les tempêtes autant qu'il peut figer le monde.",
    image: "/Dragons/Hyorin_Bebe.jpg",
  },
  {
    id: "raijin",
    name: "⚡ Raijin",
    rarity: "🟢 Peu commun",
    element: "foudre",
    chance: 18,
    habitat: "⛈️ Falaises des Tempêtes",
    temperament: "⚡ Impulsif et infatigable",
    description:
      "Dragon souverain des tempêtes, Raijin règne sur les éclairs qui sillonnent le ciel. Son rugissement résonne comme le tonnerre et annonce toujours un grand changement.",
    image: "/Dragons/Raijin_Bebe.jpg",
  },
  {
    id: "kodama",
    name: "🌿 Kodama",
    rarity: "🔵 Rare",
    element: "nature",
    chance: 12,
    habitat: "🌳 Forêt Millénaire",
    temperament: "🌿 Curieux et collectionneur",
    description:
      "Dragon ancien des forêts sacrées, Kodama incarne l'équilibre entre la vie, la nature et les esprits.",
    image: "/Dragons/Kodama_Bebe.jpg",
  },
  {
    id: "suijin",
    name: "🌊 Suijin",
    rarity: "🔵 Rare",
    element: "eau",
    chance: 7,
    habitat: "🌊 Palais des Marées",
    temperament: "🌊 Protecteur et bienveillant",
    description:
      "Dragon souverain des océans, Suijin protège les mers depuis les profondeurs les plus inaccessibles.",
    image: "/Dragons/Suijin_Bebe.jpg",
  },
  {
    id: "dokuryu",
    name: "☠️ Dokuryū",
    rarity: "🟣 Épique",
    element: "poison",
    chance: 4,
    habitat: "☣️ Marais du Crépuscule",
    temperament: "☠️ Rusé et imprévisible",
    description:
      "Dragon des marais empoisonnés, Dokuryū règne sur les terres où toute vie semble condamnée.",
    image: "/Dragons/Dokuryu_Bebe.png",
  },
  {
    id: "yamikage",
    name: "🌑 Yamikage",
    rarity: "🟠 Légendaire",
    element: "ombre",
    chance: 2,
    habitat: "🌑 Vallée des Ombres",
    temperament: "🌑 Solitaire et silencieux",
    description:
      "Dragon des ombres éternelles, Yamikage apparaît uniquement lorsque la lumière disparaît totalement.",
    image: "/Dragons/Yamikage_Bebe.png",
  },
  {
    id: "hikariryu",
    name: "✨ Hikariryū",
    rarity: "🟠 Légendaire",
    element: "lumiere",
    chance: 1,
    habitat: "☀️ Sanctuaire de l'Aube",
    temperament: "✨ Bienveillant et majestueux",
    description:
      "Dragon céleste d'une rareté inégalée, Hikariryū incarne l'espoir, la sagesse et l'équilibre du monde.",
    image: "/Dragons/Hikariryu_Bebe.png",
  },
] as const;

export const DRAGON_PRICES = {
  Commun: 2500,
  "Peu commun": 5000,
  Rare: 8000,
  "Épique": 10000,
  "Légendaire": 20000,
} as const;

export const COMPANION_RULES = {
  nicknameUnlockLevel: 10,
  pettingCooldownMinutes: 30,
  trustTiers: [
    { min: 100, label: "💞 Lien absolu", multiplier: 1.10 },
    { min: 66, label: "💜 Très lié", multiplier: 1.06 },
    { min: 33, label: "😊 Attaché", multiplier: 1.03 },
    { min: 0, label: "🤝 Réservé", multiplier: 1.00 },
  ],
  incubation: {
    work: 15,
    hunt: 20,
    daily: 1,
  },
} as const;
