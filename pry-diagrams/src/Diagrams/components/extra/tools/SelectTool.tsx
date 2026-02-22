import { TfiLayoutSidebarNone } from 'react-icons/tfi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { Selector } from '../../../store/extensions/Selector';

export const SelectTool = observer(function SelectTool() {
  const d = Diagram.use();
  const selector = d.getExtension(Selector);

  if (!selector) {
    return null;
  }

  return (
    <TfiLayoutSidebarNone
      className={`tool ${selector.selectionMode === 'area' ? 'selected' : ''}`}
      onClick={() => {
        selector.toggleSelectionMode();
      }}
      title="Select"
    />
  );
});
