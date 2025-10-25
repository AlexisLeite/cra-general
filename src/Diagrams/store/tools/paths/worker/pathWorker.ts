/*
  Web Worker: runs findBestAnglePath using precomputed directional cost grids.
  Receives a message with: { id, startCandidates, endCandidates, grids }
  Responds with: { id, path }
*/
/* eslint-disable no-restricted-globals */
import { findBestAnglePath } from './findBestAnglePath';
import type { TDirectedPoint } from '../../../primitives/Coordinates';

type Path = { x: number; y: number }[];

// Snapshot sent from main thread to compute costs inside the worker
export type DiagramSnapshot = {
  gridSize: number;
  nodes: Array<{ x: number; y: number; width: number; height: number }>;
  edges: Array<{ points: Array<{ x: number; y: number }> }>;
};

type Request = {
  id: number;
  startCandidates: TDirectedPoint[];
  endCandidates: TDirectedPoint[];
  snapshot: DiagramSnapshot;
};

type Response = { id: number; path: Path; cost: number };

const ctx: any = self as any;

ctx.addEventListener('message', (ev: MessageEvent<Request>) => {
  const data = ev.data as Request;
  const { id, startCandidates, endCandidates, snapshot } = data;
  const path = findBestAnglePath(startCandidates, endCandidates, snapshot);
  const res: Response = { id, ...path };
  ctx.postMessage(res);
});

export {};
