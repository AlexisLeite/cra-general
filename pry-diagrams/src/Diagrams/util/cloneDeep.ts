export function cloneDeep<T>(o: T): T {
  if (typeof o === 'object' && o) {
    if (Array.isArray(o)) {
      return o.map((c) => cloneDeep(c)) as T;
    }
    return Object.fromEntries(
      Object.entries(o as Record<string, any>).map(([key, value]) => [
        key,
        cloneDeep(value),
      ]),
    ) as T;
  }

  return o;
}
