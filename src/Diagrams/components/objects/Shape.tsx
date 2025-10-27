import React, { forwardRef, MouseEventHandler, SVGProps } from 'react';
import { Coordinates } from '../../store/primitives/Coordinates';
import { Diagram } from '../../store/Diagram';
import { observer } from 'mobx-react-lite';

/**
 * Estilo del borde: sólido, rayado o punteado.
 */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Configuración de un path individual dentro del Shape.
 */
export interface PathSpec {
  /** Atributo SVG "d" */
  d: string;

  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: StrokeStyle;
  animated?: boolean;
  animationDuration?: number;
  nonScalingStroke?: boolean;
  roundedBorders?: boolean;
}

export interface ShapeProps extends SVGProps<SVGGElement> {
  paths: PathSpec[];
  transform?: string;
  selected?: boolean;
  onClick?: React.MouseEventHandler<SVGGElement>;
  className?: string;
  roundedBorders?: boolean;

  label?: string;
  labelColor?: string;
  labelFontSize?: number;
  labelFontFamily?: string;
  labelOffset?: Coordinates;
  onMouseDown?: MouseEventHandler<SVGGElement>;
  'data-id'?: string;
}

const UnobservedShape = forwardRef<any, ShapeProps>(
  (
    {
      paths,
      transform,
      selected,
      onClick,
      className,
      roundedBorders = false,
      label,
      labelColor = '#111',
      labelFontSize = 14,
      labelFontFamily = 'sans-serif',
      labelOffset,
      'data-id': dataId,
      ...props
    },
    ref,
  ) => {
    const d = Diagram.use();

    return (
      <g
        {...props}
        data-id={dataId}
        className={className}
        transform={transform}
        onClick={onClick}
        style={{
          cursor: 'pointer',
          transition: 'filter 0.2s ease',
          ...(selected && { filter: 'drop-shadow(0 0 3px red)' }),
        }}
        ref={ref}
      >
        {paths.map((p, i) => {
          const {
            d,
            fill = 'none',
            stroke = '#111',
            strokeWidth = 3,
            strokeStyle = 'solid',
            animated = false,
            animationDuration = 1,
            nonScalingStroke = true,
            roundedBorders: roundedLocal = roundedBorders,
          } = p;

          // Patrón de trazo según estilo
          let dasharray: string | undefined;
          switch (strokeStyle) {
            case 'dashed':
              dasharray = '10 5';
              break;
            case 'dotted':
              dasharray = '2 6';
              break;
          }

          // Animación si está habilitada
          const animateElement = animated ? (
            <animate
              attributeName="stroke-dashoffset"
              from="0"
              to={
                dasharray
                  ? `-${dasharray.split(' ').reduce((a, b) => +a + +b, 0)}`
                  : '-15'
              }
              dur={`${animationDuration}s`}
              repeatCount="indefinite"
            />
          ) : null;

          return (
            <path
              key={i}
              d={d}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeLinecap={roundedLocal ? 'round' : 'butt'}
              strokeLinejoin={roundedLocal ? 'round' : 'miter'}
              vectorEffect={nonScalingStroke ? 'non-scaling-stroke' : undefined}
            >
              {animateElement}
            </path>
          );
        })}

        {label && (
          <text
            x={labelOffset?.x ?? 0}
            y={labelOffset?.y ?? 0}
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily={labelFontFamily}
            fontSize={labelFontSize}
            fill={labelColor}
            pointerEvents="none"
            {...(d.canvas.scale > 1
              ? {
                  shapeRendering: 'geometricPrecision',
                  style: {
                    // evita hinting borroso
                    paintOrder: 'stroke',
                    stroke: 'transparent',
                    strokeWidth: 0.5,
                    WebkitFontSmoothing: 'antialiased',
                    transform: 'translateZ(0)', // fuerza re-rasterización limpia
                  },
                }
              : {})}
          >
            {label}
          </text>
        )}
      </g>
    );
  },
);

export const Shape = observer(UnobservedShape) as typeof UnobservedShape;
