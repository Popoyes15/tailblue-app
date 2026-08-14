import { useMemo, useState } from "react";
import "./adventurePages.css";

type RoomType =
  | "entrance"
  | "empty"
  | "ore"
  | "monster"
  | "treasure"
  | "rest"
  | "event"
  | "secret"
  | "boss"
  | "exit"
  | "safe";

type MineRoom = {
  id: number;
  x: number;
  y: number;
  type: RoomType;
  revealed: boolean;
  cleared: boolean;
};

const roomIcons: Record<RoomType, string> = {
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

const roomNames: Record<RoomType, string> = {
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

const initialRooms: MineRoom[] = [
  { id: 1, x: 2, y: 4, type: "entrance", revealed: true, cleared: true },
  { id: 2, x: 2, y: 3, type: "empty", revealed: true, cleared: true },
  { id: 3, x: 1, y: 3, type: "ore", revealed: true, cleared: false },
  { id: 4, x: 3, y: 3, type: "monster", revealed: true, cleared: false },
  { id: 5, x: 2, y: 2, type: "event", revealed: true, cleared: false },
  { id: 6, x: 1, y: 2, type: "treasure", revealed: false, cleared: false },
  { id: 7, x: 3, y: 2, type: "rest", revealed: false, cleared: false },
  { id: 8, x: 2, y: 1, type: "boss", revealed: false, cleared: false },
  { id: 9, x: 2, y: 0, type: "exit", revealed: false, cleared: false },
];

const roomEvents: Record<RoomType, string[]> = {
  entrance: ["Le courant d'air froid venu des profondeurs te rappelle que la sortie est encore proche."],
  empty: ["Des gouttes résonnent au loin. Rien ne bouge… pour l'instant."],
  ore: ["Une veine métallique traverse la roche. Ta pioche pourrait en tirer quelque chose."],
  monster: ["Un grondement sec résonne derrière les pierres. Quelque chose approche."],
  treasure: ["Un vieux coffre repose dans la poussière. Son verrou semble encore intact."],
  rest: ["Le calme étrange de cette salle permettrait de reprendre des forces."],
  event: ["Une lueur bleutée pulse entre deux fissures. Tu ne sais pas ce qu'elle cache."],
  secret: ["Un souffle glacé trahit l'existence d'un passage impossible à voir depuis le corridor."],
  boss: ["Le sol tremble légèrement. Une présence beaucoup plus dangereuse t'attend ici."],
  exit: ["Un escalier descend plus profondément dans l'Abîme."],
  safe: ["Les lanternes du refuge repoussent l'obscurité."],
};

const lootSeed = [
  { emoji: "🪨", name: "Minerai brut", qty: 4 },
  { emoji: "🔵", name: "Noyau bleu", qty: 1 },
  { emoji: "🪽", name: "Bat Wing", qty: 2 },
];

export default function MinePage() {
  const [floor, setFloor] = useState(12);
  const [currentRoomId, setCurrentRoomId] = useState(5);
  const [hp, setHp] = useState(84);
  const [maxHp] = useState(100);
  const [energy, setEnergy] = useState(67);
  const [maxEnergy] = useState(100);
  const [torch, setTorch] = useState(73);
  const [rooms, setRooms] = useState(initialRooms);
  const [loot, setLoot] = useState(lootSeed);
  const [log, setLog] = useState([
    "✨ Une lueur bleutée pulse entre deux fissures.",
    "🕯️ Tu entends quelque chose bouger plus loin dans la galerie.",
    "⛏️ Ta pioche est prête.",
  ]);

  const currentRoom = rooms.find((room) => room.id === currentRoomId) ?? rooms[0];

  const roomText = useMemo(
    () => roomEvents[currentRoom.type][0],
    [currentRoom.type]
  );

  function pushLog(text: string) {
    setLog((old) => [text, ...old].slice(0, 7));
  }

  function spendEnergy(amount: number) {
    setEnergy((value) => Math.max(0, value - amount));
  }

  function revealAround(roomId: number) {
    const room = rooms.find((item) => item.id === roomId);
    if (!room) return;

    setRooms((old) =>
      old.map((item) => {
        const distance = Math.abs(item.x - room.x) + Math.abs(item.y - room.y);
        return distance <= 1 ? { ...item, revealed: true } : item;
      })
    );
  }

  function moveTo(room: MineRoom) {
    if (!room.revealed) return;
    setCurrentRoomId(room.id);
    spendEnergy(2);
    setTorch((value) => Math.max(0, value - 2));
    revealAround(room.id);
    pushLog(`${roomIcons[room.type]} Tu entres dans : ${roomNames[room.type]}.`);
  }

  function mineOre() {
    spendEnergy(8);
    setLoot((old) => {
      const next = [...old];
      const ore = next.find((item) => item.name === "Minerai brut");
      if (ore) ore.qty += 2;
      return next;
    });
    pushLog("⛏️ Tu extrais 2 unités de minerai brut. Elles rejoignent l'inventaire RPG.");
  }

  function searchRoom() {
    spendEnergy(5);
    const roll = Math.random();
    if (roll < 0.35) {
      pushLog("🍪 Tu retrouves quelques cookies dans les débris.");
    } else if (roll < 0.65) {
      setLoot((old) => [...old, { emoji: "🪙", name: "Ancient Coin", qty: 1 }]);
      pushLog("🪙 Une Ancient Coin était dissimulée sous une dalle.");
    } else if (roll < 0.85) {
      setHp((value) => Math.max(1, value - 7));
      pushLog("⚠️ Un piège se déclenche : -7 PV.");
    } else {
      pushLog("❓ Un courant d'air étrange révèle la présence d'un passage caché.");
    }
  }

  function rest() {
    spendEnergy(0);
    setHp((value) => Math.min(maxHp, value + 18));
    setEnergy((value) => Math.min(maxEnergy, value + 22));
    pushLog("🛏️ Tu te reposes quelques instants : PV et énergie récupérés.");
  }

  function potion() {
    setHp((value) => Math.min(maxHp, value + 30));
    pushLog("🧪 Tu utilises une potion de soin.");
  }

  function descend() {
    setFloor((value) => Math.min(100, value + 1));
    setCurrentRoomId(1);
    setRooms(initialRooms);
    spendEnergy(10);
    pushLog("🔽 Tu descends d'un étage. La carte change complètement autour de toi.");
  }

  const actions = [
    {
      id: "mine",
      label: "Miner",
      emoji: "⛏️",
      enabled: currentRoom.type === "ore",
      onClick: mineOre,
    },
    {
      id: "search",
      label: "Fouiller",
      emoji: "🔎",
      enabled: true,
      onClick: searchRoom,
    },
    {
      id: "fight",
      label: "Combattre",
      emoji: "⚔️",
      enabled: currentRoom.type === "monster" || currentRoom.type === "boss",
      onClick: () => pushLog("⚔️ Le combat sera branché au moteur combat.py."),
    },
    {
      id: "rest",
      label: "Repos",
      emoji: "🛏️",
      enabled: currentRoom.type === "rest" || currentRoom.type === "safe",
      onClick: rest,
    },
    {
      id: "potion",
      label: "Potion",
      emoji: "🧪",
      enabled: true,
      onClick: potion,
    },
    {
      id: "descend",
      label: "Descendre",
      emoji: "🔽",
      enabled: currentRoom.type === "exit",
      onClick: descend,
    },
  ];

  return (
    <section className="mine-page">
      <div className="mine-heading">
        <div>
          <p className="eyebrow">L'ABÎME DE TAILBLUE</p>
          <h2>Mine</h2>
          <p className="mine-muted">
            Explore les 100 étages, révèle les galeries, combats les créatures et ramène tes trouvailles.
          </p>
        </div>

        <div className="mine-floor-badge">
          <span>ÉTAGE</span>
          <strong>{floor}</strong>
          <small>/ 100</small>
        </div>
      </div>

      <div className="mine-hud">
        <div className="hud-stat hp">
          <div className="hud-stat-title"><span>❤️ PV</span><strong>{hp}/{maxHp}</strong></div>
          <div className="hud-track"><div style={{ width: `${(hp/maxHp)*100}%` }} /></div>
        </div>

        <div className="hud-stat energy">
          <div className="hud-stat-title"><span>⚡ Énergie</span><strong>{energy}/{maxEnergy}</strong></div>
          <div className="hud-track"><div style={{ width: `${(energy/maxEnergy)*100}%` }} /></div>
        </div>

        <div className="hud-stat torch">
          <div className="hud-stat-title"><span>🔥 Torche</span><strong>{torch}%</strong></div>
          <div className="hud-track"><div style={{ width: `${torch}%` }} /></div>
        </div>

        <div className="hud-pet">
          <span>🐯</span>
          <div><small>Compagnon</small><strong>Sugus</strong></div>
        </div>
      </div>

      <div className="mine-main-grid">
  <article className="mine-map-panel">
    <div className="mine-panel-title">
      <div>
        <p className="eyebrow">CARTE PROCÉDURALE</p>
        <h3>Galeries découvertes</h3>
      </div>

      <span className="map-legend">● Vous · ◌ Inconnue</span>
    </div>

    <div className="mine-map">
      <div className="mine-map-grid-lines" />

      {rooms.map((room) => (
        <button
          key={room.id}
          className={[
            "mine-room",
            room.revealed ? "revealed" : "unknown",
            room.cleared ? "cleared" : "",
            room.id === currentRoomId ? "current" : "",
            `room-${room.type}`,
          ].join(" ")}
          style={{
            left: `${10 + room.x * 20}%`,
            top: `${7 + room.y * 17}%`,
          }}
          disabled={!room.revealed}
          onClick={() => moveTo(room)}
          title={room.revealed ? roomNames[room.type] : "Inconnue"}
        >
          {room.revealed ? roomIcons[room.type] : "?"}

          {room.id === currentRoomId && (
            <span className="player-pulse" />
          )}
        </button>
      ))}

      <div className="mine-depth-overlay">
        <span>PROFONDEUR</span>
        <strong>{floor * 86} m</strong>
      </div>
    </div>
      </article>

      <div className="mine-right-column">
        <article className="mine-room-panel">
          <div className="room-header">
            <div className="room-icon-large">
              {roomIcons[currentRoom.type]}
            </div>

            <div>
              <p className="eyebrow">SALLE ACTUELLE</p>
              <h3>{roomNames[currentRoom.type]}</h3>
            </div>
          </div>

          <p className="room-narrative">{roomText}</p>

          <div className="room-danger-meter">
            <span>Niveau de menace</span>

            <div>
              <i />
              <i />
              <i className={floor >= 10 ? "on" : ""} />
              <i className={floor >= 30 ? "on" : ""} />
              <i className={floor >= 60 ? "on" : ""} />
            </div>
          </div>
        </article>

        <article className="mine-log-panel">
          <div className="mine-panel-title">
            <div>
              <p className="eyebrow">JOURNAL D'EXPÉDITION</p>
              <h3>Derniers événements</h3>
            </div>

            <span className="live-dot">● LIVE</span>
          </div>

          <div className="mine-log">
            {log.map((entry, index) => (
              <div
                key={`${entry}-${index}`}
                className={index === 0 ? "latest" : ""}
              >
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <p>{entry}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </div>

    <article className="mine-actions-panel">
      <div className="mine-panel-title">
        <div>
          <p className="eyebrow">COMMANDES</p>
          <h3>Actions disponibles</h3>
        </div>
      </div>

      <div className="mine-actions">
        {actions.map((action) => (
          <button
            key={action.id}
            disabled={!action.enabled}
            onClick={action.onClick}
          >
            <span>{action.emoji}</span>
            {action.label}
          </button>
        ))}
      </div>
    </article>

    <article className="mine-loot-panel mine-loot-full">
      <div className="mine-panel-title">
        <div>
          <p className="eyebrow">SAC D'EXPÉDITION</p>
          <h3>Butin récent</h3>
        </div>

        <span>
          {loot.reduce((sum, item) => sum + item.qty, 0)} objets
        </span>
      </div>

      <div className="mine-loot-list">
        {loot
          .slice(-6)
          .reverse()
          .map((item, index) => (
            <div key={`${item.name}-${index}`}>
              <span className="loot-emoji">
                {item.emoji}
              </span>

              <div>
                <strong>{item.name}</strong>
                <small>Inventaire RPG</small>
              </div>

              <b>×{item.qty}</b>
            </div>
          ))}
      </div>
    </article>

          <div className="mine-loot-list">
            {loot.slice(-6).reverse().map((item, index) => (
              <div key={`${item.name}-${index}`}>
                <span className="loot-emoji">{item.emoji}</span>
                <div><strong>{item.name}</strong><small>Inventaire RPG</small></div>
                <b>×{item.qty}</b>
              </div>
            ))}
          </div>
      

      <div className="mine-api-note">
        <span>⚙️</span>
        <div>
          <strong>Interface prête pour le moteur réel de mine.py</strong>
          <p>
            Carte, salle, actions, PV, énergie, torches, inventaire, monstres et quêtes seront alimentés par le backend.
            Les boutons ci-dessus simulent déjà le comportement pour tester l'expérience utilisateur.
          </p>
        </div>
      </div>
    </section>
  );
}
