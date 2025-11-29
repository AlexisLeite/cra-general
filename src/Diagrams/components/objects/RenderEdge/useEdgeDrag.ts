import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Diagram } from '../../../store/Diagram';
import { Coordinates } from '../../../store/primitives/Coordinates';

const SEGMENT_HIT_TOLERANCE = 6;
const AXIS_ALIGNMENT_EPS = 0.0001;
const EDGE_CORNER_OFFSET = 10;

type SegmentSelection = {
  index: number;
  isHorizontal: boolean;
};

type SegmentHit = SegmentSelection & { distance: number };

type DetachResult = {
  points: Coordinates[];
  dragIndex: number;
};

const distanceToSegment = (
  point: Coordinates,
  start: Coordinates,
  end: Coordinates,
) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const tNumerator = (point.x - start.x) * dx + (point.y - start.y) * dy;
  const tDenominator = dx * dx + dy * dy;
  const t = Math.max(0, Math.min(1, tNumerator / tDenominator));
  const projX = start.x + t * dx;
  const projY = start.y + t * dy;
  return Math.hypot(point.x - projX, point.y - projY);
};

const inferOrientation = (start: Coordinates, end: Coordinates): boolean => {
  const dx = Math.abs(start.x - end.x);
  const dy = Math.abs(start.y - end.y);

  if (dy <= AXIS_ALIGNMENT_EPS) return true; // nearly horizontal
  if (dx <= AXIS_ALIGNMENT_EPS) return false; // nearly vertical

  return dx <= dy; // smaller delta axis stayed more constant -> orientation
};

const findSegmentSelection = (
  points: Coordinates[],
  point: Coordinates,
): SegmentSelection | null => {
  let closest: SegmentHit | null = null;

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];
    if (!start || !end) continue;

    const isHorizontal = inferOrientation(start, end);

    const minX = Math.min(start.x, end.x) - SEGMENT_HIT_TOLERANCE;
    const maxX = Math.max(start.x, end.x) + SEGMENT_HIT_TOLERANCE;
    const minY = Math.min(start.y, end.y) - SEGMENT_HIT_TOLERANCE;
    const maxY = Math.max(start.y, end.y) + SEGMENT_HIT_TOLERANCE;

    const withinBounds =
      point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY;

    if (!withinBounds) continue;

    const distance = distanceToSegment(point, start, end);
    if (distance > SEGMENT_HIT_TOLERANCE) continue;

    if (!closest || distance < closest.distance) {
      closest = { index: i, isHorizontal, distance };
    }
  }

  return closest
    ? { index: closest.index, isHorizontal: closest.isHorizontal }
    : null;
};

const detachStartSegment = (
  points: Coordinates[],
  isHorizontal: boolean,
): DetachResult => {
  if (points.length < 2) return { points, dragIndex: 0 };

  const updated = [...points];
  const anchor = updated[0];
  const next = updated[1];
  if (!anchor || !next) return { points: updated, dragIndex: 0 };

  const direction = isHorizontal
    ? Math.sign(next.x - anchor.x) || 1
    : Math.sign(next.y - anchor.y) || 1;

  const offsetCorner = isHorizontal
    ? new Coordinates([anchor.x + direction * EDGE_CORNER_OFFSET, anchor.y])
    : new Coordinates([anchor.x, anchor.y + direction * EDGE_CORNER_OFFSET]);

  updated.splice(1, 0, offsetCorner.copy(), offsetCorner.copy());
  return { points: updated, dragIndex: 2 };
};

const detachEndSegment = (
  points: Coordinates[],
  isHorizontal: boolean,
  segmentStartIndex: number,
): DetachResult => {
  if (points.length < 2) return { points, dragIndex: segmentStartIndex };

  const updated = [...points];
  const lastIndex = updated.length - 1;
  const anchor = updated[lastIndex];
  const prev = updated[lastIndex - 1];
  if (!anchor || !prev)
    return { points: updated, dragIndex: segmentStartIndex };

  const direction = isHorizontal
    ? Math.sign(anchor.x - prev.x) || 1
    : Math.sign(anchor.y - prev.y) || 1;

  const insertIndex = updated.length - 1;
  const offsetCorner = isHorizontal
    ? new Coordinates([anchor.x - direction * EDGE_CORNER_OFFSET, anchor.y])
    : new Coordinates([anchor.x, anchor.y - direction * EDGE_CORNER_OFFSET]);

  updated.splice(insertIndex, 0, offsetCorner.copy(), offsetCorner.copy());
  const dragIndex = Math.min(segmentStartIndex, updated.length - 3);
  return { points: updated, dragIndex };
};

