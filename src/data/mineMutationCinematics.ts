export type MutationVisualFamily =
  | "wind"
  | "silence"
  | "scream"
  | "quake"
  | "water"
  | "resonance"
  | "frost"
  | "glow"
  | "presence"
  | "heart";

export type MutationCinematicDefinition = {
  id: number;
  family: MutationVisualFamily;
  icon: string;
  title: string;
  lines: string[];
};

export const MUTATION_CINEMATICS: readonly MutationCinematicDefinition[] = [
  { id: 1, family: "wind", icon: "🌬️", title: "Le souffle des profondeurs", lines: ["Un courant d'air traverse brutalement la galerie.", "La poussière s'arrache au sol et fuit vers {direction}.", "La Mine semble vous appeler dans cette direction."] },
  { id: 2, family: "silence", icon: "◌", title: "Le silence impossible", lines: ["Les sons de la Mine s'éteignent un à un.", "Même vos pas semblent disparaître.", "Puis une présence muette pèse vers {direction}."] },
  { id: 3, family: "scream", icon: "👂", title: "L'appel lointain", lines: ["Un cri déformé traverse plusieurs couches de roche.", "Un second écho lui répond au loin.", "Il semble venir de {direction}."] },
  { id: 4, family: "quake", icon: "🪨", title: "La montagne bouge", lines: ["Le sol vibre sous vos pieds.", "Des fragments de pierre se détachent des parois.", "Le grondement se propage vers {direction}."] },
  { id: 5, family: "water", icon: "💧", title: "Le ruissellement impossible", lines: ["Une goutte froide tombe sur la pierre sèche.", "Un ruissellement naît derrière la roche.", "L'eau semble courir vers {direction}."] },
  { id: 6, family: "resonance", icon: "🔔", title: "La résonance ancienne", lines: ["Une note métallique résonne dans l'étage.", "Elle revient, plus grave, comme une cloche ensevelie.", "La vibration vient de {direction}."] },
  { id: 7, family: "frost", icon: "🌫️", title: "Le souffle froid", lines: ["La température chute d'un seul coup.", "Une brume blanche glisse contre les murs.", "Elle se dirige obstinément vers {direction}."] },
  { id: 8, family: "glow", icon: "✨", title: "La lueur sous la roche", lines: ["Une lumière pulse sous une fissure minuscule.", "Elle s'éteint, puis répond plus loin.", "Les éclats convergent vers {direction}."] },
  { id: 9, family: "presence", icon: "🩸", title: "Quelque chose répond", lines: ["Un frottement sec résonne derrière la paroi.", "Puis une respiration lente, beaucoup trop proche.", "La présence se tient quelque part vers {direction}."] },
  { id: 10, family: "heart", icon: "🌑", title: "Le cœur de la Mine", lines: ["Une pulsation traverse tout l'étage.", "La roche répond comme si elle respirait.", "Le battement vous attire vers {direction}."] },
  { id: 11, family: "wind", icon: "🍃", title: "Poussière à contre-courant", lines: ["La poussière se soulève sans raison.", "Elle file à contre-sens de votre marche.", "Toutes les particules convergent vers {direction}."] },
  { id: 12, family: "silence", icon: "🕯️", title: "La flamme immobile", lines: ["Votre lumière cesse soudain de vaciller.", "L'air entier paraît figé.", "Une pression silencieuse demeure vers {direction}."] },
  { id: 13, family: "scream", icon: "🐾", title: "L'écho qui n'est pas le vôtre", lines: ["Des pas résonnent après les vôtres.", "Ils s'arrêtent quand vous vous arrêtez.", "Le dernier écho vient de {direction}."] },
  { id: 14, family: "quake", icon: "🧱", title: "Une pierre se déplace", lines: ["Un bloc glisse de quelques centimètres.", "La paroi gémit sous une pression invisible.", "Le mouvement se poursuit vers {direction}."] },
  { id: 15, family: "water", icon: "🌊", title: "L'humidité soudaine", lines: ["La roche devient humide sous vos doigts.", "Une odeur de pluie envahit la galerie.", "L'air humide vient de {direction}."] },
  { id: 16, family: "resonance", icon: "⛓️", title: "Le bruit de chaîne", lines: ["Quelque chose de métallique racle la pierre.", "Une chaîne, peut-être, frappe une paroi lointaine.", "Le son provient de {direction}."] },
  { id: 17, family: "frost", icon: "❄️", title: "Le givre spontané", lines: ["Une fine couche de givre gagne la roche.", "Elle avance devant vous comme une piste.", "La trace pointe vers {direction}."] },
  { id: 18, family: "glow", icon: "💠", title: "Un éclat dans l'obscurité", lines: ["Une étincelle bleue traverse votre champ de vision.", "Une seconde apparaît plus loin.", "La dernière disparaît vers {direction}."] },
  { id: 19, family: "presence", icon: "👁️", title: "Le sentiment d'être observé", lines: ["Votre nuque se crispe sans raison.", "Quelque chose semble suivre chacun de vos mouvements.", "Cette sensation est plus forte vers {direction}."] },
  { id: 20, family: "heart", icon: "🫀", title: "La roche pulse", lines: ["Un choc sourd traverse la paroi.", "Puis un second, exactement au même rythme.", "Les pulsations viennent de {direction}."] },
  { id: 21, family: "wind", icon: "🌪️", title: "Le tunnel respire", lines: ["Une rafale chaude vous frappe le visage.", "Elle revient froide quelques secondes plus tard.", "Le souffle alterne depuis {direction}."] },
  { id: 22, family: "silence", icon: "⬛", title: "Une seconde disparaît", lines: ["Pendant un instant, tout devient noir et silencieux.", "Le monde revient sans explication.", "Votre instinct insiste pourtant sur {direction}."] },
  { id: 23, family: "scream", icon: "📣", title: "Un murmure prononce quelque chose", lines: ["Un murmure trop lointain pour être compris traverse la pierre.", "Il recommence, plus distinct, puis s'éteint.", "La voix venait de {direction}."] },
  { id: 24, family: "quake", icon: "⚡", title: "La fissure répond", lines: ["Une fissure sèche claque quelque part dans l'étage.", "Une série de petits impacts lui répond.", "La dernière secousse vient de {direction}."] },
  { id: 25, family: "water", icon: "🫧", title: "Des bulles sous la pierre", lines: ["Un bruit de bulles résonne derrière un mur parfaitement sec.", "Le son se déplace lentement.", "Il finit par s'immobiliser vers {direction}."] },
  { id: 26, family: "resonance", icon: "🎵", title: "La note suspendue", lines: ["Une note pure apparaît au milieu du silence.", "Elle dure beaucoup trop longtemps.", "Sa résonance se concentre vers {direction}."] },
  { id: 27, family: "frost", icon: "🧊", title: "Votre souffle blanchit", lines: ["Votre respiration devient soudain visible.", "Le froid n'est pourtant pas uniforme.", "Il mord davantage lorsque vous regardez vers {direction}."] },
  { id: 28, family: "glow", icon: "🌟", title: "Les cristaux répondent", lines: ["De minuscules éclats scintillent dans la roche.", "Ils s'allument les uns après les autres.", "La chaîne lumineuse part vers {direction}."] },
  { id: 29, family: "presence", icon: "🕷️", title: "Le grattement derrière le mur", lines: ["Trois coups secs viennent de derrière la pierre.", "Quelque chose gratte, puis s'immobilise.", "Le silence retombe du côté de {direction}."] },
  { id: 30, family: "heart", icon: "🕳️", title: "L'étage se contracte", lines: ["Une pression invisible traverse la galerie.", "Les murs semblent se rapprocher une fraction de seconde.", "Puis la Mine relâche son souffle vers {direction}."] },
] as const;

export function mutationCinematic(id: number) {
  return MUTATION_CINEMATICS.find((item) => item.id === id) ?? MUTATION_CINEMATICS[0];
}

export function mutationThemeWhisper(theme?: string | null) {
  switch (theme) {
    case "nest": return "Quelque chose remue derrière la roche.";
    case "mineral": return "Un tintement cristallin se mêle à l'appel.";
    case "treasury": return "Une odeur de métal ancien flotte dans l'air.";
    case "spring": return "L'air paraît plus humide qu'il ne devrait l'être.";
    case "ruins": return "Un écho ancien répond depuis des galeries oubliées.";
    case "corrupted": return "La présence derrière la paroi semble profondément hostile.";
    default: return "La Mine ne ressemble plus tout à fait à celle que vous avez quittée.";
  }
}
