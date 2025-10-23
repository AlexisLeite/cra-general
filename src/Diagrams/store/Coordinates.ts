import { makeAutoObservable, toJS } from 'mobx'

export class Coordinates {
  _data: number[] = []

  constructor(items: Coordinates | number[], observable = true) {
    if (Array.isArray(items)) {
      if (items.length !== 2) {
        throw new Error('Invalid coordinates length')
      }

      this._data = [...items]
    } else {
      this._data = [...items._data]
    }

    if (observable) {
      makeAutoObservable(this)
    }
  }

  get abs() {
    return new Coordinates([Math.abs(this.x), Math.abs(this.y)])
  }

  assign(this: Coordinates, another: Coordinates | [number, number]) {
    if (another.length !== 2) {
      throw new Error('Invalid number of coordinates')
    }

    let a = another instanceof Coordinates ? another : new Coordinates(another)

    this.set(0, a.get(0))
    this.set(1, a.get(1))

    return this
  }

  copy() {
    return new Coordinates(this)
  }

  divide(this: Coordinates, factor: number) {
    this.set(0, this.get(0) / factor)
    this.set(1, this.get(1) / factor)

    return this
  }

  get(i: number) {
    return this._data[i]
  }

  get length() {
    return this._data.length
  }

  max(n: number) {
    return new Coordinates([Math.max(n, this.x), Math.max(n, this.y)])
  }

  get nonObserved() {
    return new Coordinates(this, false)
  }

  get raw(): [number, number] {
    return toJS([...this._data]) as [number, number]
  }

  get round() {
    return new Coordinates([Math.round(this.x), Math.round(this.y)])
  }

  get half() {
    return this.copy().multiply(0.5)
  }

  get norm() {
    return Math.sqrt(this.x ** 2 + this.y ** 2)
  }

  get style() {
    return {
      left: this.x,
      top: this.y,
    }
  }

  multiply(this: Coordinates, factor: number) {
    this.set(0, this.get(0) * factor)
    this.set(1, this.get(1) * factor)

    return this
  }

  set(i: number, value: number) {
    this._data[i] = value
  }

  substract(this: Coordinates, another: Coordinates | [number, number]) {
    if (another.length !== 2) {
      throw new Error('Invalid number of coordinates')
    }

    let a = another instanceof Coordinates ? another : new Coordinates(another)

    this.set(0, this.get(0) - a.get(0))
    this.set(1, this.get(1) - a.get(1))

    return this
  }

  sum(this: Coordinates, another: Coordinates | [number, number] | number) {
    if (typeof another === 'number') {
      this.set(0, this.get(0) + another)
      this.set(1, this.get(1) + another)
    } else {
      if (another.length !== 2) {
        throw new Error('Invalid number of coordinates')
      }

      let a =
        another instanceof Coordinates ? another : new Coordinates(another)

      this.set(0, this.get(0) + a.get(0))
      this.set(1, this.get(1) + a.get(1))
    }

    return this
  }

  get x() {
    return this.get(0)
  }

  get y() {
    return this.get(1)
  }

  toString() {
    return `(${this.x}, ${this.y})`
  }
}
