import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getCachedMineSnapshot, mineApi } from "../api/mineApi";
import CombatPanel from "../components/mine/CombatPanel";
import MineCompanionCare from "../components/mine/MineCompanionCare";
import MineJournal from "../components/mine/MineJournal";
import MineMap from "../components/mine/MineMap";
import MineMutationCinematic from "../components/mine/MineMutationCinematic";
import MineDestinationDialog from "../components/mine/MineDestinationDialog";
import MineEncounterIntro from "../components/mine/MineEncounterIntro";
import MinePetPortrait from "../components/mine/MinePetPortrait";
import PotionMenu from "../components/mine/PotionMenu";
import { cleanMineText } from "../data/mineText";
import type { MineEncounterSource } from "../data/mineEncounterIntros";
import { resolveMonsterImage } from "../data/monsterVisuals";
import { setMineAudioFocus } from "../services/mineAudioFocus";
import { installMutationAudioUnlock } from "../services/mineMutationAudio";
import {
  getMineAudioDebugInfo,
  getMineAudioSettings,
  installMineAudioUnlock,
  playMineSfx,
  resetMineAudioSettings,
  setMineAudioSettings,
  setMineMusic,
  type MineAudioSettings,
} from "../services/mineAudioService";
import type {
  MineCombat,
  MineDestination,
  MineCombatSummary,
  MineResult,
  MineSnapshot,
} from "../types/mine";
import type { MineMutationReveal, MineMutationState } from "../types/mine";
import "../components/mine/mineUltra.css";

// TAILBLUE_MINE_V45_KEYS_TELEPORT_20260821
// TAILBLUE_MINE_V46_FINAL_PROGRESS_ASH_20260821
// TAILBLUE_MINE_V47_LIVING_MINE_20260822
// TAILBLUE_MINE_V475_EXACT_POLISH_20260822

// TAILBLUE_MINE_ENCOUNTER_V44_20260821

// TAILBLUE_HOTFIX_V4_20260821
// TAILBLUE_HOTFIX_V43_MINE_POLISH_AUDIO_20260821

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

const MINE_ITEM_DISPLAY_NAMES: Record<string, string> = {
  mine_key: "Clé ancienne de la Mine",
};

function mineItemDisplayName(id: string) {
  return MINE_ITEM_DISPLAY_NAMES[id] || cleanMineText(id.replace(/_/g, " "));
}

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
  { key: "teleport", aliases: ["teleport"], label: "Téléportation", icon: "✨", description: "Rejoindre l'entrée ou un Refuge" },
  { key: "descend", aliases: ["descend"], label: "Descendre", icon: "🔽", description: "Atteindre l'étage suivant" },
  { key: "build_safe_zone", aliases: ["build_safe_zone", "safe_zone"], label: "Créer un refuge", icon: "🏕️", description: "Sécuriser durablement la salle" },
];

function pct(value: number, max: number) {
  return Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
}

function MineProgressMeter({
  icon,
  label,
  level,
  current,
  needed,
  detail,
  compact = false,
}: {
  icon: string;
  label: string;
  level: number;
  current: number;
  needed: number;
  detail?: string;
  compact?: boolean;
}) {
  const progress = pct(current, needed);

  return (
    <div className={`tm-mine-progress-meter ${compact ? "is-compact" : ""}`}>
      <div className="tm-mine-progress-head">
        <span>{icon}</span>
        <div>
          <small>{label}</small>
          <strong>Niveau {level}</strong>
        </div>
        <b>{current}/{needed} XP</b>
      </div>
      <div className="tm-mine-progress-track">
        <i style={{ width: `${progress}%` }} />
      </div>
      {detail && <em>{detail}</em>}
    </div>
  );
}



