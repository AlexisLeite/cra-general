import { DNodeSelectionEvent } from '../elements/Events';
import { DiagramExtension } from './DiagramExtension';

export class NodesResizer extends DiagramExtension {
  public init(): void {
    this.diagram.onEvent(
      DNodeSelectionEvent,
      (ev) => {
        if (ev.selected) {
          console.log(ev);
        }
      },
      this.diagram.priorities.Node_Selection_Nodes_Resizer,
    );
  }
}
