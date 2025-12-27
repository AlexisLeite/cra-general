import { Diagram } from '../Diagram';

import { Node } from '../elements/Node';
import { Coordinates } from '../primitives/Coordinates';
import { Mouse } from '../../util/Mouse';
import {
  DDragProposalEvent,
  DMouseDownEvent,
  DMouseUpEvent,
  DragProposal,
  DScaleEvent,
  DDeleteNodeEvent,
} from '../elements/Events';
import { bind, diagramBind } from '../../util/bindCb';
import { DiagramExtension } from './DiagramExtension';
import { Selector } from './Selector';
import { Dimensions } from '../primitives/Dimensions';

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
  init() {
    this.diagram.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
      this.diagram.priorities.Mouse_Down_Dragger,
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
  protected unsubscribeScaleEvent = () => {};
  protected unsubscribeMouseUp = () => {};
  protected interval = -1;

  public startDrag(node: Node) {
    this.draggingNodes.clear();
    this.draggingNodes.set(node.id, {
      node,
      startPoint: node.coordinates.copy(),
    });
    this.startPoint = Mouse.getInstance().coordinates;
    this.startPointScaled = this.diagram.canvas.inverseFit(this.startPoint);

    this.handleDragAction();
  }

  protected originalEvent: DMouseDownEvent | null = null;
  protected handleMouseDown(ev: DMouseDownEvent) {
    ev.stopImmediatePropagation();
    this.originalEvent = ev;

    const node = ev.node;
    if (!ev.cancelled && node && node.selected) {
      ev.cancel();

      this.draggingNodes.clear();
      this.diagram.getExtension(Selector).selection.forEach((c) => {
        this.draggingNodes.set(c.id, {
          node: c,
          startPoint: c.coordinates.copy(),
        });
      });

      this.startPoint = new Coordinates(ev.originalEvent);
      this.startPointScaled = this.diagram.canvas.inverseFit(
        new Coordinates(ev.originalEvent),
      );

      this.handleDragAction();

      this.unsubscribeMouseUp();
      this.unsubscribeMouseUp = bind(
        diagramBind(
          this,
          DMouseUpEvent,
          this.handleMouseUp,
          this.diagram.priorities.Mouse_Up_Dragger,
        ),
      );
    }
  }

  protected handleDragAction() {
    this.unsubscribeScaleEvent();
    this.unsubscribeScaleEvent = this.diagram.onEvent(
      DScaleEvent,
      ({ newScale, previousScale }) => {
        this.startPoint.divide(previousScale).multiply(newScale);
      },
    );

    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(this.handleDragInterval.bind(this), 30) as any;
  }

  private calcDisplacement(distanceFromEdge: number) {
    if (!this.diagram.rules.displaceWhenDragOnEdges) {
      return 0;
    }

    return ((100 - distanceFromEdge) / 10) ** 2;
  }

  protected handleDragInterval() {
    const mouse = Mouse.getInstance().coordinates;

    if (this.draggingNodes.size) {
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
          new DragProposal(
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
          new DDragProposalEvent(
            this,
            proposals,
            this.originalEvent!.originalEvent,
          ),
        ).cancelled
      ) {
        proposals.forEach((c) => {
          if (!c.cancelled) {
            c.node.setPosition(c.newBox.coordinates);
          }
        });
      }
    }
  }

  protected handleMouseUp() {
    this.draggingNodes.clear();
    this.unsubscribeScaleEvent();
    this.unsubscribeMouseUp();
    clearInterval(this.interval);
  }

  protected handleScale(_ev: DScaleEvent) {
    if (this.draggingNodes.size) {
      /* empty */
    }
  }
}
