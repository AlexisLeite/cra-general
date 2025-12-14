import { TfiRulerAlt } from 'react-icons/tfi';
import { Diagram } from '../../../store/Diagram';

export function RulerTool() {
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
}
