import { PiGridFourThin } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';

export const ShowGridTool = observer(function ShowGridTool() {
  const d = Diagram.use();

  return (
    <PiGridFourThin
      className={`tool ${d.showGrid ? 'selected' : ''}`}
      onClick={() => d.toggleGrid()}
      title="Show grid"
    />
  );
});
