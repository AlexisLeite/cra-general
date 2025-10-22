import { makeAutoObservable } from 'mobx'

export class Coordinates {
  _data: number[] = []

  constructor(items: Coordinates | number[]) {
    if (Array.isArray(items)) {
      if (items.length !== 2) {
        throw new Error('Invalid coordinates length')
      }

      this._data = [...items]
    } else {
      this._data = [...items._data]
    }

    makeAutoObservable(this)
  }

  copy() {
    return new Coordinates(this)
  }

  get(i: number) {
    return this._data[i]
  }

  get length() {
    return this._data.length
  }

  get raw(): [number, number] {
    return [...this._data] as [number, number]
  }

  set(i: number, value: number) {
    this._data[i] = value
  }

  divide(this: Coordinates, factor: number) {
    this.set(0, this.get(0) / factor)
    this.set(1, this.get(1) / factor)

    return this
  }

  multiply(this: Coordinates, factor: number) {
    this.set(0, this.get(0) * factor)
    this.set(1, this.get(1) * factor)

    return this
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

  assign(this: Coordinates, another: Coordinates | [number, number]) {
    if (another.length !== 2) {
      throw new Error('Invalid number of coordinates')
    }

    let a = another instanceof Coordinates ? another : new Coordinates(another)

    this.set(0, a.get(0))
    this.set(1, a.get(1))

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
}
