import { useMemo, useState } from "react";
import FilterSelect from "../components/FilterSelect";
import "./realPages.css";

type House = {
  id: string;
  name: string;
  price: number | null;
  level: number;
  image: string;
  description: string;
};

const HOUSES: House[] = [
  {
    id: "sans_abri",
    name: "🌧️ Sans-abri",
    price: 0,
    level: 1,
    image: "/ImagesMaison/Image_Sans_Abris.png",
    description:
      "Chaque aventurier commence quelque part. Le Royaume offre un simple abri de fortune.",
  },
  {
    id: "ferme",
    name: "🏚️ Petite ferme délabrée",
    price: 1000,
    level: 2,
    image: "/ImagesMaison/Image_Ferme.png",
    description:
      "Une vieille ferme qui reprend vie. Ton premier véritable foyer dans TailBlue.",
  },
  {
    id: "cabane",
    name: "🪵 Cabane confortable",
    price: 3000,
    level: 5,
    image: "/ImagesMaison/Cabane_Confort.png",
    description:
      "Une cabane chaleureuse et confortable, parfaite pour souffler entre deux aventures.",
  },
  {
    id: "village",
    name: "🏡 Maison de Citée",
    price: 7500,
    level: 10,
    image: "/ImagesMaison/Maison_Citee.png",
    description:
      "Les habitants commencent à reconnaître ton nom. Une véritable maison au cœur de la cité.",
  },
  {
    id: "manoir",
    name: "🏛️ Manoir champêtre",
    price: 15000,
    level: 15,
    image: "/ImagesMaison/Manoir.png",
    description:
      "Une demeure prestigieuse réservée aux aventuriers qui ont déjà fait leurs preuves.",
  },
  {
    id: "villa",
    name: "🌸 Villa du royaume",
    price: 22000,
    level: 20,
    image: "/ImagesMaison/villa.png",
    description:
      "Une résidence luxueuse et raffinée, digne des héros les plus reconnus du Royaume.",
  },
  {
    id: "plateau",
    name: "⛰️ Haut plateau royal",
    price: 30000,
    level: 25,
    image: "/ImagesMaison/HautPlateau.png",
    description:
      "Une résidence perchée sur les hauteurs de TailBlue, loin du tumulte du Royaume.",
  },
  {
    id: "chateau",
    name: "👑 Château de Hime-sama",
    price: null,
    level: 9999,
    image: "/ImagesMaison/Image_Chateau.png",
    description:
      "La résidence royale de Hime-sama, au cœur du Royaume. Le Château ne peut pas être acheté.",
  },
];

// TEMPORAIRE : sera remplacé par le vrai profil joueur via l'API TailBlue.
const CURRENT_PLAYER_OWNED_HOUSE_IDS = new Set(["chateau"]);

export default function HousePage() {
  const [filter, setFilter] = useState<"owned" | "all">("all");
  const [selectedId, setSelectedId] = useState("chateau");

  const filteredHouses = useMemo(() => {
    if (filter === "owned") {
      return HOUSES.filter((house) =>
        CURRENT_PLAYER_OWNED_HOUSE_IDS.has(house.id)
      );
    }

    return HOUSES;
  }, [filter]);

  const selected =
    filteredHouses.find((house) => house.id === selectedId) ??
    filteredHouses[0] ??
    HOUSES[0];

  function changeFilter(value: string) {
    const nextFilter = value as "owned" | "all";
    setFilter(nextFilter);

    const nextList =
      nextFilter === "owned"
        ? HOUSES.filter((house) =>
            CURRENT_PLAYER_OWNED_HOUSE_IDS.has(house.id)
          )
        : HOUSES;

    if (nextList.length > 0) {
      setSelectedId(nextList[0].id);
    }
  }

  return (
    <section className="real-page">
      <div className="real-page-heading">
        <div>
          <p className="eyebrow">RÉSIDENCES DU ROYAUME</p>
          <h2>Maison</h2>
          <p className="real-muted">
            Consulte ta résidence ou découvre toutes les maisons disponibles dans TailBlue.
          </p>
        </div>

        <FilterSelect
          value={filter}
          onChange={changeFilter}
          options={[
            { value: "owned", label: "Ma maison" },
            { value: "all", label: "Toutes les maisons" },
          ]}
        />
      </div>

      <article className="showcase-card">
        <div
          className="showcase-visual"
          style={{ backgroundImage: `url("${selected.image}")` }}
        >
          <div className="showcase-blur" />
          <img
            className="showcase-main-image"
            src={selected.image}
            alt={selected.name}
          />
        </div>

        <div className="showcase-info">
          <div>
            <p className="eyebrow">
              {CURRENT_PLAYER_OWNED_HOUSE_IDS.has(selected.id)
                ? "✓ POSSÉDÉE"
                : "RÉSIDENCE"}
            </p>

            <h2>{selected.name}</h2>
            <p className="showcase-description">{selected.description}</p>
          </div>

          <div className="showcase-stats">
            <div>
              <span>Niveau requis</span>
              <strong>
                {selected.id === "chateau" ? "Hime-sama" : selected.level}
              </strong>
            </div>

            <div>
              <span>Prix</span>
              <strong>
                {selected.price === null
                  ? "Réservé à la Couronne"
                  : selected.price === 0
                  ? "Gratuit"
                  : `${selected.price.toLocaleString("fr-CH")} cookies`}
              </strong>
            </div>
          </div>
        </div>
      </article>

      <div className="house-selector">
        {filteredHouses.map((house) => (
          <button
            key={house.id}
            className={`house-thumb ${
              selected.id === house.id ? "selected" : ""
            }`}
            onClick={() => setSelectedId(house.id)}
          >
            <div
              className="thumb-visual"
              style={{ backgroundImage: `url("${house.image}")` }}
            >
              <img src={house.image} alt={house.name} />
            </div>

            <span>{house.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
