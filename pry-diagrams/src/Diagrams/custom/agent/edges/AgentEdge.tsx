import { action, makeObservable, observable } from 'mobx';
import { Edge } from '../../../store/elements/Edge';
import type { Element } from '../../../store/elements/Element';
import type { TEdgeState } from '../../../store/types';
import type { AgentEdgeKind } from '../types';

type AgentEdgeState = Partial<TEdgeState> & {
  kind?: AgentEdgeKind;
};

type AgentSerializedEdge = ReturnType<Edge['serialize']> & {
  kind?: AgentEdgeKind;
};

export class AgentEdge extends Edge {
  kind: AgentEdgeKind = 'default';

  constructor(parent: Element | null, state: AgentEdgeState) {
    super(parent, state as TEdgeState);

    makeObservable(this, {
      kind: observable,
      setKind: action,
    });

    this.setKind(state.kind ?? 'default');
  }

  setKind(kind: AgentEdgeKind) {
    this.kind = kind;

    switch (kind) {
      case 'trigger':
        this.state.stroke = '#38bdf8';
        this.state.lineStyle = 'solid';
        this.state.arrowHeadEnd = 'triangle-filled';
        break;
      case 'condition-true':
        this.state.stroke = '#22c55e';
        this.state.lineStyle = 'solid';
        this.state.arrowHeadEnd = 'triangle-filled';
        break;
      case 'condition-false':
        this.state.stroke = '#ef4444';
        this.state.lineStyle = 'dashed';
        this.state.arrowHeadEnd = 'triangle-filled';
        break;
      case 'default':
      default:
        this.state.stroke = undefined;
        this.state.lineStyle = 'solid';
        this.state.arrowHeadEnd = 'arrow';
        break;
    }
  }

  serialize() {
    return {
      ...super.serialize(),
      kind: this.kind,
    };
  }

  deserialize(o: AgentSerializedEdge) {
    super.deserialize(o as any);
    this.setKind(o.kind ?? 'default');
  }
}
