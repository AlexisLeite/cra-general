import { MouseEvent as RMEv } from 'react';
import type { Diagram } from '../Diagram';
import { Node } from '../elements/Node';
import { Coordinates } from '../primitives/Coordinates';
import { action, makeObservable, observable, runInAction } from 'mobx';
import {
  findBestPathBetweenNodes,
  Path,
} from './paths/findBestPathBetweenNodes';
import { Dimensions } from '../primitives/Dimensions';
import type { Gateway } from '../elements/Gateway';
import { reducePath } from './paths/reducePath';

export class NodesConnector {
  constructor(public diagram: Diagram) {
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
  protected candidateGateway: Gateway | null = null;

  protected previousArrowTo: Coordinates | null = null;
  protected previousCandidateGateway: Gateway | null = null;

  protected _arrowSteps: Coordinates[] = [];
  public get arrowSteps() {
    return this._arrowSteps;
  }

  // Prevent overlapping expensive computations; skip if one is running
  protected calculating = false;

  protected async calculateArrowSteps() {
    if (this.calculating) return;
    if (!this.arrowTo) return;
    this.calculating = true;
    try {
      if (
        !this.startGateway ||
        (this.candidateGateway &&
          this.previousCandidateGateway === this.candidateGateway)
      ) {
        return;
      }

      const arrowTo = this.diagram.canvas
        .inverseFit(this.arrowTo)
        .divide(this.diagram.gridSize / 2).round;

      if (!this.candidateGateway && this.previousArrowTo) {
        if (arrowTo.copy().substract(this.previousArrowTo).norm < 1) {
          return;
        }
      }

      let bestPath: Path | null = null;

      if (this.candidateGateway) {
        bestPath = await findBestPathBetweenNodes(
          this.diagram,
          this.startGateway!,
          this.candidateGateway!,
        );
      } else {
        const fakeNode = new Node({
          id: 'fake',
          label: '',
          box: new Dimensions([
            ...this.diagram.canvas.inverseFit(this.arrowTo).raw,
            0,
            0,
          ]),
        });

        bestPath = await findBestPathBetweenNodes(
          this.diagram,
          this.startGateway!,
          fakeNode.getGateway('left')!,
        );
      }

      runInAction(() => {
        if (this.startGateway) {
          this._arrowSteps = bestPath.map((c) =>
            this.diagram.canvas.fit(new Coordinates([c.x, c.y])),
          );
        }
      });
    } finally {
      this.calculating = false;
    }
  }

  protected unsubscribeEvents = () => {};
  startConnectionFrom(gateway: Gateway, ev: RMEv) {
    ev.nativeEvent.stopImmediatePropagation();
    this.startGateway = gateway;
    this.arrowTo = new Coordinates(ev);

    const fn1 = this.handleMouseMove.bind(this);
    const fn2 = this.handleMouseUp.bind(this);

    document.addEventListener('mousemove', fn1);
    document.addEventListener('mouseup', fn2);

    this.unsubscribeEvents = () => {
      document.removeEventListener('mousemove', fn1);
      document.removeEventListener('mouseup', fn2);
    };
  }

  protected handleMouseMove(ev: MouseEvent) {
    this.arrowTo = new Coordinates(new Coordinates(ev));

    const box = this.diagram.canvas.elementDimensions;

    const displacement = new Coordinates([0, 0]);

    if (this.arrowTo.x < box.x) {
      displacement.sum([(box.x - this.arrowTo.x) * 0.1, 0]);
    } else if (this.arrowTo.x > box.width) {
      displacement.substract([(this.arrowTo.x - box.width) * 0.1, 0]);
    } else if (this.arrowTo.y < box.y) {
      displacement.sum([0, (box.y - this.arrowTo.y) * 0.1]);
    } else if (this.arrowTo.y > box.height) {
      displacement.substract([0, (this.arrowTo.y - box.height) * 0.1]);
    }

    if (displacement.norm > 0) {
      this.diagram.canvas.displace(displacement);
    }

    for (const node of this.diagram.nodes.reduce<Gateway[]>(
      (acc, cur) => [...acc, ...cur.gateways],
      [],
    )) {
      const arrowOnPlane = this.diagram.canvas.inverseFit(this.arrowTo);
      if (
        node !== this.startGateway &&
        node.coordinates
          .toDimensions(new Coordinates([20, 20]))
          .copy()
          .translate(new Coordinates([-10, -10]))
          .collides(arrowOnPlane)
      ) {
        this.candidateGateway = node;
        this.calculateArrowSteps();

        return;
      }
    }

    this.candidateGateway = null;
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
        const edge = this.diagram.connect(
          this.startGateway,
          this.candidateGateway,
        );
        const simplified = reducePath(this.arrowSteps);
        edge.setSteps(simplified.map((c) => this.diagram.canvas.inverseFit(c)));
      }
    } finally {
      this._arrowSteps = [];
      this.startGateway = null;
      this.arrowTo = null;
      this.candidateGateway = null;
      this.previousArrowTo = null;
      this.previousCandidateGateway = null;
      this.unsubscribeEvents();
    }
  }
}
