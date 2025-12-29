import { PiArrowArcLeftFill } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { History } from '../../../store/extensions/History';

export const UndoTool = observer(function SelectTool() {
  const d = Diagram.use();
  const history = d.getExtension(History);

  if (!history) {
    return null;
  }

  return (
    <PiArrowArcLeftFill
      className={`tool ${!history.hasPrevious ? 'disabled' : ''}`}
      onClick={() => {
        history.previous();
      }}
      title="Previous"
    />
  );
});
