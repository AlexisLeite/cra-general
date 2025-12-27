import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../Diagram';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';
import {
  DMouseDownEvent,
  DMouseMoveEvent,
  DMouseUpEvent,
  DNodeSelectionEvent,
} from '../elements/Events';
import { Node } from '../elements/Node';
import { bind, diagramBind } from '../../util/bindCb';

type SelectionMode = 'area' | 'element';

/**
 * The selection must be handled entirelly by the Selector class.
 *
 * There are some considerations:
 *
 * ## The Selector has two modes
 *
 *  - Area selection mode:
      When this mode is enabled, a mouse down and drag action implies selecting 
      all nodes in the dragged area.

      When this mode is enabled, the event is stopped so the dragger wont be able
      to drag the node.

    - Single item selection mode:
      When this mode is enabled, a mouse down event over a node will trigger its
      selection.
 */
export class Selector {
  public selectionMode: SelectionMode = 'element';
  public toggleSelectionMode(sm?: SelectionMode) {
    this.selectionMode =
      sm || (this.selectionMode === 'area' ? 'element' : 'area');
  }

  protected startNode: Node | null = null;
  protected endPoint: Coordinates | null = null;
  protected startPoint: Coordinates | null = null;
  protected _selection = new Set<Node>();

  get selection() {
    return [...this._selection];
  }

  protected moved = false;

  get() {
    if (!this.startPoint || !this.endPoint) return new Dimensions();

    return this.diagram.canvas.inverseFit(
      new Dimensions([
        ...this.startPoint.raw,
        ...this.endPoint!.copy().substract(this.startPoint).raw,
      ]),
    );
  }

  constructor(public diagram: Diagram) {
    makeAutoObservable(this);

    this.diagram.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
      this.diagram.priorities.Selector_Mouse_Down,
    );

    this.diagram.onEvent(DNodeSelectionEvent, (ev) => {
      if (ev.selected) {
        this._selection.add(ev.src);
      } else {
        this._selection.delete(ev.src);
      }
    });
  }

  clearSelection() {
    this._selection.forEach((c) => c.unselect());
  }

  private cancelMouseBind = () => {};
  protected handleMouseDown(ev: DMouseDownEvent) {
    this.cancelMouseBind();

    this.cancelMouseBind = bind(
      diagramBind(
        this,
        DMouseMoveEvent,
        this.handleMouseMove,
        this.diagram.priorities.Selector_Mouse_Move,
      ),
      diagramBind(
        this,
        DMouseUpEvent,
        this.handleMouseUp,
        this.diagram.priorities.Selector_Mouse_Up,
      ),
    );

    this.endPoint = null;
    this.startPoint = new Coordinates(ev);

    if (this.selectionMode === 'area') {
      ev.cancel();
      ev.stopImmediatePropagation();

      this.endPoint = new Coordinates(ev);
    }
  }

  protected handleMouseMove(ev: DMouseMoveEvent) {
    this.moved =
      this.moved ||
      !!(
        this.startPoint &&
        (this.startPoint?.copy().substract(new Coordinates(ev)).norm || 0) > 20
      );

    if (this.selectionMode === 'area' && this.startPoint) {
      this.endPoint = new Coordinates(ev);

      this.diagram.nodes.forEach((c) => {
        if (this.get().collides(c.box)) {
          c.select();
        } else if (!ev.shift) {
          c.unselect();
        }
      });

      for (const edge of this.diagram.edges) {
        for (let i = 0; i < edge.steps.length - 1; i++) {
          const box = new Dimensions([
            ...edge.steps[i].raw,
            ...edge.steps[i + 1].copy().substract(edge.steps[i]).raw,
          ]);
          if (this.get().collides(box)) {
            edge.select();
            break;
          }
        }
      }
    }
  }

  protected handleMouseUp(ev: DMouseUpEvent) {
    this.cancelMouseBind();

    if (this.startPoint && !this.moved && !ev.shift && !ev.ctrl) {
      this.clearSelection();
      if (this.startNode) {
        this.startNode.select();
      }
    }

    if (this.startPoint && this.moved && this.selectionMode === 'area') {
      ev.cancel();
    }

    this.moved = false;
    this.endPoint = null;
    this.startPoint = null;
    this.startNode = null;
  }
}
