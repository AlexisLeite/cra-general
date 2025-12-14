import { TfiLayoutSidebarNone } from 'react-icons/tfi';
import { Diagram } from '../../../store/Diagram';

export function SelectTool() {
  const d = Diagram.use();

  return (
    <TfiLayoutSidebarNone
      className={`tool ${d.selector.selectionModeEnabled ? 'selected' : ''}`}
      onClick={() => {
        d.selector.enableSelectionMode();
      }}
      title="Select"
    />
  );
}
