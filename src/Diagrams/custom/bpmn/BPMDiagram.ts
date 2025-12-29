import { type TDiagramSettings, Diagram } from '../../store/Diagram';
import { EditableDiagram } from '../editable/EditableDiagram';
import { BPMNode } from './nodes/BPMNode';
import { EventNode } from './nodes/EventNode';
import { GateNode } from './nodes/GateNode';
import { TaskNode } from './nodes/TaskNode';

import './styles.css';

export class BPMDiagram extends EditableDiagram {
  constructor(settings?: TDiagramSettings) {
    super(settings);
    Diagram.registerClass(BPMNode);
    Diagram.registerClass(TaskNode);
    Diagram.registerClass(EventNode);
    Diagram.registerClass(GateNode);
  }
}
