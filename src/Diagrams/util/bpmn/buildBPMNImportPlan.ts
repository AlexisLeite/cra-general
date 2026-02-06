import type { TOrientation } from '../../store/types';
import type {
  BPMNBounds,
  BPMNImportEdgePlan,
  BPMNImportLanePlan,
  BPMNImportNodePlan,
  BPMNImportPlan,
  BPMNWaypoint,
  ParsedBPMNFlowNode,
  ParsedBPMNModel,
  ParsedBPMNParticipant,
  ParsedBPMNProcess,
  ParsedBPMNSequenceFlow,
} from './types';

const COLUMN_GAP = 320;
const ROW_GAP = 160;
const BASE_ORIGIN_X = 120;
const BASE_ORIGIN_Y = 120;
const MAX_COLUMNS = 5;
const LANE_HEIGHT = 250;
const LANE_PADDING = 25;

const EVENT_TYPE_START = 0;
const EVENT_TYPE_END = 1;
const GATE_TYPE_INCLUSIVE = 0;
const GATE_TYPE_EXCLUSIVE = 1;
const GATE_TYPE_PARALLEL = 2;

const TASK_NODE_TYPES = new Set([
  'businessRuleTask',
  'callActivity',
  'manualTask',
  'receiveTask',
  'scriptTask',
  'sendTask',
  'serviceTask',
  'subProcess',
  'task',
  'transaction',
  'userTask',
]);

type NodeMapping = Pick<
  BPMNImportNodePlan,
  'className' | 'eventType' | 'gateType' | 'sourceType'
> & {
  defaultWidth: number;
  defaultHeight: number;
  warning?: string;
};

type ProcessContainer = {
  process: ParsedBPMNProcess;
  participant: ParsedBPMNParticipant | null;
  participantBounds: BPMNBounds | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isFiniteWaypoint(point: BPMNWaypoint) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function normalizeBounds(
  bounds: BPMNBounds,
  fallbackWidth: number,
  fallbackHeight: number,
) {
  return {
    x: Number.isFinite(bounds.x) ? bounds.x : 0,
    y: Number.isFinite(bounds.y) ? bounds.y : 0,
    width:
      Number.isFinite(bounds.width) && bounds.width > 0
        ? bounds.width
        : fallbackWidth,
    height:
      Number.isFinite(bounds.height) && bounds.height > 0
        ? bounds.height
        : fallbackHeight,
  };
}

function toCenter(bounds: BPMNBounds) {
  return {
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
  };
}

function orientationFromPoints(
  from: { x: number; y: number },
  to: { x: number; y: number },
): TOrientation {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'right' : 'left';
  }

  return dy >= 0 ? 'down' : 'up';
}

function oppositeOrientation(orientation: TOrientation): TOrientation {
  switch (orientation) {
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
    case 'up':
      return 'down';
  }
}

function dedupeId(raw: string, used: Set<string>, fallbackPrefix: string) {
  const base = sanitizeId(raw, fallbackPrefix);
  if (!used.has(base)) {
    used.add(base);
    return base;
  }

  let suffix = 1;
  while (used.has(`${base}-${suffix}`)) {
    suffix++;
  }

  const value = `${base}-${suffix}`;
  used.add(value);
  return value;
}

function compareById<T extends { id: string }>(a: T, b: T) {
  return a.id.localeCompare(b.id);
}

function mapFlowNodeToNode(flowNode: ParsedBPMNFlowNode): NodeMapping {
  if (TASK_NODE_TYPES.has(flowNode.type)) {
    return {
      className: 'TaskNode',
      defaultWidth: 200,
      defaultHeight: 100,
    };
  }

  if (flowNode.type === 'startEvent') {
    return {
      className: 'EventNode',
      defaultWidth: 80,
      defaultHeight: 80,
      eventType: EVENT_TYPE_START,
    };
  }

  if (flowNode.type === 'endEvent') {
    return {
      className: 'EventNode',
      defaultWidth: 80,
      defaultHeight: 80,
      eventType: EVENT_TYPE_END,
    };
  }

  if (flowNode.type === 'exclusiveGateway') {
    return {
      className: 'GateNode',
      defaultWidth: 80,
      defaultHeight: 80,
      gateType: GATE_TYPE_EXCLUSIVE,
    };
  }

  if (flowNode.type === 'inclusiveGateway') {
    return {
      className: 'GateNode',
      defaultWidth: 80,
      defaultHeight: 80,
      gateType: GATE_TYPE_INCLUSIVE,
    };
  }

  if (flowNode.type === 'parallelGateway') {
    return {
      className: 'GateNode',
      defaultWidth: 80,
      defaultHeight: 80,
      gateType: GATE_TYPE_PARALLEL,
    };
  }

  return {
    className: 'UnknownBPMNNode',
    defaultWidth: 200,
    defaultHeight: 100,
    sourceType: flowNode.type,
    warning: `Unsupported BPMN node '${flowNode.type}' (${flowNode.id}) was mapped to UnknownBPMNNode.`,
  };
}

