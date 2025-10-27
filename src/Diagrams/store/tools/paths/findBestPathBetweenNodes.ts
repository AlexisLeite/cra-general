import { Diagram } from '../../Diagram';
import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';
import { debug } from '../Debugger';
import { getPathAroundNode } from './getPathAroundNode';
import { pathCollidesNodes } from './pathCollidesNodes';
import { stepFromGateway } from './stepBackFromGateway';

export type Path = { x: number; y: number }[];

function _findBestPathBetweenNodes(
  gridSize: number,
  A: Gateway,
  B: Gateway,
): Coordinates[] | null {
  const originSteppedBack = stepFromGateway(gridSize, A);
  const targetSteppedBack = stepFromGateway(gridSize, B);

  /**
   * Path 0 and 1 are inverted in case the gateway is vertical
   */

  /**
   * For every pair of nodes, we must choose the first of the following that doesn't have any collision:
   *
   * 0 - Horizontal, then vertical
   */

  function checkPath0() {
    const path0 = [
      A.coordinates,
      originSteppedBack,
      new Coordinates([targetSteppedBack.x, originSteppedBack.y]),
      targetSteppedBack,
      B.coordinates,
    ];

    if (!pathCollidesNodes(path0.slice(1, -1), [A.parent, B.parent])) {
      debug.set('Path0');
      return path0;
    }
    return null;
  }

  /**
   * 1 - Vertical, then horizontal
   */
  function checkPath1() {
    const path1 = [
      A.coordinates,
      originSteppedBack,
      new Coordinates([originSteppedBack.x, targetSteppedBack.y]),
      targetSteppedBack,
      B.coordinates,
    ];

    if (!pathCollidesNodes(path1.slice(1, -1), [A.parent, B.parent])) {
      debug.set('Path1');
      return path1;
    }

    return null;
  }

  switch (A.orientation) {
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

  /**
   * 2 - Half horizontal, vertical, half horizontal
   */

  const path2 = [
    A.coordinates,
    originSteppedBack,
    new Coordinates([
      (originSteppedBack.x + targetSteppedBack.x) / 2,
      originSteppedBack.y,
    ]),
    new Coordinates([
      (originSteppedBack.x + targetSteppedBack.x) / 2,
      targetSteppedBack.y,
    ]),
    targetSteppedBack,
    B.coordinates,
  ];

  if (!pathCollidesNodes(path2.slice(1, -1), [A.parent, B.parent])) {
    debug.set('Path2');
    return path2;
  }

  /**
   * 3 - Half vertical, horizontal, half vertical
   */

  const path3 = [
    A.coordinates,
    originSteppedBack,
    new Coordinates([
      originSteppedBack.x,
      (originSteppedBack.y + targetSteppedBack.y) / 2,
    ]),
    new Coordinates([
      targetSteppedBack.x,
      (originSteppedBack.y + targetSteppedBack.y) / 2,
    ]),
    targetSteppedBack,
    B.coordinates,
  ];

  if (!pathCollidesNodes(path3.slice(1, -1), [A.parent, B.parent])) {
    debug.set('Path3');
    return path3;
  }

  /**
   * 4 - Go around start node to side A, scale Vertical
   */

  let around = getPathAroundNode(gridSize, A, 'a');
  const path4 = [
    ...around,
    new Coordinates([around.at(-1)!.x, targetSteppedBack.y]),
    targetSteppedBack,
    B.coordinates,
  ];

  if (!pathCollidesNodes(path4.slice(1, -1), [A.parent, B.parent])) {
    debug.set('Path4');
    return path4;
  }

  /**
   * 4_1 - Go around start node to side A, scale Horizontal
   */

  around = getPathAroundNode(gridSize, A, 'a');
  const path4_1 = [
    ...around,
    new Coordinates([targetSteppedBack.x, around.at(-1)!.y]),
    targetSteppedBack,
    B.coordinates,
  ];

  if (!pathCollidesNodes(path4_1.slice(1, -1), [A.parent, B.parent])) {
    debug.set('Path4_1');
    return path4_1;
  }

  /**
   * 5 - Go around start node to side B, scale Vertical
   */

  around = getPathAroundNode(gridSize, A, 'b');
  const path5 = [
    ...around,
    new Coordinates([around.at(-1)!.x, targetSteppedBack.y]),
    targetSteppedBack,
    B.coordinates,
  ];

  if (!pathCollidesNodes(path5.slice(1, -1), [A.parent, B.parent])) {
    debug.set('Path5');
    return path5;
  }

  /**
   * 5_1 - Go around start node to side B, scale Horizontal
   */

  around = getPathAroundNode(gridSize, A, 'b');
  const path5_1 = [
    ...around,
    new Coordinates([targetSteppedBack.x, around.at(-1)!.y]),
    targetSteppedBack,
    B.coordinates,
  ];

  if (!pathCollidesNodes(path5_1.slice(1, -1), [A.parent, B.parent])) {
    debug.set('Path5_1');
    return path5_1;
  }

  /**
   * 6 - Go around end node to side A
   */
  /**
   * 7 - Go around end node to side B
   */

  debug.set('Nones');
  return null;
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

  return [];
}
