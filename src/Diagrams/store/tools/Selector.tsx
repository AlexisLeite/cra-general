import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../Diagram';
import { AnyMouseEvent } from '../Canvas';
import { Coordinates } from '../Coordinates';
import { Dimensions } from '../Dimensions';

export class Selector {
  protected _selectionMode = false;

  public enableSelectionMode() {
    this.diagram.disableEvents();
    this._selectionMode = true;
  }

  public disableSelectionMode() {
    this._selectionMode = false;
    this.handleMouseUp();
  }

  get selectionModeEnabled() {
    return this._selectionMode;
  }

  protected endPoint: Coordinates | null = null;
  protected startPoint: Coordinates | null = null;
  protected moved = false;
  protected selected = false;

  get() {
    if (!this.startPoint) return new Dimensions();

    return new Dimensions([
      ...this.startPoint.raw,
      ...this.endPoint!.copy().substract(this.startPoint).raw,
    ]);
  }

  constructor(public diagram: Diagram) {
    makeAutoObservable(this);

    this.diagram.canvas.on('mouseDown', this.handleMouseDown.bind(this), 100);
    this.diagram.canvas.on('mouseMove', this.handleMouseMove.bind(this));
    this.diagram.canvas.on('mouseUp', this.handleMouseUp.bind(this));
  }

  protected unselectOthersTimeout = -1;
  protected handleMouseDown(ev: AnyMouseEvent) {
    this.moved = false;
    this.selected = false;
    this.endPoint = null;
    this.startPoint = null;

    const nodeG = (ev.target as HTMLElement).closest<SVGGElement>(
      '.diagram__node',
    );

    if (this._selectionMode)
      if (!nodeG) {
        this.startPoint = new Coordinates([ev.clientX, ev.clientY]);
        this.endPoint = new Coordinates([ev.clientX, ev.clientY]);
      } else {
        const node = nodeG ? this.diagram.getNodeById(nodeG.dataset.id!) : null;
        if (!node?.selected) {
          this.startPoint = new Coordinates([ev.clientX, ev.clientY]);
          this.endPoint = new Coordinates([ev.clientX, ev.clientY]);
        }
      }
    else {
      if (nodeG) {
        const node = this.diagram.getNodeById(nodeG.dataset.id!);
        if (node) {
          ev.preventDefault();
          if (ev.ctrlKey) {
            this.diagram.toggleNodeSelection(node);
          } else {
            this.diagram.selectNode(node, false);
            this.diagram.selectNode(node, !ev.shiftKey && !node.selected);
          }
        }
      }
    }
  }
  protected handleMouseMove(ev: AnyMouseEvent) {
    if (this._selectionMode) {
      this.moved = true;
      if (this.startPoint && this._selectionMode) {
        this.endPoint = new Coordinates([ev.clientX, ev.clientY]);

        this.diagram.nodes.forEach((c) => {
          if (this.diagram.canvas.inverseFit(this.get()).collides(c.box)) {
            this.diagram.selectNode(c, false, true);
            this.selected = true;
          } else {
            this.diagram.unselectNode(c);
          }
        });
      }
    }
  }
  protected handleMouseUp() {
    if (this._selectionMode) {
      if (this.startPoint && !this.moved && !this.selected) {
        this.diagram.unselectAll();
      }

      this.moved = false;
      this.selected = false;
      this.endPoint = null;
      this.startPoint = null;
    }
  }
}
