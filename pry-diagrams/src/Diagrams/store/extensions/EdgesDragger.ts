import { Coordinates } from '../primitives/Coordinates';
import type { Midpoint } from '../../components/objects/RenderEdge';
import { EdgePoint } from '../elements/EdgePoint';
import { Edge } from '../elements/Edge';
import {
  type AnyMouseEvent,
  DDragEdgeSegmentEvent,
  DEdgeDragStartEvent,
  DEdgeEndpointDragStartEvent,
  EdgePointPositionProposal,
} from '../elements/Events';
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
  wasInitiallyStraight: boolean;
};

type EndpointDragContext = {
  edge: Edge;
  endpoint: 'from' | 'to';
};

type EdgeEndSide = 'from' | 'to';

export class EdgesDragger extends DiagramExtension {
  init() {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.diagram.onEvent(DEdgeDragStartEvent, this.startDrag.bind(this));
    this.diagram.onEvent(
      DEdgeEndpointDragStartEvent,
      this.startEndpointDrag.bind(this),
    );
  }

  protected drag: DragContext | null = null;
  protected endpointDrag: EndpointDragContext | null = null;

  protected almostEqual(a: number, b: number) {
    return Math.abs(a - b) < AXIS_EPSILON;
  }

  protected areAxisAligned(a: Coordinates, b: Coordinates) {
    return this.almostEqual(a.x, b.x) || this.almostEqual(a.y, b.y);
  }

  protected getGridSize() {
    const snap = this.diagram.getExtension(GridSnap);
    return snap.gridSize || 50;
  }

  protected getLeadLength() {
    return this.getGridSize();
  }

  protected orientationVector(orientation: 'up' | 'down' | 'left' | 'right') {
    switch (orientation) {
      case 'left':
        return { x: -1, y: 0 };
      case 'right':
        return { x: 1, y: 0 };
      case 'up':
        return { x: 0, y: -1 };
      case 'down':
        return { x: 0, y: 1 };
    }
  }

  protected axisPerpendicularToGateway(orientation: 'up' | 'down' | 'left' | 'right') {
    return orientation === 'left' || orientation === 'right' ? 'y' : 'x';
  }

  protected expectedLeadPoint(edge: Edge, side: EdgeEndSide) {
    const endpoint = side === 'from' ? edge.steps[0] : edge.steps.at(-1)!;
    const orientation = side === 'from' ? edge.from.orientation : edge.to.orientation;
    const v = this.orientationVector(orientation);
    const lead = this.getLeadLength();
    return new Coordinates([endpoint.x + v.x * lead, endpoint.y + v.y * lead], false);
  }

  protected pointMatches(a: Coordinates, b: Coordinates, eps = AXIS_EPSILON) {
    return Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
  }

  protected ensureEndpointLeadPoint(edge: Edge, side: EdgeEndSide) {
    const expected = this.expectedLeadPoint(edge, side);
    const isFrom = side === 'from';
    const endpointIndex = isFrom ? 0 : edge.steps.length - 1;
    const adjacentIndex = isFrom ? 1 : edge.steps.length - 2;

    if (edge.steps.length < 2) {
      return isFrom ? 0 : edge.steps.length - 1;
    }

    const adjacent = edge.steps[adjacentIndex];
    if (adjacent && this.pointMatches(adjacent, expected)) {
      return adjacentIndex;
    }

    const leadPoint = new EdgePoint(edge, [expected.x, expected.y, 'auto']);

    if (isFrom) {
      edge.state.steps.splice(endpointIndex + 1, 0, leadPoint);
      return endpointIndex + 1;
    }

    edge.state.steps.splice(endpointIndex, 0, leadPoint);
    return endpointIndex;
  }

  protected ensureStraightEdgeBendable(edge: Edge) {
    if (edge.steps.length !== 2) {
      return;
    }
    if (edge.steps[0].mode !== 'static' || edge.steps[1].mode !== 'static') {
      return;
    }

    this.ensureEndpointLeadPoint(edge, 'from');
    this.ensureEndpointLeadPoint(edge, 'to');
  }

