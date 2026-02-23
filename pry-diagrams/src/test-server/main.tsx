import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BPMDiagram } from '../Diagrams/custom/bpmn/BPMDiagram';
import { Viewer } from '../Diagrams/Viewer';
import './main.css';
import { runInAction } from 'mobx';
import { NodesConnector } from '../Diagrams/store/extensions/NodesConnector';
import { GridSnap } from '../Diagrams/store/extensions/GridSnap';
import { Coordinates } from '../Diagrams/store/primitives/Coordinates';

const diagram = new BPMDiagram();

(window as any).__diagramE2E = {
  clear() {
    for (const node of [...diagram.nodes]) {
      diagram.delete(node as any);
    }
  },
  import(state: unknown) {
    this.clear();
    diagram.import(
      typeof state === 'string' ? state : JSON.stringify(state),
    );
    return this.snapshot();
  },
  export() {
    return diagram.serialize();
  },
  snapshot() {
    return {
      nodes: diagram.nodes.map((node) => ({
        id: node.id,
        box: node.box.raw,
      })),
      edges: diagram.edges.map((edge) => ({
        id: edge.id,
        dragging: edge.state.dragging,
        fromNodeId: edge.from.parent.id,
        fromGatewayId: edge.from.id,
        toNodeId: edge.to.parent.id,
        toGatewayId: edge.to.id,
        displacementStart: edge.state.displacementStart
          ? { x: edge.state.displacementStart.x, y: edge.state.displacementStart.y }
          : null,
        displacementEnd: edge.state.displacementEnd
          ? { x: edge.state.displacementEnd.x, y: edge.state.displacementEnd.y }
          : null,
        steps: edge.steps.map((step) => ({
          x: step.x,
          y: step.y,
          mode: step.mode,
        })),
      })),
    };
  },
  connect(
    fromNodeId: string,
    fromGatewayId: string,
    toNodeId: string,
    toGatewayId: string,
  ) {
    const from = diagram.getNodeById(fromNodeId)?.getGateway(fromGatewayId as any);
    const to = diagram.getNodeById(toNodeId)?.getGateway(toGatewayId as any);
    if (!from || !to) {
      throw new Error('Unable to find gateway(s) for e2e connect');
    }
    diagram.connect(from, to);
    return this.snapshot();
  },
  setEdgeHover(edgeId: string, hover: boolean) {
    const edge = diagram.getEdgeById(edgeId);
    if (!edge) {
      throw new Error(`Unable to find edge '${edgeId}'`);
    }
    runInAction(() => {
      edge.state.hover = hover;
    });
    return this.snapshot();
  },
  connectorPreview() {
    const connector = diagram.getExtension(NodesConnector);
    const arrowTo = (connector as any).arrowTo ?? null;
    const grid = diagram.getExtension(GridSnap).gridSize / 2;
    const mousePlane = arrowTo ? diagram.canvas.inverseFit(arrowTo) : null;
    const mouseSnapped = mousePlane
      ? {
          x: Math.round(mousePlane.x / grid) * grid,
          y: Math.round(mousePlane.y / grid) * grid,
        }
      : null;
    return {
      steps: connector.arrowSteps.map((step) => ({ x: step.x, y: step.y })),
      hasCandidate: Boolean(connector.candidateGateway),
      candidateGatewayId: connector.candidateGateway?.id ?? null,
      candidateNodeId: connector.candidateGateway?.parent.id ?? null,
      mouseSnapped,
    };
  },
  clientToPlane(clientX: number, clientY: number) {
    const p = diagram.canvas.inverseFit(new Coordinates([clientX, clientY]));
    return { x: p.x, y: p.y };
  },
  gridSize() {
    return diagram.getExtension(GridSnap).gridSize;
  },
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Viewer diagram={diagram} />
  </StrictMode>,
);
