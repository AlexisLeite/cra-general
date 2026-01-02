import { Diagram } from '../Diagram';

import { Node } from '../elements/Node';
import { Coordinates } from '../primitives/Coordinates';
import { Mouse } from '../../util/Mouse';
import {
  DDragNodeEvent,
  DMouseDownEvent,
  NodePositionProposal,
  DScaleEvent,
  DDeleteNodeEvent,
  DMouseUpEvent,
  type AnyMouseEvent,
} from '../elements/Events';
import { DiagramExtension } from './DiagramExtension';
import { Dimensions } from '../primitives/Dimensions';
import { Selector } from './Selector';
import { bind, bindDiagram, bindInterval } from '../../util/binders';

/**
 * Conditions for dragging:
 *
 * - The mouse down must have been done in a node
 * - The selection mode isn't enabled
 * - The mouse button is the left click
 */

/**
 */
export class Dragger extends DiagramExtension {
  private dragThreshold = 10;

  init() {
    this.diagram.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
      this.diagram.priorities.Mouse_Down_Dragger,
    );
    this.diagram.onEvent(
      DMouseUpEvent,
      this.handleMouseUp.bind(this),
      this.diagram.priorities.Mouse_Up_Dragger,
    );
    this.diagram.onEvent(
      DScaleEvent,
      this.handleScale.bind(this),
      this.diagram.priorities.Scale_Dragger,
    );
    this.diagram.onEvent(DDeleteNodeEvent, (ev) => {
      this.draggingNodes.delete(ev.node.id);
    });
  }

  constructor(public parent: Diagram) {
    super(parent);
  }

  protected draggingNodes: Map<
    string,
    { node: Node<any>; startPoint: Coordinates }
  > = new Map();
  protected startPoint: Coordinates = new Coordinates();
  protected startPointScaled: Coordinates = new Coordinates();
  protected unsubscribe = () => {};

  public startDrag(node: Node) {
    this.draggingNodes.clear();
    this.draggingNodes.set(node.id, {
      node,
      startPoint: node.box.middle,
    });
    this.startPoint = Mouse.getInstance().coordinates.sum(
      node.box.size.divide(2),
    );
    this.startPointScaled = this.diagram.canvas.inverseFit(this.startPoint);

    this.handleDragAction();
  }

  protected originalEvent: DMouseDownEvent | null = null;
  protected handleMouseDown(ev: DMouseDownEvent) {
    this.originalEvent = ev;

    const node = ev.node;
    if (!ev.cancelled && node && node.selected) {
      ev.cancel();

      this.draggingNodes.clear();

      this.startPoint = new Coordinates(ev.originalEvent);
      this.startPointScaled = this.diagram.canvas.inverseFit(
        new Coordinates(ev.originalEvent),
      );

      this.handleDragAction();
    }
  }

  protected handleDragAction() {
    this.unsubscribe();
    this.unsubscribe = bind(
      bindDiagram(this, DScaleEvent, ({ newScale, previousScale }) => {
        this.startPoint.divide(previousScale).multiply(newScale);
      }),
      bindInterval(this.handleDragInterval.bind(this), 30),
    );
  }

  private calcDisplacement(distanceFromEdge: number) {
    if (!this.diagram.rules.displaceWhenDragOnEdges) {
      return 0;
    }

    return ((100 - distanceFromEdge) / 10) ** 2;
  }

  protected handleDragInterval() {
    const mouse = Mouse.getInstance().coordinates;

    if (!this.draggingNodes.size) {
      this.diagram.getExtension(Selector).selectedNodes.forEach((c) => {
        this.draggingNodes.set(c.id, {
          node: c,
          startPoint: c.coordinates.copy(),
        });
      });

      if (!this.draggingNodes.size) {
        this.unsubscribe();
      }
    }

    if (
      this.draggingNodes.size &&
      mouse.copy().substract(this.startPoint).norm > this.dragThreshold
    ) {
      if (mouse.x < this.diagram.canvas.frameDimensions.x + 100) {
        const diff = this.calcDisplacement(
          mouse.x - this.diagram.canvas.frameDimensions.x,
        );
        this.diagram.canvas.displace(new Coordinates([diff, 0]));
      } else if (
        mouse.x >
        this.diagram.canvas.frameDimensions.x +
          this.diagram.canvas.frameDimensions.width -
          100
      ) {
        const diff = this.calcDisplacement(
          this.diagram.canvas.frameDimensions.x +
            this.diagram.canvas.frameDimensions.width -
            mouse.x,
        );
        this.diagram.canvas.displace(new Coordinates([-diff, 0]));
      }
      if (mouse.y < this.diagram.canvas.frameDimensions.y + 100) {
        const diff = this.calcDisplacement(
          mouse.y - this.diagram.canvas.frameDimensions.y,
        );
        this.diagram.canvas.displace(new Coordinates([0, diff]));
      } else if (
        mouse.y >
        this.diagram.canvas.frameDimensions.y +
          this.diagram.canvas.frameDimensions.height -
          100
      ) {
        const diff = this.calcDisplacement(
          this.diagram.canvas.frameDimensions.y +
            this.diagram.canvas.frameDimensions.height -
            mouse.y,
        );
        this.diagram.canvas.displace(new Coordinates([0, -diff]));
      }

      /**
       * I have startPoint and startPointScaled
       *
       * Given the new mousePoint, and the difference startPoint-mousePoint
       * And the difference between startPointScaled and scale(startPoint)
       *
       * May I get a formula that allows me to determine the displaced
       * scaled element point? YES!
       */

      const rescaledStartPoint = this.diagram.canvas.inverseFit(
        this.startPoint,
      );
      const compensation = this.startPointScaled
        .copy()
        .substract(rescaledStartPoint);

      const proposals = [...this.draggingNodes.values()].map(
        (c) =>
          new NodePositionProposal(
            c.node,
            new Dimensions([
              ...c.startPoint
                .copy()
                .sum(
                  mouse
                    .copy()
                    .substract(this.startPoint)
                    .divide(this.diagram.canvas.scale)
                    .substract(compensation),
                ).raw,
              ...c.node.box.size.raw,
            ]),
          ),
      );

      if (
        !this.emit(
          new DDragNodeEvent(
            this,
            proposals,
            this.originalEvent?.originalEvent as AnyMouseEvent,
          ),
        ).cancelled
      ) {
        proposals.forEach((c) => {
          if (!c.cancelled) {
            c.node.setPosition(c.get().coordinates);
          }
        });
      }
    }
  }

  protected handleMouseUp() {
    this.draggingNodes.clear();
    this.unsubscribe();
  }

  protected handleScale(_ev: DScaleEvent) {
    if (this.draggingNodes.size) {
      /* empty */
    }
  }
}
