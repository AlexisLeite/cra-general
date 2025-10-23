import { makeAutoObservable, toJS } from 'mobx'
import { Coordinates } from './Coordinates'

/**
 * [ x, y, width, height ]
 */
export class Dimensions {
  protected _data: number[] = []

  constructor(items: Dimensions | number[]) {
    if (Array.isArray(items)) {
      if (items.length !== 4) {
        throw new Error('Invalid coordinates length')
      }

      this._data = [...items]
    } else {
      this._data = [...items._data]
    }

    makeAutoObservable(this)
  }

  get coordinates() {
    return new Coordinates(this.raw.slice(0, 2))
  }

  get leftMiddle() {
    return new Coordinates([this.x, this.y + this.height / 2])
  }

  get rightMiddle() {
    return new Coordinates([this.x + this.width, this.y + this.height / 2])
  }

  get size() {
    return new Coordinates(this.raw.slice(2, 4))
  }

  get x() {
    return this.get(0)
  }

  get y() {
    return this.get(1)
  }

  get width() {
    return this.get(2)
  }

  get height() {
    return this.get(3)
  }

  set x(value: number) {
    this.set(0, value)
  }

  set y(value: number) {
    this.set(1, value)
  }

  set width(value: number) {
    this.set(2, value)
  }

  set height(value: number) {
    this.set(3, value)
  }

  get(i: number) {
    return this._data[i]
  }

  get length() {
    return this._data.length
  }

  get raw(): [number, number, number, number] {
    return toJS([...this._data]) as [number, number, number, number]
  }

  get round() {
    return new Coordinates([
      Math.round(this.x),
      Math.round(this.y),
      Math.round(this.width),
      Math.round(this.height),
    ])
  }

  get style() {
    return {
      width: this.width,
      height: this.height,
      left: this.x,
      top: this.y,
    }
  }

  assign(
    this: Dimensions,
    another: Dimensions | [number, number, number, number],
  ) {
    if (another.length !== 2) {
      throw new Error('Invalid number of Dimensions')
    }

    let a = another instanceof Dimensions ? another : new Dimensions(another)

    this.set(0, a.get(0))
    this.set(1, a.get(1))
    this.set(2, a.get(2))
    this.set(3, a.get(3))

    return this
  }

  assignCoordinates(this: Dimensions, another: Coordinates | [number, number]) {
    if (another.length !== 2) {
      throw new Error('Invalid number of Coordinates')
    }

    let a = another instanceof Coordinates ? another : new Coordinates(another)

    this.set(0, a.get(0))
    this.set(1, a.get(1))

    return this
  }

  bound(boundaries: Dimensions) {
    this.x = Math.min(
      boundaries.x + boundaries.width - this.width,
      Math.max(boundaries.x, this.x),
    )

    this.y = Math.min(
      boundaries.y + boundaries.height - this.height,
      Math.max(boundaries.y, this.y),
    )
  }

  collides(another: Dimensions | Coordinates) {
    if (another instanceof Dimensions) {
      return !(
        this.x + this.width <= another.x ||
        another.x + another.width <= this.x ||
        this.y + this.height <= another.y ||
        another.y + another.height <= this.y
      )
    } else {
      return !(
        this.x >= another.x ||
        this.x + this.width <= another.x ||
        this.y >= another.y ||
        this.y + this.height <= another.y
      )
    }
  }

  copy() {
    return new Dimensions(this)
  }

  set(i: number, value: number) {
    this._data[i] = value
  }

  divide(this: Dimensions, factor: number) {
    this.set(0, this.get(0) / factor)
    this.set(1, this.get(1) / factor)
    this.set(2, this.get(2) / factor)
    this.set(3, this.get(3) / factor)

    return this
  }

  multiply(this: Dimensions, factor: number) {
    this.set(0, this.get(0) * factor)
    this.set(1, this.get(1) * factor)
    this.set(2, this.get(2) * factor)
    this.set(3, this.get(3) * factor)

    return this
  }

  substract(
    this: Dimensions,
    another: Dimensions | [number, number, number, number],
  ) {
    if (another.length !== 4) {
      throw new Error('Invalid number of Dimensions')
    }

    let a = another instanceof Dimensions ? another : new Dimensions(another)

    this.set(0, this.get(0) - a.get(0))
    this.set(1, this.get(1) - a.get(1))
    this.set(2, this.get(2) - a.get(2))
    this.set(3, this.get(3) - a.get(3))

    return this
  }

  sum(
    this: Dimensions,
    another: Dimensions | [number, number, number, number],
  ) {
    if (another.length !== 4) {
      throw new Error('Invalid number of Dimensions')
    }

    let a = another instanceof Dimensions ? another : new Dimensions(another)

    this.set(0, this.get(0) + a.get(0))
    this.set(1, this.get(1) + a.get(1))
    this.set(2, this.get(2) + a.get(2))
    this.set(3, this.get(3) + a.get(3))

    return this
  }

  toString() {
    return `(${this.x}, ${this.y}, ${this.width}, ${this.height})`
  }
}
