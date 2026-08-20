import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  craftInventoryItem,
  equipInventoryItem,
  getCachedInventorySnapshot,
  inventoryApiConfigured,
  isInventoryCacheFresh,
  loadCraftRecipe,
  loadInventorySnapshot,
  openInventoryStream,
  sellClassicInventoryItem,
  unequipInventorySlot,
} from "../api/inventoryApi";
import { INVENTORY_PREVIEW } from "../data/inventoryPreviewData";
import type {
  ClassicInventoryCategory,
  ClassicInventoryItemDto,
  CraftRecipeDetailDto,
  CraftRecipeSummaryDto,
  EquipmentSlot,
  InventoryItemDto,
  InventorySnapshotDto,
  ItemRarity,
  ItemType,
} from "../types/inventory";
import "./playerPages.css";
import "./inventoryFinal.css";

type InventorySection = "bag" | "loot" | "equipment" | "craft";

const ITEM_TYPES: Array<{
  value: "all" | ItemType;
  label: string;
}> = [
  { value: "all", label: "Tous les objets" },
  { value: "equipment", label: "⚔️ Équipements" },
  { value: "consumable", label: "🧪 Consommables" },
  { value: "material", label: "🪨 Matériaux" },
  { value: "plan", label: "📜 Plans" },
  { value: "quest", label: "🗝️ Quêtes" },
  { value: "relic", label: "🏺 Reliques" },
];

const RARITIES: Array<{
  value: "all" | ItemRarity;
  label: string;
}> = [
  { value: "all", label: "Toutes les raretés" },
  { value: "common", label: "⚪ Commun" },
  { value: "uncommon", label: "🟢 Peu commun" },
  { value: "rare", label: "🔵 Rare" },
  { value: "epic", label: "🟣 Épique" },
  { value: "legendary", label: "🟠 Légendaire" },
  { value: "mythic", label: "👑 Mythique" },
];

const STAT_LABELS: Record<string, string> = {
  hp: "❤️ PV",
  attack: "⚔️ Attaque",
  defense: "🛡️ Défense",
  crit: "🎯 Critique",
  dodge: "💨 Esquive",
  luck: "🍀 Chance",
};

const SECTION_TABS: Array<{
  id: InventorySection;
  icon: string;
  label: string;
  subtitle: string;
}> = [
  {
    id: "bag",
    icon: "🎒",
    label: "Sac à dos",
    subtitle: "Inventaire RPG",
  },
  {
    id: "loot",
    icon: "🧺",
    label: "Objets & butin",
    subtitle: "Objets du Royaume et vente",
  },
  {
    id: "equipment",
    icon: "⚔️",
    label: "Équipement",
    subtitle: "Équiper et déséquiper",
  },
  {
    id: "craft",
    icon: "🛠️",
    label: "Artisanat",
    subtitle: "Toutes les recettes",
  },
];

const CLASSIC_CATEGORIES: Array<{
  value: "all" | ClassicInventoryCategory;
  label: string;
}> = [
  { value: "all", label: "Tous" },
  { value: "classique", label: "🎒 Objets" },
  { value: "metier", label: "💼 Loot métier" },
  { value: "precieux", label: "✨ Précieux" },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-CH").format(value);
}

function nonZeroStats(
  stats?: InventoryItemDto["stats"] | null,
) {
  if (!stats) return [];

  return Object.entries(stats).filter(
    ([, value]) => Number(value) !== 0,
  );
}

function InventoryPreviewBanner() {
  return (
    <div className="tb-inventory-preview-banner">
      <span>🧪</span>
      <div>
        <strong>Mode aperçu local</strong>
        <p>
          L'interface est active, mais les actions qui
          modifieraient réellement l'inventaire restent
          verrouillées jusqu'à la connexion au backend
          TailBlue.
        </p>
      </div>
    </div>
  );
}

function ItemModal({
  item,
  apiEnabled,
  onClose,
  onGoEquipment,
}: {
  item: InventoryItemDto;
  apiEnabled: boolean;
  onClose: () => void;
  onGoEquipment: () => void;
}) {
  return (
    <div
      className="item-modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <article className="item-modal">
        <button
          className="item-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        <div
          className={`item-modal-icon rarity-${item.rarity}`}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} />
          ) : (
            item.emoji
          )}
        </div>

        <div className="item-modal-body">
          <p className="eyebrow">{item.rarityLabel}</p>
          <h2>{item.name}</h2>
          <p className="item-modal-description">
            {item.description}
          </p>

          <div className="item-meta-grid">
            <div>
              <span>Type</span>
              <strong>{item.type}</strong>
            </div>

            <div>
              <span>Quantité possédée</span>
              <strong>×{item.quantity}</strong>
            </div>

            <div>
              <span>Emplacement</span>
              <strong>{item.slotLabel || "—"}</strong>
            </div>

            <div>
              <span>Élément</span>
              <strong>{item.element || "—"}</strong>
            </div>
          </div>

          {nonZeroStats(item.stats).length > 0 && (
            <>
              <h3>Statistiques</h3>
              <div className="item-detail-stats">
                {nonZeroStats(item.stats).map(
                  ([key, value]) => (
                    <div key={key}>
                      <span>
                        {STAT_LABELS[key] || key}
                      </span>
                      <strong>
                        {Number(value) >= 0 ? "+" : ""}
                        {value}
                      </strong>
                    </div>
                  ),
                )}
              </div>
            </>
          )}

          {!!item.effects?.length && (
            <>
              <h3>Effets</h3>
              <div className="item-effect-list">
                {item.effects.map((effect, index) => (
                  <div key={`${effect}-${index}`}>
                    ✦ {effect}
                  </div>
                ))}
              </div>
            </>
          )}

          {item.lore && (
            <>
              <h3>Histoire</h3>
              <p className="item-lore">{item.lore}</p>
            </>
          )}

          {item.type === "equipment" && (
            <button
              className="tb-item-equipment-link"
              onClick={() => {
                onClose();
                onGoEquipment();
              }}
            >
              ⚔️ Ouvrir la gestion de l'équipement
              <span>→</span>
            </button>
          )}

          {!apiEnabled && (
            <div className="tb-inventory-local-note">
              🔒 Les modifications réelles seront effectuées
              uniquement par equipment.py / items.py côté
              serveur.
            </div>
          )}
        </div>
      </article>
    </div>
  );
}

