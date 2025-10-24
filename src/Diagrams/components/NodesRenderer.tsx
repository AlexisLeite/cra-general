import { observer } from 'mobx-react-lite';
import { Diagram, Edge } from '../store/Diagram';
import { RenderEdge } from './objects/RenderEdge';
import { Svg } from './extra/Svg';
import { Shape } from './objects/Shape';
import { getRectPath } from '../util/shapes';
import { Node } from '../store/Node';

const NodeShape = observer(({ node }: { node: Node }) => {
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
      points={[edge.state.from.box.rightMiddle, edge.state.to.box.leftMiddle]}
    />
  );
});

const Shapes = observer(() => {
  const d = Diagram.use();
  return (
    <>
      {d.nodes
        .map((c) =>
          d.selectedNodes.find((s) => s === c) ? null : (
            <NodeShape node={c} key={c.id} />
          ),
        )
        .filter(Boolean)}
      {d.selectedNodes.map((c) => (
        <NodeShape node={c} key={c.id} />
      ))}
      {d.edges.map((c) => (
        <DiagramEdge edge={c} key={`${c.state.from.id}__${c.state.to.id}`} />
      ))}
    </>
  );
});

export const NodesRenderer = observer(() => {
  const d = Diagram.use();
  return (
    <Svg ref={d.canvas.useRef}>
      <Shapes />
    </Svg>
  );
});
