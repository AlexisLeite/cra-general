import { Diagram, type TDiagramSettings } from '../../store/Diagram';
import { EditableNode } from './EditableNode';
import { EditionMode } from './EditionMode';

import './styles.css';

export class EditableDiagram extends Diagram {
  constructor(settings?: TDiagramSettings) {
    super(settings);

    this.registerClass(EditableNode);
    this.registerExtension(EditionMode);
  }
}
