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
        const relevantBoundary = (this.gridSize / 5) * 2;
        const attachBoundary = this.gridSize / 3;

        if (ev.elements.length === 1) {
          const proposals: Record<
            CandidateType,
            {
              position: number;
              element: Node<any>;
              distance: number;
              range: [number, number];
            }[]
          > = {
            HC: [],
            HL: [],
            HR: [],
            VB: [],
            VM: [],
            VT: [],
          };
          const el = ev.elements[0];

          const enabledChecks: Record<CandidateType, boolean> = {
            HL: true,
            HC: true,
            HR: true,
            VB: true,
            VM: true,
            VT: true,
          };

          let minHorizontal = Infinity;
          let minVertical = Infinity;

          for (const candidate of this.diagram.nodes) {
            if (
              candidate.id !== el.node.id &&
              el.newBox.copy().substract(candidate.box).norm < extensionBoundary
            ) {
              if (enabledChecks.VM) {
                const dvm = d(candidate.box.middle.y, el.newBox.middle.y);
                if (dvm < relevantBoundary) {
                  proposals.VM.push({
                    distance: dvm,
                    element: el.node,
                    position: candidate.box.middle.y,
                    range: [candidate.box.rightMiddle.x, el.newBox.x],
                  });

                  if (
                    dvm < attachBoundary &&
                    !proposals.VM.find((c) => c.distance < dvm) &&
                    dvm < minHorizontal
                  ) {
                    minHorizontal = dvm;
                    el.update(
                      new Dimensions([
                        el.newBox.x,
                        candidate.box.middle.y - el.newBox.height / 2,
                        ...el.newBox.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.VT) {
                const dvt = d(candidate.box.y, el.newBox.y);
                if (dvt < relevantBoundary) {
                  proposals.VT.push({
                    distance: dvt,
                    element: el.node,
                    position: candidate.box.y,
                    range: [candidate.box.rightMiddle.x, el.newBox.x],
                  });

                  if (
                    dvt < attachBoundary &&
                    !proposals.VT.find((c) => c.distance < dvt) &&
                    dvt < minHorizontal
                  ) {
                    minHorizontal = dvt;
                    el.update(
                      new Dimensions([
                        el.newBox.x,
                        candidate.box.y,
                        ...el.newBox.size.raw,
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
                if (dvb < relevantBoundary) {
                  proposals.VB.push({
                    distance: dvb,
                    element: el.node,
                    position: candidate.box.bottomMiddle.y,
                    range: [candidate.box.rightMiddle.x, el.newBox.x],
                  });

                  if (
                    dvb < attachBoundary &&
                    !proposals.VB.find((c) => c.distance < dvb) &&
                    dvb < minHorizontal
                  ) {
                    minHorizontal = dvb;
                    el.update(
                      new Dimensions([
                        el.newBox.x,
                        candidate.box.bottomMiddle.y - el.newBox.height,
                        ...el.newBox.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.HL) {
                const dhl = d(candidate.box.x, el.newBox.x);
                if (dhl < relevantBoundary) {
                  proposals.HL.push({
                    distance: dhl,
                    element: el.node,
                    position: candidate.box.x,
                    range: [candidate.box.bottomMiddle.y, el.newBox.y],
                  });

                  if (
                    dhl < attachBoundary &&
                    !proposals.HL.find((c) => c.distance < dhl) &&
                    dhl < minVertical
                  ) {
                    minVertical = dhl;
                    el.update(
                      new Dimensions([
                        candidate.box.x,
                        el.newBox.y,
                        ...el.newBox.size.raw,
                      ]),
                    );
                  }
                }
              }

              if (enabledChecks.HC) {
                const dhc = d(candidate.box.middle.x, el.newBox.middle.x);
                if (dhc < relevantBoundary) {
                  proposals.HC.push({
                    distance: dhc,
                    element: el.node,
                    position: candidate.box.middle.x,
                    range: [candidate.box.bottomMiddle.y, el.newBox.y],
                  });

                  if (
                    dhc < attachBoundary &&
                    !proposals.HL.find((c) => c.distance < dhc) &&
                    dhc < minVertical
                  ) {
                    minVertical = dhc;
                    el.update(
                      new Dimensions([
                        candidate.box.middle.x - el.newBox.width / 2,
                        el.newBox.y,
                        ...el.newBox.size.raw,
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
                if (dhr < relevantBoundary) {
                  proposals.HR.push({
                    distance: dhr,
                    element: el.node,
                    position: candidate.box.rightMiddle.x,
                    range: [candidate.box.bottomMiddle.y, el.newBox.y],
                  });

                  if (
                    dhr < attachBoundary &&
                    !proposals.HR.find((c) => c.distance < dhr) &&
                    dhr < minVertical
                  ) {
                    minVertical = dhr;
                    el.update(
                      new Dimensions([
                        candidate.box.rightMiddle.x - el.newBox.width,
                        el.newBox.y,
                        ...el.newBox.size.raw,
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
              proposal.forEach((p) => {
                if (type.startsWith('H')) {
                  this.proposals.push({
                    x: p.position,
                    type: 'h',
                    range: p.range,
                  });
                } else {
                  this.proposals.push({
                    y: p.position,
                    type: 'v',
                    range: p.range,
                  });
                }
              });
            });
          });
        }
      }
    });
  }
}
