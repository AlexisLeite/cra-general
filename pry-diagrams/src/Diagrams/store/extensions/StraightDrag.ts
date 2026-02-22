import { Mouse } from '../../util/Mouse';
import {
  DDragNodeEvent,
  DKeyDownEvent,
  DKeyUpEvent,
  DMouseMoveEvent,
  DMouseUpEvent,
  NodePositionProposal,
} from '../elements/Events';
import { Coordinates } from '../primitives/Coordinates';
import { DiagramExtension } from './DiagramExtension';

export class StraightDrag extends DiagramExtension {
  private straight: 'none' | 'x' | 'y' = 'none';
  private startCoordinates: Coordinates | null = null;
  private startProposals: NodePositionProposal[] = [];

  private reset() {
    this.straight = 'none';
    this.startCoordinates = null;
    this.startProposals = [];
  }

  public init(): void {
    this.diagram.onEvent(DKeyDownEvent, (ev) => {
      if (ev.shift) {
        this.startCoordinates = Mouse.getInstance().coordinates;
      }
    });

    this.diagram.onEvent(DKeyUpEvent, (ev) => {
      if (!ev.shift) {
        this.reset();
      }
    });

    this.diagram.onEvent(
      DMouseMoveEvent,
      (ev) => {
        if (this.startCoordinates) {
          const distX = Math.abs(this.startCoordinates.x - ev.mouse.x);
          const distY = Math.abs(this.startCoordinates.y - ev.mouse.y);

          if (distX > 15 || distY > 15) {
            if (distX > distY) {
              this.straight = 'x';
            } else if (distX < distY) {
              this.straight = 'y';
            }
          }
        }
      },
      this.diagram.priorities.Mouse_Move_Straight_Drag,
    );

    this.diagram.onEvent(
      DMouseUpEvent,
      () => {
        this.reset();
      },
      this.diagram.priorities.Mouse_Up_Straight_Drag,
    );

    this.diagram.onEvent(
      DDragNodeEvent,
      (ev) => {
        if (this.straight !== 'none') {
          if (this.startProposals.length === 0) {
            this.startProposals = ev.proposals.map(
              (c) => new NodePositionProposal(c.node, c.newBox.copy()),
            );
          } else {
            for (const p of ev.proposals) {
              const original = this.startProposals.find(
                (c) => c.node.id === p.node.id,
              )!;
              switch (this.straight) {
                case 'x':
                  p.updateY(original.newBox.y);
                  p.lockY();
                  break;
                case 'y':
                  p.updateX(original.newBox.x);
                  p.lockX();
                  break;
              }
            }
          }
        }
      },
      this.diagram.priorities.Drag_Node_Straight_Drag,
    );
  }
}
