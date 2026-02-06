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

export class NodesConnector extends DiagramExtension {
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

  // Prevent overlapping expensive computations; queue only the latest request.
  protected calculating = false;
  protected calculationPending = false;

  protected get snap() {
    return this.diagram.getExtension(GridSnap);
  }

  protected async calculateArrowSteps() {
    if (!this.startGateway || !this.arrowTo) return;

    this.calculationPending = true;
    if (this.calculating) return;

    this.calculating = true;

    try {
      while (this.calculationPending) {
        this.calculationPending = false;

        const startGateway = this.startGateway;
        const candidateGateway = this.candidateGateway;
        const arrowToScreen = this.arrowTo?.copy();

        if (!startGateway || !arrowToScreen) {
          runInAction(() => {
            this._arrowSteps = [];
          });
          continue;
        }

        const arrowToPlane = this.diagram.canvas.inverseFit(arrowToScreen);
        const arrowToGrid = arrowToPlane
          .copy()
          .divide(this.snap.gridSize / 2).round;

        let bestPath: Coordinates[] = [];

        if (candidateGateway) {
          bestPath = await findBestPathBetweenNodes(
            this.diagram,
            startGateway,
            candidateGateway,
            new Coordinates([0, 0]),
            candidateGateway.connectionDisplacement(arrowToPlane),
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

          bestPath = await findBestPathBetweenNodes(
            this.diagram,
            startGateway,
            fakeNode.getGateway(which)!,
          );
        }

        runInAction(() => {
          if (this.startGateway === startGateway) {
            this._arrowSteps = bestPath.map((c) => new Coordinates([c.x, c.y]));
          }
        });
      }
    } finally {
      this.calculating = false;
    }
  }

  protected u = () => {};
  startConnectionFrom(gateway: Gateway, ev: RMEv) {
    if (
      !this.emit(new DNodeConnectionIntentEvent(this, gateway.parent)).cancelled
    ) {
      ev.nativeEvent.stopImmediatePropagation();
      this.startGateway = gateway;
      this.arrowTo = new Coordinates(ev);

      this.u();
      this.u = bind(
        bindDiagram(this, DMouseMoveEvent, this.handleMouseMove),
        bindDiagram(this, DMouseUpEvent, this.handleMouseUp),
      );
    }
  }

  protected handleMouseMove(ev: DMouseMoveEvent) {
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
    this.calculateArrowSteps();
  }

  protected handleMouseUp() {
    try {
      if (
        this.candidateGateway &&
        this.startGateway &&
        this.candidateGateway.canConnect(this.startGateway) &&
        this.arrowSteps.length
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
      this.startGateway = null;
      this.arrowTo = null;
      this.candidateGateway = null;
      this.calculationPending = false;
      this.u();
    }
  }
}
