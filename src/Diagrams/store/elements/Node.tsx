import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import type { TDirection, TNodeState } from '../types';
import { Dimensions } from '../primitives/Dimensions';
import { Coordinates } from '../primitives/Coordinates';
import { Diagram } from '../Diagram';
import { Gateway } from './Gateway';
import { Element } from './Element';
import { ClassList } from '../../util/ClassList';
import { type FC } from 'react';

export type TNodeConstructorProps = Pick<TNodeState, 'id' | 'label'> &
  Partial<TNodeState>;

export class Node<Gateways = TDirection> extends Element {
  protected _gateways = new Map<Gateways, Gateway>();
  public state: TNodeState;
  public readonly classList = new ClassList();

  public get selected() {
    return this.state.selected;
  }

  constructor(parent: Element | null, state: TNodeConstructorProps) {
    super(parent);

    this.state = {
      ...state,
      box: state.box ?? new Dimensions([0, 0, 100, 80]),
    };

    this.classList.add('diagram__node');

    makeObservable<Node<any>, '_gateways'>(this, {
      state: observable,
      selected: computed,
      _gateways: observable,
      setState: action,
    });

    this.initializeGateways();
  }

  canSelect() {
    if (!this.state.selected && this.state.selectable !== false) {
      runInAction(() => {
        this.state.selected = true;
      });
      return true;
    }
    return false;
  }

  canUnselect() {
    if (this.state.selected) {
      runInAction(() => {
        this.state.selected = false;
      });
      return true;
    }
    return false;
  }

  setDiagram(d: Diagram) {
    this.parent = d;
  }

  setState<K extends keyof TNodeState>(prop: K, value: TNodeState[K]) {
    this.state[prop] = value;
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

  getGateway(which: Gateways) {
    return this._gateways.get(which);
  }

  setDimentions(c: Coordinates | [number, number]) {
    this.state.box.assignDimensions(c);
  }

  setPosition(c: Coordinates) {
    const previousBox = this.state.box.copy();

    this.state.box
      .assignCoordinates(c)
      .bound(new Dimensions([0, 0, ...this.diagram!.canvas.size.raw]));

    if (previousBox.substract(this.state.box).norm) {
      [...this._gateways.values()].forEach((c) => c.updateEdges());
    }
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

    o.gateways.forEach((c) => {
      const incomingEdges =
        this._gateways.get(c.id as any)?.incomingEdges || [];

      this._gateways.set(
        c.id as any,
        new (Diagram.getClass(c.class))(this, {
          id: c.id,
        }) as Gateway,
      );

      this._gateways.get(c.id as any)!.state.incomingEdges = incomingEdges;
    });
    o.gateways.forEach((c) => {
      this._gateways.get(c.id as any)?.deserialize(c);
    });
    this._gateways.forEach((c) =>
      c.outgoingEdges.forEach((e) => {
        this.diagram?.connect(e.from, e.to, e);
      }),
    );
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
      selected,
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
      selected,
      gateways,
      fill,
      labelFontSize,
      stroke,
      strokewWidth,
      class: this.constructor.name,
    };
  }

  Renderer: FC | null = null;
}
