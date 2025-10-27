import { Gateway } from '../../elements/Gateway';
import { Coordinates } from '../../primitives/Coordinates';
import { stepFromGateway } from './stepBackFromGateway';

export function getPathAroundNode(
  gridSize: number,
  g: Gateway,
  side: 'a' | 'b',
): Coordinates[] {
  const stepBack = stepFromGateway(gridSize, g);
  const box = g.parent.box;

  switch (g.orientation) {
    case 'down':
      if (side === 'a') {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([
            box.x + box.width + gridSize,
            box.y + box.height + gridSize,
          ]),
        ];
      } else {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([box.x - gridSize, box.y + box.height + gridSize]),
        ];
      }
    case 'up':
      if (side === 'a') {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([box.x + box.width + gridSize, box.y - gridSize]),
        ];
      } else {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([box.x - gridSize, box.y - gridSize]),
        ];
      }
    case 'left':
      if (side === 'a') {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([box.x - gridSize, box.y - gridSize]),
        ];
      } else {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([box.x - gridSize, box.y + box.height + gridSize]),
        ];
      }
    case 'right':
      if (side === 'a') {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([box.x + box.width + gridSize, box.y - gridSize]),
        ];
      } else {
        return [
          g.coordinates,
          stepBack,
          new Coordinates([
            box.x + box.width + gridSize,
            box.y + box.height + gridSize,
          ]),
        ];
      }
  }
  return [];
}
