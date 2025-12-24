import type { MouseEvent as ME, KeyboardEvent as KE } from 'react';
import type { Element } from './Element';
import type { Coordinates } from '../primitives/Coordinates';
import type { Node } from './Node';
import type { Edge } from './Edge';

import { MouseInformation } from './EventsMouseInformation';

export type AnyMouseEvent = ME | MouseEvent;
export type AnyKeyboardEvent = KE | KeyboardEvent;

export abstract class DEvent {
  protected abstract readonly __brand: void;

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
    this.stopPropagation();
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

export class DClickEvent extends DMouseEvent {
  protected readonly __brand!: void;
}

export class DMouseDownEvent extends DMouseEvent {
  protected readonly __brand!: void;
}

export class DMouseUpEvent extends DMouseEvent {
  protected readonly __brand!: void;
}

export class DMouseMoveEvent extends DMouseEvent {
  protected readonly __brand!: void;
}

export class DWheelEvent extends DMouseEvent {
  protected readonly __brand!: void;

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
  protected readonly __brand!: void;

  constructor(
    src: Element,
    public originalEvent: AnyKeyboardEvent,
  ) {
    super(src, originalEvent);
  }
}

export class DKeyUpEvent extends DKeyboardEvent {
  protected readonly __brand!: void;

  constructor(
    src: Element,
    public originalEvent: AnyKeyboardEvent,
  ) {
    super(src, originalEvent);
  }
}

export class DKeyPressEvent extends DKeyboardEvent {
  protected readonly __brand!: void;

  constructor(
    src: Element,
    public orignalEvent: AnyKeyboardEvent,
  ) {
    super(src, orignalEvent);
  }
}

export class DScaleEvent extends DEvent {
  protected readonly __brand!: void;

  constructor(
    src: Element,
    public displacement: Coordinates,
    public newScale: number,
    public previousScale: number,
  ) {
    super(src);
  }
}

export abstract class DSelectionEvent extends DEvent {
  protected readonly __brand!: void;

  constructor(
    public src: Element,
    public selected: boolean,
  ) {
    super(src);
  }
}

export class DNodeSelectionEvent extends DSelectionEvent {
  protected readonly __brand!: void;

  constructor(
    public src: Node<any>,
    selected: boolean,
  ) {
    super(src, selected);
  }
}

export class DEdgeSelectionEvent extends DSelectionEvent {
  protected readonly __brand!: void;

  constructor(
    public src: Edge,
    selected: boolean,
  ) {
    super(src, selected);
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
