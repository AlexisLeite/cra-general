import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../Diagram';
import type { AnyMouseEvent } from '../Canvas';
import { Coordinates } from '../primitives/Coordinates';
import { Midpoint } from '../../components/objects/RenderEdge';
import { MouseEvent } from 'react';
import { EdgePoint } from '../elements/EdgePoint';

type DragContext = {
  midpoint: Midpoint;
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

  startDrag(midpoint: Midpoint, ev: MouseEvent) {
    ev.preventDefault();

    midpoint.edge.steps.forEach((c) => (c.mode = 'auto'));
    midpoint.points.forEach((c) => ((c as EdgePoint).mode = 'manual'));

    const startMouseCanvas = this.diagram.canvas.inverseFit(
      new Coordinates(ev),
    );

    const startPointA = midpoint.points[0].copy().nonObserved;
    const startPointB = midpoint.points[1].copy().nonObserved;

    this.drag = {
      midpoint,
      startMouseCanvas,
      startPointA,
      startPointB,
    };
  }

  protected handleMouseMove(ev: AnyMouseEvent) {
    if (!this.drag) return;

    const a = this.drag.midpoint.points[0];
    const b = this.drag.midpoint.points[1];

    const mouseCanvas = this.diagram.canvas.inverseFit(new Coordinates(ev));
    const delta = mouseCanvas.nonObserved.substract(this.drag.startMouseCanvas);

    const isHorizontal = a.x === b.x;

    if (isHorizontal) {
      delta.y = 0;
    } else {
      delta.x = 0;
    }

    a.assign(this.drag.startPointA.copy().sum(delta));
    b.assign(this.drag.startPointB.copy().sum(delta));
  }

  protected handleMouseUp() {
    if (!this.drag) return;
    this.drag = null;
  }
}
