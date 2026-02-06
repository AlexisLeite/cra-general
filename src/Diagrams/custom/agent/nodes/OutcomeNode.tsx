import { observer } from 'mobx-react-lite';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import type { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { Dimensions } from '../../../store/primitives/Dimensions';
import { EditableLabel } from '../../editable/EditableLabel';
import type { OutcomePayload } from '../types';
import { AgentNode } from './AgentNode';

export class OutcomeNode extends AgentNode<OutcomePayload> {
  readonly kind = 'outcome' as const;

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & { payload?: Partial<OutcomePayload> },
  ) {
    super(parent, {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 180, 90]),
    });

    this.classList.add('agent__outcome');
  }

  protected defaultPayload(): OutcomePayload {
    return {
      status: 'success',
      code: '',
      summary: '',
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
