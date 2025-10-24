import { action, makeAutoObservable, makeObservable, observable } from 'mobx';
import type { TEdgeState } from './types';
import { createContext, ReactNode, useContext } from 'react';
import { Canvas } from './Canvas';
import type { Node } from './Node';
import { EventEmitter } from '../util/EventEmitter';
import { NodesConnector } from './NodesConnector';
import { Coordinates } from './Coordinates';
import { Measurer } from './tools/Measurer';
import { Selector } from './tools/Selector';
import { Dragger } from './tools/Dragger';

export class Edge {
  constructor(public state: TEdgeState) {
    makeAutoObservable(this);
  }

  public get from() {
    return this.state.from;
  }

  public get to() {
    return this.state.to;
  }
}

const DiagramContext = createContext<Diagram | null>(null);

export class Diagram {
  protected _edges: Edge[] = [];
  protected _nodes = new Map<string, Node>();
  protected _selectedNodes = new Set<Node>();
  protected emitter = new EventEmitter<{
    select: Node;
  }>();
  protected _enableEvents = true;

  protected disableEventDependantClasses() {
    this.measurer.disable();
    this.selector.disableSelectionMode();
  }
  public enableEvents() {
    this._enableEvents = true;
    this.disableEventDependantClasses();
  }
  public disableEvents() {
    this._enableEvents = false;
    this.disableEventDependantClasses();
  }

  public get eventsEnabled() {
    return this._enableEvents;
  }

  connector = new NodesConnector(this);
  canvas = new Canvas(this);
  dragger = new Dragger(this);
  measurer = new Measurer(this);
  selector = new Selector(this);

  constructor() {
    makeObservable<
      Diagram,
      '_enableEvents' | '_selectedNodes' | '_edges' | '_nodes'
    >(this, {
      _edges: observable,
      _nodes: observable,
      _selectedNodes: observable,
      selectNode: action,
      _enableEvents: observable,
      enableEvents: action,
      disableEvents: action,
    });
  }

  get edges(): Readonly<Edge[]> {
    return [...this._edges.values()];
  }

  get nodes(): Readonly<Node[]> {
    return [...this._nodes.values()];
  }

  add(node: Node) {
    node.setDiagram(this);
    node.on('select', () => {
      this.selectNode(node);
      this.emitter.emit('select', node);
    });
    this._nodes.set(node.id, node);
  }

  connect(from: Node, to: Node) {
    const edge = new Edge({
      from,
      to,
      label: '',
      labelPositioning: new Coordinates([0, 0]),
      steps: [],
    });

    this._edges.push(edge);
    from.addOutgoingEdge(edge);
    to.addIncomingEdge(edge);
  }

  Context = ({ children }: { children: ReactNode }) => (
    <DiagramContext.Provider value={this}>{children}</DiagramContext.Provider>
  );

  getNodeById(id: string) {
    return this._nodes.get(id);
  }

  on = this.emitter.on.bind(this.emitter);

  get selectedNode(): Node | null {
    if (this._selectedNodes.size === 1) {
      return this._selectedNodes.values().next().value!;
    }

    return null;
  }

  get selectedNodes() {
    return [...this._selectedNodes];
  }

  isNodeSelected(node: Node) {
    return !![...this._selectedNodes.values()].find((c) => c === node);
  }

  selectNode(node: Node, unselectOthers = true, force = false) {
    if (node !== this.selectedNode && (this.eventsEnabled || force)) {
      if (unselectOthers) {
        this._selectedNodes.clear();
      }
      this._selectedNodes.add(node);
    }
  }

  toggleNodeSelection(node: Node) {
    if (this._selectedNodes.has(node)) {
      this._selectedNodes.delete(node);
    } else {
      this._selectedNodes.add(node);
    }
  }

  unselectNode(node: Node) {
    this._selectedNodes.delete(node);
  }

  unselectAll() {
    this._selectedNodes.clear();
  }

  public static use = () => useContext(DiagramContext)!;
}
