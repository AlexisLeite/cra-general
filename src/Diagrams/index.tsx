import { Viewer } from './Viewer';
import json from '../saves/temp.json';

import { reaction, toJS } from 'mobx';
import { useState } from 'react';
import { TabsPanel } from './components/TabsPanel';
import { BPMDiagram } from './custom/bpmn/BPMDiagram';
import { ShapesShowcase } from './custom/bpmn/ShapesShowcase';
import {
  BPMNStatisticsController,
  BPMNStatisticsPanel,
} from './custom/bpmn/statistics';
import {
  AgentDiagram,
  AgentFlowController,
  AgentFlowPanel,
  AgentShapesShowcase,
} from './custom/agent';

const bpmnDiagram = new BPMDiagram();
const bpmnStatisticsController = new BPMNStatisticsController(bpmnDiagram);
const agentDiagram = new AgentDiagram();
const agentFlowController = new AgentFlowController(agentDiagram);

(window as any).d = bpmnDiagram;
(window as any).bpmnDiagram = bpmnDiagram;
(window as any).agentDiagram = agentDiagram;
(window as any).toJS = toJS;
(window as any).reaction = reaction;

bpmnDiagram.import(JSON.stringify(json as any));

export const Diagrams = () => {
  const [mode, setMode] = useState<'bpmn' | 'agent'>('bpmn');
  const [bpmnPanel, setBpmnPanel] = useState<'showcase' | 'statistics'>(
    'statistics',
  );
  const [agentPanel, setAgentPanel] = useState<'showcase' | 'flow'>('showcase');

  const diagram = mode === 'bpmn' ? bpmnDiagram : agentDiagram;

  const leftPanel =
    mode === 'bpmn' ? (
      <TabsPanel
        activeTab={bpmnPanel}
        onTabChange={setBpmnPanel}
        tabs={[
          { key: 'showcase', label: 'Showcase' },
          { key: 'statistics', label: 'Statistics' },
        ]}
      >
        {bpmnPanel === 'showcase' ? (
          <ShapesShowcase />
        ) : (
          <BPMNStatisticsPanel controller={bpmnStatisticsController} />
        )}
      </TabsPanel>
    ) : (
      <TabsPanel
        activeTab={agentPanel}
        onTabChange={setAgentPanel}
        tabs={[
          { key: 'showcase', label: 'Showcase' },
          { key: 'flow', label: 'Flow Builder' },
        ]}
      >
        {agentPanel === 'showcase' ? (
          <AgentShapesShowcase controller={agentFlowController} />
        ) : (
          <AgentFlowPanel controller={agentFlowController} />
        )}
      </TabsPanel>
    );

  return (
    <>
      <Viewer diagram={diagram} leftPanel={leftPanel} />
      <div className="diagram__editor_mode_switcher" role="group" aria-label="Editor mode">
        <button
          type="button"
          className={mode === 'bpmn' ? 'active' : ''}
          onClick={() => setMode('bpmn')}
        >
          BPMN
        </button>
        <button
          type="button"
          className={mode === 'agent' ? 'active' : ''}
          onClick={() => setMode('agent')}
        >
          Agent
        </button>
      </div>
    </>
  );
};
