import type { MouseEvent as RMEv } from 'react';
import { Node } from '../elements/Node';
import { Coordinates } from '../primitives/Coordinates';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { findBestPathBetweenNodes } from '../../util/paths/findBestPathBetweenNodes';
import { Dimensions } from '../primitives/Dimensions';
import type { Gateway } from '../elements/Gateway';
import type { TOrientation } from '../types';
import { bind, bindDiagram } from '../../util/binders';
import { DiagramExtension } from './DiagramExtension';
import {
  DMouseMoveEvent,
  DMouseUpEvent,
  DNodeConnectionIntentEvent,
  DNodesConnectActionEvent,
} from '../elements/Events';
import { GridSnap } from './GridSnap';
import { stepFromGateway } from '../../util/paths/stepBackFromGateway';

export class NodesConnector extends DiagramExtension {
  protected hasRoutedPreview = false;
  protected previewRequestVersion = 0;
  protected previewRafId: number | null = null;

  init() {
    makeObservable<
      NodesConnector,
      | 'arrowTo'
      | 'handleMouseMove'
      | 'startGateway'
      | 'candidateGateway'
      | 'handleMouseUp'
      | '_arrowSteps'
    >(this, {
      _arrowSteps: observable,
      arrowTo: observable,
      candidateGateway: observable,
      startConnectionFrom: action,
      handleMouseMove: action,
      startGateway: observable,
      handleMouseUp: action,
    });
  }

  protected arrowTo: Coordinates | null = null;
  protected startGateway: Gateway | null = null;
  candidateGateway: Gateway | null = null;

  protected _arrowSteps: Coordinates[] = [];
  public get arrowSteps() {
    return this._arrowSteps;
  }

  protected get snap() {
    return this.diagram.getExtension(GridSnap);
  }

  protected calculateArrowSteps() {
    if (!this.startGateway || !this.arrowTo) return;

    const startGateway = this.startGateway;
    const candidateGateway = this.candidateGateway;
    const arrowToScreen = this.arrowTo?.copy();
    const requestVersion = this.previewRequestVersion;

    if (!startGateway || !arrowToScreen) {
      runInAction(() => {
        this._arrowSteps = [];
      });
      return;
    }

    try {
      const arrowToPlane = this.diagram.canvas.inverseFit(arrowToScreen);
      const previewGridStep = this.snap.gridSize / 2;
      const arrowToGrid = arrowToPlane
        .copy()
        .divide(previewGridStep)
        .round
        .multiply(previewGridStep);

      let bestPath: Coordinates[] = [];

      if (candidateGateway) {
        bestPath = findBestPathBetweenNodes(
          this.diagram,
          startGateway,
          candidateGateway,
          new Coordinates([0, 0]),
          candidateGateway.connectionDisplacement(arrowToPlane),
        );
        bestPath = this.normalizeCandidatePreviewPath(
          bestPath.map((c) => new Coordinates([c.x, c.y])),
          startGateway,
          candidateGateway,
        );
      } else {
        const fakeNode = new Node(null, {
          id: 'fake',
          label: '',
          box: new Dimensions([...arrowToGrid.raw, 0, 0]),
        });

        const dx = startGateway.coordinates.substract(
          fakeNode.getGateway('down')!.coordinates,
        ).x;
        const dy = startGateway.coordinates.substract(
          fakeNode.getGateway('down')!.coordinates,
        ).y;

        const which: TOrientation =
          Math.abs(dx) > Math.abs(dy)
            ? dx >= 0
              ? 'right'
              : 'left'
            : dy >= 0
              ? 'down'
              : 'up';

        bestPath = findBestPathBetweenNodes(
          this.diagram,
          startGateway,
          fakeNode.getGateway(which)!,
        );
      }

      runInAction(() => {
        if (
          this.startGateway === startGateway &&
          requestVersion === this.previewRequestVersion
        ) {
          this._arrowSteps = bestPath.map((c) => new Coordinates([c.x, c.y]));
          this.hasRoutedPreview = this._arrowSteps.length > 1;
        }
      });
    } catch {
      // Keep current preview if routing fails for a transient frame while dragging.
    }
  }

