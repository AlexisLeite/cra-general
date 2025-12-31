import type { Gateway } from '../../store/elements/Gateway';
import { stepFromGateway } from './stepBackFromGateway';
import { GridSnap } from '../../store/extensions/GridSnap';
import { Coordinates } from '../../store/primitives/Coordinates';
import { Dimensions } from '../../store/primitives/Dimensions';

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
  private points = new Map<string, T>();

  public add(p: T) {
    const q = this.points.get(p.toString());
    if (q) {
      return q;
    }

    this.points.set(p.toString(), p);

    return p;
  }

  get values(): T[] {
    return [...this.points.values()];
  }
}

class PointSet extends UniqueSet<PathGridPoint> {}
class EdgesSet extends UniqueSet<PathGridEdge> {}

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

  connect(a?: PathGridPoint, b?: PathGridPoint) {
    if (a && b && !a.equals(b)) {
      a = this._points.add(a);
      b = this._points.add(b);

      const e = new PathGridEdge(a, b);

      if (!this.collideDetect.some((c) => e.collides(c))) {
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
        this.edgesFrom.get(b)!.push(newEdge);
        this.edgesTo.get(a)!.push(newEdge);
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

  public get edges() {
    return this._edges.values;
  }

  public get points() {
    return this._points.values;
  }
}

export function makePathGrid(A: Gateway, B: Gateway) {
  const gridSize = A.diagram.getExtension(GridSnap).gridSize;
  const grid = new PathsGrid([A.parent.box, B.parent.box]);

  const aStepped = stepFromGateway(gridSize, A);
  const bStepped = stepFromGateway(gridSize, B);

  /**
   * First of all, we calculate a common to every pair of nodes grid, which
   * consiste of the intersection of all relevant lines of each box, includding
   * the stepped back from the gateways.
   */

  const relevantX = [
    A.parent.box.coordinates.x - gridSize,
    A.parent.box.topRight.x + gridSize,
    B.parent.box.coordinates.x - gridSize,
    B.parent.box.topRight.x + gridSize,
    (A.parent.box.topRight.x +
      gridSize +
      B.parent.box.coordinates.x -
      gridSize) /
      2,
    aStepped.x,
    bStepped.x,
  ].sort();
  const relevantY = [
    A.parent.box.coordinates.y - gridSize,
    A.parent.box.bottomRight.y + gridSize,
    B.parent.box.coordinates.y - gridSize,
    B.parent.box.bottomRight.y + gridSize,
    (A.parent.box.bottomRight.y +
      gridSize +
      B.parent.box.coordinates.y -
      gridSize) /
      2,
    aStepped.y,
    bStepped.y,
  ].sort();

  for (let i = 0; i < relevantX.length; i++) {
    const x1 = relevantX[i];
    const x2 = relevantX[i + 1];
    for (let j = 0; j < relevantY.length; j++) {
      const y1 = relevantY[j];
      const y2 = relevantY[j + 1];

      const a = grid.add(x1, y1);
      const b = grid.add(x2, y1);
      const p = grid.add(x1, y2);
      const q = grid.add(x2, y2);

      grid.connect(a, b);
      grid.connect(p, q);
      grid.connect(a, p);
      grid.connect(b, q);
    }
  }

  const a = A.coordinates;
  const b = B.coordinates;

  /**
   * Then, we connect the gateways to the stepped back points.
   */

  grid.connect(grid.createPoint(a), grid.createPoint(aStepped));
  grid.connect(grid.createPoint(b), grid.createPoint(bStepped));

  return grid;
}
