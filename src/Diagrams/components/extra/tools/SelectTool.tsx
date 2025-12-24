import { TfiLayoutSidebarNone } from 'react-icons/tfi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';

export const SelectTool = observer(function SelectTool() {
  const d = Diagram.use();

  return (
    <TfiLayoutSidebarNone
      className={`tool ${d.selector.selectionMode === 'area' ? 'selected' : ''}`}
      onClick={() => {
        d.selector.toggleSelectionMode();
      }}
      title="Select"
    />
  );
});
