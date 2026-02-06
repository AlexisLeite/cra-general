import { Coordinates } from '../primitives/Coordinates';
import type { Midpoint } from '../../components/objects/RenderEdge';
import { EdgePoint } from '../elements/EdgePoint';
import { Edge } from '../elements/Edge';
import { type AnyMouseEvent, DEdgeDragStartEvent } from '../elements/Events';
import { bind, bindDocument } from '../../util/binders';
import { DiagramExtension } from './DiagramExtension';
import { GridSnap } from './GridSnap';
import { runInAction } from 'mobx';

const AXIS_EPSILON = 0.001;

type DragContext = {
  edge: Edge;
  midpoint: Midpoint;
  pointA: EdgePoint;
  pointB: EdgePoint;
  pointAIndex: number;
  pointBIndex: number;
  movedAxis: 'x' | 'y';
  startMouseCanvas: Coordinates;
  startPointA: Coordinates;
  startPointB: Coordinates;
};

export class EdgesDragger extends DiagramExtension {
  init() {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.diagram.onEvent(DEdgeDragStartEvent, this.startDrag.bind(this));
  }

  protected drag: DragContext | null = null;

  protected almostEqual(a: number, b: number) {
    return Math.abs(a - b) < AXIS_EPSILON;
  }

  protected areAxisAligned(a: Coordinates, b: Coordinates) {
    return this.almostEqual(a.x, b.x) || this.almostEqual(a.y, b.y);
  }

  protected needsSplitForMovement(
    neighbor: Coordinates | undefined,
    point: Coordinates,
    movedAxis: 'x' | 'y',
  ) {
    if (!neighbor) {
      return false;
    }

    // If the segment is already diagonal, split before dragging.
    if (!this.areAxisAligned(neighbor, point)) {
      return true;
    }

    // Moving on one axis breaks segments that are constrained by that axis.
    if (movedAxis === 'x') {
      return this.almostEqual(neighbor.x, point.x);
    }

    return this.almostEqual(neighbor.y, point.y);
  }

  protected duplicateBoundaryPointsIfRequired(
    edge: Edge,
    pointAIndex: number,
    pointBIndex: number,
    movedAxis: 'x' | 'y',
  ) {
    const steps = edge.state.steps;

    if (pointAIndex > 0) {
      const beforeA = steps[pointAIndex - 1];
      const a = steps[pointAIndex];

      if (this.needsSplitForMovement(beforeA, a, movedAxis)) {
        const duplicate = a.copy();
        duplicate.mode = 'manual';
        steps.splice(pointAIndex, 0, duplicate);
        pointAIndex += 1;
        pointBIndex += 1;
      }
    }

    if (pointBIndex < steps.length - 1) {
      const b = steps[pointBIndex];
      const afterB = steps[pointBIndex + 1];

      if (this.needsSplitForMovement(afterB, b, movedAxis)) {
        const duplicate = b.copy();
        duplicate.mode = 'manual';
        steps.splice(pointBIndex + 1, 0, duplicate);
      }
    }

    return { pointAIndex, pointBIndex };
  }

  protected isolateStaticDraggedEndpoint(
    edge: Edge,
    pointAIndex: number,
    pointBIndex: number,
  ) {
    const a = edge.steps[pointAIndex];
    const b = edge.steps[pointBIndex];

    if (a.mode === 'static' && b.mode === 'static') {
      return null;
    }

    // If one endpoint is static, duplicate the non-static one in place and drag
    // the duplicate so the continuous next segment is not pulled.
    if (a.mode === 'static' || b.mode === 'static') {
      const staticIndex = a.mode === 'static' ? pointAIndex : pointBIndex;
      const movingIndex = a.mode === 'static' ? pointBIndex : pointAIndex;

      const duplicate = edge.steps[movingIndex].copy();
      duplicate.mode = 'manual';

      const insertIndex = staticIndex < movingIndex ? movingIndex : staticIndex;
      edge.state.steps.splice(insertIndex, 0, duplicate);

      if (a.mode === 'static') {
        // Drag segment becomes [static, duplicate]
        pointBIndex = insertIndex;
      } else {
        // Drag segment becomes [duplicate, static]
        pointAIndex = insertIndex;
        pointBIndex = staticIndex + 1;
      }
    }

    return { pointAIndex, pointBIndex };
  }

