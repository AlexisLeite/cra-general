import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { createContext, ReactNode, useContext } from 'react';
import { Canvas } from './Canvas';
import { Node } from './elements/Node';
import { EventEmitter } from '../util/EventEmitter';
import { NodesConnector } from './tools/NodesConnector';
import { Coordinates } from './primitives/Coordinates';
import { Measurer } from './tools/Measurer';
import { Selector } from './tools/Selector';
import { Dragger } from './tools/Dragger';
import { Hotkeys } from './tools/Hotkeys';
import { Edge } from './elements/Edge';
import { Gateway } from './elements/Gateway';
import { Creator } from './tools/Creator';
import { TextNode } from './elements/TextNode';

const DiagramContext = createContext<Diagram | null>(null);

export class Diagram {
  private static knownClasses = new Map<string, any>();
  static getClass(name: string) {
    return this.knownClasses.get(name);
  }
  static registerClass(clazz: any) {
    this.knownClasses.set(clazz.name, clazz);
  }

  protected _nodes = new Map<string, Node>();
  protected _selectedNodes = new Set<Node>();
  protected emitter = new EventEmitter<{
    select: Node;
  }>();
  protected _enableEvents = true;

  get eventsEnabled() {
    return this._enableEvents;
  }

  protected _gridSize = 50;
  protected _showGrid = true;
  protected _snapToGrid = true;

  canvas = new Canvas(this);
  creator = new Creator(this);
  connector = new NodesConnector(this);
  dragger = new Dragger(this);
  hotkeys = new Hotkeys(this);
  measurer = new Measurer(this);
  selector = new Selector(this);

  constructor() {
    Diagram.registerClass(Node);
    Diagram.registerClass(Edge);
    Diagram.registerClass(Gateway);
    Diagram.registerClass(TextNode);

    makeObservable<
      Diagram,
      | '_enableEvents'
      | '_selectedNodes'
      | '_nodes'
      | '_showGrid'
      | '_snapToGrid'
      | '_gridSize'
    >(this, {
      edges: computed,
      _nodes: observable,
      _selectedNodes: observable,
      selectNode: action,
      _enableEvents: observable,
      enableEvents: action,
      disableEvents: action,
      _showGrid: observable,
      _snapToGrid: observable,
      _gridSize: observable,
    });
  }

  get edges(): Readonly<Edge[]> {
    const edges = [...this._nodes.values()].reduce<Edge[]>(
      (acc, cur) => [
        ...acc,
        ...[...cur.gateways.values()].reduce<Edge[]>(
          (acc2, cur2) => [...acc2, ...cur2.outgoingEdges],
          [],
        ),
      ],
      [],
    );
    return edges;
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

    return node;
  }

  connect(from: Gateway, to: Gateway) {
    const edge = new Edge({
      from,
      to,
      label: '',
      labelPositioning: new Coordinates([0, 0]),
      steps: [],
    });

    from.addOutgoingEdge(edge);
    to.addIncomingEdge(edge);

    return edge;
  }

  Context = ({ children }: { children: ReactNode }) => (
    <DiagramContext.Provider value={this}>{children}</DiagramContext.Provider>
  );

  protected disableEventDependantClasses() {
    this.measurer.disable();
    this.selector.disableSelectionMode();
  }

  enableEvents() {
    this._enableEvents = true;
    this.disableEventDependantClasses();
  }

  disableEvents() {
    this._enableEvents = false;
    this.disableEventDependantClasses();
  }
  getNodeById(id: string) {
    return this._nodes.get(id);
  }

  get gridSize() {
    return this._gridSize;
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

  get showGrid() {
    return this._showGrid;
  }
  get snapToGrid() {
    return this._snapToGrid;
  }

  toggleGrid() {
    this._showGrid = !this._showGrid;
  }

  toggleNodeSelection(node: Node) {
    if (this._selectedNodes.has(node)) {
      this._selectedNodes.delete(node);
    } else {
      this._selectedNodes.add(node);
    }
  }

  toggleSnapToGrid() {
    this._snapToGrid = !this._snapToGrid;
  }

  unselectNode(node: Node) {
    this._selectedNodes.delete(node);
  }

  unselectAll() {
    this._selectedNodes.clear();
  }

  public static use = () => useContext(DiagramContext)!;

  export() {
    return JSON.stringify(this.serialize());
  }
  serialize() {
    return {
      position: {
        x: this.canvas.displacement.x,
        y: this.canvas.displacement.y,
        scale: this.canvas.scale,
      },
      nodes: this.nodes.map((c) => {
        return c.serialize();
      }),
    };
  }

  import(w: string) {
    runInAction(() => {
      const state = JSON.parse(w) as ReturnType<(typeof this)['serialize']>;
      this.canvas.setScale(state.position.scale);
      this.canvas.setDisplacement(
        new Coordinates([state.position.x, state.position.y]),
      );

      this._nodes.clear();
      this._selectedNodes.clear();

      state.nodes.forEach((nodeState) => {
        const node = new (Diagram.getClass(nodeState.class))({
          id: nodeState.id,
        }) as Node;
        this.add(node);
      });
      state.nodes.forEach((nodeState) => {
        this.getNodeById(nodeState.id)!.deserialize(nodeState);
      });
    });
  }
}
