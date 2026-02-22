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
import { Coordinates } from './primitives/Coordinates';
import { Edge } from './elements/Edge';
import { Gateway } from './elements/Gateway';
import { TextNode } from './elements/TextNode';
import { Element, type Class } from './elements/Element';
import { Priorities } from './extensions/Priorities';
import { Rules } from './extensions/Rules';
import type { DiagramExtension } from './extensions/DiagramExtension';
import { NodesAligner } from './extensions/NodesAligner';
import { Creator } from './extensions/Creator';
import { EdgesDragger } from './extensions/EdgesDragger';
import { Hotkeys } from './extensions/Hotkeys';
import { Measurer } from './extensions/Measurer';
import { Selector } from './extensions/Selector';
import { NodesConnector } from './extensions/NodesConnector';
import {
  DDeleteEdgeEvent,
  DDeleteNodeEvent,
  DResetGraphEvent,
} from './elements/Events';
import { GridSnap } from './extensions/GridSnap';
import { StraightDrag } from './extensions/StraightDrag';
import { DistancesBalancer } from './extensions/DistancesBalancer';
import { NodesResizer } from './extensions/NodesResizer';
import { History } from './extensions/History';
import { Dragger } from './extensions/Dragger';
import { PathFindingRenderer } from './extensions/PathFindingRenderer';
import { Mouse } from '../util/Mouse';
import { getIdForNode } from '../util/getIdForNode';

const DiagramContext = createContext<Diagram | null>(null);

const DefaultExtensions = Object.freeze({
  Creator,
  DistancesBalancer,
  Dragger,
  EdgesDragger,
  GridSnap,
  History,
  Hotkeys,
  Measurer,
  NodesAligner,
  NodesConnector,
  NodesResizer,
  PathFindingRenderer,
  Selector,
  StraightDrag,
});

export type TDefaultExensions = {
  [key in keyof typeof DefaultExtensions]: boolean;
};

export type TDiagramSettings = Partial<{
  extensions: TDefaultExensions;
}>;

export class Diagram extends Element {
  public readonly priorities = new Priorities();
  rules = new Rules(this);
  private focusContentTimer: ReturnType<typeof setTimeout> | null = null;
  private knownClasses = new Map<string, any>();

  getClass(name: string) {
    return this.knownClasses.get(name);
  }
  registerClass(clazz: any, className = clazz.name) {
    this.knownClasses.set(className, clazz);
  }

  edgeClass: typeof Edge = Edge;
  public setDefaultEdge(clazz: typeof Edge) {
    this.edgeClass = clazz;
  }

  protected _extensions = new Map<Class<DiagramExtension>, DiagramExtension>();
  protected _nodes = new Map<string, Node>();
  protected _edges = new Map<string, Edge>();

  canvas = new Canvas(this);

  constructor(settings?: TDiagramSettings) {
    super(null);

    this.registerClass(Node);
    this.registerClass(Edge);
    this.registerClass(Gateway);
    this.registerClass(TextNode);

    Object.entries(DefaultExtensions).forEach(([key, clazz]) => {
      if (settings?.extensions?.[key as keyof TDefaultExensions] !== false) {
        this.registerExtension(clazz);
      }
    });

    makeObservable<Diagram, '_edges' | '_nodes'>(this, {
      edges: computed,
      _edges: observable,
      _nodes: observable,
      toggleGrid: action,
    });
  }

  get edges(): Readonly<Edge[]> {
    return [...this._edges.values()];
  }

  get nodes(): Readonly<Node[]> {
    return [...this._nodes.values()];
  }

  private getUniqueNodeId(baseId: string) {
    if (!this._nodes.has(baseId)) {
      return baseId;
    }

    let i = 1;
    let candidate = `${baseId}-${i}`;
    while (this._nodes.has(candidate)) {
      i++;
      candidate = `${baseId}-${i}`;
    }

    return candidate;
  }

  add<T extends Node>(node: T): T {
    runInAction(() => {
      const uniqueId = this.getUniqueNodeId(node.id);
      if (uniqueId !== node.id) {
        node.setState('id', uniqueId);
      }
      node.setDiagram(this);
      this._nodes.set(node.id, node);
    });

    return node;
  }

