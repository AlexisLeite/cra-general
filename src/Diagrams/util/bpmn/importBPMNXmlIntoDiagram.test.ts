import { describe, expect, it } from 'vitest';
import { DOMParser as XMLDOMParser } from '@xmldom/xmldom';
import { importBPMNXmlIntoDiagram } from './importBPMNXmlIntoDiagram';

if (typeof globalThis.DOMParser === 'undefined') {
  (globalThis as unknown as { DOMParser: typeof XMLDOMParser }).DOMParser =
    XMLDOMParser;
}

const SIMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  id="Defs_1"
  targetNamespace="https://example.com/bpmn"
>
  <bpmn:process id="Process_1">
    <bpmn:intermediateCatchEvent id="Unknown_1" name="Wait for signal"/>
  </bpmn:process>
</bpmn:definitions>`;

describe('importBPMNXmlIntoDiagram', () => {
  it('returns import summary and maps unsupported nodes to UnknownBPMNNode', () => {
    const added: Array<{ constructor: { name: string } }> = [];
    const fakeDiagram = {
      add(node: { constructor: { name: string } }) {
        added.push(node);
        return node;
      },
      connect() {
        throw new Error('connect should not be called in this test');
      },
    } as any;

    const result = importBPMNXmlIntoDiagram(fakeDiagram, SIMPLE_XML);

    expect(result.summary).toEqual({
      lanes: 1,
      nodes: 1,
      edges: 0,
    });
    expect(
      added.some((node) => node.constructor.name === 'UnknownBPMNNode'),
    ).toBe(true);
    expect(
      result.warnings.some((warning) =>
        warning.includes("Unsupported BPMN node 'intermediateCatchEvent'"),
      ),
    ).toBe(true);
  });
});
