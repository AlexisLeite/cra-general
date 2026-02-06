import type { Edge } from '../../../store/elements/Edge';
import { EdgePoint } from '../../../store/elements/EdgePoint';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { Midpoint } from './types';

const ALIGNMENT_THRESHOLD = 0.1;

export function arePointsAligned(
  p1: Coordinates,
  p2: Coordinates,
  p3: Coordinates,
): boolean {
  const crossProduct: number =
    (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
  return Math.abs(crossProduct) < ALIGNMENT_THRESHOLD;
}

export function getSegmentMidpoints(
  edge: Edge,
  points: (Coordinates | EdgePoint)[],
): Midpoint[] {
  const midpoints: Midpoint[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const segment: [Coordinates, Coordinates] = [points[i], points[i + 1]];

    const staticCount = segment.filter(
      (c) => c instanceof EdgePoint && c.mode === 'static',
    ).length;

    // Allow static-nonstatic segments to be dragged; only skip fully static.
    if (staticCount === 2) {
      continue;
    }

    midpoints.push(new Midpoint(String(i), edge, segment));
  }

  return midpoints;
}
