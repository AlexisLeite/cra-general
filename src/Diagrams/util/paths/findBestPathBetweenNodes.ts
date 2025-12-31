import { Diagram } from '../../store/Diagram';
import { Gateway } from '../../store/elements/Gateway';
import { Coordinates } from '../../store/primitives/Coordinates';
import { getPathAroundNode } from './getPathAroundNode';
import { pathCollidesNodes } from './pathCollidesNodes';
import { stepFromGateway } from './stepBackFromGateway';
import { Node } from '../../store/elements/Node';
import { EdgePoint, type TEdgePointType } from '../../store/elements/EdgePoint';
import { arePointsAligned } from '../../components/objects/RenderEdge/util';
import type { TDirection } from '../../store/types';
import { makePathGrid } from './makePathGrid';
import { GridSnap } from '../../store/extensions/GridSnap';

export type Path = { x: number; y: number }[];

function filter(c: (Coordinates | undefined)[]) {
  return c.filter((d): d is Coordinates => Boolean(d));
}

function filterUndefined(x: any) {
  return x !== undefined;
}

type PathFinderContext = {
  origin: Coordinates;
  target: Coordinates;
  gateA?: Coordinates;
  gateB?: Coordinates;
  gridSize: number;
  checkCollisions: Node[];
  startGateway?: Gateway;
  targetGateway?: Gateway;
};

type PathFinder = (ctx: PathFinderContext) => Coordinates[] | null;

const pathHalfHorizontalVertical: PathFinder = ({
  origin,
  target,
  gateA,
  gateB,
  checkCollisions,
}) => {
  const path = [
    origin,
    new Coordinates([(origin.x + target.x) / 2, origin.y]),
    new Coordinates([(origin.x + target.x) / 2, target.y]),
    target,
  ];
  return !pathCollidesNodes(path, checkCollisions)
    ? filter([gateA, ...path, gateB])
    : null;
};

const pathHalfVerticalHorizontal: PathFinder = ({
  origin,
  target,
  gateA,
  gateB,
  checkCollisions,
}) => {
  const path = [
    origin,
    new Coordinates([origin.x, (origin.y + target.y) / 2]),
    new Coordinates([target.x, (origin.y + target.y) / 2]),
    target,
  ];
  return !pathCollidesNodes(path, checkCollisions)
    ? filter([gateA, ...path, gateB])
    : null;
};

const pathHorizontalThenVertical: PathFinder = ({
  origin,
  target,
  gateA,
  gateB,
  checkCollisions,
}) => {
  const path = filter([origin, new Coordinates([target.x, origin.y]), target]);
  return !pathCollidesNodes(path, checkCollisions)
    ? filter([gateA, ...path, gateB])
    : null;
};

const pathVerticalThenHorizontal: PathFinder = ({
  origin,
  target,
  gateA,
  gateB,
  checkCollisions,
}) => {
  const path = filter([origin, new Coordinates([origin.x, target.y]), target]);
  return !pathCollidesNodes(path, checkCollisions)
    ? filter([gateA, ...path, gateB])
    : null;
};

const pathAroundStartGateway =
  (side: 'a' | 'b', scale: 'vertical' | 'horizontal'): PathFinder =>
  ({ target, gateB, startGateway, gridSize, checkCollisions }) => {
    if (!startGateway) return null;
    const around = getPathAroundNode(gridSize, startGateway, side);
    const last = around.at(-1)!;
    const scaled =
      scale === 'vertical'
        ? new Coordinates([last.x, target.y])
        : new Coordinates([target.x, last.y]);
    const path = filter([...around, scaled, target]);
    return !pathCollidesNodes(path.slice(1), checkCollisions)
      ? filter([...path, gateB])
      : null;
  };

const pathAroundEndGateway =
  (side: 'a' | 'b', scale: 'vertical' | 'horizontal'): PathFinder =>
  ({ origin, gateA, targetGateway, gridSize, checkCollisions }) => {
    if (!targetGateway) return null;
    const around = getPathAroundNode(gridSize, targetGateway, side).reverse();
    const last = around.at(-2)!;
    const scaled =
      scale === 'vertical'
        ? new Coordinates([last.x, origin.y])
        : new Coordinates([origin.x, last.y]);
    const path = filter([origin, scaled, ...around]);
    return !pathCollidesNodes(path.slice(0, -1), checkCollisions)
      ? filter([gateA, ...path])
      : null;
  };

export const DEFAULT_PATH_STRATEGY: PathFinder[] = [
  pathHalfHorizontalVertical,
  pathHalfVerticalHorizontal,
  pathVerticalThenHorizontal,
  pathHorizontalThenVertical,
  pathAroundStartGateway('a', 'vertical'),
  pathAroundStartGateway('a', 'horizontal'),
  pathAroundStartGateway('b', 'vertical'),
  pathAroundStartGateway('b', 'horizontal'),
  pathAroundEndGateway('a', 'vertical'),
  pathAroundEndGateway('b', 'horizontal'),
];

