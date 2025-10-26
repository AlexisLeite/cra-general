import { findBestPathBetweenNodes } from '../tools/paths/findBestPathBetweenNodes';
import type { TGatewayState } from '../types';
import type { Edge } from './Edge';
import type { Node } from './Node';
import { Diagram } from '../Diagram';
import { Coordinates } from '../primitives/Coordinates';

export class Gateway {
  protected state: TGatewayState;

  constructor(
    public parent: Node<any>,
    state: Pick<
      TGatewayState,
      'maxIncomingConnections' | 'maxOutgoingConnections' | 'orientation' | 'id'
    > &
      Partial<TGatewayState>,
  ) {
    this.state = {
      fill: 'green',
      stroke: 'transparent',
      strokeWidth: 10,
      radius: 5,
      incomingEdges: [],
      outgoingEdges: [],
      position: new Coordinates(),
      ...state,
    };
  }

  canConnect(from: Gateway): boolean {
    return !this.state.incomingEdges.find((c) => c.from === from);
  }

  addIncomingEdge(edge: Edge) {
    this.state.incomingEdges.push(edge);
  }

  addOutgoingEdge(edge: Edge) {
    this.updateEdges();
    this.state.outgoingEdges.push(edge);
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
      const edge = new (Diagram.getClass(edgeState.class))({
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
