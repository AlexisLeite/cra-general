export function findParent(
  el: HTMLElement,
  check: (el: HTMLElement) => boolean,
) {
  let parent = el;
  while (parent) {
    if (check(parent)) {
      return parent;
    }
  }
  return null;
}
