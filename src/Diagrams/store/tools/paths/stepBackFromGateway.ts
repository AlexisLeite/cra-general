import { Gateway } from '../../elements/Gateway';

export function stepFromGateway(gridSize: number, g: Gateway) {
  switch (g.orientation) {
    case 'down':
      return g.coordinates.sum([0, gridSize]);
    case 'left':
      return g.coordinates.sum([-gridSize, 0]);
    case 'up':
      return g.coordinates.sum([0, -gridSize]);
    case 'right':
      return g.coordinates.sum([+gridSize, 0]);
  }
}
