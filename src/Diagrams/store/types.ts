import type { FC } from 'react'
import type { Node } from './Node'
import type { Dimensions } from './Dimensions'
import type { Coordinates } from './Coordinates'

export type TNodeState = {
  id: string
  box: Dimensions
  label: string
} & Partial<{
  movable: boolean
  Renderer: FC<{ node: Node }>
  selectable: boolean
  selected: boolean
}>

export type TEdgeState = {
  label: string
  labelPositioning: Coordinates

  from: Node
  to: Node

  steps: Coordinates[]
}
