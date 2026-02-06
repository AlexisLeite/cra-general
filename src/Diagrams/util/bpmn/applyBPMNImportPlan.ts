import { EventNode } from '../../custom/bpmn/nodes/EventNode';
import { GateNode } from '../../custom/bpmn/nodes/GateNode';
import { Lanes } from '../../custom/bpmn/nodes/Lanes';
import { TaskNode } from '../../custom/bpmn/nodes/TaskNode';
import { UnknownBPMNNode } from '../../custom/bpmn/nodes/UnknownBPMNNode';
import { Diagram } from '../../store/Diagram';
import { EdgePoint } from '../../store/elements/EdgePoint';
import { Node } from '../../store/elements/Node';
import { Dimensions } from '../../store/primitives/Dimensions';
import type { TOrientation } from '../../store/types';
import type {
  BPMNApplyImportResult,
  BPMNImportNodePlan,
  BPMNImportPlan,
} from './types';

function createNode(plan: BPMNImportNodePlan) {
  const baseState = {
    id: plan.id,
    label: plan.label,
    movable: true,
  };

  switch (plan.className) {
    case 'EventNode':
      return new EventNode(null, {
        ...baseState,
        type: plan.eventType,
      });
    case 'GateNode':
      return new GateNode(null, {
        ...baseState,
        type: plan.gateType,
      });
    case 'UnknownBPMNNode':
      return new UnknownBPMNNode(null, {
        ...baseState,
        sourceType: plan.sourceType || plan.bpmnType,
      });
    case 'TaskNode':
    default:
      return new TaskNode(null, baseState);
  }
}

function setNodeBounds(node: Node<any>, plan: BPMNImportNodePlan) {
  node.state.box = new Dimensions([
    plan.box.x,
    plan.box.y,
    plan.box.width,
    plan.box.height,
  ]);
}

function getGateway(node: Node<any>, orientation: TOrientation) {
  return node.getGateway(orientation as any);
}

function buildPools(poolLabels: string[]) {
  const labels = poolLabels.length ? poolLabels : ['Default'];
  return labels.map((label, index) => ({
    name: index === 0 ? 'default' : `pool${index - 1}`,
    label,
  }));
}

export function applyBPMNImportPlan(
  diagram: Diagram,
  plan: BPMNImportPlan,
): BPMNApplyImportResult {
  const warnings: string[] = [];
  const importedNodes = new Map<string, Node<any>>();

  plan.lanes.forEach((lanePlan) => {
    const lanes = new Lanes(null, { id: lanePlan.id });
    lanes.pools = buildPools(lanePlan.poolLabels);
    lanes.state.box.x = lanePlan.box.x;
    lanes.state.box.y = lanePlan.box.y;
    lanes.state.box.width = lanePlan.box.width;
    diagram.add(lanes);
    importedNodes.set(lanePlan.id, lanes);
  });

  plan.nodes.forEach((nodePlan) => {
    const node = createNode(nodePlan);
    setNodeBounds(node, nodePlan);
    diagram.add(node);
    importedNodes.set(nodePlan.id, node);
  });

  let importedEdges = 0;

  plan.edges.forEach((edgePlan) => {
    const sourceNode = importedNodes.get(edgePlan.fromNodeId);
    const targetNode = importedNodes.get(edgePlan.toNodeId);

    if (!sourceNode || !targetNode) {
      warnings.push(
        `Skipping edge '${edgePlan.bpmnId}' because source or target node is missing.`,
      );
      return;
    }

    const fromGateway = getGateway(sourceNode, edgePlan.fromOrientation);
    const toGateway = getGateway(targetNode, edgePlan.toOrientation);

    if (!fromGateway || !toGateway) {
      warnings.push(
        `Skipping edge '${edgePlan.bpmnId}' because a required gateway was not found.`,
      );
      return;
    }

    const edge = diagram.connect(fromGateway, toGateway);

    if (edgePlan.waypoints && edgePlan.waypoints.length >= 2) {
      const steps = edgePlan.waypoints.map((point, index, all) => {
        const mode = index === 0 || index === all.length - 1 ? 'static' : 'manual';
        return new EdgePoint(edge, [point.x, point.y, mode]);
      });
      edge.setSteps(steps);
    }

    importedEdges++;
  });

  return {
    warnings,
    summary: {
      lanes: plan.lanes.length,
      nodes: plan.nodes.length,
      edges: importedEdges,
    },
  };
}
