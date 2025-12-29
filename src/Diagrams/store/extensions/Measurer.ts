import { makeObservable, observable } from 'mobx';
import { Coordinates } from '../primitives/Coordinates';
import { type AnyMouseEvent, DMouseDownEvent } from '../elements/Events';
import { bind, documentBind } from '../../util/bindCb';
import { DiagramExtension } from './DiagramExtension';

export class Measurer extends DiagramExtension {
  init() {
    makeObservable<Measurer, 'endPoint' | 'startPoint' | '_enabled'>(this, {
      _enabled: observable,
      endPoint: observable,
      startPoint: observable,
    });
    this.diagram.canvas.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
      this.diagram.priorities.Mouse_Down_Measurer,
    );
  }

  protected _enabled = false;

  public toggle() {
    this._enabled = !this._enabled;
  }

  get enabled() {
    return this._enabled;
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

  u = () => {};
  protected handleMouseDown(ev: DMouseDownEvent) {
    if (this._enabled) {
      ev.cancel();
      ev.stopImmediatePropagation();

      this.u();
      this.u = bind(
        documentBind(this, 'mousemove', this.handleMouseMove),
        documentBind(this, 'mouseup', this.handleMouseUp),
      );

      this.startPoint = this.diagram.canvas.inverseFit(new Coordinates(ev));
      this.endPoint = this.diagram.canvas.inverseFit(new Coordinates(ev));
    }
  }
  protected handleMouseMove(ev: AnyMouseEvent) {
    if (this.startPoint && this._enabled) {
      this.endPoint = this.diagram.canvas.inverseFit(new Coordinates(ev));
    }
  }
  protected handleMouseUp() {
    this.endPoint = null;
    this.startPoint = null;
  }
}
