import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  mutationCinematic,
  mutationThemeWhisper,
} from "../../data/mineMutationCinematics";
import { playMutationAudio } from "../../services/mineMutationAudio";
import type {
  MineMutationReveal,
  MineMutationState,
} from "../../types/mine";
import "./mineMutation.css";

type Props = {
  mode: "call" | "reveal";
  mutation: MineMutationState | MineMutationReveal;
  onComplete: () => void;
};

function directionText(value?: string | null) {
  return value || "les profondeurs";
}

function visualParticles(count: number, className: string) {
  return Array.from({ length: count }, (_, index) => (
    <i
      key={`${className}-${index}`}
      className={className}
      style={{
        left: `${(index * 37 + 11) % 100}%`,
        top: `${(index * 53 + 7) % 100}%`,
        animationDelay: `${(index % 8) * 0.11}s`,
        animationDuration: `${1.8 + (index % 5) * 0.31}s`,
      }}
    />
  ));
}

export default function MineMutationCinematic({ mode, mutation, onComplete }: Props) {
  const signatureId = Math.max(1, Number(mutation.signatureId || 1));
  const definition = useMemo(() => mutationCinematic(signatureId), [signatureId]);
  const direction = String(mutation.direction || "east");
  const directionLabel = directionText(mutation.directionLabel);
  const [phase, setPhase] = useState(0);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    completedRef.current = false;
    document.body.classList.add("tm-mutation-lock");
    void playMutationAudio(signatureId, direction, mode);

    const timers = [
      window.setTimeout(() => setPhase(1), mode === "reveal" ? 420 : 620),
      window.setTimeout(() => setPhase(2), mode === "reveal" ? 1450 : 1800),
      window.setTimeout(() => setPhase(3), mode === "reveal" ? 2850 : 3400),
      // La scène se ferme seule. Le bouton Passer reste uniquement un raccourci.
      window.setTimeout(finish, mode === "reveal" ? 5900 : 5400),
    ];
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      document.body.classList.remove("tm-mutation-lock");
    };
  }, [direction, finish, mode, signatureId]);

  const callLines = definition.lines.map((line) => line.split("{direction}").join(directionLabel));
  const reveal = mode === "reveal" ? mutation as MineMutationReveal : null;
  const title = mode === "reveal" ? "NOUVEAU PASSAGE DÉCOUVERT" : definition.title;

  return createPortal(
    <div
      className={`tm-mutation-cinematic tm-mutation-${mode} tm-mutation-family-${definition.family} tm-mutation-phase-${phase} tm-mutation-dir-${direction}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="tm-mutation-backdrop" />
      <div className="tm-mutation-vignette" />
      <div className="tm-mutation-direction-pull" />
      <div className="tm-mutation-wind-layer">{visualParticles(22, "tm-mutation-wind-particle")}</div>
      <div className="tm-mutation-water-layer">{visualParticles(18, "tm-mutation-drop")}</div>
      <div className="tm-mutation-frost-layer">{visualParticles(24, "tm-mutation-frost")}</div>
      <div className="tm-mutation-debris-layer">{visualParticles(20, "tm-mutation-debris")}</div>
      <div className="tm-mutation-glow-layer">{visualParticles(16, "tm-mutation-spark")}</div>
      <div className="tm-mutation-scream-rings"><i /><i /><i /></div>
      <div className="tm-mutation-heart"><i /><i /><i /></div>
      <div className="tm-mutation-crack"><i /><i /><i /><i /></div>

      <button className="tm-mutation-skip" type="button" onClick={finish}>
        Passer
      </button>

      <main className="tm-mutation-cinematic-copy">
        <div className="tm-mutation-icon">{mode === "reveal" ? "✦" : definition.icon}</div>
        <p className="tm-mutation-kicker">
          {mode === "reveal"
            ? `MUTATION ${reveal?.stage ?? "?"} / ${reveal?.maxStages ?? 3}`
            : `LA MINE A CHANGÉ · MUTATION ${(mutation as MineMutationState).stage ?? "?"}`}
        </p>
        <h1>{title}</h1>

        {mode === "call" ? (
          <div className="tm-mutation-lines">
            {callLines.map((line, index) => (
              <p key={`${signatureId}-${index}`} style={{ animationDelay: `${0.28 + index * 0.62}s` }}>
                {line}
              </p>
            ))}
            <strong>{mutationThemeWhisper(mutation.theme)}</strong>
          </div>
        ) : (
          <div className="tm-mutation-lines reveal-lines">
            <p>La paroi cède dans un grondement qui traverse tout l'étage.</p>
            <p>Un tunnel qui n'existait pas auparavant s'ouvre devant vous.</p>
            <strong>
              {reveal?.roomCount ?? 0} nouvelles salles · {reveal?.themeLabel ?? "Galerie inconnue"}
            </strong>
          </div>
        )}

        <div className="tm-mutation-direction-card">
          <span>{mode === "reveal" ? "PASSAGE OUVERT" : "L'APPEL VIENT DE"}</span>
          <strong>{directionLabel}</strong>
        </div>
      </main>
    </div>,
    document.body,
  );
}
