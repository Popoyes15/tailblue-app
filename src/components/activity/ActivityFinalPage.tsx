import { useEffect, useMemo, useState } from "react";
import { activityApi, activityApiConfigured } from "../../api/activityApi";
import {
  ACTIVITY_META,
  makePreviewEvent,
  makePreviewSnapshot,
} from "../../data/tailblueActivities";
import type {
  ActivityChoiceDto,
  ActivityKind,
  ActivityResultDto,
  ActivitySnapshotDto,
} from "../../types/activity";
import "./activityFinal.css";
import "./activityResultReadability.css";

type LoadState = "loading" | "ready" | "working" | "error";

interface ActivityFinalPageProps {
  activity: ActivityKind;
}

export default function ActivityFinalPage({
  activity,
}: ActivityFinalPageProps) {
  const meta = ACTIVITY_META[activity];

  const [snapshot, setSnapshot] = useState<ActivitySnapshotDto>(() =>
    makePreviewSnapshot(activity),
  );
  const [loadState, setLoadState] = useState<LoadState>(
    activityApiConfigured ? "loading" : "ready",
  );
  const [error, setError] = useState("");
  const [previewEventVisible, setPreviewEventVisible] = useState(false);
  const [previewChoiceId, setPreviewChoiceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setSnapshot(makePreviewSnapshot(activity));
    setPreviewEventVisible(false);
    setPreviewChoiceId(null);
    setError("");

    if (!activityApiConfigured) {
      setLoadState("ready");
      return () => {
        cancelled = true;
      };
    }

    setLoadState("loading");

    activityApi
      .getSnapshot(activity)
      .then((data) => {
        if (cancelled) return;
        setSnapshot(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger l’activité TailBlue.",
        );
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [activity]);

  const currentEvent = useMemo(() => {
    if (snapshot.currentEvent) return snapshot.currentEvent;
    if (!activityApiConfigured && previewEventVisible) {
      return makePreviewEvent(activity);
    }
    return null;
  }, [activity, previewEventVisible, snapshot.currentEvent]);

  const cooldownLabel = formatCooldown(snapshot.cooldownRemainingSeconds);
  const stats = snapshot.stats ?? {};
  const job = snapshot.job;

  async function startActivity() {
    setError("");
    setPreviewChoiceId(null);

    if (!activityApiConfigured) {
      setPreviewEventVisible(true);
      return;
    }

    try {
      setLoadState("working");
      const next = await activityApi.start(activity);
      setSnapshot(next);
      setLoadState("ready");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer cette activité.",
      );
      setLoadState("error");
    }
  }

  async function choose(choice: ActivityChoiceDto) {
    if (!currentEvent) return;

    if (!activityApiConfigured) {
      setPreviewChoiceId(choice.id);
      return;
    }

    try {
      setLoadState("working");

      const response = await activityApi.resolveChoice(
        activity,
        currentEvent.id,
        choice.id,
      );

      setSnapshot({
        ...response.snapshot,
        lastResult: response.result,
      });
      setLoadState("ready");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de résoudre ce choix.",
      );
      setLoadState("error");
    }
  }

  function resetPreview() {
    setPreviewEventVisible(false);
    setPreviewChoiceId(null);
  }

  return (
    <section className={`tb-activity-page tb-${activity}`}>
      <header className="tb-activity-header">
        <div>
          <p className="tb-activity-eyebrow">
            {meta.icon} {meta.eyebrow}
          </p>
          <h1>{meta.title}</h1>
          <p className="tb-activity-subtitle">{meta.subtitle}</p>
        </div>

        <div className="tb-activity-header-badges">
          <span className="tb-source-badge">
            <i className="tb-source-dot" />
            {activityApiConfigured ? "Backend TailBlue" : "Aperçu local"}
          </span>
          <span className="tb-count-badge">
            {meta.totalEvents} événements
          </span>
        </div>
      </header>

      {error && (
        <div className="tb-activity-alert">
          <span>⚠️</span>
          <div>
            <strong>TailBlue n’a pas pu charger l’activité.</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="tb-activity-status-grid">
        <StatusCard
          icon={activity === "work" ? job?.emoji ?? "💼" : "🏹"}
          label={activity === "work" ? "Métier actuel" : "Expédition"}
          value={
            activity === "work"
              ? job?.name ?? "Métier envoyé par TailBlue"
              : snapshot.ready
                ? "Prête à partir"
                : "Repos en cours"
          }
          hint={
            activity === "work" && job
              ? job.requiredLevel >= 9999
                ? "Privilège royal"
                : `Accessible dès le niveau ${job.requiredLevel}`
              : "Événement tiré par hunt_events.py"
          }
        />

        <StatusCard
          icon="⏳"
          label="Repos"
          value={
            snapshot.cooldownRemainingSeconds > 0
              ? cooldownLabel
              : "Disponible"
          }
          hint={`Base : ${snapshot.cooldownMinutes || meta.baseCooldownMinutes} min • maison/compagnons appliqués côté Python`}
          accent={snapshot.cooldownRemainingSeconds > 0 ? "warning" : "success"}
        />

        <StatusCard
          icon="🏰"
          label="Coût de l’activité"
          value={
            snapshot.guild?.payer === "guild"
              ? `${snapshot.guild.cost} cookies`
              : snapshot.guild?.payer === "independent"
                ? "Gratuit"
                : "Calculé par TailBlue"
          }
          hint={
            snapshot.guild?.payer === "guild"
              ? snapshot.guild.name
                ? `Payé par ${snapshot.guild.name}`
                : "Payé par le trésor de guilde"
              : snapshot.guild?.payer === "independent"
                ? "Activité indépendante"
                : "65 cookies si la guilde paie • sinon activité gratuite"
          }
        />

        <StatusCard
          icon="🥚"
          label="Œuf des Origines"
          value={`${snapshot.eggProgress?.current ?? 0}/${snapshot.eggProgress?.target ?? meta.eggTarget}`}
          hint={
            activity === "work"
              ? "Un Work valide fait progresser l’incubation."
              : "Un Hunt valide fait progresser l’incubation."
          }
        />
      </div>

      <div className="tb-activity-main-grid">
        <main className="tb-activity-stage">
          {!currentEvent ? (
            snapshot.lastResult ? null : (
            <div className="tb-activity-ready">
              <div className="tb-ready-orb">
                <span>{meta.icon}</span>
              </div>

              <p className="tb-mini-label">
                {snapshot.ready ? "ACTIVITÉ DISPONIBLE" : "REPOS NÉCESSAIRE"}
              </p>

              <h2>
                {activity === "work"
                  ? "Une nouvelle journée t’attend."
                  : "Le Royaume s’étend au-delà des remparts."}
              </h2>

              <p>
                {activityApiConfigured
                  ? activity === "work"
                    ? "TailBlue tirera un véritable événement lié à ton métier et à tes compagnons."
                    : "TailBlue tirera un véritable événement de chasse. Observe la situation puis choisis ta réaction."
                  : "Le backend n’est pas encore connecté. Tu peux quand même prévisualiser exactement l’interface finale des événements."}
              </p>

              <button
                className="tb-activity-primary"
                onClick={startActivity}
                disabled={
                  loadState === "working" ||
                  loadState === "loading" ||
                  (activityApiConfigured && !snapshot.ready)
                }
              >
                <span>{meta.icon}</span>
                {loadState === "working"
                  ? "TailBlue prépare l’événement…"
                  : activityApiConfigured
                    ? activity === "work"
                      ? "Commencer le Work"
                      : "Partir en Hunt"
                    : "Prévisualiser l’événement"}
              </button>

              {!activityApiConfigured && (
                <small className="tb-preview-note">
                  Mode local : aucune récompense ni statistique n’est modifiée.
                </small>
              )}
            </div>
            )
          ) : (
            <EventPanel
              activity={activity}
              event={currentEvent}
              disabled={loadState === "working"}
              preview={!activityApiConfigured}
              selectedPreviewChoiceId={previewChoiceId}
              onChoose={choose}
              onResetPreview={resetPreview}
            />
          )}

          {snapshot.lastResult && (
            <ResultPanel
              activity={activity}
              result={snapshot.lastResult}
            />
          )}

          {!activityApiConfigured && previewChoiceId && (
            <div className="tb-preview-result">
              <div className="tb-preview-result-icon">✨</div>
              <div>
                <p className="tb-mini-label">APERÇU DU RÉSULTAT</p>
                <h3>La présentation finale est prête.</h3>
                <p>
                  Ici TailBlue affichera le vrai résultat renvoyé par Python :
                  récit, cookies, XP, réputation, bonus, loot, compagnons et
                  progression de l’Œuf. Aucune valeur n’est inventée pendant
                  le mode local.
                </p>
              </div>
            </div>
          )}
        </main>

        <aside className="tb-activity-side">
          {activity === "work" ? (
            <WorkInfluencePanel snapshot={snapshot} />
          ) : (
            <HuntInfluencePanel snapshot={snapshot} />
          )}

          <CompanionPanel snapshot={snapshot} />

          <StatsPanel
            activity={activity}
            count={stats.count}
            cookies={stats.cookies}
            xp={stats.xp}
            failures={stats.failures}
          />
        </aside>
      </div>
    </section>
  );
}

function cleanActivityPromptText(value: string) {
  return String(value ?? "")
    .replace(/<@!?247052020358447104>/g, "Hime-sama")
    .replace(/<@!?\d+>/g, "un aventurier")
    .replace(/\*\*/g, "")
    .replace(/__(.*?)__/g, "$1")
    .replace(/(?:_{6,}|━{6,}|─{6,}|—{6,})/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function activityPromptLines(value: string) {
  const clean = cleanActivityPromptText(value);
  if (!clean) return [];

  // Les événements Discord utilisent souvent un long séparateur avant
  // la question finale. Une fois nettoyé, on garde chaque morceau comme
  // vrai paragraphe afin que l'app soit lisible sans afficher le Markdown.
  const lines = clean
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Certains anciens événements n'ont pas de vrai saut de ligne avant la
  // question. On isole les formulations les plus courantes sans changer
  // le texte canonique du bot.
  if (lines.length === 1) {
    const single = lines[0];
    const match = single.match(
      /^(.*?)(\s+(?:Quelle|Quel|Que|Comment|Laquelle|Lequel)\b[^?]*\?)\s*$/iu,
    );
    if (match && match[1].trim()) {
      return [match[1].trim(), match[2].trim()];
    }
  }

  return lines;
}

function isActivityQuestion(line: string) {
  return /^(?:Quelle|Quel|Que|Comment|Laquelle|Lequel)\b.*\?$/iu.test(
    line.trim(),
  );
}

function EventPanel({
  activity,
  event,
  disabled,
  preview,
  selectedPreviewChoiceId,
  onChoose,
  onResetPreview,
}: {
  activity: ActivityKind;
  event: NonNullable<ActivitySnapshotDto["currentEvent"]>;
  disabled: boolean;
  preview: boolean;
  selectedPreviewChoiceId: string | null;
  onChoose: (choice: ActivityChoiceDto) => void;
  onResetPreview: () => void;
}) {
  return (
    <article className="tb-event-panel">
      <div className="tb-event-topline">
        <div>
          <p className="tb-mini-label">
            {activity === "work"
              ? "ÉVÉNEMENT DE TRAVAIL"
              : "ÉVÉNEMENT DE CHASSE"}
          </p>
          <h2>{event.title}</h2>
        </div>
        <span className="tb-event-live">
          {preview ? "APERÇU UI" : "EN COURS"}
        </span>
      </div>

      <div className="tb-event-story">
        <div className="tb-story-mark">“</div>
        <div className="tb-event-story-copy">
          {activityPromptLines(event.description).map((line, index) => (
            <p
              key={`${index}-${line.slice(0, 28)}`}
              className={
                isActivityQuestion(line)
                  ? "tb-event-story-question"
                  : undefined
              }
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      <div className="tb-event-choice-heading">
        <div>
          <p className="tb-mini-label">TA DÉCISION</p>
          <h3>Que fais-tu ?</h3>
        </div>
        <span>
          {activity === "hunt"
            ? "Aucun choix n’est toujours le bon."
            : "Les choix changent à chaque partie."}
        </span>
      </div>

      <div className="tb-event-choices">
        {event.choices.map((choice, index) => (
          <button
            key={choice.id}
            className={`tb-choice-card ${
              selectedPreviewChoiceId === choice.id ? "is-selected" : ""
            }`}
            onClick={() => onChoose(choice)}
            disabled={disabled || Boolean(selectedPreviewChoiceId)}
          >
            <div className="tb-choice-number">
              {choice.emoji ?? index + 1}
            </div>
            <div>
              <strong>{cleanActivityPromptText(choice.label)}</strong>
              {choice.description && (
                <p>{cleanActivityPromptText(choice.description)}</p>
              )}
            </div>
            <span className="tb-choice-arrow">→</span>
          </button>
        ))}
      </div>

      {preview && (
        <button className="tb-preview-reset" onClick={onResetPreview}>
          ↺ Revenir à l’écran de départ
        </button>
      )}
    </article>
  );
}

function WorkInfluencePanel({
  snapshot,
}: {
  snapshot: ActivitySnapshotDto;
}) {
  const job = snapshot.job;

  return (
    <article className="tb-side-card">
      <div className="tb-side-card-title">
        <span>💼</span>
        <div>
          <p className="tb-mini-label">WORK</p>
          <h3>Ce qui influence le résultat</h3>
        </div>
      </div>

      {job &&
        job.cookiesMin != null &&
        job.cookiesMax != null &&
        job.xpMin != null &&
        job.xpMax != null && (
          <div className="tb-base-reward">
            <div>
              <small>Base métier</small>
              <strong>
                🍪 {job.cookiesMin}–{job.cookiesMax}
              </strong>
            </div>
            <div>
              <small>XP de base</small>
              <strong>
                ✨ {job.xpMin}–{job.xpMax}
              </strong>
            </div>
          </div>
        )}

      <InfoLine
        icon="🎲"
        title="Choix de l’événement"
        text="Peut modifier cookies, XP, réputation et chance de loot."
      />
      <InfoLine
        icon="🐾"
        title="Compagnons"
        text="Bonus de Work, progression et effets du familier actif."
      />
      <InfoLine
        icon="🏠"
        title="Résidence"
        text="Les bonus ou malus de maison sont appliqués par Python."
      />
      <InfoLine
        icon="🌸"
        title="Faveur du Daily"
        text="Si un boost actif concerne Work, il est appliqué au résultat."
      />
      <InfoLine
        icon="💍"
        title="Mariage"
        text="Les bonus d’activité du mariage sont calculés côté TailBlue."
      />
      <InfoLine
        icon="🦊"
        title="Événement de Taiga"
        text="Peut se déclencher si les conditions réelles sont remplies."
      />

      <DynamicBonuses bonuses={snapshot.bonuses} />
    </article>
  );
}

function HuntInfluencePanel({
  snapshot,
}: {
  snapshot: ActivitySnapshotDto;
}) {
  const jobId = snapshot.job?.id;

  return (
    <article className="tb-side-card">
      <div className="tb-side-card-title">
        <span>🏹</span>
        <div>
          <p className="tb-mini-label">HUNT</p>
          <h3>Ce qui influence l’expédition</h3>
        </div>
      </div>

      {jobId === "chasseur" && (
        <div className="tb-special-bonus">
          <span>🏹</span>
          <div>
            <strong>Bonus Chasseur</strong>
            <p>+25 cookies sur le Hunt.</p>
          </div>
        </div>
      )}

      {jobId === "chevalier" && (
        <div className="tb-special-bonus">
          <span>⚔️</span>
          <div>
            <strong>Bonus Chevalier</strong>
            <p>+25 XP sur le Hunt.</p>
          </div>
        </div>
      )}

      <InfoLine
        icon="🎲"
        title="Choix de l’événement"
        text="Le multiplicateur du choix agit avant les bonus de maison et du Daily."
      />
      <InfoLine
        icon="🐺"
        title="Compagnons"
        text="Bonus de chasse, XP des compagnons et éventuels effets spéciaux."
      />
      <InfoLine
        icon="🏠"
        title="Résidence"
        text="Les effets de maison modifient ensuite les gains."
      />
      <InfoLine
        icon="🌸"
        title="Faveur du Daily"
        text="Un boost compatible Hunt peut augmenter cookies et/ou XP."
      />
      <InfoLine
        icon="💍"
        title="Mariage"
        text="Le bonus d’activité est calculé par le moteur réel."
      />
      <InfoLine
        icon="🎒"
        title="Butin"
        text="Loot rare, matériaux de craft et éventuel loot de métier."
      />
      <InfoLine
        icon="🦊"
        title="Événement de Taiga"
        text="Peut ajouter cookies, XP ou réputation selon le vrai tirage."
      />

      <DynamicBonuses bonuses={snapshot.bonuses} />
    </article>
  );
}

function CompanionPanel({
  snapshot,
}: {
  snapshot: ActivitySnapshotDto;
}) {
  const pets = snapshot.activePets ?? [];

  return (
    <article className="tb-side-card tb-companion-card">
      <div className="tb-side-card-title">
        <span>🐾</span>
        <div>
          <p className="tb-mini-label">COMPAGNONS</p>
          <h3>Équipe active</h3>
        </div>
      </div>

      {pets.length === 0 ? (
        <div className="tb-empty-side">
          <span>🐾</span>
          <p>
            {activityApiConfigured
              ? "Aucun compagnon actif renvoyé par TailBlue."
              : "Les vrais compagnons actifs apparaîtront ici après connexion au backend."}
          </p>
        </div>
      ) : (
        <div className="tb-pet-list">
          {pets.map((pet) => (
            <div className="tb-pet-row" key={pet.id}>
              <div className="tb-pet-avatar">
                {pet.image ? (
                  <img src={pet.image} alt={pet.name} />
                ) : (
                  <span>{pet.emoji ?? "🐾"}</span>
                )}
              </div>
              <div>
                <strong>{pet.name}</strong>
                <small>
                  {pet.level ? `Niveau ${pet.level}` : "Compagnon actif"}
                </small>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function StatsPanel({
  activity,
  count,
  cookies,
  xp,
  failures,
}: {
  activity: ActivityKind;
  count?: number;
  cookies?: number;
  xp?: number;
  failures?: number;
}) {
  return (
    <article className="tb-side-card">
      <div className="tb-side-card-title">
        <span>📊</span>
        <div>
          <p className="tb-mini-label">JOURNAL</p>
          <h3>Historique de l’activité</h3>
        </div>
      </div>

      <div className="tb-stat-list">
        <MiniStat
          label={activity === "work" ? "Travaux" : "Chasses"}
          value={formatNullableNumber(count)}
        />
        <MiniStat
          label="Cookies gagnés"
          value={formatNullableNumber(cookies)}
        />
        <MiniStat
          label="XP gagnée"
          value={formatNullableNumber(xp)}
        />
        {activity === "work" && (
          <MiniStat
            label="Échecs"
            value={formatNullableNumber(failures)}
          />
        )}
      </div>

      {!activityApiConfigured && (
        <p className="tb-data-note">
          Les statistiques restent volontairement à « — » en mode local :
          elles viendront du vrai profil joueur.
        </p>
      )}
    </article>
  );
}

function cleanDiscordResultText(value: string) {
  return String(value ?? "")
    .replace(/<@!?247052020358447104>/g, "Hime-sama")
    .replace(/<@!?\d+>/g, "un aventurier")
    .replace(/\*\*/g, "")
    .replace(/_{8,}/g, "\n")
    .replace(/\s+🏰\s+/g, "\n🏰 ")
    .replace(/\s+🎁\s+/g, "\n🎁 ")
    .replace(/\s+🏠\s+/g, "\n🏠 ")
    .replace(/\s+🛋️?\s+/g, "\n🛋️ ")
    .replace(/\s+🛠️?\s+/g, "\n🛠️ ")
    .replace(/\s+🎒\s+/g, "\n🎒 ")
    .replace(/\s+✨\s+BONUS/g, "\n✨ BONUS")
    .replace(/\s+🌟\s+/g, "\n🌟 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function resultNarrativeLines(value: string, title: string) {
  let clean = cleanDiscordResultText(value);
  const cleanTitle = cleanDiscordResultText(title).trim();

  if (cleanTitle && clean.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
    clean = clean.slice(cleanTitle.length).replace(/^\s*[!—:•-]*\s*/, "");
  }

  return clean
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function isResultDetailLine(line: string) {
  return /^(🏰|🎁|🏠|🛋️|🛠️|🎒|✨ BONUS|🌟)/u.test(line);
}


type ActivitySpecialEventDto = {
  id: string;
  kind: string;
  icon?: string;
  label?: string;
  title?: string;
  narrative: string;
};

function specialEventNarrativeLines(value: string, title?: string) {
  let clean = cleanDiscordResultText(value);
  const cleanTitle = cleanDiscordResultText(title ?? "").trim();

  if (cleanTitle && clean.toLowerCase().startsWith(cleanTitle.toLowerCase())) {
    clean = clean.slice(cleanTitle.length).replace(/^\s*[!—:•-]*\s*/, "");
  }

  return clean
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function SpecialActivityEventCard({
  event,
}: {
  event: ActivitySpecialEventDto;
}) {
  return (
    <section className={`tb-special-activity-event is-${event.kind || "special"}`}>
      <div className="tb-special-event-icon" aria-hidden="true">
        {event.icon ?? "✨"}
      </div>

      <div className="tb-special-event-body">
        <p className="tb-mini-label">{event.label ?? "ÉVÉNEMENT SPÉCIAL"}</p>
        <h3>{cleanDiscordResultText(event.title ?? "Événement spécial")}</h3>

        <div className="tb-special-event-story">
          {specialEventNarrativeLines(event.narrative, event.title).map(
            (line, index) => (
              <p key={`${event.id}-${index}-${line.slice(0, 18)}`}>{line}</p>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function ResultPanel({
  activity,
  result,
}: {
  activity: ActivityKind;
  result: ActivityResultDto;
}) {
  const specialEvents =
    (
      result as ActivityResultDto & {
        specialEvents?: ActivitySpecialEventDto[];
      }
    ).specialEvents ?? [];

  return (
    <article
      className={`tb-result-panel ${
        result.success ? "is-success" : "is-failure"
      }`}
    >
      <div className="tb-result-heading">
        <span>{result.success ? "✨" : "🌘"}</span>
        <div>
          <p className="tb-mini-label">
            {activity === "work" ? "WORK TERMINÉ" : "HUNT TERMINÉ"}
          </p>
          <h2>{result.title}</h2>
        </div>
      </div>

      <div className="tb-result-narrative">
        {resultNarrativeLines(result.narrative, result.title).map(
          (line, index) => (
            <p
              key={`${index}-${line.slice(0, 24)}`}
              className={
                isResultDetailLine(line)
                  ? "tb-result-narrative-line is-detail"
                  : "tb-result-narrative-line"
              }
            >
              {line}
            </p>
          ),
        )}
      </div>

      {specialEvents.length > 0 && (
        <div className="tb-special-events-list">
          {specialEvents.map((event) => (
            <SpecialActivityEventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      <div className="tb-result-rewards">
        <RewardPill icon="🍪" label="Cookies" value={`${result.cookies >= 0 ? "+" : ""}${result.cookies}`} />
        <RewardPill icon="✨" label="XP" value={`${result.xp >= 0 ? "+" : ""}${result.xp}`} />
        <RewardPill
          icon="👑"
          label="Réputation"
          value={`${result.reputation >= 0 ? "+" : ""}${result.reputation}`}
        />
      </div>

      {result.loot && result.loot.length > 0 && (
        <div className="tb-result-loot">
          <div className="tb-result-loot-heading">
            <p className="tb-mini-label">BUTIN AJOUTÉ À TES INVENTAIRES</p>
            <strong>{result.loot.length} type(s) d'objet obtenu(s)</strong>
          </div>
          <div className="tb-result-loot-grid">
            {result.loot.map((loot, index) => (
              <article
                className="tb-result-loot-card"
                key={`${loot.id ?? loot.name}-${index}`}
              >
                <span className="tb-result-loot-icon">🎁</span>
                <div>
                  <strong>{loot.name}</strong>
                  <small>Quantité obtenue</small>
                </div>
                <b>×{loot.quantity}</b>
              </article>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function StatusCard({
  icon,
  label,
  value,
  hint,
  accent = "default",
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
  accent?: "default" | "success" | "warning";
}) {
  return (
    <article className={`tb-status-card is-${accent}`}>
      <div className="tb-status-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{hint}</p>
      </div>
    </article>
  );
}

function InfoLine({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="tb-info-line">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function DynamicBonuses({
  bonuses,
}: {
  bonuses?: ActivitySnapshotDto["bonuses"];
}) {
  if (!bonuses?.length) return null;

  return (
    <div className="tb-dynamic-bonuses">
      <p className="tb-mini-label">BONUS ACTIFS</p>
      {bonuses.map((bonus) => (
        <div key={bonus.id}>
          <span>{bonus.icon ?? "✨"}</span>
          <div>
            <strong>
              {bonus.label}
              {bonus.value ? ` • ${bonus.value}` : ""}
            </strong>
            {bonus.description && <p>{bonus.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="tb-mini-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RewardPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="tb-reward-pill">
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function formatNullableNumber(value?: number) {
  if (value == null) return "—";
  return new Intl.NumberFormat("fr-CH").format(value);
}

function formatCooldown(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;

  if (minutes <= 0) return `${rest}s`;
  return `${minutes}m ${String(rest).padStart(2, "0")}s`;
}
