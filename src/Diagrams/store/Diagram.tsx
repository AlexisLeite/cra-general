import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { createContext, type ReactNode, useContext } from 'react';
import { Canvas } from './Canvas';
import { Node } from './elements/Node';
import { NodesConnector } from './tools/NodesConnector';
import { Coordinates } from './primitives/Coordinates';
import { Measurer } from './tools/Measurer';
import { Selector } from './tools/Selector';
import { Dragger } from './tools/Dragger';
import { Hotkeys } from './tools/Hotkeys';
import { EdgesDragger } from './tools/EdgesDragger';
import { Edge } from './elements/Edge';
import { Gateway } from './elements/Gateway';
import { Creator } from './tools/Creator';
import { TextNode } from './elements/TextNode';
import { Element } from './elements/Element';
import { Priorities } from './tools/Priorities';
import { Rules } from './tools/Rules';
import KDBush from 'kdbush';

const DiagramContext = createContext<Diagram | null>(null);

export class Diagram extends Element {
  public readonly priorities = new Priorities();
  rules = new Rules(this);

  private static knownClasses = new Map<string, any>();
  static getClass(name: string) {
    return this.knownClasses.get(name);
  }
  static registerClass(clazz: any) {
    this.knownClasses.set(clazz.name, clazz);
  }

  edgeClass: typeof Edge = Edge;
  public setDefaultEdge(clazz: typeof Edge) {
    this.edgeClass = clazz;
  }

  protected _nodes = new Map<string, Node>();
  protected _nodesIndex = new KDBush(1000);

  canvas = new Canvas(this);
  creator = new Creator(this);
  connector = new NodesConnector(this);
  dragger = new Dragger(this);
  edgesDragger = new EdgesDragger(this);
  hotkeys = new Hotkeys(this);
  measurer = new Measurer(this);
  selector = new Selector(this);

  constructor() {
    super(null);

    Diagram.registerClass(Node);
    Diagram.registerClass(Edge);
    Diagram.registerClass(Gateway);
    Diagram.registerClass(TextNode);

    makeObservable<Diagram, '_nodes'>(this, {
      edges: computed,
      _nodes: observable,
      toggleGrid: action,
      toggleSnapToGrid: action,
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

  add<T extends Node>(node: T): T {
    node.parent = this;
    node.setDiagram(this);

    this._nodes.set(node.id, node);

    return node;
  }

  addEdge(edge: Edge) {
    edge.from.addOutgoingEdge(edge);
    edge.to.addIncomingEdge(edge);
  }

  connect(from: Gateway, to: Gateway) {
    const edge = new this.edgeClass(this, {
      hover: false,
      dragging: false,
      selected: false,
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

  getNodeById(id: string) {
    return this._nodes.get(id);
  }

  get gridSize() {
    return this.rules.gridSize;
  }

  get showGrid() {
    return this.rules.toggleGrid;
  }
  get snapToGrid() {
    return this.rules.snapToGrid;
  }

  toggleGrid() {
    this.rules.toggleGrid = !this.rules.toggleGrid;
  }

  toggleSnapToGrid() {
    this.rules.snapToGrid = !this.rules.snapToGrid;
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

      state.nodes.forEach((nodeState) => {
        const node = new (Diagram.getClass(nodeState.class))(this, {
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
