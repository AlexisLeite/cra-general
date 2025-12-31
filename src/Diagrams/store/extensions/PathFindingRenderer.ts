import { DiagramExtension } from './DiagramExtension';
import {
  PathsGrid,
  PathGridEdge,
  PathGridPoint,
} from '../../util/paths/PathsGrid';
import { action, makeObservable, observable } from 'mobx';

export class PathFindingRenderer extends DiagramExtension {
  grid: PathsGrid | null = null;
  points: PathGridPoint[] | null = null;
  highlighted = new Set<PathGridEdge>();

  init() {
    makeObservable(this, {
      grid: observable,
      setGrid: action,
      points: observable,
      highlighted: observable,
    });
  }

  setGrid(grid: PathsGrid | null, points: PathGridPoint[]) {
    this.grid = grid;
    this.points = points;
  }
}
