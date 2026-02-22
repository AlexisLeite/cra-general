import type React from 'react';
import { Coordinates } from '../../../store/primitives/Coordinates';
import type { EdgeArrowHead, EdgeLineStyle } from '../../../store/types';
import type { EdgePoint } from '../../../store/elements/EdgePoint';
import { makeObservable, observable } from 'mobx';
import type { Edge } from '../../../store/elements/Edge';
import type { AnyMouseEvent } from '../../../store/elements/Events';

export interface RenderEdgeProps {
  edge?: Edge;
  points: (Coordinates | EdgePoint)[];
  color?: string;
  width?: number;
  arrowSize?: number;
  className?: string;

  endStroke?: string;
  startStroke?: string;
  startType?: EdgeArrowHead;
  endType?: EdgeArrowHead;

  lineStyle?: EdgeLineStyle;

  draggable?: boolean;

  onMidpointMouseDown?: (p: Midpoint, ev: React.MouseEvent) => void;
  onEndpointMouseDown?: (endpoint: 'from' | 'to', ev: React.MouseEvent) => void;
}

export class Midpoint extends Coordinates {
  constructor(
    public id: string,
    public edge: Edge,
    public points: [Coordinates, Coordinates],
    items?: AnyMouseEvent | Event | Coordinates | number[],
  ) {
    super(items);

    this.assign(points[0].copy().sum(points[1]).divide(2));

    makeObservable(this, { points: observable });
  }

  copy() {
    return new Midpoint(this.id, this.edge, this.points, super.copy());
  }
}
