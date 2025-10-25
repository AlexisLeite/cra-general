import { MouseEvent as RMEv } from 'react';
import type { Diagram } from '../Diagram';
import type { Node } from '../elements/Node';
import { Coordinates, TDirectedPoint } from '../primitives/Coordinates';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { findBestAnglePathAsync } from './paths/findBestAnglePathWorker';

export class NodesConnector {
  constructor(public diagram: Diagram) {
    makeObservable<
      NodesConnector,
      | 'arrowTo'
      | 'handleMouseMove'
      | 'startNode'
      | 'candidateNode'
      | 'handleMouseUp'
      | '_arrowSteps'
    >(this, {
      _arrowSteps: observable,
      arrowTo: observable,
      candidateNode: observable,
      startConnectionFrom: action,
      handleMouseMove: action,
      startNode: observable,
      handleMouseUp: action,
    });
  }

  protected arrowTo: Coordinates | null = null;
  protected startNode: Node | null = null;
  protected candidateNode: Node | null = null;

  protected previousArrowTo: Coordinates | null = null;
  protected previousCandidateNode: Node | null = null;

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
        !this.startNode ||
        (this.candidateNode &&
          this.previousCandidateNode === this.candidateNode)
      ) {
        return;
      }

      const arrowTo = this.diagram.canvas
        .inverseFit(this.arrowTo)
        .divide(this.diagram.gridSize / 2).round;

      if (!this.candidateNode && this.previousArrowTo) {
        if (arrowTo.copy().substract(this.previousArrowTo).norm < 1) {
          return;
        }
      }

      this.previousCandidateNode = this.candidateNode;
      this.previousArrowTo = arrowTo;

      const startPoints = [
        this.startNode!.box.leftMiddle.divide(this.diagram.gridSize / 2)
          .round.toDirectedPoint('left')
          .stepForward().rawDirectedPoint,
        this.startNode!.box.rightMiddle.divide(this.diagram.gridSize / 2)
          .round.toDirectedPoint('right')
          .stepForward().rawDirectedPoint,
        this.startNode!.box.topMiddle.divide(this.diagram.gridSize / 2)
          .round.toDirectedPoint('up')
          .stepForward().rawDirectedPoint,
        this.startNode!.box.bottomMiddle.divide(this.diagram.gridSize / 2)
          .round.toDirectedPoint('down')
          .stepForward().rawDirectedPoint,
      ];

      let endPoints: TDirectedPoint[] = [];

      if (this.candidateNode) {
        endPoints = [
          this.candidateNode!.box.leftMiddle.divide(this.diagram.gridSize / 2)
            .round.toDirectedPoint('right')
            .stepBack().rawDirectedPoint,
          this.candidateNode!.box.rightMiddle.divide(this.diagram.gridSize / 2)
            .round.toDirectedPoint('left')
            .stepBack().rawDirectedPoint,
          this.candidateNode!.box.topMiddle.divide(this.diagram.gridSize / 2)
            .round.toDirectedPoint('down')
            .stepBack().rawDirectedPoint,
          this.candidateNode!.box.bottomMiddle.divide(this.diagram.gridSize / 2)
            .round.toDirectedPoint('up')
            .stepBack().rawDirectedPoint,
        ];
      } else {
        endPoints = [
          arrowTo.toDirectedPoint('left').stepBack().rawDirectedPoint,
          arrowTo.toDirectedPoint('right').stepBack().rawDirectedPoint,
          arrowTo.toDirectedPoint('up').stepBack().rawDirectedPoint,
          arrowTo.toDirectedPoint('down').stepBack().rawDirectedPoint,
        ];
      }

      const bestPath = await findBestAnglePathAsync(
        this.diagram,
        startPoints,
        endPoints,
      );

      runInAction(() => {
        this._arrowSteps = bestPath.map((c) =>
          this.diagram.canvas.fit(
            new Coordinates([c.x, c.y]).multiply(this.diagram.gridSize / 2),
          ),
        );
      });
    } finally {
      this.calculating = false;
    }
  }

  protected unsubscribeEvents = () => {};
  startConnectionFrom(node: Node, ev: RMEv) {
    ev.nativeEvent.stopImmediatePropagation();
    this.startNode = node;
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

    for (const node of this.diagram.nodes) {
      if (node.box.collides(this.diagram.canvas.inverseFit(this.arrowTo))) {
        this.candidateNode = node;
        this.calculateArrowSteps();
        return;
      }
    }

    this.candidateNode = null;
    this.calculateArrowSteps();
  }

  protected handleMouseUp() {
    if (
      this.candidateNode &&
      this.startNode &&
      this.candidateNode.canConnect(this.startNode) &&
      this.arrowSteps.length
    ) {
      const edge = this.diagram.connect(this.startNode, this.candidateNode);
      const simplified = this.simplifyToCorners(this.arrowSteps);
      edge.setSteps(simplified.map((c) => this.diagram.canvas.inverseFit(c)));
    }

    this._arrowSteps = [];
    this.startNode = null;
    this.arrowTo = null;
    this.candidateNode = null;
    this.previousArrowTo = null;
    this.previousCandidateNode = null;

    this.unsubscribeEvents();
  }

  // Reduce a per-cell step path to only corner points (axis-aligned polyline)
  protected simplifyToCorners(points: Coordinates[]): Coordinates[] {
    if (points.length <= 2) return [...points];

    const out: Coordinates[] = [];
    const eq = (a: Coordinates, b: Coordinates) => a.x === b.x && a.y === b.y;

    // Always keep the first point
    out.push(points[0]);

    for (let i = 1; i < points.length - 1; i++) {
      const a = out[out.length - 1];
      const b = points[i];
      const c = points[i + 1];

      // Drop duplicates
      if (eq(b, a)) continue;

      // If a, b, c are collinear horizontally or vertically, b is redundant
      const collinear =
        (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
      if (collinear) continue;

      out.push(b);
    }

    // Always keep the last point
    const last = points[points.length - 1];
    if (!eq(last, out[out.length - 1])) out.push(last);

    return out;
  }
}
