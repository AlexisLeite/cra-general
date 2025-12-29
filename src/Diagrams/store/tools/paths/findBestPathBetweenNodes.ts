import { Diagram } from '../../Diagram';
import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';
import { getPathAroundNode } from './getPathAroundNode';
import { pathCollidesNodes } from './pathCollidesNodes';
import { stepFromGateway } from './stepBackFromGateway';
import type { TDirection } from '../../types';
import { Node } from '../../elements/Node';
import { EdgePoint, type TEdgePointType } from '../../elements/EdgePoint';
import { arePointsAligned } from '../../../components/objects/RenderEdge/util';
import { GridSnap } from '../GridSnap';

export type Path = { x: number; y: number }[];

function filter(c: (Coordinates | undefined)[]) {
  return c.filter((d): d is Coordinates => Boolean(d));
}

function filterUndefined(x: any) {
  return x !== undefined;
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

  const path2 = [
    origin,
    new Coordinates([(origin.x + target.x) / 2, origin.y]),
    new Coordinates([(origin.x + target.x) / 2, target.y]),
    target,
  ];

  if (!pathCollidesNodes(path2, checkCollisions || [])) {
    return filter([gateA, ...path2, gateB]);
  }

  /**
   * 3 - Half vertical, horizontal, half vertical
   */

  const path3 = [
    origin,
    new Coordinates([origin.x, (origin.y + target.y) / 2]),
    new Coordinates([target.x, (origin.y + target.y) / 2]),
    target,
  ];

  if (!pathCollidesNodes(path3, checkCollisions || [])) {
    return filter([gateA, ...path3, gateB]);
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
      origin,
      new Coordinates([target.x, origin.y]),
      target,
    ]);

    if (!pathCollidesNodes(path0, checkCollisions || [])) {
      return filter([gateA, ...path0, gateB]);
    }
    return null;
  }

  /**
   * 1 - Vertical, then horizontal
   */
  function checkPath1() {
    const path1 = filter([
      origin,
      new Coordinates([origin.x, target.y]),
      target,
    ]);

    if (!pathCollidesNodes(path1, checkCollisions || [])) {
      return filter([gateA, ...path1, gateB]);
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
    ]);

    if (!pathCollidesNodes(path4.slice(1), checkCollisions || [])) {
      return filter([...path4, gateB]);
    }

    /**
     * 4_1 - Go around start node to side A, scale Horizontal
     */

    around = getPathAroundNode(gridSize, A, 'a');
    const path4_1 = filter([
      ...around,
      new Coordinates([target.x, around.at(-1)!.y]),
      target,
    ]);

    if (!pathCollidesNodes(path4_1.slice(1), checkCollisions || [])) {
      return filter([...path4_1, gateB]);
    }

    /**
     * 5 - Go around start node to side B, scale Vertical
     */

    around = getPathAroundNode(gridSize, A, 'b');
    const path5 = filter([
      ...around,
      new Coordinates([around.at(-1)!.x, target.y]),
      target,
    ]);

    if (!pathCollidesNodes(path5.slice(1), checkCollisions || [])) {
      return filter([...path5, gateB]);
    }

    /**
     * 5_1 - Go around start node to side B, scale Horizontal
     */

    around = getPathAroundNode(gridSize, A, 'b');
    const path5_1 = filter([
      ...around,
      new Coordinates([target.x, around.at(-1)!.y]),
      target,
    ]);

    if (!pathCollidesNodes(path5_1.slice(1), checkCollisions || [])) {
      return filter([...path5_1, gateB]);
    }

    /**
     * 6 - Go around end node to side A, scale Vertical
     */
    around = getPathAroundNode(gridSize, B, 'a').reverse();
    const path6 = filter([
      origin,
      new Coordinates([around[0].x, origin.y]),
      ...around,
    ]);

    if (!pathCollidesNodes(path6.slice(0, -1), checkCollisions || [])) {
      return filter([gateA, ...path6]);
    }
    /**
     * 6_1 - Go around end node to side A, scale Horizontal
     */
    around = getPathAroundNode(gridSize, B, 'b').reverse();
    const path6_1 = filter([
      origin,
      new Coordinates([around[0].x, origin.y]),
      ...around,
    ]);

    if (!pathCollidesNodes(path6_1.slice(0, -1), checkCollisions || [])) {
      return filter([gateA, ...path6_1]);
    }
  }
  return null;
}

