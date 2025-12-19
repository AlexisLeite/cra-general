import React from 'react';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { getSegmentMidpoints } from './util';
import { Midpoint } from './types';
import type { Edge } from '../../../store/elements/Edge';

interface EdgeMidpointsProps {
  edge: Edge;
  onMouseDown: (m: Midpoint, ev: React.MouseEvent) => unknown;
  points: Coordinates[];
}

export const EdgeMidpoints: React.FC<EdgeMidpointsProps> = ({
  edge,
  onMouseDown,
  points,
}) => {
  const midpoints = getSegmentMidpoints(edge, points);

  return (
    <>
      {midpoints.map((mid, index) => {
        const x = mid.x;
        const y = mid.y;

        return (
          <rect
            key={mid.id}
            x={x - 6}
            y={y - 6}
            rx={4}
            className="edge_drag_point"
            onMouseDownCapture={(e) => {
              onMouseDown(mid, e);
            }}
          />
        );
      })}
    </>
  );
};
