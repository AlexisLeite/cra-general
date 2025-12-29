import { Diagram, type TDiagramSettings } from '../../store/Diagram';
import { EditionMode } from './EditionMode';

import './styles.css';

export class EditableDiagram extends Diagram {
  constructor(settings?: TDiagramSettings) {
    super(settings);

    this.registerExtension(EditionMode);
  }
}
