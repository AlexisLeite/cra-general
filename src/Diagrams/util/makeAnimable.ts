type Annotations<T> = {
  [K in keyof T]?: boolean;
};

export function makeAnimable<O extends Record<string, any>>(
  target: O,
  timing: number,
  annotations: Annotations<O>,
) {
  const timers: Record<any, any> = {};

  for (const key of Object.keys(annotations) as (keyof O)[]) {
    if (!annotations[key]) continue;

    let value = target[key];

    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,

      get() {
        return value;
      },
      set(newValue) {
        const start = Date.now();
        const initialValue = value;

        timers[key] = setInterval(() => {
          const diff = Date.now() - start;
          const progress = (newValue - initialValue) * (diff / timing);

          if (diff > timing) {
            value = newValue;
            clearInterval(timers[key]);
          } else {
            value = (initialValue + progress) as any;
          }
        }, 30);
      },
    });
  }
}
