import { type TDiagramSettings } from '../../store/Diagram';
import { EditableDiagram } from '../editable/EditableDiagram';

import './styles.css';

export class BPMDiagram extends EditableDiagram {
  constructor(settings?: TDiagramSettings) {
    super(settings);
  }
}
