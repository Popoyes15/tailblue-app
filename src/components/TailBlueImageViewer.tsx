// TAILBLUE_IMAGE_VIEWER_V1_20260824
import { useEffect } from "react";

import "./TailBlueImageViewer.css";

type Props = {
  open: boolean;
  imageUrl?: string | null;
  title?: string;
  onClose: () => void;
};

export default function TailBlueImageViewer({
  open,
  imageUrl,
  title = "",
  onClose,
}: Props) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !imageUrl) return null;

  return (
    <div
      className="tb-image-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Image TailBlue"}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          onClose();
        }
      }}
    >
      <div className="tb-image-viewer-shell">
        <button
          type="button"
          className="tb-image-viewer-close"
          onClick={onClose}
          aria-label="Fermer"
        >
          ×
        </button>

        <img
          src={imageUrl}
          alt={title || "Illustration TailBlue"}
        />

        <footer>
          <div>
            <span>ILLUSTRATION TAILBLUE</span>
            <strong>{title}</strong>
          </div>
          <small>Échap ou clic à l’extérieur pour fermer</small>
        </footer>
      </div>
    </div>
  );
}
