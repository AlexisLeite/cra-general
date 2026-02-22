import { PiAlignCenterHorizontalLight } from 'react-icons/pi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { NodesAligner } from '../../../store/extensions/NodesAligner';

export const AlignNodesTool = observer(function AlignNodesTool() {
  const d = Diagram.use();
  const aligner = d.getExtension(NodesAligner);

  return (
    <PiAlignCenterHorizontalLight
      className={`tool ${aligner.enabled ? 'selected' : ''}`}
      onClick={() => aligner.toggle()}
      title="Show grid"
    />
  );
});
