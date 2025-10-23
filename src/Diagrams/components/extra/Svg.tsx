import { ReactNode, useState } from 'react'

export const Svg = ({ children }: { children: ReactNode }) => {
  const [viewBox, setViewBox] = useState('0 0 400 200')

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={viewBox}
      ref={(el) => {
        if (el instanceof SVGElement) {
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
