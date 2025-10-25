import { TDirectedPoint } from '../../../primitives/Coordinates';
import { Dimensions } from '../../../primitives/Dimensions';
import { DiagramSnapshot } from './pathWorker';

type Path = { x: number; y: number }[];

type Cell = {
  leftLeft: number;
  leftTop: number;
  topTop: number;
  topLeft: number;
};

function buildOptimumPath(x: number, y: number, grid: Cell[][]): Path {
  let best = grid[y][x].leftLeft;
  let xStep = -1;
  let yStep = 0;

  if (grid[y][x].leftTop < best) {
    best = grid[y][x].leftTop;
  }
  if (grid[y][x].topLeft < best) {
    best = grid[y][x].topLeft;
    xStep = 0;
    yStep = -1;
  }
  if (grid[y][x].topTop < best) {
    best = grid[y][x].topTop;
    xStep = 0;
    yStep = -1;
  }

  return [
    ...(grid[y + yStep]?.[x + xStep]
      ? buildOptimumPath(x + xStep, y + yStep, grid)
      : []),
    { x, y },
  ];
}

function findBestPathAmongNodes(
  a: TDirectedPoint,
  b: TDirectedPoint,
  rects: Dimensions[],
): { path: Path; cost: number } {
  const mustReflexX = a.x > b.x;
  const mustReflexY = a.y > b.y;

  const grid: Cell[][] = [[{ leftLeft: 0, leftTop: 0, topLeft: 0, topTop: 0 }]];

  const bx = b.x;
  const by = b.y;

  if (mustReflexX) {
    b.x = 2 * a.x - b.x;
  }
  if (mustReflexY) {
    b.y = 2 * a.y - b.y;
  }

  // Pre-filter rectangles to only those intersecting the search area between a and b (after reflection)
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);

  const relevantRects = rects.filter((r) => {
    const rRight = r.x + r.width;
    const rBottom = r.y + r.height;
    return !(rRight <= minX || r.x >= maxX || rBottom <= minY || r.y >= maxY);
  });

  const width = b.x - a.x;
  const height = b.y - a.y;

  for (let row = 0; row <= height; row++) {
    if (!grid[row]) {
      grid[row] = [];
    }
    for (let col = 0; col <= width; col++) {
      if (!grid[row][col]) {
        grid[row][col] = {
          leftLeft: Math.min(
            (grid[row][col - 1]?.leftLeft ?? Infinity) + 1,
            (grid[row][col - 1]?.leftTop ?? Infinity) + 1,
          ),
          leftTop: Math.min(
            (grid[row][col - 1]?.topLeft ?? Infinity) + 2,
            (grid[row][col - 1]?.topTop ?? Infinity) + 2,
          ),
          topLeft: Math.min(
            (grid[row - 1]?.[col]?.leftLeft ?? Infinity) + 2,
            (grid[row - 1]?.[col]?.leftTop ?? Infinity) + 2,
          ),
          topTop: Math.min(
            (grid[row - 1]?.[col]?.topLeft ?? Infinity) + 1,
            (grid[row - 1]?.[col]?.topTop ?? Infinity) + 1,
          ),
        };

        // Inline point-in-rect test to avoid allocating Coordinates per cell
        const px = a.x + col;
        const py = a.y + row;
        if (
          relevantRects.some(
            (r) =>
              px >= r.x &&
              px <= r.x + r.width &&
              py >= r.y &&
              py <= r.y + r.height,
          )
        ) {
          grid[row][col].leftLeft += 30;
          grid[row][col].leftTop += 30;
          grid[row][col].topLeft += 30;
          grid[row][col].topTop += 30;
        }
      }
    }
  }

  const optimum = grid.at(-1)!.at(-1)!;
  const path = buildOptimumPath(grid[0].length - 1, grid.length - 1, grid).map(
    (c) => ({
      x: mustReflexX ? a.x - c.x : a.x + c.x,
      y: mustReflexY ? a.y - c.y : a.y + c.y,
    }),
  );

  if (mustReflexX) {
    b.x = bx;
  }
  if (mustReflexY) {
    b.y = by;
  }

  return {
    path,
    cost: Math.min(
      optimum.leftLeft,
      optimum.leftTop,
      optimum.topLeft,
      optimum.topTop,
    ),
  };
}

export function findBestAnglePath(
  startCandidates: TDirectedPoint[],
  endCandidates: TDirectedPoint[],
  snapshot: DiagramSnapshot,
): { path: Path; cost: number } {
  let best: { path: Path; cost: number } = { path: [], cost: Infinity };
  const all: { path: Path; cost: number }[] = [];

  const rects = snapshot.nodes.map(
    (c) => new Dimensions([c.x, c.y, c.width, c.height]),
  );

  for (const start of startCandidates) {
    for (const end of endCandidates) {
      try {
        const path = findBestPathAmongNodes(start, end, rects);
        all.push(path);
        if (path.cost < best.cost) {
          best = path;
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  return best;
}
