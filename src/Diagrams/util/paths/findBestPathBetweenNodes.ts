import { Diagram } from '../../store/Diagram';
import { Gateway } from '../../store/elements/Gateway';
import { Coordinates } from '../../store/primitives/Coordinates';
import { EdgePoint } from '../../store/elements/EdgePoint';
import { arePointsAligned } from '../../components/objects/RenderEdge/util';
import { GridSnap } from '../../store/extensions/GridSnap';
import { WorkerPool } from './WorkerPool';

export type Path = { x: number; y: number }[];

function filterResultPath(steps: EdgePoint[]) {
  const result: EdgePoint[] = [];

  let lastStr = '';
  for (let i = 0; i < steps.length; i++) {
    if (lastStr === steps[i].toString()) {
      if (steps[i].mode === 'manual') {
        result[result.length - 1] = steps[i];
      }
    } else {
      lastStr = steps[i].toString();
      result.push(steps[i]);
    }

    if (
      result.length >= 3 &&
      arePointsAligned(result.at(-3)!, result.at(-2)!, result.at(-1)!) &&
      result.at(-2)!.mode === 'auto'
    ) {
      result.splice(result.length - 2, 1);
    }
  }

  return result;
}

const pool = new WorkerPool(20, new URL('./resolvePath.ts', import.meta.url));

let i = Number.MIN_SAFE_INTEGER;
export async function findBestPathBetweenNodes(
  _diagram: Diagram,
  A: Gateway,
  B: Gateway,
  ADisplacement: Coordinates = new Coordinates([0, 0]),
  BDisplacement: Coordinates = new Coordinates([0, 0]),
): Promise<Coordinates[]> {
  const gridSize = _diagram.getExtension(GridSnap).gridSize;

  const id = ++i;

  const path = (await pool.exec({
    A: {
      coordinates: A.coordinates.sum(ADisplacement).raw,
      orientation: A.orientation,
      parentDimensions: A.parent.box.raw,
    },
    B: {
      coordinates: B.coordinates.sum(BDisplacement).raw,
      orientation: B.orientation,
      parentDimensions: B.parent.box.raw,
    },
    gridSize,
    id,
  })) as [number, number][];

  if (path) {
    return filterResultPath(
      path.map((c) => new EdgePoint(null, [...c, 'auto'])),
    );
  }

  return [A.coordinates, B.coordinates];
}
