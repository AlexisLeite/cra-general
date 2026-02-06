import type {
  BPMNBounds,
  BPMNWaypoint,
  ParsedBPMNFlowNode,
  ParsedBPMNModel,
  ParsedBPMNLane,
  ParsedBPMNParticipant,
  ParsedBPMNProcess,
  ParsedBPMNSequenceFlow,
  ParsedBPMNUnsupportedLink,
} from './types';

const FLOW_NODE_HINT_TYPES = new Set([
  'adHocSubProcess',
  'boundaryEvent',
  'businessRuleTask',
  'callActivity',
  'complexGateway',
  'endEvent',
  'eventBasedGateway',
  'exclusiveGateway',
  'inclusiveGateway',
  'intermediateCatchEvent',
  'intermediateThrowEvent',
  'manualTask',
  'parallelGateway',
  'receiveTask',
  'scriptTask',
  'sendTask',
  'serviceTask',
  'startEvent',
  'subProcess',
  'task',
  'transaction',
  'userTask',
]);

function getLocalName(element: Element) {
  return (
    element.localName ||
    element.tagName.split(':').at(-1) ||
    element.tagName
  );
}

function getDescendantsByLocalName(root: Element | Document, name: string) {
  return Array.from(root.getElementsByTagName('*')).filter(
    (element) => getLocalName(element) === name,
  );
}

function getTextChildrenByLocalName(root: Element, name: string) {
  return getDescendantsByLocalName(root, name)
    .map((element) => element.textContent?.trim() || '')
    .filter(Boolean);
}

function readRequiredAttr(
  element: Element,
  attribute: string,
  context: string,
  warnings: string[],
) {
  const value = element.getAttribute(attribute)?.trim() || '';
  if (!value) {
    warnings.push(`Skipping ${context} without required '${attribute}' attribute.`);
    return null;
  }
  return value;
}

function readOptionalAttr(element: Element, attribute: string) {
  return element.getAttribute(attribute)?.trim() || '';
}

