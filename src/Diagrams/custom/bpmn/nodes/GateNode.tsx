import { Element } from '../../../store/elements/Element';
import { DNodeChangeTypeEvent } from '../../../store/elements/Events';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { getEnumStr } from '../../../util/getEnumStr';
import { BPMNode } from './BPMNode';

export enum GateTypes {
  inclusive,
  exclusive,
  parallel,
}

export class GateNode extends BPMNode {
  type!: GateTypes;

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & { type?: GateTypes },
  ) {
    super(parent, state);

    this.setType(state.type || GateTypes.exclusive);
    this.state.box.assignDimensions(new Coordinates([80, 80]));
    this.classList.add('bpmn__event');
  }

  setType(type: GateTypes) {
    if (
      this.type !== type &&
      !this.emit(new DNodeChangeTypeEvent(this)).cancelled
    ) {
      this.type = type;

      for (const type of Object.values(GateTypes)) {
        this.classList.delete(getEnumStr(GateTypes, type as GateTypes));
      }

      switch (type) {
        case GateTypes.exclusive:
          this._gateways.forEach((c) =>
            c.outgoingEdges.forEach((e) => this.diagram?.disconnect(e)),
          );
          this.classList.add(getEnumStr(GateTypes, GateTypes.exclusive));
          break;
        case GateTypes.inclusive:
          this._gateways.forEach((c) =>
            c.outgoingEdges.forEach((e) => this.diagram?.disconnect(e)),
          );
          this.classList.add(getEnumStr(GateTypes, GateTypes.inclusive));
          break;
        case GateTypes.parallel:
          this._gateways.forEach((c) =>
            c.outgoingEdges.forEach((e) => this.diagram?.disconnect(e)),
          );
          this.classList.add(getEnumStr(GateTypes, GateTypes.parallel));
          break;
      }
    }
  }

  Render = () => {
    return null;
  };
}
