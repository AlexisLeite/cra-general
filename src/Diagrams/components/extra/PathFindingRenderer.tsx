import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { PathFindingRenderer as ext } from '../../store/extensions/PathFindingRenderer';
import { makeScalableComponent } from '../objects/makeScalableComponent';
import { RenderEdge } from '../objects/RenderEdge';

export const PathFindingRenderer = makeScalableComponent(
  observer(() => {
    const d = Diagram.use();
    const r = d.getExtension(ext);

    if (!r?.enabled) {
      return null;
    }

    return (
      <>
        {r.grid?.edges.map((e) => {
          const { from: a, to: b } = e;
          const path = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;

          const highlighted = r.highlighted.has(e);

          return (
            <RenderEdge
              className={`path_finding_grid_edge ${highlighted ? 'highlighted' : ''}`}
              key={path}
              points={[a, b]}
              endType="none"
            />
          );
        })}
        {r.points?.length && (
          <RenderEdge
            className={`path_finding_grid_edge_chosen`}
            points={r.points}
          />
        )}
      </>
    );
  }),
);
