import { action, makeObservable, observable, runInAction } from 'mobx';
import {
  DDragProposalEvent as DDragProposalEvent,
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
      y: number;
      range: [number, number];
    }
  | {
      type: 'h';
      x: number;
      range: [number, number];
    };

type CandidateType = 'HL' | 'HC' | 'HR' | 'VT' | 'VM' | 'VB';

function d(a: number, b: number) {
  return Math.abs(a - b);
}

export class Aligner extends DiagramExtension {
  proposals: Proposal[] = [];

  gridSize = 50;
  snapToGrid = true;

  clear() {
    this.proposals = [];
  }

  toggleSnapToGrid() {
    this.snapToGrid = !this.snapToGrid;
  }

  init() {
    makeObservable(this, {
      clear: action,
      proposals: observable,
      gridSize: observable,
      snapToGrid: observable,
      toggleSnapToGrid: action,
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

        const extensionBoundary = this.diagram.canvas.frameDimensions.norm / 2;
        const relevantBoundary = (this.gridSize / 5) * 3;
        const attachBoundary = this.gridSize / 2;

        if (ev.elements.length === 1) {
          const proposals: Partial<
            Record<
              CandidateType,
              {
                position: number;
                element: Node<any>;
                distance: number;
                range: [number, number];
              }
            >
          > = {};
          const el = ev.elements[0];

          const enabledChecks: Record<CandidateType, boolean> = {
            HC: true,
            HL: true,
            HR: true,
            VB: true,
            VM: true,
            VT: true,
          };

          for (const candidate of this.diagram.nodes) {
            if (
              candidate.id !== el.node.id &&
              el.newBox.copy().substract(candidate.box).norm < extensionBoundary
            ) {
              if (enabledChecks.VM) {
                const dvm = d(candidate.box.middle.y, el.newBox.middle.y);
                if (
                  dvm < relevantBoundary &&
                  (proposals.VM?.distance ?? Infinity) > dvm
                ) {
                  proposals.VM = {
                    distance: dvm,
                    element: el.node,
                    position: candidate.box.middle.y,
                    range: [candidate.box.rightMiddle.x, el.node.box.x],
                  };

                  if (dvm < attachBoundary) {
                    el.update(
                      new Dimensions([
                        el.newBox.x,
                        candidate.box.middle.y - candidate.box.height / 2,
                        ...el.node.box.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.VT) {
                const dvt = d(candidate.box.y, el.newBox.y);
                if (
                  dvt < relevantBoundary &&
                  (proposals.VT?.distance ?? Infinity) > dvt
                ) {
                  proposals.VT = {
                    distance: dvt,
                    element: el.node,
                    position: candidate.box.y,
                    range: [candidate.box.rightMiddle.x, el.node.box.x],
                  };

                  if (dvt < attachBoundary) {
                    el.update(
                      new Dimensions([
                        el.newBox.x,
                        candidate.box.y,
                        ...el.node.box.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.VB) {
                const dvb = d(
                  candidate.box.bottomMiddle.y,
                  el.newBox.bottomMiddle.y,
                );
                if (
                  dvb < relevantBoundary &&
                  (proposals.VB?.distance ?? Infinity) > dvb
                ) {
                  proposals.VB = {
                    distance: dvb,
                    element: el.node,
                    position: candidate.box.bottomMiddle.y,
                    range: [candidate.box.rightMiddle.x, el.node.box.x],
                  };

                  if (dvb < attachBoundary) {
                    el.update(
                      new Dimensions([
                        el.newBox.x,
                        candidate.box.bottomMiddle.y - el.node.box.height,
                        ...el.node.box.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.HL) {
                const dhl = d(candidate.box.x, el.newBox.x);
                if (
                  dhl < relevantBoundary &&
                  (proposals.HL?.distance ?? Infinity) > dhl
                ) {
                  proposals.HL = {
                    distance: dhl,
                    element: el.node,
                    position: candidate.box.x,
                    range: [candidate.box.bottomMiddle.y, el.node.box.y],
                  };

                  if (dhl < attachBoundary) {
                    el.update(
                      new Dimensions([
                        candidate.box.x,
                        el.newBox.y,
                        ...el.node.box.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.HC) {
                const dhc = d(candidate.box.middle.x, el.newBox.middle.x);
                if (
                  dhc < relevantBoundary &&
                  (proposals.HC?.distance ?? Infinity) > dhc
                ) {
                  proposals.HC = {
                    distance: dhc,
                    element: el.node,
                    position: candidate.box.middle.x,
                    range: [candidate.box.bottomMiddle.y, el.node.box.y],
                  };

                  if (dhc < attachBoundary) {
                    el.update(
                      new Dimensions([
                        candidate.box.middle.x - el.node.box.width / 2,
                        el.newBox.y,
                        ...el.node.box.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.HR) {
                const dhr = d(
                  candidate.box.rightMiddle.x,
                  el.newBox.rightMiddle.x,
                );
                if (
                  dhr < relevantBoundary &&
                  (proposals.HR?.distance ?? Infinity) > dhr
                ) {
                  proposals.HR = {
                    distance: dhr,
                    element: el.node,
                    position: candidate.box.rightMiddle.x,
                    range: [candidate.box.bottomMiddle.y, el.node.box.y],
                  };

                  if (dhr < attachBoundary) {
                    el.update(
                      new Dimensions([
                        candidate.box.rightMiddle.x - el.node.box.width,
                        el.newBox.y,
                        ...el.node.box.size.raw,
                      ]),
                    );
                  }
                }
              }
            }
          }
          /*
          if (this.diagram?.snapToGrid) {
            this.state.box.x =
              Math.round(this.state.box.x / this.diagram.gridSize) *
              this.diagram.gridSize;
            this.state.box.y =
              Math.round(this.state.box.y / this.diagram.gridSize) *
              this.diagram.gridSize;
          }*/

          Object.entries(proposals).forEach(([type, proposal]) => {
            runInAction(() => {
              if (type.startsWith('H')) {
                this.proposals.push({
                  x: proposal.position,
                  type: 'h',
                  range: proposal.range,
                });
              } else {
                this.proposals.push({
                  y: proposal.position,
                  type: 'v',
                  range: proposal.range,
                });
              }
            });
          });
        }
      }
    });
  }
}
