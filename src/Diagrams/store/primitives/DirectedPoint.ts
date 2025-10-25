import { TDirection } from '../types';
import { Coordinates } from './Coordinates';

export class DirectedPoint extends Coordinates {
  direction: TDirection = 'left';

  get rawDirectedPoint() {
    return {
      x: this.x,
      y: this.y,
      direction: this.direction,
    };
  }

  stepBack() {
    switch (this.direction) {
      case 'down':
        this.y--;
        break;
      case 'left':
        this.x++;
        break;
      case 'right':
        this.x--;
        break;
      case 'up':
        this.y++;
        break;
    }
    return this;
  }

  stepForward() {
    switch (this.direction) {
      case 'down':
        this.y++;
        break;
      case 'left':
        this.x--;
        break;
      case 'right':
        this.x++;
        break;
      case 'up':
        this.y--;
        break;
    }
    return this;
  }
}
