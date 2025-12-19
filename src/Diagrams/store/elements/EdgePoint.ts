import { Coordinates } from '../primitives/Coordinates';
import { AnyMouseEvent } from '../Canvas';
import { makeObservable, observable } from 'mobx';

export type TEdgePointType = 'auto' | 'manual' | 'static';

export class EdgePoint extends Coordinates {
  mode: TEdgePointType = 'auto';

  constructor(
    items?:
      | AnyMouseEvent
      | Event
      | Coordinates
      | number[]
      | [number, number, TEdgePointType],
  ) {
    super(
      Array.isArray(items) ? (items.slice(0, 2) as [number, number]) : items,
    );

    makeObservable(this, { mode: observable });

    if (items instanceof EdgePoint) {
      this.mode = items.mode;
    } else if (Array.isArray(items) && items.length === 3) {
      this.mode = items[2] as TEdgePointType;
    }
  }

  copy() {
    return new EdgePoint(super.copy());
  }

  toString(includeMode = false): string {
    if (includeMode) {
      return `(${this.x}, ${this.y}): ${this.mode}`;
    }
    return super.toString();
  }
}
