import { Gateway } from '../../store/elements/Gateway';

export function stepFromGateway(gridSize: number, g: Gateway) {
  switch (g.orientation) {
    case 'down':
      return g.coordinates.copy().sum([0, gridSize]);
    case 'left':
      return g.coordinates.copy().sum([-gridSize, 0]);
    case 'up':
      return g.coordinates.copy().sum([0, -gridSize]);
    case 'right':
      return g.coordinates.copy().sum([+gridSize, 0]);
  }
}
