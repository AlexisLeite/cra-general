import { DiagramExtension } from './DiagramExtension';
import { DDragNodeEvent } from '../elements/Events';

export class GridSnap extends DiagramExtension {
  public init(): void {
    this.diagram.onEvent(DDragNodeEvent, (ev) => {});
  }
}
