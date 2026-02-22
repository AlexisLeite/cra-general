import { DiagramExtension } from './DiagramExtension';
import { DDragNodeEvent } from '../elements/Events';
import { makeObservable, observable } from 'mobx';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';

export class GridSnap extends DiagramExtension {
  gridSize = 50;

  public init(): void {
    makeObservable(this, {
      gridSize: observable,
    });

    this.diagram.onEvent(
      DDragNodeEvent,
      (ev) => {
        if (this._enable) {
          for (const e of ev.proposals) {
            const newCoordinates = new Coordinates([
              Math.round(e.newBox.coordinates.x / this.gridSize) *
                this.gridSize,
              Math.round(e.newBox.coordinates.y / this.gridSize) *
                this.gridSize,
            ]);

            e.update(
              new Dimensions([...newCoordinates.raw, ...e.newBox.size.raw]),
            );
            e.lockX();
            e.lockY();
          }
        }
      },
      this.diagram.priorities.Drag_Node_Snap_To_Grid,
    );
  }
}
