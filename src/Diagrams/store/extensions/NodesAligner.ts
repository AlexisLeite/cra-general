import { action, makeObservable, observable, runInAction } from 'mobx';
import { DDragNodeEvent, DMouseUpEvent } from '../elements/Events';
import { DiagramExtension } from './DiagramExtension';
import type { Node } from '../elements/Node';
import { Dimensions } from '../primitives/Dimensions';
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

export class NodesAligner extends DiagramExtension {
  // This is only for reference
  private enable = true;
  private gridSize = 50;
  proposals: Proposal[] = [];

  clear() {
    this.proposals = [];
  }

  get enabled() {
    return this.enable;
  }

  toggle(newValue = !this.enable) {
    this.enable = newValue;
  }

  init() {
    makeObservable<typeof this, 'enable'>(this, {
      clear: action,
      enable: observable,
      proposals: observable,
      toggle: action,
    });

    documentBind(this, 'keydown', (ev) => {
      if (ev.ctrlKey) {
        this.clear();
      }
    });

    this.diagram.onEvent(DMouseUpEvent, () => {
      this.clear();
    });

    this.diagram.onEvent(
      DDragNodeEvent,
      (ev) => {
        if (this.enabled) {
          this.clear();

          const extensionBoundary =
            this.diagram.canvas.frameDimensions.norm / 2;
          const relevantBoundary = (this.gridSize / 5) * 2;
          const attachBoundary = this.gridSize / 3;

          if (ev.proposals.length >= 1) {
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
            const el = ev.proposals[0];

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
              let updatedX = false;
              let updatedY = false;

              if (
                candidate.id !== el.node.id &&
                el.newBox.copy().substract(candidate.box).norm <
                  extensionBoundary &&
                !ev.proposals.find((c) => c.node.id === candidate.id)
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
                      updatedY = true;
                      el.update(
                        new Dimensions([
                          el.current.x,
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
                      updatedY = true;
                      el.update(
                        new Dimensions([
                          el.current.x,
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
                      updatedY = true;
                      el.update(
                        new Dimensions([
                          el.current.x,
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
                      updatedX = true;
                      el.update(
                        new Dimensions([
                          candidate.box.x,
                          el.current.y,
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
                      updatedX = true;
                      el.update(
                        new Dimensions([
                          candidate.box.middle.x - el.newBox.width / 2,
                          el.current.y,
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
                      updatedX = true;
                      el.update(
                        new Dimensions([
                          candidate.box.rightMiddle.x - el.newBox.width,
                          el.current.y,
                          ...el.newBox.size.raw,
                        ]),
                      );
                    }
                  }
                }
              }

              if (updatedX) {
                el.lockX();
              }

              if (updatedY) {
                el.lockY();
              }
            }

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
      },
      this.diagram.priorities.Drag_Node_Aligner,
    );
  }
}
