import type {
  ActivityKind,
  ActivitySnapshotDto,
  ActivityEventDto,
} from "../types/activity";

export interface TailBlueJobDefinition {
  id: string;
  name: string;
  emoji: string;
  requiredLevel: number;
  cookiesMin: number;
  cookiesMax: number;
  xpMin: number;
  xpMax: number;
  himeOnly?: boolean;
}

export const TAILBLUE_JOBS: Record<string, TailBlueJobDefinition> = {
  bucheron: {
    id: "bucheron",
    name: "Bûcheron",
    emoji: "🪓",
    requiredLevel: 1,
    cookiesMin: 20,
    cookiesMax: 60,
    xpMin: 10,
    xpMax: 25,
  },
  mineur: {
    id: "mineur",
    name: "Mineur",
    emoji: "⛏️",
    requiredLevel: 1,
    cookiesMin: 15,
    cookiesMax: 80,
    xpMin: 10,
    xpMax: 30,
  },
  fermier: {
    id: "fermier",
    name: "Fermier",
    emoji: "🌾",
    requiredLevel: 1,
    cookiesMin: 25,
    cookiesMax: 50,
    xpMin: 10,
    xpMax: 20,
  },
  chasseur: {
    id: "chasseur",
    name: "Chasseur",
    emoji: "🏹",
    requiredLevel: 1,
    cookiesMin: 20,
    cookiesMax: 70,
    xpMin: 15,
    xpMax: 30,
  },
  erudit: {
    id: "erudit",
    name: "Érudit",
    emoji: "📚",
    requiredLevel: 1,
    cookiesMin: 10,
    cookiesMax: 40,
    xpMin: 25,
    xpMax: 50,
  },
  boulanger: {
    id: "boulanger",
    name: "Boulanger Royal",
    emoji: "🍞",
    requiredLevel: 6,
    cookiesMin: 40,
    cookiesMax: 80,
    xpMin: 20,
    xpMax: 35,
  },
  charpentier: {
    id: "charpentier",
    name: "Maître Charpentier",
    emoji: "🏗️",
    requiredLevel: 6,
    cookiesMin: 40,
    cookiesMax: 80,
    xpMin: 20,
    xpMax: 35,
  },
  barde: {
    id: "barde",
    name: "Barde Itinérant",
    emoji: "🎻",
    requiredLevel: 8,
    cookiesMin: 55,
    cookiesMax: 95,
    xpMin: 25,
    xpMax: 40,
  },
  aubergiste: {
    id: "aubergiste",
    name: "Aubergiste",
    emoji: "🛏️",
    requiredLevel: 8,
    cookiesMin: 55,
    cookiesMax: 95,
    xpMin: 25,
    xpMax: 40,
  },
  sommelier: {
    id: "sommelier",
    name: "Sommelier Royal",
    emoji: "🍷",
    requiredLevel: 10,
    cookiesMin: 70,
    cookiesMax: 120,
    xpMin: 35,
    xpMax: 55,
  },
  bouffon: {
    id: "bouffon",
    name: "Bouffon Royal",
    emoji: "🎭",
    requiredLevel: 10,
    cookiesMin: 70,
    cookiesMax: 120,
    xpMin: 35,
    xpMax: 55,
  },
  chef: {
    id: "chef",
    name: "Chef Royal",
    emoji: "👨‍🍳",
    requiredLevel: 12,
    cookiesMin: 85,
    cookiesMax: 140,
    xpMin: 40,
    xpMax: 65,
  },
  executeur: {
    id: "executeur",
    name: "Exécuteur Royal",
    emoji: "⚖️",
    requiredLevel: 12,
    cookiesMin: 85,
    cookiesMax: 140,
    xpMin: 40,
    xpMax: 65,
  },
  chevalier: {
    id: "chevalier",
    name: "Chevalier Personnel de Hime-sama",
    emoji: "🛡️",
    requiredLevel: 15,
    cookiesMin: 60,
    cookiesMax: 120,
    xpMin: 40,
    xpMax: 80,
  },
  mercenaire: {
    id: "mercenaire",
    name: "Mercenaire Royal",
    emoji: "⚔️",
    requiredLevel: 15,
    cookiesMin: 120,
    cookiesMax: 180,
    xpMin: 55,
    xpMax: 85,
  },
  noble: {
    id: "noble",
    name: "Noble du Royaume",
    emoji: "🏰",
    requiredLevel: 20,
    cookiesMin: 80,
    cookiesMax: 150,
    xpMin: 35,
    xpMax: 70,
  },
  conseiller: {
    id: "conseiller",
    name: "Conseiller Royal",
    emoji: "👑",
    requiredLevel: 30,
    cookiesMin: 160,
    cookiesMax: 250,
    xpMin: 80,
    xpMax: 130,
  },
  princesse: {
    id: "princesse",
    name: "Princesse du Royaume de TailBlue",
    emoji: "👑",
    requiredLevel: 9999,
    cookiesMin: 150,
    cookiesMax: 300,
    xpMin: 75,
    xpMax: 150,
    himeOnly: true,
  },
};

