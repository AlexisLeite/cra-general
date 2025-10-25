import { TDirectedPoint } from '../primitives/Coordinates';
import { TDirection } from '../types';

type Path = { x: number; y: number }[];

// Toggle to enable/disable detailed timing logs
const ENABLE_TIMING_LOGS = false;

// Small utility to accumulate timings and counters without much overhead
class Timings {
  private t0 = 0;
  private sections = new Map<string, number>();
  private counts = new Map<string, number>();

  start() {
    this.t0 = performance.now();
  }

  add(name: string, deltaMs: number) {
    this.sections.set(name, (this.sections.get(name) || 0) + deltaMs);
  }

  inc(name: string, by = 1) {
    this.counts.set(name, (this.counts.get(name) || 0) + by);
  }

  total() {
    return performance.now() - this.t0;
  }

  log(label = 'findBestAnglePath timings') {
    if (!ENABLE_TIMING_LOGS) return;
    // Print compact ordered timings and counts
    const entries = Array.from(this.sections.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    // eslint-disable-next-line no-console
    console.groupCollapsed(label);
    for (const [k, v] of entries) {
      // eslint-disable-next-line no-console
      console.log(`${k}: ${v.toFixed(2)} ms`);
    }
    // eslint-disable-next-line no-console
    console.log('Counts:', Object.fromEntries(this.counts));
    // eslint-disable-next-line no-console
    console.log('Total:', this.total().toFixed(2), 'ms');
    // eslint-disable-next-line no-console
    console.groupEnd();
  }
}

const DIRS: Record<TDirection, [number, number]> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

function directionCost(prev: TDirection, next: TDirection): number {
  if (prev === next) return 1;
  if (
    (prev === 'up' && next === 'down') ||
    (prev === 'down' && next === 'up') ||
    (prev === 'left' && next === 'right') ||
    (prev === 'right' && next === 'left')
  )
    return 50;
  return 2;
}

// Costo mínimo teórico desde start hasta end (sin obstáculos)
// Nota: Heurísticas adicionales disponibles en versiones anteriores se eliminaron
// para evitar cortes prematuros que afectaban la completitud del algoritmo.

export function findBestAnglePath(
  startCandidates: TDirectedPoint[],
  endCandidates: TDirectedPoint[],
  getCellCost: (x: number, y: number, dir: TDirection) => number,
): Path {
  const timings = new Timings();
  if (ENABLE_TIMING_LOGS) timings.start();

  const MAX_ITERATIONS = 200_000; // Límite alto pero seguro para evitar loops infinitos

  const setupT0 = performance.now();

  // Build dynamic search bounds based on start/end extents with margin
  const allX = [
    ...startCandidates.map((s) => s.x),
    ...endCandidates.map((e) => e.x),
  ];
  const allY = [
    ...startCandidates.map((s) => s.y),
    ...endCandidates.map((e) => e.y),
  ];
  const minX0 = Math.min(...allX);
  const maxX0 = Math.max(...allX);
  const minY0 = Math.min(...allY);
  const maxY0 = Math.max(...allY);
  const spanX = Math.max(1, maxX0 - minX0);
  const spanY = Math.max(1, maxY0 - minY0);
  const margin = Math.max(6, Math.ceil((spanX + spanY) / 2) + 6); // generous margin around endpoints
  const minX = minX0 - margin;
  const maxX = maxX0 + margin;
  const minY = minY0 - margin;
  const maxY = maxY0 + margin;
  const cellCostCache = new Map<string, number>();

  // Precompute helpful structures
  const endPoints = endCandidates.map((e) => ({ x: e.x, y: e.y }));
  const useExactEndHeuristic = endPoints.length <= 8;
  const endRect = {
    minX: Math.min(...endPoints.map((p) => p.x)),
    maxX: Math.max(...endPoints.map((p) => p.x)),
    minY: Math.min(...endPoints.map((p) => p.y)),
    maxY: Math.max(...endPoints.map((p) => p.y)),
  };
  const minHeuristicToAnyEnd = (x: number, y: number) => {
    if (useExactEndHeuristic) {
      let hmin = Infinity;
      for (let i = 0; i < endPoints.length; i++) {
        const p = endPoints[i];
        const h = Math.abs(x - p.x) + Math.abs(y - p.y);
        if (h < hmin) hmin = h;
      }
      return hmin;
    } else {
      // Distance to axis-aligned rectangle around all ends (admissible lower bound)
      const dx =
        x < endRect.minX
          ? endRect.minX - x
          : x > endRect.maxX
            ? x - endRect.maxX
            : 0;
      const dy =
        y < endRect.minY
          ? endRect.minY - y
          : y > endRect.maxY
            ? y - endRect.maxY
            : 0;
      return dx + dy;
    }
  };

  // Cheap stage helpers: fast evaluation of rectilinear polylines (0-2 bends)
  const segmentCost = (
    sx: number,
    sy: number,
    ex: number,
    ey: number,
    prevDir: TDirection,
    bestSoFar: number,
  ): { cost: number; lastDir: TDirection } | null => {
    if (sx !== ex && sy !== ey) return null; // only axis-aligned
    let cost = 0;
    let dir: TDirection;
    let dx = 0;
    let dy = 0;
    if (sx !== ex) {
      dx = ex > sx ? 1 : -1;
      dir = dx > 0 ? 'right' : 'left';
    } else if (sy !== ey) {
      dy = ey > sy ? 1 : -1;
      dir = dy > 0 ? 'down' : 'up';
    } else {
      // same point, no movement
      return { cost: 0, lastDir: prevDir };
    }
    // First step uses turn cost from prevDir to dir (or straight cost if same)
    const len = Math.abs(ex - sx) + Math.abs(ey - sy);
    let x = sx;
    let y = sy;
    for (let step = 1; step <= len; step++) {
      const isFirst = step === 1;
      const stepDir = dir;
      const moveC = isFirst ? directionCost(prevDir, stepDir) : 1;
      x += dx;
      y += dy;
      const ccKey = `${x},${y},${stepDir}`;
      let cellC = cellCostCache.get(ccKey);
      if (cellC === undefined) {
        cellC = getCellCost(x, y, stepDir);
        cellCostCache.set(ccKey, cellC);
      }
      if (!isFinite(cellC)) return null; // blocked
      cost += moveC + cellC;
      if (cost >= bestSoFar) return null; // early exit
    }
    return { cost, lastDir: dir };
  };

  const buildPolylinePath = (points: { x: number; y: number }[]): Path => {
    // Expand axis-aligned polyline into per-cell steps
    const result: Path = [];
    let prev = points[0];
    result.push({ x: prev.x, y: prev.y });
    for (let i = 1; i < points.length; i++) {
      const curr = points[i];
      const dx = Math.sign(curr.x - prev.x);
      const dy = Math.sign(curr.y - prev.y);
      const len = Math.abs(curr.x - prev.x) + Math.abs(curr.y - prev.y);
      let x = prev.x;
      let y = prev.y;
      for (let step = 0; step < len; step++) {
        x += dx;
        y += dy;
        result.push({ x, y });
      }
      prev = curr;
    }
    return result;
  };

  // Try cheap candidates: 0-bend (if aligned), 1-bend L, and 2-bend small offsets
  const cheapT0 = performance.now();
  let bestCheap: { cost: number; path: Path } | null = null;
  const tryUpdateBest = (
    s: TDirectedPoint,
    e: { x: number; y: number },
    points: { x: number; y: number }[],
  ) => {
    // Evaluate the polyline cost quickly
    let runningCost = 0;
    let prevDir = s.direction;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      const seg = segmentCost(
        a.x,
        a.y,
        b.x,
        b.y,
        prevDir,
        bestCheap ? bestCheap.cost : Infinity,
      );
      if (!seg) return; // blocked or too costly
      runningCost += seg.cost;
      prevDir = seg.lastDir;
      if (bestCheap && runningCost >= bestCheap.cost) return; // prune
    }
    const fullPath = buildPolylinePath(points);
    if (!bestCheap || runningCost < bestCheap.cost) {
      bestCheap = { cost: runningCost, path: fullPath };
    }
  };

