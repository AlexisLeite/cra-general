import type { TOrientation } from '../../store/types';

export type BPMNBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type BPMNWaypoint = {
  x: number;
  y: number;
};

export type ParsedBPMNFlowNode = {
  id: string;
  name: string;
  type: string;
  processId: string;
};

export type ParsedBPMNSequenceFlow = {
  id: string;
  name: string;
  sourceRef: string;
  targetRef: string;
  processId: string;
};

export type ParsedBPMNLane = {
  id: string;
  name: string;
  flowNodeRefs: string[];
  processId: string;
};

export type ParsedBPMNProcess = {
  id: string;
  name: string;
  flowNodes: ParsedBPMNFlowNode[];
  sequenceFlows: ParsedBPMNSequenceFlow[];
  lanes: ParsedBPMNLane[];
};

export type ParsedBPMNParticipant = {
  id: string;
  name: string;
  processRef: string;
};

export type ParsedBPMNUnsupportedLink = {
  id: string;
  sourceRef: string;
  targetRef: string;
  type: string;
};

export type ParsedBPMNModel = {
  processes: ParsedBPMNProcess[];
  participants: ParsedBPMNParticipant[];
  shapes: Map<string, BPMNBounds>;
  edges: Map<string, BPMNWaypoint[]>;
  unsupportedLinks: ParsedBPMNUnsupportedLink[];
  warnings: string[];
};

export type BPMNNodeClassName =
  | 'TaskNode'
  | 'EventNode'
  | 'GateNode'
  | 'UnknownBPMNNode';

export type BPMNImportLanePlan = {
  id: string;
  processId: string;
  participantId: string | null;
  box: BPMNBounds;
  poolLabels: string[];
};

export type BPMNImportNodePlan = {
  bpmnId: string;
  processId: string;
  id: string;
  label: string;
  className: BPMNNodeClassName;
  box: BPMNBounds;
  laneIndex: number;
  bpmnType: string;
  eventType?: number;
  gateType?: number;
  sourceType?: string;
};

export type BPMNImportEdgePlan = {
  bpmnId: string;
  processId: string;
  fromBpmnId: string;
  toBpmnId: string;
  fromNodeId: string;
  toNodeId: string;
  fromOrientation: TOrientation;
  toOrientation: TOrientation;
  waypoints: BPMNWaypoint[] | null;
};

export type BPMNImportPlan = {
  lanes: BPMNImportLanePlan[];
  nodes: BPMNImportNodePlan[];
  edges: BPMNImportEdgePlan[];
  warnings: string[];
};

export type BPMNImportSummary = {
  nodes: number;
  edges: number;
  lanes: number;
};

export type BPMNApplyImportResult = {
  summary: BPMNImportSummary;
  warnings: string[];
};
