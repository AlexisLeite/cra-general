import { action, makeObservable, observable } from 'mobx';
import type { Element } from '../../../store/elements/Element';
import { type TNodeConstructorProps } from '../../../store/elements/Node';
import { cloneDeep } from '../../../util/cloneDeep';
import { EditableNode } from '../../editable/EditableNode';
import type { AgentNodeKind } from '../types';

type AgentNodeConstructorProps<TPayload> = TNodeConstructorProps & {
  payload?: Partial<TPayload>;
};

export abstract class AgentNode<TPayload> extends EditableNode {
  abstract readonly kind: AgentNodeKind;

  payload!: TPayload;

  constructor(
    parent: Element | null,
    state: AgentNodeConstructorProps<TPayload>,
  ) {
    super(parent, state);

    this.classList.add('agent__node', 'diagram__node');
    this.payload = this.mergePayload(state.payload);

    makeObservable(this, {
      payload: observable.ref,
      replacePayload: action,
      updatePayload: action,
    });
  }

  protected abstract defaultPayload(): TPayload;

  protected mergePayload(payload?: Partial<TPayload>) {
    return {
      ...this.defaultPayload(),
      ...(payload ?? {}),
    } as TPayload;
  }

  replacePayload(payload: TPayload) {
    this.payload = this.mergePayload(payload);
  }

  updatePayload(patch: Partial<TPayload>) {
    this.payload = {
      ...this.payload,
      ...patch,
    } as TPayload;
  }

  serialize() {
    return {
      ...super.serialize(),
      kind: this.kind,
      payload: cloneDeep(this.payload),
    };
  }

  deserialize(o: ReturnType<(typeof this)['serialize']>) {
    super.deserialize(o);
    this.payload = this.mergePayload(o.payload);
  }
}

export function isAgentNode(node: unknown): node is AgentNode<unknown> {
  return node instanceof AgentNode;
}
