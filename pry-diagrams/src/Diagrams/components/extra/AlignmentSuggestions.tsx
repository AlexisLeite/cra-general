import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { NodesAligner } from '../../store/extensions/NodesAligner';
import { Shape } from '../objects/Shape';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { DistancesBalancer } from '../../store/extensions/DistancesBalancer';

export const AlignmentSuggestions = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const aligner = d.getExtension(NodesAligner);

    const balancer = d.getExtension(DistancesBalancer);

    return (
      <>
        {aligner?.proposals.map((c) => {
          const path =
            c.type === 'h'
              ? `M ${c.x} ${c.range[0]} V ${c.range[1]}`
              : `M ${c.range[0]} ${c.y} H ${c.range[1]}`;
          return (
            <Shape
              className="alignment_sugestion"
              paths={[{ d: path }]}
              key={c.id}
            />
          );
        })}
        {balancer?.proposals.map((c) => {
          const path = `M ${c.from.x} ${c.from.y} L ${c.to.x} ${c.to.y}`;

          return (
            <Shape
              className="distance_balance_sugestion"
              paths={[
                {
                  d: path,
                  arrow: {
                    position: 'both',
                    size: 8,
                  },
                },
              ]}
              key={path}
            />
          );
        })}
      </>
    );
  }),
);
