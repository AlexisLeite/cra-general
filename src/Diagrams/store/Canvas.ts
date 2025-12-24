import { makeObservable } from 'mobx';
import { Coordinates } from './primitives/Coordinates';
import { Dimensions } from './primitives/Dimensions';
import { Diagram } from './Diagram';
import { Element } from './elements/Element';
import {
  AnyKeyboardEvent,
  AnyMouseEvent,
  DKeyDownEvent,
  DMouseDownEvent,
  DMouseMoveEvent,
  DMouseUpEvent,
  DScaleEvent,
  DWheelEvent,
} from './elements/Events';

export type ScaleEvent = {
  previousScale: number;
  newScale: number;
  displacement: Coordinates;
};

export class Canvas extends Element {
  protected _displacement: Coordinates = new Coordinates([-5000, -5000]);
  _scale: number = 1;
  size = new Coordinates([1000000, 1000000]);

  get scale() {
    return this._scale;
  }

  element: HTMLElement | null = null;
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
    super(diagram);

    makeObservable(this, {});
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('keydown', this.keydown.bind(this));
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

    this._scale = Math.max(0.3, Math.min(3, newScale));

    if (scale !== this.scale) {
      const scale_ = this.scale;

      const disp2 = B.copy()
        .multiply(scale)
        .sum(disp.copy().multiply(scale))
        .substract(B_.copy().multiply(scale_))
        .divide(scale_);

      const previous = this.displacement;
      this._displacement.assign(disp2);
      this.bound();

      this.setDisplacementStyles();

      this.emit(
        new DScaleEvent(
          this,
          this.displacement.copy().substract(previous),
          this.scale,
          scale,
        ),
      );
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
        .substract(this.framePosition)
        .divide(this.scale)
        .substract([this._displacement.x, this._displacement.y]) as T;
    }

    return value
      .copy()
      .substract(this.framePosition.toDimensions(new Coordinates([0, 0])))
      .divide(this.scale)
      .substract([this._displacement.x, this._displacement.y, 0, 0]) as T;
  }

  getDisplacementStyles() {
    const translation = this._displacement.copy(false).multiply(this.scale);

    return {
      width: `${this.size.x}px`,
      height: `${this.size.y}px`,
      transform: `translate(${translation.x}px, ${translation.y}px) scale(${this.scale})`,
      transformOrigin: '0 0',
      willChange: 'transform',
    };
  }

  protected setDisplacementStyles(element = this.element) {
    if (element) {
      const translation = this._displacement.copy(false).multiply(this.scale);

      element!.dataset.setStyles = 'true';
      element!.style.width = `${this.size.x}px`;
      element!.style.height = `${this.size.y}px`;
      element!.style.transform = `translate(${translation.x}px, ${translation.y}px) scale(${this.scale})`;
      element!.style.transformOrigin = '0 0';
      element!.style.willChange = 'transform';
    }
  }

  private unsubscribeHandlers = () => {};
  useRef = (el: HTMLElement | null) => {
    this.element = el;

    if (el instanceof HTMLElement) {
      this.setDisplacementStyles();
      this.unsubscribeHandlers();

      const fn1 = this.mousedown.bind(this);
      const fn2 = this.keydown.bind(this);
      const fn3 = this.handleWheel.bind(this);

      el.addEventListener('mousedown', fn1);
      el.addEventListener('keydown', fn2);
      el.addEventListener('wheel', fn3);

      this.unsubscribeHandlers = () => {
        el.removeEventListener('mousedown', fn1);
        el.removeEventListener('keydown', fn2);
        el.removeEventListener('wheel', fn3);
      };
    }
  };

  protected keydown(originalEvent: AnyKeyboardEvent) {
    this.emit(new DKeyDownEvent(this, originalEvent));
  }

  mousedown(originalEvent: AnyMouseEvent) {
    this.unsubscribeMouse();
    const ev = this.emit(new DMouseDownEvent(this, originalEvent));

    if (
      !ev.cancelled &&
      (originalEvent.button === 1 || originalEvent.button === 0)
    ) {
      this.displacementStart = this._displacement.copy();
      this.eventStart = new Coordinates(originalEvent);

      const fn1 = (ev: MouseEvent) => {
        this.handleMouseMove(ev);
      };

      document.addEventListener('mousemove', fn1);

      this.unsubscribeMouse = () => {
        document.removeEventListener('mousemove', fn1);
      };
    }
  }

  protected handleMouseMove(originalEvent: MouseEvent) {
    const ev = this.emit(new DMouseMoveEvent(this, originalEvent));

    if (!ev.cancelled && this.eventStart) {
      this._dragging = true;
      this._displacement.assign(
        this.displacementStart!.copy().substract(
          this.eventStart
            .copy()
            .substract([originalEvent.clientX, originalEvent.clientY])
            .divide(this.scale),
        ),
      );
      this.bound();
      this.setDisplacementStyles();
    }
  }

  protected handleMouseUp(originalEvent: MouseEvent) {
    const ev = this.emit(new DMouseUpEvent(this, originalEvent));

    if (!ev.cancelled && this.eventStart) {
      this._dragging = false;
      this.eventStart = null;
    }

    this.unsubscribeMouse();
  }

  protected handleWheel(originalEvent: WheelEvent, isPassive = false) {
    const ev = this.emit(new DWheelEvent(this, originalEvent));

    if (!ev.cancelled) {
      if (!isPassive) originalEvent.preventDefault();

      const negative = originalEvent.deltaY < 0;
      const rounded = Math.floor(this.scale * 100) / 100;

      this.setScale(
        this.scale -
          originalEvent.deltaY /
            ((rounded >= 0.2 && negative) || rounded > 0.21 ? 1000 : 10000),
        new Coordinates(originalEvent),
      );
    }
  }
}
