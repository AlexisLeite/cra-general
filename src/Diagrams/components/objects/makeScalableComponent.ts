export function makeScalableComponent<T extends object>(c: T): T {
  if (!c) {
    return c;
  }

  Object.assign(c, { __scalable: true });
  return c;
}
