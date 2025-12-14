import { PiGridFourThin } from 'react-icons/pi';
import { Diagram } from '../../../store/Diagram';

export function ShowGridTool() {
  const d = Diagram.use();

  return (
    <PiGridFourThin
      className={`tool ${d.showGrid ? 'selected' : ''}`}
      onClick={() => d.toggleGrid()}
      title="Show grid"
    />
  );
}
