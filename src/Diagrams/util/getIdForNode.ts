import { Diagram } from '../store/Diagram';

const maxIds: Record<string, number> = {};
export function getIdForNode(
  diagram: Diagram,
  prefix: string,
  restrict: string[] = [],
) {
  let n = maxIds[prefix] || 0;
  while (
    restrict.includes(`${prefix}${n}`) ||
    diagram.getNodeById(`${prefix}${n}`)
  ) {
    n++;
  }
  return `${prefix}${n}`;
}
