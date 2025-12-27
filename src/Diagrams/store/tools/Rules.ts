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

  constructor(protected d: Diagram) {
    d.onEvent(DChangeEvent, this.handleUpdates, d.priorities.Rules_Mouse_Down);
    d.onEvent(DDragEvent, this.handleUpdates, d.priorities.Rules_Mouse_Down);

    d.onEvent(
      DSelectionEvent,
      this.handleSelection,
      d.priorities.Rules_Selection,
    );

    makeAutoObservable(this);
  }
}
