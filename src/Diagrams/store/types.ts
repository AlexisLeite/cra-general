import type { FC } from 'react';
import type { Node } from './elements/Node';
import type { Dimensions } from './primitives/Dimensions';
import type { Coordinates } from './primitives/Coordinates';

export type TNodeState = {
  id: string;
  box: Dimensions;
  label: string;
} & Partial<{
  movable: boolean;
  Renderer: FC<{ node: Node }>;
  selectable: boolean;
}>;

export type TEdgeState = {
  label: string;
  labelPositioning: Coordinates;

  from: Node;
  to: Node;

  steps: Coordinates[];
};

export type TDirection = 'up' | 'right' | 'down' | 'left';
