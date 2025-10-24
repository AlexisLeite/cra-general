import { observer } from 'mobx-react-lite';
import { TfiRulerAlt } from 'react-icons/tfi';
import { TfiHandDrag } from 'react-icons/tfi';
import { TfiLayoutSidebarNone } from 'react-icons/tfi';
import { Diagram } from '../../store/Diagram';

export const Tools = observer(() => {
  const d = Diagram.use();

  return (
    <div className="toolbar">
      <TfiHandDrag
        className={`tool ${d.eventsEnabled ? 'selected' : ''}`}
        onClick={() => {
          d.enableEvents();
        }}
      />
      <TfiLayoutSidebarNone
        className={`tool ${d.selector.selectionModeEnabled ? 'selected' : ''}`}
        onClick={() => {
          d.selector.enableSelectionMode();
        }}
      />
      <TfiRulerAlt
        className={`tool ${d.measurer.enabled ? 'selected' : ''}`}
        onClick={() => {
          d.measurer.enable();
        }}
      />
    </div>
  );
});
