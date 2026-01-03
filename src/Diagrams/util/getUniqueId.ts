const maxId = new Map<string, number>();
export function getUniqueId(prefix: string) {
  if (!maxId.has(prefix)) {
    maxId.set(prefix, Number.MIN_SAFE_INTEGER);
  }
  const id = maxId.get(prefix)!;
  maxId.set(prefix, id + 1);
  return `${prefix}_${id}`;
}