export const ACTIVITY_META: Record<
  ActivityKind,
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    icon: string;
    totalEvents: number;
    baseCooldownMinutes: number;
    guildCost: number;
    baseReputation: number;
    eggTarget: number;
  }
> = {
  work: {
    eyebrow: "ACTIVITÉ DU ROYAUME",
    title: "Work",
    subtitle:
      "Exerce ton métier, fais des choix et laisse le moteur TailBlue calculer les récompenses, bonus et événements.",
    icon: "💼",
    totalEvents: 60,
    baseCooldownMinutes: 30,
    guildCost: 65,
    baseReputation: 1,
    eggTarget: 15,
  },
  hunt: {
    eyebrow: "EXPÉDITION SAUVAGE",
    title: "Hunt",
    subtitle:
      "Pars à l’aventure avec tes compagnons. Les choix changent l’issue et aucun choix n’est toujours le bon.",
    icon: "🏹",
    totalEvents: 60,
    baseCooldownMinutes: 30,
    guildCost: 65,
    baseReputation: 2,
    eggTarget: 20,
  },
};

/**
 * Aperçu uniquement visuel, utilisé tant que l’API n’est pas connectée.
 * Les textes de choix ne représentent PAS des événements Python réels.
 */
export function makePreviewEvent(activity: ActivityKind): ActivityEventDto {
  if (activity === "work") {
    return {
      id: "preview-work-event",
      title: "Aperçu de l’événement interactif",
      description:
        "Quand TailBlue sera reliée au backend, cet espace recevra l’événement réellement tiré par work_events.py, avec son texte et ses choix.",
      choices: [
        { id: "preview-a", emoji: "🧭", label: "Choix A", description: "Emplacement du premier choix réel." },
        { id: "preview-b", emoji: "✨", label: "Choix B", description: "Emplacement du deuxième choix réel." },
        { id: "preview-c", emoji: "🛡️", label: "Choix C", description: "Emplacement du troisième choix réel." },
      ],
    };
  }

  return {
    id: "preview-hunt-event",
    title: "Aperçu de l’événement de chasse",
    description:
      "Quand TailBlue sera reliée au backend, cet espace recevra l’événement réellement tiré par hunt_events.py, avec son texte et ses choix.",
    choices: [
      { id: "preview-a", emoji: "🌲", label: "Choix A", description: "Emplacement du premier choix réel." },
      { id: "preview-b", emoji: "👣", label: "Choix B", description: "Emplacement du deuxième choix réel." },
      { id: "preview-c", emoji: "🏹", label: "Choix C", description: "Emplacement du troisième choix réel." },
    ],
  };
}

export function makePreviewSnapshot(activity: ActivityKind): ActivitySnapshotDto {
  const meta = ACTIVITY_META[activity];
  const himeJob = TAILBLUE_JOBS.princesse;

  return {
    activity,
    ready: true,
    cooldownMinutes: meta.baseCooldownMinutes,
    cooldownRemainingSeconds: 0,
    totalEvents: meta.totalEvents,
    job: {
      id: himeJob.id,
      name: himeJob.name,
      emoji: himeJob.emoji,
      requiredLevel: himeJob.requiredLevel,
      cookiesMin: himeJob.cookiesMin,
      cookiesMax: himeJob.cookiesMax,
      xpMin: himeJob.xpMin,
      xpMax: himeJob.xpMax,
    },
    guild: {
      payer: "unknown",
      cost: meta.guildCost,
    },
    activePets: [],
    bonuses: [],
    stats: {},
    eggProgress: {
      current: 0,
      target: meta.eggTarget,
    },
    currentEvent: null,
    lastResult: null,
  };
}
