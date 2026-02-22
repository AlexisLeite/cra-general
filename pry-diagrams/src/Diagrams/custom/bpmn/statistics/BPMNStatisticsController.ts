import { makeAutoObservable, runInAction } from 'mobx';
import type { Diagram } from '../../../store/Diagram';
import type { Edge } from '../../../store/elements/Edge';
import type { Node } from '../../../store/elements/Node';
import { downloadFile } from '../../../util/downloadFile';
import type {
  BPMNEdgeStat,
  BPMNMetric,
  BPMNNodeStat,
  BPMNStatisticsFileV1,
} from './types';

type ScaleMode = 'linear' | 'log';
type RangeMode = 'auto' | 'manual';
type RGB = [number, number, number];

type NodeSnapshot = {
  fill: string | undefined;
  stroke: string | undefined;
};

type EdgeSnapshot = {
  stroke: string | undefined;
  strokeWidth: number | undefined;
};

type NodeEntry = {
  index: number;
  stat: BPMNNodeStat;
};

type EdgeEntry = {
  index: number;
  stat: BPMNEdgeStat;
};

const METRICS: BPMNMetric[] = ['throughput', 'durationMs', 'errorRate'];
const FALLBACK_LOW_COLOR = '#e1e8f3';
const FALLBACK_HIGH_COLOR = '#0ea5e9';
const DURATION_LOW_COLOR = '#86efac';
const DURATION_HIGH_COLOR = '#166534';
const ERROR_LOW_COLOR = '#fca5a5';
const ERROR_HIGH_COLOR = '#991b1b';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function isLaneNode(node: Node<any>) {
  return (
    node.constructor.name === 'Lanes' ||
    node.classList.string.split(' ').includes('bpm__lanes')
  );
}

