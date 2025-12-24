import { Diagram } from '../Diagram';

import { makeAutoObservable } from 'mobx';
import type { Node } from '../elements/Node';
import { Coordinates } from '../primitives/Coordinates';
import { Mouse } from '../../util/Mouse';
import { DMouseDownEvent, DScaleEvent } from '../elements/Events';

/**
 * Conditions for dragging:
 *
 * - The mouse down must have been done in a node
 * - The selection mode isn't enabled
 * - The mouse button is the left click
 */

/**
 */
export class Dragger {
  constructor(public diagram: Diagram) {
    makeAutoObservable(this);

    this.diagram.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
      diagram.priorities.Dragger_Mouse_Down,
    );
    this.diagram.onEvent(
      DScaleEvent,
      this.handleScale.bind(this),
      diagram.priorities.Dragger_Scale,
    );
  }

  protected draggingNodes: { node: Node; startPoint: Coordinates }[] = [];
  protected startPoint: Coordinates = new Coordinates();
  protected startPointScaled: Coordinates = new Coordinates();
  protected unsubscribeMouseMove = () => {};
  protected unsubscribeMouseUp = () => {};
  protected interval = -1;

  public startDrag(node: Node) {
    this.draggingNodes = [{ node, startPoint: node.coordinates.copy() }];
    this.startPoint = Mouse.getInstance().coordinates;
    this.startPointScaled = this.diagram.canvas.inverseFit(this.startPoint);

    this.handleDragAction();
  }

  protected handleMouseDown(ev: DMouseDownEvent) {
    ev.stopImmediatePropagation();

    if (!ev.cancelled) {
      const nodeG = (
        ev.originalEvent.target as HTMLElement
      ).closest<SVGGElement>('.diagram__node');
      if (nodeG) {
        const node = this.diagram.getNodeById(nodeG.dataset.id!);
        if (node?.selected) {
          this.draggingNodes = [...this.diagram.selector.selection].map(
            (c) => ({
              node: c,
              startPoint: c.coordinates.copy(),
            }),
          );

          this.startPoint = new Coordinates(ev.originalEvent);
          this.startPointScaled = this.diagram.canvas.inverseFit(
            new Coordinates(ev.originalEvent),
          );

          this.handleDragAction();

          const hmup = () => {
            this.handleMouseUp();
          };
          document.addEventListener('mouseup', hmup);
          this.unsubscribeMouseUp();
          this.unsubscribeMouseUp = () => {
            document.removeEventListener('mouseup', hmup);
          };
        }
      }
    }
  }

  protected handleDragAction() {
    this.unsubscribeMouseMove();
    this.unsubscribeMouseMove = this.diagram.onEvent(
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

    if (this.draggingNodes.length) {
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

      this.draggingNodes.forEach((c) => {
        c.node.setPosition(
          c.startPoint
            .copy()
            .sum(
              mouse
                .copy()
                .substract(this.startPoint)
                .divide(this.diagram.canvas.scale)
                .substract(compensation),
            ),
        );
      });
    }
  }

  protected handleMouseUp() {
    this.draggingNodes = [];
    this.unsubscribeMouseMove();
    this.unsubscribeMouseUp();
    clearInterval(this.interval);
  }

  protected handleScale(ev: DScaleEvent) {
    if (this.draggingNodes.length) {
    }
  }
}
