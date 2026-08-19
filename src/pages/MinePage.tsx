import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { mineApi } from "../api/mineApi";
import CombatPanel from "../components/mine/CombatPanel";
import MineCompanionCare from "../components/mine/MineCompanionCare";
import MineJournal from "../components/mine/MineJournal";
import MineMap from "../components/mine/MineMap";
import MinePetPortrait from "../components/mine/MinePetPortrait";
import PotionMenu from "../components/mine/PotionMenu";
import { cleanMineText } from "../data/mineText";
import { resolveMonsterImage } from "../data/monsterVisuals";
import { setMineAudioFocus } from "../services/mineAudioFocus";
import {
  getMineAudioDebugInfo,
  installMineAudioUnlock,
  playMineSfx,
  playMineAudioTest,
  setMineMusic,
} from "../services/mineAudioService";
import type {
  MineCombat,
  MineCombatSummary,
  MineResult,
  MineSnapshot,
} from "../types/mine";
import "../components/mine/mineUltra.css";

const ROOM_ICONS: Record<string, string> = {
  entrance: "🚪",
  empty: "🕯️",
  ore: "⛏️",
  monster: "⚔️",
  treasure: "📦",
  rest: "🛏️",
  event: "✨",
  secret: "❔",
  boss: "💀",
  exit: "🔽",
  safe: "🏕️",
};

const ACTIONS: Array<{
  key: string;
  aliases: string[];
  label: string;
  icon: string;
  description: string;
}> = [
  { key: "mine", aliases: ["mine"], label: "Miner", icon: "⛏️", description: "Extraire la veine accessible" },
  { key: "search", aliases: ["search"], label: "Fouiller", icon: "🔎", description: "Inspecter chaque recoin" },
  { key: "open_chest", aliases: ["open_chest", "chest"], label: "Ouvrir le coffre", icon: "📦", description: "Récupérer le contenu" },
  { key: "resolve_event", aliases: ["resolve_event", "event"], label: "Examiner", icon: "✨", description: "Interagir avec l'anomalie" },
  { key: "rest", aliases: ["rest"], label: "Se reposer", icon: "🛏️", description: "Récupérer dans ce recoin" },
  { key: "descend", aliases: ["descend"], label: "Descendre", icon: "🔽", description: "Atteindre l'étage suivant" },
  { key: "build_safe_zone", aliases: ["build_safe_zone", "safe_zone"], label: "Créer un refuge", icon: "🏕️", description: "Sécuriser durablement la salle" },
];

function pct(value: number, max: number) {
  return Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
}

function resultKind(result?: MineResult | null) {
  const value = result?.metadata?.uiKind;
  return typeof value === "string" ? value : "";
}

function actionSound(action: string) {
  if (action === "mine") return "mine" as const;
  if (action === "search") return "search" as const;
  if (action === "open_chest" || action === "chest") return "loot" as const;
  if (action === "resolve_event" || action === "event") return "event" as const;
  if (action === "rest") return "rest" as const;
  return "step" as const;
}

