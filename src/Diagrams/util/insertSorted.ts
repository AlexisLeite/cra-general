export function insertSorted<T>(
  arr: T[],
  value: T,
  cmp: (a: T, b: T) => number,
) {
  let lo = 0,
    hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cmp(arr[mid], value) < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  arr.splice(lo, 0, value);
}
