import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../Diagram';
import { AnyMouseEvent } from '../Canvas';
import { Coordinates } from '../primitives/Coordinates';

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

    this.diagram.canvas.on('mouseDown', this.handleMouseDown.bind(this));
    this.diagram.canvas.on('mouseMove', this.handleMouseMove.bind(this));
    this.diagram.canvas.on('mouseUp', this.handleMouseUp.bind(this));
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

  protected handleMouseDown(ev: AnyMouseEvent) {
    if (this._enabled) {
      this.startPoint = new Coordinates(ev);
      this.endPoint = new Coordinates(ev);
    }
  }
  protected handleMouseMove(ev: AnyMouseEvent) {
    if (this.startPoint && this._enabled) {
      this.endPoint = new Coordinates(ev);
    }
  }
  protected handleMouseUp() {
    this.endPoint = null;
    this.startPoint = null;
  }
}
