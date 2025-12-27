import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { Aligner } from '../../store/tools/Aligner';
import { Shape } from '../objects/Shape';
import { makeScalableComponent } from '../objects/makeScalableComponent';

export const AlignmentSuggestions = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const aligner = d.getExtension(Aligner);

    if (!aligner?.proposals.length) {
      return null;
    }

    return (
      <>
        {aligner!.proposals.map((c) => {
          const path =
            c.type === 'h'
              ? `M 0 ${c.y} V ${d.canvas.elementDimensions.width}`
              : `M 0 ${c.x} H ${d.canvas.elementDimensions.height}`;
          return (
            <Shape
              paths={[{ d: path, stroke: 'white', strokeWidth: 1 }]}
              key={path}
            />
          );
        })}
      </>
    );
  }),
);
