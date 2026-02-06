import { observer } from 'mobx-react-lite';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { Dimensions } from '../../../store/primitives/Dimensions';
import { EditableLabel } from '../../editable/EditableLabel';
import { BPMNode } from './BPMNode';

export class UnknownBPMNNode extends BPMNode {
  sourceType = 'unknown';

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & { sourceType?: string },
  ) {
    super(parent, {
      ...state,
      box: state.box || new Dimensions([0, 0, 200, 100]),
    });

    this.sourceType = state.sourceType || 'unknown';
    this.classList.add('bpmn__unknown');
  }

  serialize() {
    return { ...super.serialize(), sourceType: this.sourceType };
  }

  deserialize(o: ReturnType<this['serialize']>) {
    super.deserialize(o);
    this.sourceType = o.sourceType || 'unknown';
  }

  protected Render = observer(() => {
    return (
      <div {...customRendererProps(this)}>
        <div className="bpmn__unknown__marker">?</div>
        <EditableLabel />
      </div>
    );
  });
}
