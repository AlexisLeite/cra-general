import { action, makeObservable, observable } from 'mobx'
import type { TNodeState } from './types'
import { Dimensions } from './Dimensions'
import { Coordinates } from './Coordinates'
import type { Diagram, Edge } from './Diagram'
import { EventEmitter } from '../util'

export class Node {
  protected diagram: Diagram | null = null
  protected emitter = new EventEmitter<{
    select: Node
  }>()
  incomingEdges: Edge[] = []
  outgoingEdges: Edge[] = []
  public ref: HTMLElement | null = null
  public state: TNodeState

  constructor(
    state: Pick<TNodeState, 'Renderer' | 'id' | 'label'> & Partial<TNodeState>,
  ) {
    this.state = {
      ...state,
      box: state.box ?? new Dimensions([100, 80]),
    }

    makeObservable<Node, 'handleMouseDown'>(this, {
      handleMouseDown: action,
      incomingEdges: observable,
      outgoingEdges: observable,
      state: observable,
    })
  }

  canConnect(from: Node): boolean {
    return !from.outgoingEdges.find((c) => c.to === this)
  }

  addIncomingEdge(edge: Edge) {
    this.incomingEdges.push(edge)
  }

  addOutgoingEdge(edge: Edge) {
    this.outgoingEdges.push(edge)
  }

  public get box() {
    return this.state.box.copy()
  }
  public get coordinates() {
    return this.box.coordinates
  }
  public get id() {
    return this.state.id
  }

  protected dragEventMouseStartPosition: Coordinates | null = null
  protected dragEventStartPosition: Coordinates | null = null

  protected handleMouseDown(ev: MouseEvent) {
    ev.stopPropagation()

    this.dragEventStartPosition = this.state!.box.coordinates.copy()
    this.dragEventMouseStartPosition = new Coordinates([ev.clientX, ev.clientY])

    document.addEventListener('mousemove', this.handleMouseMove.bind(this))
    document.addEventListener('mouseup', this.handleMouseUp.bind(this))

    this.emitter.emit('select', this)
    if (this.state.selectable !== false) {
      this.state.selected = true
    }
  }

  protected handleMouseMove(ev: MouseEvent) {
    if (this.dragEventStartPosition) {
      this.state.box.assignCoordinates(
        this.dragEventStartPosition!.copy().substract(
          this.dragEventMouseStartPosition!.copy()
            .substract([ev.clientX, ev.clientY])
            .multiply(1 / this.diagram!.panzoom.scale),
        ),
      )
    }
  }

  protected handleMouseUp() {
    this.dragEventStartPosition = null
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this))
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this))
  }

  on = this.emitter.on.bind(this.emitter)

  setDiagram(d: Diagram) {
    this.diagram = d
  }

  unselect() {
    this.state.selected = false
  }

  protected unsubscribeListeners = () => {}
  useRef(el: HTMLElement | null) {
    this.unsubscribeListeners()
    this.ref = el

    if (el instanceof HTMLElement) {
      const fn = this.handleMouseDown.bind(this)
      el.addEventListener('mousedown', fn)
      this.unsubscribeListeners = () => {
        el.removeEventListener('mousedown', fn)
      }
    }
  }
}
