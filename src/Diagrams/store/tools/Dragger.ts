import { Diagram } from '../Diagram';

import { makeAutoObservable } from 'mobx';
import type { AnyMouseEvent } from '../Canvas';
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
  }

  protected draggingNodes: { node: Node; startPoint: Coordinates }[] = [];
  protected startPoint: Coordinates = new Coordinates();
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
        this.unsubscribe = this.diagram.canvas.on(
          'scale',
          ({ newScale, previousScale }) => {
            this.startPoint.divide(previousScale).multiply(newScale);
          },
        );

        this.interval = setInterval(this.handleMouseMove.bind(this), 30) as any;
      }
    }
  }
  protected handleMouseMove() {
    const { x: clientX, y: clientY } = Mouse.getInstance();

    if (this.draggingNodes.length) {
      if (clientX < this.diagram.canvas.frameDimensions.x + 100) {
        const diff = this.diagram.canvas.frameDimensions.x + 100 - clientX;
        const displaced = this.diagram.canvas.displace(
          new Coordinates([diff, 0]),
        );
        this.startPoint.sum(displaced.multiply(this.diagram.canvas.scale));
      } else if (
        clientX >
        this.diagram.canvas.frameDimensions.x +
          this.diagram.canvas.frameDimensions.width -
          100
      ) {
        const diff =
          clientX -
          (this.diagram.canvas.frameDimensions.x +
            this.diagram.canvas.frameDimensions.width -
            100);
        const displaced = this.diagram.canvas.displace(
          new Coordinates([-diff, 0]),
        );
        this.startPoint.sum(displaced.multiply(this.diagram.canvas.scale));
      }
      if (clientY < this.diagram.canvas.frameDimensions.y + 100) {
        const diff = this.diagram.canvas.frameDimensions.y + 100 - clientY;
        const displaced = this.diagram.canvas.displace(
          new Coordinates([0, diff]),
        );
        this.startPoint.sum(
          new Coordinates(displaced).multiply(this.diagram.canvas.scale),
        );
      } else if (
        clientY >
        this.diagram.canvas.frameDimensions.y +
          this.diagram.canvas.frameDimensions.height -
          100
      ) {
        const diff =
          clientY -
          (this.diagram.canvas.frameDimensions.y +
            this.diagram.canvas.frameDimensions.height -
            100);
        const displaced = this.diagram.canvas.displace(
          new Coordinates([0, -diff]),
        );
        this.startPoint.sum(displaced.multiply(this.diagram.canvas.scale));
      }

      const mouse = new Coordinates([clientX, clientY]);
      this.draggingNodes.forEach((c) => {
        c.node.setPosition(
          c.startPoint
            .copy()
            .sum(
              mouse
                .copy()
                .substract(this.startPoint)
                .divide(this.diagram.canvas.scale),
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
}
