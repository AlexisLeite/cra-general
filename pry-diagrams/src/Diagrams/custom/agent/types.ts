import type { TOrientation } from '../../store/types';

export type AgentNodeKind = 'trigger' | 'action' | 'condition' | 'outcome';

export type AgentEdgeKind =
  | 'default'
  | 'condition-true'
  | 'condition-false'
  | 'trigger';

export type AgentMetadata = Record<string, string | number | boolean>;

export type TriggerPayload = {
  triggerType: 'manual' | 'event' | 'schedule';
  source: string;
  eventName: string;
  schedule: string;
  metadata?: AgentMetadata;
};

export type ActionPayload = {
  actionType: 'task' | 'api' | 'notification' | 'human';
  operation: string;
  inputRef: string;
  outputRef: string;
  metadata?: AgentMetadata;
};

export type ConditionPayload = {
  expression: string;
  language: 'rule' | 'javascript' | 'jsonpath';
  trueLabel: string;
  falseLabel: string;
  metadata?: AgentMetadata;
};

export type OutcomePayload = {
  status: 'success' | 'failure' | 'neutral';
  code: string;
  summary: string;
  metadata?: AgentMetadata;
};

export type AgentPayloadByKind = {
  trigger: TriggerPayload;
  action: ActionPayload;
  condition: ConditionPayload;
  outcome: OutcomePayload;
};

export type AgentPayload = AgentPayloadByKind[AgentNodeKind];

export type AgentCreateNodeInput<K extends AgentNodeKind = AgentNodeKind> = {
  kind: K;
  label?: string;
  payload?: Partial<AgentPayloadByKind[K]>;
};

export type AgentConnectInput = {
  fromNodeId: string;
  toNodeId: string;
  fromGateway?: TOrientation;
  toGateway?: TOrientation;
  kind?: AgentEdgeKind;
};

export type AgentTemplateResult = {
  nodeIds: string[];
  edgeIds: string[];
};
