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
  DEdgeSelectionEvent,
  DDeleteEdgeEvent,
} from '../elements/Events';
import { Node } from '../elements/Node';
import { DiagramExtension } from './DiagramExtension';
import { bind, bindDiagram } from '../../util/binders';
import { Mouse } from '../../util/Mouse';
import { Edge } from '../elements/Edge';
import { getId } from '../../util/getId';

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
  private _edgesSelection = new Set<Edge>();

  /**
   * Used to draw the selection rectangle
   */
  private endPoint: Coordinates | null = null;
  private startPoint: Coordinates | null = null;

  copy() {
    const selection: any[] = [];
    const idMap = new Map<string, string>();

    const restrict: string[] = [];
    for (const n of this._selection) {
      const newId = getId(this.diagram, 'node', restrict);
      idMap.set(n.id, newId);
      restrict.push(newId);
    }

    for (const n of this._selection) {
      const serialized = n.serialize();
      serialized.id = idMap.get(serialized.id)!;
      serialized.gateways.forEach((c) => {
        c.outEdges.forEach((e) => {
          e.toParentId = idMap.get(e.toParentId)!;
        });
      });
      selection.push(serialized);
    }
    return JSON.stringify({ nodes: selection });
  }

  init() {
    makeObservable<Selector, '_selection' | 'endPoint' | 'startPoint'>(this, {
      _selection: observable,
      box: computed,
      endPoint: observable,
      selectedNodes: computed,
      selectedEdges: computed,
      selectionMode: observable,
      selectNode: action,
      startPoint: observable,
      toggleSelectionMode: action,
      unselectNode: action,
      handleMouseUp: action,
    });

    this.diagram.onEvent(
      DMouseDownEvent,
      this.handleMouseDown.bind(this),
      this.diagram.priorities.Mouse_Down_Selector,
    );

    this.diagram.onEvent(DDeleteNodeEvent, (ev) => {
      this._selection.delete(ev.node);
    });

    this.diagram.onEvent(DDeleteEdgeEvent, (ev) => {
      this._edgesSelection.delete(ev.edge);
    });

    for (const node of this.diagram.nodes) {
      if (node.selected) {
        this._selection.add(node);
      }
    }
  }

  public toggleSelectionMode(
    sm: SelectionMode = this.selectionMode === 'area' ? 'element' : 'area',
  ) {
    this.selectionMode = sm;
  }

  get selectedNodes() {
    return [...this._selection];
  }
  get selectedEdges() {
    return [...this._edgesSelection];
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
    for (const e of this._edgesSelection) {
      this.unselectEdge(e);
    }
  }

  selectEdge(e: Edge) {
    if (!this.emit(new DEdgeSelectionEvent(e, true)).cancelled) {
      e.setState('selected', true);
      this._edgesSelection.add(e);
    }
  }

  selectNode(n: Node<any>) {
    if (
      n.canSelect() &&
      !this.emit(new DNodeSelectionEvent(n, true)).cancelled
    ) {
      n.setState('selected', true);
      this._selection.add(n);
    }
  }

  unselectEdge(e: Edge) {
    if (!this.emit(new DEdgeSelectionEvent(e, false)).cancelled) {
      e.setState('selected', false);
      this._edgesSelection.delete(e);
    }
  }

  unselectNode(n: Node<any>) {
    if (
      n.canUnselect() &&
      !this.emit(new DNodeSelectionEvent(n, false)).cancelled
    ) {
      n.setState('selected', false);
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

      if (ev.node || ev.edge) {
        if (ev.node) {
          this.selectNode(ev.node);
        }
        if (ev.edge) {
          this.selectEdge(ev.edge);
        }
      } else {
        this.clearSelection();
      }
    }
  };

  handleMouseMove = (_ev: DMouseMoveEvent) => {
    runInAction(() => {
      this.endPoint = Mouse.getInstance().coordinates;
    });

    for (const node of this.diagram.nodes) {
      if (node.box.collides(this.box)) {
        this.selectNode(node);
      } else {
        this.unselectNode(node);
      }

      for (const g of node.gateways) {
        for (const edge of g.outgoingEdges) {
          if (edge.collides(this.box)) {
            this.selectEdge(edge);
            break;
          } else {
            this.unselectEdge(edge);
          }
        }
      }
    }
  };

  handleMouseUp = (_ev: DMouseUpEvent) => {
    this.unbind();
    this.endPoint = null;
    this.startPoint = null;
  };
}
