import { action, computed, makeObservable, observable } from 'mobx';
import type { TNodeState } from '../types';
import { Dimensions } from '../primitives/Dimensions';
import { Coordinates } from '../primitives/Coordinates';
import { Diagram } from '../Diagram';
import { EventEmitter } from '../../util/EventEmitter';
import { Gateway } from './Gateway';

export class Node<Gateways = 'left' | 'right' | 'top' | 'down'> {
  diagram: Diagram | null = null;
  protected emitter = new EventEmitter<{
    select: Node;
  }>();
  protected _gateways = new Map<Gateways, Gateway>();
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
      box: state.box ?? new Dimensions([0, 0, 100, 80]),
    };

    makeObservable<Node<any>, '_gateways'>(this, {
      state: observable,
      selected: computed,
      _gateways: observable,
      toggleEdition: action,
    });

    this.initializeGateways();
  }

  protected initializeGateways() {
    this._gateways.set(
      'left' as Gateways,
      new Gateway(this, {
        maxIncomingConnections: Infinity,
        maxOutgoingConnections: Infinity,
        id: 'left',
        orientation: 'left',
        position: new Coordinates([0, 0.5]),
      }),
    );
    this._gateways.set(
      'right' as Gateways,
      new Gateway(this, {
        maxIncomingConnections: Infinity,
        maxOutgoingConnections: Infinity,
        id: 'right',
        orientation: 'right',
        position: new Coordinates([1, 0.5]),
      }),
    );
    this._gateways.set(
      'up' as Gateways,
      new Gateway(this, {
        maxIncomingConnections: Infinity,
        maxOutgoingConnections: Infinity,
        id: 'up',
        orientation: 'up',
        position: new Coordinates([0.5, 0]),
      }),
    );
    this._gateways.set(
      'down' as Gateways,
      new Gateway(this, {
        maxIncomingConnections: Infinity,
        maxOutgoingConnections: Infinity,
        id: 'down',
        orientation: 'down',
        position: new Coordinates([0.5, 1]),
      }),
    );
  }

  public get box() {
    return this.state.box.copy();
  }
  public get coordinates() {
    return this.box.coordinates;
  }

  displace(howMuch: Coordinates) {
    this.state.box.sum([...howMuch.raw, 0, 0]);
  }

  public get id() {
    return this.state.id;
  }

  public get gateways() {
    return [...this._gateways.values()];
  }

  protected dragEventMouseStartPosition: Coordinates | null = null;
  protected dragEventStartPosition: Coordinates | null = null;

  on = this.emitter.on.bind(this.emitter);

  getGateway(which: Gateways) {
    return this._gateways.get(which);
  }

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
    }

    if (previousBox.substract(this.state.box).norm) {
      this._gateways.values().forEach((c) => c.updateEdges());
    }
  }

  toggleEdition(edition?: boolean) {
    this.state.edition = edition ?? !this.state.edition;
  }

  useRef(el: SVGElement | null) {
    this.ref = el;
  }

  deserialize(o: ReturnType<(typeof this)['serialize']>) {
    this.state.box.assign(o.box);
    this.state.id = o.id;
    this.state.label = o.label;
    this.state.movable = o.movable;
    this.state.selectable = o.selectable;
    this.state.fill = o.fill;
    this.state.labelFontSize = o.labelFontSize;
    this.state.stroke = o.stroke;
    this.state.strokewWidth = o.strokewWidth;

    this._gateways.clear();

    o.gateways.forEach((c) => {
      this._gateways.set(
        c.id as any,
        new (Diagram.getClass(c.class))(this, {
          id: c.id,
        }) as Gateway,
      );
    });
    o.gateways.forEach((c) => {
      this._gateways.get(c.id as any)?.deserialize(c);
    });
  }

  serialize() {
    const {
      box: { raw: box },
      id,
      label,
      movable,
      selectable,
      fill,
      labelFontSize,
      stroke,
      strokewWidth,
    } = this.state;
    const gateways = this.gateways.map((g) => {
      return g.serialize();
    });

    return {
      box,
      id,
      label,
      movable,
      selectable,
      gateways,
      fill,
      labelFontSize,
      stroke,
      strokewWidth,
      class: this.constructor.name,
    };
  }
}