  const offsets = [1, 2, 3, 4, 6, 8];
  let cheapCandidatesTried = 0;
  for (const s of startCandidates) {
    for (const e of endPoints) {
      // 0-bend straight
      if (s.x === e.x || s.y === e.y) {
        tryUpdateBest(s, e, [
          { x: s.x, y: s.y },
          { x: e.x, y: e.y },
        ]);
        cheapCandidatesTried++;
      }
      // 1-bend L-shapes: HV and VH
      tryUpdateBest(s, e, [
        { x: s.x, y: s.y },
        { x: e.x, y: s.y },
        { x: e.x, y: e.y },
      ]);
      cheapCandidatesTried++;
      tryUpdateBest(s, e, [
        { x: s.x, y: s.y },
        { x: s.x, y: e.y },
        { x: e.x, y: e.y },
      ]);
      cheapCandidatesTried++;

      // 2-bend doglegs with small offsets from start's row/col or end's row/col
      for (const d of offsets) {
        // Horizontal detour: move to y±d, go horizontally, then to end
        tryUpdateBest(s, e, [
          { x: s.x, y: s.y },
          { x: s.x, y: s.y + d },
          { x: e.x, y: s.y + d },
          { x: e.x, y: e.y },
        ]);
        cheapCandidatesTried++;
        tryUpdateBest(s, e, [
          { x: s.x, y: s.y },
          { x: s.x, y: s.y - d },
          { x: e.x, y: s.y - d },
          { x: e.x, y: e.y },
        ]);
        cheapCandidatesTried++;

        // Vertical detour: move to x±d, go vertically, then to end
        tryUpdateBest(s, e, [
          { x: s.x, y: s.y },
          { x: s.x + d, y: s.y },
          { x: s.x + d, y: e.y },
          { x: e.x, y: e.y },
        ]);
        cheapCandidatesTried++;
        tryUpdateBest(s, e, [
          { x: s.x, y: s.y },
          { x: s.x - d, y: s.y },
          { x: s.x - d, y: e.y },
          { x: e.x, y: e.y },
        ]);
        cheapCandidatesTried++;
      }
    }
  }
  if (ENABLE_TIMING_LOGS)
    timings.add('cheap.stage', performance.now() - cheapT0);
  if (ENABLE_TIMING_LOGS) timings.inc('cheap.candidates', cheapCandidatesTried);
  if (bestCheap as unknown as { cost: number; path: Path }) {
    // eslint-disable-next-line no-console
    if (ENABLE_TIMING_LOGS) console.log('cheap path selected (no A*)');
    if (ENABLE_TIMING_LOGS) {
      timings.add('main.loop', 0);
      timings.log('findBestAnglePath timings (cheap)');
    }
    return (bestCheap as unknown as { cost: number; path: Path }).path;
  }

