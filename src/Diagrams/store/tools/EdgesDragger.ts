import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../Diagram';
import type { Node } from '../elements/Node';
import type { EdgePoint } from '../elements/EdgePoint';
import type { AnyMouseEvent } from '../Canvas';
import { Coordinates } from '../primitives/Coordinates';

type DragContext = {
  nodeA: Node;
  nodeB: Node;
  pointA: EdgePoint;
  pointB: EdgePoint;
  startMouseCanvas: Coordinates;
  startPointA: Coordinates;
  startPointB: Coordinates;
};

export class EdgesDragger {
  constructor(public diagram: Diagram) {
    makeAutoObservable(this);

    this.diagram.canvas.on('mouseMove', this.handleMouseMove.bind(this));
    this.diagram.canvas.on('mouseUp', this.handleMouseUp.bind(this));
  }

  protected drag: DragContext | null = null;

  startDrag(
    nodeA: Node,
    nodeB: Node,
    pointA: EdgePoint,
    pointB: EdgePoint,
    ev: MouseEvent,
  ) {
    ev.preventDefault();

    const startMouseCanvas = this.diagram.canvas.inverseFit(
      new Coordinates(ev),
    );

    const startPointA = pointA.copy().nonObserved;
    const startPointB = pointB.copy().nonObserved;

    this.drag = {
      nodeA,
      nodeB,
      pointA,
      pointB,
      startMouseCanvas,
      startPointA,
      startPointB,
    };
  }

  protected handleMouseMove(ev: AnyMouseEvent) {
    if (!this.drag) return;

    const mouseCanvas = this.diagram.canvas.inverseFit(new Coordinates(ev));
    const delta = mouseCanvas.nonObserved.substract(this.drag.startMouseCanvas);

    // Apply delta to original points; persist via assign() as requested.
    this.drag.pointA.assign(this.drag.startPointA.copy().sum(delta));
    this.drag.pointB.assign(this.drag.startPointB.copy().sum(delta));

    // Optional: mark as manual if your logic expects it.
    this.drag.pointA.mode = 'manual';
    this.drag.pointB.mode = 'manual';
  }

  protected handleMouseUp() {
    if (!this.drag) return;
    this.drag = null;
  }
}
