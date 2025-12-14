import { Diagram } from '../../Diagram';
import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';
import { getPathAroundNode } from './getPathAroundNode';
import { pathCollidesNodes } from './pathCollidesNodes';
import { stepFromGateway } from './stepBackFromGateway';
import { TDirection } from '../../types';
import { Node } from '../../elements/Node';

export type Path = { x: number; y: number }[];

function filter(c: (Coordinates | undefined)[]) {
  return c.filter((d): d is Coordinates => Boolean(d));
}

function findBestPathBetweenPoints(
  origin: Coordinates,
  target: Coordinates,
  {
    checkCollisions,
    gridSize,
    preferOrientation,
    startGateway: A,
    targetGateway: B,
  }: {
    checkCollisions?: Node[];
    gridSize: number;
    preferOrientation: TDirection;
    startGateway?: Gateway;
    targetGateway?: Gateway;
  },
) {
  const gateA = A?.coordinates;
  const gateB = B?.coordinates;

  /**
   * 2 - Half horizontal, vertical, half horizontal
   */

  const path2 = filter([
    gateA,
    origin,
    new Coordinates([(origin.x + target.x) / 2, origin.y]),
    new Coordinates([(origin.x + target.x) / 2, target.y]),
    target,
    gateB,
  ]);

  if (!pathCollidesNodes(path2.slice(1, -1), checkCollisions || [])) {
    return path2;
  }

  /**
   * 3 - Half vertical, horizontal, half vertical
   */

  const path3 = filter([
    gateA,
    origin,
    new Coordinates([origin.x, (origin.y + target.y) / 2]),
    new Coordinates([target.x, (origin.y + target.y) / 2]),
    target,
    gateB,
  ]);

  if (!pathCollidesNodes(path3.slice(1, -1), checkCollisions || [])) {
    return path3;
  }

  /**
   * Path 0 and 1 are inverted in case the gateway is vertical
   */

  /**
   * For every pair of nodes, we must choose the first of the following that doesn't have any collision:
   *
   * 0 - Horizontal, then vertical
   */

  function checkPath0() {
    const path0 = filter([
      gateA,
      origin,
      new Coordinates([target.x, origin.y]),
      target,
      gateB,
    ]);

    if (!pathCollidesNodes(path0.slice(1, -1), checkCollisions || [])) {
      return path0;
    }
    return null;
  }

  /**
   * 1 - Vertical, then horizontal
   */
  function checkPath1() {
    const path1 = filter([
      gateA,
      origin,
      new Coordinates([origin.x, target.y]),
      target,
      gateB,
    ]);

    if (!pathCollidesNodes(path1.slice(1, -1), checkCollisions || [])) {
      return path1;
    }

    return null;
  }

  switch (preferOrientation) {
    case 'up':
    case 'down':
      {
        const path1 = checkPath1();
        if (path1) {
          return path1;
        }
        const path0 = checkPath0();
        if (path0) {
          return path0;
        }
      }
      break;
    case 'left':
    case 'right':
      {
        const path0 = checkPath0();
        if (path0) {
          return path0;
        }

        const path1 = checkPath1();
        if (path1) {
          return path1;
        }
      }
      break;
  }

  if (A && B) {
    /**
     * 4 - Go around start node to side A, scale Vertical
     */

    let around = getPathAroundNode(gridSize, A, 'a');
    const path4 = filter([
      ...around,
      new Coordinates([around.at(-1)!.x, target.y]),
      target,
      B.coordinates.copy(),
      gateB,
    ]);

    if (!pathCollidesNodes(path4.slice(1, -1), checkCollisions || [])) {
      return path4;
    }

    /**
     * 4_1 - Go around start node to side A, scale Horizontal
     */

    around = getPathAroundNode(gridSize, A, 'a');
    const path4_1 = filter([
      ...around,
      new Coordinates([target.x, around.at(-1)!.y]),
      target,
      B.coordinates.copy(),
      gateB,
    ]);

    if (!pathCollidesNodes(path4_1.slice(1, -1), checkCollisions || [])) {
      return path4_1;
    }

    /**
     * 5 - Go around start node to side B, scale Vertical
     */

    around = getPathAroundNode(gridSize, A, 'b');
    const path5 = filter([
      ...around,
      new Coordinates([around.at(-1)!.x, target.y]),
      target,
      B.coordinates.copy(),
      gateB,
    ]);

    if (!pathCollidesNodes(path5.slice(1, -1), checkCollisions || [])) {
      return path5;
    }

    /**
     * 5_1 - Go around start node to side B, scale Horizontal
     */

    around = getPathAroundNode(gridSize, A, 'b');
    const path5_1 = filter([
      ...around,
      new Coordinates([target.x, around.at(-1)!.y]),
      target,
      B.coordinates.copy(),
      gateB,
    ]);

    if (!pathCollidesNodes(path5_1.slice(1, -1), checkCollisions || [])) {
      return path5_1;
    }

    /**
     * 6 - Go around end node to side A, scale Vertical
     */
    around = getPathAroundNode(gridSize, B, 'a').reverse();
    const path6 = filter([
      gateA,
      A.coordinates.copy(),
      origin,
      new Coordinates([around[0].x, origin.y]),
      ...around,
    ]);

    if (!pathCollidesNodes(path6.slice(1, -1), checkCollisions || [])) {
      return path6;
    }
    /**
     * 6_1 - Go around end node to side A, scale Horizontal
     */
    around = getPathAroundNode(gridSize, B, 'b').reverse();
    const path6_1 = filter([
      gateA,
      A.coordinates.copy(),
      origin,
      new Coordinates([around[0].x, origin.y]),
      ...around,
    ]);

    if (!pathCollidesNodes(path6_1.slice(1, -1), checkCollisions || [])) {
      return path6_1;
    }
  }
  return null;
}

function _findBestPathBetweenNodes(
  gridSize: number,
  A: Gateway,
  B: Gateway,
): Coordinates[] | null {
  const originSteppedBack = stepFromGateway(gridSize, A);
  const targetSteppedBack = stepFromGateway(gridSize, B);

  return findBestPathBetweenPoints(originSteppedBack, targetSteppedBack, {
    preferOrientation: B.orientation,
    gridSize,
    startGateway: A,
    targetGateway: B,
    checkCollisions: [A.parent, B.parent],
  });
}

export function findBestPathBetweenNodes(
  diagram: Diagram,
  A: Gateway,
  B: Gateway,
): Coordinates[] {
  let res = _findBestPathBetweenNodes(diagram.gridSize, A, B);
  if (res) {
    return res;
  }

  res = _findBestPathBetweenNodes(diagram.gridSize / 2, A, B);
  if (res) {
    return res;
  }

  return [A.coordinates.copy(), B.coordinates.copy()];
}
