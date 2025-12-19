import { Coordinates } from '../primitives/Coordinates';
import { AnyMouseEvent } from '../Canvas';
import { makeObservable, observable } from 'mobx';

export class EdgePoint extends Coordinates {
  mode: 'auto' | 'manual' | 'static' = 'auto';

  constructor(items?: AnyMouseEvent | Event | Coordinates | number[]) {
    super(items);

    makeObservable(this, { mode: observable });
  }

  copy() {
    return new EdgePoint(super.copy());
  }
}
