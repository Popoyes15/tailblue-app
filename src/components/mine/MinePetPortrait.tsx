import React, { useEffect, useMemo, useState } from "react";
import { resolveMinePetImage } from "../../data/petVisuals";
import type { MineCompanion } from "../../types/mine";

type Props = {
  pet: Pick<MineCompanion, "image" | "emoji" | "name">;
  fallback?: string;
};

export default function MinePetPortrait({ pet, fallback = "🐾" }: Props) {
  const src = useMemo(() => resolveMinePetImage(pet), [pet.image]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <span aria-hidden="true">{pet.emoji || fallback}</span>;
  }

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
