import { FC } from 'react'
import type { Node } from './Diagram'
import { Dimensions } from './Dimensions'
import { Coordinates } from './Coordinates'

export type TNodeState = {
  id: string
  box: Dimensions
  label: string
  Renderer?: FC<{ node: Node }>
}

export type TEdgeState = {
  label: string
  labelPositioning: Coordinates

  from: Node
  to: Node

  steps: Coordinates[]
}
