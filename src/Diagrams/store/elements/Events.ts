import { MouseEvent as ME, KeyboardEvent as KE } from 'react';
import { Element } from './Element';
import type { Coordinates } from '../primitives/Coordinates';
import { MouseInformation } from './EventsMouseInformation';

export type AnyMouseEvent = ME | MouseEvent;
export type AnyKeyboardEvent = KE | KeyboardEvent;

export abstract class DEvent {
  private _cancellable = true;
  private _cancelled = false;
  private _bubbles = true;
  private _spreads = true;

  constructor(public src: Element) {}

  public get bubbles() {
    return this._bubbles;
  }

  public get cancelled() {
    return this._cancelled;
  }

  /**
   * If false, all emitters in the same level must be skipped
   */
  public get spreads() {
    return this._spreads;
  }

  public cancellable(c: boolean) {
    this._cancellable = c;
    return this;
  }

  public cancel() {
    if (this._cancellable) {
      this._cancelled = true;
    }
  }

  public stopPropagation() {
    this._bubbles = false;
  }

  public stopImmediatePropagation() {
    this._spreads = false;
  }
}

export abstract class DMouseEvent extends DEvent {
  mouse: MouseInformation;

  constructor(
    public src: Element,
    public originalEvent: AnyMouseEvent,
  ) {
    super(src);

    this.mouse = new MouseInformation(originalEvent);
  }

  public get ctrl() {
    return this.originalEvent.ctrlKey;
  }

  public get shift() {
    return this.originalEvent.shiftKey;
  }

  get target() {
    return this.originalEvent.target as HTMLElement;
  }
}

export class DClickEvent extends DMouseEvent {}

export class DMouseDownEvent extends DMouseEvent {}

export class DMouseUpEvent extends DMouseEvent {}

export class DMouseMoveEvent extends DMouseEvent {}

export class DWheelEvent extends DMouseEvent {
  constructor(
    src: Element,
    public originalEvent: WheelEvent,
  ) {
    super(src, originalEvent);
  }

  public get directionX() {
    if (this.originalEvent.deltaX < 0) {
      return 'left';
    } else if (this.originalEvent.deltaX < 0) {
      return 'right';
    }
    return 'none';
  }

  public get directionY() {
    if (this.originalEvent.deltaY < 0) {
      return 'up';
    } else if (this.originalEvent.deltaY < 0) {
      return 'down';
    }
    return 'none';
  }
}

export abstract class DKeyboardEvent extends DEvent {
  constructor(
    src: Element,
    public originalEvent: AnyKeyboardEvent,
  ) {
    super(src);
  }

  public get code() {
    return this.originalEvent.code;
  }

  public get ctrl() {
    return this.originalEvent.ctrlKey;
  }

  public get shift() {
    return this.originalEvent.shiftKey;
  }
}

export class DKeyDownEvent extends DKeyboardEvent {
  constructor(
    src: Element,
    public originalEvent: AnyKeyboardEvent,
  ) {
    super(src, originalEvent);
  }
}

export class DKeyUpEvent extends DKeyboardEvent {
  constructor(
    src: Element,
    public originalEvent: AnyKeyboardEvent,
  ) {
    super(src, originalEvent);
  }
}

export class DKeyPressEvent extends DKeyboardEvent {
  constructor(
    src: Element,
    public orignalEvent: AnyKeyboardEvent,
  ) {
    super(src, orignalEvent);
  }
}

export class DScaleEvent extends DEvent {
  constructor(
    src: Element,
    public displacement: Coordinates,
    public newScale: number,
    public previousScale: number,
  ) {
    super(src);
  }
}

Object.assign(window, {
  DClickEvent,
  DMouseDownEvent,
  DMouseUpEvent,
  DMouseMoveEvent,
  DWheelEvent,
  DKeyDownEvent,
  DKeyPressEvent,
  DKeyUpEvent,
  DScaleEvent,
});
