import { makeAutoObservable, toJS } from 'mobx';
import { Coordinates } from './Coordinates';

/**
 * [ x, y, width, height ]
 */
export class Dimensions {
  protected _data: number[] = [];

  constructor(items?: Dimensions | number[], observable = true) {
    if (!items) {
      items = [0, 0, 0, 0];
    }

    if (Array.isArray(items)) {
      if (items.length !== 4) {
        throw new Error('Invalid coordinates length');
      }

      this._data = [...items];
    } else {
      this._data = [...items._data];
    }

    if (this.width < 0) {
      const w = this.width;
      this.x += w;
      this.width = -w;
    }

    if (this.height < 0) {
      const h = this.height;
      this.y += h;
      this.height = -h;
    }

    if (observable) {
      makeAutoObservable(this);
    }
  }

  get coordinates() {
    return new Coordinates(this.raw.slice(0, 2));
  }

  get bottomMiddle() {
    return new Coordinates([this.x + this.width / 2, this.y + this.height]);
  }

  get leftMiddle() {
    return new Coordinates([this.x, this.y + this.height / 2]);
  }

  get middle() {
    return new Coordinates([this.x + this.width / 2, this.y + this.height / 2]);
  }

  get rightMiddle() {
    return new Coordinates([this.x + this.width, this.y + this.height / 2]);
  }

  get topMiddle() {
    return new Coordinates([this.x + this.width / 2, this.y]);
  }

  get size() {
    return new Coordinates(this.raw.slice(2, 4));
  }

  get x() {
    return this.get(0);
  }

  get y() {
    return this.get(1);
  }

  get width() {
    return this.get(2);
  }

  get height() {
    return this.get(3);
  }

  set x(value: number) {
    this.set(0, value);
  }

  set y(value: number) {
    this.set(1, value);
  }

  set width(value: number) {
    this.set(2, value);
  }

  set height(value: number) {
    this.set(3, value);
  }

  get(i: number) {
    return this._data[i];
  }

  /**
   * Diagonal norm
   */
  get norm() {
    return this.size.substract(this.coordinates).norm;
  }

  get length() {
    return this._data.length;
  }

  get raw(): [number, number, number, number] {
    return toJS([...this._data]) as [number, number, number, number];
  }

  get round() {
    return new Coordinates([
      Math.round(this.x),
      Math.round(this.y),
      Math.round(this.width),
      Math.round(this.height),
    ]);
  }

  get style() {
    return {
      width: this.width,
      height: this.height,
      left: this.x,
      top: this.y,
    };
  }

  assign(
    this: Dimensions,
    another: Dimensions | [number, number, number, number],
  ) {
    if (another.length !== 4) {
      throw new Error('Invalid number of Dimensions');
    }

    let a = another instanceof Dimensions ? another : new Dimensions(another);

    this.set(0, a.get(0));
    this.set(1, a.get(1));
    this.set(2, a.get(2));
    this.set(3, a.get(3));

    return this;
  }

  assignCoordinates(this: Dimensions, another: Coordinates | [number, number]) {
    if (another.length !== 2) {
      throw new Error('Invalid number of Coordinates');
    }

    let a = another instanceof Coordinates ? another : new Coordinates(another);

    this.set(0, a.get(0));
    this.set(1, a.get(1));

    return this;
  }

  bound(boundaries: Dimensions) {
    this.x = Math.min(
      boundaries.x + boundaries.width - this.width,
      Math.max(boundaries.x, this.x),
    );

    this.y = Math.min(
      boundaries.y + boundaries.height - this.height,
      Math.max(boundaries.y, this.y),
    );
  }

  collides(another: Dimensions | Coordinates, detectBorders = false) {
    if (another instanceof Dimensions) {
      const leftA = this.x - (detectBorders ? 1 : 0);
      const rightA = this.x + this.width + (detectBorders ? 1 : 0);
      const topA = this.y - (detectBorders ? 1 : 0);
      const bottomA = this.y + this.height + (detectBorders ? 1 : 0);

      const leftB = another.x;
      const rightB = another.x + another.width;
      const topB = another.y;
      const bottomB = another.y + another.height;

      return !(
        rightA <= leftB ||
        rightB <= leftA ||
        bottomA <= topB ||
        bottomB <= topA
      );
    } else {
      const leftA = this.x;
      const rightA = this.x + this.width;
      const topA = this.y;
      const bottomA = this.y + this.height;

      return (
        another.x >= leftA &&
        another.x <= rightA &&
        another.y >= topA &&
        another.y <= bottomA
      );
    }
  }

  copy() {
    return new Dimensions([this.x, this.y, this.width, this.height]);
  }

  set(i: number, value: number) {
    this._data[i] = value;
  }

  divide(this: Dimensions, factor: number) {
    this.set(0, this.get(0) / factor);
    this.set(1, this.get(1) / factor);
    this.set(2, this.get(2) / factor);
    this.set(3, this.get(3) / factor);

    return this;
  }

  multiply(this: Dimensions, factor: number) {
    this.set(0, this.get(0) * factor);
    this.set(1, this.get(1) * factor);
    this.set(2, this.get(2) * factor);
    this.set(3, this.get(3) * factor);

    return this;
  }

  substract(
    this: Dimensions,
    another: Dimensions | [number, number, number, number],
  ) {
    if (another.length !== 4) {
      throw new Error('Invalid number of Dimensions');
    }

    let a = another instanceof Dimensions ? another : new Dimensions(another);

    this.set(0, this.get(0) - a.get(0));
    this.set(1, this.get(1) - a.get(1));
    this.set(2, this.get(2) - a.get(2));
    this.set(3, this.get(3) - a.get(3));

    return this;
  }

  sum(
    this: Dimensions,
    another: Dimensions | [number, number, number, number] | Coordinates,
  ) {
    if (another instanceof Coordinates) {
      this.set(0, this.get(0) + another.get(0));
      this.set(1, this.get(1) + another.get(1));
    } else {
      if (another.length !== 4) {
        throw new Error('Invalid number of Dimensions');
      }

      let a = another instanceof Dimensions ? another : new Dimensions(another);

      this.set(0, this.get(0) + a.get(0));
      this.set(1, this.get(1) + a.get(1));
      this.set(2, this.get(2) + a.get(2));
      this.set(3, this.get(3) + a.get(3));
    }

    return this;
  }

  translate(another: Coordinates) {
    this.set(0, this.get(0) + another.get(0));
    this.set(1, this.get(1) + another.get(1));

    return this;
  }

  scale(another: Coordinates) {
    this.set(2, this.get(2) + another.get(0));
    this.set(3, this.get(3) + another.get(1));

    return this;
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.width}, ${this.height})`;
  }
}
