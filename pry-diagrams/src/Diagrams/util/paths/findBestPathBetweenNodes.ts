import { Diagram } from '../../store/Diagram';
import { Gateway } from '../../store/elements/Gateway';
import { Coordinates } from '../../store/primitives/Coordinates';
import { Dimensions } from '../../store/primitives/Dimensions';
import { EdgePoint } from '../../store/elements/EdgePoint';
import { arePointsAligned } from '../../components/objects/RenderEdge/util';
import { GridSnap } from '../../store/extensions/GridSnap';
import { resolvePathCore } from './resolvePathCore';
import { stepFromGateway } from './stepBackFromGateway';

export type Path = { x: number; y: number }[];

const EPS = 0.001;

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

function isAxisAligned(a: Coordinates, b: Coordinates) {
  return Math.abs(a.x - b.x) < EPS || Math.abs(a.y - b.y) < EPS;
}

function segmentCollisionPenalty(a: Coordinates, b: Coordinates, box: Dimensions) {
  if (Math.abs(a.x - b.x) < EPS) {
    const x = a.x;
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);
    const overlapsY = maxY > box.y + EPS && minY < box.y + box.height - EPS;
    const crossesX = x > box.x + EPS && x < box.x + box.width - EPS;
    return overlapsY && crossesX ? 1 : 0;
  }

  const y = a.y;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const overlapsX = maxX > box.x + EPS && minX < box.x + box.width - EPS;
  const crossesY = y > box.y + EPS && y < box.y + box.height - EPS;
  return overlapsX && crossesY ? 1 : 0;
}

function buildFallbackPath(
  gridSize: number,
  A: Gateway,
  B: Gateway,
  ADisplacement: Coordinates,
  BDisplacement: Coordinates,
) {
  const start = A.coordinates.sum(ADisplacement);
  const end = B.coordinates.sum(BDisplacement);
  const startStepped = stepFromGateway(gridSize, start, A.orientation);
  const endStepped = stepFromGateway(gridSize, end, B.orientation);
  const aBox = A.parent.box.inflate(gridSize);
  const bBox = B.parent.box.inflate(gridSize);

  const minX = Math.min(aBox.x, bBox.x);
  const maxX = Math.max(aBox.x + aBox.width, bBox.x + bBox.width);
  const minY = Math.min(aBox.y, bBox.y);
  const maxY = Math.max(aBox.y + aBox.height, bBox.y + bBox.height);

  const xLanes = Array.from(
    new Set([
      startStepped.x,
      endStepped.x,
      minX - gridSize * 2,
      maxX + gridSize * 2,
      (startStepped.x + endStepped.x) / 2,
    ]),
  );
  const yLanes = Array.from(
    new Set([
      startStepped.y,
      endStepped.y,
      minY - gridSize * 2,
      maxY + gridSize * 2,
      (startStepped.y + endStepped.y) / 2,
    ]),
  );

  const candidates: Coordinates[][] = [];
  const push = (points: Coordinates[]) => {
    for (let i = 0; i < points.length - 1; i++) {
      if (!isAxisAligned(points[i], points[i + 1])) {
        return;
      }
    }
    candidates.push(points);
  };

  if (isAxisAligned(startStepped, endStepped)) {
    push([start, startStepped, endStepped, end]);
  }

  push([
    start,
    startStepped,
    new Coordinates([startStepped.x, endStepped.y]),
    endStepped,
    end,
  ]);
  push([
    start,
    startStepped,
    new Coordinates([endStepped.x, startStepped.y]),
    endStepped,
    end,
  ]);

  for (const x of xLanes) {
    push([
      start,
      startStepped,
      new Coordinates([x, startStepped.y]),
      new Coordinates([x, endStepped.y]),
      endStepped,
      end,
    ]);
  }

  for (const y of yLanes) {
    push([
      start,
      startStepped,
      new Coordinates([startStepped.x, y]),
      new Coordinates([endStepped.x, y]),
      endStepped,
      end,
    ]);
  }

  const score = (points: Coordinates[]) => {
    let collisions = 0;
    let length = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      length += Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

      // Exclude gateway escape segments from collision scoring.
      if (i > 0 && i < points.length - 2) {
        collisions += segmentCollisionPenalty(a, b, aBox);
        collisions += segmentCollisionPenalty(a, b, bBox);
      }
    }

    return collisions * 1_000_000 + length + points.length;
  };

  candidates.sort((a, b) => score(a) - score(b));
  return candidates[0] ?? [start, end];
}

export function findBestPathBetweenNodes(
  _diagram: Diagram,
  A: Gateway,
  B: Gateway,
  ADisplacement: Coordinates = new Coordinates([0, 0]),
  BDisplacement: Coordinates = new Coordinates([0, 0]),
): Coordinates[] {
  const gridSize = _diagram.getExtension(GridSnap).gridSize;

  let path = resolvePathCore({
    A: {
      coordinates: A.coordinates.sum(ADisplacement).raw,
      orientation: A.orientation,
      parentDimensions: A.parent.box.raw,
    },
    B: {
      coordinates: B.coordinates.sum(BDisplacement).raw,
      orientation: B.orientation,
      parentDimensions: B.parent.box.raw,
    },
    gridSize,
  });

  if (!path) {
    path = buildFallbackPath(gridSize, A, B, ADisplacement, BDisplacement).map(
      (c) => c.raw,
    );
  }

  return filterResultPath(path.map((c) => new EdgePoint(null, [...c, 'auto'])));
}
