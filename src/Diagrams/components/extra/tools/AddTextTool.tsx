import { IoText } from 'react-icons/io5';
import { Diagram } from '../../../store/Diagram';

export function AddTextTool() {
  const d = Diagram.use();

  return (
    <IoText
      className={`tool ${d.creator.creationMode === 'text' ? 'selected' : ''}`}
      onClick={() => (d.creator.creationMode = 'text')}
      title="Add text"
    />
  );
}
