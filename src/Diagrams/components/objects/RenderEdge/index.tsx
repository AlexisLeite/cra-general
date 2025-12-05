import React, { useMemo } from 'react';
import { RenderEdgeProps } from './types';
import { EdgeMarker } from './EdgeMarker';
import { EdgeMidpoints } from './EdgeMidpoints';

export * from './types';

export const RenderEdge: React.FC<RenderEdgeProps> = ({
  points,
  color,
  width = 2,
  arrowSize = 8,
  className,
  startType = 'none',
  endType = 'arrow',
  lineStyle = 'solid',

  endStroke = color,
  startStroke = color,
  onChange,

  draggable,
}) => {
  const makeId = (suffix: string) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
    useMemo(
      () => `marker-${suffix}-${Math.random().toString(36).slice(2)}`,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [],
    );

  const startMarkerId = makeId('start');
  const endMarkerId = makeId('end');

  if (!points || points.length < 2) return null;

  const d = 'M ' + points.map((d) => `${d.x} ${d.y}`).join(' L ');

  const strokeDasharray =
    lineStyle === 'dashed'
      ? `${width * 3},${width * 2}`
      : lineStyle === 'dotted'
        ? `${width},${width * 2}`
        : 'none';

  return (
    <g className="edge">
      <defs>
        <EdgeMarker
          id={startMarkerId}
          color={startStroke}
          type={startType}
          width={width}
          arrowSize={arrowSize}
          flip={false}
        />
        <EdgeMarker
          id={endMarkerId}
          color={endStroke}
          type={endType}
          width={width}
          arrowSize={arrowSize}
          flip={false}
        />
      </defs>

      <path
        d={d}
        strokeWidth={width + 8}
        fill="none"
        className="edge-hover-area"
      />

      <path
        d={d}
        fill="none"
        style={
          { '--hover-stroke': color, stroke: color, strokeWidth: width } as any
        }
        strokeDasharray={strokeDasharray}
        markerStart={
          startType !== 'none' ? `url(#${startMarkerId})` : undefined
        }
        markerEnd={endType !== 'none' ? `url(#${endMarkerId})` : undefined}
        className={className}
      />

      {draggable && <EdgeMidpoints points={points} onMouseDown={() => {}} />}
    </g>
  );
};
