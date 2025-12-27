import { DEvent } from '../store/elements/Events';
import { type Callback as EvCB, type Class } from '../store/elements/Element';
import type { Diagram } from '../store/Diagram';
type Callback = () => void;
type Unsubscriber = Callback;

export function diagramBind<X extends DEvent>(
  target: { diagram: Diagram },
  type: Class<X>,
  cb: EvCB<X>,
  priority?: number,
) {
  if (target.diagram) {
    const l = cb.bind(target);
    target.diagram.onEvent(type, l, priority);
    return () => {
      target.diagram?.offEvent(type, l);
    };
  }
  throw new Error('Cannot bind to unexistent diagram');
}

export function documentBind<K extends keyof DocumentEventMap>(
  target: any,
  type: K,
  listener: (this: Document, ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions,
): Unsubscriber {
  const l = listener.bind(target);
  document.addEventListener(type, l, options);

  return () => {
    document.removeEventListener(type, l, options);
  };
}

export function timerBind(cb: Callback, time: number) {
  const t = setTimeout(cb, time) as any;
  return () => {
    clearTimeout(t);
  };
}

export function bind(...uns: Callback[]) {
  return () => {
    uns.forEach((c) => c());
  };
}
