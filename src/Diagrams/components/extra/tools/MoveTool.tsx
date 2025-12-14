import { TfiHandDrag } from 'react-icons/tfi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';

export const MoveTool = observer(function MoveTool() {
  const d = Diagram.use();

  return (
    <TfiHandDrag
      className={`tool ${d.eventsEnabled ? 'selected' : ''}`}
      onClick={() => {
        d.enableEvents();
      }}
      title="Move"
    />
  );
});
