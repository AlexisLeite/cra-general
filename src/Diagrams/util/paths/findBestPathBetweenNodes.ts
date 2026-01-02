import { Diagram } from '../../store/Diagram';
import { Gateway } from '../../store/elements/Gateway';
import { Coordinates } from '../../store/primitives/Coordinates';
import { EdgePoint, type TEdgePointType } from '../../store/elements/EdgePoint';
import { arePointsAligned } from '../../components/objects/RenderEdge/util';
import { GridSnap } from '../../store/extensions/GridSnap';
import { WorkerPool } from './WorkerPool';

export type Path = { x: number; y: number }[];

function filterUndefined(x: any) {
  return x !== undefined;
}

function getEdgePoint(step: Coordinates, mode: TEdgePointType = 'auto') {
  return step instanceof EdgePoint
    ? step
    : new EdgePoint(
        null,
        [...step.raw, mode].filter(filterUndefined) as [
          number,
          number,
          TEdgePointType,
        ],
      );
}

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

const pool = new WorkerPool(20, new URL('./makePathGrid.ts', import.meta.url));

let i = Number.MIN_SAFE_INTEGER;
export async function findBestPathBetweenNodes(
  _diagram: Diagram,
  A: Gateway,
  B: Gateway,
): Promise<Coordinates[]> {
  const gridSize = _diagram.getExtension(GridSnap).gridSize;

  const id = ++i;

  const path = (await pool.exec({
    A: {
      coordinates: A.coordinates.raw,
      orientation: A.orientation,
      parentDimensions: A.parent.box.raw,
    },
    B: {
      coordinates: B.coordinates.raw,
      orientation: B.orientation,
      parentDimensions: B.parent.box.raw,
    },
    gridSize,
    id,
  })) as [number, number][];

  if (path) {
    return filterResultPath(path.map((c) => getEdgePoint(new Coordinates(c))));
  }

  return [A.coordinates, B.coordinates];
}
