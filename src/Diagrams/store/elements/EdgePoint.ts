import { Coordinates } from '../primitives/Coordinates';
import { AnyMouseEvent } from '../Canvas';
import { makeObservable, observable } from 'mobx';

export class EdgePoint extends Coordinates {
  mode: 'auto' | 'manual' = 'auto';

  constructor(items?: AnyMouseEvent | Event | Coordinates | number[]) {
    super(items);

    makeObservable(this, { mode: observable });
  }

  public static fromCoordinates(c: Coordinates) {
    return new EdgePoint(c);
  }

  copy() {
    return new EdgePoint(super.copy());
  }
}
