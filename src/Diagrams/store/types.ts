import type { FC } from 'react';
import type { Node } from './elements/Node';
import type { Dimensions } from './primitives/Dimensions';
import type { Coordinates } from './primitives/Coordinates';
import type { Gateway } from './elements/Gateway';
import type { Edge } from './elements/Edge';

export type TNodeState = {
  id: string;
  box: Dimensions;
  label: string;
} & Partial<{
  edition: boolean;
  fill: string;
  labelFontSize: number;
  movable: boolean;
  Renderer: FC<{ node: Node }>;
  selectable: boolean;
  stroke: string;
  strokewWidth: number;
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
  label: string;
  labelPositioning: Coordinates;

  from: Gateway;
  to: Gateway;

  steps: Coordinates[];
} & Partial<{
  arrowHeadEnd: EdgeArrowHead;
  arrowHeadStart: EdgeArrowHead;
  lineStyle: EdgeLineStyle;
  pathType: EdgePathType;
  stroke: string;
  strokeWidth: number;
}>;

export type TGatewayState = {
  id: string;

  incomingEdges: Edge[];
  outgoingEdges: Edge[];

  maxIncomingConnections: number;
  maxOutgoingConnections: number;

  orientation: TDirection;

  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;

  /**
   * From 0 to 1, telling the percentage of width and height of its parent
   */
  position: Coordinates;
};

export type TDirection = 'up' | 'right' | 'down' | 'left';
