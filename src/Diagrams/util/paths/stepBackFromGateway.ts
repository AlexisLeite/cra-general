import type { Coordinates } from '../../store/primitives/Coordinates';
import type { Dimensions } from '../../store/primitives/Dimensions';
import type { TOrientation } from '../../store/types';

export function stepFromGateway(
  gridSize: number,
  coordinates: Coordinates,
  orientation: TOrientation,
) {
  switch (orientation) {
    case 'down':
      return coordinates.copy().sum([0, gridSize]);
    case 'left':
      return coordinates.copy().sum([-gridSize, 0]);
    case 'up':
      return coordinates.copy().sum([0, -gridSize]);
    case 'right':
      return coordinates.copy().sum([+gridSize, 0]);
  }
}

export function oppositeStepFromGateway(
  gridSize: number,
  parent: Dimensions,
  coordinates: Coordinates,
  orientation: TOrientation,
) {
  switch (orientation) {
    case 'down':
      return coordinates.copy().sum([0, -gridSize - parent.height]);
    case 'left':
      return coordinates.copy().sum([gridSize + parent.width, 0]);
    case 'up':
      return coordinates.copy().sum([0, gridSize + parent.height]);
    case 'right':
      return coordinates.copy().sum([-gridSize - parent.width, 0]);
  }
}
