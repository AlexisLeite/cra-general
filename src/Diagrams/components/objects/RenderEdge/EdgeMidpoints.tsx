import React from 'react';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { getSegmentMidpoints } from './util';

interface EdgeMidpointsProps {
  onMouseDown: (ev: React.MouseEvent) => unknown;
  points: Coordinates[];
}

export const EdgeMidpoints: React.FC<EdgeMidpointsProps> = ({
  onMouseDown,
  points,
}) => {
  const midpoints = getSegmentMidpoints(points);

  return (
    <>
      {midpoints.map((mid, index) => {
        const x = mid.x;
        const y = mid.y;

        return (
          <rect
            key={index}
            x={x - 6}
            y={y - 6}
            width={12}
            height={12}
            rx={4}
            fill="white"
            stroke="black"
            strokeWidth={1}
            style={{ cursor: 'pointer' }}
            onMouseDownCapture={(e) => {
              e.stopPropagation();
              onMouseDown(e);
            }}
          />
        );
      })}
    </>
  );
};
