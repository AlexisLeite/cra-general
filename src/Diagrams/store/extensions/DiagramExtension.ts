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

    this.enable =
      localStorage.getItem(`enable_${this.constructor.name}`) !== 'false';
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
    localStorage.setItem(
      `enable_${this.constructor.name}`,
      String(this.enable),
    );
  }
}
