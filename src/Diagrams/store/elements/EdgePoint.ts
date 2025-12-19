import { Coordinates } from '../primitives/Coordinates';
import { AnyMouseEvent } from '../Canvas';
import { makeObservable, observable } from 'mobx';

export class EdgePoint extends Coordinates {
  mode: 'auto' | 'manual' | 'static' = 'auto';

  constructor(items?: AnyMouseEvent | Event | Coordinates | number[]) {
    super(items);

    makeObservable(this, { mode: observable });

    if (items instanceof EdgePoint) {
      this.mode = items.mode;
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
