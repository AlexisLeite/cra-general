import { makeAutoObservable } from 'mobx'
import { MouseEvent as MV } from 'react'
import { Coordinates } from './Coordinates'
import { Dimensions } from './Dimensions'
import type { Diagram } from './Diagram'

type E = MV | MouseEvent

export class Panzoom {
  displacement: Coordinates = new Coordinates([0, 0])
  size = new Coordinates([0, 0])
  scale: number = 1

  canvas: HTMLElement | null = null
  get canvasPosition() {
    if (!this.canvas) {
      return new Coordinates([0, 0])
    }

    const box = this.canvas!.getBoundingClientRect()
    return new Coordinates([box.x, box.y])
  }
  get canvasDimensions() {
    if (!this.canvas) {
      return new Dimensions([0, 0, 0, 0])
    }

    const box = this.canvas!.getBoundingClientRect()
    return new Dimensions([box.x, box.y, box.width, box.height])
  }

  constructor(public diagram: Diagram) {
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

  public get dragging() {
    return this._dragging
  }

  protected _dragging = false
  displacementStart: null | Coordinates = null
  eventStart: null | Coordinates = null

  protected unsubscribeMouse = () => {}

  displace(c: Coordinates) {
    this.displacement.sum(c)
  }

  handleMouseDown(ev: E) {
    if (this.findCanvas(ev.target as HTMLElement)) {
      this.diagram.unselectAll()
      this.displacementStart = this.displacement.copy()
      this.eventStart = new Coordinates([ev.clientX, ev.clientY])

      const fn1 = this.handleMouseMove.bind(this)
      const fn2 = this.handleMouseUp.bind(this)

      document.addEventListener('mousemove', fn1)
      document.addEventListener('mouseup', fn2)

      this.unsubscribeMouse = () => {
        document.removeEventListener('mousemove', fn1)
        document.removeEventListener('mouseup', fn2)
      }
    }
  }

  handleMouseMove(ev: E) {
    if (this.eventStart) {
      this._dragging = true
      this.displacement.assign(
        this.displacementStart!.copy().substract(
          this.eventStart
            .copy()
            .substract([ev.clientX, ev.clientY])
            .divide(this.scale),
        ),
      )
    }
  }

  handleMouseUp() {
    this._dragging = false
    this.eventStart = null
    this.unsubscribeMouse()
  }

  handleWheel(ev: Event) {
    ev.preventDefault()
    this.scale = Math.max(
      0.1,
      Math.min(3, this.scale - (ev as WheelEvent).deltaY / 1000),
    )
  }

  /**
   * Given a pair of coordinates in the canvas, returns the matching coordinates in the screen
   */
  fit<T extends Coordinates | Dimensions>(value: T): T {
    if (value instanceof Coordinates) {
      return this.displacement
        .copy()
        .sum([value.x, value.y])
        .multiply(this.scale) as T
    }

    return new Dimensions([
      ...this.displacement.copy().sum([value.x, value.y]).multiply(this.scale)
        .raw,
      ...value.size.multiply(this.scale).raw,
    ]) as T
  }

  /**
   * Given a pair of coordinates in the screen, returns the matching coordinates in the canvas
   */
  inverseFit(value: Coordinates) {
    return value
      .copy()
      .divide(this.scale)
      .substract([this.displacement.x, this.displacement.y])
  }

  private unsetRefs = () => {}
  useRef = (el: HTMLElement | null) => {
    this.canvas = el
    this.unsetRefs()

    if (el instanceof HTMLElement) {
      const rect = el.getBoundingClientRect()
      this.size.assign([rect.width, rect.height])

      const fn1 = this.handleMouseDown.bind(this)
      const fn2 = this.handleWheel.bind(this)

      el.addEventListener('mousedown', fn1)
      el.addEventListener('wheel', fn2)

      this.unsetRefs = () => {
        el.removeEventListener('mousedown', fn1)
        el.removeEventListener('wheel', fn2)
      }
    }
  }
}
