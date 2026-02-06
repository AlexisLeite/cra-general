import { findBestPathBetweenNodes } from '../../util/paths/findBestPathBetweenNodes';
import type { TGatewayState } from '../types';
import type { TOrientation } from '../types';
import type { Edge } from './Edge';
import { EdgePoint } from './EdgePoint';
import type { Node } from './Node';
import { Diagram } from '../Diagram';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';
import { action, makeObservable, observable, reaction, toJS } from 'mobx';
import { Element } from './Element';

const AXIS_EPSILON = 0.001;

export class Gateway extends Element {
  state: TGatewayState;

  constructor(
    public parent: Node<any>,
    state: Pick<
      TGatewayState,
      'maxIncomingConnections' | 'maxOutgoingConnections' | 'orientation' | 'id'
    > &
      Partial<TGatewayState>,
  ) {
    super(parent);

    this.state = {
      allowDisplace: true,
      stroke: 'transparent',
      strokeWidth: 10,
      radius: 5,
      incomingEdges: [],
      outgoingEdges: [],
      position: new Coordinates(),
      ...state,
    };

    makeObservable(this, {
      addIncomingEdge: action,
      addOutgoingEdge: action,
      state: observable,
      removeIncomingEdge: action,
      removeOutgoingEdge: action,
    });

    reaction(
      () => this.state.incomingEdges,
      (e) => {
        console.log(toJS(e));
      },
    );
  }

  addIncomingEdge(edge: Edge) {
    if (!this.state.incomingEdges.find((c) => c.id === edge.id)) {
      this.state.incomingEdges.push(edge);
    }
  }

  addOutgoingEdge(edge: Edge) {
    if (!this.state.outgoingEdges.find((c) => c.id === edge.id)) {
      this.state.outgoingEdges.push(edge);
      this.updateEdges();
    }
  }

  canConnect(from: Gateway): boolean {
    return (
      (this.state.maxIncomingConnections === undefined ||
        this.state.maxIncomingConnections > this.state.incomingEdges.length) &&
      !this.state.incomingEdges.find((c) => c.from === from)
    );
  }

  connectionDisplacement(c: Coordinates) {
    if (this.direction === 'horizontal') {
      if (Math.abs(c.y - this.coordinates.y) > 10) {
        return new Coordinates([0, c.y - this.coordinates.y]);
      }
    }
    if (this.direction === 'vertical') {
      if (Math.abs(c.x - this.coordinates.x) > 10) {
        return new Coordinates([c.x - this.coordinates.x, 0]);
      }
    }

    return new Coordinates([0, 0]);
  }

  connectionDistance(c: Coordinates) {
    if (this.direction === 'vertical') {
      const disalignment = Math.abs(this.coordinates.y - c.y);

      if (disalignment < 20) {
        return Math.abs(this.coordinates.x - c.x) + disalignment ** 5;
      }

      return Infinity;
    }

    const disalignment = Math.abs(this.coordinates.x - c.x);

    if (disalignment < 20) {
      return Math.abs(this.coordinates.y - c.y) + disalignment ** 5;
    }
    return Infinity;
  }

  removeIncomingEdge(edge: Edge) {
    for (let i = 0; i < this.state.incomingEdges.length; i++) {
      if (this.state.incomingEdges[i].id === edge.id) {
        this.state.incomingEdges.splice(i, 1);
        break;
      }
    }
  }

  removeOutgoingEdge(edge: Edge) {
    for (let i = 0; i < this.state.outgoingEdges.length; i++) {
      if (this.state.outgoingEdges[i].id === edge.id) {
        this.state.outgoingEdges.splice(i, 1);
        break;
      }
    }
  }

  get coordinates() {
    return this.state.position
      .copy()
      .multiply(this.parent.box.size)
      .sum(this.parent.coordinates);
  }

  get fill() {
    return this.state.fill;
  }

  get diagram() {
    return this.parent.diagram!;
  }

  get incomingEdges() {
    return [...this.state.incomingEdges];
  }

  get outgoingEdges() {
    return [...this.state.outgoingEdges];
  }

  get radius() {
    return this.state.radius;
  }

  get relativePosition() {
    return this.state.position.copy();
  }

  get stroke() {
    return this.state.stroke;
  }

  get strokeWidth() {
    return this.state.strokeWidth;
  }

  get id() {
    return this.state.id;
  }

