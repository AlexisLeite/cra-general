import { Coordinates } from '../../primitives/Coordinates';
import { Node } from '../../elements/Node';
import { Dimensions } from '../../primitives/Dimensions';

export function pathCollidesNodes(path: Coordinates[], nodes: Node[]): boolean {
  if (path.length < 2 || nodes.length === 0) {
    return false;
  }

  const nodeBounds = nodes.map((node) => node.box);

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];

    const lineBox = new Dimensions([...p1.raw, ...p2.copy().substract(p1).raw]);

    if (nodeBounds.find((c) => c.collides(lineBox, true))) {
      return true;
    }
  }

  return false;
}
