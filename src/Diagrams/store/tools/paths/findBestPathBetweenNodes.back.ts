import type { Diagram } from '../../Diagram';
import type { Node } from '../../elements/Node';
import { Coordinates } from '../../primitives/Coordinates';
import { TDirection } from '../../types';

export type Path = { x: number; y: number }[];

export function findBestPathBetweenNodes(
  diagram: Diagram,
  A: Node,
  B: Node,
  destinationGate?: TDirection,
): Coordinates[] {
  console.log(destinationGate);
  const diff = A.box.middle.substract(B.box.middle);

  const distX = diff.x;
  const distY = diff.y;

  if (Math.abs(distX) > Math.abs(distY)) {
    if (A.box.x > B.box.x) {
      if (distY !== 0) {
        return [
          A.box.leftMiddle,
          new Coordinates([
            (A.box.middle.x + B.box.middle.x) / 2,
            A.box.middle.y,
          ]),
          new Coordinates([
            (A.box.middle.x + B.box.middle.x) / 2,
            B.box.middle.y,
          ]),

          B.box.rightMiddle,
        ];
      } else {
        return [A.box.leftMiddle, B.box.rightMiddle];
      }
    } else {
      if (distY !== 0) {
        return [
          A.box.rightMiddle,
          new Coordinates([
            (A.box.middle.x + B.box.middle.x) / 2,
            A.box.middle.y,
          ]),
          new Coordinates([
            (A.box.middle.x + B.box.middle.x) / 2,
            B.box.middle.y,
          ]),

          B.box.leftMiddle,
        ];
      } else {
        return [A.box.rightMiddle, B.box.leftMiddle];
      }
    }
  } else {
    if (A.box.y > B.box.y) {
      if (distX !== 0) {
        return [
          A.box.topMiddle,
          new Coordinates([
            A.box.middle.x,
            (A.box.middle.y + B.box.middle.y) / 2,
          ]),
          new Coordinates([
            B.box.middle.x,
            (A.box.middle.y + B.box.middle.y) / 2,
          ]),
          B.box.bottomMiddle,
        ];
      } else {
        return [A.box.topMiddle, B.box.bottomMiddle];
      }
    } else {
      if (distX !== 0) {
        return [
          A.box.bottomMiddle,
          new Coordinates([
            A.box.middle.x,
            (A.box.middle.y + B.box.middle.y) / 2,
          ]),
          new Coordinates([
            B.box.middle.x,
            (A.box.middle.y + B.box.middle.y) / 2,
          ]),
          B.box.topMiddle,
        ];
      } else {
        return [A.box.bottomMiddle, B.box.topMiddle];
      }
    }
  }
}
