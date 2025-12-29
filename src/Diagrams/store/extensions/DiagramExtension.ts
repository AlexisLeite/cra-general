import type { Diagram } from '../Diagram';
import { Element } from '../elements/Element';
import { action, makeObservable, observable } from 'mobx';

export abstract class DiagramExtension extends Element {
  constructor(public parent: Diagram) {
    super(parent);
    makeObservable<typeof this, 'enable'>(this, {
      enable: observable,
      toggle: action,
    });
  }

  public abstract init(): void;

  public get diagram(): Diagram {
    return this.parent;
  }

  protected enable = true;

  public get enabled() {
    return this.enable;
  }

  toggle(newValue = !this.enable) {
    this.enable = newValue;
  }
}
