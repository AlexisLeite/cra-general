import { reaction, toJS } from 'mobx';
import { useEffect, useMemo, useState } from 'react';
import 'pry-diagrams/pry-diagrams.css';
import {
  AgentDiagram,
  AgentFlowController,
  AgentFlowPanel,
  AgentShapesShowcase,
  BPMDiagram,
  BPMNStatisticsController,
  BPMNStatisticsPanel,
  DiagramEditor,
  ShapesShowcase,
  TabsPanel,
} from 'pry-diagrams';
import json from './demo-data/diagram-temp.json';

const DIAGRAM_EDITOR_MODE_STORAGE_KEY = 'diagram_editor_mode';

const getInitialEditorMode = (): 'bpmn' | 'agent' => {
  if (typeof window === 'undefined') {
    return 'bpmn';
  }

  const storedMode = window.localStorage.getItem(
    DIAGRAM_EDITOR_MODE_STORAGE_KEY,
  );
  return storedMode === 'agent' ? 'agent' : 'bpmn';
};

export function DiagramsDemo() {
  const bpmnDiagram = useMemo(() => new BPMDiagram(), []);
  const agentDiagram = useMemo(() => new AgentDiagram(), []);
  const bpmnStatisticsController = useMemo(
    () => new BPMNStatisticsController(bpmnDiagram),
    [bpmnDiagram],
  );
  const agentFlowController = useMemo(
    () => new AgentFlowController(agentDiagram),
    [agentDiagram],
  );

  const [mode, setMode] = useState<'bpmn' | 'agent'>(getInitialEditorMode);
  const [bpmnPanel, setBpmnPanel] = useState<'showcase' | 'statistics'>(
    'statistics',
  );
  const [agentPanel, setAgentPanel] = useState<'showcase' | 'flow'>('showcase');

  useEffect(() => {
    window.localStorage.setItem(DIAGRAM_EDITOR_MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    bpmnDiagram.import(JSON.stringify(json as any));

    (window as any).d = bpmnDiagram;
    (window as any).bpmnDiagram = bpmnDiagram;
    (window as any).agentDiagram = agentDiagram;
    (window as any).toJS = toJS;
    (window as any).reaction = reaction;
  }, [agentDiagram, bpmnDiagram]);

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
      <DiagramEditor diagram={diagram} leftPanel={leftPanel} />
      <div
        className="diagram__editor_mode_switcher"
        role="group"
        aria-label="Editor mode"
      >
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
}
