import type { Diagram } from '../../Diagram';
import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';

export type Path = { x: number; y: number }[];

function prepareGatewayForConnection(
  diagram: Diagram,
  from: Gateway,
  to: Gateway,
) {
  const path: Coordinates[] = [from.coordinates.copy()];
  const offset = diagram.gridSize;
  let c: Coordinates | null;

  switch (from.orientation) {
    case 'down':
      path.push(from.coordinates.copy().sum([0, offset]));

      if (from.coordinates.x < to.coordinates.x) {
        path.push(
          from.coordinates
            .copy()
            .sum(new Coordinates([from.parent.box.width + offset, offset])),
        );
        path.push(
          from.coordinates
            .copy()
            .sum(
              new Coordinates([
                from.parent.box.width + offset,
                Math.max(to.coordinates.y, -from.parent.box.height - offset),
              ]),
            ),
        );
      } else {
        c = from.coordinates
          .copy()
          .sum(new Coordinates([-from.parent.box.width / 2 - offset, offset]));
        if (c.x < to.coordinates.x + to.parent.box.width / 2 + offset) {
          c.set(0, to.coordinates.x + to.parent.box.width / 2 + offset);
        }
        path.push(c);

        c = from.coordinates
          .copy()
          .sum(
            new Coordinates([
              -from.parent.box.width / 2 - offset,
              -from.parent.box.height,
            ]),
          );
        if (c.x < to.coordinates.x + to.parent.box.width / 2 + offset) {
          c.set(0, to.coordinates.x + to.parent.box.width / 2 + offset);
        }
        if (to.coordinates.y + offset > c.y) {
          c.set(1, to.coordinates.y + offset);
        }
        path.push(c);
      }
      break;
    case 'left':
      path.push(from.coordinates.copy().sum([-offset, 0]));
      break;
    case 'right':
      path.push(from.coordinates.copy().sum([offset, 0]));
      break;
    case 'up':
      path.push(from.coordinates.copy().sum([0, -offset]));
      break;
  }

  return path;
}
function prepareGatewayForReceivingConnection(
  diagram: Diagram,
  to: Gateway,
  from: Coordinates,
) {
  const path: Coordinates[] = [to.coordinates.copy()];
  const offset = diagram.gridSize;

  switch (to.orientation) {
    case 'down':
      path.unshift(to.coordinates.copy().sum([0, offset]));
      console.log('DOWN');

      if (to.coordinates.y > from.y) {
        // To está más abajo que from
        if (to.coordinates.x < from.x) {
          path.unshift(
            to.coordinates
              .copy()
              .sum(new Coordinates([to.parent.box.width / 2 + offset, offset])),
          );
          path.unshift(
            to.coordinates
              .copy()
              .sum(
                new Coordinates([
                  to.parent.box.width / 2 + offset,
                  -to.parent.box.height - offset,
                ]),
              ),
          );
        } else {
          path.unshift(
            to.coordinates
              .copy()
              .sum(new Coordinates([-to.parent.box.width - offset, offset])),
          );
          path.unshift(
            to.coordinates
              .copy()
              .sum(
                new Coordinates([
                  -to.parent.box.width - offset,
                  Math.max(-to.parent.box.height - offset, from.y),
                ]),
              ),
          );
        }
      }
      break;
    case 'left':
      path.unshift(to.coordinates.copy().sum([-offset, 0]));
      break;
    case 'right':
      path.unshift(to.coordinates.copy().sum([offset, 0]));
      break;
    case 'up':
      path.unshift(to.coordinates.copy().sum([0, -offset]));
      break;
  }

  return path;
}

export function findBestPathBetweenNodes(
  diagram: Diagram,
  A: Gateway,
  B: Gateway,
): Coordinates[] {
  /**
   * We must always choose a gate
   */

  const startPath = prepareGatewayForConnection(diagram, A, B);
  const startPoint = startPath.at(-1)!;
  const endPath = prepareGatewayForReceivingConnection(diagram, B, startPoint);
  const endPoint = endPath[0];

  const diff = startPoint.copy().substract(endPoint);

  const distX = diff.x;
  const distY = diff.y;

  if (distY < distX) {
    return [
      // ...startPath,
      // new Coordinates([startPoint.x, (startPoint.y + endPoint.y) / 2]),
      // new Coordinates([endPoint.x, (startPoint.y + endPoint.y) / 2]),
      // ...endPath,
    ];
  } else {
    return [
      ...startPath,
      // new Coordinates([(startPoint.x + endPoint.x) / 2, startPoint.y]),
      // new Coordinates([(startPoint.x + endPoint.x) / 2, endPoint.y]),
      ...endPath,
    ];
  }
}
