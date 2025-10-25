import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from '../objects/RenderEdge';

export const Measurement = observer(() => {
  const d = Diagram.use();

  if (!d.measurer.enabled) {
    return null;
  }

  return (
    <RenderEdge
      points={d.measurer.get()}
      startType="measure"
      endType="measure"
      width={2}
      arrowSize={12}
      lineStyle="dotted"
      startStroke="red"
      endStroke="red"
    />
  );
});
