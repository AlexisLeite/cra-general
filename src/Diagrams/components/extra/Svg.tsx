import { CSSProperties, ReactNode, useState } from 'react'

export const Svg = ({
  children,
  style,
  scale,
}: {
  children: ReactNode
  style?: CSSProperties
  scale?: boolean
}) => {
  const [viewBox, setViewBox] = useState('0 0 400 200')

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      style={style}
      ref={(el) => {
        if (el instanceof SVGElement && !el.dataset.set) {
          el.dataset.set = 'true'
          const rect = el.getBoundingClientRect()
          setViewBox(`0 0 ${rect.width} ${rect.height}`)
        }
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  )
}
