import { MouseEvent as RMEv } from 'react';
import type { Diagram } from './Diagram';
import type { Node } from './Node';
import { Coordinates } from './Coordinates';
import { action, computed, makeObservable, observable } from 'mobx';

export class NodesConnector {
  constructor(public diagram: Diagram) {
    makeObservable<
      NodesConnector,
      | 'arrowTo'
      | 'handleMouseMove'
      | 'startNode'
      | 'candidateNode'
      | 'handleMouseUp'
    >(this, {
      arrowSteps: computed,
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

  public get arrowSteps() {
    if (!this.startNode) {
      return null;
    }

    return [
      this.diagram.canvas.fit(this.startNode!.box.rightMiddle),

      this.candidateNode
        ? this.diagram.canvas.fit(this.candidateNode.box.copy().leftMiddle)
        : this.arrowTo!,
    ];
  }

  protected unsubscribeEvents = () => {};
  startConnectionFrom(node: Node, ev: RMEv) {
    ev.nativeEvent.stopImmediatePropagation();
    this.startNode = node;
    this.arrowTo = new Coordinates([ev.clientX, ev.clientY]);

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
    this.arrowTo = new Coordinates(new Coordinates([ev.clientX, ev.clientY]));

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
        return;
      }
    }

    this.candidateNode = null;
  }

  protected handleMouseUp() {
    if (
      this.candidateNode &&
      this.startNode &&
      this.candidateNode.canConnect(this.startNode)
    ) {
      this.diagram.connect(this.startNode, this.candidateNode);
    }

    this.startNode = null;
    this.arrowTo = null;
    this.candidateNode = null;

    this.unsubscribeEvents();
  }
}
