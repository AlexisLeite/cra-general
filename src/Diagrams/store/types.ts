import type { Dimensions } from './primitives/Dimensions';
import type { Coordinates } from './primitives/Coordinates';
import type { Gateway } from './elements/Gateway';
import type { Edge } from './elements/Edge';
import { EdgePoint } from './elements/EdgePoint';

export type TNodeState = {
  id: string;
  box: Dimensions;
  label: string;
} & Partial<{
  fill: string;
  labelFontSize: number;
  movable: boolean;
  selectable: boolean;
  selected: boolean;
  stroke: string;
  strokewWidth: number;
  hover: boolean;
}>;

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

export type TEdgeState = {
  dragging: boolean;
  hover: boolean;
  selected: boolean;

  label: string;
  labelPositioning: Coordinates;

  from: Gateway;
  to: Gateway;

  steps: EdgePoint[];
} & Partial<{
  arrowHeadEnd: EdgeArrowHead;
  arrowHeadStart: EdgeArrowHead;
  displacementEnd: Coordinates;
  displacementStart: Coordinates;
  lineStyle: EdgeLineStyle;
  pathType: EdgePathType;
  stroke: string;
  strokeWidth: number;
}>;

export type TGatewayState = {
  id: string;

  allowDisplace: boolean;

  incomingEdges: Edge[];
  outgoingEdges: Edge[];

  maxIncomingConnections: number;
  maxOutgoingConnections: number;

  orientation: TOrientation;

  fill?: string;
  stroke?: string;
  strokeWidth: number;
  radius: number;

  /**
   * From 0 to 1, telling the percentage of width and height of its parent
   */
  position: Coordinates;
};

export type TOrientation = 'up' | 'right' | 'down' | 'left';
