export type TailBlueJob = {
  id: string;
  name: string;
  level: number;
  description: string;
};

export const JOBS: TailBlueJob[] = [
  { id: "bucheron", name: "🪓 Bûcheron", level: 1, description: "Parcourt les forêts du Royaume et fournit le bois nécessaire aux villages." },
  { id: "mineur", name: "⛏️ Mineur", level: 1, description: "Explore les mines anciennes et extrait les ressources du Royaume." },
  { id: "fermier", name: "🌾 Fermier", level: 1, description: "Cultive les terres et nourrit les habitants de TailBlue." },
  { id: "chasseur", name: "🏹 Chasseur", level: 1, description: "Parcourt les forêts sauvages et rapporte des ressources de chasse." },
  { id: "erudit", name: "📚 Érudit", level: 1, description: "Étudie les archives et les connaissances oubliées." },
  { id: "boulanger", name: "🍞 Boulanger Royal", level: 6, description: "Prépare pains et spécialités pour le Royaume." },
  { id: "charpentier", name: "🏗️ Maître Charpentier", level: 6, description: "Construit et répare les bâtiments du Royaume." },
  { id: "barde", name: "🎻 Barde Itinérant", level: 8, description: "Anime tavernes, places et banquets royaux." },
  { id: "aubergiste", name: "🛏️ Aubergiste", level: 8, description: "Accueille les voyageurs et aventuriers de passage." },
  { id: "sommelier", name: "🍷 Sommelier Royal", level: 10, description: "Sélectionne les meilleurs crus pour la Cour." },
  { id: "bouffon", name: "🎭 Bouffon Royal", level: 10, description: "Divertit la Cour et les habitants du Royaume." },
  { id: "chef", name: "👨‍🍳 Chef Royal", level: 12, description: "Prépare les repas dignes du Château." },
  { id: "executeur", name: "⚖️ Exécuteur Royal", level: 12, description: "Applique les décisions les plus sévères du Royaume." },
  { id: "chevalier", name: "🛡️ Chevalier Personnel de Hime-sama", level: 15, description: "Protège directement Hime-sama et le Château." },
  { id: "mercenaire", name: "⚔️ Mercenaire Royal", level: 15, description: "Accomplit les missions dangereuses confiées par le Royaume." },
  { id: "noble", name: "🏰 Noble du Royaume", level: 20, description: "Administre ses terres et participe à la vie politique du Royaume." },
  { id: "conseiller", name: "👑 Conseiller Royal", level: 30, description: "Conseille la Couronne sur les grandes décisions." },
  { id: "princesse", name: "👑 Princesse du Royaume de TailBlue", level: 9999, description: "Métier royal exclusif de Hime-sama." },
];

export type ActivityChoice = {
  id: string;
  label: string;
  description: string;
  risk: "faible" | "moyen" | "élevé";
};

export type ActivityEvent = {
  id: string;
  title: string;
  description: string;
  choices: ActivityChoice[];
};

// Événements VISUELS de démonstration uniquement.
// Les vrais événements et leurs issues viendront de work_events.py / hunt_events.py.
export const WORK_EVENT_DEMO: ActivityEvent = {
  id: "work_demo",
  title: "Une journée mouvementée",
  description:
    "Ton travail commence normalement, mais une situation inattendue oblige à prendre une décision.",
  choices: [
    { id: "careful", label: "Prendre son temps", description: "Solution prudente et régulière.", risk: "faible" },
    { id: "bold", label: "Prendre l'initiative", description: "Plus ambitieux, mais plus incertain.", risk: "moyen" },
    { id: "heroic", label: "Tout miser", description: "Une décision risquée pouvant changer le résultat.", risk: "élevé" },
  ],
};

export const HUNT_EVENT_DEMO: ActivityEvent = {
  id: "hunt_demo",
  title: "Une piste inhabituelle",
  description:
    "Au milieu des bois, ton compagnon s'arrête. Plusieurs traces se croisent et aucune ne semble totalement sûre.",
  choices: [
    { id: "tracks", label: "Suivre les traces", description: "Pister méthodiquement la créature.", risk: "faible" },
    { id: "shortcut", label: "Couper par les bois", description: "Gagner du temps au risque de rencontrer autre chose.", risk: "moyen" },
    { id: "challenge", label: "Chercher le danger", description: "Prendre volontairement la piste la plus menaçante.", risk: "élevé" },
  ],
};

export const HUNT_MATERIALS = [
  { id: "wolf_hide", emoji: "🟤", name: "Peau de Loup" },
  { id: "wolf_fang", emoji: "🦷", name: "Croc de Loup" },
  { id: "boar_bone", emoji: "🦴", name: "Os de Sanglier" },
  { id: "serpent_eye", emoji: "👁️", name: "Œil de Serpent" },
  { id: "griffin_claw", emoji: "🐾", name: "Griffe de Griffon" },
  { id: "hydra_essence", emoji: "✨", name: "Essence d'Hydre" },
];
