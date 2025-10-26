import type { Diagram } from '../../Diagram';
import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';
import { findBestPathEnd } from './findBestPathEnd';
import { findBestPathStart } from './findBestPathStart';
import { pathDebug } from './PathDebug';

export type Path = { x: number; y: number }[];

export function findBestPathBetweenNodes(
  diagram: Diagram,
  A: Gateway,
  B: Gateway,
): Coordinates[] {
  /**
   * We must always choose a gate
   */

  const startPath = findBestPathStart(diagram, A, B);
  const startEnd = startPath.at(-1)!;
  const endPath = findBestPathEnd(diagram, B, startEnd).reverse();
  const endStart = endPath[0];

  const diff = A.coordinates.substract(B.coordinates).abs;

  const distX = diff.x;
  const distY = diff.y;

  if (distX < distY) {
    return [
      ...(pathDebug.showStart ? startPath : []),
      ...(pathDebug.showPath
        ? [
            new Coordinates([startEnd.x, (startEnd.y + endStart.y) / 2]),
            new Coordinates([endStart.x, (startEnd.y + endStart.y) / 2]),
          ]
        : []),
      ...(pathDebug.showEnd ? endPath : []),
    ];
  }

  return [
    ...(pathDebug.showStart ? startPath : []),
    ...(pathDebug.showPath
      ? [
          new Coordinates([(startEnd.x + endStart.x) / 2, startEnd.y]),
          new Coordinates([(startEnd.x + endStart.x) / 2, endStart.y]),
        ]
      : []),
    ...(pathDebug.showEnd ? endPath : []),
  ];
}
