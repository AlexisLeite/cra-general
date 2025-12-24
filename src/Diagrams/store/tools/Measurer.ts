import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../Diagram';
import { Coordinates } from '../primitives/Coordinates';
import {
  DMouseDownEvent,
  DMouseMoveEvent,
  DMouseUpEvent,
} from '../elements/Events';

export class Measurer {
  protected _enabled = false;

  public enable() {
    this.diagram.disableEvents();
    this._enabled = true;
  }

  public disable() {
    this._enabled = false;
    this.handleMouseUp();
  }

  get enabled() {
    return this._enabled;
  }

  constructor(public diagram: Diagram) {
    makeAutoObservable(this);

    this.diagram.canvas.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
    );
    this.diagram.canvas.onEvent(
      DMouseMoveEvent,
      this.handleMouseMove.bind(this),
    );
    this.diagram.canvas.onEvent(DMouseUpEvent, this.handleMouseUp.bind(this));
  }

  protected endPoint: Coordinates | null = null;
  protected startPoint: Coordinates | null = null;

  get() {
    if (!this.startPoint) return [];

    return [this.startPoint!, this.endPoint!];
  }

  getMeassurement() {
    return this.endPoint?.copy().substract(this.startPoint!).norm;
  }

  protected handleMouseDown(ev: DMouseDownEvent) {
    if (this._enabled) {
      this.startPoint = this.diagram.canvas.inverseFit(new Coordinates(ev));
      this.endPoint = this.diagram.canvas.inverseFit(new Coordinates(ev));
    }
  }
  protected handleMouseMove(ev: DMouseMoveEvent) {
    if (this.startPoint && this._enabled) {
      this.endPoint = this.diagram.canvas.inverseFit(new Coordinates(ev));
    }
  }
  protected handleMouseUp() {
    this.endPoint = null;
    this.startPoint = null;
  }
}
