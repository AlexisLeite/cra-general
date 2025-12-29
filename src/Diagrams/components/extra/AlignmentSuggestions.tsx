import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { NodesAligner } from '../../store/extensions/NodesAligner';
import { Shape } from '../objects/Shape';
import { makeScalableComponent } from '../objects/makeScalableComponent';

export const AlignmentSuggestions = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const aligner = d.getExtension(NodesAligner);

    if (!aligner?.proposals.length) {
      return null;
    }

    return (
      <>
        {aligner!.proposals.map((c) => {
          const path =
            c.type === 'h'
              ? `M ${c.x} ${c.range[0]} V ${c.range[1]}`
              : `M ${c.range[0]} ${c.y} H ${c.range[1]}`;
          return (
            <Shape
              paths={[{ d: path, stroke: 'red', strokeWidth: 1 }]}
              key={path}
            />
          );
        })}
      </>
    );
  }),
);