function isFlowNode(node: Node<any>) {
  return !isLaneNode(node) && node.gateways.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function readMetricValue(
  source: Partial<Record<BPMNMetric, number>>,
  metric: BPMNMetric,
) {
  const value = source[metric];
  return isFiniteNumber(value) ? value : undefined;
}

function hexColorToRgb(input: string): RGB | null {
  const normalized = input.trim().toLowerCase();
  const short = normalized.match(/^#([a-f0-9]{3})$/i);
  if (short) {
    const [r, g, b] = short[1].split('').map((h) => Number.parseInt(h + h, 16));
    return [r, g, b];
  }

  const long = normalized.match(/^#([a-f0-9]{6})$/i);
  if (!long) {
    return null;
  }

  const raw = long[1];
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ];
}

function mixRgb(low: RGB, high: RGB, t: number): RGB {
  const ratio = clamp(t, 0, 1);
  return [
    Math.round(low[0] + (high[0] - low[0]) * ratio),
    Math.round(low[1] + (high[1] - low[1]) * ratio),
    Math.round(low[2] + (high[2] - low[2]) * ratio),
  ];
}

function rgbString(rgb: RGB) {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function rgbaString(rgb: RGB, alpha: number) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${clamp(alpha, 0, 1)})`;
}

function paletteByMetric(
  metric: BPMNMetric,
  lowColor: string,
  highColor: string,
) {
  switch (metric) {
    case 'durationMs':
      return { low: DURATION_LOW_COLOR, high: DURATION_HIGH_COLOR };
    case 'errorRate':
      return { low: ERROR_LOW_COLOR, high: ERROR_HIGH_COLOR };
    case 'throughput':
    default:
      return { low: lowColor, high: highColor };
  }
}

function toExactEdgeKey(
  fromNodeId: string,
  fromGatewayId: string,
  toNodeId: string,
  toGatewayId: string,
) {
  return `${fromNodeId}:${fromGatewayId}->${toNodeId}:${toGatewayId}`;
}

function toLooseEdgeKey(fromNodeId: string, toNodeId: string) {
  return `${fromNodeId}->${toNodeId}`;
}

function parseMetricFromRecord(
  source: Record<string, unknown>,
  metric: BPMNMetric,
  context: string,
) {
  const value = source[metric];
  if (value === undefined) {
    return undefined;
  }
  if (!isFiniteNumber(value)) {
    throw new Error(`${context}.${metric} must be a finite number.`);
  }
  return value;
}

function parseNodeStat(input: unknown, index: number): BPMNNodeStat {
  const context = `nodes[${index}]`;
  if (!isRecord(input)) {
    throw new Error(`${context} must be an object.`);
  }
  if (typeof input.nodeId !== 'string' || input.nodeId.trim().length === 0) {
    throw new Error(`${context}.nodeId is required.`);
  }

  const record: BPMNNodeStat = {
    nodeId: input.nodeId,
  };

  for (const metric of METRICS) {
    const value = parseMetricFromRecord(input, metric, context);
    if (value !== undefined) {
      record[metric] = value;
    }
  }

  return record;
}

function parseEdgeStat(input: unknown, index: number): BPMNEdgeStat {
  const context = `edges[${index}]`;
  if (!isRecord(input)) {
    throw new Error(`${context} must be an object.`);
  }
  if (
    typeof input.fromNodeId !== 'string' ||
    input.fromNodeId.trim().length === 0
  ) {
    throw new Error(`${context}.fromNodeId is required.`);
  }
  if (
    typeof input.toNodeId !== 'string' ||
    input.toNodeId.trim().length === 0
  ) {
    throw new Error(`${context}.toNodeId is required.`);
  }

  if (
    input.fromGatewayId !== undefined &&
    (typeof input.fromGatewayId !== 'string' ||
      input.fromGatewayId.trim().length === 0)
  ) {
    throw new Error(`${context}.fromGatewayId must be a non-empty string.`);
  }

  if (
    input.toGatewayId !== undefined &&
    (typeof input.toGatewayId !== 'string' ||
      input.toGatewayId.trim().length === 0)
  ) {
    throw new Error(`${context}.toGatewayId must be a non-empty string.`);
  }

  const record: BPMNEdgeStat = {
    fromNodeId: input.fromNodeId,
    toNodeId: input.toNodeId,
    fromGatewayId:
      typeof input.fromGatewayId === 'string' ? input.fromGatewayId : undefined,
    toGatewayId:
      typeof input.toGatewayId === 'string' ? input.toGatewayId : undefined,
  };

  for (const metric of METRICS) {
    const value = parseMetricFromRecord(input, metric, context);
    if (value !== undefined) {
      record[metric] = value;
    }
  }

  return record;
}

function parseStatisticsFile(text: string): BPMNStatisticsFileV1 {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    throw new Error('Invalid JSON file.');
  }

  if (!isRecord(parsed)) {
    throw new Error('The statistics file must be an object.');
  }
  if (parsed.version !== 1) {
    throw new Error(
      'Unsupported statistics file version. Expected version: 1.',
    );
  }
  if (!Array.isArray(parsed.nodes)) {
    throw new Error('`nodes` must be an array.');
  }
  if (!Array.isArray(parsed.edges)) {
    throw new Error('`edges` must be an array.');
  }

  return {
    version: 1,
    nodes: parsed.nodes.map(parseNodeStat),
    edges: parsed.edges.map(parseEdgeStat),
  };
}

function resolveEdgeEntry(
  edge: Edge,
  exactIndex: Map<string, EdgeEntry>,
  looseIndex: Map<string, EdgeEntry[]>,
) {
  const fromNodeId = edge.from.parent.id;
  const toNodeId = edge.to.parent.id;
  const exactKey = toExactEdgeKey(
    fromNodeId,
    edge.from.id,
    toNodeId,
    edge.to.id,
  );
  const exact = exactIndex.get(exactKey);
  if (exact) {
    return exact;
  }

  const looseKey = toLooseEdgeKey(fromNodeId, toNodeId);
  const candidates = looseIndex.get(looseKey);
  if (!candidates?.length) {
    return undefined;
  }
  if (candidates.length === 1) {
    return candidates[0];
  }

  const gatewayFiltered = candidates.find(({ stat }) => {
    const fromMatches =
      !stat.fromGatewayId || stat.fromGatewayId === edge.from.id;
    const toMatches = !stat.toGatewayId || stat.toGatewayId === edge.to.id;
    return fromMatches && toMatches;
  });

  return gatewayFiltered ?? candidates[0];
}

function distributeIntegerTotal(total: number, weights: number[]): number[] {
  const count = weights.length;
  if (count <= 0) {
    return [];
  }
  const safeWeights = weights.map((value) => Math.max(0.0001, value));
  const totalWeight = safeWeights.reduce((sum, value) => sum + value, 0);
  const raw = safeWeights.map((value) => (total * value) / totalWeight);
  const values = raw.map((value) => Math.floor(value));
  const remainder = total - values.reduce((sum, value) => sum + value, 0);
  if (remainder <= 0) {
    return values;
  }

  const order = raw.map((value, index) => ({
    index,
    frac: value - Math.floor(value),
    rand: randomUnit(),
  }));
  order.sort((a, b) => b.frac - a.frac || a.rand - b.rand);

  for (let i = 0; i < remainder; i++) {
    values[order[i % count].index] += 1;
  }

  return values;
}

function randomUnit() {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto) {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0] / 0x100000000;
  }
  return Math.random();
}

function randomInt(min: number, max: number) {
  return Math.floor(randomUnit() * (max - min + 1)) + min;
}

function randomWeights(count: number) {
  return Array.from({ length: count }, () => {
    const u = Math.max(1e-9, randomUnit());
    return -Math.log(u);
  });
}

export class BPMNStatisticsController {
  readonly diagram: Diagram;

  dataset: BPMNStatisticsFileV1 | null = null;
  fileName = '';
  error = '';

  nodeMetric: BPMNMetric = 'throughput';
  edgeMetric: BPMNMetric = 'throughput';

  scaleMode: ScaleMode = 'linear';
  rangeMode: RangeMode = 'auto';

  manualMin = 0;
  manualMax = 100;

  lowColor = FALLBACK_LOW_COLOR;
  highColor = FALLBACK_HIGH_COLOR;
  reverseScale = false;
  nodeAlpha = 0.72;

  edgeMinWidth = 1.5;
  edgeMaxWidth = 6;

  matchedNodes = 0;
  unmatchedNodeStats = 0;
  matchedEdges = 0;
  unmatchedEdgeStats = 0;

  private readonly nodeSnapshots = new Map<string, NodeSnapshot>();
  private readonly edgeSnapshots = new Map<string, EdgeSnapshot>();

  constructor(diagram: Diagram) {
    this.diagram = diagram;

    makeAutoObservable(this, { diagram: false } as any, { autoBind: true });
  }

  get hasDataset() {
    return this.dataset !== null;
  }

  setNodeMetric(metric: BPMNMetric) {
    this.nodeMetric = metric;
    this.apply();
  }

  setEdgeMetric(metric: BPMNMetric) {
    this.edgeMetric = metric;
    this.apply();
  }

  setScaleMode(mode: ScaleMode) {
    this.scaleMode = mode;
    this.apply();
  }

  setRangeMode(mode: RangeMode) {
    this.rangeMode = mode;
    this.apply();
  }

  setManualMin(value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    this.manualMin = value;
    this.apply();
  }

  setManualMax(value: number) {
    if (!Number.isFinite(value)) {
      return;
    }
    this.manualMax = value;
    this.apply();
  }

  setLowColor(color: string) {
    this.lowColor = color;
    this.apply();
  }

  setHighColor(color: string) {
    this.highColor = color;
    this.apply();
  }

  setReverseScale(reverse: boolean) {
    this.reverseScale = reverse;
    this.apply();
  }

  setNodeAlpha(alpha: number) {
    if (!Number.isFinite(alpha)) {
      return;
    }
    this.nodeAlpha = clamp(alpha, 0, 1);
    this.apply();
  }

  setEdgeMinWidth(width: number) {
    if (!Number.isFinite(width)) {
      return;
    }
    this.edgeMinWidth = Math.max(0.5, width);
    this.apply();
  }

  setEdgeMaxWidth(width: number) {
    if (!Number.isFinite(width)) {
      return;
    }
    this.edgeMaxWidth = Math.max(0.5, width);
    this.apply();
  }

  async loadFromFile(file: File) {
    try {
      const text = await file.text();
      this.loadFromText(text, file.name);
    } catch {
      runInAction(() => {
        this.error = 'Unable to read the selected file.';
      });
    }
  }

  loadFromText(text: string, fileName = '') {
    try {
      const parsed = parseStatisticsFile(text);
      runInAction(() => {
        this.dataset = parsed;
        this.fileName = fileName;
        this.error = '';
      });
      this.apply();
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : 'Invalid statistics file.';
      });
    }
  }

  clear() {
    this.resetStyles();
    this.dataset = null;
    this.fileName = '';
    this.error = '';
    this.matchedNodes = 0;
    this.unmatchedNodeStats = 0;
    this.matchedEdges = 0;
    this.unmatchedEdgeStats = 0;
  }

  resetStyles() {
    for (const [id, snapshot] of this.nodeSnapshots) {
      const node = this.diagram.getNodeById(id);
      if (!node) {
        continue;
      }
      node.state.fill = snapshot.fill;
      node.state.stroke = snapshot.stroke;
    }

    for (const [id, snapshot] of this.edgeSnapshots) {
      const edge = this.diagram.getEdgeById(id);
      if (!edge) {
        continue;
      }
      edge.state.stroke = snapshot.stroke;
      edge.state.strokeWidth = snapshot.strokeWidth;
    }

    this.nodeSnapshots.clear();
    this.edgeSnapshots.clear();
  }

  dispose() {
    this.resetStyles();
  }

  downloadSampleFile() {
    const sample = this.buildSampleStatistics();
    downloadFile(
      JSON.stringify(sample, null, 2),
      'bpmn-statistics-sample.json',
      'application/json',
    );
  }

  randomizeStatistics() {
    const previousSignature = this.dataset
      ? this.toThroughputSignature(this.dataset)
      : '';

    let next = this.buildSampleStatistics();
    let attempts = 0;
    while (
      previousSignature &&
      this.toThroughputSignature(next) === previousSignature &&
      attempts < 10
    ) {
      next = this.buildSampleStatistics();
      attempts += 1;
    }

    this.dataset = next;
    this.fileName = 'random-generated';
    this.error = '';
    this.apply();
  }

  buildSampleStatistics(): BPMNStatisticsFileV1 {
    const nodes = this.diagram.nodes
      .filter(
        (node) => isFlowNode(node) && node.id.toLowerCase().startsWith('task'),
      )
      .sort((a, b) => a.id.localeCompare(b.id));

    const fallbackNodes = this.diagram.nodes
      .filter((node) => isFlowNode(node) && !nodes.includes(node))
      .sort((a, b) => a.id.localeCompare(b.id));

    const allNodes = [...nodes, ...fallbackNodes];

    const edgeStats = this.diagram.edges.map((edge): BPMNEdgeStat => {
      const edgeId = `${edge.from.parent.id}:${edge.from.id}->${edge.to.parent.id}:${edge.to.id}`;
      const durationSeed = hashString(`${edgeId}:duration`);
      const errorSeed = hashString(`${edgeId}:error`);
      return {
        fromNodeId: edge.from.parent.id,
        fromGatewayId: edge.from.id,
        toNodeId: edge.to.parent.id,
        toGatewayId: edge.to.id,
        throughput: 0,
        durationMs: 500 + (durationSeed % 4500),
        errorRate: Number((0.005 + (errorSeed % 180) / 1000).toFixed(3)),
      };
    });

    const incomingEdgeIndexes = new Map<string, number[]>();
    const outgoingEdgeIndexes = new Map<string, number[]>();

    edgeStats.forEach((edge, index) => {
      const incoming = incomingEdgeIndexes.get(edge.toNodeId) ?? [];
      incoming.push(index);
      incomingEdgeIndexes.set(edge.toNodeId, incoming);

      const outgoing = outgoingEdgeIndexes.get(edge.fromNodeId) ?? [];
      outgoing.push(index);
      outgoingEdgeIndexes.set(edge.fromNodeId, outgoing);
    });

    // Start with random throughput values.
    edgeStats.forEach((edge) => {
      edge.throughput = randomInt(20, 99);
    });

    const internalNodeIds = [
      ...new Set(edgeStats.flatMap((edge) => [edge.fromNodeId, edge.toNodeId])),
    ]
      .filter((nodeId) => {
        const incoming = incomingEdgeIndexes.get(nodeId)?.length ?? 0;
        const outgoing = outgoingEdgeIndexes.get(nodeId)?.length ?? 0;
        return incoming > 0 && outgoing > 0;
      });

    // Balance process throughput for intermediate nodes so sum(incoming) === sum(outgoing).
    for (let sweep = 0; sweep < 24; sweep++) {
      const sweepNodeIds = [...internalNodeIds];
      for (let i = sweepNodeIds.length - 1; i > 0; i--) {
        const j = Math.floor(randomUnit() * (i + 1));
        [sweepNodeIds[i], sweepNodeIds[j]] = [sweepNodeIds[j], sweepNodeIds[i]];
      }

      for (const nodeId of sweepNodeIds) {
        const incomingIndexes = incomingEdgeIndexes.get(nodeId) ?? [];
        const outgoingIndexes = outgoingEdgeIndexes.get(nodeId) ?? [];
        if (!incomingIndexes.length || !outgoingIndexes.length) {
          continue;
        }

        const incomingTotal = incomingIndexes.reduce(
          (sum, edgeIndex) => sum + (edgeStats[edgeIndex].throughput ?? 0),
          0,
        );
        const splitWeights = randomWeights(outgoingIndexes.length);
        const distribution = distributeIntegerTotal(
          incomingTotal,
          splitWeights,
        );

        outgoingIndexes.forEach((edgeIndex, distIndex) => {
          edgeStats[edgeIndex].throughput = distribution[distIndex];
        });
      }
    }

    const nodeStats = allNodes.map((node): BPMNNodeStat => {
      const incomingIndexes = incomingEdgeIndexes.get(node.id) ?? [];
      const outgoingIndexes = outgoingEdgeIndexes.get(node.id) ?? [];
      const incomingTotal = incomingIndexes.reduce(
        (sum, edgeIndex) => sum + (edgeStats[edgeIndex].throughput ?? 0),
        0,
      );
      const outgoingTotal = outgoingIndexes.reduce(
        (sum, edgeIndex) => sum + (edgeStats[edgeIndex].throughput ?? 0),
        0,
      );
      const durationSeed = hashString(`${node.id}:duration`);
      const errorSeed = hashString(`${node.id}:error`);

      return {
        nodeId: node.id,
        throughput:
          incomingIndexes.length > 0 && outgoingIndexes.length > 0
            ? incomingTotal
            : Math.max(incomingTotal, outgoingTotal),
        durationMs: 600 + (durationSeed % 5000),
        errorRate: Number((0.01 + (errorSeed % 220) / 1000).toFixed(3)),
      };
    });

    return {
      version: 1,
      nodes: nodeStats,
      edges: edgeStats,
    };
  }

  apply() {
    if (!this.dataset) {
      return;
    }

    this.captureBaseStyles();
    this.restoreBaseStyles();

    const nodePalette = paletteByMetric(
      this.nodeMetric,
      this.lowColor,
      this.highColor,
    );
    const edgePalette = paletteByMetric(
      this.edgeMetric,
      this.lowColor,
      this.highColor,
    );
    const nodeLowRgb =
      hexColorToRgb(nodePalette.low) ?? hexColorToRgb(FALLBACK_LOW_COLOR)!;
    const nodeHighRgb =
      hexColorToRgb(nodePalette.high) ?? hexColorToRgb(FALLBACK_HIGH_COLOR)!;
    const edgeLowRgb =
      hexColorToRgb(edgePalette.low) ?? hexColorToRgb(FALLBACK_LOW_COLOR)!;
    const edgeHighRgb =
      hexColorToRgb(edgePalette.high) ?? hexColorToRgb(FALLBACK_HIGH_COLOR)!;

    const nodeIndex = new Map<string, NodeEntry>();
    this.dataset.nodes.forEach((stat, index) => {
      nodeIndex.set(stat.nodeId, { stat, index });
    });

    const edgeExactIndex = new Map<string, EdgeEntry>();
    const edgeLooseIndex = new Map<string, EdgeEntry[]>();

    this.dataset.edges.forEach((stat, index) => {
      if (stat.fromGatewayId && stat.toGatewayId) {
        edgeExactIndex.set(
          toExactEdgeKey(
            stat.fromNodeId,
            stat.fromGatewayId,
            stat.toNodeId,
            stat.toGatewayId,
          ),
          { stat, index },
        );
      }

      const looseKey = toLooseEdgeKey(stat.fromNodeId, stat.toNodeId);
      const list = edgeLooseIndex.get(looseKey) ?? [];
      list.push({ stat, index });
      edgeLooseIndex.set(looseKey, list);
    });

    const usedNodeStatIndexes = new Set<number>();
    const usedEdgeStatIndexes = new Set<number>();

    const matchedNodes: Array<{ node: Node<any>; value: number }> = [];
    const matchedEdges: Array<{ edge: Edge; value: number }> = [];

    for (const node of this.diagram.nodes) {
      if (!isFlowNode(node)) {
        continue;
      }

      const nodeEntry = nodeIndex.get(node.id);
      if (!nodeEntry) {
        continue;
      }
      usedNodeStatIndexes.add(nodeEntry.index);

      const value = readMetricValue(nodeEntry.stat, this.nodeMetric);
      if (value !== undefined) {
        matchedNodes.push({ node, value });
      }
    }

    for (const edge of this.diagram.edges) {
      const edgeEntry = resolveEdgeEntry(edge, edgeExactIndex, edgeLooseIndex);
      if (!edgeEntry) {
        continue;
      }
      usedEdgeStatIndexes.add(edgeEntry.index);

      const value = readMetricValue(edgeEntry.stat, this.edgeMetric);
      if (value !== undefined) {
        matchedEdges.push({ edge, value });
      }
    }

    const nodeRange = this.resolveRange(
      matchedNodes.map((entry) => entry.value),
    );
    const edgeRange = this.resolveRange(
      matchedEdges.map((entry) => entry.value),
    );

    if (nodeRange) {
      for (const entry of matchedNodes) {
        const intensity = this.toIntensity(
          entry.value,
          nodeRange.min,
          nodeRange.max,
        );
        const mixed = mixRgb(nodeLowRgb, nodeHighRgb, intensity);
        entry.node.state.stroke = rgbString(mixed);
        entry.node.state.fill = rgbaString(mixed, this.nodeAlpha);
      }
    }

    const minEdgeWidth = Math.max(
      0.5,
      Math.min(this.edgeMinWidth, this.edgeMaxWidth),
    );
    const maxEdgeWidth = Math.max(
      minEdgeWidth,
      Math.max(this.edgeMinWidth, this.edgeMaxWidth),
    );

    if (edgeRange) {
      for (const entry of matchedEdges) {
        const intensity = this.toIntensity(
          entry.value,
          edgeRange.min,
          edgeRange.max,
        );
        const mixed = mixRgb(edgeLowRgb, edgeHighRgb, intensity);
        entry.edge.state.stroke = rgbString(mixed);
        entry.edge.state.strokeWidth =
          minEdgeWidth + (maxEdgeWidth - minEdgeWidth) * intensity;
      }
    }

    this.matchedNodes = matchedNodes.length;
    this.unmatchedNodeStats = Math.max(
      0,
      this.dataset.nodes.length - usedNodeStatIndexes.size,
    );
    this.matchedEdges = matchedEdges.length;
    this.unmatchedEdgeStats = Math.max(
      0,
      this.dataset.edges.length - usedEdgeStatIndexes.size,
    );
  }

  private captureBaseStyles() {
    for (const node of this.diagram.nodes) {
      if (!this.nodeSnapshots.has(node.id)) {
        this.nodeSnapshots.set(node.id, {
          fill: node.state.fill,
          stroke: node.state.stroke,
        });
      }
    }

    for (const edge of this.diagram.edges) {
      if (!this.edgeSnapshots.has(edge.id)) {
        this.edgeSnapshots.set(edge.id, {
          stroke: edge.state.stroke,
          strokeWidth: edge.state.strokeWidth,
        });
      }
    }
  }

  private restoreBaseStyles() {
    for (const [id, snapshot] of this.nodeSnapshots) {
      const node = this.diagram.getNodeById(id);
      if (!node) {
        continue;
      }
      node.state.fill = snapshot.fill;
      node.state.stroke = snapshot.stroke;
    }

    for (const [id, snapshot] of this.edgeSnapshots) {
      const edge = this.diagram.getEdgeById(id);
      if (!edge) {
        continue;
      }
      edge.state.stroke = snapshot.stroke;
      edge.state.strokeWidth = snapshot.strokeWidth;
    }
  }

  private resolveRange(values: number[]) {
    if (this.rangeMode === 'manual') {
      return {
        min: Math.min(this.manualMin, this.manualMax),
        max: Math.max(this.manualMin, this.manualMax),
      };
    }

    if (!values.length) {
      return null;
    }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  private toIntensity(value: number, min: number, max: number) {
    if (max <= min) {
      return this.reverseScale ? 0 : 1;
    }

    let normalized = clamp((value - min) / (max - min), 0, 1);

    if (this.scaleMode === 'log') {
      normalized = Math.log10(1 + normalized * 9);
    }

    if (this.reverseScale) {
      normalized = 1 - normalized;
    }

    return clamp(normalized, 0, 1);
  }

  private toThroughputSignature(dataset: BPMNStatisticsFileV1) {
    const edgePart = dataset.edges
      .map(
        (edge) =>
          `${edge.fromNodeId}:${edge.fromGatewayId ?? ''}->${edge.toNodeId}:${edge.toGatewayId ?? ''}=${edge.throughput ?? ''}`,
      )
      .join('|');
    const nodePart = dataset.nodes
      .map((node) => `${node.nodeId}=${node.throughput ?? ''}`)
      .join('|');
    return `${edgePart}::${nodePart}`;
  }
}
