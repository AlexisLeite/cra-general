import { makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import { BPMNode } from './BPMNode';
import { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { EditableLabel } from '../../editable/EditableLabel';
import { Dimensions } from '../../../store/primitives/Dimensions';

export class TaskNode extends BPMNode {
  constructor(parent: Element | null, state: TNodeConstructorProps) {
    super(parent, {
      ...state,
      box: state.box || new Dimensions([0, 0, 200, 100]),
    });

    makeObservable(this, { value: observable });
    this.classList.add('bpmn__task');
  }

  value = '';

  serialize() {
    return { ...super.serialize(), value: this.value };
  }

  deserialize(o: ReturnType<this['serialize']>): void {
    super.deserialize(o);
    this.value = o.value;
  }

  Render = observer(() => {
    return (
      <div {...customRendererProps(this)}>
        <EditableLabel />
      </div>
    );
  });
}