  get direction() {
    return ['down', 'up'].includes(this.state.orientation)
      ? 'vertical'
      : 'horizontal';
  }

  get orientation() {
    return this.state.orientation;
  }

  private getLastManualIndex(edge: Edge) {
    for (let i = edge.steps.length - 1; i >= 0; i--) {
      if (edge.steps[i].mode === 'manual') {
        return i;
      }
    }
    return -1;
  }

  private orientationFromPoints(
    from: Coordinates,
    to: Coordinates,
  ): TOrientation {
    const dx = to.x - from.x;
    const dy = to.y - from.y;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0 ? 'right' : 'left';
    }

    return dy >= 0 ? 'down' : 'up';
  }

  private oppositeOrientation(orientation: TOrientation): TOrientation {
    switch (orientation) {
      case 'down':
        return 'up';
      case 'left':
        return 'right';
      case 'right':
        return 'left';
      case 'up':
        return 'down';
    }
  }

  private createVirtualGateway(
    point: Coordinates,
    orientation: TOrientation,
  ): Gateway {
    return {
      coordinates: point.copy(),
      orientation,
      parent: {
        box: new Dimensions([...point.raw, 0, 0]),
      },
    } as Gateway;
  }

  private getManualBlockFromStart(edge: Edge) {
    const start = edge.steps.findIndex((step) => step.mode === 'manual');
    if (start === -1) {
      return null;
    }

    let end = start;
    while (
      end + 1 < edge.steps.length &&
      edge.steps[end + 1].mode === 'manual'
    ) {
      end += 1;
    }

    return { start, end };
  }

  private getManualBlockFromEnd(edge: Edge) {
    const end = this.getLastManualIndex(edge);
    if (end === -1) {
      return null;
    }

    let start = end;
    while (start - 1 >= 0 && edge.steps[start - 1].mode === 'manual') {
      start -= 1;
    }

    return { start, end };
  }

  private inferLockedAxisForManualBlock(
    edge: Edge,
    start: number,
    end: number,
  ): 'x' | 'y' {
    for (let i = start; i < end; i++) {
      const a = edge.steps[i];
      const b = edge.steps[i + 1];

      if (Math.abs(a.x - b.x) < AXIS_EPSILON) {
        return 'x';
      }
      if (Math.abs(a.y - b.y) < AXIS_EPSILON) {
        return 'y';
      }
    }

    const next = edge.steps[end + 1];
    const current = edge.steps[start];

    if (next) {
      if (Math.abs(next.x - current.x) < AXIS_EPSILON) {
        return 'x';
      }
      if (Math.abs(next.y - current.y) < AXIS_EPSILON) {
        return 'y';
      }
    }

    return 'x';
  }

  private projectPointToLockedAxisLine(
    source: Coordinates,
    anchor: Coordinates,
    lockedAxis: 'x' | 'y',
  ) {
    if (lockedAxis === 'x') {
      return new Coordinates([anchor.x, source.y]);
    }
    return new Coordinates([source.x, anchor.y]);
  }

  private shiftManualPointAlongFreeAxis(
    edge: Edge,
    pointIndex: number,
    lockedAxis: 'x' | 'y',
    targetPoint: Coordinates,
  ) {
    const reference = edge.steps[pointIndex];

    if (lockedAxis === 'x') {
      const deltaY = targetPoint.y - reference.y;
      if (Math.abs(deltaY) < AXIS_EPSILON) return;

      edge.steps[pointIndex].y += deltaY;
      return;
    }

    const deltaX = targetPoint.x - reference.x;
    if (Math.abs(deltaX) < AXIS_EPSILON) return;

    edge.steps[pointIndex].x += deltaX;
  }

  private areOnSameAxis(a: Coordinates, b: Coordinates) {
    return (
      Math.abs(a.x - b.x) < AXIS_EPSILON || Math.abs(a.y - b.y) < AXIS_EPSILON
    );
  }

  private chooseOrthogonalCorner(
    from: Coordinates,
    to: Coordinates,
    previous?: Coordinates,
    next?: Coordinates,
  ) {
    const c1 = new Coordinates([to.x, from.y]);
    const c2 = new Coordinates([from.x, to.y]);

    const score = (candidate: Coordinates) => {
      let value = 0;
      if (previous && this.areOnSameAxis(previous, candidate)) {
        value += 1;
      }
      if (next && this.areOnSameAxis(candidate, next)) {
        value += 1;
      }
      return value;
    };

    return score(c1) >= score(c2) ? c1 : c2;
  }

  private orthogonalize(steps: Coordinates[]) {
    if (steps.length < 2) {
      return steps;
    }

    const result: Coordinates[] = [];

    for (let i = 0; i < steps.length - 1; i++) {
      const current = steps[i];
      const next = steps[i + 1];

      result.push(current);

      if (!this.areOnSameAxis(current, next)) {
        const previous =
          result.length >= 2 ? result[result.length - 2] : undefined;
        const nextAfter = i + 2 < steps.length ? steps[i + 2] : undefined;
        result.push(
          this.chooseOrthogonalCorner(current, next, previous, nextAfter),
        );
      }
    }

    result.push(steps.at(-1)!);

    return result;
  }

  private pickPointToKeepFromRun(points: Coordinates[]) {
    const asEdgePoints = points.filter(
      (p) => p instanceof EdgePoint,
    ) as EdgePoint[];

    const staticPoint = asEdgePoints.find((p) => p.mode === 'static');
    if (staticPoint) return staticPoint;

    const manualPoint = asEdgePoints.find((p) => p.mode === 'manual');
    if (manualPoint) return manualPoint;

    return points[0];
  }

  private simplify(steps: Coordinates[]) {
    const result: Coordinates[] = [];

    for (let i = 0; i < steps.length; ) {
      let j = i + 1;
      while (
        j < steps.length &&
        Math.abs(steps[i].x - steps[j].x) < AXIS_EPSILON &&
        Math.abs(steps[i].y - steps[j].y) < AXIS_EPSILON
      ) {
        j += 1;
      }

      const run = steps.slice(i, j);
      const keepPoint = this.pickPointToKeepFromRun(run);
      result.push(keepPoint);
      i = j;

      while (result.length >= 3) {
        const a = result.at(-3)!;
        const b = result.at(-2)!;
        const c = result.at(-1)!;

        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        const modeA = a instanceof EdgePoint ? a.mode : 'auto';
        const modeB = b instanceof EdgePoint ? b.mode : 'auto';
        const modeC = c instanceof EdgePoint ? c.mode : 'auto';

        const canCollapseAutoMiddle = modeB === 'auto';
        const canCollapseManualTriplet =
          modeA === 'manual' && modeB === 'manual' && modeC === 'manual';

        if (
          Math.abs(cross) < AXIS_EPSILON &&
          (canCollapseAutoMiddle || canCollapseManualTriplet)
        ) {
          result.splice(result.length - 2, 1);
        } else {
          break;
        }
      }
    }

    return result;
  }

  private ensureOrthogonalAdjacency(steps: Coordinates[]) {
    if (steps.length < 2) return steps;

    const result: Coordinates[] = [steps[0]];

    for (let i = 1; i < steps.length; i++) {
      const current = result.at(-1)!;
      const next = steps[i];

      if (!this.areOnSameAxis(current, next)) {
        const previous =
          result.length >= 2 ? result[result.length - 2] : undefined;
        const nextAfter = i + 1 < steps.length ? steps[i + 1] : undefined;
        result.push(
          this.chooseOrthogonalCorner(current, next, previous, nextAfter),
        );
      }

      result.push(next);
    }

    return result;
  }

  private mergeAndNormalize(left: Coordinates[], right: Coordinates[]) {
    const merged = [...left, ...right];
    return this.ensureOrthogonalAdjacency(
      this.simplify(this.orthogonalize(merged)),
    );
  }

  private async recomputeEdge(edge: Edge, movedSide: 'from' | 'to') {
    const fullPath = () =>
      findBestPathBetweenNodes(
        this.diagram!,
        edge.from,
        edge.to,
        edge.state.displacementStart,
        edge.state.displacementEnd,
      );

    if (!edge.hasManualSteps) {
      edge.setSteps(await fullPath());
      return;
    }

    const firstManualIndex = edge.steps.findIndex(
      (step) => step.mode === 'manual',
    );
    const lastManualIndex = this.getLastManualIndex(edge);

    if (
      firstManualIndex <= 0 ||
      lastManualIndex <= 0 ||
      firstManualIndex >= edge.steps.length - 1 ||
      lastManualIndex >= edge.steps.length - 1
    ) {
      edge.setSteps(await fullPath());
      return;
    }

    if (movedSide === 'from') {
      const manualBlock = this.getManualBlockFromStart(edge);
      if (!manualBlock) {
        edge.setSteps(await fullPath());
        return;
      }

      const anchor = edge.steps[manualBlock.start];
      const fromCoordinates = edge.from.coordinates
        .copy()
        .sum(edge.state.displacementStart || new Coordinates([0, 0]));
      const lockedAxis = this.inferLockedAxisForManualBlock(
        edge,
        manualBlock.start,
        manualBlock.end,
      );
      const projectedAnchor = this.projectPointToLockedAxisLine(
        fromCoordinates,
        anchor,
        lockedAxis,
      );

      const virtualTarget = this.createVirtualGateway(
        projectedAnchor,
        this.oppositeOrientation(
          this.orientationFromPoints(fromCoordinates, projectedAnchor),
        ),
      );

      const prefix = await findBestPathBetweenNodes(
        this.diagram!,
        edge.from,
        virtualTarget,
        edge.state.displacementStart,
      );

      const joinPoint = prefix.at(-1);
      if (joinPoint) {
        this.shiftManualPointAlongFreeAxis(
          edge,
          manualBlock.start,
          lockedAxis,
          joinPoint,
        );
      }

      edge.setSteps(
        this.mergeAndNormalize(
          prefix.slice(0, Math.max(0, prefix.length - 1)),
          edge.steps.slice(manualBlock.start),
        ),
      );
      return;
    }

    const manualBlock = this.getManualBlockFromEnd(edge);
    if (!manualBlock) {
      edge.setSteps(await fullPath());
      return;
    }

    const anchor = edge.steps[manualBlock.end];
    const toCoordinates = edge.to.coordinates
      .copy()
      .sum(edge.state.displacementEnd || new Coordinates([0, 0]));
    const lockedAxis = this.inferLockedAxisForManualBlock(
      edge,
      manualBlock.start,
      manualBlock.end,
    );
    const projectedAnchor = this.projectPointToLockedAxisLine(
      toCoordinates,
      anchor,
      lockedAxis,
    );

    const virtualSource = this.createVirtualGateway(
      projectedAnchor,
      this.orientationFromPoints(projectedAnchor, toCoordinates),
    );

    const suffix = await findBestPathBetweenNodes(
      this.diagram!,
      virtualSource,
      edge.to,
      undefined,
      edge.state.displacementEnd,
    );

    const suffixStart = suffix[0];
    if (suffixStart) {
      this.shiftManualPointAlongFreeAxis(
        edge,
        manualBlock.end,
        lockedAxis,
        suffixStart,
      );
    }

    edge.setSteps(
      this.mergeAndNormalize(
        edge.steps.slice(0, manualBlock.end + 1),
        suffix.slice(1),
      ),
    );
  }

  async recomputeConnectedEdge(edge: Edge, movedSide: 'from' | 'to') {
    await this.recomputeEdge(edge, movedSide);
  }

  async updateEdges() {
    for await (const edge of this.state.incomingEdges) {
      await this.recomputeEdge(edge, 'to');
    }
    for await (const edge of this.state.outgoingEdges) {
      await this.recomputeEdge(edge, 'from');
    }
  }

  get remainingSlots() {
    return this.state.maxOutgoingConnections - this.state.outgoingEdges.length;
  }

  deserialize(c: ReturnType<(typeof this)['serialize']>) {
    this.state.fill = c.fill;
    this.state.id = c.id;
    this.state.orientation = c.orientation;
    this.state.radius = c.radius;
    this.state.stroke = c.stroke;
    this.state.strokeWidth = c.strokeWidth;

    this.state.position.assign(c.coordinates);

    c.outEdges.forEach((edgeState) => {
      const edge = new (Diagram.getClass(edgeState.class))(this, {
        from: this,
      }) as Edge;

      if (this.diagram.getNodeById(edgeState.toParentId)) {
        edge.deserialize(edgeState);
      }
    });
  }

  serialize() {
    const {
      fill,
      id,
      orientation,
      radius,
      stroke,
      strokeWidth,
      state: {
        position: { raw: coordinates },
      },
    } = this;

    const outEdges = this.outgoingEdges.map((e) => {
      return e.serialize();
    });

    return {
      coordinates,
      fill,
      id,
      orientation,
      radius,
      stroke,
      strokeWidth,
      outEdges,
      class: this.constructor.name,
    };
  }
}
