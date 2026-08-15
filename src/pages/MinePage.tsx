import { useEffect, useMemo, useState } from "react";
import { tailBlueApi } from "../api/tailblueApi";
import CombatPanel from "../components/mine/CombatPanel";
import PotionMenu from "../components/mine/PotionMenu";
import MineCompanionCare from "../components/mine/MineCompanionCare";
import type {
  CombatStateDto,
  MineAction,
  MineRoomDto,
  MineSnapshotDto,
  PotionDto,
} from "../types/backend";
import "./adventurePages.css";

const roomIcons: Record<MineRoomDto["type"], string> = {
  entrance: "🚪",
  empty: "🕯️",
  ore: "⛏️",
  monster: "👹",
  treasure: "📦",
  rest: "🛏️",
  event: "✨",
  secret: "❓",
  boss: "💀",
  exit: "🔽",
  safe: "🏕️",
};

const roomNames: Record<MineRoomDto["type"], string> = {
  entrance: "Entrée",
  empty: "Galerie silencieuse",
  ore: "Veine de minerai",
  monster: "Présence hostile",
  treasure: "Salle au trésor",
  rest: "Recoin sûr",
  event: "Anomalie",
  secret: "Salle secrète",
  boss: "Antre du boss",
  exit: "Passage inférieur",
  safe: "Refuge",
};

const roomDescriptions: Record<MineRoomDto["type"], string> = {
  entrance: "Le courant d'air froid venu des profondeurs te rappelle que la sortie est encore proche.",
  empty: "Des gouttes résonnent au loin. Rien ne bouge… pour l'instant.",
  ore: "Une veine métallique traverse la roche. Ta pioche pourrait en tirer quelque chose.",
  monster: "Un grondement sec résonne derrière les pierres. Quelque chose approche.",
  treasure: "Un vieux coffre repose dans la poussière. Son verrou semble encore intact.",
  rest: "Le calme étrange de cette salle permettrait de reprendre des forces.",
  event: "Une lueur bleutée pulse entre deux fissures. Tu ne sais pas ce qu'elle cache.",
  secret: "Un souffle glacé trahit l'existence d'un passage impossible à voir depuis le corridor.",
  boss: "Le sol tremble légèrement. Une présence beaucoup plus dangereuse t'attend ici.",
  exit: "Un escalier descend plus profondément dans l'Abîme.",
  safe: "Les lanternes du refuge repoussent l'obscurité.",
};

const DEMO_POTIONS: PotionDto[] = [
  { id: "demo-heal", name: "Potion de soin", emoji: "🧪", quantity: 3, description: "Donnée de démonstration en attendant l'inventaire réel.", heal: 30 },
  { id: "demo-energy", name: "Élixir d'énergie", emoji: "🔷", quantity: 2, description: "Donnée de démonstration en attendant l'inventaire réel.", energy: 35 },
];

const DEMO_COMBAT: CombatStateDto = {
  active: true,
  canFlee: true,
  player: { id: "player", name: "Hime-sama", emoji: "👑", hp: 84, maxHp: 100, energy: 67, maxEnergy: 100 },
  enemy: {
    id: "goblin_miner",
    monsterId: "goblin_miner",
    name: "Gobelin mineur",
    emoji: "⛏️",
    family: "goblin",
    boss: false,
    level: 12,
    hp: 95,
    maxHp: 120,
  },
  companion: { id: "sugus", name: "Sugus", emoji: "🐯", hp: 100, maxHp: 100 },
  skills: [
    { id: "demo-skill-1", name: "Compétence synchronisée", emoji: "✨", description: "Les vraies compétences seront envoyées par le moteur de combat.", energyCost: 10 },
    { id: "demo-skill-2", name: "Technique du compagnon", emoji: "🐯", description: "Placeholder UI uniquement : aucun skill réel n'est inventé.", energyCost: 15 },
  ],
  log: ["⚔️ Le combat démarre.", "👹 La créature bloque le passage."],
};

