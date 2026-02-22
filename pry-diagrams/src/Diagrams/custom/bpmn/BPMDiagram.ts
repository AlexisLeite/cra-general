import type { TDiagramSettings } from '../../store/Diagram';
import { EditableDiagram } from '../editable/EditableDiagram';
import { BPMNode } from './nodes/BPMNode';
import { EventNode } from './nodes/EventNode';
import { GateNode } from './nodes/GateNode';
import { TaskNode } from './nodes/TaskNode';
import { UnknownBPMNNode } from './nodes/UnknownBPMNNode';

import './bpm-styles.css';
import { Lanes } from './nodes/Lanes';

export class BPMDiagram extends EditableDiagram {
  constructor(settings?: TDiagramSettings) {
    super(settings);
    this.registerClass(BPMNode);
    this.registerClass(TaskNode);
    this.registerClass(EventNode);
    this.registerClass(GateNode);
    this.registerClass(Lanes);
    this.registerClass(UnknownBPMNNode);
  }
}
