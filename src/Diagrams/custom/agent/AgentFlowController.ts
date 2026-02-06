import { makeAutoObservable } from 'mobx';
import type { Diagram } from '../../store/Diagram';
import { Selector } from '../../store/extensions/Selector';
import type { TOrientation } from '../../store/types';
import { cloneDeep } from '../../util/cloneDeep';
import { getIdForNode } from '../../util/getIdForNode';
import { Coordinates } from '../../store/primitives/Coordinates';
import { AgentEdge } from './edges/AgentEdge';
import { ActionNode } from './nodes/ActionNode';
import { type AgentNode, isAgentNode } from './nodes/AgentNode';
import { ConditionNode } from './nodes/ConditionNode';
import { OutcomeNode } from './nodes/OutcomeNode';
import { TriggerNode } from './nodes/TriggerNode';
import type {
  AgentConnectInput,
  AgentCreateNodeInput,
  AgentEdgeKind,
  AgentNodeKind,
  AgentPayload,
  AgentPayloadByKind,
  AgentTemplateResult,
} from './types';

type AgentNodeCreationInput<K extends AgentNodeKind = AgentNodeKind> =
  AgentCreateNodeInput<K> & {
    position?: Coordinates;
    centered?: boolean;
    select?: boolean;
  };

type ChainTemplateInput = {
  anchor?: Coordinates;
  steps?: AgentNodeKind[];
  labels?: string[];
};

const DEFAULT_CHAIN: AgentNodeKind[] = ['trigger', 'action', 'outcome'];

function defaultLabelForKind(kind: AgentNodeKind, id: string) {
  const suffix = id.replace(/^\D+/, '');

  switch (kind) {
    case 'trigger':
      return `Trigger ${suffix || id}`;
    case 'condition':
      return `Condition ${suffix || id}`;
    case 'outcome':
      return `Outcome ${suffix || id}`;
    case 'action':
    default:
      return `Action ${suffix || id}`;
  }
}

export class AgentFlowController {
  readonly diagram: Diagram;

  horizontalGap = 260;
  verticalGap = 180;

  constructor(diagram: Diagram) {
    this.diagram = diagram;

    makeAutoObservable(this, { diagram: false } as any, {
      autoBind: true,
    });
  }

  get selectedAgentNodes() {
    const selector = this.diagram.getExtension(Selector);
    return selector.selectedNodes.filter((node) => isAgentNode(node));
  }

  setHorizontalGap(value: number) {
    if (!Number.isFinite(value)) {
      return;
    }

    this.horizontalGap = Math.max(120, Math.round(value));
  }

  setVerticalGap(value: number) {
    if (!Number.isFinite(value)) {
      return;
    }

    this.verticalGap = Math.max(80, Math.round(value));
  }

  createNode<K extends AgentNodeKind>(input: AgentNodeCreationInput<K>) {
    const id = getIdForNode(this.diagram, input.kind);
    const node = this.buildNode(input.kind, {
      id,
      label: input.label ?? defaultLabelForKind(input.kind, id),
      payload: input.payload,
    });

    this.diagram.add(node);

    const anchor = input.position?.copy() ?? this.resolveTemplateAnchor();
    const position =
      input.centered === false
        ? anchor
        : anchor.copy().substract(node.box.size.copy().divide(2));

    node.setPosition(this.snapPosition(position));

    if (input.select !== false) {
      this.selectNodes([node]);
    }

    return node;
  }

  connect(input: AgentConnectInput) {
    const fromNode = this.diagram.getNodeById(input.fromNodeId);
    const toNode = this.diagram.getNodeById(input.toNodeId);

    if (!isAgentNode(fromNode) || !isAgentNode(toNode)) {
      return null;
    }

    const fromGateway = fromNode.getGateway(input.fromGateway ?? 'right');
    const toGateway = toNode.getGateway(input.toGateway ?? 'left');

    if (!fromGateway || !toGateway) {
      return null;
    }

    const edge = this.diagram.connect(fromGateway, toGateway) as AgentEdge;
    const kind = input.kind ?? this.defaultConnectionKind(fromNode.kind);

    if (edge instanceof AgentEdge) {
      edge.setKind(kind);
    }

    return edge;
  }

  createChainTemplate(options: ChainTemplateInput = {}): AgentTemplateResult {
    const steps = options.steps?.length ? options.steps : DEFAULT_CHAIN;
    const anchor = options.anchor?.copy() ?? this.resolveTemplateAnchor();
    const nodes: AgentNode<unknown>[] = [];
    const edges: AgentEdge[] = [];

    steps.forEach((kind, index) => {
      const node = this.createNode({
        kind,
        label: options.labels?.[index],
        position: anchor.copy().sum([index * this.horizontalGap, 0]),
        select: false,
      });
      nodes.push(node);
    });

    for (let i = 0; i < nodes.length - 1; i++) {
      const edge = this.connect({
        fromNodeId: nodes[i].id,
        toNodeId: nodes[i + 1].id,
        fromGateway: 'right',
        toGateway: 'left',
        kind: this.defaultConnectionKind(nodes[i].kind),
      });

      if (edge instanceof AgentEdge) {
        edges.push(edge);
      }
    }

    this.selectNodes(nodes);
    return this.toTemplateResult(nodes, edges);
  }

  createTriggerOutcomeTemplate(anchor?: Coordinates): AgentTemplateResult {
    return this.createChainTemplate({
      anchor,
      steps: DEFAULT_CHAIN,
      labels: ['Trigger', 'Action', 'Outcome'],
    });
  }

