import { makeAutoObservable, toJS } from 'mobx';
import type { Dimensions } from './Dimensions';
import type { AnyMouseEvent } from './Canvas';

export class Coordinates {
  protected _data: number[] = [];

  constructor(
    items?: AnyMouseEvent | Event | Coordinates | number[],
    observable = true,
  ) {
    if (!items) {
      items = [0, 0];
    }

    if (Array.isArray(items)) {
      if (items.length !== 2) {
        throw new Error('Invalid coordinates length');
      }

      this._data = [...items];
    } else if (items instanceof Coordinates) {
      this._data = [...items._data];
    } else if ((items as MouseEvent).clientX !== undefined) {
      this._data = [
        (items as MouseEvent).clientX,
        (items as MouseEvent).clientY,
      ];
    } else {
      this._data = [0, 0];
    }

    if (observable) {
      makeAutoObservable(this);
    }
  }

  // (minX, minY, maxX, maxY)
  bound(boundaries: Dimensions) {
    this.x = Math.min(boundaries.get(2), Math.max(boundaries.get(0), this.x));
    this.y = Math.min(boundaries.get(3), Math.max(boundaries.get(1), this.y));

    return this;
  }

  get abs() {
    return new Coordinates([Math.abs(this.x), Math.abs(this.y)]);
  }

  assign(another: Coordinates | [number, number]) {
    if (another.length !== 2) {
      throw new Error('Invalid number of coordinates');
    }

    let a = another instanceof Coordinates ? another : new Coordinates(another);

    this.set(0, a.get(0));
    this.set(1, a.get(1));

    return this;
  }

  copy() {
    return new Coordinates(this);
  }

  divide(factor: number | Coordinates) {
    const x = factor instanceof Coordinates ? factor.x : factor;
    const y = factor instanceof Coordinates ? factor.y : factor;

    this.set(0, this.get(0) / x);
    this.set(1, this.get(1) / y);

    return this;
  }

  get(i: number) {
    return this._data[i];
  }

  get length() {
    return this._data.length;
  }

  max(n: number) {
    return new Coordinates([Math.max(n, this.x), Math.max(n, this.y)]);
  }

  get nonObserved() {
    return new Coordinates(this, false);
  }

  get raw(): [number, number] {
    return toJS([...this._data]) as [number, number];
  }

  get round() {
    return new Coordinates([Math.round(this.x), Math.round(this.y)]);
  }

  get half() {
    return this.copy().multiply(0.5);
  }

  get norm() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  get style() {
    return {
      left: this.x,
      top: this.y,
    };
  }

  multiply(factor: number) {
    this.set(0, this.get(0) * factor);
    this.set(1, this.get(1) * factor);

    return this;
  }

  set(i: number, value: number) {
    this._data[i] = value;
  }

  substract(another: Coordinates | [number, number]) {
    if (another.length !== 2) {
      throw new Error('Invalid number of coordinates');
    }

    let a = another instanceof Coordinates ? another : new Coordinates(another);

    this.set(0, this.get(0) - a.get(0));
    this.set(1, this.get(1) - a.get(1));

    return this;
  }

  sum(another: Coordinates | [number, number] | number) {
    if (typeof another === 'number') {
      this.set(0, this.get(0) + another);
      this.set(1, this.get(1) + another);
    } else {
      if (another.length !== 2) {
        throw new Error('Invalid number of coordinates');
      }

      let a =
        another instanceof Coordinates ? another : new Coordinates(another);

      this.set(0, this.get(0) + a.get(0));
      this.set(1, this.get(1) + a.get(1));
    }

    return this;
  }

  get x() {
    return this.get(0);
  }

  get y() {
    return this.get(1);
  }

  set x(value: number) {
    this.set(0, value);
  }

  set y(value: number) {
    this.set(1, value);
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}
