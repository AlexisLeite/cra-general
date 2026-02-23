import type { TDiagramSettings } from '../../store/Diagram';
import { Coordinates } from '../../store/primitives/Coordinates';
import { Dimensions } from '../../store/primitives/Dimensions';
import { Selector } from '../../store/extensions/Selector';
import { getIdForNode } from '../../util/getIdForNode';
import { EditableDiagram } from '../editable/EditableDiagram';
import { CommunicationEdge } from './edges/CommunicationEdge';
import { CommunicationActorNode } from './nodes/CommunicationActorNode';
import { CommunicationObjectNode } from './nodes/CommunicationObjectNode';
import { CommunicationControllerNode } from './nodes/CommunicationControllerNode';
import type { CommunicationNodeType } from './types';

import './communication-styles.css';

export class CommunicationDiagram extends EditableDiagram {
  constructor(settings?: TDiagramSettings) {
    super(settings);

    this.registerClass(CommunicationActorNode);
    this.registerClass(CommunicationObjectNode);
    this.registerClass(CommunicationControllerNode);
    this.registerClass(CommunicationEdge);

    this.setDefaultEdge(CommunicationEdge);
  }

  get selectedNodes() {
    return this.getExtension(Selector).selectedNodes;
  }

  get selectedEdges() {
    return this.getExtension(Selector).selectedEdges;
  }

  createNodeFromClientPoint(type: CommunicationNodeType, clientX: number, clientY: number) {
    const point = this.canvas.inverseFit(new Coordinates([clientX, clientY]));
    return this.createNodeAtCanvasPoint(type, point.x, point.y);
  }

  createNodeAtCanvasPoint(type: CommunicationNodeType, x: number, y: number) {
    const node = this.instantiateNode(type);
    this.add(node);
    const nextPosition = new Coordinates([
      x - node.box.width / 2,
      y - node.box.height / 2,
    ]);
    node.setPosition(nextPosition);
    this.getExtension(Selector).clearSelection();
    this.getExtension(Selector).selectNode(node);
    return node;
  }

  createNodeInViewportCenter(type: CommunicationNodeType) {
    const frame = this.canvas.frameDimensions;
    const center = new Coordinates([
      frame.x + frame.width / 2,
      frame.y + frame.height / 2,
    ]);
    return this.createNodeFromClientPoint(type, center.x, center.y);
  }

  private instantiateNode(type: CommunicationNodeType) {
    const baseState = {
      id: getIdForNode(this, 'node'),
      label: defaultLabelForType(type),
      box: new Dimensions([0, 0, 180, 96]),
    };

    if (type === 'actor') {
      return new CommunicationActorNode(this, baseState);
    }
    if (type === 'controller') {
      return new CommunicationControllerNode(this, baseState);
    }
    return new CommunicationObjectNode(this, baseState);
  }
}

function defaultLabelForType(type: CommunicationNodeType): string {
  if (type === 'actor') {
    return 'Actor';
  }
  if (type === 'controller') {
    return 'Controller';
  }
  return 'Object';
}

