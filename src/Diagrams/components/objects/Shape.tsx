import React, {
  forwardRef,
  type MouseEventHandler,
  type ReactNode,
  type SVGProps,
} from 'react';
import { Coordinates } from '../../store/primitives/Coordinates';
import { Diagram } from '../../store/Diagram';
import { observer } from 'mobx-react-lite';

/**
 * Estilo del borde: sólido, rayado o punteado.
 */
export type StrokeStyle = 'solid' | 'dashed' | 'dotted';

export type ArrowPosition = 'start' | 'end' | 'both';

export interface ArrowSpec {
  position?: ArrowPosition;
  size?: number;
  color?: string;
  filled?: boolean;
  sharpness?: number; // 0–1, controls angle
}

/**
 * Configuración de un path individual dentro del Shape.
 */
export interface PathSpec {
  /** Atributo SVG "d" */
  d: string;

  arrow?: ArrowSpec;
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

  children?: ReactNode;
}

const UnobservedShape = forwardRef<any, ShapeProps>(
  (
    {
      children,
      paths,
      transform,
      selected,
      onClick,
      className,
      roundedBorders = false,
      label,
      labelColor,
      labelFontSize,
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
        className={`${className || ''} ${selected ? 'selected' : ''} base_shape`}
        transform={transform}
        onClick={onClick}
        ref={ref}
      >
        <defs>
          {paths.map((p, i) => {
            if (!p.arrow) return null;

            const strokeWidth = 6;

            const { size = strokeWidth, color = p.stroke ?? '#111' } = p.arrow;

            const id = `arrow-${i}`;

            return (
              <marker
                id={id}
                viewBox="0 0 10 10"
                refX={strokeWidth * 1.5}
                refY="5"
                markerWidth={size}
                markerHeight={size}
                orient="auto-start-reverse"
                markerUnits="userSpaceOnUse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10"
                  fill="none"
                  stroke={color}
                  strokeWidth={Math.max(1, strokeWidth * 0.9)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </marker>
            );
          })}
        </defs>

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
            arrow,
          } = p;

          let dasharray: string | undefined;
          switch (strokeStyle) {
            case 'dashed':
              dasharray = '10 5';
              break;
            case 'dotted':
              dasharray = '2 6';
              break;
          }

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

          const markerId = arrow ? `url(#arrow-${i})` : undefined;

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
              markerStart={
                arrow?.position === 'start' || arrow?.position === 'both'
                  ? markerId
                  : undefined
              }
              markerEnd={
                !arrow || arrow.position === 'end' || arrow.position === 'both'
                  ? markerId
                  : undefined
              }
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

        {children}
      </g>
    );
  },
);

export const Shape = observer(UnobservedShape) as typeof UnobservedShape;
