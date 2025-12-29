import { makeAutoObservable } from 'mobx';
import { Diagram } from '../Diagram';
import {
  DSelectionEvent,
  DChangeEvent,
  DDragEvent,
  DEvent,
  DCanvasEvent,
} from '../elements/Events';

export class Rules {
  allowEdition = true;
  allowSelection = true;
  allowZoom = true;

  displaceWhenDragOnEdges = true;
  toggleGrid = true;

  constructor(protected d: Diagram) {
    d.onEvent(
      DChangeEvent,
      this.check(() => this.allowEdition),
      d.priorities.Mouse_Down_Rules,
    );

    d.onEvent(
      DSelectionEvent,
      this.check(() => this.allowSelection),
      d.priorities.Selection_Rules,
    );

    d.onEvent(
      DDragEvent,
      this.check(() => this.allowEdition),
      d.priorities.Drag_Rules,
    );

    d.onEvent(
      DCanvasEvent,
      this.check(() => this.allowZoom),
      d.priorities.Drag_Rules,
    );

    makeAutoObservable(this);
  }

  private check = (condition: () => boolean) => (ev: DEvent) => {
    if (!condition()) {
      ev.cancel();
      ev.stopImmediatePropagation();
    }
  };
}
