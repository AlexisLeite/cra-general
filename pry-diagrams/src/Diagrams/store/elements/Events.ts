import type { MouseEvent as ME, KeyboardEvent as KE } from 'react';
import type { Element } from './Element';
import { Coordinates } from '../primitives/Coordinates';
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

export class DDoubleClickEvent extends DMouseEvent {
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

  public get alt() {
    return this.originalEvent.altKey;
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

export abstract class DCanvasEvent extends DUIEvent {
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

export class DDisplaceEvent extends DCanvasEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public previousDisplacement: Coordinates,
    public displacement: Coordinates,
  ) {
    super(src);
  }
}

export abstract class DChangeEvent extends DEvent {
  declare protected readonly __brand: void;
}

export class DResetGraphEvent extends DChangeEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    getResolver: (cb: () => Promise<boolean>) => unknown,
  ) {
    super(src);

    getResolver(this.resolve.bind(this));
  }

  private callbacks: (() => Promise<boolean>)[] = [];

  /**
   * The defer method allows to introduce a wait condition before the graph resets
   * the current state. It can be used for persistence or confirmation request.
   *
   * Everyone that listens to this event can add a new wait condition, the state
   * will only be reseted if all the conditions return true.
   *
   * If any promise is not resolved, the action can be delayed forever.
   */
  defer(cb: () => Promise<boolean>) {
    this.callbacks.push(cb);
  }

  private async resolve(): Promise<boolean> {
    return (await Promise.all(this.callbacks.map((c) => c()))).every((c) => c);
  }
}

export abstract class DNodesConnectionEvent extends DChangeEvent {
  declare protected readonly __brand: void;
}

/**
 * This event is fired when a connection is started by the user.
 */
export class DNodeConnectionIntentEvent extends DNodesConnectionEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public origin: Node<any>,
  ) {
    super(src);
  }
}

/**
 * This event is fired when a connection is finishd after the mouse up
 * by the user.
 */
export class DNodesConnectActionEvent extends DNodesConnectionEvent {
  declare protected readonly __brand: void;

  constructor(
    src: Element,
    public origin: Node<any>,
    public target: Node<any>,
  ) {
    super(src);
  }
}

export class DNodeChangeTypeEvent extends DChangeEvent {
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

export class DDeleteEdgeEvent extends DChangeEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public edge: Edge,
  ) {
    super(src);
  }
}

export abstract class DSelectionEvent extends DUIEvent {
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

export abstract class DDragEvent extends DChangeEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public originalEvent: AnyMouseEvent,
  ) {
    super(src);
  }
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

export class DEdgeEndpointDragStartEvent extends DDragEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Edge,
    public endpoint: 'from' | 'to',
    public originalEvent: AnyMouseEvent,
  ) {
    super(src, originalEvent);
  }
}

export class NodePositionProposal {
  private _cancelled = false;
  private _updated: Dimensions;

  private _lockX: number | null = null;
  private _lockY: number | null = null;

  constructor(
    public readonly node: Node<any>,
    public newBox: Dimensions,
  ) {
    this._updated = newBox.copy();
  }

  cancel() {
    this._cancelled = true;
  }

  get current() {
    return this._updated.copy();
  }

  public get cancelled() {
    return this._cancelled;
  }

  public get() {
    return this._updated;
  }

  public lockX() {
    this._lockX = this._updated.x;
  }

  public lockY() {
    this._lockY = this._updated.y;
  }

  update(box: Dimensions) {
    this._updated = box;

    if (this._lockX !== null) {
      this._updated.x = this._lockX;
    }

    if (this._lockY !== null) {
      this._updated.y = this._lockY;
    }
  }

  updateX(x: number) {
    if (this._lockX === null) {
      this._updated.x = x;
    }
  }

  updateY(y: number) {
    if (this._lockY === null) {
      this._updated.y = y;
    }
  }
}

export class DDragNodeEvent extends DDragEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public proposals: NodePositionProposal[],
    originalEvent: AnyMouseEvent,
  ) {
    super(src, originalEvent);
  }
}

export class EdgePointPositionProposal {
  private _updated: Coordinates;
  private _lockX: number | null = null;
  private _lockY: number | null = null;

  constructor(
    public readonly point: Coordinates,
    public readonly movedAxis: 'x' | 'y',
  ) {
    this._updated = point.copy();
  }

  get current() {
    return this._updated.copy();
  }

  get() {
    return this._updated;
  }

  lockX() {
    this._lockX = this._updated.x;
  }

  lockY() {
    this._lockY = this._updated.y;
  }

  update(point: Coordinates) {
    this._updated = point.copy();

    if (this._lockX !== null) {
      this._updated.x = this._lockX;
    }

    if (this._lockY !== null) {
      this._updated.y = this._lockY;
    }
  }

  updateX(x: number) {
    if (this._lockX === null) {
      this._updated.x = x;
    }
  }

  updateY(y: number) {
    if (this._lockY === null) {
      this._updated.y = y;
    }
  }
}

export class DDragEdgeSegmentEvent extends DDragEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public proposals: EdgePointPositionProposal[],
    public movedAxis: 'x' | 'y',
    originalEvent: AnyMouseEvent,
  ) {
    super(src, originalEvent);
  }
}
