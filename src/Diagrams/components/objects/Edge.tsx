import { useMemo } from 'react'
import type { Coordinates } from '../../store/Coordinates'

export interface ArrowPathProps {
  points: Coordinates[]
  color?: string
  width?: number
  arrowSize?: number
  className?: string
}

export const Edge: React.FC<ArrowPathProps> = ({
  points,
  color = '#111',
  width = 2,
  arrowSize = 8,
  className,
}) => {
  const d = 'M ' + points.map((d) => `${d.x} ${d.y}`).join(' L ')

  const markerId = useMemo(
    () => `arrowhead-${Math.random().toString(36).slice(2)}`,
    [],
  )

  if (!points || points.length < 2) return null

  return (
    <>
      <defs>
        <marker
          id={markerId}
          markerWidth={arrowSize}
          markerHeight={arrowSize}
          refX={arrowSize * 0.9}
          refY={arrowSize / 2}
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d={`M0,0 L${arrowSize},${arrowSize / 2} L0,${arrowSize} Z`}
            fill={color}
          />
        </marker>
      </defs>

      <path
        d={d}
        stroke={color}
        strokeWidth={width}
        fill="none"
        markerEnd={`url(#${markerId})`}
      />
    </>
  )
}