const MINE_RPG_HINTS = [
  "La Mine regorge de secrets passés. Revenir sur ses pas peut parfois réveiller un ancien écho.",
  "Un étage terminé n'a pas forcément livré tous ses secrets.",
  "Écoute la Mine : un changement de vent, de silence ou de lumière n'est jamais anodin.",
  "La roche garde la mémoire de tes passages.",
  "Un détour peut mener à une découverte que la route la plus directe aurait laissée dormir.",
  "Certains murs racontent plus de choses qu'une porte déjà ouverte.",
  "Un bruit lointain peut être un avertissement… ou une invitation.",
  "Les refuges ne servent pas qu'à reprendre des forces : ils sont de précieux repères dans les profondeurs.",
  "Une galerie silencieuse aujourd'hui peut raconter une toute autre histoire demain.",
  "Les embranchements oubliés récompensent souvent les exploratrices les plus curieuses.",
  "Une clé ancienne n'a jamais l'air importante… jusqu'au jour où une serrure la reconnaît.",
  "Quand la Mine semble respirer différemment, prends le temps de regarder autour de toi.",
] as const;

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
            <span key={id}>🎒 {quantity > 0 ? "+" : ""}{quantity} {mineItemDisplayName(id)}</span>
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
          <span>Exploration en cours</span>
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

  const cachedMine = getCachedMineSnapshot();
  const activeCombatRef = useRef<MineCombat | null>(cachedMine?.combat?.active ? cachedMine.combat : null);
  const [snapshot, setSnapshot] = useState<MineSnapshot | null>(cachedMine);
  const [combatResolution, setCombatResolution] = useState<MineCombat | null>(cachedMine?.combatResolution ?? null);
  const [finishingCombat, setFinishingCombat] = useState<MineCombat | null>(null);
  const [encounterIntro, setEncounterIntro] = useState<{
    combat: MineCombat;
    source: MineEncounterSource;
  } | null>(null);
  const [loading, setLoading] = useState(!cachedMine);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [potionOpen, setPotionOpen] = useState(false);
  const [potionFxToken, setPotionFxToken] = useState(0);
  const [careOpen, setCareOpen] = useState(false);
  const [entryDestinationOpen, setEntryDestinationOpen] = useState(false);
  const [teleportOpen, setTeleportOpen] = useState(false);
  const [mineHintIndex, setMineHintIndex] = useState(0);
  const [selectedCompanion, setSelectedCompanion] = useState<string>("");
  const [result, setResult] = useState<MineResult | null>(null);
  const [mutationScene, setMutationScene] = useState<{
    mode: "call" | "reveal";
    mutation: MineMutationState | MineMutationReveal;
  } | null>(null);
  const [audioSettingsOpen, setAudioSettingsOpen] = useState(false);
  const [audioSettings, setAudioSettingsState] = useState<MineAudioSettings>(
    () => getMineAudioSettings(),
  );

  const applySnapshot = useCallback((next: MineSnapshot) => {
    const hadActiveCombat = Boolean(activeCombatRef.current);

    setSnapshot(next);

    if (next.combat?.active) {
      activeCombatRef.current = next.combat;
      setFinishingCombat(null);
      setCombatResolution(null);
    } else if (next.combatResolution && hadActiveCombat) {
      const finalPresentation: MineCombat = {
        ...next.combatResolution,
        active: true,
        locked: true,
      };
      activeCombatRef.current = finalPresentation;
      setFinishingCombat(finalPresentation);
      setCombatResolution(null);
    } else if (next.combatResolution) {
      setCombatResolution(next.combatResolution);
    }

    if (next.result) setResult(next.result);
    if (next.mutationReveal) {
      setMutationScene({ mode: "reveal", mutation: next.mutationReveal });
    } else if (
      next.active
      && !next.combat?.active
      && !next.combatResolution
      && next.mutation?.showCall
    ) {
      setMutationScene((current) =>
        current ?? { mode: "call", mutation: next.mutation as MineMutationState }
      );
    }
    setError("");
  }, []);

  const refresh = useCallback(async (foreground = false) => {
    if (foreground || !getCachedMineSnapshot()) setLoading(true);
    try {
      applySnapshot(await mineApi.snapshot());
    } catch (err) {
      // Avec un snapshot réel en cache, on conserve l'expédition affichée au lieu
      // de faire recharger toute la page. L'erreur reste discrète et réessayable.
      setError(err instanceof Error ? err.message : "Impossible de synchroniser la Mine.");
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  useEffect(() => {
    void refresh(false);
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMineHintIndex((current) => (current + 1) % MINE_RPG_HINTS.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const updateAudioSettings = useCallback(
    (patch: Partial<MineAudioSettings>) => {
      setAudioSettingsState(setMineAudioSettings(patch));
    },
    [],
  );

  const restoreAudioDefaults = useCallback(() => {
    setAudioSettingsState(resetMineAudioSettings());
  }, []);

  useEffect(() => {
    const cleanupMutation = installMutationAudioUnlock();
    return cleanupMutation;
  }, []);

  useEffect(() => {
    const cleanup = installMineAudioUnlock();
    console.info("[TailBlue Mine Audio] État initial", getMineAudioDebugInfo());
    return cleanup;
  }, []);


  const combatMusicActive = Boolean(
    (snapshot?.combat?.active && !encounterIntro) || finishingCombat,
  );

  useEffect(() => {
    if (!result) return;

    if (snapshot?.combat?.active || finishingCombat || combatResolution) {
      setResult(null);
      return;
    }

    const delay = resultKind(result) === "potion" ? 1800 : 6500;
    const timer = window.setTimeout(() => {
      setResult((current) => current === result ? null : current);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [result, snapshot?.combat?.active, finishingCombat, combatResolution]);

  useEffect(() => {
    if (combatMusicActive) {
      void setMineMusic("combat");
    } else if (snapshot?.active) {
      void setMineMusic("exploration");
    } else {
      void setMineMusic("off");
    }
  }, [snapshot?.active, combatMusicActive]);

  useEffect(() => () => {
    void setMineMusic("off");
  }, []);

  const finishAnimatedCombat = useCallback((resolved: MineCombat) => {
    activeCombatRef.current = null;
    setFinishingCombat(null);
    setCombatResolution({ ...resolved, active: false, locked: false });
  }, []);

  useEffect(() => {
    if (!combatResolution) return;
    if (combatResolution.outcome === "player_victory") void playMineSfx("victory");
    else if (combatResolution.outcome === "player_defeat") void playMineSfx("defeat");
  }, [combatResolution]);

  const run = useCallback(async (
    job: () => Promise<MineSnapshot>,
    sound?: Parameters<typeof playMineSfx>[0],
    encounterSource: MineEncounterSource = "generic",
  ) => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (sound) void playMineSfx(sound);

      const hadActiveCombat = Boolean(activeCombatRef.current);
      const next = await job();
      const startsCombat = Boolean(next.combat?.active && !hadActiveCombat);

      if (startsCombat && next.combat) {
        setResult(null);
        setPotionOpen(false);
        setCareOpen(false);
        setEncounterIntro({
          combat: next.combat,
          source: encounterSource,
        });
        void playMineSfx("event");
      }

      applySnapshot(next);
    } catch (err) {
      setError(cleanMineText(err instanceof Error ? err.message : "Action impossible."));
    } finally {
      setBusy(false);
    }
  }, [applySnapshot, busy]);

  const finishMutationScene = useCallback(async () => {
    const scene = mutationScene;
    if (!scene) return;

    setMutationScene(null);
    try {
      if (scene.mode === "call") {
        applySnapshot(await mineApi.ackMutationCall());
      } else {
        // Le snapshot normal efface aussi mutationReveal du cache, afin que
        // la cinématique d'ouverture ne soit jamais rejouée en boucle.
        applySnapshot(await mineApi.snapshot());
      }
    } catch (err) {
      setError(cleanMineText(
        err instanceof Error
          ? err.message
          : "Impossible de synchroniser la Mine vivante."
      ));
    }
  }, [applySnapshot, mutationScene]);

  const useExplorationPotion = useCallback(async (id: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const next = await mineApi.usePotion(id);
      applySnapshot(next);
      void playMineSfx("potion");
      setPotionFxToken(Date.now());
      window.setTimeout(() => {
        setResult((current) => resultKind(current) === "potion" ? null : current);
      }, 1800);
    } catch (err) {
      setError(cleanMineText(err instanceof Error ? err.message : "Potion inutilisable."));
    } finally {
      setBusy(false);
    }
  }, [applySnapshot, busy]);

  const finishEncounterIntro = useCallback(() => {
    setEncounterIntro(null);
  }, []);

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
          <button onClick={() => void refresh(true)}>Réessayer</button>
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
                <p>
                  Niveau mine {snapshot.player.miningLevel} · Pioche rang {snapshot.player.pickaxeTier}
                  {snapshot.player.pickaxeNextTierLevel != null
                    ? ` · prochain rang au niv. ${snapshot.player.pickaxeNextTierLevel}`
                    : " · rang maximum"}
                </p>
              </div>
            </div>
            <div className="tm-vitals">
              <div><span>❤️ PV</span><b>{snapshot.player.hp}/{snapshot.player.maxHp}</b><div className="tm-track hp"><i style={{ width: `${pct(snapshot.player.hp, snapshot.player.maxHp)}%` }} /></div></div>
              <div><span>⚡ Fatigue</span><b>{snapshot.player.energy}/{snapshot.player.maxEnergy}</b><div className="tm-track energy"><i style={{ width: `${pct(snapshot.player.energy, snapshot.player.maxEnergy)}%` }} /></div></div>
            </div>

            <div className="tm-mine-progress-grid">
              <MineProgressMeter
                icon="⛏️"
                label="MINAGE"
                level={snapshot.player.miningLevel}
                current={snapshot.player.miningXpCurrent}
                needed={snapshot.player.miningXpNeeded}
                detail={
                  snapshot.player.pickaxeNextTierLevel != null
                    ? `Pioche R${snapshot.player.pickaxeTier} · R${snapshot.player.pickaxeNextTier} au niveau ${snapshot.player.pickaxeNextTierLevel}`
                    : `Pioche R${snapshot.player.pickaxeTier} · rang maximum`
                }
              />
              <MineProgressMeter
                icon="⚔️"
                label="COMBAT"
                level={snapshot.player.combatLevel}
                current={snapshot.player.combatXpCurrent}
                needed={snapshot.player.combatXpNeeded}
                detail={`${snapshot.player.combatXpToNext} XP avant le niveau ${snapshot.player.combatLevel + 1}`}
              />
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

        <aside className="tm-rpg-hint" key={mineHintIndex} aria-live="polite">
          <span>✦ INDICE</span>
          <p>{MINE_RPG_HINTS[mineHintIndex]}</p>
        </aside>

        <button className="tm-enter" disabled={busy} onClick={() => {
            const destinations = snapshot.entryDestinations ?? [];
            if (destinations.length <= 1) {
              const destination = destinations[0];
              void run(
                () => mineApi.enter(
                  selectedCompanion || null,
                  destination?.kind === "refuge" ? destination.floor : null,
                ),
                "step",
                "move",
              );
              return;
            }
            setEntryDestinationOpen(true);
          }}>
          <span>⛏️</span>
          <div><strong>{busy ? "Ouverture…" : "Entrer dans la Mine"}</strong><small>Choisir le point de descente</small></div>
          <b>→</b>
        </button>

        {entryDestinationOpen && (
          <MineDestinationDialog
            mode="entry"
            destinations={snapshot.entryDestinations ?? []}
            busy={busy}
            companionLabel={
              selectedPet
                ? `${cleanMineText(selectedPet.name)} · niveau ${selectedPet.level}`
                : "Expédition solo"
            }
            onClose={() => setEntryDestinationOpen(false)}
            onSelect={(destination: MineDestination) => {
              setEntryDestinationOpen(false);
              void run(
                () => mineApi.enter(
                  selectedCompanion || null,
                  destination.kind === "refuge" ? destination.floor : null,
                ),
                "step",
                "move",
              );
            }}
          />
        )}

        {resolutionOverlay}
      </section>
    );
  }

  const room = snapshot.room;
  const combatActive = Boolean(snapshot.combat?.active || finishingCombat);
  const combatForPlay = snapshot.combat?.active ? snapshot.combat : finishingCombat;
  const visibleActions = ACTIONS.filter((item) => item.aliases.some((alias) => allowed.has(alias)));
  const defeatedMonster = room?.defeatedMonsters?.slice(-1)[0];
  const defeatedImage = defeatedMonster ? resolveMonsterImage(defeatedMonster) : undefined;
  const combatSummary = defeatedMonster?.combatSummary ?? null;

  const companionFeedback = resultKind(result) === "companion" ? result : null;
  const potionFeedback = resultKind(result) === "potion" ? result : null;

  const encounterSourceForAction = (action: string): MineEncounterSource => {
    if (action === "search") return "search";
    if (action === "resolve_event" || action === "event") return "examine";
    return "generic";
  };

  const doAction = (action: string) =>
    run(
      () => mineApi.action(action),
      actionSound(action),
      encounterSourceForAction(action),
    );

  return (
    <section className="tm-page tm-page-v48">
      {mutationScene && (
        <MineMutationCinematic
          mode={mutationScene.mode}
          mutation={mutationScene.mutation}
          onComplete={() => void finishMutationScene()}
        />
      )}
      {/* Header volontairement compact : on garde l'identité Mine sans manger 170px. */}
      <header className="tm-mine-topbar">
        <div>
          <p className="tm-kicker">L'ABÎME DE TAILBLUE</p>
          <div className="tm-topbar-progression" aria-label="Progression de la Mine">
            <span className="tm-topbar-progress-item">
              <b>⛏️ Mine niv. {snapshot.player.miningLevel}</b>
              <i><em style={{ width: `${pct(snapshot.player.miningXpCurrent, snapshot.player.miningXpNeeded)}%` }} /></i>
            </span>
            <span className="tm-topbar-pickaxe">🪓 Pioche R{snapshot.player.pickaxeTier}</span>
            <span className="tm-topbar-progress-item">
              <b>⚔️ Combat niv. {snapshot.player.combatLevel}</b>
              <i><em style={{ width: `${pct(snapshot.player.combatXpCurrent, snapshot.player.combatXpNeeded)}%` }} /></i>
            </span>
          </div>
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
      {result &&
        resultKind(result) !== "potion" &&
        !snapshot.combat?.active &&
        !finishingCombat &&
        !combatResolution &&
        createPortal(
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

      <button
        type="button"
        className="tm-mine-audio-settings-button"
        onClick={() => {
          setAudioSettingsState(getMineAudioSettings());
          setAudioSettingsOpen(true);
        }}
      >
        <span>🎚️</span>
        <strong>Régler son de la mine</strong>
      </button>

      {audioSettingsOpen && createPortal(
        <div className="tm-audio-mixer-overlay" onMouseDown={() => setAudioSettingsOpen(false)}>
          <section
            className="tm-audio-mixer"
            role="dialog"
            aria-modal="true"
            aria-label="Réglages audio de la Mine"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="tm-audio-mixer-head">
              <div>
                <p className="tm-kicker">AUDIO · MINE</p>
                <h2>Régler le son de la Mine</h2>
                <p>Chaque ambiance et chaque famille de bruitages peut être réglée séparément.</p>
              </div>
              <button type="button" onClick={() => setAudioSettingsOpen(false)} aria-label="Fermer">×</button>
            </header>

            <div className="tm-audio-master">
              <div>
                <span>🔊</span>
                <div><strong>Son de la Mine</strong><small>Coupe ou réactive tout l'audio de la Mine.</small></div>
              </div>
              <button
                type="button"
                className={audioSettings.enabled ? "is-on" : ""}
                onClick={() => updateAudioSettings({ enabled: !audioSettings.enabled })}
              >
                {audioSettings.enabled ? "ACTIVÉ" : "COUPÉ"}
              </button>
            </div>

            <div className={`tm-audio-sections ${audioSettings.enabled ? "" : "is-disabled"}`}>
              <article className="tm-audio-channel">
                <div className="tm-audio-channel-title">
                  <div><span>🧭</span><div><strong>Musique d'exploration</strong><small>mine-exploration.mp3</small></div></div>
                  <button
                    type="button"
                    className={audioSettings.explorationMusicEnabled ? "is-on" : ""}
                    onClick={() => updateAudioSettings({
                      explorationMusicEnabled: !audioSettings.explorationMusicEnabled,
                    })}
                  >
                    {audioSettings.explorationMusicEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <label>
                  <span>Volume <b>{Math.round(audioSettings.explorationMusicVolume * 100)}%</b></span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(audioSettings.explorationMusicVolume * 100)}
                    onChange={(event) => updateAudioSettings({
                      explorationMusicVolume: Number(event.currentTarget.value) / 100,
                    })}
                  />
                </label>
              </article>

              <article className="tm-audio-channel">
                <div className="tm-audio-channel-title">
                  <div><span>⚔️</span><div><strong>Musique de combat</strong><small>mine-combat.mp3</small></div></div>
                  <button
                    type="button"
                    className={audioSettings.combatMusicEnabled ? "is-on" : ""}
                    onClick={() => updateAudioSettings({
                      combatMusicEnabled: !audioSettings.combatMusicEnabled,
                    })}
                  >
                    {audioSettings.combatMusicEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <label>
                  <span>Volume <b>{Math.round(audioSettings.combatMusicVolume * 100)}%</b></span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(audioSettings.combatMusicVolume * 100)}
                    onChange={(event) => updateAudioSettings({
                      combatMusicVolume: Number(event.currentTarget.value) / 100,
                    })}
                  />
                </label>
              </article>

              <article className="tm-audio-channel">
                <div className="tm-audio-channel-title">
                  <div><span>⛏️</span><div><strong>VFX d'exploration</strong><small>pas, minage, fouille, coffre, potion…</small></div></div>
                  <button
                    type="button"
                    className={audioSettings.explorationSfxEnabled ? "is-on" : ""}
                    onClick={() => updateAudioSettings({
                      explorationSfxEnabled: !audioSettings.explorationSfxEnabled,
                    })}
                  >
                    {audioSettings.explorationSfxEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <label>
                  <span>Volume <b>{Math.round(audioSettings.explorationSfxVolume * 100)}%</b></span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(audioSettings.explorationSfxVolume * 100)}
                    onChange={(event) => updateAudioSettings({
                      explorationSfxVolume: Number(event.currentTarget.value) / 100,
                    })}
                  />
                </label>
              </article>

              <article className="tm-audio-channel">
                <div className="tm-audio-channel-title">
                  <div><span>💥</span><div><strong>VFX de combat</strong><small>impacts, dégâts, compagnon, victoire…</small></div></div>
                  <button
                    type="button"
                    className={audioSettings.combatSfxEnabled ? "is-on" : ""}
                    onClick={() => updateAudioSettings({
                      combatSfxEnabled: !audioSettings.combatSfxEnabled,
                    })}
                  >
                    {audioSettings.combatSfxEnabled ? "ON" : "OFF"}
                  </button>
                </div>
                <label>
                  <span>Volume <b>{Math.round(audioSettings.combatSfxVolume * 100)}%</b></span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round(audioSettings.combatSfxVolume * 100)}
                    onChange={(event) => updateAudioSettings({
                      combatSfxVolume: Number(event.currentTarget.value) / 100,
                    })}
                  />
                </label>
              </article>
            </div>

            <footer className="tm-audio-mixer-footer">
              <button type="button" onClick={restoreAudioDefaults}>↺ Valeurs par défaut</button>
              <span>Réglages enregistrés automatiquement sur cet appareil.</span>
              <button type="button" className="primary" onClick={() => setAudioSettingsOpen(false)}>Terminé</button>
            </footer>
          </section>
        </div>,
        document.body,
      )}

      <div className="tm-explore-grid tm-explore-grid-v48">
        <MineMap
          map={snapshot.map}
          exits={snapshot.exits}
          disabled={busy || combatActive}
          onMove={(direction) =>
            void run(
              () => mineApi.action("move", { direction }),
              "step",
              "move",
            )
          }
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
            {snapshot.mutation?.canReveal && !combatActive && (
              <button
                className="tm-mutation-reveal-action"
                disabled={busy}
                onClick={() => void run(() => mineApi.revealMutation(), "event")}
              >
                <span>🪨</span>
                <div>
                  <strong>Forcer le passage</strong>
                  <small>Quelque chose existe derrière cette paroi…</small>
                </div>
                <b>✦</b>
              </button>
            )}

            {visibleActions.map((action) => (
              <button key={action.key} disabled={busy || combatActive} onClick={() => {
                if (action.key === "teleport") {
                  setTeleportOpen(true);
                  return;
                }
                void doAction(action.key);
              }}>
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
        <button className="tm-refresh" disabled={busy || combatActive} onClick={() => void refresh(true)}>↻ Actualiser</button>
        <button className="tm-leave" disabled={busy || combatActive} onClick={() => void run(() => mineApi.leave(), "step")}>🚪 Quitter la Mine</button>
      </div>

      <PotionMenu
        open={potionOpen}
        potions={snapshot.potions}
        busy={busy}
        feedback={potionFeedback}
        fxToken={potionFxToken}
        onClose={() => {
          setPotionOpen(false);
          setResult((current) => resultKind(current) === "potion" ? null : current);
        }}
        onUse={(id) => void useExplorationPotion(id)}
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

      {combatForPlay && !encounterIntro && (
        <CombatPanel
          combat={combatForPlay}
          busy={busy}
          onSequenceComplete={finishAnimatedCombat}
          onAttack={() => run(() => mineApi.combat("attack"))}
          onDefend={() => run(() => mineApi.combat("defend"))}
          onFlee={() => run(() => mineApi.combat("flee"), "step")}
          onSkill={(skillId) => run(() => mineApi.combat("skill", { skillId }))}
          onItem={(itemId) => run(() => mineApi.combat("item", { itemId }))}
        />
      )}

      {teleportOpen && (
        <MineDestinationDialog
          mode="teleport"
          destinations={snapshot.teleportDestinations ?? []}
          busy={busy}
          onClose={() => setTeleportOpen(false)}
          onSelect={(destination: MineDestination) => {
            setTeleportOpen(false);
            void run(
              () => mineApi.teleport(destination.floor),
              "step",
              "generic",
            );
          }}
        />
      )}

      {encounterIntro && (
        <MineEncounterIntro
          combat={encounterIntro.combat}
          source={encounterIntro.source}
          onComplete={finishEncounterIntro}
        />
      )}

      {resolutionOverlay}
    </section>
  );
}