  protected updateStraightEdgeDragPath(mouseCanvas: Coordinates) {
    if (!this.drag) return;
    const edge = this.drag.edge;
    this.ensureStraightEdgeBendable(edge);

    const s = edge.steps[0];
    const lf = edge.steps[1];
    const lt = edge.steps[edge.steps.length - 2];
    const t = edge.steps.at(-1)!;

    const snap = this.diagram.getExtension(GridSnap);
    const line = mouseCanvas.copy().nonObserved;
    if (snap.enabled) {
      line.snapToGrid(snap.gridSize);
    }

    let p1: EdgePoint;
    let p2: EdgePoint;
    if (Math.abs(lf.y - lt.y) < AXIS_EPSILON) {
      p1 = new EdgePoint(edge, [lf.x, line.y, 'manual']);
      p2 = new EdgePoint(edge, [lt.x, line.y, 'manual']);
      this.drag.movedAxis = 'y';
    } else {
      p1 = new EdgePoint(edge, [line.x, lf.y, 'manual']);
      p2 = new EdgePoint(edge, [line.x, lt.y, 'manual']);
      this.drag.movedAxis = 'x';
    }

    edge.state.steps = [s, lf, p1, p2, lt, t];
    this.drag.pointA = p1;
    this.drag.pointB = p2;
    this.drag.pointAIndex = 2;
    this.drag.pointBIndex = 3;
  }

  protected prepareSourceEndpointAdjacentDrag(edge: Edge) {
    this.ensureStraightEdgeBendable(edge);
    const leadIndex = this.ensureEndpointLeadPoint(edge, 'from');

    // Straight edge case after lead insertion:
    // [fromStatic, fromLead, toLead, toStatic]
    // Create a movable segment between preserved lead points.
    if (
      edge.steps.length === 4 &&
      leadIndex === 1 &&
      this.isProtectedLeadPoint(edge, 1) &&
      this.isProtectedLeadPoint(edge, 2)
    ) {
      const fromLead = edge.steps[1];
      const toLead = edge.steps[2];
      const fromDup = fromLead.copy();
      fromDup.mode = 'manual';
      const toDup = toLead.copy();
      toDup.mode = 'manual';
      edge.state.steps.splice(2, 0, fromDup, toDup);
      return { pointAIndex: 2, pointBIndex: 3 };
    }

    const leadPoint = edge.steps[leadIndex];
    const duplicate = leadPoint.copy();
    duplicate.mode = 'manual';
    edge.state.steps.splice(leadIndex + 1, 0, duplicate);
    return { pointAIndex: leadIndex + 1, pointBIndex: leadIndex + 2 };
  }

  protected prepareTargetEndpointAdjacentDrag(edge: Edge) {
    this.ensureStraightEdgeBendable(edge);
    const leadIndex = this.ensureEndpointLeadPoint(edge, 'to');
    const leadPoint = edge.steps[leadIndex];
    const duplicate = leadPoint.copy();
    duplicate.mode = 'manual';
    edge.state.steps.splice(leadIndex, 0, duplicate);
    return { pointAIndex: leadIndex - 1, pointBIndex: leadIndex };
  }

