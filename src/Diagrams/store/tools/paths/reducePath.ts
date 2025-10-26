import { Coordinates } from '../../primitives/Coordinates';

export function reducePath(points: Coordinates[]): Coordinates[] {
  if (points.length <= 2) return [...points];

  const out: Coordinates[] = [];
  const eq = (a: Coordinates, b: Coordinates) => a.x === b.x && a.y === b.y;

  // Always keep the first point
  out.push(points[0]);

  for (let i = 1; i < points.length - 1; i++) {
    const a = out[out.length - 1];
    const b = points[i];
    const c = points[i + 1];

    // Drop duplicates
    if (eq(b, a)) continue;

    // If a, b, c are collinear horizontally or vertically, b is redundant
    const collinear =
      (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (collinear) continue;

    out.push(b);
  }

  // Always keep the last point
  const last = points[points.length - 1];
  if (!eq(last, out[out.length - 1])) out.push(last);

  return out;
}
