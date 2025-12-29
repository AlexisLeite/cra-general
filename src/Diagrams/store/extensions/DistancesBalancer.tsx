import { DiagramExtension } from './DiagramExtension';
import { DDragNodeEvent, DMouseUpEvent } from '../elements/Events';
import type { Node } from '../elements/Node';
import { Coordinates } from '../primitives/Coordinates';
import { action, makeObservable, observable } from 'mobx';

/**
 * I need a way to define that a distances marker must be shown.
 *
 * The best way is to just say what are the coordinates for each segment that
 * must be drawn.
 */

type Proposal = {
  from: Coordinates;
  to: Coordinates;
};

export class DistancesBalancer extends DiagramExtension {
  // This is only for reference
  private gridSize = 25;
  proposals: Proposal[] = [];

  clear() {
    this.proposals = [];
  }

  public init(): void {
    makeObservable(this, {
      clear: action,
      proposals: observable,
    });

    this.diagram.onEvent(DMouseUpEvent, () => {
      this.clear();
    });

    this.diagram.onEvent(
      DDragNodeEvent,
      (ev) => {
        this.clear();

        if (this.enabled) {
          const extensionBoundary =
            this.diagram.canvas.frameDimensions.norm / 2;

          if (ev.proposals.length >= 1) {
            const el = ev.proposals[0];

            let minNodeT: Node<any> | null = null;
            let minTop = Infinity;
            let minNodeB: Node<any> | null = null;
            let minBottom = Infinity;

            let minNodeL: Node<any> | null = null;
            let minLeft = Infinity;
            let minNodeR: Node<any> | null = null;
            let minRight = Infinity;

            for (const candidate of this.diagram.nodes) {
              if (
                candidate.id !== el.node.id &&
                el.newBox.copy().substract(candidate.box).norm <
                  extensionBoundary
              ) {
                const distanceX = el.newBox.edgeDistanceX(candidate.box);
                const distanceY = el.newBox.edgeDistanceY(candidate.box);

                if (distanceY === 0) {
                  if (distanceX < 0) {
                    // It's to the left
                    if (minLeft > distanceX) {
                      minLeft = -distanceX;
                      minNodeL = candidate;
                    }
                  } else {
                    // It's to the right
                    if (minRight > distanceX) {
                      minRight = distanceX;
                      minNodeR = candidate;
                    }
                  }
                }

                if (distanceX === 0) {
                  if (distanceY < 0) {
                    // It's above
                    if (minTop > distanceY) {
                      minTop = -distanceY;
                      minNodeT = candidate;
                    }
                  } else {
                    // It's below
                    if (minBottom > distanceY) {
                      minBottom = distanceY;
                      minNodeB = candidate;
                    }
                  }
                }
              }
            }

            if (minNodeT && minNodeB) {
              const distanceT = -el.newBox.edgeDistanceY(minNodeT.box);
              const distanceB = el.newBox.edgeDistanceY(minNodeB.box);

              if (Math.abs(distanceT - distanceB) < this.gridSize) {
                this.proposals.push({
                  from: el.node.box.topMiddle,
                  to: new Coordinates([
                    el.node.box.topMiddle.x,
                    minNodeT.box.bottomMiddle.y,
                  ]),
                });
                this.proposals.push({
                  from: el.node.box.bottomMiddle,
                  to: new Coordinates([
                    el.node.box.bottomMiddle.x,
                    minNodeB.box.topMiddle.y,
                  ]),
                });
                el.updateY(
                  (minNodeT.box.bottomMiddle.y + minNodeB.box.topMiddle.y) / 2 -
                    el.newBox.height / 2,
                );
                el.lockY();
              }
            }

            if (minNodeL && minNodeR) {
              const distanceL = -el.newBox.edgeDistanceX(minNodeL.box);
              const distanceR = el.newBox.edgeDistanceX(minNodeR.box);

              if (Math.abs(distanceR - distanceL) < this.gridSize) {
                this.proposals.push({
                  from: el.node.box.rightMiddle,
                  to: new Coordinates([
                    minNodeR.box.leftMiddle.x,
                    el.node.box.rightMiddle.y,
                  ]),
                });
                this.proposals.push({
                  from: el.node.box.leftMiddle,
                  to: new Coordinates([
                    minNodeL.box.rightMiddle.x,
                    el.node.box.leftMiddle.y,
                  ]),
                });
                el.updateX(
                  (minNodeR.box.leftMiddle.x + minNodeL.box.rightMiddle.x) / 2 -
                    el.newBox.width / 2,
                );
                el.lockX();
              }
            }
          }
        }
      },
      this.diagram.priorities.Drag_Node_Distances_Balancer,
    );
  }
}
