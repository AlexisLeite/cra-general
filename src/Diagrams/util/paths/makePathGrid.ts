import type { Gateway } from '../../store/elements/Gateway';
import { stepFromGateway } from './stepBackFromGateway';
import { PathsGrid } from './PathsGrid';

export function makePathGrid(A: Gateway, B: Gateway, gridSize: number) {
  const aStepped = stepFromGateway(gridSize, A);
  const bStepped = stepFromGateway(gridSize, B);

  const aInflated = A.parent.box.inflate(gridSize);
  const bInflated = B.parent.box.inflate(gridSize);

  const grid = new PathsGrid([
    A.parent.box.inflate(gridSize / 4),
    B.parent.box.inflate(gridSize / 4),
  ]);

  /**
   * First of all, we calculate a common to every pair of nodes grid, which
   * consiste of the intersection of all relevant lines of each box, includding
   * the stepped back from the gateways.
   */

  const relevantX = [
    ...[
      aInflated.topLeft.x,
      aInflated.topRight.x,
      bInflated.topLeft.x,
      bInflated.topRight.x,
      (aInflated.topRight.x + bInflated.topLeft.x) / 2,
    ],
    aStepped.x,
    bStepped.x,
  ].sort();
  const relevantY = [
    ...[
      aInflated.topLeft.y,
      aInflated.topRight.y,
      bInflated.topLeft.y,
      bInflated.topRight.y,
      (aInflated.bottomRight.y + bInflated.topLeft.y) / 2,
    ],
    aStepped.y,
    bStepped.y,
  ].sort();

  for (let i = 0; i < relevantX.length; i++) {
    const x1 = relevantX[i];
    const x2 = relevantX[i + 1];
    for (let j = 0; j < relevantY.length; j++) {
      const y1 = relevantY[j];
      const y2 = relevantY[j + 1];

      const a = grid.add(x1, y1);
      const b = grid.add(x2, y1);
      const p = grid.add(x1, y2);
      const q = grid.add(x2, y2);

      grid.connect(a, b);
      grid.connect(p, q);
      grid.connect(a, p);
      grid.connect(b, q);
    }
  }

  const a = A.coordinates;
  const b = B.coordinates;

  /**
   * Then, we connect the gateways to the stepped back points.
   */

  grid.connect(grid.createPoint(a), grid.createPoint(aStepped), true);
  grid.connect(grid.createPoint(bStepped), grid.createPoint(b), true);

  return grid;
}
