import { Coordinates } from '../primitives/Coordinates';
import type { Midpoint } from '../../components/objects/RenderEdge';
import { EdgePoint } from '../elements/EdgePoint';
import { Edge } from '../elements/Edge';
import { findBestPathBetweenNodes } from './paths/findBestPathBetweenNodes';
import { type AnyMouseEvent, DEdgeDragStartEvent } from '../elements/Events';
import { bind, documentBind } from '../../util/bindCb';
import { DiagramExtension } from './DiagramExtension';

type DragContext = {
  edge: Edge;
  midpoint: Midpoint;
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

  uns = () => {};
  startDrag(ev: DEdgeDragStartEvent) {
    if (!ev.cancelled) {
      ev.stopImmediatePropagation();
      this.uns();

      const edge = ev.src;
      const midpoint = ev.midPoint;

      edge.state.dragging = true;

      midpoint.points.forEach((c) => ((c as EdgePoint).mode = 'manual'));

      const startMouseCanvas = this.diagram.canvas.inverseFit(
        new Coordinates(ev),
      );

      const startPointA = midpoint.points[0].copy().nonObserved;
      const startPointB = midpoint.points[1].copy().nonObserved;

      this.drag = {
        edge,
        midpoint,
        startMouseCanvas,
        startPointA,
        startPointB,
      };

      this.uns = bind(documentBind(this, 'mousemove', this.handleMouseMove));
    }
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

    if (this.diagram.snapToGrid) {
      a.snapToGrid(this.diagram.gridSize, isHorizontal ? 'x' : 'y');
      b.snapToGrid(this.diagram.gridSize, isHorizontal ? 'x' : 'y');
    }

    this.drag.edge.setSteps(
      findBestPathBetweenNodes(
        this.diagram,
        this.drag.edge.from,
        this.drag.edge.to,
      ),
    );
  }

  protected handleMouseUp() {
    if (!this.drag) return;

    this.drag.edge.state.dragging = false;
    this.drag = null;
  }
}
