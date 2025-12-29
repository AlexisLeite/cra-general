import { Viewer } from './Viewer';
import json from '../saves/temp.json';

import { toJS } from 'mobx';
import { BPMDiagram } from './custom/bpmn/BPMDiagram';

const d = new BPMDiagram();

(window as any).d = d;
(window as any).toJS = toJS;

d.import(JSON.stringify(json as any));
export const Diagrams = () => {
  return <Viewer diagram={d} />;
};