function resolveProcessContainers(parsed: ParsedBPMNModel) {
  const processById = new Map(
    parsed.processes.map((process) => [process.id, process]),
  );
  const containers: ProcessContainer[] = [];
  const linkedProcessIds = new Set<string>();

  const participants = [...parsed.participants].sort(compareById);
  participants.forEach((participant) => {
    const process = processById.get(participant.processRef);
    if (!process) {
      return;
    }

    linkedProcessIds.add(process.id);
    containers.push({
      process,
      participant,
      participantBounds: parsed.shapes.get(participant.id) || null,
    });
  });

  parsed.processes
    .filter((process) => !linkedProcessIds.has(process.id))
    .sort(compareById)
    .forEach((process) => {
      containers.push({
        process,
        participant: null,
        participantBounds: null,
      });
    });

  return containers;
}

function resolveLaneOrder(
  process: ParsedBPMNProcess,
  shapes: Map<string, BPMNBounds>,
) {
  const lanes = [...process.lanes];
  if (!lanes.length) {
    return [
      {
        id: `${process.id}__default_lane`,
        name: 'Default',
        flowNodeRefs: [],
        processId: process.id,
      },
    ];
  }

  return lanes
    .map((lane, index) => ({
      lane,
      index,
      y: shapes.get(lane.id)?.y,
    }))
    .sort((a, b) => {
      const hasAY = typeof a.y === 'number';
      const hasBY = typeof b.y === 'number';
      if (hasAY && hasBY) {
        return a.y! - b.y!;
      }
      if (hasAY) {
        return -1;
      }
      if (hasBY) {
        return 1;
      }
      return a.index - b.index;
    })
    .map((entry) => entry.lane);
}

function resolveLaneBounds(
  participantBounds: BPMNBounds | null,
  orderedLanes: ParsedBPMNProcess['lanes'],
  shapes: Map<string, BPMNBounds>,
) {
  if (participantBounds) {
    return {
      x: participantBounds.x,
      y: participantBounds.y - LANE_PADDING,
      width: participantBounds.width,
      height: orderedLanes.length * LANE_HEIGHT + LANE_PADDING * 2,
    };
  }

  const laneShapes = orderedLanes
    .map((lane) => shapes.get(lane.id))
    .filter((shape): shape is BPMNBounds => shape !== undefined);

  if (laneShapes.length) {
    const minX = Math.min(...laneShapes.map((shape) => shape.x));
    const minY = Math.min(...laneShapes.map((shape) => shape.y));
    const maxX = Math.max(...laneShapes.map((shape) => shape.x + shape.width));

    return {
      x: minX,
      y: minY - LANE_PADDING,
      width: maxX - minX,
      height: orderedLanes.length * LANE_HEIGHT + LANE_PADDING * 2,
    };
  }

  return {
    x: 80,
    y: 95,
    width: 1200,
    height: orderedLanes.length * LANE_HEIGHT + LANE_PADDING * 2,
  };
}

function normalizePoolLabels(orderedLanes: ParsedBPMNProcess['lanes']) {
  if (!orderedLanes.length) {
    return ['Default'];
  }

  return orderedLanes.map((lane) => {
    const trimmed = lane.name.trim();
    return trimmed || 'Default';
  });
}

