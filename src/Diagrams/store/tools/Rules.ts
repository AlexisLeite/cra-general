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
    d.onEvent(
      DChangeEvent,
      (ev) => {
        if (!this.allowEdition) {
          ev.cancel();
          ev.stopImmediatePropagation();
        }
      },
      d.priorities.Rules_Mouse_Down,
    );
    d.onEvent(
      DDragEvent,
      (ev) => {
        if (!this.allowEdition) {
          ev.cancel();
          ev.stopImmediatePropagation();
        }
      },
      d.priorities.Rules_Mouse_Down,
    );

    d.onEvent(
      DSelectionEvent,
      (ev) => {
        if (!this.allowSelection) {
          ev.cancel();
          ev.stopImmediatePropagation();
        }
      },
      d.priorities.Rules_Selection,
    );

    makeAutoObservable(this);
  }
}
