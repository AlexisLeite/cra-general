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

function getPoints(
  points: Coordinates[],
  center: number,
): [Coordinates, Coordinates] {
  return [points[center - 1], points[center]];
}

export function getSegmentMidpoints(
  edge: Edge,
  points: (Coordinates | EdgePoint)[],
): Midpoint[] {
  const midpoints: Midpoint[] = [];

  for (let i = 1; i < points.length - 1; i++) {
    const segment = getPoints(points, i);

    // Don't consider segments with static points
    if (segment.find((c) => c instanceof EdgePoint && c.mode === 'static')) {
      continue;
    }

    midpoints.push(new Midpoint(String(i), edge, segment));
  }

  return midpoints;
}
