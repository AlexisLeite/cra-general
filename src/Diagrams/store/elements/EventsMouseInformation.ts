import { Coordinates } from '../primitives/Coordinates';
import type { AnyMouseEvent } from './Events';

export class MouseInformation {
  public constructor(protected originalEvent: AnyMouseEvent) {}

  get button() {
    switch (this.originalEvent.button) {
      case 1:
        return 'left';
      case 2:
        return 'right';
      case 4:
        return 'middle';
      case 8:
        return 'back';
      case 16:
        return 'forward';
    }
    return 'none';
  }

  get position() {
    return new Coordinates(this.originalEvent, false);
  }
}
