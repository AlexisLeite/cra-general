import { action, makeObservable, observable, runInAction } from 'mobx';
import {
  DDragProposal as DDragProposalEvent,
  DMouseUpEvent,
} from '../elements/Events';
import { DiagramExtension } from './DiagramExtension';
import type { Node } from '../elements/Node';
import { Dimensions } from '../primitives/Dimensions';
import { Keyboard } from '../../util/Keyboard';
import { documentBind } from '../../util/bindCb';

type Proposal =
  | {
      type: 'v';
      x: number;
    }
  | {
      type: 'h';
      y: number;
    };

type CandidateType = 'HL' | 'HC' | 'HR' | 'VT' | 'VM' | 'VB';

function d(a: number, b: number) {
  return Math.abs(a - b);
}

export class Aligner extends DiagramExtension {
  proposals: Proposal[] = [];

  clear() {
    this.proposals = [];
  }

  init() {
    makeObservable(this, {
      clear: action,
      proposals: observable,
    });

    documentBind(this, 'keydown', (ev) => {
      if (ev.ctrlKey) {
        this.clear();
      }
    });

    this.diagram.onEvent(DMouseUpEvent, () => {
      this.clear();
    });

    this.diagram.onEvent(DDragProposalEvent, (ev) => {
      if (!Keyboard.getInstance().ctrl) {
        this.clear();

        const extensionBoundary =
          this.diagram.canvas.frameDimensions.norm /
          (2 * this.diagram.canvas.scale);
        const relevantBoundary = this.diagram.gridSize;
        const attachBoundary = this.diagram.gridSize / 2;

        if (ev.elements.length === 1) {
          const proposals: Partial<
            Record<
              CandidateType,
              { position: number; element: Node<any>; distance: number }
            >
          > = {};
          const el = ev.elements[0];

          for (const node of this.diagram.nodes) {
            if (
              node.id !== el.node.id &&
              el.newBox.copy().substract(node.box).norm < extensionBoundary
            ) {
              const dvm = d(node.box.middle.y, el.newBox.middle.y);
              if (
                dvm < relevantBoundary &&
                (proposals.VM?.distance ?? Infinity) > dvm
              ) {
                proposals.VM = {
                  distance: dvm,
                  element: el.node,
                  position: node.box.middle.y,
                };

                if (dvm < attachBoundary) {
                  el.update(
                    new Dimensions([
                      el.newBox.x,
                      node.box.y,
                      ...el.node.box.size.raw,
                    ]),
                  );
                }
              }
            }
          }

          Object.entries(proposals).forEach(([type, proposal]) => {
            runInAction(() => {
              if (type.startsWith('h')) {
                this.proposals.push({
                  y: proposal.position,
                  type: 'h',
                });
              } else {
                this.proposals.push({
                  x: proposal.position,
                  type: 'v',
                });
              }
            });
          });
        }
      }
    });
  }
}
