type Unsubscriber = () => void;

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

export function timerBind(cb: Unsubscriber, time: number) {
  const t = setTimeout(cb, time) as any;
  return () => {
    clearTimeout(t);
  };
}

export function bind(...uns: Unsubscriber[]) {
  return () => {
    uns.forEach((c) => c());
  };
}
