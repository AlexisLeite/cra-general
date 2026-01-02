import { findBestPathBetweenNodes } from '../../util/paths/findBestPathBetweenNodes';
import type { TGatewayState } from '../types';
import type { Edge } from './Edge';
import type { Node } from './Node';
import { Diagram } from '../Diagram';
import { Coordinates } from '../primitives/Coordinates';
import { action, makeObservable, observable, reaction, toJS } from 'mobx';
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
      allowDisplace: true,
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
      removeIncomingEdge: action,
      removeOutgoingEdge: action,
    });

    reaction(
      () => this.state.incomingEdges,
      (e) => {
        console.log(toJS(e));
      },
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

  canConnect(from: Gateway): boolean {
    return (
      (this.state.maxIncomingConnections === undefined ||
        this.state.maxIncomingConnections > this.state.incomingEdges.length) &&
      !this.state.incomingEdges.find((c) => c.from === from)
    );
  }

  connectionDisplacement(c: Coordinates) {
    if (this.direction === 'horizontal') {
      if (Math.abs(c.y - this.coordinates.y) > 10) {
        return new Coordinates([0, c.y - this.coordinates.y]);
      }
    }
    if (this.direction === 'vertical') {
      if (Math.abs(c.x - this.coordinates.x) > 10) {
        return new Coordinates([c.x - this.coordinates.x, 0]);
      }
    }

    return new Coordinates([0, 0]);
  }

  connectionDistance(c: Coordinates) {
    if (this.direction === 'vertical') {
      const disalignment = Math.abs(this.coordinates.y - c.y);

      if (disalignment < 20) {
        return Math.abs(this.coordinates.x - c.x) + disalignment ** 5;
      }

      return Infinity;
    }

    const disalignment = Math.abs(this.coordinates.x - c.x);

    if (disalignment < 20) {
      return Math.abs(this.coordinates.y - c.y) + disalignment ** 5;
    }
    return Infinity;
  }

  removeIncomingEdge(edge: Edge) {
    for (let i = 0; i < this.state.incomingEdges.length; i++) {
      if (this.state.incomingEdges[i].id === edge.id) {
        this.state.incomingEdges.splice(i, 1);
        break;
      }
    }
  }

  removeOutgoingEdge(edge: Edge) {
    for (let i = 0; i < this.state.outgoingEdges.length; i++) {
      if (this.state.outgoingEdges[i].id === edge.id) {
        this.state.outgoingEdges.splice(i, 1);
        break;
      }
    }
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

  get direction() {
    return ['down', 'up'].includes(this.state.orientation)
      ? 'vertical'
      : 'horizontal';
  }

  get orientation() {
    return this.state.orientation;
  }

  async updateEdges() {
    for await (const edge of this.state.incomingEdges) {
      edge.setSteps(
        await findBestPathBetweenNodes(
          this.diagram!,
          edge.from,
          edge.to,
          edge.state.displacementStart,
          edge.state.displacementEnd,
        ),
      );
    }
    for await (const edge of this.state.outgoingEdges) {
      edge.setSteps(
        await findBestPathBetweenNodes(
          this.diagram!,
          edge.from,
          edge.to,
          edge.state.displacementStart,
          edge.state.displacementEnd,
        ),
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

      if (this.diagram.getNodeById(edgeState.toParentId)) {
        edge.deserialize(edgeState);
      }
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
