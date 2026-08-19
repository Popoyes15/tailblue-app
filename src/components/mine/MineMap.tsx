import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type {
  MineExit,
  MineMap as MineMapData,
  MineMapLink,
  MineMapNode,
} from "../../types/mine";
import { cleanMineText } from "../../data/mineText";

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

const DELTA: Record<string, [number, number]> = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
  up: [0, -1],
  down: [0, 1],
};

function opposite([x, y]: [number, number]): [number, number] {
  return [-x, -y];
}

type Positioned = MineMapNode & { gx: number; gy: number };

type ViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function graphLayout(map: MineMapData): Positioned[] {
  const nodes = map.nodes ?? [];
  if (!nodes.length) return [];

  // Les coordonnées viennent du vrai générateur de mine. C'est la source de
  // vérité la plus stable et cela conserve la forme réelle de l'étage.
  const uniqueCoordinates = new Set(nodes.map((node) => `${node.x}:${node.y}`));
  if (uniqueCoordinates.size > 1) {
    return nodes.map((node) => ({ ...node, gx: node.x, gy: node.y }));
  }

  // Compatibilité avec de vieux étages qui n'avaient pas encore de coordonnées.
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const current = nodes.find((node) => node.current) ?? nodes[0];
  const positions = new Map<string, [number, number]>([[current.id, [0, 0]]]);
  const queue = [current.id];

  const linksByNode = new Map<string, MineMapLink[]>();
  for (const link of map.links ?? []) {
    linksByNode.set(link.from, [...(linksByNode.get(link.from) ?? []), link]);
    linksByNode.set(link.to, [...(linksByNode.get(link.to) ?? []), link]);
  }

  while (queue.length) {
    const id = queue.shift()!;
    const base = positions.get(id)!;

    for (const link of linksByNode.get(id) ?? []) {
      const forward = link.from === id;
      const targetId = forward ? link.to : link.from;
      if (!byId.has(targetId) || positions.has(targetId)) continue;

      const raw = DELTA[link.direction] ?? [1, 0];
      const delta = forward ? raw : opposite(raw);
      positions.set(targetId, [base[0] + delta[0], base[1] + delta[1]]);
      queue.push(targetId);
    }
  }

  const unplaced = nodes.filter((node) => !positions.has(node.id));
  if (unplaced.length) {
    const placed = [...positions.values()];
    const lowest = Math.max(0, ...placed.map(([, y]) => y)) + 2;
    unplaced.forEach((node, index) => {
      positions.set(node.id, [index - (unplaced.length - 1) / 2, lowest]);
    });
  }

  const occupied = new Map<string, number>();
  return nodes.map((node) => {
    let [gx, gy] = positions.get(node.id) ?? [0, 0];
    const key = `${gx}:${gy}`;
    const collision = occupied.get(key) ?? 0;
    occupied.set(key, collision + 1);
    if (collision > 0) {
      gx += collision * 0.32;
      gy += collision * 0.18;
    }
    return { ...node, gx, gy };
  });
}

function viewBoxString(value: ViewBox) {
  return `${value.x} ${value.y} ${value.width} ${value.height}`;
}

type Props = {
  map: MineMapData;
  exits: MineExit[];
  disabled: boolean;
  onMove: (direction: string) => void;
};

