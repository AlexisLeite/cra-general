import { makeObservable } from 'mobx';
import { Coordinates } from './primitives/Coordinates';
import { Dimensions } from './primitives/Dimensions';
import { Diagram } from './Diagram';
import { Element } from './elements/Element';
import {
  DClickEvent,
  DDisplaceEvent,
  DDoubleClickEvent,
  DKeyDownEvent,
  DKeyPressEvent,
  DKeyUpEvent,
  DMouseDownEvent,
  DMouseMoveEvent,
  DMouseUpEvent,
  DScaleEvent,
  DWheelEvent,
} from './elements/Events';
import { bindDocument } from '../util/binders';

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

  constructor(parent: Diagram) {
    super(parent);

    makeObservable(this, {});

    bindDocument(this, 'click', this.handleClick);
    bindDocument(this, 'dblclick', this.handleDoubleClick);
    bindDocument(this, 'wheel', this.handleWheel);
    bindDocument(this, 'mouseup', this.handleMouseUp);
    bindDocument(this, 'mousedown', this.handleMouseDown);
    bindDocument(this, 'mousemove', this.handleMouseMove);

    bindDocument(this, 'keyup', this.handleKeyUp);
    bindDocument(this, 'keypress', this.handleKeyPress);
    bindDocument(this, 'keydown', this.handleKeyDown);
  }

  public get dragging() {
    return this._dragging;
  }

  protected _dragging = false;
  displacementStart: null | Coordinates = null;
  eventStart: null | Coordinates = null;

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
    this.setDisplacementStyles();
  }

  setScale(
    newScale: number,
    zoomCenter: Coordinates = new Coordinates([0, 0]),
  ) {
    const B = this.inverseFit(zoomCenter);
    const B_ = B.copy();
    const disp = this.displacement;

    const setScale = Math.max(0.3, Math.min(3, newScale));

    if (setScale !== this.scale) {
      const disp2 = B.copy()
        .multiply(this.scale)
        .sum(disp.copy().multiply(this.scale))
        .substract(B_.copy().multiply(setScale))
        .divide(setScale);

      if (
        !this.emit(
          new DScaleEvent(
            this,
            disp2.copy().substract(this.displacement),
            setScale,
            this.scale,
          ),
        ).cancelled
      ) {
        this._scale = setScale;
        this._displacement.assign(disp2);
        this.bound();

        this.setDisplacementStyles();
      }
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

  useRef = (el: HTMLElement | null) => {
    this.element = el;

    if (el instanceof HTMLElement) {
      this.setDisplacementStyles();
    }
  };

  protected handleMouseMove(originalEvent: MouseEvent) {
    const ev = this.emit(new DMouseMoveEvent(this, originalEvent));

    if (!ev.cancelled && this.displacementStart && this.eventStart) {
      const displacement = this.displacement.substract(
        new Coordinates(originalEvent),
      );
      if (
        !this.emit(new DDisplaceEvent(this, this.displacement, displacement))
          .cancelled
      ) {
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
  }

  protected handleDoubleClick(originalEvent: MouseEvent) {
    this.emit(new DDoubleClickEvent(this, originalEvent));
  }

  protected handleClick(originalEvent: MouseEvent) {
    this.emit(new DClickEvent(this, originalEvent));
  }

  protected handleMouseUp(originalEvent: MouseEvent) {
    this.emit(new DMouseUpEvent(this, originalEvent));

    this._dragging = false;
    this.eventStart = null;
  }

  protected handleMouseDown(originalEvent: MouseEvent) {
    const ev = this.emit(new DMouseDownEvent(this, originalEvent));

    if (
      !ev.cancelled &&
      (originalEvent.button === 1 || originalEvent.button === 0)
    ) {
      this.displacementStart = this._displacement.copy();
      this.eventStart = new Coordinates(originalEvent);
    }
  }

  protected handleKeyDown(originalEvent: KeyboardEvent) {
    this.emit(new DKeyDownEvent(this, originalEvent));
  }

  protected handleKeyUp(originalEvent: KeyboardEvent) {
    this.emit(new DKeyUpEvent(this, originalEvent));
  }

  protected handleKeyPress(originalEvent: KeyboardEvent) {
    this.emit(new DKeyPressEvent(this, originalEvent));
  }

  protected handleWheel(originalEvent: WheelEvent) {
    const ev = this.emit(new DWheelEvent(this, originalEvent));

    if (!ev.cancelled) {
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