const paths = {
  pathHalfHorizontalVertical,
  pathHalfVerticalHorizontal,
  pathHorizontalThenVertical,
  pathVerticalThenHorizontal,
  pathAroundStartGateway,
  pathAroundEndGateway,
};

function getBestStrategy(A: Gateway, B: Gateway): PathFinder[] {
  const a = A.orientation;
  const b = B.orientation;

  const hv = pathHorizontalThenVertical;
  const vh = pathVerticalThenHorizontal;

  const base = DEFAULT_PATH_STRATEGY.filter((p) => p !== hv && p !== vh);

  const isVertical = (o: TDirection) => o === 'up' || o === 'down';
  const isHorizontal = (o: TDirection) => o === 'left' || o === 'right';

  if (isVertical(a) && isVertical(b)) {
    const distance = A.coordinates.x - B.coordinates.x;

    return [
      paths.pathHalfVerticalHorizontal,
      paths.pathAroundStartGateway(distance < 0 ? 'a' : 'b', 'horizontal'),
      paths.pathAroundStartGateway(distance < 0 ? 'b' : 'a', 'horizontal'),
      paths.pathAroundEndGateway(distance < 0 ? 'b' : 'a', 'horizontal'),
      paths.pathAroundEndGateway(distance < 0 ? 'a' : 'b', 'horizontal'),
      paths.pathAroundStartGateway(distance < 0 ? 'a' : 'b', 'vertical'),
      paths.pathAroundStartGateway(distance < 0 ? 'b' : 'a', 'vertical'),
      paths.pathAroundEndGateway(distance < 0 ? 'b' : 'a', 'vertical'),
      paths.pathAroundEndGateway(distance < 0 ? 'a' : 'b', 'vertical'),
    ];
  }

  if (isHorizontal(a) && isHorizontal(b)) {
    const distance = A.coordinates.y - B.coordinates.y;

    return [
      paths.pathHalfHorizontalVertical,
      paths.pathAroundEndGateway(distance < 0 ? 'a' : 'b', 'vertical'),
      paths.pathAroundEndGateway(distance < 0 ? 'b' : 'a', 'vertical'),
      paths.pathAroundStartGateway(distance < 0 ? 'a' : 'b', 'vertical'),
      paths.pathAroundStartGateway(distance < 0 ? 'b' : 'a', 'vertical'),
      paths.pathAroundEndGateway(distance < 0 ? 'a' : 'b', 'horizontal'),
      paths.pathAroundEndGateway(distance < 0 ? 'b' : 'a', 'horizontal'),
      paths.pathAroundStartGateway(distance < 0 ? 'a' : 'b', 'horizontal'),
      paths.pathAroundStartGateway(distance < 0 ? 'b' : 'a', 'horizontal'),
    ];
  }

  if (isVertical(a)) {
    return [vh, hv, ...base];
  }

  return [hv, vh, ...base];
}

function findBestPathBetweenPoints(
  origin: Coordinates,
  target: Coordinates,
  {
    checkCollisions = [],
    gridSize,
    startGateway,
    targetGateway,
    pathStrategy = DEFAULT_PATH_STRATEGY,
  }: {
    checkCollisions?: Node[];
    gridSize: number;
    startGateway?: Gateway;
    targetGateway?: Gateway;
    pathStrategy?: PathFinder[];
  },
) {
  const ctx: PathFinderContext = {
    origin,
    target,
    gateA: startGateway?.coordinates,
    gateB: targetGateway?.coordinates,
    gridSize,
    checkCollisions,
    startGateway,
    targetGateway,
  };
  for (const finder of pathStrategy) {
    const path = finder(ctx);
    if (path) return path;
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
      arePointsAligned(result.at(-3)!, result.at(-2)!, result.at(-1)!) &&
      result.at(-2)!.mode === 'auto'
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

export function _findBestPathBetweenNodes(
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
    pathStrategy: getBestStrategy(A, B),
    gridSize,
    startGateway: A,
    targetGateway: B,
    checkCollisions: [A.parent, B.parent],
  });
}

export function findBestPathBetweenNodes(
  _diagram: Diagram,
  A: Gateway,
  B: Gateway,
): Coordinates[] {
  const gridSize = _diagram.getExtension(GridSnap).gridSize;

  let grid = makePathGrid(A, B, gridSize);
  let path = grid.run(A, B);

  if (path) {
    return filterResultPath(path.map((c) => getEdgePoint(c)));
  }

  grid = makePathGrid(A, B, gridSize / 2);
  path = grid.run(A, B);

  if (path) {
    return filterResultPath(path.map((c) => getEdgePoint(c)));
  }

  return [A.coordinates, B.coordinates];
}
