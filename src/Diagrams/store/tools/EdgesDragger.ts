import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../Diagram';
import type { Node } from '../elements/Node';
import type { EdgePoint } from '../elements/EdgePoint';

export class EdgesDragger {
  constructor(public diagram: Diagram) {
    makeAutoObservable(this);
  }

  startDrag(
    nodeA: Node,
    nodeB: Node,
    pointA: EdgePoint,
    pointB: EdgePoint,
    ev: MouseEvent,
  ) {
    // Temporary: only log received params.
    // eslint-disable-next-line no-console
    console.log('[EdgesDragger.startDrag]', {
      nodeA,
      nodeB,
      pointA,
      pointB,
      ev,
    });

    console.log(...pointA.raw, ...pointB.raw);
  }
}
