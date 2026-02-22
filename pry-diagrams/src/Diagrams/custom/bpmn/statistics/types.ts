export type BPMNMetric = 'throughput' | 'durationMs' | 'errorRate';

export type BPMNNodeStat = {
  nodeId: string;
} & Partial<Record<BPMNMetric, number>>;

export type BPMNEdgeStat = {
  fromNodeId: string;
  toNodeId: string;
  fromGatewayId?: string;
  toGatewayId?: string;
} & Partial<Record<BPMNMetric, number>>;

export type BPMNStatisticsFileV1 = {
  version: 1;
  nodes: BPMNNodeStat[];
  edges: BPMNEdgeStat[];
};
