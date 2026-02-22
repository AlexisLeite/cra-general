import { Coordinates } from '../store/primitives/Coordinates';
import { Dimensions } from '../store/primitives/Dimensions';
import { svgPathBbox } from 'svg-path-bbox';

export const getRectPath = (bound: Dimensions, r = 0): string => {
  const { x, y, width, height } = bound;

  if (r <= 0) return `M${x},${y} h${width} v${height} h${-width}Z`;

  const rr = Math.min(r, width / 2, height / 2);

  return [
    `M${x + rr},${y}`,
    `h${width - 2 * rr}`,
    `a${rr},${rr} 0 0 1 ${rr},${rr}`,
    `v${height - 2 * rr}`,
    `a${rr},${rr} 0 0 1 ${-rr},${rr}`,
    `h${-(width - 2 * rr)}`,
    `a${rr},${rr} 0 0 1 ${-rr},${-rr}`,
    `v${-(height - 2 * rr)}`,
    `a${rr},${rr} 0 0 1 ${rr},${-rr}`,
    'Z',
  ].join(' ');
};

export const getCirclePath = (center: Coordinates, r: number) =>
  `M ${center.x - r}, ${center.y}
   a ${r},${r} 0 1,0 ${2 * r},0
   a ${r},${r} 0 1,0 -${2 * r},0`;

/**
 * Genera un path SVG para un rombo centrado en (cx, cy).
 * @param cx - Coordenada X del centro
 * @param cy - Coordenada Y del centro
 * @param size - Tamaño total (distancia de vértice a vértice vertical u horizontal)
 * @returns Atributo `d` para un <path>
 */
export function getDiamondPath(center: Coordinates, size: number): string {
  const half = size / 2;
  return [
    `M ${center.x} ${center.y - half}`, // vértice superior
    `L ${center.x + half} ${center.y}`, // vértice derecho
    `L ${center.x} ${center.y + half}`, // vértice inferior
    `L ${center.x - half} ${center.y}`, // vértice izquierdo
    'Z', // cerrar figura
  ].join(' ');
}

export function getPathDimensions(d: string): Dimensions {
  const [x1, y1, x2, y2] = svgPathBbox(d);
  return new Dimensions([x1, y1, x2 - x1, y2 - y1]);
}
