import { TfiHandDrag } from 'react-icons/tfi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { Selector } from '../../../store/tools/Selector';

export const MoveTool = observer(function MoveTool() {
  const d = Diagram.use();
  const selector = d.getExtension(Selector);

  if (!selector) {
    return null;
  }

  return (
    <TfiHandDrag
      className={`tool ${selector?.selectionMode === 'element' ? 'selected' : ''}`}
      onClick={() => {
        selector?.toggleSelectionMode();
      }}
      title="Move"
    />
  );
});