  uns = () => {};
  startDrag(ev: DEdgeDragStartEvent) {
    if (!ev.cancelled) {
      ev.stopImmediatePropagation();
      this.uns();

      const edge = ev.src;
      const midpoint = ev.midPoint;

      const pointA = midpoint.points[0] as EdgePoint;
      const pointB = midpoint.points[1] as EdgePoint;
      let pointAIndex = edge.steps.findIndex((point) => point === pointA);
      let pointBIndex = edge.steps.findIndex((point) => point === pointB);

      if (
        !(pointA instanceof EdgePoint) ||
        !(pointB instanceof EdgePoint) ||
        pointAIndex < 0 ||
        pointBIndex < 0
      ) {
        return;
      }

      runInAction(() => {
        edge.state.dragging = true;
      });

      const prepared = this.isolateStaticDraggedEndpoint(
        edge,
        pointAIndex,
        pointBIndex,
      );
      if (!prepared) {
        return;
      }
      pointAIndex = prepared.pointAIndex;
      pointBIndex = prepared.pointBIndex;

      if (edge.steps[pointAIndex].mode !== 'static') {
        edge.steps[pointAIndex].mode = 'manual';
      }
      if (edge.steps[pointBIndex].mode !== 'static') {
        edge.steps[pointBIndex].mode = 'manual';
      }

      const startMouseCanvas = this.diagram.canvas.inverseFit(
        new Coordinates(ev),
      );

      const startPointA = edge.steps[pointAIndex].copy().nonObserved;
      const startPointB = edge.steps[pointBIndex].copy().nonObserved;
      const dx = Math.abs(startPointA.x - startPointB.x);
      const dy = Math.abs(startPointA.y - startPointB.y);
      const movedAxis = dx <= dy ? 'x' : 'y';
      ({ pointAIndex, pointBIndex } = this.duplicateBoundaryPointsIfRequired(
        edge,
        pointAIndex,
        pointBIndex,
        movedAxis,
      ));

      const dragPointA = edge.steps[pointAIndex];
      const dragPointB = edge.steps[pointBIndex];

      if (dragPointA.mode !== 'static') {
        dragPointA.mode = 'manual';
      }
      if (dragPointB.mode !== 'static') {
        dragPointB.mode = 'manual';
      }

      this.drag = {
        edge,
        midpoint,
        pointA: dragPointA,
        pointB: dragPointB,
        pointAIndex,
        pointBIndex,
        movedAxis,
        startMouseCanvas,
        startPointA: dragPointA.copy().nonObserved,
        startPointB: dragPointB.copy().nonObserved,
      };

      this.uns = bind(bindDocument(this, 'mousemove', this.handleMouseMove));
    }
  }

  protected handleMouseMove(ev: AnyMouseEvent) {
    if (!this.drag) return;

    const a = this.drag.pointA;
    const b = this.drag.pointB;

    const mouseCanvas = this.diagram.canvas.inverseFit(new Coordinates(ev));
    const delta = mouseCanvas.nonObserved.substract(this.drag.startMouseCanvas);

    if (this.drag.movedAxis === 'x') {
      delta.y = 0;
    } else {
      delta.x = 0;
    }

    if (a.mode !== 'static') {
      a.assign(this.drag.startPointA.copy().sum(delta));
    }
    if (b.mode !== 'static') {
      b.assign(this.drag.startPointB.copy().sum(delta));
    }

    const snap = this.diagram.getExtension(GridSnap);
    if (snap.enabled) {
      if (a.mode !== 'static') {
        a.snapToGrid(snap.gridSize, this.drag.movedAxis);
      }
      if (b.mode !== 'static') {
        b.snapToGrid(snap.gridSize, this.drag.movedAxis);
      }
    }

    this.preventGatewayCollapse();
    this.simplifyEdgeAfterDrag(this.drag.edge, [
      this.drag.pointA,
      this.drag.pointB,
    ]);
  }

  protected preventGatewayCollapse() {
    if (!this.drag) return;

    const { edge, pointA, pointB } = this.drag;
    const pointAIndex = edge.steps.findIndex((point) => point === pointA);
    const pointBIndex = edge.steps.findIndex((point) => point === pointB);

    if (pointAIndex < 0 || pointBIndex < 0) {
      return;
    }

    const endAdjacentIndex = edge.steps.length - 2;

    if (pointAIndex === 1) {
      this.clampEndpointAdjacentPoint(
        edge.steps[0],
        pointA,
        edge.from.orientation,
      );
    }
    if (pointBIndex === 1) {
      this.clampEndpointAdjacentPoint(
        edge.steps[0],
        pointB,
        edge.from.orientation,
      );
    }
    if (pointAIndex === endAdjacentIndex) {
      this.clampEndpointAdjacentPoint(
        edge.steps.at(-1)!,
        pointA,
        edge.to.orientation,
      );
    }
    if (pointBIndex === endAdjacentIndex) {
      this.clampEndpointAdjacentPoint(
        edge.steps.at(-1)!,
        pointB,
        edge.to.orientation,
      );
    }
  }

  protected clampEndpointAdjacentPoint(
    endpoint: Coordinates,
    candidate: Coordinates,
    orientation: 'up' | 'down' | 'left' | 'right',
  ) {
    switch (orientation) {
      case 'up':
        candidate.y = Math.min(candidate.y, endpoint.y);
        break;
      case 'down':
        candidate.y = Math.max(candidate.y, endpoint.y);
        break;
      case 'left':
        candidate.x = Math.min(candidate.x, endpoint.x);
        break;
      case 'right':
        candidate.x = Math.max(candidate.x, endpoint.x);
        break;
    }
  }

