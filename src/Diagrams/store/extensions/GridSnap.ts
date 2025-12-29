import { DiagramExtension } from './DiagramExtension';
import { DDragNodeEvent } from '../elements/Events';
import { action, makeObservable, observable } from 'mobx';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';

export class GridSnap extends DiagramExtension {
  gridSize = 50;
  snapToGrid = true;

  toggle() {
    this.snapToGrid = !this.snapToGrid;
  }

  public init(): void {
    makeObservable(this, {
      gridSize: observable,
      snapToGrid: observable,
      toggle: action,
    });

    this.diagram.onEvent(
      DDragNodeEvent,
      (ev) => {
        for (const e of ev.proposals) {
          if (this.snapToGrid) {
            const newCoordinates = new Coordinates([
              Math.round(e.newBox.coordinates.x / this.gridSize) *
                this.gridSize,
              Math.round(e.newBox.coordinates.y / this.gridSize) *
                this.gridSize,
            ]);

            e.update(
              new Dimensions([...newCoordinates.raw, ...e.newBox.size.raw]),
            );

            ev.stopImmediatePropagation();
          }
        }
      },
      this.diagram.priorities.Drag_Node_Snap_To_Grid,
    );
  }
}
