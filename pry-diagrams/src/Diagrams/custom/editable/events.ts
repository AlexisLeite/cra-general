import { DChangeEvent } from '../../store/elements/Events';
import { Element } from '../../store/elements/Element';

export class DEditNodeEvent extends DChangeEvent {
  declare protected readonly __brand: void;

  constructor(
    public src: Element,
    public previousLabel: string,
    public nextLabel: string,
  ) {
    super(src);
  }
}
