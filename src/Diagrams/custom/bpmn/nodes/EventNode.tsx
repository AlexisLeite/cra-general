import { observer } from 'mobx-react-lite';
import type { Element } from '../../../store/elements/Element';
import { DNodeChangeTypeEvent } from '../../../store/elements/Events';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { BPMNode } from './BPMNode';
import { EditableLabel } from '../../editable/EditableLabel';
import { getEnumStr } from '../../../util/getEnumStr';

export enum EventTypes {
  start,
  end,
}

export type TEventNodeType = EventTypes;

export class EventNode extends BPMNode {
  type!: TEventNodeType;

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & { type?: TEventNodeType },
  ) {
    super(parent, state);

    this.setType(state.type || EventTypes.start);
    this.state.box.assignDimensions(new Coordinates([80, 80]));
    this.classList.add('bpmn__event');
  }

  setType(type: TEventNodeType) {
    if (
      this.type !== type &&
      !this.emit(new DNodeChangeTypeEvent(this)).cancelled
    ) {
      this.type = type;

      for (const type of Object.values(EventTypes)) {
        this.classList.delete(getEnumStr(EventTypes, type as EventTypes));
      }

      switch (type) {
        case EventTypes.end:
          this._gateways.forEach((c) =>
            c.outgoingEdges.forEach((e) => this.diagram?.disconnect(e)),
          );
          this.classList.add(getEnumStr(EventTypes, EventTypes.end));
          break;
        case EventTypes.start:
          this._gateways.forEach((c) =>
            c.outgoingEdges.forEach((e) => this.diagram?.disconnect(e)),
          );
          this.classList.add(getEnumStr(EventTypes, EventTypes.start));
          break;
      }
    }
  }

  serialize() {
    return { ...super.serialize(), type: this.type };
  }

  deserialize(o: ReturnType<this['serialize']>): void {
    super.deserialize(o);
    this.type = o.type;
  }

  Render = observer(() => {
    return (
      <div {...customRendererProps(this)}>
        <span className="label">
          <EditableLabel />
        </span>
      </div>
    );
  });
}
