import { computed, makeObservable, observable } from 'mobx';
import { Diagram } from '../Diagram';
import { DEvent } from './Events';

export type Callback<X extends DEvent> = (ev: X) => unknown;

export type Class<X> = abstract new (...args: any[]) => X;

interface PrioritizedCallback<X extends DEvent = DEvent> {
  cb: Callback<X>;
  priority: number;
}

export class Element {
  constructor(public parent: Element | null) {
    makeObservable(this, {
      parent: observable,
      diagram: computed,
    });
  }

  protected callbacks = new Map<Class<any>, PrioritizedCallback<any>[]>();

  private static getClassHierarchy(ctor: Function): Function[] {
    const out: Function[] = [];
    let current: any = ctor;

    while (current && current !== Object) {
      out.push(current);
      current = Object.getPrototypeOf(current);
    }

    return out;
  }

  protected emit(ev: DEvent) {
    const entries: PrioritizedCallback[] = [];

    for (const type of Element.getClassHierarchy(ev.constructor)) {
      const list = this.callbacks.get(type as Class<any>);
      if (list) {
        entries.push(...list);
      }
    }

    entries.sort((a, b) => b.priority - a.priority);

    for (const { cb } of entries) {
      cb(ev);

      if (!ev.spreads) {
        return ev;
      }
    }

    if (ev.bubbles) {
      this.parent?.emit(ev);
    }

    return ev;
  }

  public get diagram(): Diagram | null {
    let p = this.parent;
    while (p !== null && !(p instanceof Diagram)) {
      p = p.parent;
    }

    return p;
  }

  public onEvent<X extends DEvent>(
    type: Class<X>,
    cb: Callback<X>,
    priority = 0,
  ) {
    let list = this.callbacks.get(type);

    if (!list) {
      list = [];
      this.callbacks.set(type, list);
    }

    list.push({ cb, priority });

    return () => this.offEvent(type, cb as Callback<DEvent>);
  }

  public offEvent<X extends DEvent = DEvent>(type: Class<X>, cb: Callback<X>) {
    const list = this.callbacks.get(type);
    if (!list) return;

    this.callbacks.set(
      type,
      list.filter((e) => e.cb !== cb),
    );
  }
}
