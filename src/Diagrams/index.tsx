import { Viewer } from './Viewer';
import json from '../saves/temp.json';

import { reaction, toJS } from 'mobx';
import { useState } from 'react';
import { BPMDiagram } from './custom/bpmn/BPMDiagram';
import { ShapesShowcase } from './custom/bpmn/ShapesShowcase';
import { TabsPanel } from './components/TabsPanel';
import {
  BPMNStatisticsController,
  BPMNStatisticsPanel,
} from './custom/bpmn/statistics';

const d = new BPMDiagram();
const statsController = new BPMNStatisticsController(d);

(window as any).d = d;
(window as any).toJS = toJS;
(window as any).reaction = reaction;

d.import(JSON.stringify(json as any));
export const Diagrams = () => {
  const [activePanel, setActivePanel] = useState<'showcase' | 'statistics'>(
    'statistics',
  );
  const tabs = [
    { key: 'showcase', label: 'Showcase' },
    { key: 'statistics', label: 'Statistics' },
  ] as const;

  return (
    <Viewer
      diagram={d}
      leftPanel={
        <TabsPanel
          activeTab={activePanel}
          onTabChange={setActivePanel}
          tabs={tabs}
        >
          {activePanel === 'showcase' ? (
            <ShapesShowcase />
          ) : (
            <BPMNStatisticsPanel controller={statsController} />
          )}
        </TabsPanel>
      }
    />
  );
};
