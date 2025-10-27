import { makeAutoObservable } from 'mobx';
import { MouseEvent as MV } from 'react';
import { Coordinates } from './primitives/Coordinates';
import { Dimensions } from './primitives/Dimensions';
import { Diagram } from './Diagram';
import { EventEmitter } from '../util/EventEmitter';

export type AnyMouseEvent = MV | MouseEvent;
export type ScaleEvent = {
  previousScale: number;
  newScale: number;
  displacement: Coordinates;
};

export class Canvas {
  protected _displacement: Coordinates = new Coordinates([-5000, -5000]);
  _scale: number = 1;
  size = new Coordinates([10000, 10000]);
  protected emitter = new EventEmitter<{
    mouseDown: AnyMouseEvent;
    mouseMove: AnyMouseEvent;
    mouseUp: AnyMouseEvent;
    wheel: Event;
    scale: ScaleEvent;
  }>();

  get scale() {
    return this._scale;
  }

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
  get displacement(): Coordinates {
    return this._displacement.copy();
  }
  get framePosition() {
    if (!this.element) {
      return new Coordinates([0, 0]);
    }

    const box = this.element.parentElement!.getBoundingClientRect();
    return new Coordinates([box.x, box.y]);
  }
  get frameDimensions() {
    if (!this.element) {
      return new Dimensions([0, 0, 0, 0]);
    }

    const box = this.element.parentElement!.getBoundingClientRect();
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

    this._displacement.bound(bounds);
  }

  centerOnPoint(c: Coordinates) {
    const screenFitted = this.frameDimensions.multiply(1 / this.scale);
    this.setDisplacement(c.copy().substract(screenFitted.middle).multiply(-1));
  }

  /**
   * @returns how much it displaced
   */
  displace(c: Coordinates) {
    this._displacement.sum(c);
    const previous = this._displacement.copy();

    this.bound();
    this.setDisplacementStyles();
    return c.copy().substract(this._displacement.copy().substract(previous));
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
        this.displacementStart = this._displacement.copy();
        this.eventStart = new Coordinates(ev);
      }
    }
  }

  protected handleMouseMove(ev: MouseEvent) {
    this.emitter.emit('mouseMove', ev);

    if (!ev.defaultPrevented && this.eventStart) {
      this._dragging = true;
      this._displacement.assign(
        this.displacementStart!.copy().substract(
          this.eventStart
            .copy()
            .substract([ev.clientX, ev.clientY])
            .divide(this.scale),
        ),
      );
      this.bound();
      this.setDisplacementStyles();
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
    this.emitter.emit('wheel', ev);

    if (!ev.defaultPrevented) {
      ev.preventDefault();

      this.setScale(
        this.scale -
          (ev as WheelEvent).deltaY / (this.scale > 0.2 ? 1000 : 10000),
        new Coordinates(ev),
      );
    }
  }

  setDisplacement(c: Coordinates) {
    this._displacement.assign(c);
    this.bound();
  }

  setScale(
    newScale: number,
    zoomCenter: Coordinates = new Coordinates([0, 0]),
  ) {
    const B = this.inverseFit(zoomCenter);
    const B_ = B.copy();
    const scale = this.scale;
    const disp = this.displacement;

    this._scale = Math.max(0.05, Math.min(3, newScale));

    if (scale !== this.scale) {
      const scale_ = this.scale;

      const disp2 = B.copy()
        .multiply(scale)
        .sum(disp.multiply(scale))
        .substract(B_.copy().multiply(scale_))
        .divide(scale_);

      const previous = this.displacement;
      this._displacement.assign(disp2);
      this.bound();

      this.setDisplacementStyles();
      this.emitter.emit('scale', {
        previousScale: scale,
        newScale: this.scale,
        displacement: this.displacement.copy().substract(previous),
      });
    }
  }

  /**
   * Given a pair of coordinates in the canvas, returns the matching coordinates in the screen
   */
  fit<T extends Coordinates | Dimensions | number>(value: T): T {
    if (value instanceof Coordinates) {
      return this._displacement
        .copy()
        .sum([value.x, value.y])
        .multiply(this.scale) as T;
    }

    if (value instanceof Dimensions) {
      return new Dimensions([
        ...this._displacement
          .copy()
          .sum([value.x, value.y])
          .multiply(this.scale).raw,
        ...value.size.multiply(this.scale).raw,
      ]) as T;
    }

    return ((value as number) * this.scale) as T;
  }

  /**
   * Given a pair of coordinates in the screen, returns the matching coordinates in the canvas
   */
  inverseFit<T extends Coordinates | Dimensions>(value: T): T {
    if (value instanceof Coordinates) {
      return value
        .copy()
        .divide(this.scale)
        .substract([this._displacement.x, this._displacement.y]) as T;
    }

    return value
      .copy()
      .divide(this.scale)
      .substract([this._displacement.x, this._displacement.y, 0, 0]) as T;
  }

  on = this.emitter.on.bind(this.emitter);

  protected setDisplacementStyles() {
    const translation = this._displacement.copy().multiply(this.scale);

    this.element!.dataset.setStyles = 'true';
    this.element!.style.width = '10000px';
    this.element!.style.height = '10000px';
    this.element!.style.transform = `translate(${translation.x}px, ${translation.y}px) scale(${this.scale})`;
    this.element!.style.transformOrigin = '0 0';
    this.element!.style.willChange = 'transform';
  }

  private unsetRefs = () => {};
  useRef = (el: SVGElement | null) => {
    this.element = el;
    this.unsetRefs();

    if (el instanceof SVGElement) {
      this.setDisplacementStyles();

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
