import { makeAutoObservable } from 'mobx'
import { MouseEvent as MV } from 'react'
import { Coordinates } from './Coordinates'
import { Dimensions } from './Dimensions'

type E = MV | MouseEvent

export class Panzoom {
  displacement: Coordinates = new Coordinates([0, 0])
  size = new Coordinates([0, 0])
  scale: number = 1
  canvas: HTMLElement | null = null

  constructor() {
    makeAutoObservable(this, { canvas: false })
  }

  private findCanvas(el: HTMLElement) {
    let current = el

    while (current) {
      if (current !== this.canvas) {
        current = current.parentElement!
      } else {
        return current
      }
    }
  }

  displacementStart: null | Coordinates = null
  eventStart: null | Coordinates = null

  handleMouseDown(ev: E) {
    if (this.findCanvas(ev.target as HTMLElement)) {
      this.displacementStart = this.displacement.copy()
      this.eventStart = new Coordinates([ev.clientX, ev.clientY])
      document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    }
  }

  handleMouseMove(ev: E) {
    if (this.eventStart) {
      this.displacement.assign(
        this.displacementStart!.copy().substract(
          this.eventStart
            .copy()
            .substract([ev.clientX, ev.clientY])
            .multiply(1 / this.scale),
        ),
      )
    }
  }

  handleMouseUp() {
    this.eventStart = null
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this))
  }

  handleWheel(ev: Event) {
    ev.preventDefault()
    this.scale = Math.max(
      0.1,
      Math.min(3, this.scale - (ev as WheelEvent).deltaY / 1000),
    )
  }

  fit<T extends Coordinates | Dimensions>(value: T): T {
    if (value instanceof Coordinates) {
      return value
        .copy()
        .substract(this.displacement.copy().multiply(this.scale)) as T
    }

    return new Dimensions([
      ...this.displacement
        .copy()
        .sum(this.size.copy().divide(2))
        .sum([value.x, value.y])
        .multiply(this.scale).raw,
      value.width * this.scale,
      value.height * this.scale,
    ]) as T
  }

  private unsetRefs = () => {}
  useRef = (el: HTMLElement | null) => {
    this.canvas = el
    this.unsetRefs()

    if (el instanceof HTMLElement) {
      const rect = el.getBoundingClientRect()
      this.size.assign([rect.width, rect.height])

      el.addEventListener('mousedown', this.handleMouseDown.bind(this))
      el.addEventListener('mouseup', this.handleMouseUp.bind(this))
      el.addEventListener('wheel', this.handleWheel.bind(this))

      this.unsetRefs = () => {
        el.removeEventListener('mousedown', this.handleMouseDown.bind(this))
        el.removeEventListener('mouseup', this.handleMouseUp.bind(this))
        el.removeEventListener('wheel', this.handleWheel.bind(this))
      }
    }
  }
}
