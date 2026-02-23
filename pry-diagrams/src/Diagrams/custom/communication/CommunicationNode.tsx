import { EditableNode } from '../editable/EditableNode';
import type { Element } from '../../store/elements/Element';
import type { TNodeConstructorProps } from '../../store/elements/Node';
import { Dimensions } from '../../store/primitives/Dimensions';

export abstract class CommunicationNode extends EditableNode {
  abstract readonly communicationNodeType: string;

  constructor(
    parent: Element | null,
    state: TNodeConstructorProps & {
      box?: Dimensions;
      fill?: string;
      stroke?: string;
    },
  ) {
    super(parent, {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 180, 96]),
      fill: state.fill,
      stroke: state.stroke,
      label: state.label ?? '',
    });

    this.classList.add('communication__node', 'diagram__node');
  }
}

