import { describe, expect, it } from 'vitest';
import { DOMParser as XMLDOMParser } from '@xmldom/xmldom';
import { parseBPMNXml } from './parseBPMNXml';

if (typeof globalThis.DOMParser === 'undefined') {
  (globalThis as unknown as { DOMParser: typeof XMLDOMParser }).DOMParser =
    XMLDOMParser;
}

const BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Defs_1"
  targetNamespace="https://example.com/bpmn"
>
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_B" name="Backoffice">
        <bpmn:flowNodeRef>Task_1</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_A" name="Frontoffice">
        <bpmn:flowNodeRef>Gateway_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="Start_1" name="Start"/>
    <bpmn:userTask id="Task_1" name="Handle request"/>
    <bpmn:exclusiveGateway id="Gateway_1" name="Approved?"/>
    <bpmn:endEvent id="End_1" name="Done"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_1"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="Gateway_1"/>
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Gateway_1" targetRef="End_1"/>
  </bpmn:process>

  <bpmn:collaboration id="Collab_1">
    <bpmn:participant id="Participant_1" processRef="Process_1" name="Main Pool"/>
    <bpmn:messageFlow id="Message_1" sourceRef="Task_1" targetRef="End_1"/>
  </bpmn:collaboration>

  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Collab_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1">
        <dc:Bounds x="40" y="60" width="900" height="500"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_A_di" bpmnElement="Lane_A">
        <dc:Bounds x="40" y="80" width="900" height="220"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_B_di" bpmnElement="Lane_B">
        <dc:Bounds x="40" y="320" width="900" height="220"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="260" y="360" width="200" height="100"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1">
        <dc:Bounds x="560" y="120" width="80" height="80"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="460" y="410"/>
        <di:waypoint x="560" y="410"/>
        <di:waypoint x="560" y="160"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

describe('parseBPMNXml', () => {
  it('parses namespaced BPMN processes, participants, DI shapes and edges', () => {
    const parsed = parseBPMNXml(BPMN_XML);

    expect(parsed.processes).toHaveLength(1);
    expect(parsed.processes[0].id).toBe('Process_1');
    expect(parsed.processes[0].sequenceFlows).toHaveLength(3);

    expect(parsed.participants).toHaveLength(1);
    expect(parsed.participants[0].id).toBe('Participant_1');

    expect(parsed.shapes.get('Task_1')).toEqual({
      x: 260,
      y: 360,
      width: 200,
      height: 100,
    });
    expect(parsed.edges.get('Flow_2')).toEqual([
      { x: 460, y: 410 },
      { x: 560, y: 410 },
      { x: 560, y: 160 },
    ]);
  });

  it('collects unsupported link types so they can be warned/skipped later', () => {
    const parsed = parseBPMNXml(BPMN_XML);

    expect(parsed.unsupportedLinks).toContainEqual({
      id: 'Message_1',
      sourceRef: 'Task_1',
      targetRef: 'End_1',
      type: 'messageFlow',
    });
  });
});