  protected areCollinear(a: Coordinates, b: Coordinates, c: Coordinates) {
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    return Math.abs(cross) < AXIS_EPSILON;
  }

  protected isSamePoint(a: Coordinates, b: Coordinates) {
    return this.almostEqual(a.x, b.x) && this.almostEqual(a.y, b.y);
  }

  protected pickPointToKeepFromRun(points: EdgePoint[], kept: Set<EdgePoint>) {
    const staticPoint = points.find((p) => p.mode === 'static');
    if (staticPoint) return staticPoint;

    const keptPoint = points.find((p) => kept.has(p));
    if (keptPoint) return keptPoint;

    const manualPoint = points.find((p) => p.mode === 'manual');
    if (manualPoint) return manualPoint;

    return points[0];
  }

  protected chooseOrthogonalCorner(
    from: EdgePoint,
    to: EdgePoint,
    previous?: EdgePoint,
    next?: EdgePoint,
  ) {
    const c1 = new EdgePoint(null, [to.x, from.y, 'auto']);
    const c2 = new EdgePoint(null, [from.x, to.y, 'auto']);

    const score = (candidate: EdgePoint) => {
      let value = 0;
      if (previous && this.areAxisAligned(previous, candidate)) {
        value += 1;
      }
      if (next && this.areAxisAligned(candidate, next)) {
        value += 1;
      }
      return value;
    };

    return score(c1) >= score(c2) ? c1 : c2;
  }

  protected ensureOrthogonalAdjacency(edge: Edge) {
    for (let i = 0; i < edge.state.steps.length - 1; ) {
      const current = edge.state.steps[i];
      const next = edge.state.steps[i + 1];

      if (this.areAxisAligned(current, next)) {
        i += 1;
        continue;
      }

      const previous = i > 0 ? edge.state.steps[i - 1] : undefined;
      const nextAfter =
        i + 2 < edge.state.steps.length ? edge.state.steps[i + 2] : undefined;

      edge.state.steps.splice(
        i + 1,
        0,
        this.chooseOrthogonalCorner(current, next, previous, nextAfter),
      );
      i += 1;
    }
  }

  protected simplifyEdgeAfterDrag(edge: Edge, keep: EdgePoint[] = []) {
    const kept = new Set(keep);

    // First pass: collapse sequential duplicate-position runs into one point.
    for (let i = 0; i < edge.state.steps.length; ) {
      let j = i + 1;
      while (
        j < edge.state.steps.length &&
        this.isSamePoint(edge.state.steps[i], edge.state.steps[j])
      ) {
        j += 1;
      }

      if (j - i > 1) {
        const run = edge.state.steps.slice(i, j);
        const keepPoint = this.pickPointToKeepFromRun(run, kept);
        const replacement = keepPoint.copy();
        replacement.mode = keepPoint.mode;
        edge.state.steps.splice(i, j - i, replacement);
      } else {
        i += 1;
      }
    }

    // Second pass: merge aligned segments by dropping the middle point.
    for (let i = 1; i < edge.state.steps.length - 1; ) {
      const a = edge.state.steps[i - 1];
      const b = edge.state.steps[i];
      const c = edge.state.steps[i + 1];

      if (!this.areCollinear(a, b, c)) {
        i += 1;
        continue;
      }

      // Keep only static anchors; manual points should be mergeable.
      if (b.mode === 'static') {
        i += 1;
        continue;
      }

      const canCollapseAutoMiddle = b.mode === 'auto';
      const canCollapseManualTriplet =
        a.mode === 'manual' && b.mode === 'manual' && c.mode === 'manual';

      if (!canCollapseAutoMiddle && !canCollapseManualTriplet) {
        i += 1;
        continue;
      }

      if (kept.has(b)) {
        i += 1;
        continue;
      }

      edge.state.steps.splice(i, 1);
    }

    // Third pass: collapse orthogonal detours A->B->C->D when A and D are aligned.
    for (let i = 0; i < edge.state.steps.length - 3; ) {
      const a = edge.state.steps[i];
      const b = edge.state.steps[i + 1];
      const c = edge.state.steps[i + 2];
      const d = edge.state.steps[i + 3];

      const isOrthChain =
        this.areAxisAligned(a, b) &&
        this.areAxisAligned(b, c) &&
        this.areAxisAligned(c, d);

      if (!isOrthChain || !this.areAxisAligned(a, d)) {
        i += 1;
        continue;
      }

      if (b.mode === 'static' || c.mode === 'static') {
        i += 1;
        continue;
      }

      if (kept.has(b) || kept.has(c)) {
        i += 1;
        continue;
      }

      edge.state.steps.splice(i + 1, 2);
    }

    // Final guard: never leave diagonal consecutive segments.
    this.ensureOrthogonalAdjacency(edge);
  }

  protected handleMouseUp() {
    if (!this.drag) return;

    runInAction(() => {
      this.drag!.edge.state.dragging = false;
      this.drag = null;
    });
  }
}
