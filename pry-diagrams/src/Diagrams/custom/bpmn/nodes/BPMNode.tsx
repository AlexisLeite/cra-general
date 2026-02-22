import { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { EditableNode } from '../../editable/EditableNode';

export abstract class BPMNode extends EditableNode {
  constructor(parent: Element | null, state: TNodeConstructorProps) {
    super(parent, state);

    this.classList.add('bpm__node', 'diagram__node');
  }
}
