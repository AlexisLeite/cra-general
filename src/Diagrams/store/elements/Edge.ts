import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import type { TEdgeState } from '../types';
import { Coordinates } from '../primitives/Coordinates';
import { EdgePoint, type TEdgePointType } from './EdgePoint';
import { Element } from './Element';
import {
  DMouseUpEvent,
  DEdgeDragStartEvent,
  DEdgeSelectionEvent,
  DKeyDownEvent,
} from './Events';
import type { Midpoint } from '../../components/objects/RenderEdge';
import type { MouseEvent } from 'react';

let id = Number.MIN_SAFE_INTEGER;

export class Edge extends Element {
  id: Readonly<string> = String(id++);

  constructor(
    parent: Element | null,
    public state: TEdgeState,
  ) {
    super(parent);

    makeObservable<Edge, 'state'>(this, {
      state: observable,
      setSteps: action,
      arrowHeadEnd: computed,
      arrowHeadStart: computed,
      from: computed,
      hasManualSteps: computed,
      pathType: computed,
      steps: computed,
      stroke: computed,
      strokeWidth: computed,
    });

    this.diagram?.onEvent(DMouseUpEvent, this.handleMouseUp);
    this.diagram?.onEvent(DKeyDownEvent, this.handleKeyPress);
  }

  get arrowHeadEnd() {
    return this.state.arrowHeadEnd;
  }

  get arrowHeadStart() {
    return this.state.arrowHeadStart;
  }

  public get from() {
    return this.state.from;
  }

  public get hasManualSteps() {
    return this.state.steps.find((c) => c.mode === 'manual');
  }

  get lineStyle() {
    return this.state.lineStyle;
  }

  get pathType() {
    return this.state.pathType;
  }

  get steps() {
    return this.state.steps;
  }

  get stroke() {
    return this.state.stroke;
  }

  get strokeWidth() {
    return this.state.strokeWidth;
  }

  setSteps(steps: Coordinates[]) {
    this.state.steps = steps.map((c) =>
      c instanceof EdgePoint ? c : new EdgePoint(this, c),
    );

    this.state.steps[0].mode = 'static';
    this.state.steps.at(-1)!.mode = 'static';
  }

  public get to() {
    return this.state.to;
  }

  deserialize(o: ReturnType<(typeof this)['serialize']>) {
    this.state.arrowHeadEnd = o.arrowHeadEnd;
    this.state.arrowHeadStart = o.arrowHeadStart;
    this.state.lineStyle = o.lineStyle;
    this.state.pathType = o.pathType;
    this.state.stroke = o.stroke;
    this.state.strokeWidth = o.strokeWidth;

    this.state.steps = o.steps.map((c) => new EdgePoint(this, c));
    this.state.to = this.state.from.diagram
      .getNodeById(o.toParentId)!
      .getGateway(o.to as any)!;
    this.state.from.diagram.addEdge(this);
  }

  serialize() {
    const {
      arrowHeadEnd,
      arrowHeadStart,
      lineStyle,
      pathType,
      steps,
      stroke,
      strokeWidth,
      to: {
        id: to,
        parent: { id: toParentId },
      },
    } = this;
    return {
      arrowHeadEnd,
      arrowHeadStart,
      lineStyle,
      pathType,
      steps: steps.map(
        (c) => [...c.raw, c.mode] as [number, number, TEdgePointType],
      ),
      stroke,
      strokeWidth,
      to,
      toParentId,
      class: this.constructor.name,
    };
  }

  dragStart(midpoint: Midpoint, ev: MouseEvent) {
    ev.nativeEvent.stopImmediatePropagation();

    this.emit(new DEdgeDragStartEvent(this, midpoint, ev));
  }

  select() {
    runInAction(() => {
      if (!this.emit(new DEdgeSelectionEvent(this, true)).cancelled) {
        this.state.selected = true;
      }
    });
  }
  unselect() {
    runInAction(() => {
      if (!this.emit(new DEdgeSelectionEvent(this, false)).cancelled) {
        this.state.selected = false;
      }
    });
  }

  protected handleMouseUp = (ev: DMouseUpEvent) => {
    if (!ev.cancelled) {
      if (ev.edge === this) {
        this.select();
      } else if (!ev.ctrl && !ev.shift) {
        this.unselect();
      }
    }
  };

  protected handleKeyPress = (ev: DKeyDownEvent) => {
    if (this.state.selected && ev.code === 'Delete') {
      this.diagram?.disconnect(this);
    }
  };
}
