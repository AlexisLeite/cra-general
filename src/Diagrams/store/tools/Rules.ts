import { makeAutoObservable } from 'mobx';
import { Diagram } from '../Diagram';
import { DSelectionEvent, DChangeEvent, DDragEvent } from '../elements/Events';

export class Rules {
  allowEdition = true;
  allowSelection = true;

  displaceWhenDragOnEdges = true;
  gridSize = 50;
  toggleGrid = true;
  snapToGrid = true;

  constructor(protected d: Diagram) {
    d.onEvent(DChangeEvent, this.handleUpdates, d.priorities.Mouse_Down_Rules);
    d.onEvent(DDragEvent, this.handleUpdates, d.priorities.Mouse_Down_Rules);

    d.onEvent(
      DSelectionEvent,
      this.handleSelection,
      d.priorities.Selection_Rules,
    );

    makeAutoObservable(this);
  }

  private handleSelection = (ev: DSelectionEvent) => {
    if (!this.allowSelection) {
      ev.cancel();
      ev.stopImmediatePropagation();
    }
  };

  private handleUpdates = (ev: DChangeEvent | DDragEvent) => {
    if (!this.allowEdition) {
      ev.cancel();
      ev.stopImmediatePropagation();
    }
  };
}
