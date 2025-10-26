import { computed, makeObservable, observable } from 'mobx';
import type { TNodeState } from '../types';
import { Dimensions } from '../primitives/Dimensions';
import { Coordinates } from '../primitives/Coordinates';
import type { Diagram } from '../Diagram';
import { EventEmitter } from '../../util/EventEmitter';
import { Edge } from '../elements/Edge';
import { findBestPathBetweenNodes } from '../tools/paths/findBestPathBetweenNodes';

export class Node {
  protected diagram: Diagram | null = null;
  protected emitter = new EventEmitter<{
    select: Node;
  }>();
  incomingEdges: Edge[] = [];
  outgoingEdges: Edge[] = [];
  public ref: SVGElement | null = null;
  public state: TNodeState;

  public get selected() {
    return this.diagram?.isNodeSelected(this);
  }

  constructor(
    state: Pick<TNodeState, 'Renderer' | 'id' | 'label'> & Partial<TNodeState>,
  ) {
    this.state = {
      ...state,
      box: state.box ?? new Dimensions([100, 80]),
    };

    makeObservable<Node>(this, {
      incomingEdges: observable,
      outgoingEdges: observable,
      state: observable,
      selected: computed,
    });
  }

  canConnect(from: Node): boolean {
    return !from.outgoingEdges.find((c) => c.to === this);
  }

  addIncomingEdge(edge: Edge) {
    this.incomingEdges.push(edge);
  }

  addOutgoingEdge(edge: Edge) {
    this.outgoingEdges.push(edge);
    this.updateEdges();
  }

  public get box() {
    return this.state.box.copy();
  }
  public get coordinates() {
    return this.box.coordinates;
  }
  public get id() {
    return this.state.id;
  }

  protected dragEventMouseStartPosition: Coordinates | null = null;
  protected dragEventStartPosition: Coordinates | null = null;

  on = this.emitter.on.bind(this.emitter);

  setDiagram(d: Diagram) {
    this.diagram = d;
  }

  setPosition(c: Coordinates) {
    const previousBox = this.state.box.copy();

    this.state.box
      .assignCoordinates(c)
      .bound(new Dimensions([0, 0, ...this.diagram!.canvas.size.raw]));

    if (this.diagram?.snapToGrid) {
      this.state.box.x =
        Math.round(this.state.box.x / this.diagram.gridSize) *
        this.diagram.gridSize;
      this.state.box.y =
        Math.round(this.state.box.y / this.diagram.gridSize) *
        this.diagram.gridSize;

      if (previousBox.substract(this.state.box).norm) {
        this.updateEdges();
      }
    }
  }

  protected async updateEdges() {
    for await (const edge of this.incomingEdges) {
      edge.setSteps(
        await findBestPathBetweenNodes(this.diagram!, edge.from, edge.to),
      );
    }
    for await (const edge of this.outgoingEdges) {
      edge.setSteps(
        await findBestPathBetweenNodes(this.diagram!, edge.from, edge.to),
      );
    }
  }

  useRef(el: SVGElement | null) {
    this.ref = el;
  }
}