  createConditionalTemplate(anchor?: Coordinates): AgentTemplateResult {
    const center = anchor?.copy() ?? this.resolveTemplateAnchor();
    const branchOffset = Math.max(110, Math.round(this.verticalGap * 0.85));

    const trigger = this.createNode({
      kind: 'trigger',
      label: 'Trigger',
      position: center.copy().substract([this.horizontalGap, 0]),
      select: false,
    });
    const condition = this.createNode({
      kind: 'condition',
      label: 'Condition',
      position: center,
      select: false,
    });
    const trueAction = this.createNode({
      kind: 'action',
      label: 'True Action',
      position: center.copy().sum([this.horizontalGap, -branchOffset]),
      select: false,
    });
    const falseAction = this.createNode({
      kind: 'action',
      label: 'False Action',
      position: center.copy().sum([this.horizontalGap, branchOffset]),
      select: false,
    });
    const trueOutcome = this.createNode({
      kind: 'outcome',
      label: 'True Outcome',
      position: center.copy().sum([this.horizontalGap * 2, -branchOffset]),
      select: false,
    });
    const falseOutcome = this.createNode({
      kind: 'outcome',
      label: 'False Outcome',
      position: center.copy().sum([this.horizontalGap * 2, branchOffset]),
      select: false,
    });

    const nodes = [
      trigger,
      condition,
      trueAction,
      falseAction,
      trueOutcome,
      falseOutcome,
    ];

    const edges: AgentEdge[] = [];

    const createdEdges = [
      this.connect({
        fromNodeId: trigger.id,
        toNodeId: condition.id,
        fromGateway: 'right',
        toGateway: 'left',
        kind: 'trigger',
      }),
      this.connect({
        fromNodeId: condition.id,
        toNodeId: trueAction.id,
        ...this.getGatewaysForConditionBranch(true),
        kind: 'condition-true',
      }),
      this.connect({
        fromNodeId: condition.id,
        toNodeId: falseAction.id,
        ...this.getGatewaysForConditionBranch(false),
        kind: 'condition-false',
      }),
      this.connect({
        fromNodeId: trueAction.id,
        toNodeId: trueOutcome.id,
        fromGateway: 'right',
        toGateway: 'left',
        kind: 'default',
      }),
      this.connect({
        fromNodeId: falseAction.id,
        toNodeId: falseOutcome.id,
        fromGateway: 'right',
        toGateway: 'left',
        kind: 'default',
      }),
    ];

    createdEdges.forEach((edge) => {
      if (edge instanceof AgentEdge) {
        edges.push(edge);
      }
    });

    this.selectNodes(nodes);
    return this.toTemplateResult(nodes, edges);
  }

  updateNodeLabel(nodeId: string, label: string) {
    const node = this.diagram.getNodeById(nodeId);
    if (!isAgentNode(node)) {
      return;
    }

    node.setState('label', label);
  }

  updateNodePayload(nodeId: string, patch: Partial<AgentPayload>) {
    const node = this.diagram.getNodeById(nodeId);
    if (!isAgentNode(node)) {
      return;
    }

    node.updatePayload(patch);
  }

  getNodePayload<K extends AgentNodeKind>(nodeId: string) {
    const node = this.diagram.getNodeById(nodeId);
    if (!isAgentNode(node)) {
      return null;
    }

    return cloneDeep(node.payload) as AgentPayloadByKind[K];
  }

  dispose() {
    /* reserved for future subscriptions */
  }

  private toTemplateResult(
    nodes: AgentNode<unknown>[],
    edges: AgentEdge[],
  ): AgentTemplateResult {
    return {
      nodeIds: nodes.map((node) => node.id),
      edgeIds: edges.map((edge) => edge.id),
    };
  }

  private defaultConnectionKind(fromKind: AgentNodeKind): AgentEdgeKind {
    if (fromKind === 'trigger') {
      return 'trigger';
    }

    return 'default';
  }

  private selectNodes(nodes: AgentNode<unknown>[]) {
    const selector = this.diagram.getExtension(Selector);
    selector.clearSelection();
    nodes.forEach((node) => selector.selectNode(node));
  }

  private resolveTemplateAnchor() {
    const selected = this.selectedAgentNodes[0];
    if (selected) {
      return selected.box.middle;
    }

    const frame = this.diagram.canvas.frameDimensions;
    if (frame.width > 0 && frame.height > 0) {
      return this.diagram.canvas.inverseFit(frame.middle);
    }

    return new Coordinates([7200, 6800]);
  }

  private snapPosition(position: Coordinates) {
    const x = Math.round(position.x / 10) * 10;
    const y = Math.round(position.y / 10) * 10;
    return new Coordinates([x, y]);
  }

  private buildNode<K extends AgentNodeKind>(
    kind: K,
    state: {
      id: string;
      label: string;
      payload?: Partial<AgentPayloadByKind[K]>;
    },
  ) {
    switch (kind) {
      case 'trigger':
        return new TriggerNode(
          null,
          state as ConstructorParameters<typeof TriggerNode>[1],
        );
      case 'condition':
        return new ConditionNode(
          null,
          state as ConstructorParameters<typeof ConditionNode>[1],
        );
      case 'outcome':
        return new OutcomeNode(
          null,
          state as ConstructorParameters<typeof OutcomeNode>[1],
        );
      case 'action':
      default:
        return new ActionNode(
          null,
          state as ConstructorParameters<typeof ActionNode>[1],
        );
    }
  }

  getGatewaysForConditionBranch(isTrueBranch: boolean): {
    fromGateway: TOrientation;
    toGateway: TOrientation;
  } {
    if (isTrueBranch) {
      return {
        fromGateway: 'up',
        toGateway: 'left',
      };
    }

    return {
      fromGateway: 'down',
      toGateway: 'left',
    };
  }
}