const DEMO: MineSnapshotDto = {
  floor: 12,
  maxFloor: 100,
  depthMeters: 1032,
  currentRoomId: "ore",
  hp: 100,
  maxHp: 100,
  energy: 67,
  maxEnergy: 100,
  torch: 59,
  companion: {
    id: "sugus",
    name: "Sugus",
    emoji: "🐯",
    hp: 100,
    maxHp: 100,
    energy: 82,
    maxEnergy: 100,
    trustLabel: "💞 Lien absolu",
    availableFoods: [],
    canPet: true,
  },
  rooms: [
    { id: "entrance", x: 2, y: 4, type: "entrance", revealed: true, cleared: true, neighbors: ["empty"] },
    { id: "empty", x: 2, y: 3, type: "empty", revealed: true, cleared: true, neighbors: ["entrance", "ore", "monster", "event"] },
    { id: "ore", x: 1, y: 3, type: "ore", revealed: true, cleared: false, neighbors: ["empty"] },
    { id: "monster", x: 3, y: 3, type: "monster", revealed: true, cleared: false, neighbors: ["empty"] },
    { id: "event", x: 2, y: 2, type: "event", revealed: true, cleared: false, neighbors: ["empty", "treasure", "rest", "boss"] },
    { id: "treasure", x: 1, y: 2, type: "treasure", revealed: false, cleared: false, neighbors: ["event"] },
    { id: "rest", x: 3, y: 2, type: "rest", revealed: false, cleared: false, neighbors: ["event"] },
    { id: "boss", x: 2, y: 1, type: "boss", revealed: false, cleared: false, neighbors: ["event", "exit"] },
    { id: "exit", x: 2, y: 0, type: "exit", revealed: false, cleared: false, neighbors: ["boss"] },
  ],
  recentLoot: [
    { id: "ore", name: "Minerai brut", emoji: "🪨", quantity: 4 },
    { id: "core", name: "Noyau bleu", emoji: "🔵", quantity: 1 },
    { id: "wing", name: "Bat Wing", emoji: "🪽", quantity: 2 },
  ],
  log: [
    "✨ Une lueur bleutée pulse entre deux fissures.",
    "🕯️ Tu entends quelque chose bouger plus loin dans la galerie.",
    "⛏️ Ta pioche est prête.",
  ],
  potions: DEMO_POTIONS,
  combat: null,
  allowedActions: { mine: true, search: true, fight: false, rest: false, potion: true, descend: false },
};

