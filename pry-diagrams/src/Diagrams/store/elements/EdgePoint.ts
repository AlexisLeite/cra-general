import { Coordinates } from '../primitives/Coordinates';
import { makeObservable, observable } from 'mobx';
import { Element } from './Element';
import type { AnyMouseEvent } from './Events';

export type TEdgePointType = 'auto' | 'manual' | 'static';

export class EdgePoint extends Coordinates {
  mode: TEdgePointType = 'auto';

  constructor(
    public parent: Element | null,
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
    return new EdgePoint(this.parent, super.copy());
  }

  toString(includeMode = false): string {
    if (includeMode) {
      return `(${this.x}, ${this.y}): ${this.mode}`;
    }
    return super.toString();
  }
}
