import { makeAutoObservable } from 'mobx'
import type { TNodeState, TEdgeState } from './types'
import { createContext, ReactNode, useContext } from 'react'
import { Default } from '../components/nodes/Default'
import { Panzoom } from './Panzoom'

export class Node {
  constructor(
    public state: Omit<TNodeState, 'dimentions'> & Partial<TNodeState>,
  ) {
    makeAutoObservable(this)
  }

  get Renderer() {
    return this.state.Renderer ?? Default
  }
}

export class Edge {
  constructor(public state: TEdgeState) {
    makeAutoObservable(this)
  }
}

const DiagramContext = createContext<Diagram | null>(null)

export class Diagram {
  edges: Edge[] = []
  nodes: Node[] = []

  panzoom = new Panzoom()

  constructor() {
    makeAutoObservable(this)
  }

  add(node: Node) {
    this.nodes.push(node)
  }

  Context = ({ children }: { children: ReactNode }) => (
    <DiagramContext.Provider value={this}>{children}</DiagramContext.Provider>
  )

  public static use = () => useContext(DiagramContext)!
}
