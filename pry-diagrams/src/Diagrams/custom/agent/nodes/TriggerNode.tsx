import { observer } from 'mobx-react-lite';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import type { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { Dimensions } from '../../../store/primitives/Dimensions';
import { EditableLabel } from '../../editable/EditableLabel';
import type { TriggerPayload } from '../types';
import { AgentNode } from './AgentNode';

export class TriggerNode extends AgentNode<TriggerPayload> {
  readonly kind = 'trigger' as const;

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & { payload?: Partial<TriggerPayload> },
  ) {
    super(parent, {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 170, 90]),
    });

    this.classList.add('agent__trigger');
  }

  protected defaultPayload(): TriggerPayload {
    return {
      triggerType: 'manual',
      source: '',
      eventName: '',
      schedule: '',
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
