import { DiagramExtension } from './DiagramExtension';
import {
  PathsGrid,
  PathGridEdge,
  PathGridPoint,
} from '../../util/paths/makePathGrid';
import { action, makeObservable, observable, runInAction } from 'mobx';
import { DMouseMoveEvent } from '../elements/Events';
import { Coordinates } from '../primitives/Coordinates';
import { throtthle } from '../../util/throttle';

export class PathFindingRenderer extends DiagramExtension {
  grid: PathsGrid | null = null;
  point: PathGridPoint | null = null;
  highlighted = new Set<PathGridEdge>();

  init() {
    makeObservable(this, {
      grid: observable,
      setGrid: action,
      point: observable,
      highlighted: observable,
    });

    const process = throtthle((ev: DMouseMoveEvent) => {
      const mouse = this.diagram.canvas.inverseFit(new Coordinates(ev));
      if (this.grid) {
        for (const p of this.grid.points) {
          if (p.distance(mouse) < 20) {
            runInAction(() => {
              this.highlighted.clear();
              this.point = p;
              for (const e of this.grid!.getEdgesFrom(p)) {
                this.highlighted.add(e);
              }
              for (const e of this.grid!.getEdgesTo(p)) {
                this.highlighted.add(e);
              }
            });
          }
        }

        const hl = [...this.highlighted.values()];
        if (hl.length) {
          console.log(hl.map((c) => c.toString()));
        }
      }
    });

    this.diagram.onEvent(DMouseMoveEvent, (ev) => {
      if (this.enabled) {
        process(ev);
      }
    });
  }

  setGrid(grid: PathsGrid) {
    this.grid = grid;
  }
}