export default function MinePage() {
  const [snapshot, setSnapshot] = useState<MineSnapshotDto>(DEMO);
  const [apiMode, setApiMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [potionOpen, setPotionOpen] = useState(false);
  const [combat, setCombat] = useState<CombatStateDto | null>(null);
  const [petCareOpen, setPetCareOpen] = useState(false);

  useEffect(() => {
    if (!tailBlueApi.isConfigured()) return;

    tailBlueApi.getMine()
      .then((real) => {
        setSnapshot(real);
        setCombat(real.combat ?? null);
        setApiMode(true);
      })
      .catch(() => {
        setApiMode(false);
      });
  }, []);

  const currentRoom = snapshot.rooms.find((room) => room.id === snapshot.currentRoomId) ?? snapshot.rooms[0];

  const reachableIds = useMemo(
    () => new Set(currentRoom?.neighbors ?? []),
    [currentRoom]
  );

  async function dispatch(action: MineAction) {
    if (busy) return;

    if (
      combat?.active &&
      (
        action.action === "move" ||
        action.action === "pet_feed" ||
        action.action === "pet_cuddle"
      )
    ) {
      return;
    }
    setBusy(true);

    try {
      if (apiMode) {
        const next = await tailBlueApi.mineAction(action);
        setSnapshot(next);
        setCombat(next.combat ?? null);
        return;
      }

      // Démonstration UI locale uniquement.
      if (action.action === "move") {
        if (!reachableIds.has(action.roomId)) return;

        const targetRoom = snapshot.rooms.find(
          (room) => room.id === action.roomId,
        );

        if (!targetRoom) return;

        setSnapshot((old) => ({
          ...old,
          currentRoomId: action.roomId,
          energy: Math.max(0, old.energy - 2),
          torch: Math.max(0, old.torch - 2),
          log: [
            `🚶 Tu avances vers ${roomNames[targetRoom.type]}.`,
            ...old.log,
          ].slice(0, 7),
        }));

        if (targetRoom.type === "monster") {
          setCombat(DEMO_COMBAT);
        }

        if (targetRoom.type === "boss") {
          setCombat({
            ...DEMO_COMBAT,
            canFlee: false,
            enemy: {
              id: "goblin_king",
              monsterId: "goblin_king",
              name: "Goblin King",
              emoji: "👺👑",
              family: "goblin",
              boss: true,
              level: 52,
              hp: 4200,
              maxHp: 4200,
            },
            log: [
              "👑 Le Goblin King bloque le passage.",
              "⚔️ Le combat de boss commence.",
            ],
          });
        }
      }

      if (action.action === "mine") {
        setSnapshot((old) => ({
          ...old,
          energy: Math.max(0, old.energy - 8),
          log: ["⛏️ Démonstration : le vrai loot sera calculé par mine.py.", ...old.log].slice(0, 7),
        }));
      }

      if (action.action === "search") {
        setSnapshot((old) => ({
          ...old,
          energy: Math.max(0, old.energy - 5),
          log: ["🔎 Démonstration : le vrai événement de fouille viendra du backend.", ...old.log].slice(0, 7),
        }));
      }

      if (action.action === "rest") {
        setSnapshot((old) => ({
          ...old,
          hp: Math.min(old.maxHp, old.hp + 18),
          energy: Math.min(old.maxEnergy, old.energy + 22),
          log: ["🛏️ Démonstration : repos effectué.", ...old.log].slice(0, 7),
        }));
      }

      if (action.action === "descend") {
        setSnapshot((old) => ({
          ...old,
          floor: Math.min(old.maxFloor, old.floor + 1),
          log: ["🔽 Démonstration : étage suivant.", ...old.log].slice(0, 7),
        }));
      }

      if (action.action === "pet_feed") {
        setSnapshot((old) => ({
          ...old,
          log: [
            "🍖 Aperçu local : le vrai repas sera résolu par pets.py.",
            ...old.log,
          ].slice(0, 7),
        }));
      }

      if (action.action === "pet_cuddle") {
        setSnapshot((old) => ({
          ...old,
          log: [
            "💜 Aperçu local : la vraie papouille sera résolue par pets.py.",
            ...old.log,
          ].slice(0, 7),
        }));
      }

      if (action.action === "use_potion") {
        setSnapshot((old) => {
          const potion = old.potions.find((item) => item.id === action.potionId);
          if (!potion || potion.quantity <= 0) return old;

          return {
            ...old,
            hp: Math.min(old.maxHp, old.hp + (potion.heal ?? 0)),
            energy: Math.min(old.maxEnergy, old.energy + (potion.energy ?? 0)),
            potions: old.potions.map((item) => item.id === potion.id ? { ...item, quantity: item.quantity - 1 } : item),
            log: [`${potion.emoji ?? "🧪"} Démonstration : ${potion.name} utilisée.`, ...old.log].slice(0, 7),
          };
        });
        setPotionOpen(false);
      }

      if (action.action.startsWith("combat_")) {
        setCombat((old) => old ? {
          ...old,
          log: [`⚙️ Démonstration UI : "${action.action}" sera résolu par le moteur Python.`, ...old.log].slice(0, 8),
        } : old);
      }
    } finally {
      setBusy(false);
    }
  }

  function openFight() {
    if (apiMode && snapshot.combat) {
      setCombat(snapshot.combat);
      return;
    }
    setCombat(DEMO_COMBAT);
  }

  const actions = [
    { id: "mine", label: "Miner", emoji: "⛏️", enabled: snapshot.allowedActions.mine, action: () => dispatch({ action: "mine" }) },
    { id: "search", label: "Fouiller", emoji: "🔎", enabled: snapshot.allowedActions.search, action: () => dispatch({ action: "search" }) },
    { id: "fight", label: "Combattre", emoji: "⚔️", enabled: snapshot.allowedActions.fight || !apiMode, action: openFight },
    { id: "rest", label: "Repos", emoji: "🛏️", enabled: snapshot.allowedActions.rest, action: () => dispatch({ action: "rest" }) },
    { id: "potion", label: "Potion", emoji: "🧪", enabled: snapshot.allowedActions.potion, action: () => setPotionOpen(true) },
    { id: "descend", label: "Descendre", emoji: "🔽", enabled: snapshot.allowedActions.descend, action: () => dispatch({ action: "descend" }) },
  ];

  return (
    <section className="mine-page">
      <div className="mine-heading">
        <div>
          <p className="eyebrow">L'ABÎME DE TAILBLUE</p>
          <h2>Mine</h2>
          <p className="mine-muted">
            Explore les {snapshot.maxFloor} étages, révèle les galeries et ramène tes trouvailles.
          </p>
        </div>

        <div className="mine-floor-badge">
          <span>ÉTAGE</span>
          <strong>{snapshot.floor}</strong>
          <small>/ {snapshot.maxFloor}</small>
        </div>
      </div>

      <div className="mine-hud">
        <HudStat className="hp" title="❤️ PV" value={snapshot.hp} max={snapshot.maxHp} />
        <HudStat className="energy" title="⚡ Énergie" value={snapshot.energy} max={snapshot.maxEnergy} />
        <HudStat className="torch" title="🔥 Torche" value={snapshot.torch} max={100} suffix="%" />

        <button
          className="hud-pet hud-pet-button"
          disabled={!snapshot.companion || Boolean(combat?.active)}
          onClick={() => setPetCareOpen(true)}
          title={
            combat?.active
              ? "Le compagnon ne peut pas être soigné depuis la carte pendant un combat."
              : snapshot.companion
                ? "Nourrir ou papouiller le compagnon"
                : "Aucun compagnon d'expédition"
          }
        >
          <span>{snapshot.companion?.emoji ?? "🐾"}</span>
          <div>
            <small>Compagnon</small>
            <strong>{snapshot.companion?.name ?? "Aucun"}</strong>
          </div>
          {snapshot.companion && (
            <b className="hud-pet-care-hint">🍖</b>
          )}
        </button>
      </div>

      <div className="mine-main-grid">
        <article className="mine-map-panel">
          <div className="mine-panel-title">
            <div><p className="eyebrow">CARTE PROCÉDURALE</p><h3>Galeries découvertes</h3></div>
            <span className="map-legend">● Vous · lignes = passages</span>
          </div>

          <div className="mine-map">
            <div className="mine-map-grid-lines" />

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }}
            >
              {snapshot.rooms.flatMap((room) =>
                room.neighbors
                  .filter((neighborId) => room.id < neighborId)
                  .map((neighborId) => {
                    const target = snapshot.rooms.find((item) => item.id === neighborId);
                    if (!target || (!room.revealed && !target.revealed)) return null;
                    return (
                      <line
                        key={`${room.id}-${neighborId}`}
                        x1={10 + room.x * 20}
                        y1={7 + room.y * 17}
                        x2={10 + target.x * 20}
                        y2={7 + target.y * 17}
                        stroke="rgba(78, 154, 240, .26)"
                        strokeWidth="0.55"
                      />
                    );
                  })
              )}
            </svg>

            {snapshot.rooms.map((room) => {
              const isCurrent = room.id === snapshot.currentRoomId;
              const canMove = !combat?.active && room.revealed && reachableIds.has(room.id);

              return (
                <button
                  key={room.id}
                  className={[
                    "mine-room",
                    room.revealed ? "revealed" : "unknown",
                    room.cleared ? "cleared" : "",
                    isCurrent ? "current" : "",
                    canMove ? "reachable" : "",
                    `room-${room.type}`,
                  ].join(" ")}
                  style={{ left: `${10 + room.x * 20}%`, top: `${7 + room.y * 17}%` }}
                  disabled={!canMove || busy}
                  onClick={() => dispatch({ action: "move", roomId: room.id })}
                  title={
                    isCurrent
                      ? `${roomNames[room.type]} — salle actuelle`
                      : canMove
                        ? `Se déplacer vers : ${roomNames[room.type]}`
                        : room.revealed
                          ? `${roomNames[room.type]} — pas directement reliée`
                          : "Inconnue"
                  }
                >
                  {room.revealed ? roomIcons[room.type] : "?"}
                  {isCurrent ? <span className="player-pulse" /> : null}
                </button>
              );
            })}

            <div className="mine-depth-overlay">
              <span>PROFONDEUR</span>
              <strong>{snapshot.depthMeters ?? snapshot.floor * 86} m</strong>
            </div>
          </div>
        </article>

        <div className="mine-right-column">
          <article className="mine-room-panel">
            <div className="room-header">
              <div className="room-icon-large">{roomIcons[currentRoom.type]}</div>
              <div><p className="eyebrow">SALLE ACTUELLE</p><h3>{roomNames[currentRoom.type]}</h3></div>
            </div>

            <p className="room-narrative">{roomDescriptions[currentRoom.type]}</p>

            <div className="room-danger-meter">
              <span>Niveau de menace</span>
              <div><i /><i /><i className={snapshot.floor >= 10 ? "on" : ""} /><i className={snapshot.floor >= 30 ? "on" : ""} /><i className={snapshot.floor >= 60 ? "on" : ""} /></div>
            </div>
          </article>

          <article className="mine-log-panel">
            <div className="mine-panel-title">
              <div><p className="eyebrow">JOURNAL D'EXPÉDITION</p><h3>Derniers événements</h3></div>
              <span className="live-dot">● LIVE</span>
            </div>

            <div className="mine-log">
              {snapshot.log.map((entry, index) => (
                <div key={`${entry}-${index}`} className={index === 0 ? "latest" : ""}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{entry}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      <article className="mine-actions-panel">
        <div className="mine-panel-title">
          <div><p className="eyebrow">COMMANDES</p><h3>Actions disponibles</h3></div>
          <span>{apiMode ? "● Backend connecté" : "○ Prototype local"}</span>
        </div>

        <div className="mine-actions">
          {actions.map((action) => (
            <button key={action.id} disabled={!action.enabled || busy} onClick={action.action}>
              <span>{action.emoji}</span>{action.label}
            </button>
          ))}
        </div>
      </article>

      <article className="mine-loot-panel mine-loot-full">
        <div className="mine-panel-title">
          <div><p className="eyebrow">SAC D'EXPÉDITION</p><h3>Butin récent</h3></div>
          <span>{snapshot.recentLoot.reduce((sum, item) => sum + item.quantity, 0)} objets</span>
        </div>

        <div className="mine-loot-list">
          {snapshot.recentLoot.map((item) => (
            <div key={item.id}>
              <span className="loot-emoji">{item.emoji ?? "🎒"}</span>
              <div><strong>{item.name}</strong><small>Inventaire RPG</small></div>
              <b>×{item.quantity}</b>
            </div>
          ))}
        </div>
      </article>

      <MineCompanionCare
        open={petCareOpen}
        companion={snapshot.companion}
        busy={busy}
        onClose={() => setPetCareOpen(false)}
        onFeed={(foodId) =>
          dispatch({ action: "pet_feed", foodId })
        }
        onCuddle={() => dispatch({ action: "pet_cuddle" })}
      />

      <PotionMenu
        open={potionOpen}
        potions={snapshot.potions}
        onClose={() => setPotionOpen(false)}
        onUse={(potionId) => dispatch({ action: "use_potion", potionId })}
      />

      <CombatPanel
        combat={combat}
        onClose={() => setCombat(null)}
        onAttack={() => dispatch({ action: "combat_attack" })}
        onSkill={(skillId) => dispatch({ action: "combat_skill", skillId })}
        onDefend={() => dispatch({ action: "combat_defend" })}
        onFlee={() => dispatch({ action: "combat_flee" })}
      />
    </section>
  );
}

function HudStat({
  className,
  title,
  value,
  max,
  suffix = "",
}: {
  className: string;
  title: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const percent = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));

  return (
    <div className={`hud-stat ${className}`}>
      <div className="hud-stat-title"><span>{title}</span><strong>{suffix ? `${value}${suffix}` : `${value}/${max}`}</strong></div>
      <div className="hud-track"><div style={{ width: `${percent}%` }} /></div>
    </div>
  );
}
