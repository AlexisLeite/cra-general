import React, { useMemo } from 'react';
import type { RenderEdgeProps } from './types';
import { EdgeMarker } from './EdgeMarker';
import { EdgeMidpoints } from './EdgeMidpoints';
import { observer } from 'mobx-react-lite';
import { Cross } from '../Cross';
import { EdgePoint } from '../../../store/elements/EdgePoint';
import { Coordinates } from '../../../store/primitives/Coordinates';
import { ToolsStates } from '../../extra/Tools';
import { runInAction } from 'mobx';

export type * from './types';

function crossColor(p: Coordinates | EdgePoint) {
  if (p instanceof EdgePoint) {
    switch (p.mode) {
      case 'auto':
        return 'red';
      case 'manual':
        return 'green';
      case 'static':
        return 'yellow';
    }
  }
}

export const RenderEdge: React.FC<RenderEdgeProps> = observer(
  ({
    edge,
    points,
    color,
    width = 2,
    arrowSize = 8,
    startType = 'none',
    endType = 'arrow',
    lineStyle = 'solid',

    endStroke = color,
    startStroke = color,

    onMidpointMouseDown,
    onEndpointMouseDown,
    className,

    draggable,
  }) => {
    const makeId = (suffix: string) =>
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

    const showDragMidpoints = Boolean(
      edge &&
      draggable &&
      (edge.state.hover || edge.state.dragging || edge.state.selected),
    );

    const showEndpointHandles = Boolean(
      edge && draggable && (edge.state.selected || edge.state.dragging),
    );

    return (
      <g
        data-id={edge?.id}
        className={[
          'edge',
          edge?.state.dragging && 'dragging',
          edge?.state.selected && 'selected',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
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
          onMouseOver={() => {
            runInAction(() => {
              if (edge) edge!.state.hover = true;
            });
          }}
          onMouseOut={(ev) => {
            if (
              ev.target &&
              (ev.target as HTMLElement)?.closest('.edge') !==
                (ev.relatedTarget as HTMLElement)?.closest('.edge')
            ) {
              runInAction(() => {
                if (edge) edge!.state.hover = false;
              });
            }
          }}
        />

        <path
          d={d}
          fill="none"
          style={
            {
              '--hover-stroke': color,
              stroke: color,
              strokeWidth: width,
            } as any
          }
          strokeDasharray={strokeDasharray}
          markerStart={
            startType !== 'none' ? `url(#${startMarkerId})` : undefined
          }
          markerEnd={endType !== 'none' ? `url(#${endMarkerId})` : undefined}
        />

        {ToolsStates.instance.showDragHints &&
          points.map((c, i) => (
            <Cross coordinates={c} key={i} size={15} stroke={crossColor(c)} />
          ))}

        {showDragMidpoints && (
          <EdgeMidpoints
            edge={edge!}
            points={points}
            onMouseDown={(midpointIndex, ev) => {
              onMidpointMouseDown?.(midpointIndex, ev);
            }}
          />
        )}

        {showEndpointHandles && (
          <>
            <circle
              cx={points[0].x}
              cy={points[0].y}
              r={6}
              className="edge_endpoint_drag_point"
              onMouseDownCapture={(ev) => {
                onEndpointMouseDown?.('from', ev);
              }}
            />
            <circle
              cx={points.at(-1)!.x}
              cy={points.at(-1)!.y}
              r={6}
              className="edge_endpoint_drag_point"
              onMouseDownCapture={(ev) => {
                onEndpointMouseDown?.('to', ev);
              }}
            />
          </>
        )}
      </g>
    );
  },
);
