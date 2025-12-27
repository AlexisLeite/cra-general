import type { MouseEvent as ME, KeyboardEvent as KE } from 'react';
import type { Element } from './Element';
import type { Coordinates } from '../primitives/Coordinates';
import type { Node } from './Node';
import type { Edge } from './Edge';
import type { Midpoint } from '../../components/objects/RenderEdge';

import { MouseInformation } from './EventsMouseInformation';
import type { Dimensions } from '../primitives/Dimensions';

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

export abstract class DUIEvent extends DEvent {
  declare protected readonly __brand: void;
}

export abstract class DMouseEvent extends DUIEvent {
  declare protected readonly __brand: void;

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

  public get edge() {
    return this.src.diagram?.getEdgeById(
      (this.originalEvent.target as HTMLElement)?.closest<HTMLElement>('.edge')
        ?.dataset.id || '',
    );
  }

  public get node() {
    return this.src.diagram?.getNodeById(
      (this.originalEvent.target as HTMLElement)?.closest<HTMLElement>(
        '.diagram__node',
      )?.dataset.id || '',
    );
  }

  public get shift() {
    return this.originalEvent.shiftKey;
  }

  get target() {
    return this.originalEvent.target as HTMLElement;
  }
}

export class DClickEvent extends DMouseEvent {
  declare protected readonly __brand: void;
}

export class DMouseDownEvent extends DMouseEvent {
  declare protected readonly __brand: void;
}

export class DMouseUpEvent extends DMouseEvent {
  declare protected readonly __brand: void;
}

export class DMouseMoveEvent extends DMouseEvent {
  declare protected readonly __brand: void;
}

export class DWheelEvent extends DMouseEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public originalEvent: WheelEvent,
  ) {
    super(src, originalEvent);
  }

  public get directionX() {
    if (this.originalEvent.deltaX < 0) {
      return 'left';
    } else if (this.originalEvent.deltaX > 0) {
      return 'right';
    }
    return 'none';
  }

  public get directionY() {
    if (this.originalEvent.deltaY < 0) {
      return 'up';
    } else if (this.originalEvent.deltaY > 0) {
      return 'down';
    }
    return 'none';
  }
}

export abstract class DKeyboardEvent extends DUIEvent {
  declare protected readonly __brand: void;

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
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public originalEvent: AnyKeyboardEvent,
  ) {
    super(src, originalEvent);
  }
}

export class DKeyUpEvent extends DKeyboardEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public originalEvent: AnyKeyboardEvent,
  ) {
    super(src, originalEvent);
  }
}

export class DKeyPressEvent extends DKeyboardEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public orignalEvent: AnyKeyboardEvent,
  ) {
    super(src, orignalEvent);
  }
}

export abstract class DCanvasEvent extends DEvent {
  declare protected readonly __brand: void;
}

/** We can add the events DDisplaceEvent, DResizeEvent extends DCanvasEvent */

export class DScaleEvent extends DCanvasEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public displacement: Coordinates,
    public newScale: number,
    public previousScale: number,
  ) {
    super(src);
  }
}

export abstract class DChangeEvent extends DEvent {
  declare protected readonly __brand: void;
}

export class DDeleteNodeEvent extends DChangeEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public node: Node<any>,
  ) {
    super(src);
  }
}

export abstract class DSelectionEvent extends DChangeEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public selected: boolean,
  ) {
    super(src);
  }
}

export class DNodeSelectionEvent extends DSelectionEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Node<any>,
    selected: boolean,
  ) {
    super(src, selected);
  }
}

export class DEdgeSelectionEvent extends DSelectionEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Edge,
    selected: boolean,
  ) {
    super(src, selected);
  }
}

export abstract class DDragEvent extends DMouseEvent {
  declare protected readonly __brand: void;
}

export class DEdgeDragStartEvent extends DDragEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Edge,
    public midPoint: Midpoint,
    public originalEvent: AnyMouseEvent,
  ) {
    super(src, originalEvent);
  }
}

export class DragProposal {
  private _cancelled = false;
  private _updated: Dimensions;

  constructor(
    public readonly node: Node<any>,
    public newBox: Dimensions,
  ) {
    this._updated = newBox;
  }

  cancel() {
    this._cancelled = true;
  }

  public get cancelled() {
    return this._cancelled;
  }

  public get() {
    return this._updated;
  }

  update(box: Dimensions) {
    this._updated = box;
  }
}

export class DDragProposalEvent extends DDragEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public elements: DragProposal[],
    originalEvent: AnyMouseEvent,
  ) {
    super(src, originalEvent);
  }
}

(window as any).devent = {};
(window as any).devent.DEvent = DEvent;
(window as any).devent.DUIEvent = DUIEvent;
(window as any).devent.DMouseEvent = DMouseEvent;
(window as any).devent.DClickEvent = DClickEvent;
(window as any).devent.DMouseDownEvent = DMouseDownEvent;
(window as any).devent.DMouseUpEvent = DMouseUpEvent;
(window as any).devent.DMouseMoveEvent = DMouseMoveEvent;
(window as any).devent.DWheelEvent = DWheelEvent;
(window as any).devent.DKeyboardEvent = DKeyboardEvent;
(window as any).devent.DKeyDownEvent = DKeyDownEvent;
(window as any).devent.DKeyUpEvent = DKeyUpEvent;
(window as any).devent.DKeyPressEvent = DKeyPressEvent;
(window as any).devent.DCanvasEvent = DCanvasEvent;
(window as any).devent.DScaleEvent = DScaleEvent;
(window as any).devent.DChangeEvent = DChangeEvent;
(window as any).devent.DSelectionEvent = DSelectionEvent;
(window as any).devent.DNodeSelectionEvent = DNodeSelectionEvent;
(window as any).devent.DEdgeSelectionEvent = DEdgeSelectionEvent;
(window as any).devent.DDragEvent = DDragEvent;
(window as any).devent.DEdgeDragStartEvent = DEdgeDragStartEvent;
(window as any).devent.DDragProposalEvent = DDragProposalEvent;
(window as any).devent.DDeleteNodeEvent = DDeleteNodeEvent;