  protected isProtectedLeadPoint(edge: Edge, index: number) {
    if (index <= 0 || index >= edge.state.steps.length - 1) {
      return false;
    }

    const lead = this.getLeadLength();
    const point = edge.state.steps[index];
    const fromExpected = this.expectedLeadPoint(edge, 'from');
    if (
      index === 1 &&
      this.pointMatches(point, fromExpected) &&
      Math.abs(edge.state.steps[0].distanceManhattan(point) - lead) < 1
    ) {
      return true;
    }

    const toExpected = this.expectedLeadPoint(edge, 'to');
    if (
      index === edge.state.steps.length - 2 &&
      this.pointMatches(point, toExpected) &&
      Math.abs(edge.state.steps.at(-1)!.distanceManhattan(point) - lead) < 1
    ) {
      return true;
    }

    return false;
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
    if (
      this.isProtectedLeadPoint(edge, pointAIndex - 1) ||
      this.isProtectedLeadPoint(edge, pointBIndex + 1)
    ) {
      return { pointAIndex, pointBIndex };
    }

    const touchesStaticEndpoint =
      steps[pointAIndex]?.mode === 'static' ||
      steps[pointBIndex]?.mode === 'static' ||
      steps[pointAIndex - 1]?.mode === 'static' ||
      steps[pointBIndex + 1]?.mode === 'static';

    // When dragging a segment attached to a gateway, move that whole segment.
    // Do not split it into a tiny fixed stub near the static endpoint.
    if (touchesStaticEndpoint) {
      return { pointAIndex, pointBIndex };
    }

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

    // For endpoint-adjacent segments, duplicate the static endpoint and drag the
    // duplicate instead of splitting at the moving side. This shifts the whole
    // segment and avoids a pinned little stub near the gateway.
    if (a.mode === 'static') {
      const duplicate = a.copy();
      duplicate.mode = 'manual';
      edge.state.steps.splice(pointAIndex + 1, 0, duplicate);
      pointAIndex += 1;
      pointBIndex += 1;
      return { pointAIndex, pointBIndex };
    }

    if (b.mode === 'static') {
      const duplicate = b.copy();
      duplicate.mode = 'manual';
      edge.state.steps.splice(pointBIndex, 0, duplicate);
      return { pointAIndex, pointBIndex };
    }

    return { pointAIndex, pointBIndex };
  }

  uns = () => {};
  startDrag(ev: DEdgeDragStartEvent) {
    if (!ev.cancelled) {
      ev.stopImmediatePropagation();
      this.uns();

      const edge = ev.src;
      const wasInitiallyStraight = edge.steps.length === 2;
      const midpoint = ev.midPoint;

      const pointA = midpoint.points[0] as EdgePoint;
      const pointB = midpoint.points[1] as EdgePoint;
      let pointAIndex = edge.steps.findIndex((point) => point === pointA);
      let pointBIndex = edge.steps.findIndex((point) => point === pointB);
      let forcedMovedAxis: 'x' | 'y' | null = null;

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

      const startMouseCanvas = this.diagram.canvas.inverseFit(
        new Coordinates(ev),
      );

      if (wasInitiallyStraight) {
        const startPointA = edge.steps[0].copy().nonObserved;
        const startPointB = edge.steps[1].copy().nonObserved;
        const dx = Math.abs(startPointA.x - startPointB.x);
        const dy = Math.abs(startPointA.y - startPointB.y);

        this.drag = {
          edge,
          midpoint,
          pointA: edge.steps[0],
          pointB: edge.steps[1],
          pointAIndex: 0,
          pointBIndex: 1,
          movedAxis: dx <= dy ? 'x' : 'y',
          startMouseCanvas,
          startPointA,
          startPointB,
          wasInitiallyStraight: true,
        };

        this.uns = bind(
          bindDocument(this, 'mousemove', this.handleMouseMove),
          bindDocument(this, 'pointermove', this.handleMouseMove as any),
        );
        return;
      }

      // Straight two-point edges are fully static; expand them so the first drag
      // can insert a bend while preserving fixed gateway lead segments.
      this.ensureStraightEdgeBendable(edge);
      pointAIndex = edge.steps.findIndex((point) => point === pointA);
      pointBIndex = edge.steps.findIndex((point) => point === pointB);
      if (pointAIndex < 0 || pointBIndex < 0) {
        pointAIndex = 0;
        pointBIndex = 1;
      }

      if (pointAIndex > pointBIndex) {
        [pointAIndex, pointBIndex] = [pointBIndex, pointAIndex];
      }

      if (pointAIndex === 0 && edge.steps[0].mode === 'static') {
        const preparedSource = this.prepareSourceEndpointAdjacentDrag(edge);
        pointAIndex = preparedSource.pointAIndex;
        pointBIndex = preparedSource.pointBIndex;
        forcedMovedAxis = this.axisPerpendicularToGateway(edge.from.orientation);
      }
      if (
        pointBIndex === edge.steps.length - 1 &&
        edge.steps.at(-1)?.mode === 'static'
      ) {
        const preparedTarget = this.prepareTargetEndpointAdjacentDrag(edge);
        pointAIndex = preparedTarget.pointAIndex;
        pointBIndex = preparedTarget.pointBIndex;
        forcedMovedAxis = this.axisPerpendicularToGateway(edge.to.orientation);
      }

      const prepared = this.isolateStaticDraggedEndpoint(
        edge,
        pointAIndex,
        pointBIndex,
      );
      if (!prepared) {
        runInAction(() => {
          edge.state.dragging = false;
        });
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

      const startPointA = edge.steps[pointAIndex].copy().nonObserved;
      const startPointB = edge.steps[pointBIndex].copy().nonObserved;
      const dx = Math.abs(startPointA.x - startPointB.x);
      const dy = Math.abs(startPointA.y - startPointB.y);
      const movedAxis = forcedMovedAxis ?? (dx <= dy ? 'x' : 'y');
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
        wasInitiallyStraight,
      };

      this.uns = bind(
        bindDocument(this, 'mousemove', this.handleMouseMove),
        bindDocument(this, 'pointermove', this.handleMouseMove as any),
      );
    }
  }

