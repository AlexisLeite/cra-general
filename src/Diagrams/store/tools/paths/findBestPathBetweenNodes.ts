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
  /**
   * We must always choose a gate
   */

  const diff = A.box.middle.substract(B.box.middle);
  const distX = diff.x;
  const distY = diff.y;

  if (!destinationGate) {
    if (Math.abs(distX) > Math.abs(distY)) {
      if (A.box.x > B.box.x) {
        destinationGate = 'right';
      } else {
        destinationGate = 'left';
      }
    } else {
      if (A.box.y > B.box.y) {
        destinationGate = 'down';
      } else {
        destinationGate = 'up';
      }
    }
  }

  switch (destinationGate) {
    case 'down':
      if (A.box.topMiddle.y > B.box.bottomMiddle.y) {
        // The easy way
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
      }
      break;
    case 'up':
      if (A.box.bottomMiddle.y > B.box.topMiddle.y) {
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
      break;
    case 'right':
      if (A.box.leftMiddle.x > B.box.rightMiddle.x) {
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
      }
      break;
    case 'left':
      if (A.box.rightMiddle.x > B.box.leftMiddle.x) {
      } else {
        // The easy wah
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
      break;
  }

  return [];
}
