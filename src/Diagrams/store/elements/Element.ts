import { DEvent } from './Events';

export type Callback<X extends DEvent> = (ev: X) => unknown;

type Class<X> = abstract new (...args: any[]) => X;

interface PrioritizedCallback<X extends DEvent = DEvent> {
  cb: Callback<X>;
  priority: number;
}

export class Element {
  constructor(public parent: Element | null) {}

  protected callbacks = new Map<Class<any>, PrioritizedCallback<any>[]>();

  protected emit(ev: DEvent) {
    const list = this.callbacks.get(ev.constructor as Class<any>);

    if (list) {
      for (const { cb } of list) {
        cb(ev);

        if (!ev.spreads) {
          return ev;
        }
      }
    }

    if (ev.bubbles) this.parent?.emit(ev);

    return ev;
  }

  public onEvent<X extends DEvent = DEvent>(
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
    list.sort((a, b) => b.priority - a.priority);

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