function BagSection({
  snapshot,
  onSelected,
}: {
  snapshot: InventorySnapshotDto;
  onSelected: (item: InventoryItemDto) => void;
}) {
  const [query, setQuery] = useState("");
  const [type, setType] =
    useState<"all" | ItemType>("all");
  const [rarity, setRarity] =
    useState<"all" | ItemRarity>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");

    return snapshot.items.filter((item) => {
      const haystack = [
        item.name,
        item.description,
        item.lore || "",
        item.family || "",
        ...(item.tags || []),
      ]
        .join(" ")
        .toLocaleLowerCase("fr");

      return (
        (!q || haystack.includes(q)) &&
        (type === "all" || item.type === type) &&
        (rarity === "all" || item.rarity === rarity)
      );
    });
  }, [query, rarity, snapshot.items, type]);

  const quantity = filtered.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <>
      <div className="inventory-toolbar">
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Rechercher un objet…"
        />

        <select
          value={type}
          onChange={(event) =>
            setType(
              event.target.value as "all" | ItemType,
            )
          }
        >
          {ITEM_TYPES.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={rarity}
          onChange={(event) =>
            setRarity(
              event.target.value as
                | "all"
                | ItemRarity,
            )
          }
        >
          {RARITIES.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="inventory-category-strip">
        {ITEM_TYPES.slice(1).map((option) => (
          <button
            key={option.value}
            className={
              type === option.value ? "selected" : ""
            }
            onClick={() =>
              setType(
                type === option.value
                  ? "all"
                  : (option.value as ItemType),
              )
            }
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="tb-bag-counter">
        <span>{filtered.length} type(s)</span>
        <strong>{quantity} objet(s)</strong>
      </div>

      {!filtered.length ? (
        <div className="inventory-empty">
          <span>🎒</span>
          <h3>Aucun objet ici</h3>
          <p>Modifie les filtres ou la recherche.</p>
        </div>
      ) : (
        <div className="inventory-grid">
          {filtered.map((item) => (
            <button
              className={`inventory-item rarity-${item.rarity}`}
              key={item.id}
              onClick={() => onSelected(item)}
            >
              <div className="inventory-item-top">
                <span className="item-emoji">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                    />
                  ) : (
                    item.emoji
                  )}
                </span>

                <span className="item-quantity">
                  ×{item.quantity}
                </span>
              </div>

              <span className="item-rarity">
                {item.rarityLabel}
              </span>

              <h3>{item.name}</h3>
              <p>{item.description}</p>

              {nonZeroStats(item.stats).length > 0 && (
                <div className="item-stat-preview">
                  {nonZeroStats(item.stats)
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <span key={key}>
                        {STAT_LABELS[key] || key}{" "}
                        {Number(value) >= 0 ? "+" : ""}
                        {value}
                      </span>
                    ))}
                </div>
              )}

              <span className="inventory-detail-link">
                Voir les détails →
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}


function LootSection({
  snapshot,
  busy,
  message,
  onSell,
}: {
  snapshot: InventorySnapshotDto;
  busy: string | null;
  message: string | null;
  onSell: (key: string, quantity: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] =
    useState<"all" | ClassicInventoryCategory>("all");
  const [selectedKey, setSelectedKey] =
    useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const classic = snapshot.classicInventory;

  const filtered = useMemo(() => {
    if (!classic) return [];

    const q = query.trim().toLocaleLowerCase("fr");

    return classic.items.filter((item) => {
      const haystack = [
        item.name,
        item.description || "",
        item.rarityLabel || "",
        item.id,
      ]
        .join(" ")
        .toLocaleLowerCase("fr");

      return (
        (!q || haystack.includes(q)) &&
        (category === "all" ||
          item.category === category)
      );
    });
  }, [category, classic, query]);

  const selected = useMemo(
    () =>
      classic?.items.find(
        (item) => item.key === selectedKey,
      ) ?? null,
    [classic, selectedKey],
  );

  const totalObjects =
    classic?.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    ) ?? 0;

  const selectedTotal =
    selected &&
    !selected.mysteryPrice &&
    selected.unitPrice !== null
      ? selected.unitPrice * quantity
      : null;

  useEffect(() => {
    if (!selected) {
      setQuantity(1);
      return;
    }

    setQuantity((current) =>
      Math.max(1, Math.min(selected.quantity, current)),
    );
  }, [selected]);

  function selectItem(item: ClassicInventoryItemDto) {
    setSelectedKey(item.key);
    setQuantity(1);
  }

  function changeQuantity(delta: number) {
    if (!selected) return;

    setQuantity((current) =>
      Math.max(
        1,
        Math.min(selected.quantity, current + delta),
      ),
    );
  }

  if (!classic) {
    return (
      <div className="tb-loot-section">
        <div className="tb-loot-hero">
          <div>
            <span className="tb-loot-eyebrow">
              🧺 SAC CLASSIQUE DU ROYAUME
            </span>
            <h3>Objets & butin</h3>
            <p>
              Lettres, objets spéciaux et loot de métier
              vivent ici, séparés du Sac à dos RPG.
            </p>
          </div>

          <div className="tb-loot-hero-badge">
            <span>!vendre</span>
            <strong>!sellloot</strong>
          </div>
        </div>

        <div className="tb-loot-api-missing">
          <span>🔌</span>
          <div>
            <strong>
              Interface prête — données classiques à brancher
            </strong>
            <p>
              Le snapshot actuel ne renvoie encore que le sac
              RPG. Cette zone attend
              <code> classicInventory </code>
              depuis Python. Aucune donnée de butin n'est
              inventée localement.
            </p>
          </div>
        </div>

        <div className="tb-loot-source-note">
          <strong>
            🛡️ La vente reste autoritaire côté Python
          </strong>
          <span>
            Les prix, protections, quantités et gains ne sont
            jamais recalculés par React.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="tb-loot-section">
      <div className="tb-loot-hero">
        <div>
          <span className="tb-loot-eyebrow">
            🧺 SAC CLASSIQUE DU ROYAUME
          </span>
          <h3>Objets & butin</h3>
          <p>
            Lettres, objets spéciaux et loot de métier.
            Sélectionne un objet pour préparer sa vente.
          </p>
        </div>

        <div className="tb-loot-hero-badge">
          <span>!vendre</span>
          <strong>!sellloot</strong>
        </div>
      </div>

      <div className="tb-loot-kpis">
        <div>
          <span>Types</span>
          <strong>{classic.items.length}</strong>
        </div>
        <div>
          <span>Objets</span>
          <strong>{formatNumber(totalObjects)}</strong>
        </div>
        <div>
          <span>Valeur connue</span>
          <strong>
            {formatNumber(classic.knownPotentialValue)} 🍪
          </strong>
        </div>
        <div>
          <span>Cookies</span>
          <strong>
            {classic.cookies == null
              ? "—"
              : `${formatNumber(classic.cookies)} 🍪`}
          </strong>
        </div>
      </div>

      {message && (
        <div className="tb-inventory-action-message tb-loot-action-message">
          {message}
        </div>
      )}

      <div className="tb-loot-toolbar">
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Rechercher dans les objets & butin…"
        />

        <div className="tb-loot-filters">
          {CLASSIC_CATEGORIES.map((option) => (
            <button
              key={option.value}
              className={
                category === option.value ? "selected" : ""
              }
              onClick={() => setCategory(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tb-loot-counter">
        <span>{filtered.length} type(s) affiché(s)</span>
        <strong>
          {
            filtered.reduce(
              (sum, item) => sum + item.quantity,
              0,
            )
          }{" "}
          objet(s)
        </strong>
      </div>

      {!filtered.length ? (
        <div className="inventory-empty tb-loot-empty">
          <span>🧺</span>
          <h3>Cette poche est vide</h3>
          <p>
            Modifie la recherche ou choisis une autre
            catégorie.
          </p>
        </div>
      ) : (
        <div className="tb-loot-grid">
          {filtered.map((item) => {
            const priceText =
              item.mysteryPrice || item.unitPrice === null
                ? "???"
                : `${formatNumber(item.unitPrice)} 🍪`;

            return (
              <button
                key={item.key}
                className={`tb-loot-card ${
                  selectedKey === item.key ? "selected" : ""
                }`}
                onClick={() => selectItem(item)}
              >
                <div className="tb-loot-card-top">
                  <span className="tb-loot-card-emoji">
                    {item.emoji || "🎒"}
                  </span>
                  <span className="tb-loot-card-quantity">
                    ×{formatNumber(item.quantity)}
                  </span>
                </div>

                <span className="tb-loot-card-meta">
                  {item.rarityLabel ||
                    (item.category === "metier"
                      ? "Loot de métier"
                      : item.category === "precieux"
                        ? "Objet précieux"
                        : "Objet du Royaume")}
                </span>

                <h3>{item.name}</h3>

                <p>
                  {item.description ||
                    "Aucune description disponible."}
                </p>

                <div className="tb-loot-card-footer">
                  <span>Prix unitaire</span>
                  <strong>{priceText}</strong>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="tb-loot-sale-panel">
          <div className="tb-loot-sale-heading">
            <div className="tb-loot-sale-item">
              <span>{selected.emoji || "🎒"}</span>
              <div>
                <small>Préparer la vente</small>
                <strong>{selected.name}</strong>
              </div>
            </div>

            <button
              className="tb-loot-close"
              onClick={() => {
                setSelectedKey(null);
                setQuantity(1);
              }}
              aria-label="Fermer la préparation de vente"
            >
              ✕
            </button>
          </div>

          <div className="tb-loot-sale-info">
            <div>
              <span>Dans le sac</span>
              <strong>
                ×{formatNumber(selected.quantity)}
              </strong>
            </div>
            <div>
              <span>Prix unitaire</span>
              <strong>
                {selected.mysteryPrice ||
                selected.unitPrice === null
                  ? "???"
                  : `${formatNumber(selected.unitPrice)} 🍪`}
              </strong>
            </div>
            <div>
              <span>Total estimé</span>
              <strong>
                {selectedTotal === null
                  ? "???"
                  : `${formatNumber(selectedTotal)} 🍪`}
              </strong>
            </div>
          </div>

          <div className="tb-loot-quantity">
            <div className="tb-loot-quantity-label">
              <span>Quantité à vendre</span>
              <strong>
                ×{formatNumber(quantity)}
              </strong>
              <small>
                sur {formatNumber(selected.quantity)} dans le sac
              </small>
            </div>

            <div className="tb-loot-quantity-controls">
              <button
                onClick={() => changeQuantity(-10)}
                disabled={quantity <= 1}
              >
                −10
              </button>
              <button
                onClick={() => changeQuantity(-1)}
                disabled={quantity <= 1}
              >
                −1
              </button>

              <div
                className="tb-loot-quantity-value"
                aria-label={`Quantité sélectionnée : ${quantity}`}
              >
                <small>À vendre</small>
                <strong>
                  ×{formatNumber(quantity)}
                </strong>
              </div>

              <button
                onClick={() => changeQuantity(1)}
                disabled={quantity >= selected.quantity}
              >
                +1
              </button>
              <button
                onClick={() => changeQuantity(10)}
                disabled={quantity >= selected.quantity}
              >
                +10
              </button>
              <button
                onClick={() =>
                  setQuantity(selected.quantity)
                }
                disabled={quantity >= selected.quantity}
              >
                Max
              </button>
            </div>
          </div>

          <div className="tb-loot-sale-actions">
            <div>
              <strong>
                {selected.sellable
                  ? "🧺 Vente validée par TailBlue"
                  : "🛡️ Objet protégé"}
              </strong>
              <span>
                {selected.saleLockedReason ||
                  (selected.sellable
                    ? "Le serveur relit le stock et le vrai prix au clic. Le total ci-dessus n'est qu'un affichage estimatif."
                    : "Le serveur indique que cet objet ne peut pas être vendu.")}
              </span>
            </div>

            <button
              className="tb-loot-sell-button"
              disabled={
                !inventoryApiConfigured ||
                !selected.sellable ||
                busy === `sell:${selected.key}`
              }
              onClick={() => onSell(selected.key, quantity)}
              title={
                !inventoryApiConfigured
                  ? "API TailBlue non configurée."
                  : selected.saleLockedReason || undefined
              }
            >
              {busy === `sell:${selected.key}`
                ? "⏳ Vente…"
                : `✅ Vendre ×${formatNumber(quantity)}`}
            </button>
          </div>
        </div>
      )}

      <div className="tb-loot-source-note">
        <strong>
          🧺 Source de vérité : inventaire classique TailBlue
        </strong>
        <span>
          Même logique métier que !vendre / !sellloot :
          le serveur contrôle le stock, le prix et le gain
          avant toute modification.
        </span>
      </div>
    </div>
  );
}

function EquipmentSection({
  snapshot,
  busy,
  message,
  onEquip,
  onUnequip,
  onInspect,
}: {
  snapshot: InventorySnapshotDto;
  busy: string | null;
  message: string | null;
  onEquip: (itemId: string) => void;
  onUnequip: (slot: EquipmentSlot) => void;
  onInspect: (item: InventoryItemDto) => void;
}) {
  const equipment = snapshot.equipment;

  return (
    <div className="tb-equipment-section">
      <div className="tb-equipment-hero">
        <div>
          <p className="eyebrow">!EQUIPEMENT</p>
          <h2>Équipement actif</h2>
          <p>
            Les mêmes 8 emplacements que la commande
            Discord. Seuls les objets réellement possédés
            sont proposés.
          </p>
        </div>

        <span className="tb-equipment-level">
          Niveau {equipment.playerLevel}
        </span>
      </div>

      {message && (
        <div className="tb-inventory-action-message">
          {message}
        </div>
      )}

      <div className="tb-equipment-layout">
        <div className="tb-equipment-slots">
          {equipment.slots.map((slot) => (
            <article
              key={slot.slot}
              className={`tb-equipment-slot ${
                slot.equippedItem
                  ? "equipped"
                  : "empty"
              }`}
            >
              <div className="tb-equipment-slot-heading">
                <span>{slot.emoji}</span>
                <div>
                  <small>EMPLACEMENT</small>
                  <strong>{slot.label}</strong>
                </div>
              </div>

              {slot.equippedItem ? (
                <button
                  className="tb-equipped-item"
                  onClick={() =>
                    onInspect(slot.equippedItem!)
                  }
                >
                  <span>
                    {slot.equippedItem.emoji}
                  </span>
                  <div>
                    <strong>
                      {slot.equippedItem.name}
                    </strong>
                    <small>
                      {slot.equippedItem.rarityLabel}
                    </small>
                  </div>
                </button>
              ) : (
                <div className="tb-equipment-empty-slot">
                  <span>＋</span>
                  <small>Rien d'équipé</small>
                </div>
              )}

              <button
                className="tb-unequip-button"
                disabled={
                  !slot.equippedItem ||
                  busy === `unequip:${slot.slot}` ||
                  snapshot.mode !== "api"
                }
                onClick={() => onUnequip(slot.slot)}
                title={
                  snapshot.mode !== "api"
                    ? "Disponible après connexion au backend"
                    : "Déséquiper"
                }
              >
                {busy === `unequip:${slot.slot}`
                  ? "Patiente…"
                  : "🟥 Déséquiper"}
              </button>
            </article>
          ))}
        </div>

        <aside className="tb-equipment-stats">
          <p className="eyebrow">STATISTIQUES</p>
          <h3>Valeurs actives</h3>

          <div className="tb-equipment-stat-grid">
            {Object.entries(
              equipment.activeStats,
            ).map(([key, value]) => (
              <div key={key}>
                <span>{STAT_LABELS[key] || key}</span>
                <strong>{formatNumber(value)}</strong>
              </div>
            ))}
          </div>

          {equipment.affinityText && (
            <div className="tb-equipment-affinity">
              ✨ {equipment.affinityText}
            </div>
          )}
        </aside>
      </div>

      <section className="tb-owned-equipment">
        <div className="tb-section-heading">
          <div>
            <p className="eyebrow">MES ÉQUIPEMENTS</p>
            <h3>Objets disponibles à équiper</h3>
          </div>

          <span>
            {
              snapshot.items.filter(
                (item) =>
                  item.type === "equipment" &&
                  item.quantity > 0,
              ).length
            }{" "}
            possédé(s)
          </span>
        </div>

        <div className="tb-owned-equipment-grid">
          {snapshot.items
            .filter(
              (item) =>
                item.type === "equipment" &&
                item.quantity > 0,
            )
            .map((item) => {
              const currentSlot =
                equipment.slots.find(
                  (slot) => slot.slot === item.slot,
                );

              const isEquipped =
                currentSlot?.equippedItemId === item.id;

              return (
                <article
                  key={item.id}
                  className={`tb-owned-equipment-card rarity-${item.rarity}`}
                >
                  <button
                    className="tb-owned-equipment-info"
                    onClick={() => onInspect(item)}
                  >
                    <span>{item.emoji}</span>
                    <div>
                      <small>{item.rarityLabel}</small>
                      <strong>{item.name}</strong>
                      <em>
                        {item.slotLabel || "Équipement"}
                      </em>
                    </div>
                  </button>

                  <div className="tb-owned-equipment-stats">
                    {nonZeroStats(item.stats)
                      .map(([key, value]) => (
                        <span key={key}>
                          {STAT_LABELS[key] || key}{" "}
                          {Number(value) >= 0 ? "+" : ""}
                          {value}
                        </span>
                      ))}
                  </div>

                  <button
                    className={
                      isEquipped
                        ? "tb-equip-button equipped"
                        : "tb-equip-button"
                    }
                    disabled={
                      isEquipped ||
                      snapshot.mode !== "api" ||
                      busy === `equip:${item.id}`
                    }
                    onClick={() => onEquip(item.id)}
                  >
                    {isEquipped
                      ? "✅ Équipé"
                      : busy === `equip:${item.id}`
                        ? "Équipement…"
                        : "⚔️ Équiper"}
                  </button>
                </article>
              );
            })}
        </div>
      </section>
    </div>
  );
}

function RecipeModal({
  detail,
  mode,
  busy,
  onClose,
  onCraft,
}: {
  detail: CraftRecipeDetailDto;
  mode: InventorySnapshotDto["mode"];
  busy: boolean;
  onClose: () => void;
  onCraft: (
    itemId: string,
    quantity: number,
  ) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setQuantity(1);
  }, [detail.id]);

  const maximum = Math.max(0, detail.maxQuantity);

  const clamp = (next: number) => {
    if (maximum <= 0) return 1;
    return Math.max(1, Math.min(maximum, next));
  };

  const canCraft =
    mode === "api" &&
    detail.known &&
    detail.craftable &&
    maximum >= quantity &&
    !busy;

  return (
    <div
      className="tb-craft-modal-backdrop"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <article className="tb-craft-modal">
        <button
          className="tb-craft-modal-close"
          onClick={onClose}
        >
          ×
        </button>

        {!detail.known || detail.hidden ? (
          <div className="tb-craft-unknown-detail">
            <span>❔</span>
            <p className="eyebrow">RECETTE INCONNUE</p>
            <h2>??????</h2>
            <p>
              Réunis ses matériaux dans ton inventaire pour
              révéler automatiquement cette fabrication.
            </p>
          </div>
        ) : (
          <>
            <div className="tb-craft-detail-heading">
              <div className="tb-craft-detail-icon">
                {detail.imageUrl ? (
                  <img
                    src={detail.imageUrl}
                    alt={detail.name}
                  />
                ) : (
                  detail.emoji
                )}
              </div>

              <div>
                <p className="eyebrow">
                  {detail.workshopLabel}
                </p>
                <h2>{detail.name}</h2>
                <span>{detail.rarityLabel}</span>
              </div>
            </div>

            {detail.description && (
              <p className="tb-craft-description">
                {detail.description}
              </p>
            )}

            <div className="tb-craft-status-grid">
              <div>
                <span>Atelier requis</span>
                <strong>
                  Niv. {detail.workshopLevel}
                </strong>
              </div>
              <div>
                <span>Atelier actuel</span>
                <strong>
                  Niv. {detail.activeWorkshopLevel}
                </strong>
              </div>
              <div>
                <span>Maximum</span>
                <strong>x{detail.maxQuantity}</strong>
              </div>
              <div>
                <span>Production</span>
                <strong>
                  x{detail.outputQuantity}
                </strong>
              </div>
            </div>

            {detail.raceFitText && (
              <div className="tb-craft-race-fit">
                🧬 {detail.raceFitText}
              </div>
            )}

            <section className="tb-craft-material-section">
              <div className="tb-section-heading">
                <div>
                  <p className="eyebrow">COMPOSANTS</p>
                  <h3>Matériaux nécessaires</h3>
                </div>

                {detail.goldCost > 0 && (
                  <span>
                    🍪 {formatNumber(detail.goldCost)} /
                    fabrication
                  </span>
                )}
              </div>

              <div className="tb-craft-material-list">
                {detail.materials.map((material) => (
                  <div
                    key={material.id}
                    className={
                      material.enough
                        ? "enough"
                        : "missing"
                    }
                  >
                    <span className="tb-material-icon">
                      {material.emoji}
                    </span>

                    <div>
                      <strong>{material.name}</strong>
                      <small>
                        {material.sourceText ||
                          "Source TailBlue"}
                      </small>
                    </div>

                    <b>
                      {material.owned} /{" "}
                      {material.required * quantity}
                    </b>
                  </div>
                ))}
              </div>
            </section>

            {nonZeroStats(detail.stats).length > 0 && (
              <section className="tb-craft-material-section">
                <p className="eyebrow">STATISTIQUES</p>
                <div className="tb-craft-result-stats">
                  {nonZeroStats(detail.stats).map(
                    ([key, value]) => (
                      <span key={key}>
                        {STAT_LABELS[key] || key}{" "}
                        {Number(value) >= 0 ? "+" : ""}
                        {value}
                      </span>
                    ),
                  )}
                </div>
              </section>
            )}

            {!!detail.effects?.length && (
              <section className="tb-craft-material-section">
                <p className="eyebrow">EFFETS</p>
                <div className="item-effect-list">
                  {detail.effects.map((effect, index) => (
                    <div key={`${effect}-${index}`}>
                      ✦ {effect}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="tb-craft-quantity">
              <span>Quantité</span>

              <div>
                <button
                  onClick={() =>
                    setQuantity((value) =>
                      clamp(value - 10),
                    )
                  }
                  disabled={quantity <= 1}
                >
                  −10
                </button>

                <button
                  onClick={() =>
                    setQuantity((value) =>
                      clamp(value - 1),
                    )
                  }
                  disabled={quantity <= 1}
                >
                  −1
                </button>

                <strong>x{quantity}</strong>

                <button
                  onClick={() =>
                    setQuantity((value) =>
                      clamp(value + 1),
                    )
                  }
                  disabled={
                    maximum <= 0 ||
                    quantity >= maximum
                  }
                >
                  +1
                </button>

                <button
                  onClick={() =>
                    setQuantity((value) =>
                      clamp(value + 10),
                    )
                  }
                  disabled={
                    maximum <= 0 ||
                    quantity >= maximum
                  }
                >
                  +10
                </button>

                <button
                  onClick={() =>
                    setQuantity(
                      Math.max(1, maximum),
                    )
                  }
                  disabled={maximum <= 1}
                >
                  Max
                </button>
              </div>
            </div>

            <button
              className="tb-craft-main-button"
              disabled={!canCraft}
              onClick={() =>
                onCraft(detail.id, quantity)
              }
            >
              {busy
                ? "🛠️ Fabrication…"
                : `🛠️ Fabriquer x${quantity}`}
            </button>

            {mode !== "api" && (
              <div className="tb-inventory-local-note">
                🔒 En aperçu local, le bouton reste
                volontairement désactivé. Le vrai clic sera
                résolu par `craft.py`, qui retirera les
                matériaux/cookies et enregistrera les
                découvertes.
              </div>
            )}
          </>
        )}
      </article>
    </div>
  );
}

function CraftSection({
  snapshot,
  selectedRecipe,
  recipeLoading,
  craftBusy,
  message,
  onRecipe,
  onCloseRecipe,
  onCraft,
}: {
  snapshot: InventorySnapshotDto;
  selectedRecipe: CraftRecipeDetailDto | null;
  recipeLoading: boolean;
  craftBusy: boolean;
  message: string | null;
  onRecipe: (recipe: CraftRecipeSummaryDto) => void;
  onCloseRecipe: () => void;
  onCraft: (
    itemId: string,
    quantity: number,
  ) => void;
}) {
  const craft = snapshot.craft;

  const [category, setCategory] = useState("all");
  const [subcategory, setSubcategory] =
    useState("all");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const subcategories =
    craft.subcategoriesByCategory[category] || [];

  useEffect(() => {
    const allowed = new Set(
      subcategories.map((entry) => entry.id),
    );

    if (!allowed.has(subcategory)) {
      setSubcategory(
        subcategories[0]?.id ?? "all",
      );
    }
  }, [subcategory, subcategories]);

  const recipes = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("fr");

    return craft.recipes.filter((recipe) => {
      if (
        category !== "all" &&
        recipe.categoryId !== category
      ) {
        return false;
      }

      if (
        subcategory !== "all" &&
        recipe.subcategoryId !== subcategory
      ) {
        return false;
      }

      if (filter === "known" && !recipe.known) {
        return false;
      }

      if (
        filter === "craftable" &&
        !recipe.craftable
      ) {
        return false;
      }

      if (
        filter === "missing" &&
        (!recipe.known ||
          recipe.craftable ||
          recipe.missingCount <= 0)
      ) {
        return false;
      }

      if (
        filter === "unknown" &&
        recipe.known
      ) {
        return false;
      }

      if (
        q &&
        recipe.known &&
        !`${recipe.name} ${recipe.workshopLabel}`
          .toLocaleLowerCase("fr")
          .includes(q)
      ) {
        return false;
      }

      return true;
    });
  }, [
    category,
    craft.recipes,
    filter,
    query,
    subcategory,
  ]);

  return (
    <div className="tb-craft-section">
      <div className="tb-craft-top-grid">
        <div className="tb-craft-intro">
          <p className="eyebrow">!CRAFT • LIVE</p>
          <h2>Atelier de fabrication</h2>
          <p>
            Même inventaire canonique que Discord :
            recettes découvertes, matériaux, plans, niveaux
            d'atelier et affinités de race.
          </p>
        </div>

        <div className="tb-craft-kpis">
          <div>
            <span>📜 Recettes</span>
            <strong>
              {craft.knownRecipes}/
              {craft.totalRecipes}
            </strong>
          </div>

          <div>
            <span>✅ Fabricables</span>
            <strong>{craft.craftableRecipes}</strong>
          </div>

          <div>
            <span>🛠️ Fabriqué</span>
            <strong>
              {formatNumber(craft.totalCrafted)}
            </strong>
          </div>

          <div>
            <span>🍪 Réserve</span>
            <strong>
              {formatNumber(craft.cookies)}
            </strong>
          </div>
        </div>
      </div>

      {message && (
        <div className="tb-inventory-action-message">
          {message}
        </div>
      )}

      {!!craft.newDiscoveries.length && (
        <div className="tb-craft-discoveries">
          ✨ {craft.newDiscoveries.length} nouvelle(s)
          recette(s) viennent d'être révélées !
        </div>
      )}

      <div className="tb-craft-category-row">
        {craft.categories.map((entry) => (
          <button
            key={entry.id}
            className={
              category === entry.id ? "active" : ""
            }
            onClick={() => {
              setCategory(entry.id);
              setSubcategory("all");
            }}
          >
            <span>{entry.emoji}</span>
            <strong>{entry.name}</strong>
          </button>
        ))}
      </div>

      {!!subcategories.length && (
        <div className="tb-craft-subcategory-row">
          {subcategories.map((entry) => (
            <button
              key={entry.id}
              className={
                subcategory === entry.id
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSubcategory(entry.id)
              }
            >
              {entry.emoji} {entry.name}
            </button>
          ))}
        </div>
      )}

      <div className="tb-craft-toolbar">
        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Rechercher une recette découverte…"
        />

        <select
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
        >
          {craft.filters.map((entry) => (
            <option
              key={entry.id}
              value={entry.id}
            >
              {entry.emoji} {entry.name}
            </option>
          ))}
        </select>
      </div>

      {!recipes.length ? (
        <div className="inventory-empty">
          <span>🛠️</span>
          <h3>Aucune recette</h3>
          <p>
            Change de catégorie, de filtre ou de
            sous-catégorie.
          </p>
        </div>
      ) : (
        <div className="tb-craft-recipe-grid">
          {recipes.map((recipe) => (
            <button
              key={recipe.id}
              className={`tb-craft-recipe ${
                recipe.known
                  ? `rarity-${recipe.rarity}`
                  : "unknown"
              }`}
              onClick={() => onRecipe(recipe)}
            >
              <div className="tb-craft-recipe-top">
                <span className="tb-craft-recipe-icon">
                  {recipe.known
                    ? recipe.emoji
                    : "❔"}
                </span>

                <span
                  className={`tb-craft-recipe-state ${
                    recipe.craftable
                      ? "craftable"
                      : recipe.known
                        ? "missing"
                        : "unknown"
                  }`}
                >
                  {recipe.craftable
                    ? `✅ x${recipe.maxQuantity}`
                    : recipe.known
                      ? `📦 -${recipe.missingCount}`
                      : "❔ Inconnue"}
                </span>
              </div>

              <small>
                {recipe.known
                  ? recipe.rarityLabel
                  : "Recette cachée"}
              </small>

              <h3>
                {recipe.known
                  ? recipe.name
                  : "??????"}
              </h3>

              <p>
                {recipe.known
                  ? recipe.raceFitText ||
                    recipe.workshopLabel
                  : "Réunis ses matériaux pour révéler sa fabrication."}
              </p>

              <div className="tb-craft-recipe-footer">
                <span>
                  {recipe.workshopLabel} • niv.{" "}
                  {recipe.workshopLevel}
                </span>
                <strong>Ouvrir →</strong>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="tb-craft-bottom-note">
        <strong>
          🧰 Source de vérité : items.py + craft.py
        </strong>
        <span>
          L'application ne calcule ni les coûts, ni les
          découvertes, ni la quantité maximale. Le serveur
          renvoie l'état après chaque fabrication.
        </span>
      </div>

      {recipeLoading && (
        <div className="tb-craft-loading-overlay">
          <div>
            <span>🛠️</span>
            <strong>Ouverture de la recette…</strong>
          </div>
        </div>
      )}

      {selectedRecipe && !recipeLoading && (
        <RecipeModal
          detail={selectedRecipe}
          mode={snapshot.mode}
          busy={craftBusy}
          onClose={onCloseRecipe}
          onCraft={onCraft}
        />
      )}
    </div>
  );
}

export default function InventoryPage() {
  const [section, setSection] =
    useState<InventorySection>("bag");

  const [snapshot, setSnapshot] =
    useState<InventorySnapshotDto>(() =>
      getCachedInventorySnapshot() ??
      INVENTORY_PREVIEW
    );

  const [loading, setLoading] = useState(
    () =>
      inventoryApiConfigured &&
      getCachedInventorySnapshot() === null,
  );
  const [error, setError] =
    useState<string | null>(null);

  const [selectedItem, setSelectedItem] =
    useState<InventoryItemDto | null>(null);

  const [selectedRecipe, setSelectedRecipe] =
    useState<CraftRecipeDetailDto | null>(null);
  const [recipeLoading, setRecipeLoading] =
    useState(false);

  const [busy, setBusy] = useState<string | null>(
    null,
  );
  const [actionMessage, setActionMessage] =
    useState<string | null>(null);

  const refresh = useCallback(
    async (signal?: AbortSignal) => {
      try {
        setError(null);
        const next = await loadInventorySnapshot(
          signal,
        );
        setSnapshot(next);
      } catch (reason) {
        if (signal?.aborted) return;

        setError(
          reason instanceof Error
            ? reason.message
            : "Impossible de synchroniser l'inventaire.",
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    /*
     * Si la page vient juste d'être visitée, on garde le dernier
     * snapshot immédiatement au lieu de repasser par l'aperçu local.
     * Au-delà de 20 s, la synchro repart en arrière-plan sans faire
     * disparaître les données déjà affichées.
     */
    if (
      !inventoryApiConfigured ||
      !isInventoryCacheFresh()
    ) {
      void refresh(controller.signal);
    } else {
      setLoading(false);
    }

    if (!inventoryApiConfigured) {
      return () => controller.abort();
    }

    const interval = window.setInterval(
      () => void refresh(),
      30_000,
    );

    const closeStream = openInventoryStream(
      () => void refresh(),
    );

    return () => {
      controller.abort();
      window.clearInterval(interval);
      closeStream();
    };
  }, [refresh]);

  async function openRecipe(
    recipe: CraftRecipeSummaryDto,
  ) {
    setRecipeLoading(true);
    setSelectedRecipe(null);

    try {
      const detail = await loadCraftRecipe(recipe.id);
      setSelectedRecipe(detail);
    } catch (reason) {
      setActionMessage(
        reason instanceof Error
          ? reason.message
          : "Impossible d'ouvrir la recette.",
      );
    } finally {
      setRecipeLoading(false);
    }
  }

  async function equip(itemId: string) {
    if (!inventoryApiConfigured) return;

    setBusy(`equip:${itemId}`);

    try {
      const result = await equipInventoryItem(itemId);
      setSnapshot(result.snapshot);
      setActionMessage(result.message);
    } catch (reason) {
      setActionMessage(
        reason instanceof Error
          ? reason.message
          : "Impossible d'équiper cet objet.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function unequip(slot: EquipmentSlot) {
    if (!inventoryApiConfigured) return;

    setBusy(`unequip:${slot}`);

    try {
      const result =
        await unequipInventorySlot(slot);
      setSnapshot(result.snapshot);
      setActionMessage(result.message);
    } catch (reason) {
      setActionMessage(
        reason instanceof Error
          ? reason.message
          : "Impossible de déséquiper cet objet.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function craft(
    itemId: string,
    quantity: number,
  ) {
    if (!inventoryApiConfigured) return;

    setBusy(`craft:${itemId}`);

    try {
      const result = await craftInventoryItem(
        itemId,
        quantity,
      );

      setSnapshot(result.snapshot);
      setActionMessage(result.message);

      const detail = await loadCraftRecipe(itemId);
      setSelectedRecipe(detail);
    } catch (reason) {
      setActionMessage(
        reason instanceof Error
          ? reason.message
          : "Fabrication impossible.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function sellClassic(
    key: string,
    quantity: number,
  ) {
    if (!inventoryApiConfigured) return;

    setBusy(`sell:${key}`);
    setActionMessage(null);

    try {
      const result = await sellClassicInventoryItem(
        key,
        quantity,
      );

      setSnapshot((current) => ({
        ...current,
        classicInventory: result.classicInventory,
      }));
      setActionMessage(result.message);
    } catch (reason) {
      setActionMessage(
        reason instanceof Error
          ? reason.message
          : "Vente impossible.",
      );
    } finally {
      setBusy(null);
    }
  }

  const rpgQuantity = snapshot.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const classicQuantity =
    snapshot.classicInventory?.items.reduce(
      (sum, item) => sum + item.quantity,
      0,
    ) ?? 0;

  const totalQuantity =
    rpgQuantity + classicQuantity;

  const totalTypes =
    snapshot.items.length +
    (snapshot.classicInventory?.items.length ?? 0);

  return (
    <section className="player-page tb-inventory-final">
      <div className="player-page-heading">
        <div>
          <p className="eyebrow">
            SAC DE L'AVENTURIER
          </p>
          <h2>Inventaire</h2>
          <p className="player-muted">
            Objets, équipement actif et artisanat réunis
            dans un seul espace.
          </p>
        </div>

        <div className="inventory-summary">
          <span>{totalTypes} types</span>
          <strong>{totalQuantity} objets</strong>
        </div>
      </div>

      <div className="tb-inventory-main-tabs">
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            className={
              section === tab.id ? "active" : ""
            }
            onClick={() => {
              setSection(tab.id);
              setActionMessage(null);
            }}
          >
            <span>{tab.icon}</span>
            <div>
              <strong>{tab.label}</strong>
              <small>{tab.subtitle}</small>
            </div>
          </button>
        ))}
      </div>

      {snapshot.mode === "preview" &&
        !loading && (
          <InventoryPreviewBanner />
        )}

      {loading && (
        <div className="tb-inventory-loading">
          ⏳ Synchronisation de l'inventaire…
        </div>
      )}

      {error && (
        <div className="tb-inventory-error">
          ⚠️ {error}
        </div>
      )}

      {!(loading &&
        inventoryApiConfigured &&
        snapshot.mode === "preview") &&
        section === "bag" && (
        <BagSection
          snapshot={snapshot}
          onSelected={setSelectedItem}
        />
      )}

      {!(loading &&
        inventoryApiConfigured &&
        snapshot.mode === "preview") &&
        section === "loot" && (
        <LootSection
          snapshot={snapshot}
          busy={busy}
          message={actionMessage}
          onSell={(key, quantity) =>
            void sellClassic(key, quantity)
          }
        />
      )}

      {!(loading &&
        inventoryApiConfigured &&
        snapshot.mode === "preview") &&
        section === "equipment" && (
        <EquipmentSection
          snapshot={snapshot}
          busy={busy}
          message={actionMessage}
          onEquip={(itemId) => void equip(itemId)}
          onUnequip={(slot) => void unequip(slot)}
          onInspect={setSelectedItem}
        />
      )}

      {!(loading &&
        inventoryApiConfigured &&
        snapshot.mode === "preview") &&
        section === "craft" && (
        <CraftSection
          snapshot={snapshot}
          selectedRecipe={selectedRecipe}
          recipeLoading={recipeLoading}
          craftBusy={
            !!busy?.startsWith("craft:")
          }
          message={actionMessage}
          onRecipe={(recipe) =>
            void openRecipe(recipe)
          }
          onCloseRecipe={() =>
            setSelectedRecipe(null)
          }
          onCraft={(itemId, quantity) =>
            void craft(itemId, quantity)
          }
        />
      )}

      <div className="sync-note">
        <strong>
          🎒 Sac à dos RPG + 🧺 Objets & butin
        </strong>
        <span>
          Le Sac à dos reste lié à l'inventaire RPG
          canonique. Objets & butin représente le sac
          classique du Royaume utilisé par la logique
          !vendre / !sellloot. Les règles et mutations
          restent côté Python.
        </span>
      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          apiEnabled={inventoryApiConfigured}
          onClose={() => setSelectedItem(null)}
          onGoEquipment={() =>
            setSection("equipment")
          }
        />
      )}
    </section>
  );
}
