import { makeAutoObservable, reaction } from 'mobx';
import { Diagram } from '../../Diagram';

class PathDebug {
  enabled = true;

  showStart = true;
  showEnd = true;
  showPath = true;

  constructor() {
    makeAutoObservable(this);

    reaction(
      () => {
        return this.showEnd;
      },
      () => {
        ((window as any).d as Diagram).nodes.forEach((c) =>
          c.gateways.forEach((c) => c.updateEdges()),
        );
      },
    );
    reaction(
      () => {
        return this.showStart;
      },
      () => {
        ((window as any).d as Diagram).nodes.forEach((c) =>
          c.gateways.forEach((c) => c.updateEdges()),
        );
      },
    );
    reaction(
      () => {
        return this.showPath;
      },
      () => {
        ((window as any).d as Diagram).nodes.forEach((c) =>
          c.gateways.forEach((c) => c.updateEdges()),
        );
      },
    );
  }
}

export const pathDebug = new PathDebug();
