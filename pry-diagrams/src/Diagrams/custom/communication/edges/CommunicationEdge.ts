import { action, makeObservable, observable } from 'mobx';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { Edge } from '../../../store/elements/Edge';
import type { Element } from '../../../store/elements/Element';
import type { TEdgeState } from '../../../store/types';

type CommunicationEdgeState = Partial<TEdgeState>;

type SerializedCommunicationEdge = ReturnType<Edge['serialize']> & {
  label?: string;
  labelPositioning?: [number, number];
};

export class CommunicationEdge extends Edge {
  isEditingLabel = false;
  labelDraft = '';

  constructor(parent: Element | null, state: CommunicationEdgeState) {
    super(parent, state as TEdgeState);

    makeObservable(this, {
      isEditingLabel: observable,
      labelDraft: observable,
      setLabel: action,
      beginLabelEdit: action,
      cancelLabelEdit: action,
      confirmLabelEdit: action,
    });

    this.state.arrowHeadEnd = this.state.arrowHeadEnd ?? 'arrow';
    this.state.arrowHeadStart = this.state.arrowHeadStart ?? 'none';
    this.state.lineStyle = this.state.lineStyle ?? 'solid';
    this.state.pathType = this.state.pathType ?? 'angle';
    this.state.label = this.state.label ?? '';
    this.state.labelPositioning =
      this.state.labelPositioning ?? new Coordinates([0, 0]);
    this.state.strokeWidth = this.state.strokeWidth ?? 2;
    this.labelDraft = this.state.label;
  }

  setLabel(label: string) {
    this.state.label = label;
    this.labelDraft = label;
  }

  beginLabelEdit() {
    this.labelDraft = this.state.label ?? '';
    this.isEditingLabel = true;
  }

  cancelLabelEdit() {
    this.labelDraft = this.state.label ?? '';
    this.isEditingLabel = false;
  }

  confirmLabelEdit() {
    this.state.label = this.labelDraft ?? '';
    this.isEditingLabel = false;
  }

  serialize() {
    return {
      ...super.serialize(),
      label: this.state.label,
      labelPositioning: this.state.labelPositioning?.raw,
    };
  }

  deserialize(o: SerializedCommunicationEdge) {
    super.deserialize(o as any);
    this.state.label = o.label ?? '';
    this.state.labelPositioning = new Coordinates(o.labelPositioning ?? [0, 0]);
    this.labelDraft = this.state.label;
    this.isEditingLabel = false;
  }
}
