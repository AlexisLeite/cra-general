import { makeAutoObservable } from 'mobx';
import { TEdgeState } from '../types';
import { Coordinates } from '../primitives/Coordinates';

export type EdgePathType = 'straight' | 'curved' | 'angle';
export type EdgeArrowHead =
  | 'none'
  | 'arrow'
  | 'triangle'
  | 'triangle-filled'
  | 'diamond'
  | 'circle-small'
  | 'circle-medium'
  | 'measure';
export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted';

let id = Number.MIN_SAFE_INTEGER;

export class Edge {
  protected _arrowHeadEnd: EdgeArrowHead = 'arrow';
  protected _arrowHeadStart: EdgeArrowHead = 'none';
  protected _lineStyle: EdgeLineStyle = 'solid';
  protected _pathType: EdgePathType = 'straight';
  id: Readonly<number> = id++;

  constructor(protected state: TEdgeState) {
    makeAutoObservable(this);
  }

  get arrowHeadEnd() {
    return this._arrowHeadEnd;
  }

  get arrowHeadStart() {
    return this._arrowHeadStart;
  }

  public get from() {
    return this.state.from;
  }

  get lineStyle() {
    return this._lineStyle;
  }

  get pathType() {
    return this._pathType;
  }

  get steps() {
    return this.state.steps.map((c) => c.copy());
  }

  setSteps(steps: Coordinates[]) {
    this.state.steps = steps;
  }

  public get to() {
    return this.state.to;
  }

  deserialize(o: ReturnType<(typeof this)['serialize']>) {
    this._arrowHeadEnd = o.arrowHeadEnd;
    this._arrowHeadStart = o.arrowHeadStart;
    this._lineStyle = o.lineStyle;
    this._pathType = o.pathType;

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