type Segment = {
  from: EdgePoint;
  to: EdgePoint;
};

function getEdgePoint(step: Coordinates, mode: TEdgePointType = 'auto') {
  return step instanceof EdgePoint
    ? step
    : new EdgePoint(
        null,
        [...step.raw, mode].filter(filterUndefined) as [
          number,
          number,
          TEdgePointType,
        ],
      );
}

function filterResultPath(steps: EdgePoint[]) {
  const result: EdgePoint[] = [];

  let lastStr = '';
  for (let i = 0; i < steps.length; i++) {
    if (lastStr === steps[i].toString()) {
      if (steps[i].mode === 'manual') {
        result[result.length - 1] = steps[i];
      }
    } else {
      lastStr = steps[i].toString();
      result.push(steps[i]);
    }

    if (
      result.length >= 3 &&
      arePointsAligned(result.at(-3)!, result.at(-2)!, result.at(-1)!)
    ) {
      result.splice(result.length - 2, 1);
    }
  }

  return result;
}

function findDynamicSegments(steps: Coordinates[]): (Segment | EdgePoint)[] {
  const seenNodes = new Set<string>();
  const filtered = steps
    .map((c) => getEdgePoint(c))
    .filter((c, i) => {
      if (getEdgePoint(c).mode === 'manual') {
        if (!seenNodes.has(c.toString())) {
          seenNodes.add(c.toString());
          return true;
        }
      } else {
        if (
          (i === 0 || i === steps.length - 1) &&
          !seenNodes.has(c.toString())
        ) {
          seenNodes.add(c.toString());
          return true;
        }
      }

      return false;
    });

  const res: (Segment | EdgePoint)[] = [];

  let last = 0;
  for (let i = 0; i < filtered.length; i++) {
    const s = filtered[i];
    if (s.mode === 'manual') {
      if (last >= i) {
        res.push(s);
      } else {
        res.push({ from: filtered[last], to: s });
      }
      last = i;
    }
  }

  if (last < filtered.length) {
    res.push({ from: filtered[last], to: filtered.at(-1)! });
  }

  return res;
}

function _findBestPathBetweenNodes(
  gridSize: number,
  A: Gateway,
  B: Gateway,
): Coordinates[] | null {
  const edge = A.outgoingEdges.find((c) => c.to === B);

  const originSteppedBack = stepFromGateway(gridSize, A);
  const targetSteppedBack = stepFromGateway(gridSize, B);

  if (edge?.hasManualSteps) {
    const path = [
      originSteppedBack,
      ...edge.steps.slice(1, -1),
      targetSteppedBack,
    ];

    const segments = findDynamicSegments(path);
    segments.splice(1, -1);

    const res = [originSteppedBack, ...segments, targetSteppedBack]
      .map((c) =>
        c instanceof Coordinates
          ? c
          : findBestPathBetweenPoints(c.from, c.to, {
              preferOrientation: B.orientation,
              gridSize,
              checkCollisions: [A.parent, B.parent],
            }),
      )
      .reduce<EdgePoint[]>((acc, cur) => {
        if (cur instanceof Coordinates) {
          acc.push(getEdgePoint(cur));
        } else if (cur) {
          acc.push(...cur.map((c) => getEdgePoint(c)));
        }

        return acc;
      }, []);

    return [
      getEdgePoint(A.coordinates),
      ...filterResultPath(res),
      getEdgePoint(B.coordinates),
    ];
  }

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
  const snap = diagram.getExtension(GridSnap);

  let res = _findBestPathBetweenNodes(snap.gridSize || 50, A, B);
  if (res) {
    return res;
  }

  res = _findBestPathBetweenNodes((snap.gridSize || 50) / 2, A, B);
  if (res) {
    return res;
  }

  return [A.coordinates.copy(), B.coordinates.copy()];
}
