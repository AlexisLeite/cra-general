import { findBestPathBetweenNodes } from '../../util/paths/findBestPathBetweenNodes';
import type { TGatewayState } from '../types';
import type { Edge } from './Edge';
import type { Node } from './Node';
import { Diagram } from '../Diagram';
import { Coordinates } from '../primitives/Coordinates';
import { action, makeObservable, observable } from 'mobx';
import { Element } from './Element';

export class Gateway extends Element {
  state: TGatewayState;

  constructor(
    public parent: Node<any>,
    state: Pick<
      TGatewayState,
      'maxIncomingConnections' | 'maxOutgoingConnections' | 'orientation' | 'id'
    > &
      Partial<TGatewayState>,
  ) {
    super(parent);

    this.state = {
      stroke: 'transparent',
      strokeWidth: 10,
      radius: 5,
      incomingEdges: [],
      outgoingEdges: [],
      position: new Coordinates(),
      ...state,
    };

    makeObservable(this, {
      addIncomingEdge: action,
      addOutgoingEdge: action,
      state: observable,
    });
  }

  canConnect(from: Gateway): boolean {
    return (
      (this.state.maxIncomingConnections === undefined ||
        this.state.maxIncomingConnections > this.state.incomingEdges.length) &&
      !this.state.incomingEdges.find((c) => c.from === from)
    );
  }

  addIncomingEdge(edge: Edge) {
    if (!this.state.incomingEdges.find((c) => c.id === edge.id)) {
      this.state.incomingEdges.push(edge);
    }
  }

  addOutgoingEdge(edge: Edge) {
    if (!this.state.outgoingEdges.find((c) => c.id === edge.id)) {
      this.state.outgoingEdges.push(edge);
      this.updateEdges();
    }
  }

  removeIncomingEdge(edge: Edge) {
    this.state.incomingEdges = this.state.incomingEdges.filter(
      (c) => c.id !== edge.id,
    );
  }

  removeOutgoingEdge(edge: Edge) {
    this.state.outgoingEdges = this.state.outgoingEdges.filter(
      (c) => c.id !== edge.id,
    );
  }

  get coordinates() {
    return this.state.position
      .copy()
      .multiply(this.parent.box.size)
      .sum(this.parent.coordinates);
  }

  get fill() {
    return this.state.fill;
  }

  get diagram() {
    return this.parent.diagram!;
  }

  get incomingEdges() {
    return [...this.state.incomingEdges];
  }

  get outgoingEdges() {
    return [...this.state.outgoingEdges];
  }

  get radius() {
    return this.state.radius;
  }

  get relativePosition() {
    return this.state.position.copy();
  }

  get stroke() {
    return this.state.stroke;
  }

  get strokeWidth() {
    return this.state.strokeWidth;
  }

  get id() {
    return this.state.id;
  }

  get orientation() {
    return this.state.orientation;
  }

  async updateEdges() {
    for await (const edge of this.state.incomingEdges) {
      edge.setSteps(
        await findBestPathBetweenNodes(this.diagram!, edge.from, edge.to),
      );
    }
    for await (const edge of this.state.outgoingEdges) {
      edge.setSteps(
        await findBestPathBetweenNodes(this.diagram!, edge.from, edge.to),
      );
    }
  }

  get remainingSlots() {
    return this.state.maxOutgoingConnections - this.state.outgoingEdges.length;
  }

  deserialize(c: ReturnType<(typeof this)['serialize']>) {
    this.state.fill = c.fill;
    this.state.id = c.id;
    this.state.orientation = c.orientation;
    this.state.radius = c.radius;
    this.state.stroke = c.stroke;
    this.state.strokeWidth = c.strokeWidth;

    this.state.position.assign(c.coordinates);

    c.outEdges.forEach((edgeState) => {
      const edge = new (Diagram.getClass(edgeState.class))(this, {
        from: this,
      }) as Edge;
      edge.deserialize(edgeState);
    });
  }

  serialize() {
    const {
      fill,
      id,
      orientation,
      radius,
      stroke,
      strokeWidth,
      state: {
        position: { raw: coordinates },
      },
    } = this;

    const outEdges = this.outgoingEdges.map((e) => {
      return e.serialize();
    });

    return {
      coordinates,
      fill,
      id,
      orientation,
      radius,
      stroke,
      strokeWidth,
      outEdges,
      class: this.constructor.name,
    };
  }
}