  protected orthogonalMousePreview(
    startGateway: Gateway,
    mouseOnPlane: Coordinates,
  ) {
    const previewGridStep = this.snap.gridSize / 2;
    const snappedMouse = mouseOnPlane
      .copy()
      .divide(previewGridStep)
      .round
      .multiply(previewGridStep);
    const start = startGateway.coordinates.copy();
    const stepped = stepFromGateway(this.snap.gridSize, start, startGateway.orientation);

    const points: Coordinates[] = [start, stepped];

    if (Math.abs(stepped.x - snappedMouse.x) < 0.001 || Math.abs(stepped.y - snappedMouse.y) < 0.001) {
      points.push(snappedMouse);
      return this.compactPreviewPoints(points);
    }

    const c1 = new Coordinates([stepped.x, snappedMouse.y]);
    const c2 = new Coordinates([snappedMouse.x, stepped.y]);

    const dx = Math.abs(snappedMouse.x - stepped.x);
    const dy = Math.abs(snappedMouse.y - stepped.y);
    points.push(dx >= dy ? c2 : c1, snappedMouse);

    return this.compactPreviewPoints(points);
  }

  protected compactPreviewPoints(points: Coordinates[]) {
    const result: Coordinates[] = [];
    for (const p of points) {
      const last = result.at(-1);
      if (last && Math.abs(last.x - p.x) < 0.001 && Math.abs(last.y - p.y) < 0.001) {
        continue;
      }
      result.push(p);

      while (result.length >= 3) {
        const a = result.at(-3)!;
        const b = result.at(-2)!;
        const c = result.at(-1)!;
        const sameX = Math.abs(a.x - b.x) < 0.001 && Math.abs(b.x - c.x) < 0.001;
        const sameY = Math.abs(a.y - b.y) < 0.001 && Math.abs(b.y - c.y) < 0.001;
        if (sameX || sameY) {
          result.splice(result.length - 2, 1);
        } else {
          break;
        }
      }
    }
    return result;
  }

  protected areOnSameAxis(a: Coordinates, b: Coordinates) {
    return Math.abs(a.x - b.x) < 0.001 || Math.abs(a.y - b.y) < 0.001;
  }

  protected chooseOrthogonalCorner(
    from: Coordinates,
    to: Coordinates,
    previous?: Coordinates,
    next?: Coordinates,
  ) {
    const c1 = new Coordinates([to.x, from.y]);
    const c2 = new Coordinates([from.x, to.y]);

    const score = (candidate: Coordinates) => {
      let value = 0;
      if (previous && this.areOnSameAxis(previous, candidate)) value += 1;
      if (next && this.areOnSameAxis(candidate, next)) value += 1;
      return value;
    };

    return score(c1) >= score(c2) ? c1 : c2;
  }

  protected ensureOrthogonalAdjacency(points: Coordinates[]) {
    if (points.length < 2) return points;
    const result: Coordinates[] = [points[0]];

    for (let i = 1; i < points.length; i++) {
      const current = result.at(-1)!;
      const next = points[i];

      if (!this.areOnSameAxis(current, next)) {
        const previous = result.length >= 2 ? result[result.length - 2] : undefined;
        const nextAfter = i + 1 < points.length ? points[i + 1] : undefined;
        result.push(this.chooseOrthogonalCorner(current, next, previous, nextAfter));
      }

      result.push(next);
    }

    return result;
  }

  protected simplifyOrthogonalPoints(points: Coordinates[]) {
    const result: Coordinates[] = [];

    for (const p of points) {
      const last = result.at(-1);
      if (last && Math.abs(last.x - p.x) < 0.001 && Math.abs(last.y - p.y) < 0.001) {
        continue;
      }
      result.push(p);

      while (result.length >= 3) {
        const a = result.at(-3)!;
        const b = result.at(-2)!;
        const c = result.at(-1)!;
        const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        if (Math.abs(cross) < 0.001) {
          result.splice(result.length - 2, 1);
        } else {
          break;
        }
      }
    }

    return result;
  }

