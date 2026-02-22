import type { TDiagramSettings } from '../../store/Diagram';
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

    this.registerClass(AgentNode);
    this.registerClass(TriggerNode);
    this.registerClass(ActionNode);
    this.registerClass(ConditionNode);
    this.registerClass(OutcomeNode);
    this.registerClass(AgentEdge);

    this.setDefaultEdge(AgentEdge);
  }
}
