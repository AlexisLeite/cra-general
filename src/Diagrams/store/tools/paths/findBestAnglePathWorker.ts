import type { TDirectedPoint } from '../../primitives/Coordinates';
import type { Diagram } from '../../Diagram';
import type { DiagramSnapshot } from './worker/pathWorker';

type Path = { x: number; y: number }[];

type WorkerRequest = {
  id: number;
  startCandidates: TDirectedPoint[];
  endCandidates: TDirectedPoint[];
  snapshot: DiagramSnapshot;
};

type WorkerResponse = { id: number; path: Path; cost: number };

function buildSnapshot(diagram: Diagram): DiagramSnapshot {
  return {
    gridSize: diagram.gridSize / 2,
    nodes: diagram.nodes.map((n) => {
      const [x, y, w, h] = n.box.raw;
      return { x, y, width: w, height: h };
    }),
    edges: diagram.edges.map((e) => ({
      points: e.steps.map((c) => ({ x: c.x, y: c.y })),
    })),
  };
}

export function findBestAnglePathAsync(
  diagram: Diagram,
  startCandidates: TDirectedPoint[],
  endCandidates: TDirectedPoint[],
): Promise<Path> {
  const snapshot = buildSnapshot(diagram);

  // Create the worker (module type)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - new URL is supported by CRA/Webpack for workers
  const worker = new Worker(
    new URL('./worker/pathWorker.ts', import.meta.url),
    {
      type: 'module',
    },
  );

  const id = Date.now() ^ Math.floor(Math.random() * 0x7fffffff);
  const req: WorkerRequest = {
    id,
    startCandidates,
    endCandidates,
    snapshot,
  };

  return new Promise<Path>((resolve, reject) => {
    const onMessage = (ev: MessageEvent<WorkerResponse>) => {
      if (ev.data && ev.data.id === id) {
        worker.removeEventListener('message', onMessage);
        worker.terminate();
        resolve(ev.data.path);
        console.log(ev.data);
      }
    };
    const onError = (err: unknown) => {
      worker.removeEventListener('message', onMessage);
      worker.terminate();
      reject(err);
    };
    worker.addEventListener('message', onMessage);
    worker.addEventListener('error', onError as any);

    // No large buffers to transfer; post snapshot directly
    worker.postMessage(req);
  });
}
