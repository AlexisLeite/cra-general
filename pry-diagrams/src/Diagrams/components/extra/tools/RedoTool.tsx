import { PiArrowArcRightFill } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { History } from '../../../store/extensions/History';

export const RedoTool = observer(function SelectTool() {
  const d = Diagram.use();
  const history = d.getExtension(History);

  if (!history) {
    return null;
  }

  return (
    <PiArrowArcRightFill
      className={`tool ${!history.hasNext ? 'disabled' : ''}`}
      onClick={() => {
        history.redo();
      }}
      title="Previous"
    />
  );
});
