export function arrayOrArray<T>(c: T | T[]): T[] {
  if (Array.isArray(c)) {
    return c;
  }

  return [c];
}
