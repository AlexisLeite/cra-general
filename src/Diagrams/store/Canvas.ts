import { makeAutoObservable } from 'mobx';
import { MouseEvent as MV } from 'react';
import { Coordinates } from './Coordinates';
import { Dimensions } from './Dimensions';
import { Diagram } from './Diagram';
import { EventEmitter } from '../util/EventEmitter';

export type AnyMouseEvent = MV | MouseEvent;

export class Canvas {
  displacement: Coordinates = new Coordinates([-5000, -5000]);
  scale: number = 1;
  size = new Coordinates([10000, 10000]);
  protected emitter = new EventEmitter<{
    mouseDown: AnyMouseEvent;
    mouseMove: AnyMouseEvent;
    mouseUp: AnyMouseEvent;
  }>();

  element: SVGElement | null = null;
  get elementPosition() {
    if (!this.element) {
      return new Coordinates([0, 0]);
    }

    const box = this.element!.getBoundingClientRect();
    return new Coordinates([box.x, box.y]);
  }
  get elementDimensions() {
    if (!this.element) {
      return new Dimensions([0, 0, 0, 0]);
    }

    const box = this.element!.getBoundingClientRect();
    return new Dimensions([box.x, box.y, box.width, box.height]);
  }

  constructor(public diagram: Diagram) {
    makeAutoObservable(this, { element: false });
  }

  private findCanvas(el: HTMLElement) {
    let current: Element = el;

    while (current) {
      if (current !== this.element) {
        current = current.parentElement!;
      } else {
        return current;
      }
    }
  }

  public get dragging() {
    return this._dragging;
  }

  protected _dragging = false;
  displacementStart: null | Coordinates = null;
  eventStart: null | Coordinates = null;

  protected unsubscribeMouse = () => {};

  protected bound() {
    const rect = this.element?.parentElement?.getBoundingClientRect();
    const rectDims = rect
      ? new Coordinates([rect.width, rect.height]).divide(this.scale)
      : new Coordinates();

    const bounds = new Dimensions([
      ...this.size.copy().multiply(-1).raw,
      ...rectDims.raw,
    ]).multiply(0.9);

    this.displacement.bound(bounds);
  }

  displace(c: Coordinates) {
    this.displacement.sum(c);
    this.bound();
  }

  protected handleMouseDown(ev: AnyMouseEvent) {
    const fn1 = this.handleMouseMove.bind(this);
    const fn2 = this.handleMouseUp.bind(this);

    document.addEventListener('mousemove', fn1);
    document.addEventListener('mouseup', fn2);

    this.unsubscribeMouse = () => {
      document.removeEventListener('mousemove', fn1);
      document.removeEventListener('mouseup', fn2);
    };

    if (this.findCanvas(ev.target as HTMLElement)) {
      this.emitter.emit('mouseDown', ev);

      if (
        !ev.defaultPrevented &&
        (this.diagram.eventsEnabled || ev.button === 1)
      ) {
        this.diagram.unselectAll();
        this.displacementStart = this.displacement.copy();
        this.eventStart = new Coordinates([ev.clientX, ev.clientY]);
      }
    }
  }

  protected handleMouseMove(ev: MouseEvent) {
    this.emitter.emit('mouseMove', ev);

    if (!ev.defaultPrevented && this.eventStart) {
      this._dragging = true;
      this.displacement.assign(
        this.displacementStart!.copy().substract(
          this.eventStart
            .copy()
            .substract([ev.clientX, ev.clientY])
            .divide(this.scale),
        ),
      );
      this.bound();
    }
  }

  protected handleMouseUp(ev: MouseEvent) {
    this.emitter.emit('mouseUp', ev);

    if (!ev.defaultPrevented && this.eventStart) {
      this._dragging = false;
      this.eventStart = null;
    }

    this.unsubscribeMouse();
  }

  protected handleWheel(ev: Event) {
    ev.preventDefault();
    this.scale = Math.max(
      0.01,
      Math.min(
        3,
        this.scale -
          (ev as WheelEvent).deltaY / (this.scale > 0.2 ? 1000 : 10000),
      ),
    );
  }

  /**
   * Given a pair of coordinates in the canvas, returns the matching coordinates in the screen
   */
  fit<T extends Coordinates | Dimensions>(value: T): T {
    if (value instanceof Coordinates) {
      return this.displacement
        .copy()
        .sum([value.x, value.y])
        .multiply(this.scale) as T;
    }

    return new Dimensions([
      ...this.displacement.copy().sum([value.x, value.y]).multiply(this.scale)
        .raw,
      ...value.size.multiply(this.scale).raw,
    ]) as T;
  }

  /**
   * Given a pair of coordinates in the screen, returns the matching coordinates in the canvas
   */
  inverseFit<T extends Coordinates | Dimensions>(value: T): T {
    if (value instanceof Coordinates) {
      return value
        .copy()
        .divide(this.scale)
        .substract([this.displacement.x, this.displacement.y]) as T;
    }

    return value
      .copy()
      .divide(this.scale)
      .substract([this.displacement.x, this.displacement.y, 0, 0]) as T;
  }

  on = this.emitter.on.bind(this.emitter);

  private unsetRefs = () => {};
  useRef = (el: SVGElement | null) => {
    this.element = el;
    this.unsetRefs();

    if (el instanceof SVGElement) {
      const fn1 = this.handleMouseDown.bind(this);
      const fn2 = this.handleWheel.bind(this);

      el.addEventListener('mousedown', fn1);
      el.addEventListener('wheel', fn2);

      this.unsetRefs = () => {
        el.removeEventListener('mousedown', fn1);
        el.removeEventListener('wheel', fn2);
      };
    }
  };
}
