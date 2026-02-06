import { Viewer } from './Viewer';
import json from '../saves/temp.json';

import { reaction, toJS } from 'mobx';
import { useState } from 'react';
import { BPMDiagram } from './custom/bpmn/BPMDiagram';
import { ShapesShowcase } from './custom/bpmn/ShapesShowcase';
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

  return (
    <Viewer
      diagram={d}
      leftPanel={
        <div className="diagram__left_panel_shell">
          <div className="diagram__left_tabs">
            <button
              className={`diagram__left_tab ${activePanel === 'showcase' ? 'active' : ''}`}
              onClick={() => setActivePanel('showcase')}
            >
              Showcase
            </button>
            <button
              className={`diagram__left_tab ${activePanel === 'statistics' ? 'active' : ''}`}
              onClick={() => setActivePanel('statistics')}
            >
              Statistics
            </button>
          </div>
          <div className="diagram__left_panel_content">
            {activePanel === 'showcase' ? (
              <ShapesShowcase />
            ) : (
              <BPMNStatisticsPanel controller={statsController} />
            )}
          </div>
        </div>
      }
    />
  );
};
