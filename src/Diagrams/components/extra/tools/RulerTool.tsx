import { TfiRulerAlt } from 'react-icons/tfi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';

export const RulerTool = observer(function RulerTool() {
  const d = Diagram.use();

  return (
    <TfiRulerAlt
      className={`tool ${d.measurer.enabled ? 'selected' : ''}`}
      onClick={() => {
        d.measurer.enable();
      }}
      title="Ruler"
    />
  );
});
