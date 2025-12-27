import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from '../objects/RenderEdge';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { Measurer } from '../../store/tools/Measurer';

export const Measurement = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const measurer = d.getExtension(Measurer);

    if (!measurer?.enabled) {
      return null;
    }

    return (
      <>
        <RenderEdge
          points={measurer.get()!}
          startType="measure"
          endType="measure"
          width={2}
          arrowSize={12}
          lineStyle="dotted"
          startStroke="red"
          endStroke="red"
          className="measurement"
        />
      </>
    );
  }),
);
