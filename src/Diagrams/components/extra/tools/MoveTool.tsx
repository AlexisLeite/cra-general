import { TfiHandDrag } from 'react-icons/tfi';
import { Diagram } from '../../../store/Diagram';

export function MoveTool() {
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
}
