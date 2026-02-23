import React, { useMemo } from 'react';
import type { RenderEdgeProps } from './types';
import { EdgeMarker } from './EdgeMarker';
import { EdgeMidpoints } from './EdgeMidpoints';
import { observer } from 'mobx-react-lite';
import { Cross } from '../Cross';
import { EdgePoint } from '../../../store/elements/EdgePoint';
import { Coordinates } from '../../../store/primitives/Coordinates';
import type { Edge } from '../../../store/elements/Edge';
import { ToolsStates } from '../../extra/Tools';
import { runInAction } from 'mobx';
import { observer as mobxObserver } from 'mobx-react-lite';

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

function getLabelAnchor(points: (Coordinates | EdgePoint)[]) {
  if (points.length < 2) {
    return null;
  }

  const segmentIndex = Math.max(0, Math.floor((points.length - 2) / 2));
  const a = points[segmentIndex];
  const b = points[segmentIndex + 1];
  return a.copy().sum(b).divide(2);
}

type EdgeLabelEditable = Edge & {
  isEditingLabel?: boolean;
  labelDraft?: string;
  beginLabelEdit?: () => void;
  cancelLabelEdit?: () => void;
  confirmLabelEdit?: () => void;
};

const EdgeLabel = mobxObserver(({ edge, points }: { edge: EdgeLabelEditable; points: (Coordinates | EdgePoint)[] }) => {
  const label = edge?.state?.label ?? '';
  const anchor = getLabelAnchor(points);

  if (!edge || !anchor) {
    return null;
  }

  const offset = edge.state.labelPositioning ?? new Coordinates([0, 0]);
  const x = anchor.x + offset.x;
  const y = anchor.y + offset.y;
  const isEditing = Boolean(edge.isEditingLabel);

  if (isEditing) {
    return (
      <foreignObject x={x - 90} y={y - 18} width={180} height={36}>
        <input
          className="edge-label-input"
          value={edge.labelDraft ?? label}
          autoFocus
          onChange={(ev) => {
            runInAction(() => {
              edge.labelDraft = ev.target.value;
            });
          }}
          onBlur={() => edge.confirmLabelEdit?.()}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') {
              ev.preventDefault();
              edge.confirmLabelEdit?.();
            }
            if (ev.key === 'Escape') {
              ev.preventDefault();
              edge.cancelLabelEdit?.();
            }
            ev.stopPropagation();
          }}
        />
      </foreignObject>
    );
  }

  if (!label) {
    return null;
  }

  return (
    <g
      className="edge-label"
      onDoubleClick={(ev) => {
        ev.stopPropagation();
        edge.beginLabelEdit?.();
      }}
    >
      <rect x={x - 44} y={y - 12} width={88} height={24} rx={6} ry={6} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
  );
});

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
        onMouseEnter={() => {
          runInAction(() => {
            if (edge) edge.state.hover = true;
          });
        }}
        onMouseLeave={() => {
          runInAction(() => {
            if (edge && !edge.state.dragging && !edge.state.selected) {
              edge.state.hover = false;
            }
          });
        }}
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

        {edge && <EdgeLabel edge={edge as EdgeLabelEditable} points={points} />}

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
              data-edge-id={edge?.id}
              data-endpoint="from"
              onMouseDownCapture={(ev) => {
                onEndpointMouseDown?.('from', ev);
              }}
            />
            <circle
              cx={points.at(-1)!.x}
              cy={points.at(-1)!.y}
              r={6}
              className="edge_endpoint_drag_point"
              data-edge-id={edge?.id}
              data-endpoint="to"
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
