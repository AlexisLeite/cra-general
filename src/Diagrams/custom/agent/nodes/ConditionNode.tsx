import { observer } from 'mobx-react-lite';
import { customRendererProps } from '../../../components/objects/customRendererProps';
import type { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { Dimensions } from '../../../store/primitives/Dimensions';
import { EditableLabel } from '../../editable/EditableLabel';
import type { ConditionPayload } from '../types';
import { AgentNode } from './AgentNode';

export class ConditionNode extends AgentNode<ConditionPayload> {
  readonly kind = 'condition' as const;

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & { payload?: Partial<ConditionPayload> },
  ) {
    super(parent, {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 180, 120]),
    });

    this.classList.add('agent__condition');
  }

  protected defaultPayload(): ConditionPayload {
    return {
      expression: '',
      language: 'rule',
      trueLabel: 'True',
      falseLabel: 'False',
      metadata: {},
    };
  }

  protected Render = observer(() => {
    return (
      <div {...customRendererProps(this)}>
        <svg
          style={{
            width: `${this.state.box.width}px`,
            height: `${this.state.box.height}px`,
          }}
        >
          <polygon
            points={`${this.state.box.width / 2} 0 ${this.state.box.width} ${this.state.box.height / 2} ${this.state.box.width / 2} ${this.state.box.height} 0 ${this.state.box.height / 2}`}
          />
        </svg>
        <EditableLabel />
      </div>
    );
  });
}
