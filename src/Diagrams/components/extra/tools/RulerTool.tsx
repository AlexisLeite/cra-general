import { TfiRulerAlt } from 'react-icons/tfi';
import { observer } from 'mobx-react-lite';
import { Diagram } from '../../../store/Diagram';
import { Measurer } from '../../../store/extensions/Measurer';

export const RulerTool = observer(function RulerTool() {
  const d = Diagram.use();
  const measurer = d.getExtension(Measurer);

  if (!measurer) {
    return null;
  }

  return (
    <TfiRulerAlt
      className={`tool ${measurer.enabled ? 'selected' : ''}`}
      onClick={() => {
        measurer.toggle();
      }}
      title="Ruler"
    />
  );
});
