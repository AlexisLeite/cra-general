import { DEvent } from '../store/elements/Events';
import {
  type Callback as EvCB,
  type AbstractClass,
} from '../store/elements/Element';
import type { Diagram } from '../store/Diagram';
import { Hotkeys, type THotKey } from '../store/extensions/Hotkeys';
type Callback = () => void;
type Unsubscriber = Callback;

export function bindDiagram<X extends DEvent>(
  target: { diagram: Diagram },
  type: AbstractClass<X>,
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

export function bindHotkey(target: { diagram: Diagram }, hotkey: THotKey) {
  return target.diagram.getExtension(Hotkeys).register(hotkey);
}

export function bindDocument<K extends keyof DocumentEventMap>(
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

export function bindInterval(cb: Callback, time: number) {
  const t = setInterval(cb, time) as any;
  return () => {
    clearInterval(t);
  };
}

export function bindTimeout(cb: Callback, time: number) {
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
