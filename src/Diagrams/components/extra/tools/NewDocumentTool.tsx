import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { PiFile } from 'react-icons/pi';

export const NewDocumentTool = observer(function MoveTool() {
  const d = Diagram.use();

  return (
    <PiFile
      className={`tool`}
      onClick={() => {
        d.reset();
      }}
      title="Move"
    />
  );
});