function readFiniteNumber(value: string | null) {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBounds(shape: Element): BPMNBounds | null {
  const boundsElement = getDescendantsByLocalName(shape, 'Bounds')[0];
  if (!boundsElement) {
    return null;
  }

  const x = readFiniteNumber(boundsElement.getAttribute('x'));
  const y = readFiniteNumber(boundsElement.getAttribute('y'));
  const width = readFiniteNumber(boundsElement.getAttribute('width'));
  const height = readFiniteNumber(boundsElement.getAttribute('height'));

  if (
    x === null ||
    y === null ||
    width === null ||
    height === null ||
    width <= 0 ||
    height <= 0
  ) {
    return null;
  }

  return { x, y, width, height };
}

function parseWaypoints(edge: Element) {
  const waypoints = getDescendantsByLocalName(edge, 'waypoint')
    .map((waypoint): BPMNWaypoint | null => {
      const x = readFiniteNumber(waypoint.getAttribute('x'));
      const y = readFiniteNumber(waypoint.getAttribute('y'));
      if (x === null || y === null) {
        return null;
      }
      return { x, y };
    })
    .filter((waypoint): waypoint is BPMNWaypoint => waypoint !== null);

  return waypoints;
}

function parseDocument(xml: string) {
  if (typeof DOMParser === 'undefined') {
    throw new Error('DOMParser is not available in this runtime.');
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(xml, 'application/xml');
  const parserErrors = getDescendantsByLocalName(document, 'parsererror');
  if (parserErrors.length > 0) {
    throw new Error('Invalid BPMN XML document.');
  }

  return document;
}

function parseLanes(processElement: Element, processId: string) {
  const warnings: string[] = [];
  const lanes: ParsedBPMNLane[] = [];

  getDescendantsByLocalName(processElement, 'lane').forEach((laneElement) => {
    const id = readRequiredAttr(
      laneElement,
      'id',
      `lane in process '${processId}'`,
      warnings,
    );

    if (!id) {
      return;
    }

    lanes.push({
      id,
      processId,
      name: readOptionalAttr(laneElement, 'name'),
      flowNodeRefs: getTextChildrenByLocalName(laneElement, 'flowNodeRef'),
    });
  });

  return { lanes, warnings };
}

function parseSequenceFlows(processElement: Element, processId: string) {
  const warnings: string[] = [];
  const sequenceFlows: ParsedBPMNSequenceFlow[] = [];

  getDescendantsByLocalName(processElement, 'sequenceFlow').forEach(
    (flowElement) => {
      const id = readRequiredAttr(
        flowElement,
        'id',
        `sequenceFlow in process '${processId}'`,
        warnings,
      );
      const sourceRef = readRequiredAttr(
        flowElement,
        'sourceRef',
        `sequenceFlow in process '${processId}'`,
        warnings,
      );
      const targetRef = readRequiredAttr(
        flowElement,
        'targetRef',
        `sequenceFlow in process '${processId}'`,
        warnings,
      );

      if (!id || !sourceRef || !targetRef) {
        return;
      }

      sequenceFlows.push({
        id,
        processId,
        sourceRef,
        targetRef,
        name: readOptionalAttr(flowElement, 'name'),
      });
    },
  );

  return { sequenceFlows, warnings };
}

function parseFlowNodes(
  processElement: Element,
  processId: string,
  hintedFlowNodeIds: Set<string>,
) {
  const flowNodes: ParsedBPMNFlowNode[] = [];
  const seen = new Set<string>();

  Array.from(processElement.getElementsByTagName('*')).forEach((element) => {
    const localName = getLocalName(element);
    if (
      localName === 'lane' ||
      localName === 'laneSet' ||
      localName === 'sequenceFlow'
    ) {
      return;
    }

    const id = element.getAttribute('id')?.trim() || '';
    if (!id || seen.has(id)) {
      return;
    }

    if (!FLOW_NODE_HINT_TYPES.has(localName) && !hintedFlowNodeIds.has(id)) {
      return;
    }

    seen.add(id);
    flowNodes.push({
      id,
      processId,
      type: localName,
      name: readOptionalAttr(element, 'name'),
    });
  });

  return flowNodes;
}

function parseProcesses(document: Document) {
  const warnings: string[] = [];
  const processes: ParsedBPMNProcess[] = [];

  getDescendantsByLocalName(document, 'process').forEach((processElement) => {
    const processId = readRequiredAttr(
      processElement,
      'id',
      'process',
      warnings,
    );

    if (!processId) {
      return;
    }

    const laneResult = parseLanes(processElement, processId);
    const sequenceResult = parseSequenceFlows(processElement, processId);

    warnings.push(...laneResult.warnings, ...sequenceResult.warnings);

    const hintedFlowNodeIds = new Set<string>();
    laneResult.lanes.forEach((lane) =>
      lane.flowNodeRefs.forEach((nodeRef) => hintedFlowNodeIds.add(nodeRef)),
    );
    sequenceResult.sequenceFlows.forEach((flow) => {
      hintedFlowNodeIds.add(flow.sourceRef);
      hintedFlowNodeIds.add(flow.targetRef);
    });

    processes.push({
      id: processId,
      name: readOptionalAttr(processElement, 'name'),
      lanes: laneResult.lanes,
      sequenceFlows: sequenceResult.sequenceFlows,
      flowNodes: parseFlowNodes(processElement, processId, hintedFlowNodeIds),
    });
  });

  return { processes, warnings };
}

function parseParticipants(document: Document) {
  const warnings: string[] = [];
  const participants: ParsedBPMNParticipant[] = [];

  getDescendantsByLocalName(document, 'participant').forEach(
    (participantElement) => {
      const id = readRequiredAttr(
        participantElement,
        'id',
        'participant',
        warnings,
      );
      const processRef = readRequiredAttr(
        participantElement,
        'processRef',
        `participant '${id || '<unknown>'}'`,
        warnings,
      );

      if (!id || !processRef) {
        return;
      }

      participants.push({
        id,
        processRef,
        name: readOptionalAttr(participantElement, 'name'),
      });
    },
  );

  return { participants, warnings };
}

function parseShapes(document: Document) {
  const warnings: string[] = [];
  const shapes = new Map<string, BPMNBounds>();

  getDescendantsByLocalName(document, 'BPMNShape').forEach((shapeElement) => {
    const bpmnElementId = readRequiredAttr(
      shapeElement,
      'bpmnElement',
      'BPMNShape',
      warnings,
    );

    if (!bpmnElementId) {
      return;
    }

    const bounds = parseBounds(shapeElement);
    if (!bounds) {
      warnings.push(`Skipping BPMNShape for '${bpmnElementId}' because bounds are missing or invalid.`);
      return;
    }

    shapes.set(bpmnElementId, bounds);
  });

  return { shapes, warnings };
}

function parseEdges(document: Document) {
  const warnings: string[] = [];
  const edges = new Map<string, BPMNWaypoint[]>();

  getDescendantsByLocalName(document, 'BPMNEdge').forEach((edgeElement) => {
    const bpmnElementId = readRequiredAttr(
      edgeElement,
      'bpmnElement',
      'BPMNEdge',
      warnings,
    );
    if (!bpmnElementId) {
      return;
    }

    const waypoints = parseWaypoints(edgeElement);
    if (!waypoints.length) {
      warnings.push(`Skipping BPMNEdge for '${bpmnElementId}' because it has no valid waypoints.`);
      return;
    }

    edges.set(bpmnElementId, waypoints);
  });

  return { edges, warnings };
}

function parseUnsupportedLinks(document: Document) {
  const unsupportedLinks: ParsedBPMNUnsupportedLink[] = [];

  Array.from(document.getElementsByTagName('*')).forEach((element) => {
    const localName = getLocalName(element);
    const sourceRef = element.getAttribute('sourceRef')?.trim() || '';
    const targetRef = element.getAttribute('targetRef')?.trim() || '';

    if (!sourceRef || !targetRef || localName === 'sequenceFlow') {
      return;
    }

    unsupportedLinks.push({
      id: element.getAttribute('id')?.trim() || `<${localName}>`,
      sourceRef,
      targetRef,
      type: localName,
    });
  });

  unsupportedLinks.sort((a, b) => a.id.localeCompare(b.id));

  return unsupportedLinks;
}

export function parseBPMNXml(xml: string): ParsedBPMNModel {
  const document = parseDocument(xml);

  const processResult = parseProcesses(document);
  const participantResult = parseParticipants(document);
  const shapeResult = parseShapes(document);
  const edgeResult = parseEdges(document);
  const unsupportedLinks = parseUnsupportedLinks(document);

  const warnings = [
    ...processResult.warnings,
    ...participantResult.warnings,
    ...shapeResult.warnings,
    ...edgeResult.warnings,
  ];

  if (!processResult.processes.length) {
    throw new Error('No BPMN process was found in the provided XML.');
  }

  return {
    processes: processResult.processes,
    participants: participantResult.participants,
    shapes: shapeResult.shapes,
    edges: edgeResult.edges,
    unsupportedLinks,
    warnings,
  };
}
