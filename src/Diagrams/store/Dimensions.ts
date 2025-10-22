import { makeAutoObservable } from 'mobx'

/**
 * [ x, y, width, height ]
 */
export class Dimensions {
  protected data: number[] = []

  constructor(items: Dimensions | number[]) {
    if (Array.isArray(items)) {
      if (items.length !== 4) {
        throw new Error('Invalid coordinates length')
      }

      this.data = [...items]
    } else {
      this.data = [...items.data]
    }

    makeAutoObservable(this)
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

  get(i: number) {
    return this.data[i]
  }

  get length() {
    return this.data.length
  }

  get raw(): [number, number, number, number] {
    return [...this.data] as [number, number, number, number]
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

  set(i: number, value: number) {
    this.data[i] = value
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

  copy() {
    return new Dimensions(this)
  }
}
