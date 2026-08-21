export type TailBlueUpdateArticle = {
  id: string;
  title: string;
  body: string;
  excerpt: string;
  publishedAt: string;
  images: string[];
  tag: string;
  author?: string;
  source?: "api" | "local";
};

export const LOCAL_UPDATE_ARTICLES: TailBlueUpdateArticle[] = [
  {
    id: "desktop-world",
    title: "TailBlue prend vie sur Desktop",
    excerpt: "Le Royaume quitte peu à peu les limites de Discord et gagne sa propre interface.",
    body: `TailBlue prend vie sur Desktop.\n\nLe but de cette nouvelle interface est de garder le même univers que le bot, tout en donnant beaucoup plus de place aux images, aux inventaires, aux compagnons, aux quêtes et aux futurs combats.\n\nLes données affichées ici sont encore des données de démonstration lorsque le backend n'est pas connecté. À terme, Discord et l'application utiliseront exactement le même profil joueur.`,
    publishedAt: "2026-08-14T15:00:00+02:00",
    images: ["/fond-appli.png"],
    tag: "Application",
    author: "Hime-sama",
    source: "local",
  },
  {
    id: "kennel-v2",
    title: "Le Chenil s'agrandit",
    excerpt: "Compagnons, provisions et chenils possèdent désormais leur propre espace dans l'application.",
    body: `Le Chenil devient un véritable lieu de gestion.\n\nLa page permet de consulter le refuge actuel, les compagnons actifs et l'intendance des provisions. Les actions seront ensuite reliées aux vraies données de pets.py : PV, énergie, confiance, nourriture et cooldowns.\n\nL'objectif est de garder toute la richesse du bot, sans transformer l'application en simple copie de Discord.`,
    publishedAt: "2026-08-14T14:30:00+02:00",
    images: ["/Chenils/chenil_royal_tsundere.png"],
    tag: "Compagnons",
    author: "Hime-sama",
    source: "local",
  },
  {
    id: "egg-origin",
    title: "L'Œuf des Origines arrive dans la Nurserie",
    excerpt: "L'incubation Work, Hunt et Daily gagne une interface draconique dédiée.",
    body: `La Nurserie draconique reprend le véritable système de l'Œuf des Origines.\n\nLa progression dépend du Work, du Hunt et du Daily. Quand le backend sera connecté, les jauges de l'application liront directement la progression du joueur et l'éclosion pourra déclencher le même résultat que sur Discord.\n\nAucune reproduction fictive n'est ajoutée avant que son gameplay existe réellement dans TailBlue.`,
    publishedAt: "2026-08-14T14:00:00+02:00",
    images: ["/Dragons/Oeuf_Origines.png"],
    tag: "Dragons",
    author: "Hime-sama",
    source: "local",
  },
  {
    id: "mine-interface",
    title: "La Mine devient une expédition",
    excerpt: "Carte, journal, actions et inventaire d'expédition préparent le futur combat complet.",
    body: `La Mine est désormais pensée comme une vraie expédition et non comme une simple liste de commandes.\n\nLa carte, le journal et les actions sont destinés à être reliés au moteur Python existant. Plus tard, Potion ouvrira le véritable stock de consommables et Combat affichera les attaques, compétences, objets et compagnon disponibles.`,
    publishedAt: "2026-08-14T13:30:00+02:00",
    images: ["/ImagesMarket/marketruins.png"],
    tag: "Aventure",
    author: "Hime-sama",
    source: "local",
  },
];

function normalizeArticle(raw: unknown, apiBase = ""): TailBlueUpdateArticle | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const title = String(value.title ?? "").trim();
  const body = String(value.body ?? value.text ?? "").trim();
  if (!title || !body) return null;

  const imagesRaw = Array.isArray(value.images)
    ? value.images
    : Array.isArray(value.image_urls)
      ? value.image_urls
      : value.cover_image
        ? [value.cover_image]
        : [];

  const images = imagesRaw
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)
    .map((item) => {
      if (!apiBase || !item.startsWith("/")) return item;
      return `${apiBase}${item}`;
    });

  const excerpt = String(value.excerpt ?? "").trim() || body.replace(/\s+/g, " ").slice(0, 180);

  return {
    id: String(value.id ?? `${Date.now()}-${Math.random()}`),
    title,
    body,
    excerpt,
    publishedAt: String(value.published_at ?? value.publishedAt ?? new Date().toISOString()),
    images,
    tag: String(value.tag ?? "Mise à jour"),
    author: String(value.author ?? "Hime-sama"),
    source: "api",
  };
}

export async function loadTailBlueUpdates(): Promise<TailBlueUpdateArticle[]> {
  const configured = String(import.meta.env.VITE_TAILBLUE_API_URL ?? "").trim();
  if (!configured) return LOCAL_UPDATE_ARTICLES;

  const base = configured.replace(/\/$/, "");

  try {
    const response = await fetch(`${base}/updates`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const rawItems = Array.isArray(payload) ? payload : Array.isArray(payload?.updates) ? payload.updates : [];
    const items = rawItems.map((item) => normalizeArticle(item, base)).filter((item): item is TailBlueUpdateArticle => Boolean(item));

    return items.length ? items : LOCAL_UPDATE_ARTICLES;
  } catch (error) {
    console.warn("TailBlue Updates API indisponible, utilisation du flux local.", error);
    return LOCAL_UPDATE_ARTICLES;
  }
}