function buildLaneIndexByFlowNode(orderedLanes: ParsedBPMNProcess['lanes']) {
  const laneIndexByFlowNode = new Map<string, number>();
  orderedLanes.forEach((lane, index) => {
    lane.flowNodeRefs.forEach((flowNodeRef) => {
      if (!laneIndexByFlowNode.has(flowNodeRef)) {
        laneIndexByFlowNode.set(flowNodeRef, index);
      }
    });
  });
  return laneIndexByFlowNode;
}

function assignFallbackLayout(
  nodesWithoutDi: BPMNImportNodePlan[],
  lanePlan: BPMNImportLanePlan,
) {
  const byLane = new Map<number, BPMNImportNodePlan[]>();

  nodesWithoutDi.forEach((node) => {
    const list = byLane.get(node.laneIndex) || [];
    list.push(node);
    byLane.set(node.laneIndex, list);
  });

  byLane.forEach((nodes, laneIndex) => {
    nodes.sort((a, b) => a.bpmnId.localeCompare(b.bpmnId));

    nodes.forEach((node, index) => {
      const col = index % MAX_COLUMNS;
      const row = Math.floor(index / MAX_COLUMNS);

      node.box.x = lanePlan.box.x + BASE_ORIGIN_X + col * COLUMN_GAP;
      node.box.y =
        lanePlan.box.y +
        LANE_PADDING +
        laneIndex * LANE_HEIGHT +
        BASE_ORIGIN_Y +
        row * ROW_GAP;
    });
  });
}

function ensureLaneWidth(
  lanePlan: BPMNImportLanePlan,
  nodes: BPMNImportNodePlan[],
) {
  if (!nodes.length) {
    lanePlan.box.width = Math.max(400, lanePlan.box.width);
    return;
  }

  const rightMost = Math.max(
    ...nodes.map((node) => node.box.x + node.box.width),
  );
  lanePlan.box.width = Math.max(
    400,
    lanePlan.box.width,
    rightMost - lanePlan.box.x + BASE_ORIGIN_X,
  );
}

function resolveFlowOrientation(
  sourceBounds: BPMNBounds,
  targetBounds: BPMNBounds,
  waypoints: BPMNWaypoint[] | null,
) {
  if (waypoints && waypoints.length >= 2) {
    const sourceDirection = orientationFromPoints(waypoints[0], waypoints[1]);
    const targetDirection = oppositeOrientation(
      orientationFromPoints(
        waypoints[waypoints.length - 2],
        waypoints[waypoints.length - 1],
      ),
    );
    return {
      fromOrientation: sourceDirection,
      toOrientation: targetDirection,
    };
  }

  const centerSource = toCenter(sourceBounds);
  const centerTarget = toCenter(targetBounds);
  const fromOrientation = orientationFromPoints(centerSource, centerTarget);

  return {
    fromOrientation,
    toOrientation: oppositeOrientation(fromOrientation),
  };
}

function resolveEdgeWaypoints(
  flow: ParsedBPMNSequenceFlow,
  parsed: ParsedBPMNModel,
  warnings: string[],
) {
  const raw = parsed.edges.get(flow.id);
  if (!raw) {
    return null;
  }

  const valid = raw.filter(isFiniteWaypoint);
  if (valid.length < 2) {
    warnings.push(
      `Sequence flow '${flow.id}' has invalid BPMN DI waypoints and was auto-routed.`,
    );
    return null;
  }

  return valid.map((point) => ({ x: point.x, y: point.y }));
}

export function sanitizeId(raw: string, fallbackPrefix: string) {
  const normalized = raw
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallbackPrefix;
}