  startEndpointDrag(ev: DEdgeEndpointDragStartEvent) {
    if (!ev.cancelled) {
      ev.stopImmediatePropagation();
      this.uns();

      runInAction(() => {
        ev.src.state.dragging = true;
      });

      this.drag = null;
      this.endpointDrag = {
        edge: ev.src,
        endpoint: ev.endpoint,
      };

      this.uns = bind(
        bindDocument(this, 'mousemove', this.handleMouseMove),
        bindDocument(this, 'pointermove', this.handleMouseMove as any),
      );
    }
  }

  protected scheduleEndpointRecompute() {
    if (!this.endpointDrag) return;

    const { edge, endpoint } = this.endpointDrag;
    const movedSide = endpoint;
    const gateway = movedSide === 'from' ? edge.from : edge.to;

    gateway.recomputeConnectedEdge(edge, movedSide);
  }

  protected handleEndpointMouseMove(ev: AnyMouseEvent) {
    if (!this.endpointDrag) return;

    const { edge, endpoint } = this.endpointDrag;
    const gateway = endpoint === 'from' ? edge.from : edge.to;

    if (gateway.state.allowDisplace === false) {
      return;
    }

    const mouseCanvas = this.diagram.canvas.inverseFit(new Coordinates(ev));
    const displacement = gateway.connectionDisplacement(mouseCanvas);

    if (endpoint === 'from') {
      edge.state.displacementStart = displacement;
    } else {
      edge.state.displacementEnd = displacement;
    }

    this.scheduleEndpointRecompute();
  }

