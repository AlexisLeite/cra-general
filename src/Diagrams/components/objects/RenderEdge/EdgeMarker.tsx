import React from 'react';
import type { EdgeArrowHead } from '../../../store/types';

interface EdgeMarkerProps {
  id: string;
  color?: string;
  type: EdgeArrowHead;
  width: number;
  arrowSize: number;
  flip?: boolean;
}

export const EdgeMarker: React.FC<EdgeMarkerProps> = ({
  id,
  color,
  type,
  width,
  arrowSize,
  flip = false,
}) => {
  const orient = flip ? '180' : 'auto';
  const fillNone = 'white';

  switch (type) {
    case 'arrow':
      return (
        <marker
          id={id}
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={flip ? 0 : arrowSize * 0.9}
          refY={arrowSize / 2}
          orient={orient}
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,0 L${arrowSize},${arrowSize / 2} L0,${arrowSize} Z`}
            fill={color}
            className="edge_marker_path"
          />
        </marker>
      );

    case 'triangle':
      return (
        <marker
          id={id}
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={flip ? 0 : arrowSize}
          refY={arrowSize / 2}
          orient={orient}
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,0 L${arrowSize},${arrowSize / 2} L0,${arrowSize} Z`}
            fill={fillNone}
            stroke={color}
            strokeWidth={width / 2}
          />
        </marker>
      );

    case 'triangle-filled':
      return (
        <marker
          id={id}
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={flip ? 0 : arrowSize}
          refY={arrowSize / 2}
          orient={orient}
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,0 L${arrowSize},${arrowSize / 2} L0,${arrowSize} Z`}
            fill={color}
            className="edge_marker_path"
          />
        </marker>
      );

    case 'diamond':
      return (
        <marker
          id={id}
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={flip ? 0 : arrowSize * 0.9}
          refY={arrowSize / 2}
          orient={orient}
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,${arrowSize / 2} L${arrowSize / 2},0 L${arrowSize},${
              arrowSize / 2
            } L${arrowSize / 2},${arrowSize} Z`}
            fill="white"
            stroke={color}
            strokeWidth={width / 2}
          />
        </marker>
      );

    case 'circle-small':
      return (
        <marker
          id={id}
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={arrowSize / 2}
          refY={arrowSize / 2}
          orient={orient}
          markerUnits="strokeWidth"
        >
          <circle
            cx={arrowSize / 2}
            cy={arrowSize / 2}
            r={arrowSize / 4}
            fill="white"
            stroke={color}
            strokeWidth={width / 2}
          />
        </marker>
      );

    case 'circle-medium':
      return (
        <marker
          id={id}
          markerWidth={arrowSize * 1.5}
          markerHeight={arrowSize * 1.5}
          refX={(arrowSize * 1.5) / 2}
          refY={(arrowSize * 1.5) / 2}
          orient={orient}
          markerUnits="strokeWidth"
        >
          <circle
            cx={(arrowSize * 1.5) / 2}
            cy={(arrowSize * 1.5) / 2}
            r={arrowSize / 2}
            fill="white"
            stroke={color}
            strokeWidth={width / 2}
          />
        </marker>
      );

    case 'measure':
      return (
        <marker
          id={id}
          markerWidth={arrowSize * 5}
          markerHeight={arrowSize * 5}
          refX={0}
          refY={arrowSize / 2}
          orient={orient}
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,0 L0,${arrowSize / 2}`}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </marker>
      );

    default:
      return null;
  }
};
