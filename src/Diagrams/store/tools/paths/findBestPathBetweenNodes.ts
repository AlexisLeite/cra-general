import type { Diagram } from '../../Diagram';
import type { Node } from '../../elements/Node';
import { Coordinates, TDirectedPoint } from '../../primitives/Coordinates';
import { findBestAnglePathAsync } from './findBestAnglePathWorker';

export async function findBestPathBetweenNodes(
  diagram: Diagram,
  A: Node,
  B: Node,
) {
  const startPoints = [
    A.box.leftMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('left')
      .stepForward().rawDirectedPoint,
    A.box.rightMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('right')
      .stepForward().rawDirectedPoint,
    A.box.topMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('up')
      .stepForward().rawDirectedPoint,
    A.box.bottomMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('down')
      .stepForward().rawDirectedPoint,
  ];

  let endPoints: TDirectedPoint[] = [];

  endPoints = [
    B.box.leftMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('right')
      .stepBack().rawDirectedPoint,
    B.box.rightMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('left')
      .stepBack().rawDirectedPoint,
    B.box.topMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('down')
      .stepBack().rawDirectedPoint,
    B.box.bottomMiddle
      .divide(diagram.gridSize / 2)
      .round.toDirectedPoint('up')
      .stepBack().rawDirectedPoint,
  ];

  const bestPath = await findBestAnglePathAsync(
    diagram,
    startPoints,
    endPoints,
  );

  return bestPath.map((c) =>
    new Coordinates([c.x, c.y]).multiply(diagram.gridSize / 2),
  );
}