  protected collapseOrthogonalDetours(points: Coordinates[]) {
    const result = [...points];

    for (let i = 0; i < result.length - 3; ) {
      const a = result[i];
      const b = result[i + 1];
      const c = result[i + 2];
      const d = result[i + 3];
      const isOrthChain =
        this.areOnSameAxis(a, b) &&
        this.areOnSameAxis(b, c) &&
        this.areOnSameAxis(c, d);

      if (!isOrthChain || !this.areOnSameAxis(a, d)) {
        i += 1;
        continue;
      }

      result.splice(i + 1, 2);
    }

    return result;
  }

  protected orientationVector(orientation: TOrientation) {
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

  protected ensureEndpointLeadOnPreviewPath(
    points: Coordinates[],
    side: 'from' | 'to',
    gateway: Gateway,
  ) {
    if (points.length < 2) return points;

    const lead = this.snap.gridSize;
    const isFrom = side === 'from';
    const endpointIndex = isFrom ? 0 : points.length - 1;
    const adjacentIndex = isFrom ? 1 : points.length - 2;
    const endpoint = points[endpointIndex];
    const adjacent = points[adjacentIndex];
    const v = this.orientationVector(gateway.orientation);
    const expected = new Coordinates([endpoint.x + v.x * lead, endpoint.y + v.y * lead]);

    if (
      Math.abs(adjacent.x - expected.x) < 0.001 &&
      Math.abs(adjacent.y - expected.y) < 0.001
    ) {
      return points;
    }

    const alignedForward =
      this.areOnSameAxis(endpoint, adjacent) &&
      ((v.x !== 0 &&
        Math.abs(adjacent.y - endpoint.y) < 0.001 &&
        Math.sign(adjacent.x - endpoint.x || 0) === Math.sign(v.x) &&
        Math.abs(adjacent.x - endpoint.x) >= lead - 0.001) ||
        (v.y !== 0 &&
          Math.abs(adjacent.x - endpoint.x) < 0.001 &&
          Math.sign(adjacent.y - endpoint.y || 0) === Math.sign(v.y) &&
          Math.abs(adjacent.y - endpoint.y) >= lead - 0.001));

    if (alignedForward) return points;

    const next = [...points];
    if (isFrom) {
      next.splice(1, 0, expected);
    } else {
      next.splice(next.length - 1, 0, expected);
    }
    return next;
  }

  protected normalizeCandidatePreviewPath(
    points: Coordinates[],
    from: Gateway,
    to: Gateway,
  ) {
    let next = this.collapseOrthogonalDetours(
      this.simplifyOrthogonalPoints(this.ensureOrthogonalAdjacency(points)),
    );
    next = this.ensureEndpointLeadOnPreviewPath(next, 'from', from);
    next = this.ensureEndpointLeadOnPreviewPath(next, 'to', to);
    return this.simplifyOrthogonalPoints(this.ensureOrthogonalAdjacency(next));
  }

  protected cancelScheduledPreview() {
    if (this.previewRafId !== null) {
      cancelAnimationFrame(this.previewRafId);
      this.previewRafId = null;
    }
  }

  protected scheduleCalculateArrowSteps() {
    if (this.previewRafId !== null) {
      return;
    }

    this.previewRafId = requestAnimationFrame(() => {
      this.previewRafId = null;
      this.calculateArrowSteps();
    });
  }

  protected u = () => {};
  startConnectionFrom(gateway: Gateway, ev: RMEv) {
    if (
      !this.emit(new DNodeConnectionIntentEvent(this, gateway.parent)).cancelled
    ) {
      ev.nativeEvent.stopImmediatePropagation();
      this.diagram.canvas.markMouseSessionStartedInFrame();
      this.startGateway = gateway;
      this.arrowTo = new Coordinates(ev);
      this.hasRoutedPreview = false;
      this.previewRequestVersion = 0;
      this._arrowSteps = [gateway.coordinates.copy(), gateway.coordinates.copy()];

      this.u();
      this.u = bind(
        bindDiagram(this, DMouseMoveEvent, this.handleMouseMove),
        bindDiagram(this, DMouseUpEvent, this.handleMouseUp),
      );
    }
  }

  protected handleMouseMove(ev: DMouseMoveEvent) {
    this.previewRequestVersion += 1;
    const box = this.diagram.canvas.frameDimensions;
    this.arrowTo = new Coordinates(ev);
    const displacementPoint = this.arrowTo
      .copy()
      .substract(this.diagram.canvas.framePosition);

    const displacement = new Coordinates([0, 0]);

    if (displacementPoint.x < 100) {
      displacement.sum([(100 - displacementPoint.x) * 0.1, 0]);
    } else if (displacementPoint.x > box.width - 100) {
      displacement.substract([
        (100 - Math.abs(displacementPoint.x - box.width)) * 0.1,
        0,
      ]);
    } else if (displacementPoint.y < 100) {
      displacement.sum([0, (100 - displacementPoint.y) * 0.1]);
    } else if (displacementPoint.y > box.height - 100) {
      displacement.substract([
        0,
        (100 - Math.abs(displacementPoint.y - box.height)) * 0.1,
      ]);
    }

    if (displacement.norm > 0) {
      this.diagram.canvas.displace(displacement);
    }

    const mouseOnPlane = this.diagram.canvas.inverseFit(this.arrowTo);

    const candidates = this.diagram.nodes.filter((node) => {
      const padding = this.snap.gridSize / 2;

      return node.box
        .translate(new Coordinates([-padding, -padding]))
        .sum([0, 0, padding * 2, padding * 2])
        .collides(mouseOnPlane);
    });

    const candidateGateways = candidates
      .flatMap((node) => node.gateways)
      .filter((gateway) => gateway !== this.startGateway);

    const nearestGateway = candidateGateways.reduce<Gateway | null>(
      (closest, gateway) => {
        if (!closest) return gateway;

        const dCurrent = gateway.connectionDistance(mouseOnPlane);
        const dClosest = closest.connectionDistance(mouseOnPlane);

        return dCurrent < dClosest ? gateway : closest;
      },
      null,
    );

    if (nearestGateway) {
      this.candidateGateway = nearestGateway;
    } else {
      this.candidateGateway = null;
    }

    // Always follow the mouse with a direct preview while not hovering a target gateway.
    // This keeps connection creation responsive even if pathfinding is expensive.
    if (!this.candidateGateway) {
      this.hasRoutedPreview = false;
      this._arrowSteps = this.orthogonalMousePreview(this.startGateway!, mouseOnPlane);
      // Also compute the routed preview using the same pathfinder used for actual
      // connections; the orthogonal preview above is only the immediate fallback.
      this.scheduleCalculateArrowSteps();
      return;
    }

    this.calculateArrowSteps();
  }

  protected handleMouseUp() {
    try {
      if (
        this.candidateGateway &&
        this.startGateway &&
        this.candidateGateway.canConnect(this.startGateway)
      ) {
        if (
          !this.emit(
            new DNodesConnectActionEvent(
              this,
              this.startGateway.parent,
              this.candidateGateway.parent,
            ),
          ).cancelled
        ) {
          // Remove transient connector preview before creating the persisted edge
          // to avoid a visible "double edge" race while the real edge recomputes.
          this._arrowSteps = [];

          const dropPoint = this.arrowTo
            ? this.diagram.canvas.inverseFit(this.arrowTo)
            : this.candidateGateway.coordinates;

          this.diagram.connect(this.startGateway, this.candidateGateway, {
            toDisplacement:
              this.candidateGateway.connectionDisplacement(dropPoint),
          });
        }
      }
    } finally {
      this._arrowSteps = [];
      this.hasRoutedPreview = false;
      this.startGateway = null;
      this.arrowTo = null;
      this.candidateGateway = null;
      this.previewRequestVersion = 0;
      this.cancelScheduledPreview();
      this.u();
    }
  }
}
