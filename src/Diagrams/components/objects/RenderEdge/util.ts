import { Coordinates } from '../../../store/primitives/Coordinates';
import { MidpointInfo } from './types';

const ALIGNMENT_THRESHOLD = 0.001;

export function areSegmentsAligned(
  p1: Coordinates,
  p2: Coordinates,
  p3: Coordinates,
): boolean {
  const crossProduct: number =
    (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x);
  return Math.abs(crossProduct) < ALIGNMENT_THRESHOLD;
}

export function getSegmentMidpoints(points: Coordinates[]): MidpointInfo[] {
  if (!points || points.length < 2) {
    return [];
  }

  const midpoints: MidpointInfo[] = [];
  let startIndex: number = 0;
  let segmentCount: number = 0;

  // First pass: count total segments
  for (let i: number = 1; i < points.length; i++) {
    const startPoint: Coordinates = points[startIndex];
    const currentPoint: Coordinates = points[i];

    if (
      i === points.length - 1 ||
      !areSegmentsAligned(startPoint, currentPoint, points[i + 1])
    ) {
      segmentCount++;
      startIndex = i;
    }
  }

  // Second pass: create midpoints with segment info
  startIndex = 0;
  let currentSegmentIndex: number = 0;

  for (let i: number = 1; i < points.length; i++) {
    const startPoint: Coordinates = points[startIndex];
    const currentPoint: Coordinates = points[i];

    if (
      i === points.length - 1 ||
      !areSegmentsAligned(startPoint, currentPoint, points[i + 1])
    ) {
      const midX: number = (startPoint.x + currentPoint.x) / 2;
      const midY: number = (startPoint.y + currentPoint.y) / 2;

      // Determine if segment is horizontal or vertical
      const dx = Math.abs(currentPoint.x - startPoint.x);
      const dy = Math.abs(currentPoint.y - startPoint.y);
      const isHorizontal = dx > dy;

      const mid = new Coordinates([midX, midY]) as MidpointInfo;
      mid.insertIndex = i;
      mid.startIndex = startIndex;
      mid.endIndex = i;
      mid.isHorizontal = isHorizontal;
      mid.isStartSegment = currentSegmentIndex === 0;
      mid.isEndSegment = currentSegmentIndex === segmentCount - 1;
      midpoints.push(mid);

      startIndex = i;
      currentSegmentIndex++;
    }
  }

  return midpoints;
}