function ResultCinematic({ result, onClose }: { result: MineResult; onClose: () => void }) {
  return (
    <div className={`tm-result tm-result-v48 tm-result-v52 ${result.success ? "success" : "failure"}`}>
      <button onClick={onClose} aria-label="Masquer">×</button>
      <div className="tm-result-symbol">{result.emoji || "✨"}</div>
      <div className="tm-result-body">
        <p className="tm-kicker">NOUVEL ÉVÉNEMENT</p>
        <h3>{cleanMineText(result.title, "Mine")}</h3>
        <p>{cleanMineText(result.message)}</p>
        <div className="tm-result-rewards">
          {result.cookies !== 0 && <span>🍪 {result.cookies > 0 ? "+" : ""}{result.cookies}</span>}
          {result.miningXp !== 0 && <span>⛏️ +{result.miningXp} XP mine</span>}
          {result.playerXp !== 0 && <span>✨ +{result.playerXp} XP</span>}
          {result.healing > 0 && <span>❤️ +{result.healing}</span>}
          {Object.entries(result.items).map(([id, quantity]) => (
            <span key={id}>🎒 {quantity > 0 ? "+" : ""}{quantity} {cleanMineText(id.replace(/_/g, " "))}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBar({
  snapshot,
  combatActive,
  onCompanion,
}: {
  snapshot: MineSnapshot;
  combatActive: boolean;
  onCompanion: () => void;
}) {
  return (
    <section className="tm-expedition-status">
      <div className="tm-status-identity">
        <div className="tm-avatar status-avatar">
          {snapshot.player.avatarUrl ? <img src={snapshot.player.avatarUrl} alt="" /> : <span>{snapshot.player.name.slice(0, 1)}</span>}
        </div>
        <div>
          <p className="tm-kicker">EXPÉDITION</p>
          <strong>{cleanMineText(snapshot.player.name)}</strong>
          <span>Mine niv. {snapshot.player.miningLevel} · Pioche R{snapshot.player.pickaxeTier}</span>
        </div>
      </div>

      <div className="tm-status-vital">
        <div><span>❤️ PV</span><b>{snapshot.player.hp}/{snapshot.player.maxHp}</b></div>
        <div className="tm-track hp"><i style={{ width: `${pct(snapshot.player.hp, snapshot.player.maxHp)}%` }} /></div>
      </div>

      <div className="tm-status-vital">
        <div><span>⚡ Fatigue</span><b>{snapshot.player.energy}/{snapshot.player.maxEnergy}</b></div>
        <div className="tm-track energy"><i style={{ width: `${pct(snapshot.player.energy, snapshot.player.maxEnergy)}%` }} /></div>
      </div>

      {snapshot.companion ? (
        <button className="tm-status-companion" disabled={combatActive} onClick={onCompanion}>
          <div className="tm-status-pet-pic"><MinePetPortrait pet={snapshot.companion} /></div>
          <div>
            <small>COMPAGNON</small>
            <strong>{cleanMineText(snapshot.companion.name)}</strong>
            <span>❤️ {snapshot.companion.hp}/{snapshot.companion.maxHp} · ⚡ {snapshot.companion.energy}/{snapshot.companion.maxEnergy}</span>
          </div>
          <b>›</b>
        </button>
      ) : (
        <div className="tm-status-solo">🧭 <span>Expédition solo</span></div>
      )}
    </section>
  );
}

function CombatSummaryCard({ summary }: { summary: MineCombatSummary }) {
  const techniques = [...summary.skillsUsed, ...summary.itemsUsed];

  return (
    <div className="tm-room-combat-summary">
      <div className="tm-combat-summary-metrics">
        <div><small>DÉGÂTS INFLIGÉS</small><strong>{summary.damageDealt}</strong></div>
        <div><small>DÉGÂTS SUBIS</small><strong>{summary.damageTaken}</strong></div>
        <div><small>TOURS</small><strong>{summary.turns}</strong></div>
        <div><small>CRITIQUES</small><strong>{summary.criticalHits}</strong></div>
      </div>

      {summary.companionDamageDealt > 0 && (
        <p className="tm-summary-pet">🐾 Compagnon : {summary.companionDamageDealt} dégâts infligés · {summary.companionDamageTaken} subis</p>
      )}

      {techniques.length > 0 && (
        <div className="tm-summary-techniques">
          <small>TECHNIQUES / OBJETS UTILISÉS</small>
          <div>{techniques.map((name) => <span key={name}>{cleanMineText(name)}</span>)}</div>
        </div>
      )}

      {summary.highlights.length > 0 && (
        <div className="tm-summary-highlights">
          {summary.highlights.slice(-3).map((line, index) => (
            <p key={`${index}-${line}`}>{cleanMineText(line)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MinePage() {
  useEffect(() => {
    setMineAudioFocus(true);
    return () => setMineAudioFocus(false);
  }, []);

  const [snapshot, setSnapshot] = useState<MineSnapshot | null>(null);
  const [combatResolution, setCombatResolution] = useState<MineCombat | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [potionOpen, setPotionOpen] = useState(false);
  const [careOpen, setCareOpen] = useState(false);
  const [selectedCompanion, setSelectedCompanion] = useState<string>("");
  const [result, setResult] = useState<MineResult | null>(null);
  const [audioDiag, setAudioDiag] = useState("🔊 TEST SON");

  const applySnapshot = useCallback((next: MineSnapshot) => {
    setSnapshot(next);
    if (next.combat?.active) setCombatResolution(null);
    if (next.combatResolution) setCombatResolution(next.combatResolution);
    if (next.result) setResult(next.result);
    setError("");
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      applySnapshot(await mineApi.snapshot());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la Mine.");
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const cleanup = installMineAudioUnlock();
    console.info("[TailBlue Mine Audio] État initial", getMineAudioDebugInfo());
    return cleanup;
  }, []);

  const combatForDisplay = snapshot?.combat?.active ? snapshot.combat : combatResolution;

  useEffect(() => {
    if (combatForDisplay) {
      void setMineMusic("combat");
      return () => { void setMineMusic("off"); };
    }
    if (snapshot?.active) {
      void setMineMusic("exploration");
      return () => { void setMineMusic("off"); };
    }
    void setMineMusic("off");
  }, [snapshot?.active, Boolean(snapshot?.combat?.active), combatResolution]);

  useEffect(() => {
    const events = combatForDisplay?.events ?? [];
    if (!events.length) return;
    const recent = events.slice(-4);
    if (recent.some((event) => event.visualTarget === "enemy" && event.amount > 0)) void playMineSfx("hit");
    if (recent.some((event) => event.visualTarget === "player" && event.amount > 0)) void playMineSfx("hurt");
    if (recent.some((event) => event.visualTarget === "companion" && event.amount > 0)) void playMineSfx("pet");
  }, [combatForDisplay?.events, combatResolution]);

  useEffect(() => {
    if (!combatResolution) return;
    if (combatResolution.outcome === "player_victory") void playMineSfx("victory");
    else if (combatResolution.outcome === "player_defeat") void playMineSfx("defeat");
  }, [combatResolution]);

  const run = useCallback(async (
    job: () => Promise<MineSnapshot>,
    sound?: Parameters<typeof playMineSfx>[0],
  ) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (sound) void playMineSfx(sound);
      applySnapshot(await job());
    } catch (err) {
      setError(cleanMineText(err instanceof Error ? err.message : "Action impossible."));
    } finally {
      setBusy(false);
    }
  }, [applySnapshot, busy]);

  const allowed = useMemo(
    () => new Set(snapshot?.allowedActions ?? []),
    [snapshot?.allowedActions],
  );

  const selectedPet = useMemo(
    () => snapshot?.companionChoices.find((pet) => pet.id === selectedCompanion) ?? null,
    [snapshot?.companionChoices, selectedCompanion],
  );

  if (loading && !snapshot) {
    return <section className="tm-page"><div className="tm-loading"><span>⛏️</span><strong>La Mine s'ouvre…</strong><p>Synchronisation avec TailBlue.</p></div></section>;
  }

  if (!snapshot) {
    return (
      <section className="tm-page">
        <div className="tm-error-card">
          <span>⚠️</span><h2>Mine indisponible</h2><p>{cleanMineText(error, "Aucune donnée reçue.")}</p>
          <button onClick={() => void refresh()}>Réessayer</button>
        </div>
      </section>
    );
  }

  const resolutionOverlay = combatResolution ? (
    <CombatPanel
      combat={combatResolution}
      resolutionMode
      busy
      onResolutionComplete={() => setCombatResolution(null)}
      onAttack={() => undefined}
      onDefend={() => undefined}
      onFlee={() => undefined}
      onSkill={() => undefined}
      onItem={() => undefined}
    />
  ) : null;

  if (!snapshot.active) {
    return (
      <section className="tm-page">
        <header className="tm-hero tm-prep-hero">
          <div>
            <p className="tm-kicker">L'ABÎME DE TAILBLUE</p>
            <h1>Préparer l'expédition</h1>
            <p>Une salle à la fois. Aucun contenu révélé avant d'y entrer. Ton équipement, tes soins et ton compagnon utilisent les vraies données TailBlue.</p>
          </div>
          <div className="tm-floor-orb"><small>RECORD</small><strong>{snapshot.highestFloor}</strong><span>/ {snapshot.maxFloor}</span></div>
        </header>

        {error && <div className="tm-inline-error">⚠️ {cleanMineText(error)}</div>}

        <div className="tm-prep-grid">
          <section className="tm-card tm-prep-player tm-prep-player-v50">
            <div className="tm-player-line">
              <div className="tm-avatar">
                {snapshot.player.avatarUrl ? <img src={snapshot.player.avatarUrl} alt="" /> : <span>{snapshot.player.name.slice(0, 1)}</span>}
              </div>
              <div>
                <p className="tm-kicker">AVENTURIER</p>
                <h2>{cleanMineText(snapshot.player.name)}</h2>
                <p>Niveau mine {snapshot.player.miningLevel} · Pioche rang {snapshot.player.pickaxeTier}</p>
              </div>
            </div>
            <div className="tm-vitals">
              <div><span>❤️ PV</span><b>{snapshot.player.hp}/{snapshot.player.maxHp}</b><div className="tm-track hp"><i style={{ width: `${pct(snapshot.player.hp, snapshot.player.maxHp)}%` }} /></div></div>
              <div><span>⚡ Fatigue</span><b>{snapshot.player.energy}/{snapshot.player.maxEnergy}</b><div className="tm-track energy"><i style={{ width: `${pct(snapshot.player.energy, snapshot.player.maxEnergy)}%` }} /></div></div>
            </div>

            {selectedPet ? (
              <div className="tm-prep-selected-pet">
                <div className="tm-prep-selected-pet-head">
                  <div className="tm-prep-selected-pet-image"><MinePetPortrait pet={selectedPet} /></div>
                  <div>
                    <p className="tm-kicker">COMPAGNON SÉLECTIONNÉ</p>
                    <strong>{cleanMineText(selectedPet.name)}</strong>
                    <span>Niv. {selectedPet.level} · {cleanMineText(selectedPet.role || "compagnon")} · 🤝 {selectedPet.trust}</span>
                  </div>
                </div>
                <div className="tm-prep-pet-vitals">
                  <div>
                    <div><span>❤️ PV</span><b>{selectedPet.hp}/{selectedPet.maxHp}</b></div>
                    <div className="tm-track hp"><i style={{ width: `${pct(selectedPet.hp, selectedPet.maxHp)}%` }} /></div>
                  </div>
                  <div>
                    <div><span>⚡ Endurance</span><b>{selectedPet.energy}/{selectedPet.maxEnergy}</b></div>
                    <div className="tm-track energy"><i style={{ width: `${pct(selectedPet.energy, selectedPet.maxEnergy)}%` }} /></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tm-prep-selected-solo">🧭 <span>Expédition solo sélectionnée</span></div>
            )}
          </section>

          <section className="tm-card tm-companion-select">
            <div>
              <p className="tm-kicker">COMPAGNON</p>
              <h2>Qui descend avec toi ?</h2>
              <p>Seuls tes compagnons réellement disponibles apparaissent.</p>
            </div>
            <div className="tm-pet-choice-grid">
              <button className={selectedCompanion === "" ? "selected" : ""} onClick={() => setSelectedCompanion("")}>
                <span>🧭</span><strong>Solo</strong><small>Descendre seule</small>
              </button>
              {snapshot.companionChoices.map((pet) => (
                <button key={pet.id} className={selectedCompanion === pet.id ? "selected" : ""} onClick={() => setSelectedCompanion(pet.id)}>
                  <div className="tm-pet-choice-image"><MinePetPortrait pet={pet} /></div>
                  <strong>{cleanMineText(pet.name)}</strong>
                  <small>Niv. {pet.level} · {cleanMineText(pet.role || "compagnon")}</small>
                  <span className="tm-pet-choice-vitals">
                    <span>❤️ {pet.hp}/{pet.maxHp}</span>
                    <span>⚡ {pet.energy}/{pet.maxEnergy}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <button className="tm-enter" disabled={busy} onClick={() => void run(() => mineApi.enter(selectedCompanion || null), "step")}>
          <span>⛏️</span>
          <div><strong>{busy ? "Ouverture…" : "Entrer dans la Mine"}</strong><small>Lancer l'expédition réelle</small></div>
          <b>→</b>
        </button>

        {resolutionOverlay}
      </section>
    );
  }

  const room = snapshot.room;
  const combatActive = Boolean(snapshot.combat?.active);
  const visibleActions = ACTIONS.filter((item) => item.aliases.some((alias) => allowed.has(alias)));
  const defeatedMonster = room?.defeatedMonsters?.slice(-1)[0];
  const defeatedImage = defeatedMonster ? resolveMonsterImage(defeatedMonster) : undefined;
  const combatSummary = defeatedMonster?.combatSummary ?? null;

  const companionFeedback = resultKind(result) === "companion" ? result : null;
  const potionFeedback = resultKind(result) === "potion" ? result : null;

  const doAction = (action: string) => run(() => mineApi.action(action), actionSound(action));

  return (
    <section className="tm-page tm-page-v48">
      {/* Header volontairement compact : on garde l'identité Mine sans manger 170px. */}
      <header className="tm-mine-topbar">
        <div>
          <p className="tm-kicker">L'ABÎME DE TAILBLUE</p>
          <div className="tm-topbar-title">
            <h1>Mine</h1>
            <span>{combatActive ? "🔒 Combat actif" : "🧭 Exploration"}</span>
          </div>
        </div>
        <p className="tm-topbar-hint">
          {combatActive ? "Le déplacement reste verrouillé jusqu'à la résolution du combat." : "Choisis une porte sur la carte. Les pièces inconnues gardent leur contenu secret."}
        </p>
        <div className="tm-topbar-floor"><small>ÉTAGE</small><strong>{snapshot.floor}</strong><span>/ {snapshot.maxFloor}</span></div>
      </header>

      {error && <div className="tm-inline-error">⚠️ {cleanMineText(error)}</div>}

      {/* V5.6 : portail directement dans document.body. La popup n'a plus
          aucun parent commun avec la grille Mine et ne peut donc pas la pousser. */}
      {result && !combatResolution && createPortal(
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            zIndex: 10000,
            top: 18,
            left: "50%",
            width: "min(760px, calc(100vw - 44px))",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            contain: "layout paint style",
          }}
        >
          <div style={{ pointerEvents: "auto", height: 118, minHeight: 118, maxHeight: 118, overflow: "hidden" }}>
            <ResultCinematic result={result} onClose={() => setResult(null)} />
          </div>
        </div>,
        document.body,
      )}

      {/* Marqueur volontairement visible : s'il n'est pas affiché, ce n'est
          PAS le build V5.6 qui tourne. Le bouton teste un vrai fichier audio. */}
      <div style={{ position: "fixed", right: 14, bottom: 14, zIndex: 10001, display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ padding: "7px 10px", borderRadius: 999, background: "rgba(21,92,128,.94)", border: "1px solid rgba(116,213,255,.35)", color: "#dff6ff", fontSize: 10, fontWeight: 900, letterSpacing: ".08em", boxShadow: "0 8px 24px rgba(0,0,0,.28)" }}>MINE FX 5.6 LIVE</span>
        <button
          type="button"
          onClick={async () => setAudioDiag(await playMineAudioTest())}
          style={{ padding: "7px 10px", borderRadius: 999, border: "1px solid rgba(116,213,255,.35)", color: "#dff6ff", background: "rgba(8,39,60,.96)", cursor: "pointer", fontSize: 10, fontWeight: 800 }}
        >{audioDiag}</button>
      </div>

      <div className="tm-explore-grid tm-explore-grid-v48">
        <MineMap
          map={snapshot.map}
          exits={snapshot.exits}
          disabled={busy || combatActive}
          onMove={(direction) => void run(() => mineApi.action("move", { direction }), "step")}
        />

        <section className="tm-room-card tm-room-card-v48">
          <div className={`tm-room-visual tm-room-visual-v48 ${defeatedMonster ? "has-trophy" : ""}`}>
            {defeatedMonster && defeatedImage ? (
              <img src={defeatedImage} alt="" draggable={false} />
            ) : (
              <span>{ROOM_ICONS[room?.type || "empty"] || "🕯️"}</span>
            )}
            <div className="tm-room-visual-shade" />
            <div className="tm-room-overlay-copy">
              <small>{defeatedMonster ? "COMBAT TERMINÉ DANS CETTE SALLE" : "SALLE ACTUELLE"}</small>
              <h2>{cleanMineText(room?.name, "Galerie")}</h2>
              <p>
                {defeatedMonster && combatSummary
                  ? `${cleanMineText(defeatedMonster.name)} vaincu · ${combatSummary.damageDealt} dégâts infligés · ${combatSummary.damageTaken} subis`
                  : cleanMineText(room?.description, "La Mine reste silencieuse.")}
              </p>
            </div>
          </div>

          <div className="tm-room-copy tm-room-copy-v48">
            <div className="tm-room-copy-head">
              <div>
                <p className="tm-kicker">SALLE ACTUELLE · {cleanMineText(room?.state?.toUpperCase())}</p>
                <strong>{defeatedMonster ? `🏆 ${cleanMineText(defeatedMonster.name)} vaincu` : room?.state === "cleared" ? "✓ Zone sécurisée" : "Exploration en cours"}</strong>
              </div>
              <div className="tm-room-flags">
                {room?.hostile && <span className="danger">⚔️ Hostile</span>}
                {room?.hasOre && <span>⛏️ Minerai</span>}
                {room?.hasChests && <span>📦 Coffre</span>}
                {room?.hasEvent && <span>✨ Événement</span>}
                {room?.state === "cleared" && <span className="safe">✓ Nettoyée</span>}
              </div>
            </div>

            {combatSummary ? (
              <CombatSummaryCard summary={combatSummary} />
            ) : (
              <p className="tm-room-description">{cleanMineText(room?.description, "La Mine reste silencieuse.")}</p>
            )}

            {room?.monsters?.length ? (
              <div className="tm-room-threats">
                {room.monsters.map((monster) => (
                  <span key={monster.encounterId}>{monster.boss ? "💀" : "⚔️"} {cleanMineText(monster.name)}</span>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <StatusBar snapshot={snapshot} combatActive={combatActive} onCompanion={() => setCareOpen(true)} />

      <div className="tm-lower-grid-v48">
        <section className="tm-actions-card tm-actions-card-v48">
          <div className="tm-section-head">
            <div>
              <p className="tm-kicker">INTERACTIONS</p>
              <h2>Que veux-tu faire ?</h2>
            </div>
            {combatActive && <span className="tm-danger-chip">🔒 Combat actif</span>}
          </div>

          <div className="tm-action-grid tm-action-grid-v48">
            {visibleActions.map((action) => (
              <button key={action.key} disabled={busy || combatActive} onClick={() => void doAction(action.key)}>
                <span>{action.icon}</span>
                <div><strong>{action.label}</strong><small>{action.description}</small></div>
                <b>→</b>
              </button>
            ))}

            <button disabled={busy || combatActive || snapshot.potions.length === 0} onClick={() => setPotionOpen(true)}>
              <span>🧪</span>
              <div><strong>Potions & soins</strong><small>{snapshot.potions.length ? `${snapshot.potions.length} type(s) utilisable(s)` : "Aucun soin utilisable"}</small></div>
              <b>→</b>
            </button>

            <button disabled={busy || combatActive || !snapshot.companion} onClick={() => setCareOpen(true)}>
              <span>🐾</span>
              <div><strong>Compagnon</strong><small>Nourrir, papouiller, capacités</small></div>
              <b>→</b>
            </button>
          </div>
        </section>

        <MineJournal entries={snapshot.journal ?? []} />
      </div>

      <div className="tm-bottom-actions">
        <button className="tm-refresh" disabled={busy || combatActive} onClick={() => void refresh()}>↻ Actualiser</button>
        <button className="tm-leave" disabled={busy || combatActive} onClick={() => void run(() => mineApi.leave(), "step")}>🚪 Quitter la Mine</button>
      </div>

      <PotionMenu
        open={potionOpen}
        potions={snapshot.potions}
        busy={busy}
        feedback={potionFeedback}
        onClose={() => setPotionOpen(false)}
        onUse={(id) => void run(() => mineApi.usePotion(id), "potion")}
      />

      <MineCompanionCare
        open={careOpen}
        companion={snapshot.companion}
        busy={busy}
        feedback={companionFeedback}
        onClose={() => setCareOpen(false)}
        onFeed={(foodId) => void run(() => mineApi.feedCompanion(foodId), "pet")}
        onCuddle={() => void run(() => mineApi.cuddleCompanion(), "pet")}
      />

      {snapshot.combat?.active && (
        <CombatPanel
          combat={snapshot.combat}
          busy={busy}
          onAttack={() => void run(() => mineApi.combat("attack"), "hit")}
          onDefend={() => void run(() => mineApi.combat("defend"))}
          onFlee={() => void run(() => mineApi.combat("flee"), "step")}
          onSkill={(skillId) => void run(() => mineApi.combat("skill", { skillId }), "hit")}
          onItem={(itemId) => void run(() => mineApi.combat("item", { itemId }), "potion")}
        />
      )}

      {resolutionOverlay}
    </section>
  );
}
