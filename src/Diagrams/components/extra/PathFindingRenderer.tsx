import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { PathFindingRenderer as ext } from '../../store/extensions/PathFindingRenderer';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { Shape } from '../objects/Shape';
import { Cross } from '../objects/Cross';

export const PathFindingRenderer = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const r = d.getExtension(ext);

    if (!r?.enabled || !r?.grid) {
      return null;
    }

    return (
      <>
        {r.grid.edges.map((e) => {
          const { from: a, to: b } = e;
          const path = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

          const highlighted = r.highlighted.has(e);

          return (
            <Shape
              className={`path_finding_grid_edge ${highlighted ? 'highlighted' : ''}`}
              paths={[{ d: path }]}
              key={path}
            />
          );
        })}
        {r.point && <Cross stroke="red" size={20} coordinates={r.point} />}
      </>
    );
  }),
);
