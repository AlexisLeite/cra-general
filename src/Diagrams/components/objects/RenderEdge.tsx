import { useMemo } from 'react';
import type { Coordinates } from '../../store/primitives/Coordinates';
import { EdgeArrowHead, EdgeLineStyle } from '../../store/elements/Edge';

export interface ArrowPathProps {
  points: Coordinates[];
  color?: string;
  width?: number;
  arrowSize?: number;
  className?: string;

  endStroke?: string;
  startStroke?: string;
  startType?: EdgeArrowHead;
  endType?: EdgeArrowHead;

  lineStyle?: EdgeLineStyle;
}

export const RenderEdge: React.FC<ArrowPathProps> = ({
  points,
  color = '#111',
  width = 2,
  arrowSize = 8,
  className,
  startType = 'none',
  endType = 'arrow',
  lineStyle = 'solid',

  endStroke = color,
  startStroke = color,
}) => {
  if (!points || points.length < 2) return null;

  const d = 'M ' + points.map((d) => `${d.x} ${d.y}`).join(' L ');

  const makeId = (suffix: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
    useMemo(
      () => `marker-${suffix}-${Math.random().toString(36).slice(2)}`,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

  const startMarkerId = makeId('start');
  const endMarkerId = makeId('end');

  const getMarker = (
    id: string,
    color: string,
    type: ArrowPathProps['startType'],
    flip = false,
  ) => {
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

  const strokeDasharray =
    lineStyle === 'dashed'
      ? `${width * 3},${width * 2}`
      : lineStyle === 'dotted'
        ? `${width},${width * 2}`
        : 'none';

  return (
    <>
      <defs>
        {getMarker(startMarkerId, startStroke, startType, false)}
        {getMarker(endMarkerId, endStroke, endType, false)}
      </defs>

      <path
        d={d}
        stroke={color}
        strokeWidth={width}
        fill="none"
        strokeDasharray={strokeDasharray}
        markerStart={
          startType !== 'none' ? `url(#${startMarkerId})` : undefined
        }
        markerEnd={endType !== 'none' ? `url(#${endMarkerId})` : undefined}
        className={className}
      />
    </>
  );
};
