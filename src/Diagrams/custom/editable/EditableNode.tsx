import { Node, type TNodeConstructorProps } from '../../store/elements/Node';
import { Element } from '../../store/elements/Element';
import { action, makeObservable, observable } from 'mobx';
import { type FC } from 'react';
import { EditableNodeContext } from './EditableNodeContext';

export abstract class EditableNode extends Node {
  editionMode = false;

  constructor(parent: Element | null, state: TNodeConstructorProps) {
    super(parent, state);

    makeObservable(this, {
      editionMode: observable,
      edit: action,
      cancel: action,
      confirm: action,
    });
  }

  private previous: string | null = null;
  public edit() {
    this.previous = this.state.label;
    this.editionMode = true;
  }

  public cancel() {
    this.editionMode = false;
    this.state.label = this.previous as string;
  }

  public confirm() {
    this.editionMode = false;
  }

  public get isChanged() {
    return this.previous !== this.state.label;
  }

  abstract Render: FC;

  Renderer = () => {
    return (
      <EditableNodeContext.Provider value={this}>
        <this.Render />
      </EditableNodeContext.Provider>
    );
  };
}
