import {
  action,
  computed,
  makeObservable,
  observable,
  runInAction,
} from 'mobx';
import { Coordinates } from '../primitives/Coordinates';
import { Dimensions } from '../primitives/Dimensions';
import {
  DMouseDownEvent,
  DDeleteNodeEvent,
  DMouseUpEvent,
  DMouseMoveEvent,
  DNodeSelectionEvent,
} from '../elements/Events';
import { Node } from '../elements/Node';
import { DiagramExtension } from './DiagramExtension';
import { bind, bindDiagram } from '../../util/bindCb';
import { Mouse } from '../../util/Mouse';

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
export class Selector extends DiagramExtension {
  public selectionMode: SelectionMode = 'element';

  private _selection = new Set<Node>();

  /**
   * Used to draw the selection rectangle
   */
  private endPoint: Coordinates | null = null;
  private startPoint: Coordinates | null = null;

  init() {
    makeObservable<Selector, '_selection' | 'endPoint' | 'startPoint'>(this, {
      _selection: observable,
      box: computed,
      endPoint: observable,
      selection: computed,
      selectionMode: observable,
      selectNode: action,
      startPoint: observable,
      toggleSelectionMode: action,
      unselectNode: action,
    });

    this.diagram.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
      this.diagram.priorities.Mouse_Down_Selector,
    );

    this.diagram.onEvent(DDeleteNodeEvent, (ev) => {
      this._selection.delete(ev.node);
    });
  }

  public toggleSelectionMode(
    sm: SelectionMode = this.selectionMode === 'area' ? 'element' : 'area',
  ) {
    this.selectionMode = sm;
  }

  get selection() {
    return [...this._selection];
  }

  get box() {
    if (!this.startPoint || !this.endPoint) return new Dimensions();

    return this.diagram.canvas.inverseFit(
      new Dimensions([
        ...this.startPoint.raw,
        ...this.endPoint!.copy().substract(this.startPoint).raw,
      ]),
    );
  }

  clearSelection(check: (n: Node<any>) => boolean = () => true) {
    for (const n of this._selection) {
      if (check(n)) {
        this.unselectNode(n);
      }
    }
  }

  selectNode(n: Node<any>) {
    if (
      n.canSelect() &&
      !this.emit(new DNodeSelectionEvent(n, true)).cancelled
    ) {
      this._selection.add(n);
    }
  }

  unselectNode(n: Node<any>) {
    if (
      n.canUnselect() &&
      !this.emit(new DNodeSelectionEvent(n, false)).cancelled
    ) {
      this._selection.delete(n);
    }
  }

  unbind = () => {};
  handleMouseDown = (ev: DMouseDownEvent) => {
    this.unbind();
    runInAction(() => {
      this.startPoint = new Coordinates(ev);
    });

    if (this.selectionMode === 'area') {
      ev.cancel();
      this.unbind = bind(
        bindDiagram(this, DMouseUpEvent, this.handleMouseUp),
        bindDiagram(this, DMouseMoveEvent, this.handleMouseMove),
      );
    } else {
      if (!ev.ctrl && !ev.shift && !ev.node?.selected) {
        this.clearSelection();
      }

      if (ev.node) {
        this.selectNode(ev.node);
      } else {
        this.clearSelection();
      }
    }
  };

  handleMouseMove = (_ev: DMouseMoveEvent) => {
    this.endPoint = Mouse.getInstance().coordinates;

    for (const node of this.diagram.nodes) {
      if (node.box.collides(this.box)) {
        this.selectNode(node);
      } else {
        this.unselectNode(node);
      }
    }
  };

  handleMouseUp = (_ev: DMouseUpEvent) => {
    this.unbind();
    this.endPoint = null;
    this.startPoint = null;
  };
}
