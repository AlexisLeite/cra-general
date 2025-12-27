import type { Diagram } from '../Diagram';
import { Element } from '../elements/Element';

export abstract class DiagramExtension extends Element {
  constructor(public parent: Diagram) {
    super(parent);
  }

  public abstract init(): void;

  public get diagram(): Diagram {
    return super.diagram!;
  }
}
