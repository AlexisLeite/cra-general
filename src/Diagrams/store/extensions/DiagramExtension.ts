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

    this._enable =
      localStorage.getItem(`enable_${this.constructor.name}`) !== 'false';
  }

  public abstract init(): void;

  public get diagram(): Diagram {
    return this.parent;
  }

  protected _enable = true;

  public get enabled() {
    return this._enable;
  }

  public disable() {
    this._enable = false;
  }

  public enable() {
    this._enable = true;
  }

  toggle(newValue = !this._enable) {
    this._enable = newValue;
    localStorage.setItem(
      `enable_${this.constructor.name}`,
      String(this._enable),
    );
  }
}