  protected handleMouseMove(ev: AnyMouseEvent) {
    if (this.endpointDrag) {
      this.handleEndpointMouseMove(ev);
      return;
    }

    if (!this.drag) return;

    const mouseCanvas = this.diagram.canvas.inverseFit(new Coordinates(ev));

    if (this.drag.wasInitiallyStraight) {
      this.updateStraightEdgeDragPath(mouseCanvas);
      return;
    }

    if (this.drag.edge.steps.length === 2) {
      const edge = this.drag.edge;
      const prepared = this.prepareSourceEndpointAdjacentDrag(edge);
      let pointAIndex = prepared.pointAIndex;
      let pointBIndex = prepared.pointBIndex;

      ({ pointAIndex, pointBIndex } = this.duplicateBoundaryPointsIfRequired(
        edge,
        pointAIndex,
        pointBIndex,
        'y',
      ));

      const pointA = edge.steps[pointAIndex];
      const pointB = edge.steps[pointBIndex];
      if (pointA.mode !== 'static') pointA.mode = 'manual';
      if (pointB.mode !== 'static') pointB.mode = 'manual';

      const dx = Math.abs(pointA.x - pointB.x);
      const dy = Math.abs(pointA.y - pointB.y);
      this.drag = {
        ...this.drag,
        pointA,
        pointB,
        pointAIndex,
        pointBIndex,
        movedAxis: dx <= dy ? 'x' : 'y',
        startPointA: pointA.copy().nonObserved,
        startPointB: pointB.copy().nonObserved,
      };
    }

    const a = this.drag.pointA;
    const b = this.drag.pointB;

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

    const proposals: EdgePointPositionProposal[] = [];
    if (a.mode !== 'static') {
      proposals.push(new EdgePointPositionProposal(a, this.drag.movedAxis));
    }
    if (b.mode !== 'static' && b !== a) {
      proposals.push(new EdgePointPositionProposal(b, this.drag.movedAxis));
    }

    if (proposals.length > 0) {
      this.emit(new DDragEdgeSegmentEvent(this, proposals, this.drag.movedAxis, ev));
      for (const p of proposals) {
        p.point.assign(p.get());
      }
    }

    const noMovement =
      this.isSamePoint(a, this.drag.startPointA) && this.isSamePoint(b, this.drag.startPointB);
    if (noMovement) {
      return;
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
        let hasProtectedLead = false;
        for (let k = i; k < j; k++) {
          if (this.isProtectedLeadPoint(edge, k)) {
            hasProtectedLead = true;
            break;
          }
        }
        if (hasProtectedLead) {
          i = j;
          continue;
        }

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

      if (this.isProtectedLeadPoint(edge, i)) {
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

      if (this.isProtectedLeadPoint(edge, i + 1) || this.isProtectedLeadPoint(edge, i + 2)) {
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

    // Final simplification guard: drop redundant collinear interior points while
    // preserving endpoint anchors and protected gateway lead points.
    for (let changed = true; changed; ) {
      changed = false;
      for (let i = 1; i < edge.state.steps.length - 1; i++) {
        if (this.isProtectedLeadPoint(edge, i)) {
          continue;
        }
        const a = edge.state.steps[i - 1];
        const b = edge.state.steps[i];
        const c = edge.state.steps[i + 1];
        if (b.mode === 'static') {
          continue;
        }
        if (!this.areAxisAligned(a, b) || !this.areAxisAligned(b, c)) {
          continue;
        }
        if (!this.areCollinear(a, b, c)) {
          continue;
        }
        edge.state.steps.splice(i, 1);
        changed = true;
        break;
      }
    }
  }

  protected finalizeDraggedEdge(edge: Edge, keep: EdgePoint[] = []) {
    // Re-run simplification without transient drag-point protections so repeated
    // drags cannot accumulate malformed geometry (including diagonal segments).
    this.simplifyEdgeAfterDrag(edge, keep);

    // Absolute safety net: keep inserting orthogonal corners until no diagonal
    // segment remains even if previous passes skipped something.
    for (let pass = 0; pass < 8; pass++) {
      const before = edge.state.steps.length;
      let hasDiagonal = false;
      for (let i = 0; i < edge.state.steps.length - 1; i++) {
        if (!this.areAxisAligned(edge.state.steps[i], edge.state.steps[i + 1])) {
          hasDiagonal = true;
          break;
        }
      }
      if (!hasDiagonal) {
        return;
      }
      this.ensureOrthogonalAdjacency(edge);
      if (edge.state.steps.length === before) {
        break;
      }
    }
  }

  protected ensureManualAnchorAfterDrag(edge: Edge) {
    if (edge.state.steps.some((p) => p.mode === 'manual')) {
      return;
    }
    if (edge.state.steps.length <= 2) {
      return;
    }

    const preferred = Math.min(2, edge.state.steps.length - 2);
    const candidate =
      edge.state.steps[preferred].mode !== 'static'
        ? edge.state.steps[preferred]
        : edge.state.steps.find((p, i) => i > 0 && i < edge.state.steps.length - 1 && p.mode !== 'static');

    if (candidate && candidate.mode !== 'static') {
      candidate.mode = 'manual';
    }
  }

  protected handleMouseUp() {
    if (!this.drag && !this.endpointDrag) return;

    if (this.drag) {
      if (this.drag.wasInitiallyStraight) {
        this.ensureOrthogonalAdjacency(this.drag.edge);
      } else {
        this.finalizeDraggedEdge(this.drag.edge, [this.drag.pointA, this.drag.pointB]);
      }
      this.ensureManualAnchorAfterDrag(this.drag.edge);
    }

    runInAction(() => {
      if (this.drag) {
        this.drag.edge.state.dragging = false;
      }
      if (this.endpointDrag) {
        this.endpointDrag.edge.state.dragging = false;
      }

      this.drag = null;
      this.endpointDrag = null;
    });

    this.uns();
  }
}

