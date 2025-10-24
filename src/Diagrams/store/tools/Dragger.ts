import type { Diagram } from '../Diagram';

import { makeAutoObservable } from 'mobx';
import type { AnyMouseEvent } from '../Canvas';
import type { Node } from '../Node';
import { Coordinates } from '../Coordinates';

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
    this.diagram.canvas.on('mouseMove', this.handleMouseMove.bind(this));
    this.diagram.canvas.on('mouseUp', this.handleMouseUp.bind(this));
  }

  draggingNodes: { node: Node; startPoint: Coordinates }[] = [];
  startPoint: Coordinates = new Coordinates();

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
        this.startPoint = new Coordinates([ev.clientX, ev.clientY]);
      }
    }
  }
  protected handleMouseMove(ev: AnyMouseEvent) {
    if (this.draggingNodes.length) {
      const mouse = new Coordinates([ev.clientX, ev.clientY]);
      this.draggingNodes.forEach((c) => {
        c.node.setPosition(
          c.startPoint.copy().sum(mouse.copy().substract(this.startPoint)),
        );
        this.diagram.selectNode(c.node, false, true);
      });
    }
  }
  protected handleMouseUp() {
    this.draggingNodes = [];
  }
}
