import { observer } from 'mobx-react-lite';
import { Diagram } from '../../store/Diagram';
import { RenderEdge } from './RenderEdge';
import { Shape } from './Shape';
import { getRectPath } from '../../util/shapes';
import { Node } from '../../store/elements/Node';
import { Edge } from '../../store/elements/Edge';

const ShapeWrap = observer(({ node }: { node: Node }) => {
  return (
    <Shape
      key={node.id}
      paths={[
        {
          d: getRectPath(node.box, 10),
          strokeWidth: 3,
          fill: '#ffffff',
        },
      ]}
      className={`${node.selected ? 'selected' : ''} diagram__node`}
      label={node.state.label}
      labelOffset={node.coordinates.sum(node.box.size.half)}
      labelFontSize={14}
      ref={node.useRef.bind(node)}
      selected={node.selected}
      data-id={node.id}
    />
  );
});

const DiagramEdge = observer(({ edge }: { edge: Edge }) => {
  return (
    <RenderEdge
      points={edge.steps}
      endType={edge.arrowHeadEnd}
      startType={edge.arrowHeadStart}
      lineStyle={edge.lineStyle}
    />
  );
});

export const Shapes = observer(() => {
  const d = Diagram.use();
  return (
    <>
      {d.nodes
        .map((c) =>
          d.selectedNodes.find((s) => s === c) ? null : (
            <ShapeWrap node={c} key={c.id} />
          ),
        )
        .filter(Boolean)}
      {d.selectedNodes.map((c) => (
        <ShapeWrap node={c} key={c.id} />
      ))}
      {d.edges.map((c) => (
        <DiagramEdge edge={c} key={`${c.from.id}__${c.to.id}`} />
      ))}
    </>
  );
});
