import { type TDiagramSettings, Diagram } from '../../store/Diagram';
import { EditableDiagram } from '../editable/EditableDiagram';
import { AgentEdge } from './edges/AgentEdge';
import { ActionNode } from './nodes/ActionNode';
import { AgentNode } from './nodes/AgentNode';
import { ConditionNode } from './nodes/ConditionNode';
import { OutcomeNode } from './nodes/OutcomeNode';
import { TriggerNode } from './nodes/TriggerNode';

import './agent-styles.css';

export class AgentDiagram extends EditableDiagram {
  constructor(settings?: TDiagramSettings) {
    super(settings);

    Diagram.registerClass(AgentNode);
    Diagram.registerClass(TriggerNode);
    Diagram.registerClass(ActionNode);
    Diagram.registerClass(ConditionNode);
    Diagram.registerClass(OutcomeNode);
    Diagram.registerClass(AgentEdge);

    this.setDefaultEdge(AgentEdge);
  }
}
