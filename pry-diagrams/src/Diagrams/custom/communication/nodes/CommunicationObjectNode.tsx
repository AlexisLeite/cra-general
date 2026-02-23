import { observer } from 'mobx-react-lite';
import type { Element } from '../../../store/elements/Element';
import type { TNodeConstructorProps } from '../../../store/elements/Node';
import { Dimensions } from '../../../store/primitives/Dimensions';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import { EditableLabel } from '../../editable/EditableLabel';
import { CommunicationNode } from '../CommunicationNode';

export class CommunicationObjectNode extends CommunicationNode {
  readonly communicationNodeType = 'object' as const;

  constructor(parent: Element | null, state: TNodeConstructorProps) {
    super(parent, {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 190, 96]),
      fill: state.fill ?? '#182412',
      stroke: state.stroke ?? '#bef264',
      label: state.label ?? 'Object',
    });

    this.classList.add('communication__node--object');
  }

  protected Render = observer(() => {
    return (
      <div {...customRendererProps(this)}>
        <div className="communication__node-badge">Object</div>
        <EditableLabel />
      </div>
    );
  });
}
