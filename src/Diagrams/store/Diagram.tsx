import { action, makeAutoObservable, makeObservable, observable } from 'mobx'
import type { TEdgeState } from './types'
import { createContext, ReactNode, useContext } from 'react'
import { Panzoom } from './Panzoom'
import type { Node } from './Node'
import { EventEmitter } from '../util'
import { NodesConnector } from './NodesConnector'
import { Coordinates } from './Coordinates'

export class Edge {
  constructor(public state: TEdgeState) {
    makeAutoObservable(this)
  }

  public get from() {
    return this.state.from
  }

  public get to() {
    return this.state.to
  }
}

const DiagramContext = createContext<Diagram | null>(null)

export class Diagram {
  edges: Edge[] = []
  nodes: Node[] = []
  selectedNode: Node | null = null
  protected emitter = new EventEmitter<{
    select: Node
  }>()

  connector = new NodesConnector(this)
  panzoom = new Panzoom(this)

  constructor() {
    makeObservable(this, {
      edges: observable,
      nodes: observable,
      selectedNode: observable,
      selectNode: action,
    })
  }

  add(node: Node) {
    node.setDiagram(this)
    node.on('select', () => {
      this.selectNode(node)
      this.emitter.emit('select', node)
    })
    this.nodes.push(node)
  }

  connect(from: Node, to: Node) {
    const edge = new Edge({
      from,
      to,
      label: '',
      labelPositioning: new Coordinates([0, 0]),
      steps: [],
    })

    this.edges.push(edge)
    from.addOutgoingEdge(edge)
    to.addIncomingEdge(edge)
  }

  Context = ({ children }: { children: ReactNode }) => (
    <DiagramContext.Provider value={this}>{children}</DiagramContext.Provider>
  )

  on = this.emitter.on.bind(this.emitter)

  selectNode(node: Node) {
    if (node !== this.selectedNode) {
      this.selectedNode?.unselect()
      this.selectedNode = node
    }
  }

  unselectAll() {
    this.selectedNode?.unselect()
    this.selectedNode = null
  }

  public static use = () => useContext(DiagramContext)!
}
