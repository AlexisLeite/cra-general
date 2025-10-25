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

export class Edge {
  _arrowHeadEnd: EdgeArrowHead = 'arrow';
  _arrowHeadStart: EdgeArrowHead = 'none';
  _lineStyle: EdgeLineStyle = 'solid';
  _pathType: EdgePathType = 'straight';

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
}