export function buildBPMNImportPlan(parsed: ParsedBPMNModel): BPMNImportPlan {
  const warnings = [...parsed.warnings];
  const lanes: BPMNImportLanePlan[] = [];
  const nodes: BPMNImportNodePlan[] = [];
  const edges: BPMNImportEdgePlan[] = [];
  const usedDiagramIds = new Set<string>();
  const nodeIdByBpmnId = new Map<string, string>();
  const nodeBoundsByBpmnId = new Map<string, BPMNBounds>();

  const containers = resolveProcessContainers(parsed);

  containers.forEach((container) => {
    const orderedLanes = resolveLaneOrder(container.process, parsed.shapes);
    const laneBounds = resolveLaneBounds(
      container.participantBounds,
      orderedLanes,
      parsed.shapes,
    );

    const lanePlan: BPMNImportLanePlan = {
      id: dedupeId(
        container.participant?.id || `${container.process.id}-lanes`,
        usedDiagramIds,
        'lane',
      ),
      participantId: container.participant?.id || null,
      processId: container.process.id,
      box: {
        x: laneBounds.x,
        y: laneBounds.y,
        width: laneBounds.width,
        height: laneBounds.height,
      },
      poolLabels: normalizePoolLabels(orderedLanes),
    };

    lanes.push(lanePlan);

    const laneIndexByFlowNode = buildLaneIndexByFlowNode(orderedLanes);
    const nodesWithoutDi: BPMNImportNodePlan[] = [];

    const processFlowNodes = [...container.process.flowNodes].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    processFlowNodes.forEach((flowNode) => {
      if (nodeIdByBpmnId.has(flowNode.id)) {
        warnings.push(
          `Duplicate BPMN flow node id '${flowNode.id}' detected. Only the first occurrence was imported.`,
        );
        return;
      }

      const mapping = mapFlowNodeToNode(flowNode);
      if (mapping.warning) {
        warnings.push(mapping.warning);
      }

      const laneIndex = clamp(
        laneIndexByFlowNode.get(flowNode.id) || 0,
        0,
        Math.max(0, lanePlan.poolLabels.length - 1),
      );

      const shapeBounds = parsed.shapes.get(flowNode.id);
      const box = normalizeBounds(
        shapeBounds || {
          x: 0,
          y: 0,
          width: mapping.defaultWidth,
          height: mapping.defaultHeight,
        },
        mapping.defaultWidth,
        mapping.defaultHeight,
      );

      const nodePlan: BPMNImportNodePlan = {
        bpmnId: flowNode.id,
        processId: flowNode.processId,
        id: dedupeId(flowNode.id, usedDiagramIds, 'node'),
        label: flowNode.name.trim() || flowNode.id,
        className: mapping.className,
        box,
        laneIndex,
        bpmnType: flowNode.type,
        eventType: mapping.eventType,
        gateType: mapping.gateType,
        sourceType: mapping.sourceType,
      };

      nodeIdByBpmnId.set(flowNode.id, nodePlan.id);
      nodeBoundsByBpmnId.set(flowNode.id, nodePlan.box);

      if (shapeBounds) {
        nodes.push(nodePlan);
      } else {
        nodesWithoutDi.push(nodePlan);
      }
    });

    assignFallbackLayout(nodesWithoutDi, lanePlan);
    nodesWithoutDi.forEach((nodePlan) => {
      nodeBoundsByBpmnId.set(nodePlan.bpmnId, nodePlan.box);
      nodes.push(nodePlan);
    });

    const processNodes = nodes.filter(
      (node) => node.processId === container.process.id,
    );

    if (!container.participantBounds) {
      ensureLaneWidth(lanePlan, processNodes);
    }
  });

  parsed.processes.forEach((process) => {
    const processEdges = [...process.sequenceFlows].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    processEdges.forEach((flow) => {
      const fromNodeId = nodeIdByBpmnId.get(flow.sourceRef);
      const toNodeId = nodeIdByBpmnId.get(flow.targetRef);
      const fromBounds = nodeBoundsByBpmnId.get(flow.sourceRef);
      const toBounds = nodeBoundsByBpmnId.get(flow.targetRef);

      if (!fromNodeId || !toNodeId || !fromBounds || !toBounds) {
        warnings.push(
          `Skipping sequence flow '${flow.id}' because source or target node was not imported.`,
        );
        return;
      }

      const waypoints = resolveEdgeWaypoints(flow, parsed, warnings);
      const orientation = resolveFlowOrientation(
        fromBounds,
        toBounds,
        waypoints,
      );

      edges.push({
        bpmnId: flow.id,
        processId: flow.processId,
        fromBpmnId: flow.sourceRef,
        toBpmnId: flow.targetRef,
        fromNodeId,
        toNodeId,
        fromOrientation: orientation.fromOrientation,
        toOrientation: orientation.toOrientation,
        waypoints,
      });
    });
  });

  parsed.unsupportedLinks.forEach((link) => {
    warnings.push(
      `Skipping unsupported link type '${link.type}' (${link.id}).`,
    );
  });

  return {
    lanes,
    nodes,
    edges,
    warnings,
  };
}
