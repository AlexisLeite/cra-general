type Callback = () => void;
type Unsubscriber = Callback;

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
