import { observer } from 'mobx-react-lite';
import type { Element } from '../../../store/elements/Element';
import type { TNodeConstructorProps } from '../../../store/elements/Node';
import { Dimensions } from '../../../store/primitives/Dimensions';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import { EditableLabel } from '../../editable/EditableLabel';
import { CommunicationNode } from '../CommunicationNode';

export class CommunicationActorNode extends CommunicationNode {
  readonly communicationNodeType = 'actor' as const;

  constructor(parent: Element | null, state: TNodeConstructorProps) {
    super(parent, {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 170, 90]),
      fill: state.fill ?? '#0f2230',
      stroke: state.stroke ?? '#7dd3fc',
      label: state.label ?? 'Actor',
    });

    this.classList.add('communication__node--actor');
  }

  protected Render = observer(() => {
    return (
      <div {...customRendererProps(this)}>
        <div className="communication__node-badge">Actor</div>
        <EditableLabel />
      </div>
    );
  });
}