  addEdge(edge: Edge) {
    edge.from.addOutgoingEdge(edge);
    edge.to.addIncomingEdge(edge);
  }

  connect(
    from: Gateway,
    to: Gateway,
    options?: {
      fromDisplacement?: Coordinates;
      toDisplacement?: Coordinates;
    },
  ) {
    const edge = this.connectWithEdge(
      from,
      to,
      new this.edgeClass(this, {
        hover: false,
        dragging: false,
        selected: false,
        from,
        to,
        label: '',
        labelPositioning: new Coordinates([0, 0]),
        steps: [],
      }),
    );

    edge.state.displacementStart = options?.fromDisplacement;
    edge.state.displacementEnd = options?.toDisplacement;

    return edge;
  }

  connectWithEdge(from: Gateway, to: Gateway, existentEdge: Edge) {
    const edge = existentEdge;

    from.addOutgoingEdge(edge);
    to.addIncomingEdge(edge);

    this._edges.set(edge.id, edge);

    return edge;
  }

  delete(node: Node<any>) {
    if (!this.emit(new DDeleteNodeEvent(this, node)).cancelled) {
      runInAction(() => {
        node.gateways.forEach((c) => {
          c.incomingEdges.forEach(this.disconnect.bind(this));
          c.outgoingEdges.forEach(this.disconnect.bind(this));
        });
        this._nodes.delete(node.id);
        node.parent = null;
      });
    }
  }

  disconnect(edge: Edge) {
    if (!this.emit(new DDeleteEdgeEvent(this, edge)).cancelled) {
      runInAction(() => {
        edge.from.removeOutgoingEdge(edge);
        edge.to.removeIncomingEdge(edge);
        this._edges.delete(edge.id);
      });
    }
  }

  Context = ({ children }: { children: ReactNode }) => (
    <DiagramContext.Provider value={this}>{children}</DiagramContext.Provider>
  );

  getEdgeById(id: string) {
    return this._edges.get(id);
  }

  getNodeById(id: string) {
    return this._nodes.get(id);
  }

  get showGrid() {
    return this.rules.toggleGrid;
  }

  getExtension<T extends DiagramExtension>(e: Class<T>): T {
    return this._extensions.get(e) as T;
  }

  registerExtension(e: Class<DiagramExtension>) {
    const instance = new e(this);
    instance.init();
    this._extensions.set(e, instance);
  }

  toggleGrid() {
    this.rules.toggleGrid = !this.rules.toggleGrid;
  }

  public static use = () => useContext(DiagramContext)!;

  export() {
    return JSON.stringify(this.serialize());
  }

