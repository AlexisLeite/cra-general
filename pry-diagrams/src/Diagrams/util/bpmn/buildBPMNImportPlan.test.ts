import { describe, expect, it } from 'vitest';
import {
  buildBPMNImportPlan,
  sanitizeId,
} from './buildBPMNImportPlan';
import type { ParsedBPMNModel } from './types';

function createModel(): ParsedBPMNModel {
  return {
    processes: [
      {
        id: 'Process_1',
        name: 'Process',
        lanes: [
          {
            id: 'Lane_2',
            name: 'Second Lane',
            flowNodeRefs: ['Task@1'],
            processId: 'Process_1',
          },
          {
            id: 'Lane_1',
            name: 'First Lane',
            flowNodeRefs: [
              'Task 1',
              'EventBased_1',
              'Mystery_1',
              'Wait_1',
            ],
            processId: 'Process_1',
          },
        ],
        flowNodes: [
          {
            id: 'Task 1',
            name: '',
            type: 'task',
            processId: 'Process_1',
          },
          {
            id: 'Task@1',
            name: 'Second',
            type: 'serviceTask',
            processId: 'Process_1',
          },
          {
            id: 'Mystery_1',
            name: 'Complex Branch',
            type: 'complexGateway',
            processId: 'Process_1',
          },
          {
            id: 'Wait_1',
            name: 'Catch Something',
            type: 'intermediateCatchEvent',
            processId: 'Process_1',
          },
          {
            id: 'EventBased_1',
            name: 'Event Choice',
            type: 'eventBasedGateway',
            processId: 'Process_1',
          },
        ],
        sequenceFlows: [
          {
            id: 'Flow_1',
            name: '',
            sourceRef: 'Task 1',
            targetRef: 'Mystery_1',
            processId: 'Process_1',
          },
        ],
      },
    ],
    participants: [
      {
        id: 'Participant 1',
        name: 'Main Pool',
        processRef: 'Process_1',
      },
    ],
    shapes: new Map([
      [
        'Participant 1',
        {
          x: 100,
          y: 140,
          width: 1200,
          height: 600,
        },
      ],
      [
        'Lane_1',
        {
          x: 100,
          y: 150,
          width: 1200,
          height: 250,
        },
      ],
      [
        'Lane_2',
        {
          x: 100,
          y: 420,
          width: 1200,
          height: 250,
        },
      ],
      [
        'Task 1',
        {
          x: 280,
          y: 260,
          width: 200,
          height: 100,
        },
      ],
    ]),
    edges: new Map([
      [
        'Flow_1',
        [
          { x: 480, y: 310 },
          { x: 640, y: 310 },
          { x: 640, y: 540 },
        ],
      ],
    ]),
    unsupportedLinks: [],
    warnings: [],
  };
}

describe('buildBPMNImportPlan', () => {
  it('sanitizes and de-duplicates IDs deterministically', () => {
    expect(sanitizeId(' Task 1 ', 'node')).toBe('Task-1');
    expect(sanitizeId('##', 'node')).toBe('node');
  });

  it('builds lanes per participant, applies fallback layout, and maps unknown nodes', () => {
    const parsed = createModel();
    const plan = buildBPMNImportPlan(parsed);

    expect(plan.lanes).toHaveLength(1);
    expect(plan.lanes[0].poolLabels).toEqual(['First Lane', 'Second Lane']);
    expect(plan.lanes[0].box.width).toBe(1200);

    const sortedNodeIds = plan.nodes.map((node) => node.id).sort();
    expect(sortedNodeIds).toEqual([
      'EventBased_1',
      'Mystery_1',
      'Task-1',
      'Task-1-1',
      'Wait_1',
    ]);

    const unknown = plan.nodes.find((node) => node.bpmnId === 'Mystery_1');
    expect(unknown?.className).toBe('UnknownBPMNNode');
    expect(unknown?.sourceType).toBe('complexGateway');

    const intermediate = plan.nodes.find((node) => node.bpmnId === 'Wait_1');
    expect(intermediate?.className).toBe('EventNode');
    expect(intermediate?.eventType).toBe(2);

    const eventBased = plan.nodes.find(
      (node) => node.bpmnId === 'EventBased_1',
    );
    expect(eventBased?.className).toBe('GateNode');
    expect(eventBased?.gateType).toBe(3);

    const fallbackNode = plan.nodes.find((node) => node.bpmnId === 'Task@1');
    expect(fallbackNode?.box.x).toBe(220);
    expect(fallbackNode?.box.y).toBe(510);

    const unnamedTask = plan.nodes.find((node) => node.bpmnId === 'Task 1');
    expect(unnamedTask?.label).toBe('');

    expect(
      plan.warnings.some((warning) =>
        warning.includes("Unsupported BPMN node 'complexGateway'"),
      ),
    ).toBe(true);
    expect(
      plan.warnings.some((warning) =>
        warning.includes("Unsupported BPMN node 'intermediateCatchEvent'"),
      ),
    ).toBe(false);
    expect(
      plan.warnings.some((warning) =>
        warning.includes("Unsupported BPMN node 'eventBasedGateway'"),
      ),
    ).toBe(false);
  });

  it('preserves edge waypoints and derives orientations from DI waypoints', () => {
    const plan = buildBPMNImportPlan(createModel());
    expect(plan.edges).toHaveLength(1);
    expect(plan.edges[0].waypoints).toEqual([
      { x: 480, y: 310 },
      { x: 640, y: 310 },
      { x: 640, y: 540 },
    ]);
    expect(plan.edges[0].fromOrientation).toBe('right');
    expect(plan.edges[0].toOrientation).toBe('up');
  });
});