// ...existing code...
export const useEdgeDrag = (
  outerPoints: Coordinates[],
  onChange?: (points: Coordinates[]) => void,
) => {
  const diagram = Diagram.use();
  const [points, setDragState] = useState<Coordinates[] | null>(null);

  const dragIndexRef = useRef<number | null>(null);
  const isHorizontalRef = useRef<boolean>(false);
  const lastMouseRef = useRef<Coordinates | null>(null);
  const hasMovedRef = useRef(false);

  const getMousePoint = useCallback(
    (e: MouseEvent | React.MouseEvent) =>
      diagram.canvas.inverseFit(new Coordinates([e.clientX, e.clientY])),
    [diagram],
  );

  const clonePoints = useCallback(
    (pts: Coordinates[]) => pts.map((p) => p.copy()),
    [],
  );

  useEffect(() => {
    if (!outerPoints) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragIndexRef.current === null || !lastMouseRef.current || !points)
        return;

      const mousePoint = getMousePoint(e);
      const prevMouse = lastMouseRef.current;
      const deltaX = mousePoint.x - prevMouse.x;
      const deltaY = mousePoint.y - prevMouse.y;
      const isHorizontal = isHorizontalRef.current;
      const shift = isHorizontal ? deltaY : deltaX;

      if (shift === 0) return;

      const updatedPoints = clonePoints(points);
      const startIndex = dragIndexRef.current;
      if (startIndex < 0 || startIndex + 1 >= updatedPoints.length) return;

      if (isHorizontal) {
        updatedPoints[startIndex] = new Coordinates([
          updatedPoints[startIndex].x,
          updatedPoints[startIndex].y + shift,
        ]);
        updatedPoints[startIndex + 1] = new Coordinates([
          updatedPoints[startIndex + 1].x,
          updatedPoints[startIndex + 1].y + shift,
        ]);
      } else {
        updatedPoints[startIndex] = new Coordinates([
          updatedPoints[startIndex].x + shift,
          updatedPoints[startIndex].y,
        ]);
        updatedPoints[startIndex + 1] = new Coordinates([
          updatedPoints[startIndex + 1].x + shift,
          updatedPoints[startIndex + 1].y,
        ]);
      }

      hasMovedRef.current = true;
      lastMouseRef.current = mousePoint;
      setDragState(updatedPoints);
    };

    const handleMouseUp = () => {
      if (
        dragIndexRef.current !== null &&
        points &&
        onChange &&
        hasMovedRef.current
      ) {
        onChange(clonePoints(points));
      }

      dragIndexRef.current = null;
      isHorizontalRef.current = false;
      lastMouseRef.current = null;
      hasMovedRef.current = false;
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [outerPoints, diagram, onChange, points, getMousePoint, clonePoints]);

  const onMouseDown = (ev: React.MouseEvent) => {
    if (ev.button !== 0) return;
    ev.stopPropagation();
    ev.preventDefault();

    const source = points || outerPoints;
    if (!source || source.length < 2) return;

    const mouse = getMousePoint(ev);
    const selection = findSegmentSelection(source, mouse);
    if (!selection) return;

    let workingPoints = clonePoints(source);
    let dragIndex = selection.index;

    if (dragIndex === 1) {
      const { points: updated, dragIndex: nextIndex } = detachStartSegment(
        workingPoints,
        selection.isHorizontal,
      );
      workingPoints = updated;
      dragIndex = nextIndex;
    }

    if (dragIndex + 1 === workingPoints.length - 2) {
      const { points: updated, dragIndex: nextIndex } = detachEndSegment(
        workingPoints,
        selection.isHorizontal,
        dragIndex,
      );
      workingPoints = updated;
      dragIndex = nextIndex;
    }

    dragIndexRef.current = dragIndex;
    isHorizontalRef.current = selection.isHorizontal;
    lastMouseRef.current = mouse;
    hasMovedRef.current = false;
    setDragState(workingPoints);
  };

  return {
    points: points || outerPoints,
    setDragState,
    onMouseDown,
  };
};
