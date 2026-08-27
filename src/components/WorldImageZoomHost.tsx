// TAILBLUE_WORLD_POLISH_V2_20260826
import { useEffect, useState } from "react";
import TailBlueImageViewer from "./TailBlueImageViewer";

type Artwork = {
  url: string;
  title: string;
} | null;

const WORLD_ZOOM_SELECTOR = [
  ".world-image-stage > img",
  ".world-catalog-art > img",
  ".world-market-art > img",
  ".world-card-art img",
  ".world-avatar img",
].join(",");

export default function WorldImageZoomHost() {
  const [artwork, setArtwork] = useState<Artwork>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const image = target?.closest(
        WORLD_ZOOM_SELECTOR,
      ) as HTMLImageElement | null;

      if (!image?.src) return;

      event.preventDefault();
      event.stopPropagation();

      setArtwork({
        url: image.src,
        title: image.alt?.trim() || "Illustration TailBlue",
      });
    };

    document.addEventListener("click", onClick, true);

    return () => {
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <TailBlueImageViewer
      open={Boolean(artwork)}
      imageUrl={artwork?.url ?? null}
      title={artwork?.title ?? ""}
      onClose={() => setArtwork(null)}
    />
  );
}