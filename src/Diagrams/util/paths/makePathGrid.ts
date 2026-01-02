import { Coordinates } from '../../store/primitives/Coordinates';
import { Dimensions } from '../../store/primitives/Dimensions';
import type { TOrientation } from '../../store/types';
import { PathsGrid } from './PathsGrid';
import { stepFromGateway } from './stepBackFromGateway';

type TGateway = {
  coordinates: [number, number];
  orientation: TOrientation;
  parentDimensions: [number, number, number, number];
};

self.onmessage = ({
  data: { A: ASerialize, B: BSerialize, gridSize },
}: MessageEvent<{
  A: TGateway;
  B: TGateway;
  gridSize: number;
}>) => {
  const AParent = new Dimensions([
    ASerialize.parentDimensions[1],
    ASerialize.parentDimensions[0],
    ASerialize.parentDimensions[2],
    ASerialize.parentDimensions[3],
  ]);
  const BParent = new Dimensions([
    BSerialize.parentDimensions[0],
    BSerialize.parentDimensions[1],
    BSerialize.parentDimensions[2],
    BSerialize.parentDimensions[3],
  ]);
  const AGate = new Coordinates([
    ASerialize.coordinates[0],
    ASerialize.coordinates[1],
  ]);
  const BGate = new Coordinates([
    BSerialize.coordinates[0],
    BSerialize.coordinates[1],
  ]);

  const aStepped = stepFromGateway(gridSize, AGate, ASerialize.orientation);
  const bStepped = stepFromGateway(gridSize, BGate, BSerialize.orientation);

  const aInflated = AParent.inflate(gridSize);
  const bInflated = BParent.inflate(gridSize);

  const grid = new PathsGrid([
    AParent.inflate(gridSize / 4),
    BParent.inflate(gridSize / 4),
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

  const a = AGate;
  const b = BGate;

  /**
   * Then, we connect the gateways to the stepped back points.
   */

  grid.connect(grid.createPoint(a), grid.createPoint(aStepped), true);
  grid.connect(grid.createPoint(bStepped), grid.createPoint(b), true);

  const points = grid.run(
    {
      coordinates: AGate,
      orientation: ASerialize.orientation,
    },
    {
      coordinates: BGate,
      orientation: BSerialize.orientation,
    },
  );

  self.postMessage(points?.map((c) => c.raw) || []);
};
