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
  movable: boolean;
  Renderer: FC<{ node: Node }>;
  selectable: boolean;
}>;

export type TEdgeState = {
  label: string;
  labelPositioning: Coordinates;

  from: Gateway;
  to: Gateway;

  steps: Coordinates[];
};

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