export default function MineMap({ map, exits, disabled, onMove }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    clientX: number;
    clientY: number;
    start: ViewBox;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const nodes = useMemo(() => graphLayout(map), [map]);
  const exitByRoom = useMemo(
    () => new Map(exits.map((exit) => [exit.roomId, exit])),
    [exits],
  );

  const geometry = useMemo(() => {
    // Carte de découverte : les cartes restent compactes afin de garder toute
    // la zone réellement explorée lisible, sans révéler le reste de l'étage.
    const stepX = 210;
    const stepY = 124;
    const cardW = 168;
    const cardH = 80;
    const padX = 115;
    const padY = 90;

    const coords = new Map(
      nodes.map((node) => [
        node.id,
        { x: node.gx * stepX, y: node.gy * stepY },
      ]),
    );

    if (!nodes.length) {
      return {
        coords,
        fit: { x: -400, y: -220, width: 800, height: 440 } as ViewBox,
        cardW,
        cardH,
      };
    }

    const xs = [...coords.values()].map((value) => value.x);
    const ys = [...coords.values()].map((value) => value.y);
    const minX = Math.min(...xs) - cardW / 2 - padX;
    const maxX = Math.max(...xs) + cardW / 2 + padX;
    const minY = Math.min(...ys) - cardH / 2 - padY;
    const maxY = Math.max(...ys) + cardH / 2 + padY;

    return {
      coords,
      fit: {
        x: minX,
        y: minY,
        width: Math.max(760, maxX - minX),
        height: Math.max(400, maxY - minY),
      } as ViewBox,
      cardW,
      cardH,
    };
  }, [nodes]);

  const [viewBox, setViewBox] = useState<ViewBox>(geometry.fit);

  // À chaque évolution du plan, on réaffiche automatiquement l'ensemble de la
  // carte découverte. Le joueur peut ensuite zoomer et la déplacer librement.
  useEffect(() => {
    setViewBox(geometry.fit);
  }, [geometry.fit.x, geometry.fit.y, geometry.fit.width, geometry.fit.height]);

  const handleWheel = useCallback((event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const pointerX = (event.clientX - rect.left) / rect.width;
    const pointerY = (event.clientY - rect.top) / rect.height;
    const factor = event.deltaY > 0 ? 1.13 : 0.885;

    setViewBox((current) => {
      const maxWidth = geometry.fit.width * 1.85;
      const minWidth = geometry.fit.width * 0.22;
      const nextWidth = Math.min(maxWidth, Math.max(minWidth, current.width * factor));
      const ratio = nextWidth / current.width;
      const nextHeight = current.height * ratio;
      const anchorX = current.x + current.width * pointerX;
      const anchorY = current.y + current.height * pointerY;

      return {
        x: anchorX - nextWidth * pointerX,
        y: anchorY - nextHeight * pointerY,
        width: nextWidth,
        height: nextHeight,
      };
    });
  }, [geometry.fit.width]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    const target = event.target as Element;
    if (target.closest?.(".tm-v48-node")) return;

    dragRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      start: viewBox,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }, [viewBox]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    const svg = svgRef.current;
    if (!drag || drag.pointerId !== event.pointerId || !svg) return;

    const rect = svg.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dx = (event.clientX - drag.clientX) * (drag.start.width / rect.width);
    const dy = (event.clientY - drag.clientY) * (drag.start.height / rect.height);
    setViewBox({
      ...drag.start,
      x: drag.start.x - dx,
      y: drag.start.y - dy,
    });
  }, []);

  const stopDragging = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setDragging(false);
    }
  }, []);

  return (
    <section className="tm-map-card tm-map-card-v50">
      <div className="tm-map-titleline">
        <div>
          <p className="tm-kicker">CARTE DE L'EXPÉDITION</p>
          <h2>Choisis ton passage</h2>
        </div>
        <span className="tm-map-rule">1 salle à la fois</span>
      </div>

      <p className="tm-map-help">
        Les portes aperçues restent en ??? jusqu'à ta première visite · clique sur une sortie actuelle pour avancer · molette pour zoomer · clic maintenu pour déplacer.
      </p>

      <div className={`tm-map-stage tm-map-stage-v50 ${dragging ? "is-dragging" : ""}`}>
        {nodes.length === 0 ? (
          <div className="tm-map-empty"><span>🧭</span><strong>Cartographie en cours…</strong></div>
        ) : (
          <svg
            ref={svgRef}
            viewBox={viewBoxString(viewBox)}
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Carte de la Mine"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopDragging}
            onPointerCancel={stopDragging}
          >
            <g className="tm-v48-links">
              {(map.links ?? []).map((link) => {
                const from = geometry.coords.get(link.from);
                const to = geometry.coords.get(link.to);
                if (!from || !to) return null;
                return (
                  <line
                    key={`${link.from}-${link.to}-${link.direction}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={link.currentExit ? "current" : ""}
                  />
                );
              })}
            </g>

            {nodes.map((node) => {
              const pos = geometry.coords.get(node.id);
              if (!pos) return null;
              const exit = exitByRoom.get(node.id);
              const clickable = Boolean(exit);
              const icon = node.current
                ? "🧭"
                : node.known
                  ? ROOM_ICONS[node.roomType || "empty"] || "🕯️"
                  : "❔";
              const title = node.current
                ? cleanMineText(node.name, "Salle actuelle")
                : node.known
                  ? cleanMineText(node.name, "Galerie")
                  : "???";
              const subtitle = node.current
                ? "Tu es ici"
                : exit
                  ? (node.known ? "Déjà visitée" : "À explorer")
                  : node.cleared
                    ? "Nettoyée"
                    : node.known
                      ? "Visitée"
                      : "Porte repérée";

              return (
                <foreignObject
                  key={node.id}
                  x={pos.x - geometry.cardW / 2}
                  y={pos.y - geometry.cardH / 2}
                  width={geometry.cardW}
                  height={geometry.cardH}
                >
                  <button
                    className={[
                      "tm-v48-node",
                      node.current ? "current" : "",
                      node.known ? "known" : "unknown",
                      node.cleared ? "cleared" : "",
                      clickable ? "clickable" : "",
                    ].join(" ")}
                    disabled={disabled || !clickable}
                    onClick={() => exit && onMove(exit.direction)}
                    title={
                      exit
                        ? (node.known ? `Entrer dans ${cleanMineText(node.name, "cette salle")}` : "Explorer cette salle inconnue")
                        : title
                    }
                  >
                    <span className="tm-v48-node-icon">{icon}</span>
                    <span className="tm-v48-node-copy">
                      <strong>{title}</strong>
                      <small>{subtitle}</small>
                    </span>
                    {node.cleared && !node.current && <i>✓</i>}
                  </button>
                </foreignObject>
              );
            })}
          </svg>
        )}
      </div>
    </section>
  );
}
