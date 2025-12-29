import { IoText } from 'react-icons/io5';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { Creator } from '../../../store/extensions/Creator';

export const AddTextTool = observer(function AddTextTool() {
  const d = Diagram.use();
  const creator = d.getExtension(Creator);

  if (!creator) {
    return null;
  }

  return (
    <IoText
      className={`tool ${creator.creationMode === 'text' ? 'selected' : ''}`}
      onClick={(ev) => {
        ev.nativeEvent.stopImmediatePropagation();
        creator.creationMode = 'text';
      }}
      title="Add text"
    />
  );
});
