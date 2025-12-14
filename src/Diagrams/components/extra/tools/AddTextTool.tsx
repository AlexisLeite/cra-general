import { IoText } from 'react-icons/io5';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';

export const AddTextTool = observer(function AddTextTool() {
  const d = Diagram.use();

  return (
    <IoText
      className={`tool ${d.creator.creationMode === 'text' ? 'selected' : ''}`}
      onClick={() => (d.creator.creationMode = 'text')}
      title="Add text"
    />
  );
});
