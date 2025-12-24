import { Diagram } from '../Diagram';
import { DMouseDownEvent, DSelectionEvent } from '../elements/Events';

export class Rules {
  allowEdition = true;
  allowSelection = true;

  displaceWhenDragOnEdges = true;
  gridSize = 50;
  toggleGrid = true;
  snapToGrid = true;

  constructor(private d: Diagram) {
    d.onEvent(
      DMouseDownEvent,
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
  }
}
