import type { MouseEvent } from "react";

export default function CompanionImageLightbox({
  image,
  title,
  onClose,
}: {
  image: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="tb-comp-lightbox" onClick={onClose}>
      <button onClick={onClose} aria-label="Fermer">×</button>
      <figure onClick={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
        <img src={image} alt={title} />
        <figcaption>{title}</figcaption>
      </figure>
    </div>
  );
}
