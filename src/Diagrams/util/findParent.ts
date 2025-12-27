export function findParent(
  el: HTMLElement,
  check: (el: HTMLElement) => boolean,
) {
  let parent: HTMLElement | null = el;
  while (parent) {
    if (check(parent)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}
