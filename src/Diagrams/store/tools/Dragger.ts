import { Diagram } from '../Diagram';

import { makeAutoObservable } from 'mobx';
import type { AnyMouseEvent, ScaleEvent } from '../Canvas';
import type { Node } from '../Node';
import { Coordinates } from '../Coordinates';
import { Mouse } from '../../util/Mouse';

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

    this.diagram.canvas.on('mouseDown', this.handleMouseDown.bind(this), 500);
    this.diagram.canvas.on('mouseUp', this.handleMouseUp.bind(this));
    this.diagram.canvas.on('scale', this.handleScale.bind(this));
  }

  protected draggingNodes: { node: Node; startPoint: Coordinates }[] = [];
  protected startPoint: Coordinates = new Coordinates();
  protected startPointScaled: Coordinates = new Coordinates();
  protected unsubscribe = () => {};
  protected interval = -1;

  protected handleMouseDown(ev: AnyMouseEvent) {
    const nodeG = (ev.target as HTMLElement).closest<SVGGElement>(
      '.diagram__node',
    );
    if (nodeG) {
      const node = this.diagram.getNodeById(nodeG.dataset.id!);
      if (node?.selected) {
        this.draggingNodes = this.diagram.selectedNodes.map((c) => ({
          node: c,
          startPoint: c.coordinates.copy(),
        }));

        this.startPoint = new Coordinates(ev);
        this.startPointScaled = this.diagram.canvas.inverseFit(
          new Coordinates(ev),
        );

        this.unsubscribe = this.diagram.canvas.on(
          'scale',
          ({ newScale, previousScale }) => {
            this.startPoint.divide(previousScale).multiply(newScale);
          },
        );

        this.interval = setInterval(
          this.handleDragInterval.bind(this),
          30,
        ) as any;
      }
    }
  }
  protected handleDragInterval() {
    const mouse = Mouse.getInstance().coordinates;

    if (this.draggingNodes.length) {
      if (mouse.x < this.diagram.canvas.frameDimensions.x + 100) {
        const diff =
          20 *
          Math.log(this.diagram.canvas.frameDimensions.x + 100 - mouse.x + 1);
        this.diagram.canvas.displace(new Coordinates([diff, 0]));
        // this.startPoint.sum(displaced.multiply(this.diagram.canvas.scale));
      } else if (
        mouse.x >
        this.diagram.canvas.frameDimensions.x +
          this.diagram.canvas.frameDimensions.width -
          100
      ) {
        const diff =
          20 *
          Math.log(
            mouse.x -
              (this.diagram.canvas.frameDimensions.x +
                this.diagram.canvas.frameDimensions.width -
                100) +
              1,
          );
        this.diagram.canvas.displace(new Coordinates([-diff, 0]));
        // this.startPoint.sum(displaced.multiply(this.diagram.canvas.scale));
      }
      if (mouse.y < this.diagram.canvas.frameDimensions.y + 100) {
        const diff =
          20 *
          Math.log(this.diagram.canvas.frameDimensions.y + 100 - mouse.y + 1);
        this.diagram.canvas.displace(new Coordinates([0, diff]));
        // this.startPoint.sum(
        //   new Coordinates(displaced).multiply(this.diagram.canvas.scale),
        // );
      } else if (
        mouse.y >
        this.diagram.canvas.frameDimensions.y +
          this.diagram.canvas.frameDimensions.height -
          100
      ) {
        const diff =
          20 *
          Math.log(
            mouse.y -
              (this.diagram.canvas.frameDimensions.y +
                this.diagram.canvas.frameDimensions.height -
                100) +
              1,
          );
        this.diagram.canvas.displace(new Coordinates([0, -diff]));
        // this.startPoint.sum(displaced.multiply(this.diagram.canvas.scale));
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

      console.log('compensation', compensation.toString());

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
        this.diagram.selectNode(c.node, false, true);
      });
    }
  }

  protected handleMouseUp() {
    this.draggingNodes = [];
    this.unsubscribe();
    clearInterval(this.interval);
  }

  protected handleScale(ev: ScaleEvent) {
    if (this.draggingNodes.length) {
    }
  }
}
