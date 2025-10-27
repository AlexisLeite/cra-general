import { makeAutoObservable } from 'mobx';
import { TEdgeState } from '../types';
import { Coordinates } from '../primitives/Coordinates';

let id = Number.MIN_SAFE_INTEGER;

export class Edge {
  id: Readonly<number> = id++;

  constructor(protected state: TEdgeState) {
    makeAutoObservable(this);
  }

  get arrowHeadEnd() {
    return this.state.arrowHeadEnd;
  }

  get arrowHeadStart() {
    return this.state.arrowHeadStart;
  }

  public get from() {
    return this.state.from;
  }

  get lineStyle() {
    return this.state.lineStyle;
  }

  get pathType() {
    return this.state.pathType;
  }

  get steps() {
    return this.state.steps.map((c) => c.copy());
  }

  get stroke() {
    return this.state.stroke;
  }

  get strokeWidth() {
    return this.state.strokeWidth;
  }

  setSteps(steps: Coordinates[]) {
    this.state.steps = steps;
  }

  public get to() {
    return this.state.to;
  }

  deserialize(o: ReturnType<(typeof this)['serialize']>) {
    this.state.arrowHeadEnd = o.arrowHeadEnd;
    this.state.arrowHeadStart = o.arrowHeadStart;
    this.state.lineStyle = o.lineStyle;
    this.state.pathType = o.pathType;

    this.state.steps = o.steps.map((c) => new Coordinates(c));
    this.state.from.diagram.connect(
      this.state.from,
      this.state.from.diagram
        .getNodeById(o.toParentId)!
        .getGateway(o.to as any)!,
    );
  }

  serialize() {
    const {
      arrowHeadEnd,
      arrowHeadStart,
      lineStyle,
      pathType,
      steps,
      to: {
        id: to,
        parent: { id: toParentId },
      },
    } = this;
    return {
      arrowHeadEnd,
      arrowHeadStart,
      lineStyle,
      pathType,
      steps: steps.map((c) => c.raw),
      to,
      toParentId,
      class: this.constructor.name,
    };
  }
}
