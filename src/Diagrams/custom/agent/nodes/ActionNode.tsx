import { observer } from 'mobx-react-lite';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import type { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { Dimensions } from '../../../store/primitives/Dimensions';
import { EditableLabel } from '../../editable/EditableLabel';
import type { ActionPayload } from '../types';
import { AgentNode } from './AgentNode';

export class ActionNode extends AgentNode<ActionPayload> {
  readonly kind = 'action' as const;

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & { payload?: Partial<ActionPayload> },
  ) {
    super(parent, {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 220, 110]),
    });

    this.classList.add('agent__action');
  }

  protected defaultPayload(): ActionPayload {
    return {
      actionType: 'task',
      operation: '',
      inputRef: '',
      outputRef: '',
      metadata: {},
    };
  }

  protected Render = observer(() => {
    return (
      <div {...customRendererProps(this)}>
        <EditableLabel />
      </div>
    );
  });
}