  async reset() {
    let canReset = this._nodes.size === 0;

    if (!canReset) {
      let resolver: (() => Promise<boolean>) | null = null;
      const ev = this.emit(
        new DResetGraphEvent(this, (r) => {
          resolver = r;
        }),
      );

      canReset = (await resolver!()) && !ev.cancelled;
    }

    if (canReset) {
      for (const node of this._nodes.values()) {
        this.delete(node);
      }
      return true;
    }

    return false;
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
      const storedPosition = state.position;
      const hasStoredPosition =
        !!storedPosition &&
        Number.isFinite(storedPosition.x) &&
        Number.isFinite(storedPosition.y) &&
        Number.isFinite(storedPosition.scale);

      if (hasStoredPosition) {
        this.canvas.setScale(storedPosition.scale);
        this.canvas.setDisplacement(
          new Coordinates([storedPosition.x, storedPosition.y]),
        );
      }

      if (state.nodes) {
        const idMap = new Map<string, string>();

        state.nodes.forEach((nodeState) => {
          const nodeClass = this.getClass(nodeState.class);
          if (!nodeClass) {
            throw new Error(
              `Unable to import node: unknown class '${nodeState.class}'.`,
            );
          }

          const node = new nodeClass(this, {
            id: nodeState.id,
          }) as Node;
          const addedNode = this.add(node);
          idMap.set(nodeState.id, addedNode.id);
        });
        state.nodes.forEach((nodeState) => {
          const remappedNodeId = idMap.get(nodeState.id)!;
          this.getNodeById(remappedNodeId)!.deserialize({
            ...nodeState,
            id: remappedNodeId,
            gateways: nodeState.gateways.map((gatewayState) => ({
              ...gatewayState,
              outEdges: gatewayState.outEdges.map((edgeState) => ({
                ...edgeState,
                toParentId: idMap.get(edgeState.toParentId) || edgeState.toParentId,
              })),
            })),
          });
        });
      }

      if (!hasStoredPosition) {
        this.focusContentInViewportWithRetry();
      }
    });
  }

  paste(w: string) {
    runInAction(() => {
      const state = JSON.parse(w) as ReturnType<(typeof this)['serialize']>;

      if (state.position) {
        this.canvas.setScale(state.position.scale);
        this.canvas.setDisplacement(
          new Coordinates([state.position.x, state.position.y]),
        );
      }

      if (state.nodes?.length) {
        const idMap = new Map<string, string>();
        const restrict: string[] = [];

        state.nodes.forEach((nodeState) => {
          const newId = getIdForNode(this, 'node', restrict);
          idMap.set(nodeState.id, newId);
          restrict.push(newId);
        });

        let nearestToOrigin: Coordinates = new Coordinates([
          Infinity,
          Infinity,
        ]);

        state.nodes.forEach((nodeState) => {
          const current = new Coordinates([nodeState.box[0], nodeState.box[1]]);
          if (current.norm < nearestToOrigin.norm) {
            nearestToOrigin = current;
          }
        });

        const mouse = this.canvas.inverseFit(Mouse.getInstance().coordinates);
        const diff = mouse.substract(nearestToOrigin);

        state.nodes.forEach((nodeState) => {
          const nodeClass = this.getClass(nodeState.class);
          if (!nodeClass) {
            throw new Error(
              `Unable to paste node: unknown class '${nodeState.class}'.`,
            );
          }

          const node = new nodeClass(this, {
            id: idMap.get(nodeState.id)!,
          }) as Node;
          this.add(node);
        });
        state.nodes.forEach((nodeState) => {
          const remappedNodeId = idMap.get(nodeState.id)!;
          this.getNodeById(remappedNodeId)!.deserialize({
            ...nodeState,
            id: remappedNodeId,
            gateways: nodeState.gateways.map((gatewayState) => ({
              ...gatewayState,
              outEdges: gatewayState.outEdges.map((edgeState) => ({
                ...edgeState,
                toParentId: idMap.get(edgeState.toParentId) || edgeState.toParentId,
              })),
            })),
            box: [
              nodeState.box[0] + diff.x,
              nodeState.box[1] + diff.y,
              nodeState.box[2],
              nodeState.box[3],
            ],
          });
        });
      }
    });
  }

  focusContentInViewport(padding = 80) {
    if (!this.nodes.length) {
      return false;
    }

    const frame = this.canvas.frameDimensions;
    if (frame.width <= 0 || frame.height <= 0) {
      return false;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of this.nodes) {
      const box = node.box;
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    }

    if (
      !Number.isFinite(minX) ||
      !Number.isFinite(minY) ||
      !Number.isFinite(maxX) ||
      !Number.isFinite(maxY)
    ) {
      return false;
    }

    const contentWidth = Math.max(1, maxX - minX + padding * 2);
    const contentHeight = Math.max(1, maxY - minY + padding * 2);
    const targetScale = Math.max(
      0.3,
      Math.min(3, Math.min(frame.width / contentWidth, frame.height / contentHeight)),
    );

    this.canvas.setScale(targetScale);
    this.canvas.centerOnPoint(
      new Coordinates([(minX + maxX) / 2, (minY + maxY) / 2]),
    );

    return true;
  }

  focusContentInViewportWithRetry(attempts = 8, delayMs = 32) {
    if (this.focusContentInViewport()) {
      return;
    }

    if (attempts <= 0) {
      return;
    }

    if (this.focusContentTimer) {
      clearTimeout(this.focusContentTimer);
    }

    this.focusContentTimer = setTimeout(() => {
      this.focusContentInViewportWithRetry(attempts - 1, delayMs);
    }, delayMs);
  }
}
