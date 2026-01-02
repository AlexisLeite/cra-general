import {
  DDoubleClickEvent,
  DKeyDownEvent,
  DMouseDownEvent,
} from '../../store/elements/Events';
import { DiagramExtension } from '../../store/extensions/DiagramExtension';
import { Selector } from '../../store/extensions/Selector';
import { EditableNode } from './EditableNode';

export class EditionMode extends DiagramExtension {
  private inEdition = new Set<EditableNode>();

  private cancel() {
    this.inEdition.forEach((c) => c.cancel());
    this.inEdition.clear();
  }

  private confirm() {
    this.inEdition.forEach((c) => c.confirm());
    this.inEdition.clear();
  }

  public editNode(node: EditableNode) {
    node.edit();
    this.inEdition.add(node);
  }

  init() {
    this.diagram.onEvent(DKeyDownEvent, (ev) => {
      switch (ev.code) {
        case 'F2': {
          const selectedNode = this.diagram.getExtension(Selector).selectedNodes[0];
          if (selectedNode instanceof EditableNode) {
            this.editNode(selectedNode);
          }
          break;
        }
        case 'Escape': {
          this.cancel();
          break;
        }
        case 'Enter': {
          if (!ev.shift) {
            this.confirm();
          }
        }
      }
    });

    this.diagram.onEvent(
      DMouseDownEvent,
      (ev) => {
        if (
          !ev.node ||
          (ev.node instanceof EditableNode && !this.inEdition.has(ev.node))
        ) {
          this.confirm();
        }
      },
      this.diagram.priorities.Mouse_Down_Dragger + 1,
    );

    this.diagram.onEvent(DDoubleClickEvent, (ev) => {
      if (ev.node instanceof EditableNode && !this.inEdition.has(ev.node)) {
        this.confirm();
        this.editNode(ev.node);
      }
    });
  }
}
