import type { Gateway } from '../../store/elements/Gateway';
import { Coordinates } from '../../store/primitives/Coordinates';
import { Dimensions } from '../../store/primitives/Dimensions';
import { PriorityQueue } from '../PriorityQueue';

export class PathGridEdge {
  constructor(
    public from: PathGridPoint,
    public to: PathGridPoint,
  ) {}

  collides(box: Dimensions) {
    return box.collides(
      new Dimensions(
        [
          this.from.x,
          this.from.y,
          this.to.x - this.from.x,
          this.to.y - this.from.y,
        ],
        false,
      ),
      false,
    );
  }

  norm() {
    return new Dimensions(
      [
        this.from.x,
        this.from.y,
        this.to.x - this.from.x,
        this.to.y - this.from.y,
      ],
      false,
    ).norm;
  }

  toString() {
    return `${this.from.toString()} -> ${this.to.toString()}`;
  }
}

export class PathGridPoint extends Coordinates {
  constructor(
    protected grid: PathsGrid,
    data: [number, number],
  ) {
    super(data);
  }

  public get x() {
    return super.x;
  }

  public get y() {
    return super.y;
  }
}

class UniqueSet<T extends { toString(): string }> {
  private data = new Map<string, T>();

  public add(p: T) {
    const q = this.get(p);
    if (q) {
      return q;
    }

    this.data.set(p.toString(), p);

    return p;
  }

  public delete(p: T) {
    this.data.delete(p.toString());
  }

  public get empty() {
    return this.data.size === 0;
  }

  public has(p: { toString(): string }) {
    return this.data.has(p.toString());
  }

  public get(p: T) {
    return this.data.get(p.toString()) || null;
  }

  get values(): T[] {
    return [...this.data.values()];
  }
}

class PointSet extends UniqueSet<PathGridPoint> {}
class EdgesSet extends UniqueSet<PathGridEdge> {}

type Direction = 'horizontal' | 'vertical' | null;

type Stored = {
  point: PathGridPoint;
  direction: Direction;

  turns: number; // PRIMARY objective
  g: number; // path length
  priority: number; // used by PriorityQueue

  previous: Stored | null;
};

export class PathsGrid {
  private _points = new PointSet();
  private _edges = new EdgesSet();

  private edgesFrom = new Map<PathGridPoint, PathGridEdge[]>();
  private edgesTo = new Map<PathGridPoint, PathGridEdge[]>();

  constructor(private collideDetect: Dimensions[]) {}

  add(x?: number, y?: number) {
    if (x === undefined || y === undefined) {
      return undefined;
    }

    const c = new PathGridPoint(this, [x, y]);
    this._points.add(c);
    return c;
  }

  connect(a?: PathGridPoint, b?: PathGridPoint, force = false) {
    if (a && b && !a.equals(b)) {
      a = this._points.add(a);
      b = this._points.add(b);

      const e = new PathGridEdge(a, b);

      if (force || !this.collideDetect.some((c) => e.collides(c))) {
        const newEdge = this._edges.add(e);

        if (!this.edgesFrom.has(a)) {
          this.edgesFrom.set(a, []);
        }
        if (!this.edgesTo.has(b)) {
          this.edgesTo.set(b, []);
        }
        if (!this.edgesTo.has(a)) {
          this.edgesTo.set(a, []);
        }
        if (!this.edgesFrom.has(b)) {
          this.edgesFrom.set(b, []);
        }

        this.edgesFrom.get(a)!.push(newEdge);
        this.edgesTo.get(b)!.push(newEdge);
      }
    }
  }

  createPoint(c: Coordinates) {
    return new PathGridPoint(this, [c.x, c.y]);
  }

  getEdgesFrom(p: PathGridPoint) {
    return [...(this.edgesFrom.get(this._points.add(p)) || [])];
  }

  getEdgesTo(p: PathGridPoint) {
    return [...(this.edgesTo.get(this._points.add(p)) || [])];
  }

  getNeighbors(p: PathGridPoint) {
    return [
      ...this.getEdgesFrom(p),
      ...this.getEdgesTo(p).map((c) => new PathGridEdge(c.to, c.from)),
    ];
  }

  removeInRadio(center: Coordinates, distance: number) {
    for (const point of this._points.values) {
      if (point.distance(center) < distance) {
        this.edgesFrom.get(point)?.forEach((c) => {
          this._edges.delete(c);
        });
        this.edgesTo.get(point)?.forEach((c) => {
          this._edges.delete(c);
        });
        this.edgesFrom.delete(point);
        this.edgesTo.delete(point);
        this._points.delete(point);
      }
    }
  }

  removeColliding(except: Dimensions[]) {
    for (const point of this._points.values) {
      if (except.some((c) => c.collides(point, true))) {
        this._points.delete(point);
        this.edgesFrom.delete(point);
        this.edgesTo.delete(point);
      }
    }
  }

  private buildPath(to: Stored) {
    const path = [to.point];

    let current = to;
    while (current.previous) {
      current = current.previous;
      path.unshift(current.point);
    }

    return path;
  }

  run(start: Gateway, end: Gateway) {
    const s = this._points.get(this.createPoint(start.coordinates));
    if (!s) throw new Error('Bad starting point');

    const e = this._points.get(this.createPoint(end.coordinates));
    if (!e) throw new Error('Bad ending point');

    const pending = new PriorityQueue<Stored>();
    const best = new Map<string, { turns: number; g: number }>();

    // lexicographic dominance: turns >> distance
    const TURN_WEIGHT = 1_000_000;

    // initial state (direction comes from gateway)
    pending.push({
      point: s,
      direction: start.direction,
      turns: 0,
      g: 0,
      priority: s.distanceManhattan(e),
      previous: null,
    });

    const endings = new PriorityQueue<Stored>();

    while (!pending.isEmpty()) {
      const p = pending.pop()!;

      if (p.point.equals(e)) {
        endings.push(p);
        continue;
      }

      for (const neighbor of this.getNeighbors(p.point)) {
        // ✅ correct direction detection
        const newDirection: Direction =
          neighbor.to.x !== neighbor.from.x ? 'horizontal' : 'vertical';

        // ✅ correct turn detection
        const isTurn = p.direction !== null && newDirection !== p.direction;

        const turns = p.turns + (isTurn ? 1 : 0);

        const length = neighbor.norm();
        const g = p.g + length;
        const h = neighbor.to.distanceManhattan(e);

        const priority = turns * TURN_WEIGHT + g + h;

        const key = `${neighbor.to.toString()}|${newDirection}`;
        const prev = best.get(key);

        if (
          prev &&
          (prev.turns < turns || (prev.turns === turns && prev.g <= g))
        ) {
          continue;
        }

        best.set(key, { turns, g });

        pending.push({
          point: neighbor.to,
          direction: newDirection,
          turns,
          g,
          priority,
          previous: p,
        });
      }
    }

    const bestEnding = endings.pop();
    return bestEnding ? this.buildPath(bestEnding) : null;
  }

  public get edges() {
    return this._edges.values;
  }

  public get points() {
    return this._points.values;
  }
}