  // Nota: previamente se calculaba un costo teórico mínimo para cortar temprano.
  // Se elimina para evitar finalizaciones prematuras que impedían alcanzar el destino.

  // Simple binary min-heap for open set
  type Node = {
    x: number;
    y: number;
    dir: TDirection;
    cost: number; // g
    est: number; // f = g + h
    parent?: { x: number; y: number; parent?: any };
  };

  class MinHeap {
    arr: Node[] = [];
    size() {
      return this.arr.length;
    }
    push(n: Node) {
      this.arr.push(n);
      this.bubbleUp(this.arr.length - 1);
    }
    pop(): Node | undefined {
      if (this.arr.length === 0) return undefined;
      const top = this.arr[0];
      const last = this.arr.pop()!;
      if (this.arr.length > 0) {
        this.arr[0] = last;
        this.bubbleDown(0);
      }
      return top;
    }
    private bubbleUp(i: number) {
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (this.arr[p].est <= this.arr[i].est) break;
        const tmp = this.arr[p];
        this.arr[p] = this.arr[i];
        this.arr[i] = tmp;
        i = p;
      }
    }
    private bubbleDown(i: number) {
      const n = this.arr.length;
      while (true) {
        let smallest = i;
        const l = (i << 1) + 1;
        const r = l + 1;
        if (l < n && this.arr[l].est < this.arr[smallest].est) smallest = l;
        if (r < n && this.arr[r].est < this.arr[smallest].est) smallest = r;
        if (smallest === i) break;
        const tmp = this.arr[smallest];
        this.arr[smallest] = this.arr[i];
        this.arr[i] = tmp;
        i = smallest;
      }
    }
  }

  const open = new MinHeap();

  const best = new Map<string, number>();
  let iterations = 0;

  const setupT1 = performance.now();
  if (ENABLE_TIMING_LOGS) timings.add('setup', setupT1 - setupT0);

  for (const s of startCandidates) {
    const h = minHeuristicToAnyEnd(s.x, s.y);
    open.push({
      x: s.x,
      y: s.y,
      dir: s.direction,
      cost: 0,
      est: h,
      parent: undefined,
    });
    best.set(`${s.x},${s.y},${s.direction}`, 0);
  }

  if (ENABLE_TIMING_LOGS) {
    // eslint-disable-next-line no-console
    console.log('findBestAnglePath: starting search');
  }

  // bucle principal
  const loopStart = performance.now();
  while (open.size() && iterations < MAX_ITERATIONS) {
    iterations++;
    const popT0 = performance.now();
    const current = open.pop()!;
    if (ENABLE_TIMING_LOGS) timings.add('open.pop', performance.now() - popT0);

    const { x, y, dir, cost, parent } = current;

    // condición de llegada: dentro de margen 1 celda
    const reachedEnd = endCandidates.some(
      (e) => Math.abs(e.x - x) <= 1 && Math.abs(e.y - y) <= 1,
    );

    if (reachedEnd) {
      // Reconstruir el camino desde el parent chain
      const recT0 = performance.now();
      const path: Path = [];
      let node: any = { x, y, parent };
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      if (ENABLE_TIMING_LOGS)
        timings.add('path.reconstruct', performance.now() - recT0);
      // Stop immediately on first reach (A* guarantees optimal with admissible heuristic)
      if (ENABLE_TIMING_LOGS) {
        timings.add('main.loop', performance.now() - loopStart);
        timings.inc('iterations', iterations);
        timings.log('findBestAnglePath timings');
      }
      return path;
    }

    // expande a las 4 direcciones
    const neighborT0 = performance.now();
    for (const ndir of Object.keys(DIRS) as TDirection[]) {
      const [dx, dy] = DIRS[ndir];
      const nx = x + dx;
      const ny = y + dy;

      // límites
      if (nx < minX || ny < minY || nx > maxX || ny > maxY) {
        if (ENABLE_TIMING_LOGS) timings.inc('pruned.bounds');
        continue;
      }

      const moveCost = directionCost(dir, ndir);
      const ccT0 = performance.now();
      const ccKey = `${nx},${ny},${ndir}`;
      let cellCost = cellCostCache.get(ccKey);
      if (cellCost === undefined) {
        cellCost = getCellCost(nx, ny, ndir);
        cellCostCache.set(ccKey, cellCost);
      }
      if (ENABLE_TIMING_LOGS)
        timings.add('getCellCost', performance.now() - ccT0);
      if (!isFinite(cellCost)) continue;

      const newCost = cost + moveCost + cellCost;
      const key = ccKey;
      const prevBest = best.get(key);

      // Poda más agresiva: solo aceptar si mejora significativamente
      if (prevBest !== undefined && newCost >= prevBest - 1e-6) {
        if (ENABLE_TIMING_LOGS) timings.inc('pruned.cost-not-better');
        continue;
      }

      best.set(key, newCost);

      // heurística hacia el destino más cercano
      const hT0 = performance.now();
      const h = minHeuristicToAnyEnd(nx, ny);
      if (ENABLE_TIMING_LOGS) timings.add('heuristic', performance.now() - hT0);

      const pushT0 = performance.now();
      open.push({
        x: nx,
        y: ny,
        dir: ndir,
        cost: newCost,
        est: newCost + h,
        parent: { x, y, parent },
      });
      if (ENABLE_TIMING_LOGS)
        timings.add('open.push', performance.now() - pushT0);
    }
    if (ENABLE_TIMING_LOGS)
      timings.add('expand.neighbors', performance.now() - neighborT0);
    if (ENABLE_TIMING_LOGS) timings.inc('expanded.nodes');
  }

  // si no se encuentra camino
  if (ENABLE_TIMING_LOGS) {
    timings.add('main.loop', performance.now() - loopStart);
    timings.inc('iterations', iterations);
    timings.log('findBestAnglePath timings (not found)');
  }
  return [];
}
